import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

// Create the internationalization middleware
const intlMiddleware = createIntlMiddleware(routing);

// Public paths that don't require authentication
const publicPaths = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/terms',
  '/privacy',
  '/contact',
];

// Paths that should use i18n (customer-facing)
const i18nPaths = ['/en', '/es'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the path starts with a locale
  const startsWithLocale = i18nPaths.some((locale) =>
    pathname.startsWith(locale)
  );

  // Apply i18n middleware for localized paths
  if (startsWithLocale) {
    return intlMiddleware(request);
  }

  // For API routes, let them pass through
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // For static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // For auth pages, allow access
  if (
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/forgot-password'
  ) {
    return NextResponse.next();
  }

  // For other paths, just let them through
  // The actual auth check will be done on the client side
  // using the AuthContext
  return NextResponse.next();
}

export const config = {
  // Match all paths except static files and API routes
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
