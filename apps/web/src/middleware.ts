import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE, isSessionTokenValid } from '@/lib/session';

/** Paths reachable without a session. */
const PUBLIC_PATHS = new Set(['/login']);

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const authenticated = await isSessionTokenValid(token);

  if (PUBLIC_PATHS.has(pathname)) {
    if (authenticated) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  if (!authenticated) {
    const loginUrl = new URL('/login', request.url);
    // Preserve where the user was headed so login can bounce them back.
    if (pathname !== '/') loginUrl.searchParams.set('next', pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Everything except Next internals, static assets, and the favicon.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|ico)$).*)',
  ],
};
