import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { expiredAdminSessionCookieHeaders } from "@/lib/admin-auth";
import { requestAppUrl } from "@/lib/app-url";

function logout(request: NextRequest) {
  revalidatePath("/admin");
  revalidatePath("/admin/login");

  const response = NextResponse.redirect(requestAppUrl(request, "/admin/login"), {
    status: 303,
  });

  for (const cookie of expiredAdminSessionCookieHeaders()) {
    response.headers.append("Set-Cookie", cookie);
  }

  return response;
}

export function GET(request: NextRequest) {
  return logout(request);
}

export function POST(request: NextRequest) {
  return logout(request);
}
