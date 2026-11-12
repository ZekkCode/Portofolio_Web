import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken } from "@/lib/auth-server";
import { PreviewClient } from "./preview-client";
import { getServiceRoleClient, getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { normalizeConfig, defaultSiteConfig, type SiteConfig } from "@/lib/site-config";

export const dynamic = "force-dynamic";

export default async function AdminPreviewPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("zekk_admin_session")?.value;

  if (!token) {
    redirect("/admin/login");
  }

  const verified = verifySessionToken(token);
  if (!verified.valid) {
    redirect("/admin/login");
  }

  // Ambil draf terbaru dari database
  let draftConfig: SiteConfig = defaultSiteConfig;
  if (isSupabaseConfigured()) {
    try {
      const supabase = getServiceRoleClient() || getSupabaseClient();
      if (supabase) {
        const { data: draftData } = await supabase
          .from("site_config")
          .select("config")
          .eq("id", "draft")
          .maybeSingle();

        if (draftData?.config) {
          draftConfig = normalizeConfig(draftData.config as Partial<SiteConfig>);
        } else {
          // Jika draf kosong, gunakan published config
          const { data: pubData } = await supabase
            .from("site_config")
            .select("config")
            .eq("id", "current")
            .maybeSingle();

          if (pubData?.config) {
            draftConfig = normalizeConfig(pubData.config as Partial<SiteConfig>);
          }
        }
      }
    } catch {
      // fallback
    }
  }

  return <PreviewClient initialConfig={draftConfig} userEmail={verified.email || "admin"} />;
}
