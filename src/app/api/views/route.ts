import { NextResponse } from "next/server";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import crypto from "node:crypto";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

interface ViewsData {
  count: number;
  lastUpdated: string;
  history?: Record<string, number>;
}

const DATA_FILE = join(process.cwd(), ".views.json");
const INITIAL_SEED = 1420; // Nilai dasar seed tidak terverifikasi
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

// Counter dianggap terverifikasi hanya jika dikonfigurasi melalui sumber analitik otentik
const isVerifiedSource = Boolean(process.env.VERIFIED_PAGE_VIEWS === "true");

let cachedCount: number | null = null;
const memoryVisits = new Map<string, number>();

function extractClientInfo(request: Request): { ip: string; userAgent: string; hash: string } {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfIp = request.headers.get("cf-connecting-ip");
  const ip = (cfIp || realIp || (forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1")).trim();
  const userAgent = (request.headers.get("user-agent") || "unknown-agent").trim();

  const hash = crypto
    .createHash("sha256")
    .update(`${ip}::${userAgent}`)
    .digest("hex");

  return { ip, userAgent, hash };
}

async function getStoredViews(): Promise<{ count: number; isVerified: boolean }> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase
          .from("page_views")
          .select("count")
          .eq("id", "portfolio")
          .maybeSingle();

        if (!error && data && typeof data.count === "number") {
          cachedCount = Number(data.count);
          return { count: cachedCount, isVerified: isVerifiedSource };
        }

        if (!error && !data) {
          await supabase.from("page_views").insert({
            id: "portfolio",
            count: INITIAL_SEED,
            updated_at: new Date().toISOString(),
          });
          cachedCount = INITIAL_SEED;
          return { count: INITIAL_SEED, isVerified: isVerifiedSource };
        }
      }
    } catch {
      // Fallback lokal jika jaringan ke Supabase bermasalah
    }
  }

  if (cachedCount !== null) return { count: cachedCount, isVerified: false };

  try {
    if (existsSync(DATA_FILE)) {
      const raw = readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(raw) as Partial<ViewsData>;
      cachedCount = typeof parsed.count === "number" ? parsed.count : INITIAL_SEED;
      return { count: cachedCount, isVerified: false };
    }
  } catch {
    // fallback
  }

  cachedCount = INITIAL_SEED;
  return { count: cachedCount, isVerified: false };
}

async function saveViews(count: number, newVisitKey?: string, timestamp?: number) {
  cachedCount = count;

  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.from("page_views").upsert(
          {
            id: "portfolio",
            count,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );
      }
    } catch {
      // silent fallback
    }
  }

  try {
    let history: Record<string, number> = {};
    if (existsSync(DATA_FILE)) {
      try {
        const current = JSON.parse(readFileSync(DATA_FILE, "utf-8")) as ViewsData;
        history = current.history || {};
      } catch {
        history = {};
      }
    }

    if (newVisitKey && timestamp) {
      history[newVisitKey] = timestamp;
    }

    // Prune history > 48 jam untuk menjaga ukuran berkas
    const pruneThreshold = Date.now() - 48 * 60 * 60 * 1000;
    for (const [key, time] of Object.entries(history)) {
      if (time < pruneThreshold) {
        delete history[key];
      }
    }

    const payload: ViewsData = {
      count,
      lastUpdated: new Date().toISOString(),
      history,
    };
    writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2), "utf-8");
  } catch {
    // Read-only serverless edge runtime retains cachedCount in memory
  }
}

export async function GET() {
  const { count, isVerified } = await getStoredViews();
  return NextResponse.json(
    { views: count, isVerified },
    {
      headers: {
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=59",
      },
    }
  );
}

export async function POST(request: Request) {
  let projectId = "portfolio";
  try {
    const body = (await request.json()) as { project_id?: string };
    if (body?.project_id && typeof body.project_id === "string") {
      projectId = body.project_id.slice(0, 64);
    }
  } catch {
    // Body kosong atau format bukan JSON
  }

  const { hash: visitorHash } = extractClientInfo(request);
  const now = Date.now();
  const visitKey = `${projectId}:${visitorHash}`;
  const stored = await getStoredViews();
  let count = stored.count;

  // 1. Cek di Supabase jika terhubung
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        const cutoff = new Date(now - TWENTY_FOUR_HOURS_MS).toISOString();
        const { data: existing, error } = await supabase
          .from("project_views")
          .select("id")
          .eq("project_id", projectId)
          .eq("visitor_hash", visitorHash)
          .gte("created_at", cutoff)
          .limit(1)
          .maybeSingle();

        if (!error && existing) {
          // Pengunjung yang sama dalam 24 jam terakhir -> Abaikan (tidak menambah count)
          return NextResponse.json(
            { views: count, recorded: false, reason: "cooldown_24h", isVerified: isVerifiedSource },
            { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
          );
        }

        // Simpan log kunjungan valid baru ke Supabase
        await supabase.from("project_views").insert({
          project_id: projectId,
          visitor_hash: visitorHash,
          created_at: new Date(now).toISOString(),
        });

        count += 1;
        await saveViews(count, visitKey, now);

        return NextResponse.json(
          { views: count, recorded: true, isVerified: isVerifiedSource },
          { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
        );
      }
    } catch {
      // Graceful fallback ke pengecekan lokal
    }
  }

  // 2. Fallback mode: pengecekan memori dan berkas lokal
  let lastVisit = memoryVisits.get(visitKey);
  if (!lastVisit && existsSync(DATA_FILE)) {
    try {
      const storedData = JSON.parse(readFileSync(DATA_FILE, "utf-8")) as ViewsData;
      if (storedData.history && storedData.history[visitKey]) {
        lastVisit = storedData.history[visitKey];
        memoryVisits.set(visitKey, lastVisit);
      }
    } catch {
      // ignore
    }
  }

  if (lastVisit && now - lastVisit < TWENTY_FOUR_HOURS_MS) {
    return NextResponse.json(
      { views: count, recorded: false, reason: "cooldown_24h", isVerified: false },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  }

  // Catat kunjungan valid baru
  count += 1;
  memoryVisits.set(visitKey, now);
  await saveViews(count, visitKey, now);

  // Bersihkan memoryVisits tua (> 24 jam)
  if (memoryVisits.size > 2000) {
    for (const [key, timestamp] of memoryVisits.entries()) {
      if (now - timestamp > TWENTY_FOUR_HOURS_MS) {
        memoryVisits.delete(key);
      }
    }
  }

  return NextResponse.json(
    { views: count, recorded: true, isVerified: false },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
