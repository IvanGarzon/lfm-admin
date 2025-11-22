/**
 * These routes are public and don't need authentication
 * @type {string[]}
 * */
export const publicRoutes: string[] = [
  '/verify',
  '/test-s3', // S3 test page
];

/**
 * These routes are used for authentication
 * redirect logged-in users to /settings
 * @type {string[]}
 * */
export const authRoutes: string[] = [
  '/signin',
  // "/register",
  // "/error",
  // "/resend",
  // "/reset",
  // "/new-password",
  // "/two-factor"
];

/**
 * The prefix for API authentication routes
 * Routes that start with this prefix are used for api
 * authentication purposes
 * @type {string}
 * */
export const apiAuthPrefix: string = '/api/auth';

/**
 * Default redirect path for logged-in users
 * @type {string}
 * */
export const DEFAULT_LOGIN_REDIRECT: string = '/';
