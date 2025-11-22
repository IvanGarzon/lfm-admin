// src/lib/rate-limiter.ts
// import { NextRequest, NextResponse } from 'next/server';
// import { kv } from '@vercel/kv'; // Vercel KV client
// import { Ratelimit } from '@upstash/ratelimit'; // Rate limiting library

// let ratelimitInstance: Ratelimit | null = null;

// Initialize Vercel KV and Ratelimit instances
// This happens once when the module is first imported.
// if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
//   ratelimitInstance = new Ratelimit({
//     redis: kv,
//     // Example: Allow 10 requests per 10 seconds from the same IP address
//     limiter: Ratelimit.slidingWindow(10, '10 s'),
//     analytics: true, // Optional: Enable analytics in your Vercel KV (Upstash) console
//     prefix: '@my_app_ratelimit_module', // Unique prefix for your Redis keys
//   });
//   console.log('Rate limiter initialized with Vercel KV.');
// } else {
//   if (process.env.NODE_ENV === 'development') {
//     console.warn(
//       'Vercel KV environment variables not found for rate limiter. ' +
//         'Rate limiting will be disabled. ' +
//         'Ensure a KV store is connected to your Vercel project and ' +
//         'environment variables are pulled for local development (e.g., by running `vc env pull .env.local`).',
//     );
//   } else {
//     console.error(
//       'Vercel KV environment variables not found for rate limiter. ' +
//         'Rate limiting is disabled. Check Vercel KV configuration.',
//     );
//   }
// }

/**
 * Checks if a request from a given IP is rate-limited.
 * @param req The incoming NextRequest.
 * @returns A NextResponse object with status 429 if rate-limited, otherwise null.
 */
// export async function checkRequestRateLimit(req: NextRequest): Promise<NextResponse | null> {
//   if (!ratelimitInstance) {
//     // Rate limiting is not configured or disabled, so allow the request.
//     return null;
//   }

//   const ipAddress = (req as NextRequest & { ip?: string }).ip ?? '127.0.0.1'; // Get IP address (fallback for local dev/tests)

//   try {
//     const { success, limit, remaining, reset } = await ratelimitInstance.limit(ipAddress);

//     if (!success) {
//       const resetDate = new Date(reset);
//       console.info(
//         `RATE LIMIT EXCEEDED for IP: ${ipAddress}. Limit: ${limit}, Remaining: ${remaining}, Resets at: ${resetDate.toLocaleTimeString()}`,
//       );
//       return new NextResponse('Too Many Requests', {
//         status: 429,
//         headers: {
//           'X-Ratelimit-Limit': limit.toString(),
//           'X-Ratelimit-Remaining': remaining.toString(),
//           'X-Ratelimit-Reset': resetDate.toISOString(),
//           'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
//         },
//       });
//     }
//     // Optionally, log successful checks if needed for high-volume debugging:
//     // console.debug(`Rate limit check passed for IP: ${ip}. Remaining: ${remaining}`);
//     return null; // Request is not rate-limited
//   } catch (error) {
//     console.error('Error during rate limiting check:', error);
//     // Decide on fail-open or fail-closed behavior if the limiter itself errors.
//     // Returning null here means fail-open (request proceeds if limiter fails).
//     // For critical protection, you might throw an error or return a 500 response.
//     return null;
//   }
// }
