// apps/web/proxy.ts
// Edge auth guard — runs before every matching request.
// Next.js 16 uses proxy.ts instead of middleware.ts.
// Verifies JWT from HttpOnly cookie when JWT_SECRET is available;
// falls back to cookie-existence check when not configured.
// Client-side layout handles role-based routing and full auth verification.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET_RAW = process.env.JWT_SECRET;

interface JwtPayload {
  id: string;
  name: string;
  email: string;
  role: string;
}

async function verifyToken(token: string): Promise<JwtPayload | null> {
  if (!JWT_SECRET_RAW) return null;
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(JWT_SECRET_RAW),
    );
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get("token")?.value;
  const payload = token ? await verifyToken(token) : null;

  // JWT_SECRET configured ⇒ use verified payload for auth + role
  // JWT_SECRET missing    ⇒ fall back to cookie existence for auth only
  const isAuthenticated = JWT_SECRET_RAW ? !!payload : !!token;
  const role = payload?.role;

  // Allow public routes through
  if (
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/proposal/") ||
    pathname.startsWith("/contract/")
  ) {
    // If authenticated, redirect away from login/signup to role home
    if (isAuthenticated && (pathname.startsWith("/login") || pathname.startsWith("/signup"))) {
      const home = role === "CLIENT" ? "/portal" : "/dashboard";
      return NextResponse.redirect(new URL(home, request.url));
    }
    return NextResponse.next();
  }

  // Protected routes — redirect to login if not authenticated
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/portal")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Role-based redirect at edge when JWT_SECRET is set
    if (JWT_SECRET_RAW && role) {
      if (pathname.startsWith("/dashboard") && role === "CLIENT") {
        return NextResponse.redirect(new URL("/portal", request.url));
      }
      if (pathname.startsWith("/portal") && role !== "CLIENT") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/portal/:path*", "/login", "/signup"],
};