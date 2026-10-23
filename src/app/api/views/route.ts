import { NextResponse } from "next/server";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

interface ViewsData {
  count: number;
  lastUpdated: string;
}

const DATA_FILE = join(process.cwd(), ".views.json");
const INITIAL_SEED = 1420; // Base portfolio views count

let cachedCount: number | null = null;
const visitedIps = new Map<string, number>();

function getStoredViews(): number {
  if (cachedCount !== null) return cachedCount;
  try {
    if (existsSync(DATA_FILE)) {
      const raw = readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(raw) as Partial<ViewsData>;
      cachedCount = typeof parsed.count === "number" ? parsed.count : INITIAL_SEED;
      return cachedCount;
    }
  } catch {
    // fallback
  }
  cachedCount = INITIAL_SEED;
  return cachedCount;
}

function saveViews(count: number) {
  cachedCount = count;
  try {
    const payload: ViewsData = {
      count,
      lastUpdated: new Date().toISOString(),
    };
    writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2), "utf-8");
  } catch {
    // read-only file systems (e.g. serverless edge) keep cachedCount in memory
  }
}

export async function GET() {
  const count = getStoredViews();
  return NextResponse.json(
    { views: count },
    {
      headers: {
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=59",
      },
    }
  );
}

export async function POST(request: Request) {
  let count = getStoredViews();
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "anonymous";
  const now = Date.now();

  // Deduplication: allow 1 view count per IP every 15 minutes
  const lastVisit = visitedIps.get(ip) ?? 0;
  if (now - lastVisit > 15 * 60 * 1000) {
    count += 1;
    visitedIps.set(ip, now);
    saveViews(count);

    // Garbage collect visited IPs older than 1 hour to prevent memory leaks
    if (visitedIps.size > 1000) {
      for (const [key, timestamp] of visitedIps.entries()) {
        if (now - timestamp > 60 * 60 * 1000) {
          visitedIps.delete(key);
        }
      }
    }
  }

  return NextResponse.json(
    { views: count },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
