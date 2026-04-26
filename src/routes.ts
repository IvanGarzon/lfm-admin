/**
 * These routes are public and don't need authentication
 * @type {string[]}
 * */
export const publicRoutes: string[] = ['/verify', '/test-s3'];

/**
 * Route prefixes that are public regardless of query params or sub-paths
 * @type {string[]}
 * */
export const publicRoutePrefixes: string[] = ['/invite/accept', '/reset-password'];

/**
 * Named authentication route constants with type safety
 * Single source of truth for all auth routes
 * */
export const AUTH_ROUTES = {
  SIGN_IN: '/signin',
  // REGISTER: '/register',
  // ERROR: '/error',
  // RESEND: '/resend',
  // RESET: '/reset',
  // NEW_PASSWORD: '/new-password',
  // TWO_FACTOR: '/two-factor',
} as const;

/**
 * Array of authentication routes for .includes() checks
 * Auto-derived from AUTH_ROUTES for backward compatibility
 * */
export const authRoutes: string[] = [
  ...Object.values(AUTH_ROUTES),
  '/invite/accept',
  '/reset-password',
];

/**
 * Primary sign-in route for unauthenticated users
 * @type {string}
 * */
export const DEFAULT_SIGNIN_ROUTE = AUTH_ROUTES.SIGN_IN;

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
