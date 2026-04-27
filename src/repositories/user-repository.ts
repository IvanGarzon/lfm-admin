import { Prisma, User, UserRole, UserStatus, PrismaClient } from '@/prisma/client';
import { getPaginationMetadata } from '@/lib/utils';
import { BaseRepository, type ModelDelegateOperations } from '@/lib/baseRepository';
import type { CreateAccountData } from './account-repository';
import type { UserListItem, CreateUserForTenantInput } from '@/features/admin/users/types';
import type { UserDetail, UserFilters, UserPagination } from '@/features/users/types';

/**
 * User Repository
 * Handles all database operations for users
 * Extends BaseRepository for common CRUD operations
 */
export class UserRepository extends BaseRepository<User> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected get model(): ModelDelegateOperations<User> {
    return this.prisma.user as unknown as ModelDelegateOperations<Prisma.UserGetPayload<object>>;
  }

  /**
   * Finds a user by email address.
   * @param email - The email address to look up
   * @returns The matching user, or null if not found
   */
  async getUserByEmail(email: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Creates a user and linked OAuth account in a single transaction.
   * @param userData - Core user fields
   * @param accountData - OAuth account details to associate with the user
   * @returns The newly created user record
   */
  async createUserWithAccount(
    userData: {
      firstName: string;
      lastName: string;
      email?: string | null;
      avatarUrl?: string | null;
    },
    accountData: CreateAccountData,
  ): Promise<User> {
    return await this.prisma.$transaction(async (tx) => {
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
   * Upserts a user by email — updates avatar/emailVerified if found, creates the record otherwise.
   * @param email - The email address used as the unique key
   * @param updateData - Fields to update when the user already exists
   * @param createData - Full user data to use when creating a new record
   * @returns The upserted user record
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
    return this.prisma.user.upsert({
      where: { email },
      update: updateData,
      create: createData,
    });
  }

  /**
   * Finds a user by email with a caller-specified field selection.
   * @param email - The email address to look up
   * @param select - Prisma select object controlling which fields are returned
   * @returns The user with only the requested fields, or null if not found
   */
  async getUserByEmailWithSelect<T extends { id?: boolean; role?: boolean }>(
    email: string,
    select: T,
  ): Promise<Pick<User, keyof T extends keyof User ? keyof T : never> | null> {
    return this.prisma.user.findUnique({
      where: { email },
      select,
    }) as Promise<Pick<User, keyof T extends keyof User ? keyof T : never> | null>;
  }

  /**
   * Finds a user by ID returning only the fields specified in `select`.
   * @param id - The user's ID
   * @param select - Prisma select object controlling which fields are returned
   * @returns The selected user fields or null if not found
   */
  async getUserByIdWithSelect<T extends Prisma.UserSelect>(
    id: string,
    select: T,
  ): Promise<Prisma.UserGetPayload<{ select: T }> | null> {
    return this.prisma.user.findUnique({ where: { id }, select }) as Promise<Prisma.UserGetPayload<{
      select: T;
    }> | null>;
  }

  /**
   * Returns all users belonging to a tenant, ordered by last name then first name.
   * @param tenantId - The tenant to scope the query to
   * @returns An array of user list items for the tenant
   */
  async findByTenant(tenantId: string): Promise<UserListItem[]> {
    return this.prisma.user.findMany({
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

  /**
   * Returns all users across all tenants, ordered by last name then first name.
   * Super-admin operation — not scoped to a single tenant.
   * @returns An array of all user list items with their tenant details
   */
  async findAllWithTenant(): Promise<UserListItem[]> {
    return this.prisma.user.findMany({
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

  /**
   * Creates a new user assigned to a specific tenant.
   * @param data - User creation input including tenant assignment and role
   * @returns The newly created user record
   */
  async createForTenant(data: CreateUserForTenantInput): Promise<User> {
    return this.prisma.user.create({
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

  /**
   * Updates the role of a user by ID.
   * Not tenant-scoped — use updateTenantUserRole for tenant-context operations.
   * @param id - The user ID to update
   * @param role - The new role to assign
   * @returns The updated user record
   */
  async updateRole(id: string, role: UserRole): Promise<User> {
    return this.prisma.user.update({ where: { id }, data: { role } });
  }

  /**
   * Reassigns a user to a different tenant. Super-admin operation only.
   * @param id - The user ID to reassign
   * @param tenantId - The target tenant ID
   * @returns The updated user record
   */
  async reassignTenant(id: string, tenantId: string): Promise<User> {
    return this.prisma.user.update({ where: { id }, data: { tenantId } });
  }

  // -- Tenant-scoped user methods ------------------------------------------

  /**
   * Finds paginated tenant users with optional search and filters.
   * Excludes soft-deleted users. Supports full-text search across name, email, and phone.
   * @param params - Filter, sort, and pagination parameters
   * @param tenantId - The tenant to scope the query to
   * @returns A paginated result with user list items and pagination metadata
   */
  async searchAndPaginateTenantUsers(
    params: UserFilters,
    tenantId: string,
  ): Promise<UserPagination> {
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
        ? sort.map((sortItem) => ({ [sortItem.id]: sortItem.desc ? 'desc' : 'asc' }))
        : [{ lastName: 'asc' }, { firstName: 'asc' }];

    const [items, totalItems] = await Promise.all([
      this.prisma.user.findMany({
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
      this.prisma.user.count({ where }),
    ]);

    return {
      items: items,
      pagination: getPaginationMetadata(totalItems, perPage, page),
    };
  }

  /**
   * Finds a single user scoped to a tenant. Excludes soft-deleted records.
   * @param id - The user ID to look up
   * @param tenantId - The tenant to scope the query to
   * @returns The user detail, or null if not found or soft-deleted
   */
  async findTenantUserById(id: string, tenantId: string): Promise<UserDetail | null> {
    const user = await this.prisma.user.findFirst({
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
        username: true,
        title: true,
        bio: true,
        addedBy: { select: { firstName: true, lastName: true } },
      },
    });

    return user;
  }

  /**
   * Updates editable fields on a tenant-scoped user. Only operates on non-deleted records.
   * @param id - The user ID to update
   * @param tenantId - The tenant to scope the update to
   * @param data - The fields to update
   * @returns The updated user detail
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
      isTwoFactorEnabled?: boolean;
      username?: string | null;
      title?: string | null;
      bio?: string | null;
    },
  ): Promise<UserDetail> {
    const user = await this.prisma.user.update({
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
        username: true,
        title: true,
        bio: true,
        addedBy: { select: { firstName: true, lastName: true } },
      },
    });

    return user;
  }

  /**
   * Updates only the role of a tenant-scoped user.
   * @param id - The user ID to update
   * @param tenantId - The tenant to scope the update to
   * @param role - The new role to assign
   * @returns The updated user record
   */
  async updateTenantUserRole(id: string, tenantId: string, role: UserRole): Promise<User> {
    return this.prisma.user.update({
      where: { id, tenantId },
      data: { role },
    });
  }

  /**
   * Soft-deletes a tenant-scoped user by setting deletedAt to the current timestamp.
   * @param id - The user ID to soft-delete
   * @param tenantId - The tenant to scope the operation to
   * @returns True if the user was deleted, false if not found or already deleted
   */
  async softDeleteTenantUser(id: string, tenantId: string): Promise<boolean> {
    const result = await this.prisma.user.updateMany({
      where: { id, tenantId, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    return result.count > 0;
  }

  /**
   * Updates the lastLoginAt timestamp for a user to the current time.
   * @param id - The user ID to update
   * @returns Promise that resolves when the update is complete
   */
  /**
   * Updates the hashed password for a user.
   * @param id - The user ID to update
   * @param hashedPassword - The new bcrypt-hashed password
   * @returns Promise that resolves when the update is complete
   */
  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  async updateLastLoginAt(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }
}
