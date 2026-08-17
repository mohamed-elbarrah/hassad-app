import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function isProtectedPath(pathname: string): boolean {
  return pathname === "/forbidden" || pathname.startsWith("/admin");
}

export function proxy(request: NextRequest) {
  if (!isProtectedPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const hasAccessCookie =
    request.cookies.has("token") || request.cookies.has("refreshToken");

  if (hasAccessCookie) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  const nextValue = `${request.nextUrl.pathname}${request.nextUrl.search}`;

  loginUrl.searchParams.set("next", nextValue);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/forbidden"],
};
