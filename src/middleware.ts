import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect all /admin routes except /admin/login
  if (pathname.startsWith('/admin')) {
    const sessionCookie = request.cookies.get('chocomino_admin_session')?.value;

    // Response with strict noindex for admin security
    const response = NextResponse.next();
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');

    if (pathname === '/admin/login') {
      // If already logged in, redirect to /admin/orders
      if (sessionCookie) {
        return NextResponse.redirect(new URL('/admin/orders', request.url));
      }
      return response;
    }

    // Any other /admin route requires session cookie
    if (!sessionCookie) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
