import type { Account, Profile } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { UserRepository } from '@/repositories/user-repository';
import { LoggerService } from '@/services/logger';
import { BadRequestError } from '@/services/error';

const loggerService = new LoggerService();

export interface SignInArgs {
  account: Account | null; // Account can be null for credential logins
  profile?: Profile; // Profile is provider-specific
}

export const handleSignIn = async ({ account, profile }: SignInArgs): Promise<boolean> => {
  try {
    if (!account) {
      throw new BadRequestError('Error during sign-in: Account information is missing');
    }

    const email = profile?.email;
    if (!email || email.trim() === '') {
      throw new BadRequestError('Error during sign-in: Missing or empty email in profile', {
        field: 'email',
      });
    }

    const userRepo = new UserRepository();
    const existingUser = await userRepo.getUserByEmail(email);

    // Check for existing account first
    const existingAccount = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: account.provider,
          providerAccountId: account.providerAccountId,
        },
      },
    });

    if (existingAccount) {
      // Account already exists, just log the sign-in
      loggerService.LoggedIn({
        data: {
          userId: existingAccount.userId,
          // provider: account.provider
          // email
        },
      });

      return true;
    }

    if (existingUser) {
      // User exists but no account - create the account
      await prisma.account.create({
        data: {
          userId: existingUser.id,
          type: account.type,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at,
          tokenType: account.token_type,
          scope: account.scope,
          idToken: account.id_token,
        },
      });

      loggerService.LoggedIn({
        data: {
          userId: existingUser.id,
          // provider: account.provider,
          // email: existingUser.email
        },
      });

      return true;
    }

    // Create a new user if it doesn't exist
    const newUser = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          firstName: profile?.given_name || 'Unknown',
          lastName: profile?.family_name || 'Unknown',
          email: profile?.email,
          avatarUrl: profile?.picture,
        },
      });

      await tx.account.create({
        data: {
          userId: createdUser.id,
          type: account.type,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at,
          tokenType: account.token_type,
          scope: account.scope,
          idToken: account.id_token,
        },
      });

      return createdUser;
    });

    if (!newUser) {
      throw new BadRequestError('User could not be created');
    }

    // Log outside of the transaction to avoid side effects inside it
    loggerService.LoggedIn({
      data: {
        userId: newUser.id,
      },
    });

    return true;
  } catch (error) {
    console.error('Error during sign-in:', error);
    return false; // Deny sign-in if something goes wrong
  }
};
