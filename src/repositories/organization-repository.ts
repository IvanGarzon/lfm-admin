import { Prisma, PrismaClient } from '@/prisma/client';
import { BaseRepository, type ModelDelegateOperations } from '@/lib/baseRepository';
import type { CreateOrganizationInput, UpdateOrganizationInput } from '@/schemas/organizations';
import type {
  OrganizationListItem,
  OrganizationPagination,
  OrganizationFilters,
} from '@/features/organizations/types';
import { getPaginationMetadata } from '@/lib/utils';

/**
 * Organization Repository
 * Handles all database operations for organizations
 * Extends BaseRepository for common CRUD operations
 */
export class OrganizationRepository extends BaseRepository<Prisma.OrganizationGetPayload<object>> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected get model(): ModelDelegateOperations<Prisma.OrganizationGetPayload<object>> {
    return this.prisma.organization as unknown as ModelDelegateOperations<
      Prisma.OrganizationGetPayload<object>
    >;
  }

  /**
   * Search and paginate organizations with advanced filtering capabilities.
   * Supports full-text search across organization name, phone, email, and ABN,
   * status filtering, sorting, and pagination.
   */
  async searchAndPaginate(params: OrganizationFilters): Promise<OrganizationPagination> {
    const { name, status, page, perPage, sort } = params;

    const whereClause: Prisma.OrganizationWhereInput = {
      deletedAt: null,
    };

    // Status filter
    if (status && status.length > 0) {
      whereClause.status = {
        in: status,
      };
    }

    // Name search filter
    if (name) {
      const searchFilter: Prisma.StringFilter = {
        contains: name,
        mode: Prisma.QueryMode.insensitive,
      };

      whereClause.OR = [
        { name: searchFilter },
        { phone: searchFilter },
        { email: searchFilter },
        { abn: searchFilter },
      ];
    }

    const skip = page > 0 ? perPage * (page - 1) : 0;

    const orderBy: Prisma.OrganizationOrderByWithRelationInput[] =
      sort && sort.length > 0
        ? sort.map((sortItem) => {
            const order: Prisma.SortOrder = sortItem.desc ? 'desc' : 'asc';
            if (sortItem.id === 'customersCount') {
              return { customers: { _count: order } };
            }

            return { [sortItem.id]: order };
          })
        : [{ name: 'asc' }];

    const countOperation = this.prisma.organization.count({ where: whereClause });
    const findManyOperation = this.prisma.organization.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        state: true,
        postcode: true,
        country: true,
        phone: true,
        email: true,
        website: true,
        abn: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        _count: {
          select: {
            customers: true,
          },
        },
      },
      orderBy,
      skip,
      take: perPage,
    });

    // Run count and query in parallel
    const [totalItems, organizations] = await Promise.all([countOperation, findManyOperation]);

    const items: OrganizationListItem[] = organizations.map((organization) => ({
      id: organization.id,
      name: organization.name,
      address: organization.address,
      city: organization.city,
      state: organization.state,
      postcode: organization.postcode,
      country: organization.country,
      phone: organization.phone,
      email: organization.email,
      website: organization.website,
      abn: organization.abn,
      status: organization.status,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
      deletedAt: organization.deletedAt,
      customersCount: organization._count.customers ?? 0,
    }));

    const pagination = getPaginationMetadata(totalItems, perPage, page);

    return {
      items,
      pagination,
    };
  }

  /**
   * Find organization by ID with detailed relations
   */
  async findByIdWithDetails(id: string): Promise<OrganizationListItem | null> {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        state: true,
        postcode: true,
        country: true,
        phone: true,
        email: true,
        website: true,
        abn: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        _count: {
          select: {
            customers: true,
          },
        },
      },
    });

    if (!organization) {
      return null;
    }

    return {
      id: organization.id,
      name: organization.name,
      address: organization.address,
      city: organization.city,
      state: organization.state,
      postcode: organization.postcode,
      country: organization.country,
      phone: organization.phone,
      email: organization.email,
      website: organization.website,
      abn: organization.abn,
      status: organization.status,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
      deletedAt: organization.deletedAt,
      customersCount: organization._count.customers ?? 0,
    };
  }

  /**
   * Get all organizations for selection lists
   */
  async findAllForSelection() {
    return this.prisma.organization.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * Find organization by name
   */
  async findByName(name: string) {
    return this.prisma.organization.findFirst({
      where: {
        name: {
          equals: name,
          mode: Prisma.QueryMode.insensitive,
        },
      },
    });
  }

  /**
   * Create organization with address data
   */
  async createOrganization(data: CreateOrganizationInput) {
    return this.prisma.organization.create({
      data: {
        name: data.name,
        address: data.address,
        city: data.city,
        state: data.state,
        postcode: data.postcode,
        country: data.country,
        phone: data.phone,
        email: data.email,
        website: data.website,
        abn: data.abn,
        status: data.status,
      },
    });
  }

  /**
   * Find or create organization by name
   * Returns existing organization if found, otherwise creates new one
   */
  async findOrCreate(name: string) {
    const existing = await this.findByName(name);
    if (existing) {
      return existing;
    }

    return this.prisma.organization.create({
      data: { name },
    });
  }

  /**
   * Update organization
   */
  async updateOrganization(
    id: string,
    data: UpdateOrganizationInput,
  ): Promise<OrganizationListItem | null> {
    const updatedOrganization = await this.prisma.organization.update({
      where: { id },
      data: {
        name: data.name,
        address: data.address,
        city: data.city,
        state: data.state,
        postcode: data.postcode,
        country: data.country,
        phone: data.phone,
        email: data.email,
        website: data.website,
        abn: data.abn,
        status: data.status,
      },
    });

    if (!updatedOrganization) {
      return null;
    }

    return await this.findByIdWithDetails(updatedOrganization.id);
  }

  /**
   * Delete organization (hard delete)
   * Note: This will fail if the organization has related customers
   */
  async deleteOrganization(id: string) {
    return this.prisma.organization.delete({
      where: { id },
    });
  }
}
