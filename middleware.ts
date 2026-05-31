import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const PROTECTED = ["/dashboard", "/api/leads", "/api/messages", "/api/campaigns", "/api/content", "/api/integrations", "/api/analytics", "/api/outreach", "/api/ai", "/api/notifications", "/api/scheduler"];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Security headers
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-XSS-Protection", "1; mode=block");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (process.env.NODE_ENV === "production") {
    res.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }

  // Auth protection
  const pathname = req.nextUrl.pathname;
  const needsAuth = PROTECTED.some(p => pathname.startsWith(p));
  if (needsAuth) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token && !pathname.startsWith("/api/")) {
      return NextResponse.redirect(new URL("/auth/signin", req.url));
    }
    if (!token && pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return res;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth|api/health).*)"] };
