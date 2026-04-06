import { Prisma, User, UserRole, PrismaClient } from '@/prisma/client';
import { prisma } from '@/lib/prisma';
import { BaseRepository, type ModelDelegateOperations } from '@/lib/baseRepository';
import type { CreateAccountData } from './account-repository';
import type { UserListItem, CreateUserForTenantInput } from '@/features/admin/users/types';

export type { UserListItem, CreateUserForTenantInput };

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

  async getUserByEmail(email: string): Promise<User | null> {
    return await this.prismaClient.user.findUnique({
      where: { email },
    });
  }

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

  async getUserByEmailWithSelect<T extends { id?: boolean; role?: boolean }>(
    email: string,
    select: T,
  ): Promise<Pick<User, keyof T extends keyof User ? keyof T : never> | null> {
    return this.prismaClient.user.findUnique({
      where: { email },
      select,
    }) as Promise<Pick<User, keyof T extends keyof User ? keyof T : never> | null>;
  }

  async findByTenant(tenantId: string): Promise<UserListItem[]> {
    return this.prismaClient.user.findMany({
      where: { tenantId },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        tenantId: true,
        tenant: { select: { name: true } },
      },
    });
  }

  async findAllWithTenant(): Promise<UserListItem[]> {
    return this.prismaClient.user.findMany({
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        tenantId: true,
        tenant: { select: { name: true } },
      },
    });
  }

  async createForTenant(data: CreateUserForTenantInput): Promise<User> {
    return this.prismaClient.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        role: data.role,
        tenantId: data.tenantId,
        password: data.password,
      },
    });
  }

  async updateRole(id: string, role: UserRole): Promise<User> {
    return this.prismaClient.user.update({ where: { id }, data: { role } });
  }

  async reassignTenant(id: string, tenantId: string): Promise<User> {
    return this.prismaClient.user.update({ where: { id }, data: { tenantId } });
  }
}

// Singleton instance
export const userRepo = new UserRepository(prisma);
