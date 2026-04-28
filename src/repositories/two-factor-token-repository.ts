import { randomUUID } from 'node:crypto';
import { Prisma, TwoFactorToken, PrismaClient } from '@/prisma/client';
import { BaseRepository, type ModelDelegateOperations } from '@/lib/baseRepository';

// -- Types ------------------------------------------------------------------

interface UpsertTokenInput {
  userId: string;
  hashedCode: string;
  expires: Date;
  userAgent?: string;
  requestedIpAddress?: string;
}

// -- Repository -------------------------------------------------------------

export class TwoFactorTokenRepository extends BaseRepository<TwoFactorToken> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected get model(): ModelDelegateOperations<TwoFactorToken> {
    return this.prisma.twoFactorToken as unknown as ModelDelegateOperations<
      Prisma.TwoFactorTokenGetPayload<object>
    >;
  }

  /**
   * Creates or replaces the two-factor token for a user.
   * On re-send, the existing record is replaced with a fresh challenge token
   * and the attempt counter is reset to zero.
   * @param input - Token fields including userId, hashed OTP code, expiry, and optional metadata
   * @returns The created or updated TwoFactorToken record
   */
  async upsertToken(input: UpsertTokenInput): Promise<TwoFactorToken> {
    const { userId, hashedCode, expires, userAgent, requestedIpAddress } = input;
    const challengeToken = randomUUID();

    return await this.prisma.twoFactorToken.upsert({
      where: { userId },
      create: {
        userId,
        otpCode: hashedCode,
        challengeToken,
        expires,
        userAgent,
        requestedIpAddress,
        numberOfAttempts: 0,
      },
      update: {
        otpCode: hashedCode,
        challengeToken,
        expires,
        userAgent,
        requestedIpAddress,
        numberOfAttempts: 0,
        usedAt: null,
      },
    });
  }

  /**
   * Finds a two-factor token by its challenge token value.
   * @param challengeToken - The unique challenge token string to look up
   * @returns The matching TwoFactorToken record, or null if not found
   */
  async findByChallengeToken(challengeToken: string): Promise<TwoFactorToken | null> {
    return await this.prisma.twoFactorToken.findUnique({
      where: { challengeToken },
    });
  }

  /**
   * Increments the number of failed verification attempts for a token by one.
   * @param id - The primary key of the TwoFactorToken record
   * @returns The updated TwoFactorToken record
   */
  async incrementAttempts(id: string): Promise<TwoFactorToken> {
    return await this.prisma.twoFactorToken.update({
      where: { id },
      data: { numberOfAttempts: { increment: 1 } },
    });
  }

  /**
   * Marks a two-factor token as used by setting the usedAt timestamp.
   * Optionally records the IP address from which the login was completed.
   * @param id - The primary key of the TwoFactorToken record
   * @param loggedInIpAddress - Optional IP address of the user at login time
   * @returns The updated TwoFactorToken record
   */
  async markUsed(id: string, loggedInIpAddress?: string): Promise<TwoFactorToken> {
    return await this.prisma.twoFactorToken.update({
      where: { id },
      data: {
        usedAt: new Date(),
        loggedInIpAddress: loggedInIpAddress ?? null,
      },
    });
  }
}
