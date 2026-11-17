import { redirect } from "next/navigation";
import { verifyAdminRequest } from "@/lib/auth-server";
import { PreviewClient } from "./preview-client";
import { fetchDraftOrPublishedContent } from "@/lib/content/public-content";

export const dynamic = "force-dynamic";

export default async function AdminPreviewPage() {
  const auth = await verifyAdminRequest();

  if (!auth.isAuthenticated) {
    redirect("/admin/login");
  }

  const { config: draftConfig, updatedAt } = await fetchDraftOrPublishedContent();

  return (
    <PreviewClient
      initialConfig={draftConfig}
      initialUpdatedAt={updatedAt}
      userEmail={auth.userEmail || "admin"}
    />
  );
}
