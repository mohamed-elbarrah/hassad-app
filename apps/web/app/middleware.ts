import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const { pathname } = request.nextUrl

  // Protected routes check
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/portal')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Redirect from auth pages if logged in
  if (pathname.startsWith('/login')) {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/portal/:path*', '/login'],
}
