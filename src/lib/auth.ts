import { cache } from 'react';
import { auth } from '@/auth';

export const getCurrentUser = cache(async () => {
  const session = await auth();
  if (!session?.user) {
    return undefined;
  }

  return session.user;
});

// Lightweight auth check for API routes - only verifies JWT token without DB lookups
export const isAuthenticated = cache(async () => {
  const session = await auth();
  return !!session?.user;
});

// export const currentRole = async () => {
//   const session = await auth();
//   return session?.user?.role;
// };
