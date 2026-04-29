'use server';

import crypto from 'node:crypto';
import type { Account, Profile } from 'next-auth';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { handleActionError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { getClientDetails } from '@/lib/agent';
import { sendEmailNotification } from '@/lib/email-service';
import type { ActionResult } from '@/types/actions';
import { UserRepository } from '@/repositories/user-repository';
import { AccountRepository } from '@/repositories/account-repository';
import { TwoFactorTokenRepository } from '@/repositories/two-factor-token-repository';
import { TwoFactorConfirmationRepository } from '@/repositories/two-factor-confirmation-repository';
import { AuditService } from '@/services/audit.service';
import { BadRequestError } from '@/services/error';
import { SignInSchema, OtpVerifySchema } from '@/schemas/auth';
import type { SignInInput, OtpVerifyInput } from '@/schemas/auth';

const auditService = new AuditService();

// -- Constants ----------------------------------------------------------------

const OTP_EXPIRY_MINUTES = 15;
const MAX_ATTEMPTS = 5;

// -- Actions ------------------------------------------------------------------

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

/**
 * Verifies the user's password and initiates the sign-in flow.
 * If two-factor authentication is disabled, returns requiresOtp: false.
 * If two-factor authentication is enabled, generates a one-time code,
 * sends it via email, and returns requiresOtp: true with a challengeToken.
 * @param input - Email and password credentials
 * @returns ActionResult with requiresOtp flag and optional challengeToken
 */
export async function initiateSignIn(
  input: SignInInput,
): Promise<ActionResult<{ requiresOtp: false } | { requiresOtp: true; challengeToken: string }>> {
  try {
    const { email, password } = SignInSchema.parse(input);

    const userRepo = new UserRepository(prisma);
    const user = await userRepo.getUserByEmail(email);

    if (!user || !user.password) {
      return { success: false, error: 'Invalid email or password' };
    }

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      return { success: false, error: 'Invalid email or password' };
    }

    if (!user.isTwoFactorEnabled) {
      return { success: true, data: { requiresOtp: false } };
    }

    const code = crypto.randomInt(100000, 1000000).toString();
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
    const expires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    const clientDetails = await getClientDetails();

    const tokenRepo = new TwoFactorTokenRepository(prisma);
    const token = await tokenRepo.upsertToken({
      userId: user.id,
      hashedCode,
      expires,
      userAgent: clientDetails.userAgent,
      requestedIpAddress: clientDetails.ipAddress,
    });

    const userName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'there';

    try {
      await sendEmailNotification({
        to: email,
        subject: 'Your sign-in verification code',
        template: 'otp',
        props: { userName, otpCode: code, expiresInMinutes: OTP_EXPIRY_MINUTES },
      });
    } catch (err) {
      logger.error('Failed to send OTP email', err, {
        context: 'initiateSignIn',
        metadata: { userId: user.id },
      });

      return { success: false, error: 'Failed to send verification code. Please try again.' };
    }

    auditService.OtpRequested({
      data: {
        userId: user.id,
        ipAddress: clientDetails.ipAddress ?? undefined,
        userAgent: clientDetails.userAgent ?? undefined,
      },
    });

    return { success: true, data: { requiresOtp: true, challengeToken: token.challengeToken } };
  } catch (error) {
    return handleActionError(error, 'Sign-in failed', { context: 'initiateSignIn' });
  }
}

/**
 * Verifies the submitted OTP code against the stored challenge token.
 * Enforces expiry, used-token, and maximum attempt limits.
 * On success marks the token as used and returns verified: true.
 * @param input - Challenge token and the 6-digit OTP code
 * @returns ActionResult with verified: true on success
 */
export async function verifyTwoFactorCode(
  input: OtpVerifyInput,
): Promise<ActionResult<{ verified: true }>> {
  try {
    const { challengeToken, code } = OtpVerifySchema.parse(input);

    const tokenRepo = new TwoFactorTokenRepository(prisma);
    const token = await tokenRepo.findByChallengeToken(challengeToken);

    if (!token) {
      return { success: false, error: 'Invalid or expired verification session.' };
    }

    if (token.usedAt) {
      return { success: false, error: 'This code has already been used.' };
    }

    if (token.expires < new Date()) {
      auditService.OtpExpired({ data: { userId: token.userId } });
      return { success: false, error: 'Your verification code has expired. Please sign in again.' };
    }

    const hashedSubmitted = crypto.createHash('sha256').update(code).digest('hex');

    const hashMatch = crypto.timingSafeEqual(
      Buffer.from(hashedSubmitted, 'hex'),
      Buffer.from(token.otpCode, 'hex'),
    );

    if (!hashMatch) {
      const updated = await tokenRepo.incrementAttempts(token.id);
      if (updated.numberOfAttempts >= MAX_ATTEMPTS) {
        await tokenRepo.markUsed(token.id);
        auditService.OtpLocked({ data: { userId: token.userId } });
        return { success: false, error: 'Too many incorrect attempts. Please sign in again.' };
      }
      const remaining = MAX_ATTEMPTS - updated.numberOfAttempts;
      auditService.OtpFailed({ data: { userId: token.userId, attemptsRemaining: remaining } });
      return {
        success: false,
        error: `Invalid code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
      };
    }

    const clientDetails = await getClientDetails();
    await tokenRepo.markUsed(token.id, clientDetails.ipAddress);

    const confirmationRepo = new TwoFactorConfirmationRepository(prisma);
    await confirmationRepo.upsertByUserId(token.userId);

    auditService.OtpVerified({
      data: { userId: token.userId, ipAddress: clientDetails.ipAddress ?? undefined },
    });

    return { success: true, data: { verified: true } };
  } catch (error) {
    return handleActionError(error, 'Verification failed', { context: 'verifyTwoFactorCode' });
  }
}
