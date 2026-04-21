import { Prisma, User, UserRole, UserStatus, PrismaClient } from '@/prisma/client';
import { prisma } from '@/lib/prisma';
import { getPaginationMetadata } from '@/lib/utils';
import { BaseRepository, type ModelDelegateOperations } from '@/lib/baseRepository';
import type { CreateAccountData } from './account-repository';
import type { UserListItem, CreateUserForTenantInput } from '@/features/admin/users/types';
import type {
  UserListItem as TenantUserListItem,
  UserDetail,
  UserFilters,
  UserPagination,
} from '@/features/users/types';

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

  // -- Tenant-scoped user methods ------------------------------------------

  /**
   * Finds paginated tenant users with optional search and filters.
   * Excludes soft-deleted users.
   */
  async findTenantUsers(params: UserFilters, tenantId: string): Promise<UserPagination> {
    const { search, role, status, page, perPage, sort } = params;

    const where: Prisma.UserWhereInput = {
      tenantId,
      deletedAt: null,
    };

    if (search) {
      const filter: Prisma.StringFilter = {
        contains: search,
        mode: Prisma.QueryMode.insensitive,
      };
      where.OR = [
        { firstName: filter },
        { lastName: filter },
        { email: filter },
        { phone: filter },
      ];
    }

    if (role && role.length > 0) {
      where.role = { in: role };
    }

    if (status && status.length > 0) {
      where.status = { in: status };
    }

    const skip = page > 0 ? perPage * (page - 1) : 0;

    const orderBy: Prisma.UserOrderByWithRelationInput[] =
      sort && sort.length > 0
        ? sort.map(
            ({ id, desc }) =>
              ({ [id]: desc ? 'desc' : 'asc' }) as Prisma.UserOrderByWithRelationInput,
          )
        : [{ lastName: 'asc' }, { firstName: 'asc' }];

    const [items, totalItems] = await Promise.all([
      this.prismaClient.user.findMany({
        where,
        orderBy,
        skip,
        take: perPage,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          lastLoginAt: true,
          addedBy: { select: { firstName: true, lastName: true } },
        },
      }),
      this.prismaClient.user.count({ where }),
    ]);

    return {
      items: items,
      pagination: getPaginationMetadata(totalItems, perPage, page),
    };
  }

  /**
   * Finds a single user scoped to a tenant. Returns null if not found or deleted.
   */
  async findTenantUserById(id: string, tenantId: string): Promise<UserDetail | null> {
    const user = await this.prismaClient.user.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        isTwoFactorEnabled: true,
        lastLoginAt: true,
        addedBy: { select: { firstName: true, lastName: true } },
      },
    });

    return user;
  }

  /**
   * Updates editable fields on a tenant-scoped user.
   */
  async updateTenantUser(
    id: string,
    tenantId: string,
    data: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string | null;
      status: UserStatus;
      isTwoFactorEnabled: boolean;
    },
  ): Promise<UserDetail> {
    const user = await this.prismaClient.user.update({
      where: { id, tenantId, deletedAt: null },
      data,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        isTwoFactorEnabled: true,
        lastLoginAt: true,
        addedBy: { select: { firstName: true, lastName: true } },
      },
    });

    return user;
  }

  /**
   * Updates only the role of a tenant-scoped user.
   */
  async updateTenantUserRole(id: string, tenantId: string, role: UserRole): Promise<User> {
    return this.prismaClient.user.update({
      where: { id, tenantId },
      data: { role },
    });
  }

  /**
   * Soft-deletes a tenant-scoped user by setting deletedAt.
   */
  async softDeleteTenantUser(id: string, tenantId: string): Promise<boolean> {
    const result = await this.prismaClient.user.updateMany({
      where: { id, tenantId, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    return result.count > 0;
  }
}

// Singleton instance
export const userRepo = new UserRepository(prisma);
