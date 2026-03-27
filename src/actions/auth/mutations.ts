'use server';

import type { Account, Profile } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { handleActionError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import type { ActionResult } from '@/types/actions';
import { UserRepository } from '@/repositories/user-repository';
import { AccountRepository } from '@/repositories/account-repository';
import { AuditService } from '@/services/audit.service';
import { BadRequestError } from '@/services/error';

const auditService = new AuditService();

export interface SignInArgs {
  account: Account | null;
  profile?: Profile;
}

/**
 * Handles user sign-in authentication and account linking.
 * This function is called during the NextAuth sign-in flow to:
 * - Validate the sign-in attempt
 * - Create new users if they don't exist
 * - Link OAuth accounts to existing users
 * - Log authentication events for audit trail
 *
 * @param args - Sign-in arguments containing account and profile data
 * @returns ActionResult indicating success (true) or failure with error details
 */
export async function handleSignIn({
  account,
  profile,
}: SignInArgs): Promise<ActionResult<boolean>> {
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

    const userRepo = new UserRepository(prisma);
    const accountRepo = new AccountRepository(prisma);

    const existingUser = await userRepo.getUserByEmail(email);

    const existingAccount = await accountRepo.findByProviderAndAccountId(
      account.provider,
      account.providerAccountId,
    );

    if (existingAccount) {
      auditService.LoggedIn({
        data: {
          userId: existingAccount.userId,
        },
      });

      logger.info('User signed in with existing account', {
        context: 'handleSignIn',
        metadata: {
          userId: existingAccount.userId,
          provider: account.provider,
        },
      });

      return { success: true, data: true };
    }

    if (existingUser) {
      await accountRepo.createAccount(existingUser.id, {
        type: account.type,
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        accessToken: account.access_token,
        refreshToken: account.refresh_token,
        expiresAt: account.expires_at,
        tokenType: account.token_type,
        scope: account.scope,
        idToken: account.id_token,
      });

      auditService.LoggedIn({
        data: {
          userId: existingUser.id,
        },
      });

      logger.info('Linked new account to existing user', {
        context: 'handleSignIn',
        metadata: {
          userId: existingUser.id,
          provider: account.provider,
        },
      });

      return { success: true, data: true };
    }

    const newUser = await userRepo.createUserWithAccount(
      {
        firstName: profile?.given_name || 'Unknown',
        lastName: profile?.family_name || 'Unknown',
        email: profile?.email,
        avatarUrl: profile?.picture,
      },
      {
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
    );

    if (!newUser) {
      throw new BadRequestError('User could not be created');
    }

    auditService.LoggedIn({
      data: {
        userId: newUser.id,
      },
    });

    logger.info('Created new user with account', {
      context: 'handleSignIn',
      metadata: {
        userId: newUser.id,
        provider: account.provider,
      },
    });

    return { success: true, data: true };
  } catch (error) {
    logger.error('Sign-in failed', error, { context: 'handleSignIn' });
    return handleActionError(error, 'Sign-in failed', {
      action: 'handleSignIn',
      provider: account?.provider,
      email: profile?.email,
    });
  }
}
