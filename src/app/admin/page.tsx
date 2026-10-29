import { redirect } from "next/navigation";
import { verifyAdminRequest } from "@/lib/auth-server";
import AdminClient from "./admin-client";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const auth = await verifyAdminRequest();

  if (!auth.isAuthenticated) {
    redirect("/admin/login");
  }

  return <AdminClient userEmail={auth.userEmail} />;
}
