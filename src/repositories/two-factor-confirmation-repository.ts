import { TwoFactorConfirmation, PrismaClient } from '@/prisma/client';
import { Prisma } from '@/prisma/client';
import { BaseRepository, type ModelDelegateOperations } from '@/lib/baseRepository';

// -- Repository -------------------------------------------------------------

export class TwoFactorConfirmationRepository extends BaseRepository<TwoFactorConfirmation> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected get model(): ModelDelegateOperations<TwoFactorConfirmation> {
    return this.prisma.twoFactorConfirmation as unknown as ModelDelegateOperations<
      Prisma.TwoFactorConfirmationGetPayload<object>
    >;
  }

  /**
   * Finds an existing two-factor confirmation record for a user.
   * @param userId - The user's primary key
   * @returns The TwoFactorConfirmation record, or null if none exists
   */
  async findByUserId(userId: string): Promise<TwoFactorConfirmation | null> {
    return await this.prisma.twoFactorConfirmation.findUnique({
      where: { userId },
    });
  }

  /**
   * Deletes a two-factor confirmation record by its primary key.
   * @param id - The primary key of the TwoFactorConfirmation record
   * @returns The deleted TwoFactorConfirmation record
   */
  async deleteById(id: string): Promise<TwoFactorConfirmation> {
    return await this.prisma.twoFactorConfirmation.delete({
      where: { id },
    });
  }

  /**
   * Creates a two-factor confirmation record for a user, or does nothing if one already exists.
   * Used immediately after successful OTP verification to act as a short-lived gate for session creation.
   * @param userId - The user's primary key
   * @returns The created or existing TwoFactorConfirmation record
   */
  async upsertByUserId(userId: string): Promise<TwoFactorConfirmation> {
    return await this.prisma.twoFactorConfirmation.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }
}
