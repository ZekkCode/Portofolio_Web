import { promises as fs } from "node:fs";
import path from "node:path";

export interface LocalCmsDoc<T = unknown> {
  id: string;
  config: T;
  updated_at: string;
}

export type LocalCmsReadResult<T = unknown> =
  | { status: "ok"; doc: LocalCmsDoc<T> }
  | { status: "missing" }
  | { status: "error"; error: string };

const STORE_DIR = path.join(process.cwd(), ".local-cms-store");

function safeDocPath(id: string): string {
  const sanitized = id.replace(/[^a-zA-Z0-9_-]/g, "_");
  return path.join(STORE_DIR, `${sanitized}.json`);
}

export function isStrictLocalCmsStore(): boolean {
  return process.env.LOCAL_CMS_STORE === "1" && !process.env.VERCEL;
}

export function isLocalCmsOverrideAllowed(): boolean {
  return process.env.LOCAL_CMS_STORE === "1" || !process.env.VERCEL;
}

export async function readLocalCmsDocDetailed<T = unknown>(
  id: string
): Promise<LocalCmsReadResult<T>> {
  if (!isLocalCmsOverrideAllowed()) {
    return { status: "error", error: "Local CMS store dinonaktifkan di runtime produksi." };
  }
  const targetPath = safeDocPath(id);
  let raw: string;
  try {
    raw = await fs.readFile(targetPath, "utf8");
  } catch (err) {
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code === "ENOENT") {
      return { status: "missing" };
    }
    return {
      status: "error",
      error: `Gagal membaca berkas lokal (${code || "IO_ERROR"}).`,
    };
  }

  try {
    const parsed = JSON.parse(raw) as LocalCmsDoc<T>;
    if (!parsed || typeof parsed !== "object" || !("config" in parsed)) {
      return { status: "error", error: `Format berkas lokal '${id}' tidak valid.` };
    }
    return { status: "ok", doc: parsed };
  } catch {
    return { status: "error", error: `JSON pada berkas lokal '${id}' rusak atau tidak dapat diparse.` };
  }
}

export async function readLocalCmsDoc<T = unknown>(
  id: string
): Promise<LocalCmsDoc<T> | null> {
  const res = await readLocalCmsDocDetailed<T>(id);
  return res.status === "ok" ? res.doc : null;
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
