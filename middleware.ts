import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

function t(base: string): string {
  const prefix = process.env.NEXT_PUBLIC_DB_SCHEMA || "local";
  return `${prefix}__${base}`;
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const THIRTY_DAYS_S = 30 * 24 * 60 * 60;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/nominee/") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("session_token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: session } = await supabase
    .from(t("sessions"))
    .select("id, expires_at")
    .eq("token", token)
    .single();

  if (!session || new Date(session.expires_at) < new Date()) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("session_token");
    return response;
  }

  // Refresh the session when it's within 7 days of expiry
  const expiresAt = new Date(session.expires_at);
  const refreshThreshold = new Date(Date.now() + SEVEN_DAYS_MS);

  if (expiresAt < refreshThreshold) {
    const newExpiry = new Date(Date.now() + THIRTY_DAYS_MS);
    await supabase
      .from(t("sessions"))
      .update({ expires_at: newExpiry.toISOString() })
      .eq("id", session.id);

    const response = NextResponse.next();
    response.cookies.set("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: THIRTY_DAYS_S,
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
