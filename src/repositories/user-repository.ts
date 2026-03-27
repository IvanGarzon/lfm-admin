import { Prisma, User, PrismaClient } from '@/prisma/client';
import { prisma } from '@/lib/prisma';
import { BaseRepository, type ModelDelegateOperations } from '@/lib/baseRepository';
import type { CreateAccountData } from './account-repository';

export interface CreateUserData {
  firstName: string;
  lastName: string;
  email?: string | null;
  avatarUrl?: string | null;
}

/**
 * User Repository
 * Handles all database operations for users
 * Extends BaseRepository for common CRUD operations
 */
export class UserRepository extends BaseRepository<User> {
  constructor(private prismaClient: PrismaClient = prisma) {
    super();
  }

  protected get model(): ModelDelegateOperations<User> {
    return this.prismaClient.user as unknown as ModelDelegateOperations<User>;
  }

  /**
   * Locates a single user record by their matching email address.
   * @param email - The email string to query
   * @returns A promise that resolves to the user object if found, or null
   */
  async getUserByEmail(email: string): Promise<User | null> {
    return await this.prismaClient.user.findUnique({
      where: { email },
    });
  }

  /**
   * Creates a new user and their OAuth account atomically in a transaction.
   * This ensures data consistency when registering via OAuth providers.
   * @param userData - User profile data from OAuth provider
   * @param accountData - OAuth account credentials and metadata
   * @returns The newly created user
   */
  async createUserWithAccount(
    userData: CreateUserData,
    accountData: CreateAccountData,
  ): Promise<User> {
    return await this.prismaClient.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          avatarUrl: userData.avatarUrl,
        },
      });

      await tx.account.create({
        data: {
          userId: createdUser.id,
          type: accountData.type,
          provider: accountData.provider,
          providerAccountId: accountData.providerAccountId,
          accessToken: accountData.accessToken,
          refreshToken: accountData.refreshToken,
          expiresAt: accountData.expiresAt,
          tokenType: accountData.tokenType,
          scope: accountData.scope,
          idToken: accountData.idToken,
        },
      });

      return createdUser;
    });
  }

  /**
   * Creates or updates a user by email.
   * If user exists, updates their information. If not, creates a new user.
   * @param email - The email to search for
   * @param updateData - Data to update if user exists
   * @param createData - Data to create if user doesn't exist
   * @returns The created or updated user
   */
  async upsertByEmail(
    email: string,
    updateData: {
      avatarUrl?: string | null;
      emailVerified?: Date | null;
    },
    createData: {
      email: string;
      firstName: string;
      lastName: string;
      avatarUrl?: string | null;
      emailVerified?: Date | null;
    },
  ): Promise<User> {
    return this.prismaClient.user.upsert({
      where: { email },
      update: updateData,
      create: createData,
    });
  }

  /**
   * Finds a user by email with specific fields selected.
   * @param email - The email to search for
   * @param select - Optional fields to select
   * @returns The user with selected fields or null
   */
  async getUserByEmailWithSelect<T extends { id?: boolean; role?: boolean }>(
    email: string,
    select: T,
  ): Promise<Pick<User, keyof T extends keyof User ? keyof T : never> | null> {
    return this.prismaClient.user.findUnique({
      where: { email },
      select,
    }) as Promise<Pick<User, keyof T extends keyof User ? keyof T : never> | null>;
  }
}
