import NextAuth from 'next-auth';
import { authConfig } from '@/auth/config';
import { GoogleProvider } from '@/auth/providers';

export const {
  auth,
  signIn,
  signOut,
  handlers: { GET, POST },
} = NextAuth({
  ...authConfig,
  providers: [GoogleProvider],
});
