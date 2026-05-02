// apps/web/proxy.ts
// Edge auth guard — runs before every matching request.
// Next.js 16 uses proxy.ts instead of middleware.ts.
// Reads JWT from HttpOnly cookie, verifies signature, redirects unauthenticated users.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "default_secret",
);

interface JwtPayload {
  id: string;
  name: string;
  email: string;
  role: string;
}

async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get("token")?.value;
  const payload = token ? await verifyToken(token) : null;
  const isAuthenticated = !!payload;

  // Allow public routes through
  if (
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/proposal/") ||
    pathname.startsWith("/contract/")
  ) {
    // If already authenticated on login/signup, redirect to role home
    if (isAuthenticated && (pathname.startsWith("/login") || pathname.startsWith("/signup"))) {
      const home = payload!.role === "CLIENT" ? "/portal" : "/dashboard";
      return NextResponse.redirect(new URL(home, request.url));
    }
    return NextResponse.next();
  }

  // Protected routes
  if (pathname.startsWith("/dashboard")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (payload!.role === "CLIENT") {
      return NextResponse.redirect(new URL("/portal", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/portal")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (payload!.role !== "CLIENT") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/portal/:path*", "/login", "/signup"],
};