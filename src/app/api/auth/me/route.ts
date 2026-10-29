import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth-server";

export async function GET(request: Request) {
  const auth = await verifyAdminRequest(request);

  if (!auth.isAuthenticated) {
    return NextResponse.json(
      { isAuthenticated: false, userEmail: null },
      { status: 401 }
    );
  }

  return NextResponse.json({
    isAuthenticated: true,
    userEmail: auth.userEmail,
    authMethod: auth.authMethod,
  });
}

