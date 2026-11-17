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

  const {
    config: draftConfig,
    isDraft,
    publishedUpdatedAt,
  } = await fetchDraftOrPublishedContent();

  return (
    <PreviewClient
      initialConfig={draftConfig}
      publishedUpdatedAt={publishedUpdatedAt}
      isDraft={isDraft}
      userEmail={auth.userEmail || "admin"}
    />
  );
}
