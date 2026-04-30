import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Note: Simple check for token existence. Token validation occurs on the NestJS backend API.
export default function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  // Protected route prefixes
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard');
  const isPortalRoute = request.nextUrl.pathname.startsWith('/portal');

  if ((isDashboardRoute || isPortalRoute) && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If going to login but already authenticated, we should probably redirect to dashboard but wait, 
  // we might not know their role here. We will let the client components manage redirecting from /login if already authed.

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/portal/:path*', '/login'],
}
