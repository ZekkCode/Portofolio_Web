import { promises as fs } from "node:fs";
import path from "node:path";

export interface LocalCmsDoc<T = unknown> {
  id: string;
  config: T;
  updated_at: string;
}

const STORE_DIR = path.join(process.cwd(), ".local-cms-store");

function safeDocPath(id: string): string {
  const sanitized = id.replace(/[^a-zA-Z0-9_-]/g, "_");
  return path.join(STORE_DIR, `${sanitized}.json`);
}

export function isLocalCmsOverrideAllowed(): boolean {
  return process.env.LOCAL_CMS_STORE === "1" || !process.env.VERCEL;
}

export async function readLocalCmsDoc<T = unknown>(
  id: string
): Promise<LocalCmsDoc<T> | null> {
  if (!isLocalCmsOverrideAllowed()) return null;
  try {
    const raw = await fs.readFile(safeDocPath(id), "utf8");
    const parsed = JSON.parse(raw) as LocalCmsDoc<T>;
    if (!parsed || typeof parsed !== "object" || !("config" in parsed)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function writeLocalCmsDoc<T = unknown>(
  id: string,
  config: T
): Promise<LocalCmsDoc<T>> {
  if (!isLocalCmsOverrideAllowed()) {
    throw new Error("Local CMS store disabled in Vercel production runtime.");
  }
  await fs.mkdir(STORE_DIR, { recursive: true });
  const doc: LocalCmsDoc<T> = {
    id,
    config,
    updated_at: new Date().toISOString(),
  };
  await fs.writeFile(safeDocPath(id), JSON.stringify(doc, null, 2), "utf8");
  return doc;
}

export async function deleteLocalCmsDoc(id: string): Promise<boolean> {
  if (!isLocalCmsOverrideAllowed()) return false;
  try {
    await fs.unlink(safeDocPath(id));
    return true;
  } catch {
    return false;
  }
}
