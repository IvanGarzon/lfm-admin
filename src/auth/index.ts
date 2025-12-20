import NextAuth from 'next-auth';
import { authConfig } from '@/auth/config';
import { GoogleProvider } from '@/auth/providers';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';

const providers: any[] = [GoogleProvider];

if (process.env.NODE_ENV !== 'production') {
  providers.push(
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('Authorize called with:', credentials?.email);
        if (
          credentials?.email === 'test@example.com' &&
          credentials?.password === 'password'
        ) {
          console.log('Credentials matched');
          // Upsert test user
          const user = await prisma.user.upsert({
            where: { email: credentials.email },
            update: {
              role: 'ADMIN', // Ensure permissions
            },
            create: {
              email: credentials.email,
              role: 'ADMIN',
              firstName: 'Test',
              lastName: 'User',
            },
          });
          return user;
        }
        return null;
      },
    })
  );
}

export const {
  auth,
  signIn,
  signOut,
  handlers: { GET, POST },
} = NextAuth({
  ...authConfig,
  providers,
});
