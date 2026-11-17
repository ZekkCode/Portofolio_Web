import { resolveSafeHostContext } from "@/lib/seo/allowed-hosts";

/**
 * Utilitas Integrasi IndexNow Protocol
 * Mendukung notifikasi perubahan URL instan ke mesin pencari yang kompatibel (Bing, Yandex, dll.)
 * Dokumentasi spesifikasi: https://www.indexnow.org/documentation
 */

export interface IndexNowPayload {
  host: string;
  key: string;
  keyLocation?: string;
  urlList: string[];
}

export interface IndexNowResult {
  success: boolean;
  status?: number;
  message?: string;
  error?: string;
}

export async function submitIndexNow(payload: IndexNowPayload): Promise<IndexNowResult> {
  const { host, key, urlList } = payload;
  if (!host || !key || !Array.isArray(urlList) || urlList.length === 0) {
    return { success: false, error: "Parameter IndexNow tidak lengkap" };
  }

  // Sanitasi key dan host
  const cleanKey = key.trim();
  const cleanHost = host.trim().replace(/^https?:\/\//i, "").split("/")[0];
  const keyLocation = payload.keyLocation || `https://${cleanHost}/${cleanKey}.txt`;

  const body = {
    host: cleanHost,
    key: cleanKey,
    keyLocation,
    urlList: urlList.map((u) => (u.startsWith("http") ? u : `https://${cleanHost}${u.startsWith("/") ? u : `/${u}`}`)),
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6 detik timeout

    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "User-Agent": "ZakariaMP-Portfolio-IndexNow/1.0",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // IndexNow merespons 200 (OK) atau 202 (Accepted) jika sukses
    if (res.status === 200 || res.status === 202) {
      return {
        success: true,
        status: res.status,
        message: `IndexNow berhasil diserahkan ke api.indexnow.org (${res.status})`,
      };
    }

    const text = await res.text().catch(() => "");
    return {
      success: false,
      status: res.status,
      error: `IndexNow API menolak dengan status ${res.status}: ${text || "Permintaan tidak diterima"}`,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `IndexNow request gagal: ${message}`,
    };
  }
}

/**
 * Trigger IndexNow submission secara aman dan non-blocking
 */
export async function triggerIndexNowIfConfigured(
  indexNowKey: string | undefined,
  canonicalUrl: string | undefined,
  urls: string[] = ["/"]
): Promise<IndexNowResult | null> {
  const cleanKey = indexNowKey?.trim();
  if (!cleanKey || cleanKey.length < 8) {
    return null;
  }

  try {
    const safeOrigin = resolveSafeHostContext("", canonicalUrl || "https://www.zakariamp.id").siteUrl;
    const host = safeOrigin.replace(/^https?:\/\//i, "").split("/")[0];
    const fullUrls = urls.map((path) => (path.startsWith("http") ? path : `${safeOrigin}${path.startsWith("/") ? path : `/${path}`}`));

    // Jalankan pengiriman
    const result = await submitIndexNow({
      host,
      key: cleanKey,
      urlList: fullUrls,
    });

    return result;
  } catch {
    return null;
  }
}
