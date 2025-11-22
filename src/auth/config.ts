import { type NextAuthConfig, type Account, type Profile } from 'next-auth';
import { handleSignIn } from '@/services/authService';
import { prisma } from '@/lib/prisma';
import { getClientDetails } from '@/lib/agent';
import { env } from 'env';

export interface SignInArgs {
  account: Account | null; // Account can be null for credential logins
  profile?: Profile; // Profile is provider-specific
}

export const authConfig = {
  // No adapter needed for JWT strategy
  debug: env.NODE_ENV === 'development',
  logger: {
    error(error) {
      console.error('[error] [next-auth]:', JSON.stringify(error.message, null, 2));
    },
  },
  secret: env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt', // Use JWT strategy for performance
    maxAge: 60 * 60 * 24, // 1 Day - Session expiry
    updateAge: 60 * 60, // 1 Hour - How often to update the session
  },
  pages: {
    signIn: '/signin',
    signOut: '/signout',
  },
  events: {
    async linkAccount({ user }) {
      // Optional: Perform actions when a new provider account is linked
    },

    async createUser({ user }) {
      // Optional: Perform actions when a user is created for the first time
      // E.g., send welcome email, initialize other related data
      console.log('New user created:', user);
    },

    async signOut(params) {
      // Mark sessions as inactive when user signs out (JWT strategy)
      try {
        // With JWT strategy, we get token in params
        const token = 'token' in params ? params.token : null;
        if (token?.sub) {
          await prisma.session.updateMany({
            where: {
              userId: token.sub,
              isActive: true,
            },
            data: {
              isActive: false,
            },
          });
        }
      } catch (error) {
        console.error('Failed to update session records on sign out:', error);
      }
    },
  },
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user;
    },

    async signIn({ user, account, profile }): Promise<boolean> {
      const args: SignInArgs = {
        account: account as Account | null,
        profile: profile as Profile | undefined,
      };

      // 1. Check authorization first
      const isAllowed = await handleSignIn(args);
      if (!isAllowed) {
        return false; // Deny sign-in
      }

      // 2. Ensure user exists in database (JWT doesn't use adapter)
      try {
        if (user.email) {
          await prisma.user.upsert({
            where: { email: user.email },
            update: {
              // Update existing user info
              avatarUrl: user.image,
              emailVerified: new Date(),
            },
            create: {
              // Create new user - split name into firstName/lastName
              email: user.email,
              firstName: user.name?.split(' ')[0] || '',
              lastName: user.name?.split(' ').slice(1).join(' ') || '',
              avatarUrl: user.image,
              emailVerified: new Date(), // Assume verified since it's from OAuth
            },
          });

          // Get the user ID for session creation
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
            select: { id: true },
          });

          if (dbUser) {
            // 3. Create session record for tracking
            const details = await getClientDetails();
            const sessionData = {
              userId: dbUser.id,
              sessionToken: crypto.randomUUID(),
              expires: new Date(Date.now() + 60 * 60 * 24 * 1000), // 1 day
              ipAddress: details.ipAddress,
              userAgent: details.userAgent,
              deviceType: details.device?.type,
              deviceVendor: details.device?.vendor,
              deviceModel: details.device?.model,
              osName: details.os?.name,
              osVersion: details.os?.version,
              browserName: details.browser?.name,
              browserVersion: details.browser?.version,
              deviceName: 'Default Device',
            };

            await prisma.session.create({
              data: sessionData,
            });
          }
        }
      } catch (error) {
        console.error('Failed to handle user/session creation:', error);
        // Don't fail sign-in for session tracking errors
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        // On sign-in, `user` is the user object from the provider
        // We need to fetch our internal user to get the correct ID
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
          select: { id: true },
        });

        if (dbUser) {
          token.sub = dbUser.id; // Set the token's subject to our internal user ID
        }
      }
      return token;
    },

    async session({ session, token }) {
      // For JWT strategy, we can use token data directly without database lookups
      // This makes auth much faster for API routes
      if (session.user && token?.sub) {
        return {
          ...session,
          user: {
            ...session.user,
            id: token.sub,
            // Use token data directly - much faster than DB lookup
            name: token.name || session.user.name,
            email: token.email || session.user.email,
            image: token.picture || session.user.image,
          },
        };
      }

      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
