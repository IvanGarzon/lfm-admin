export const SESSION_LIMITS = {
  DEFAULT: 5,
  ADMIN: 10,
} as const;

export function getSessionLimit(role?: string | null): number {
  if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
    return SESSION_LIMITS.ADMIN;
  }
  return SESSION_LIMITS.DEFAULT;
}
