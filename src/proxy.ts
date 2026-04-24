import { NextRequest, NextResponse } from 'next/server';
import { authConfig } from '@/auth/config';
import NextAuth from 'next-auth';
import type { Session } from 'next-auth';
import {
  DEFAULT_LOGIN_REDIRECT,
  AUTH_ROUTES,
  apiAuthPrefix,
  authRoutes,
  publicRoutes,
  publicRoutePrefixes,
} from '@/routes';

// -- Types ------------------------------------------------------------------

type AuthenticatedRequest = NextRequest & {
  auth: Session | null;
};

// -- NextAuth Initialization ------------------------------------------------

export const { auth } = NextAuth(authConfig);

// -- Proxy Handler ----------------------------------------------------------

export default auth(async (req: AuthenticatedRequest) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  // TODO: Implement rate limiting
  // Options:
  // 1. Upstash Redis (recommended for production) - edge-compatible, distributed
  // 2. Vercel KV - if deploying on Vercel platform
  // 3. Custom in-memory solution - for development only, not distributed

  // -- 1. Early Exit: API & System Routes ------------------------------------

  // Allow NextAuth API routes
  if (pathname.startsWith(apiAuthPrefix)) {
    return NextResponse.next();
  }

  // Allow Inngest webhook routes
  if (pathname.startsWith('/api/inngest')) {
    return NextResponse.next();
  }

  // -- 2. Authentication State -----------------------------------------------

  const isLoggedIn = Boolean(req.auth);

  // -- 3. Route Classification -----------------------------------------------

  const isAuthRoute = authRoutes.includes(pathname);
  const isPublicRoute =
    publicRoutes.includes(pathname) ||
    publicRoutePrefixes.some((prefix) => pathname.startsWith(prefix));

  // -- 4. Auth Route Logic ---------------------------------------------------

  if (isAuthRoute) {
    // Redirect logged-in users away from signin/signup pages
    if (isLoggedIn) {
      return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    }
    // Allow unauthenticated access to auth routes
    return NextResponse.next();
  }

  // -- 5. Protected Route Logic ----------------------------------------------

  if (!isLoggedIn && !isPublicRoute) {
    // Build callback URL with query params
    const callbackUrl = nextUrl.search ? `${pathname}${nextUrl.search}` : pathname;

    const signinUrl = new URL(AUTH_ROUTES.SIGN_IN, nextUrl);
    signinUrl.searchParams.set('callbackUrl', callbackUrl);

    return NextResponse.redirect(signinUrl);
  }

  // -- 6. Admin Route Guard --------------------------------------------------

  if (pathname.startsWith('/admin')) {
    if (!req.auth?.user || req.auth.user.role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/overview', nextUrl));
    }
  }

  // -- 7. Root Redirect ------------------------------------------------------

  if (pathname === '/') {
    return NextResponse.redirect(new URL('/overview', nextUrl));
  }

  // -- 8. Continue to Route --------------------------------------------------

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
