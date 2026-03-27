import { type NextAuthConfig, type Account, type Profile } from 'next-auth';
import { handleSignIn, type SignInArgs } from '@/actions/auth/mutations';
import { prisma } from '@/lib/prisma';
import { getClientDetails } from '@/lib/agent';
import { env } from '@/env';
import { generateSessionName } from '@/features/sessions/utils/session-icons';
import { getSessionLimit } from '@/config/session';
import { SessionRepository } from '@/repositories/session-repository';
import { UserRepository } from '@/repositories/user-repository';
import { logger } from '@/lib/logger';
import { GoogleProvider } from '@/auth/providers';
import Credentials from 'next-auth/providers/credentials';

export const authConfig = {
  // No adapter needed for JWT strategy
  debug: env.NODE_ENV === 'development',
  logger: {
    error(error) {
      logger.error('NextAuth error', error, {
        context: 'next-auth',
      });
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
      logger.info('New user created', {
        context: 'auth:createUser',
        metadata: { userId: user.id, email: user.email },
      });
    },

    async signOut(params) {
      // Mark only the current session as inactive when user signs out (JWT strategy)
      try {
        // With JWT strategy, we get token in params
        const token = 'token' in params ? params.token : null;
        if (token?.sessionToken) {
          // Only deactivate the current session, not all sessions for this user
          const sessionRepo = new SessionRepository(prisma);
          await sessionRepo.deactivateBySessionToken(token.sessionToken as string);
        }
      } catch (error) {
        logger.error('Failed to update session records on sign out', error, {
          context: 'auth:signOut',
        });
      }
    },
  },
  callbacks: {
    async authorized({ auth }) {
      if (!auth?.user) {
        return false;
      }

      // Verify session is still active in database
      const sessionToken = auth.sessionToken;
      if (sessionToken) {
        try {
          const sessionRepo = new SessionRepository(prisma);
          const isActive = await sessionRepo.isSessionActive(sessionToken);

          // If session was revoked or expired, deny access
          if (!isActive) {
            return false;
          }
        } catch (error) {
          logger.error('Failed to verify session', error, {
            context: 'auth:authorized',
            metadata: { sessionToken },
          });
          return false;
        }
      }

      return true;
    },

    async signIn({ user, account, profile }): Promise<boolean> {
      const args: SignInArgs = {
        account: account as Account | null,
        profile: profile as Profile | undefined,
      };

      // 1. Check authorisation first
      const result = await handleSignIn(args);
      if (!result.success || !result.data) {
        return false;
      }

      // 2. Ensure user exists in database (JWT doesn't use adapter)
      try {
        if (user.email) {
          const userRepo = new UserRepository(prisma);

          await userRepo.upsertByEmail(
            user.email,
            {
              avatarUrl: user.image,
              emailVerified: new Date(),
            },
            {
              email: user.email,
              firstName: user.name?.split(' ')[0] || '',
              lastName: user.name?.split(' ').slice(1).join(' ') || '',
              avatarUrl: user.image,
              emailVerified: new Date(),
            },
          );

          // Get the user ID for session creation
          const dbUser = await userRepo.getUserByEmailWithSelect(user.email, {
            id: true,
            role: true,
          });

          if (dbUser) {
            // Enforce session limits
            const sessionRepo = new SessionRepository(prisma);
            const activeCount = await sessionRepo.countActiveSessions(dbUser.id);
            const limit = getSessionLimit(dbUser.role);

            if (activeCount >= limit) {
              // Revoke oldest session to make room
              await sessionRepo.revokeOldestSession(dbUser.id);
            }

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

              // Location info
              country: details.country,
              region: details.region,
              city: details.city,
              timezone: details.timezone,
              latitude: details.latitude,
              longitude: details.longitude,

              deviceName: generateSessionName(
                details.os?.name,
                details.browser?.name,
                details.device?.type,
              ),
              lastActiveAt: new Date(), // Initialize last active timestamp
            };

            await sessionRepo.createSession(sessionData);

            // 🚀 PERFORMANCE: Update location in background (non-blocking)
            // This happens AFTER sign-in completes, so no delay for user
            if (env.NODE_ENV === 'production' && details.ipAddress) {
              // Dynamic import to avoid circular deps, fire and forget
              import('@/lib/location-service')
                .then(({ updateSessionLocation }) => {
                  updateSessionLocation(sessionData.sessionToken, details.ipAddress!).catch((err) =>
                    logger.error('Background location update failed', err, {
                      context: 'auth:signIn',
                      metadata: { sessionToken: sessionData.sessionToken },
                    }),
                  );
                })
                .catch((err) =>
                  logger.error('Failed to load location service', err, {
                    context: 'auth:signIn',
                  }),
                );
            }
          }
        }
      } catch (error) {
        logger.error('Failed to handle user/session creation', error, {
          context: 'auth:signIn',
          metadata: { email: user.email },
        });
        // Don't fail sign-in for session tracking errors
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        // On sign-in, `user` is the user object from the provider
        // We need to fetch our internal user to get the correct ID
        const userRepo = new UserRepository(prisma);
        const dbUser = await userRepo.getUserByEmailWithSelect(user.email!, {
          id: true,
          role: true,
        });

        if (dbUser) {
          token.sub = dbUser.id; // Set the token's subject to our internal user ID
          token.role = dbUser.role;

          // Get the most recent session token for this user to identify the current session
          const sessionRepo = new SessionRepository(prisma);
          const latestSession = await sessionRepo.findLatestActiveByUserId(dbUser.id);

          if (latestSession) {
            token.sessionToken = latestSession.sessionToken;
          }
        }
      }
      return token;
    },

    async session({ session, token }) {
      // Verify session is still active in database before returning session data
      if (token.sessionToken) {
        try {
          const sessionRepo = new SessionRepository(prisma);
          const isActive = await sessionRepo.isSessionActive(token.sessionToken as string);

          // If session was revoked or expired, throw error to invalidate the session
          if (!isActive) {
            throw new Error('Session has been revoked');
          }
        } catch (error) {
          logger.error('Session validation failed', error, {
            context: 'auth:session',
            metadata: { sessionToken: token.sessionToken as string },
          });
          throw error; // Re-throw to force session invalidation
        }
      }

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
            role: token.role || 'USER',
          },
          // Include session token for identifying current session in database
          sessionToken: token.sessionToken as string | undefined,
        };
      }

      return session;
    },
  },
  providers: [
    GoogleProvider,
    ...(env.NODE_ENV !== 'production'
      ? [
          Credentials({
            name: 'Credentials',
            credentials: {
              email: { label: 'Email', type: 'email' },
              password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
              if (
                credentials?.email === 'test@example.com' &&
                credentials?.password === 'password'
              ) {
                const userRepo = new UserRepository(prisma);

                const user = await userRepo.upsertByEmail(
                  credentials.email,
                  {
                    emailVerified: new Date(),
                  },
                  {
                    email: credentials.email,
                    firstName: 'Test',
                    lastName: 'User',
                    emailVerified: new Date(),
                  },
                );

                return user;
              }
              return null;
            },
          }),
        ]
      : []),
  ],
} satisfies NextAuthConfig;
