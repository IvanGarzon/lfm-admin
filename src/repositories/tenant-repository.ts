import { Prisma, PrismaClient, Tenant, TenantStatus } from '@/prisma/client';
import { BaseRepository, type ModelDelegateOperations } from '@/lib/baseRepository';
import type {
  TenantListItem,
  TenantWithSettings,
  TenantBranding,
  CreateTenantInput,
  UpdateTenantInput,
  UpdateTenantSettingsInput,
} from '@/features/admin/tenants/types';

export class TenantRepository extends BaseRepository<Prisma.QuoteGetPayload<object>> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected get model(): ModelDelegateOperations<Prisma.QuoteGetPayload<object>> {
    return this.prisma.quote as unknown as ModelDelegateOperations<Prisma.QuoteGetPayload<object>>;
  }

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
   * Find a tenant by its slug.
   * @param slug - The unique slug identifier for the tenant.
   * @returns The tenant record or null if not found.
   */
  async findTenantBySlug(slug: string): Promise<Tenant | null> {
    return this.prisma.tenant.findUnique({ where: { slug } });
  }

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

  async createTenant(data: CreateTenantInput): Promise<Tenant> {
    return this.prisma.tenant.create({
      data: {
        name: data.name,
        slug: data.slug,
        settings: { create: {} },
      },
    });
  }

  async updateTenant(id: string, data: UpdateTenantInput): Promise<Tenant> {
    return this.prisma.tenant.update({ where: { id }, data });
  }

  async updateTenantSettings(tenantId: string, data: UpdateTenantSettingsInput): Promise<void> {
    await this.prisma.tenantSettings.upsert({
      where: { tenantId },
      create: { tenantId, ...data },
      update: data,
    });
  }

  async suspendTenant(id: string): Promise<Tenant> {
    return this.prisma.tenant.update({
      where: { id },
      data: { status: TenantStatus.SUSPENDED },
    });
  }

  async activateTenant(id: string): Promise<Tenant> {
    return this.prisma.tenant.update({
      where: { id },
      data: { status: TenantStatus.ACTIVE },
    });
  }

  async getTenantUserCount(tenantId: string): Promise<number> {
    return this.prisma.user.count({ where: { tenantId } });
  }

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
