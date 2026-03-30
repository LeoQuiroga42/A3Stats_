import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const adminCookie = request.cookies.get('a3stats_session');
  const isAuthenticated = adminCookie?.value === 'true';

  // Protect sensitive routes
  if (
    request.nextUrl.pathname.startsWith('/sync') ||
    request.nextUrl.pathname.startsWith('/configuracion')
  ) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/sync/:path*', '/configuracion/:path*'],
};
