import { PrismaClient, PasswordResetToken } from '@/prisma/client';

export class PasswordResetTokenRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Creates a new password reset token for a user.
   * @param userId - The ID of the user requesting the reset
   * @param requestedBy - The ID of the user who triggered the reset
   * @param expiresAt - When the token expires
   * @returns The created token record
   */
  async create(userId: string, requestedBy: string, expiresAt: Date): Promise<PasswordResetToken> {
    return this.prisma.passwordResetToken.create({
      data: { userId, requestedBy, expiresAt },
    });
  }

  /**
   * Finds a valid (unused, unexpired) token by its value.
   * @param token - The token string to look up
   * @returns The token record, or null if not found / already used / expired
   */
  async findValid(token: string): Promise<PasswordResetToken | null> {
    return this.prisma.passwordResetToken.findFirst({
      where: {
        token,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
  }

  /**
   * Marks a token as used by setting usedAt to now.
   * @param id - The token record ID
   * @returns The updated token record
   */
  async markUsed(id: string): Promise<PasswordResetToken> {
    return this.prisma.passwordResetToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  /**
   * Invalidates all unused tokens for a user. Called after a successful password reset.
   * @param userId - The user whose tokens to invalidate
   */
  async invalidateAllForUser(userId: string): Promise<void> {
    await this.prisma.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });
  }
}
