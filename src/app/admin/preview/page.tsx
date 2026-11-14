import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken } from "@/lib/auth-server";
import { PreviewClient } from "./preview-client";
import { fetchDraftOrPublishedContent } from "@/lib/content/public-content";

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

  const { config: draftConfig, updatedAt } = await fetchDraftOrPublishedContent();

  return (
    <PreviewClient
      initialConfig={draftConfig}
      initialUpdatedAt={updatedAt}
      userEmail={verified.email || "admin"}
    />
  );
}
