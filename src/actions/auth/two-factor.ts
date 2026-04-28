'use server';

import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { handleActionError } from '@/lib/error-handler';
import { getClientDetails } from '@/lib/agent';
import { sendEmailNotification } from '@/lib/email-service';
import { UserRepository } from '@/repositories/user-repository';
import { TwoFactorTokenRepository } from '@/repositories/two-factor-token-repository';
import { SignInSchema, OtpVerifySchema } from '@/schemas/auth';
import type { SignInInput, OtpVerifyInput } from '@/schemas/auth';
import type { ActionResult } from '@/types/actions';

// -- Constants ----------------------------------------------------------------

const OTP_EXPIRY_MINUTES = 15;
const MAX_ATTEMPTS = 5;

// -- Actions ------------------------------------------------------------------

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

    const code = crypto.randomInt(100000, 999999).toString();
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

    sendEmailNotification({
      to: email,
      subject: 'Your sign-in verification code',
      template: 'otp',
      props: { userName, otpCode: code, expiresInMinutes: OTP_EXPIRY_MINUTES },
    }).catch((err) => {
      logger.error('Failed to send OTP email', err, {
        context: 'initiateSignIn',
        metadata: { userId: user.id },
      });
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
      return { success: false, error: 'Your verification code has expired. Please sign in again.' };
    }

    if (token.numberOfAttempts >= MAX_ATTEMPTS) {
      return { success: false, error: 'Too many incorrect attempts. Please sign in again.' };
    }

    const hashedSubmitted = crypto.createHash('sha256').update(code).digest('hex');

    if (hashedSubmitted !== token.otpCode) {
      const updated = await tokenRepo.incrementAttempts(token.id);
      const remaining = MAX_ATTEMPTS - updated.numberOfAttempts;

      if (remaining <= 0) {
        await tokenRepo.markUsed(token.id);
        return { success: false, error: 'Too many incorrect attempts. Please sign in again.' };
      }

      return {
        success: false,
        error: `Invalid code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
      };
    }

    const clientDetails = await getClientDetails();
    await tokenRepo.markUsed(token.id, clientDetails.ipAddress);

    return { success: true, data: { verified: true } };
  } catch (error) {
    return handleActionError(error, 'Verification failed', { context: 'verifyTwoFactorCode' });
  }
}
