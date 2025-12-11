// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { authConfig } from '@/auth/config'; // Your NextAuth config
import NextAuth from 'next-auth';
import type { Session } from 'next-auth'; // Import Session type if needed, or use `any`

import { DEFAULT_LOGIN_REDIRECT, apiAuthPrefix, authRoutes, publicRoutes } from '@/routes'; // Your route definitions

// Import the rate limiting function
// import { checkRequestRateLimit } from '@/lib/rate-limiter'; // Adjust path if your file is elsewhere

// Initialize NextAuth.js
export const { auth } = NextAuth(authConfig);

export default auth(async (req: NextRequest & { auth: Session | null | undefined | any }) => {
  const { nextUrl } = req;

  // --- 1. Rate Limiting ---
  // Apply rate limiting to requests not targeting NextAuth's own API routes.
  // You can customize this condition further if needed.
  // if (!nextUrl.pathname.startsWith(apiAuthPrefix)) {
  //   const rateLimitResponse = await checkRequestRateLimit(req);
  //   if (rateLimitResponse) {
  //     // If rateLimitResponse is not null, it means the request is rate-limited.
  //     // Return the 429 response immediately.
  //     return rateLimitResponse;
  //   }
  // }

  // --- 2. Authentication and Authorization Logic (Your Existing Logic) ---
  const isLoggedIn = !!req.auth;

  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  const isTestS3ApiRoute = nextUrl.pathname.startsWith('/api/test-s3');
  const isCronRoute = nextUrl.pathname.startsWith('/api/cron');
  const isBackgroundRoute = nextUrl.pathname.startsWith('/api/background');
  const isInngestRoute = nextUrl.pathname.startsWith('/api/inngest');
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);

  if (isApiAuthRoute || isTestS3ApiRoute || isCronRoute || isBackgroundRoute || isInngestRoute) {
    return;
  }

  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    }
    return;
  }

  if (!isLoggedIn && !isPublicRoute) {
    let callbackUrl = nextUrl.pathname;
    if (nextUrl.search) {
      callbackUrl += nextUrl.search;
    }
    const encodedCallbackUrl = encodeURIComponent(callbackUrl);
    return NextResponse.redirect(new URL(`/signin?callbackUrl=${encodedCallbackUrl}`, nextUrl));
  }

  // ✅ Redirect /dashboard to /dashboard/overview
  if (nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/overview', nextUrl));
  }

  return;
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};