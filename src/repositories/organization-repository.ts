import { Prisma, PrismaClient } from '@/prisma/client';
import { BaseRepository, type ModelDelegateOperations } from '@/lib/baseRepository';
import type { CreateOrganizationInput, UpdateOrganizationInput } from '@/schemas/organizations';
import type {
  OrganizationListItem,
  OrganizationPagination,
  OrganizationFilters,
} from '@/features/crm/organizations/types';
import { OrganizationStatus } from '@/prisma/client';
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
  /**
   * Search and paginate organizations with advanced filtering capabilities.
   * Supports full-text search across organization name, phone, email, and ABN,
   * status filtering, sorting, and pagination.
   * @param params - Filter parameters for the search
   * @param params.name - Search term for name, phone, email, or ABN
   * @param params.status - Optional array of statuses to filter by
   * @param params.page - Current page number (1-indexed)
   * @param params.perPage - Number of organizations per page
   * @param params.sort - Sorting criteria (supports custom sorting by metadata like customer count)
   * @returns Paginated results containing organization list items and metadata
   */
  async searchOrganizations(
    params: OrganizationFilters,
    tenantId: string,
  ): Promise<OrganizationPagination> {
    const { name, status, page, perPage, sort } = params;

    const whereClause: Prisma.OrganizationWhereInput = {
      tenantId,
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
   * Find an organization by its unique ID.
   * Includes detailed fields and a count of related customers.
   * @param id - The organization ID
   * @returns Organization details or null if not found
   */
  async findOrganizationById(id: string, tenantId: string): Promise<OrganizationListItem | null> {
    const organization = await this.prisma.organization.findUnique({
      where: { id, tenantId },
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
   * Retrieves all organizations with minimal fields for selection components.
   * Useful for population of dropdowns and searchable lists.
   * @returns Array of organization objects (id and name)
   */
  async findActiveOrganizations(tenantId: string): Promise<OrganizationListItem[]> {
    const rows = await this.prisma.organization.findMany({
      where: { tenantId, deletedAt: null, status: OrganizationStatus.ACTIVE },
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
        _count: { select: { customers: true } },
      },
      orderBy: { name: 'asc' },
    });

    return rows.map((row) => ({
      ...row,
      customersCount: row._count.customers,
    }));
  }

  /**
   * Locates an organization by its name using a case-insensitive search.
   * @param name - The organization name to search for
   * @returns The organization object or null
   */
  async findOrganizationByName(name: string, tenantId: string) {
    return this.prisma.organization.findFirst({
      where: {
        tenantId,
        name: {
          equals: name,
          mode: Prisma.QueryMode.insensitive,
        },
      },
    });
  }

  /**
   * Creates a new organization record.
   * @param data - The organization creation input data
   * @returns The newly created organization
   */
  async createOrganization(data: CreateOrganizationInput, tenantId: string) {
    return this.prisma.organization.create({
      data: {
        tenantId,
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
   * Finds an organization by name or creates it if it doesn't exist.
   * Useful for importer logic or quick-add features.
   * @param name - The organization name
   * @returns The existing or newly created organization
   */
  async findOrCreateOrganization(name: string, tenantId: string) {
    const existing = await this.findOrganizationByName(name, tenantId);
    if (existing) {
      return existing;
    }

    return this.prisma.organization.create({
      data: { tenantId, name },
    });
  }

  /**
   * Updates an existing organization record.
   * @param id - The ID of the organization to update
   * @param tenantId - The ID of the tenant
   * @param data - The updated organization data
   * @returns The updated organization with detailed fields or null if update failed
   */
  async updateOrganization(
    id: string,
    tenantId: string,
    data: UpdateOrganizationInput,
  ): Promise<OrganizationListItem | null> {
    const updatedOrganization = await this.prisma.organization.update({
      where: { id, tenantId },
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

    return await this.findOrganizationById(updatedOrganization.id, tenantId);
  }

  /**
   * Permanently removes an organization record from the database.
   * @param id - The ID of the organization to delete
   * @param tenantId - The ID of the tenant
   * @returns The deleted organization (Prisma record)
   * @throws Will throw if there are foreign key constraint violations (e.g., related customers)
   */
  async deleteOrganization(id: string, tenantId: string) {
    return this.prisma.organization.delete({
      where: { id, tenantId },
    });
  }
}
