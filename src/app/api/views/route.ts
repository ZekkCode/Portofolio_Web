import { NextResponse } from "next/server";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import crypto from "node:crypto";
import { getServiceRoleClient, getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { checkRateLimit, extractTrustedClientIp, verifyCsrfOrigin } from "@/lib/auth-server";
import { fetchPublishedContent } from "@/lib/content/public-content";

interface ViewsData {
  count: number;
  lastUpdated: string;
  history?: Record<string, number>;
}

const DATA_FILE = join(process.cwd(), ".views.json");
const INITIAL_SEED = 1420;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const MAX_MEMORY_VISITS = 5000;

const isVerifiedSource = Boolean(process.env.VERIFIED_PAGE_VIEWS === "true");

let cachedCount: number | null = null;
const memoryVisits = new Map<string, number>();

function extractClientInfo(request: Request): { ip: string; userAgent: string; hash: string } {
  const ip = extractTrustedClientIp(request);
  const userAgent = (request.headers.get("user-agent") || "unknown-agent").trim().slice(0, 256);

  const hash = crypto
    .createHash("sha256")
    .update(`${ip}::${userAgent}`)
    .digest("hex");

  return { ip, userAgent, hash };
}

async function getStoredViews(): Promise<{ count: number; isVerified: boolean }> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = getServiceRoleClient() || getSupabaseClient();
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
          const service = getServiceRoleClient();
          if (service) {
            const { data: seededCount } = await service.rpc("increment_page_view", {
              page_id: "portfolio",
              default_seed: INITIAL_SEED - 1,
            });
            if (typeof seededCount === "number") {
              cachedCount = Number(seededCount);
              return { count: cachedCount, isVerified: isVerifiedSource };
            }
          }
          cachedCount = INITIAL_SEED;
          return { count: INITIAL_SEED, isVerified: isVerifiedSource };
        }
      }
    } catch {
      // Fallback ke cache memori / berkas lokal tanpa mereset counter cloud
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

function saveLocalViewsOnly(count: number, newVisitKey?: string, timestamp?: number) {
  cachedCount = count;

  if (process.env.VERCEL) {
    return;
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
    // Read-only filesystem retains cachedCount in memory
  }
}

function pruneMemoryVisits(now: number) {
  if (memoryVisits.size <= 1500) return;

  for (const [key, timestamp] of memoryVisits.entries()) {
    if (now - timestamp > TWENTY_FOUR_HOURS_MS) {
      memoryVisits.delete(key);
    }
  }

  while (memoryVisits.size >= MAX_MEMORY_VISITS) {
    const oldest = memoryVisits.keys().next().value;
    if (oldest === undefined) break;
    memoryVisits.delete(oldest);
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
  if (!verifyCsrfOrigin(request)) {
    return NextResponse.json(
      { error: "Permintaan lintas domain tidak diizinkan." },
      { status: 403, headers: { "Cache-Control": "no-store" } }
    );
  }

  const { ip, hash: visitorHash } = extractClientInfo(request);

  const rateLimit = checkRateLimit(`views:${ip}`, { maxRequests: 20, windowMs: 60 * 1000 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan. Silakan coba lagi nanti." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  let projectId = "portfolio";
  try {
    const body = (await request.json()) as { project_id?: string };
    if (body?.project_id && typeof body.project_id === "string") {
      const candidate = body.project_id.trim().slice(0, 64);
      if (/^[a-zA-Z0-9_-]{1,64}$/.test(candidate) && candidate !== "portfolio") {
        const config = await fetchPublishedContent();
        const isValidPublishedProject = (config.projects || []).some(
          (p) =>
            p.published !== false &&
            p.visible !== false &&
            (p.id === candidate || p.slug === candidate)
        );
        if (isValidPublishedProject) {
          projectId = candidate;
        }
      }
    }
  } catch {
    // Body kosong atau format bukan JSON -> default 'portfolio'
  }

  const now = Date.now();
  const visitKey = `${projectId}:${visitorHash}`;

  // 1. Jalur Atomik Supabase via `service_role` (kebal race condition & anti reset counter)
  if (isSupabaseConfigured()) {
    const serviceSupabase = getServiceRoleClient();
    if (serviceSupabase) {
      try {
        const cutoff = new Date(now - TWENTY_FOUR_HOURS_MS).toISOString();
        const { data: existing, error } = await serviceSupabase
          .from("project_views")
          .select("id")
          .eq("project_id", projectId)
          .eq("visitor_hash", visitorHash)
          .gte("created_at", cutoff)
          .limit(1)
          .maybeSingle();

        if (!error && existing) {
          const current = await getStoredViews();
          return NextResponse.json(
            {
              views: current.count,
              recorded: false,
              reason: "cooldown_24h",
              isVerified: isVerifiedSource,
            },
            { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
          );
        }

        await serviceSupabase.from("project_views").insert({
          project_id: projectId,
          visitor_hash: visitorHash,
          created_at: new Date(now).toISOString(),
        });

        // Hanya increment counter halaman global untuk kunjungan 'portfolio'
        if (projectId === "portfolio") {
          const { data: newCount, error: rpcErr } = await serviceSupabase.rpc(
            "increment_page_view",
            {
              page_id: "portfolio",
              default_seed: INITIAL_SEED,
            }
          );

          if (!rpcErr && typeof newCount === "number") {
            cachedCount = Number(newCount);
            return NextResponse.json(
              { views: cachedCount, recorded: true, isVerified: isVerifiedSource },
              { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
            );
          }
        } else {
          const current = await getStoredViews();
          return NextResponse.json(
            { views: current.count, recorded: true, isVerified: isVerifiedSource },
            { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
          );
        }
      } catch {
        // Fallback aman ke memori / berkas lokal di bawah tanpa menyentuh tabel page_views cloud
      }
    }
  }

  // 2. Fallback mode lokal: pengecekan memori dan berkas `.views.json`
  const stored = await getStoredViews();
  let count = stored.count;
  let lastVisit = memoryVisits.get(visitKey);

  if (!lastVisit && !process.env.VERCEL && existsSync(DATA_FILE)) {
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

  if (projectId === "portfolio") {
    count += 1;
  }
  memoryVisits.set(visitKey, now);
  pruneMemoryVisits(now);
  saveLocalViewsOnly(count, visitKey, now);

  return NextResponse.json(
    { views: count, recorded: true, isVerified: false },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
