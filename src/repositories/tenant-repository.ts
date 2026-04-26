import { Prisma, PrismaClient, Tenant, TenantStatus } from '@/prisma/client';
import { BaseRepository, type ModelDelegateOperations } from '@/lib/baseRepository';
import type {
  CreateTenantInput,
  UpdateTenantInput,
  UpdateTenantSettingsInput,
} from '@/schemas/tenants';
import type {
  TenantListItem,
  TenantWithSettings,
  TenantBranding,
  TenantWithDetails,
} from '@/features/admin/tenants/types';

export class TenantRepository extends BaseRepository<Prisma.TenantGetPayload<object>> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected get model(): ModelDelegateOperations<Prisma.TenantGetPayload<object>> {
    return this.prisma.tenant as unknown as ModelDelegateOperations<
      Prisma.TenantGetPayload<object>
    >;
  }

  /**
   * Returns all tenants with a summary of their user count.
   * @param opts - Optional filter by tenant status.
   * @returns A list of tenant list items.
   */
  async findAll(opts?: { status?: TenantStatus }): Promise<TenantListItem[]> {
    const where: Prisma.TenantWhereInput = {};
    if (opts?.status) {
      where.status = opts.status;
    }

    const tenants = await this.prisma.tenant.findMany({
      where,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        slug: true,
        name: true,
        status: true,
        createdAt: true,
        _count: { select: { users: true } },
      },
    });

    return tenants.map((t) => ({
      id: t.id,
      slug: t.slug,
      name: t.name,
      status: t.status,
      createdAt: t.createdAt,
      userCount: t._count.users,
    }));
  }

  /**
   * Find a tenant by its unique slug.
   * @param slug - The slug to look up.
   * @returns The tenant record or null if not found.
   */
  async findTenantBySlug(slug: string): Promise<Tenant | null> {
    return this.prisma.tenant.findUnique({ where: { slug } });
  }

  /**
   * Find a tenant by its ID, including its settings.
   * @param id - The tenant ID.
   * @returns The tenant with settings, or null if not found.
   */
  async findTenantById(id: string): Promise<TenantWithSettings | null> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      select: {
        id: true,
        slug: true,
        name: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        settings: {
          select: {
            id: true,
            logoUrl: true,
            abn: true,
            email: true,
            phone: true,
            website: true,
            bankName: true,
            bsb: true,
            accountNumber: true,
            accountName: true,
            address: true,
            city: true,
            state: true,
            postcode: true,
            country: true,
          },
        },
      },
    });

    if (!tenant) return null;

    return {
      ...tenant,
      settings: tenant.settings
        ? { ...tenant.settings, state: tenant.settings.state ?? null }
        : null,
    };
  }

  /**
   * Creates a new tenant with an empty settings record.
   * Use createTenantWithDetails when initial settings or users are required.
   * @param data - The tenant name and slug.
   * @returns The created tenant record.
   */
  async createTenant(data: CreateTenantInput): Promise<Tenant> {
    return this.prisma.tenant.create({
      data: {
        name: data.name,
        slug: data.slug,
        settings: { create: {} },
      },
    });
  }

  /**
   * Creates a tenant together with its settings and an optional initial set of users
   * in a single database transaction. Intended for seeding and super-admin provisioning.
   * @param data - The tenant details, optional settings, and optional user records.
   * @returns The created tenant with its settings.
   */
  async createTenantWithDetails(data: TenantWithDetails): Promise<TenantWithSettings> {
    const tenant = await this.prisma.tenant.create({
      data: {
        name: data.name,
        slug: data.slug,
        settings: {
          create: data.settings ?? {},
        },
        users: data.users
          ? {
              createMany: {
                data: data.users.map((u) => ({
                  firstName: u.firstName,
                  lastName: u.lastName,
                  email: u.email,
                  password: u.hashedPassword,
                  role: u.role,
                })),
              },
            }
          : undefined,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        settings: {
          select: {
            id: true,
            logoUrl: true,
            abn: true,
            email: true,
            phone: true,
            website: true,
            bankName: true,
            bsb: true,
            accountNumber: true,
            accountName: true,
            address: true,
            city: true,
            state: true,
            postcode: true,
            country: true,
          },
        },
      },
    });

    return {
      ...tenant,
      settings: tenant.settings
        ? { ...tenant.settings, state: tenant.settings.state ?? null }
        : null,
    };
  }

  /**
   * Updates top-level tenant fields (name, slug).
   * @param id - The tenant ID.
   * @param data - Fields to update.
   * @returns The updated tenant record.
   */
  async updateTenant(id: string, data: UpdateTenantInput): Promise<Tenant> {
    return this.prisma.tenant.update({ where: { id }, data });
  }

  /**
   * Upserts the settings record for a tenant.
   * @param tenantId - The tenant to update settings for.
   * @param data - The settings fields to apply.
   */
  async updateTenantSettings(tenantId: string, data: UpdateTenantSettingsInput): Promise<void> {
    await this.prisma.tenantSettings.upsert({
      where: { tenantId },
      create: { tenantId, ...data },
      update: data,
    });
  }

  /**
   * Suspends a tenant, preventing its users from accessing the system.
   * @param id - The tenant ID.
   * @returns The updated tenant record.
   */
  async suspendTenant(id: string): Promise<Tenant> {
    return this.prisma.tenant.update({
      where: { id },
      data: { status: TenantStatus.SUSPENDED },
    });
  }

  /**
   * Re-activates a previously suspended tenant.
   * @param id - The tenant ID.
   * @returns The updated tenant record.
   */
  async activateTenant(id: string): Promise<Tenant> {
    return this.prisma.tenant.update({
      where: { id },
      data: { status: TenantStatus.ACTIVE },
    });
  }

  /**
   * Returns the number of users belonging to a tenant.
   * @param tenantId - The tenant ID.
   * @returns The user count.
   */
  async getTenantUserCount(tenantId: string): Promise<number> {
    return this.prisma.user.count({ where: { tenantId } });
  }

  /**
   * Returns the branding and business details for a tenant, used across
   * invoice/quote templates, email footers, and previews.
   * @param tenantId - The tenant ID.
   * @returns The branding record, or null if the tenant does not exist.
   */
  async findBranding(tenantId: string): Promise<TenantBranding | null> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        name: true,
        settings: {
          select: {
            email: true,
            phone: true,
            abn: true,
            logoUrl: true,
            website: true,
            bankName: true,
            bsb: true,
            accountNumber: true,
            accountName: true,
            address: true,
            city: true,
            state: true,
            postcode: true,
            country: true,
          },
        },
      },
    });

    if (!tenant) return null;

    const s = tenant.settings;
    return {
      name: tenant.name,
      email: s?.email ?? null,
      phone: s?.phone ?? null,
      abn: s?.abn ?? null,
      logoUrl: s?.logoUrl ?? null,
      website: s?.website ?? null,
      bankName: s?.bankName ?? null,
      bsb: s?.bsb ?? null,
      accountNumber: s?.accountNumber ?? null,
      accountName: s?.accountName ?? tenant.name,
      address: s?.address ?? null,
      city: s?.city ?? null,
      state: s?.state ?? null,
      postcode: s?.postcode ?? null,
      country: s?.country ?? null,
    };
  }
}
