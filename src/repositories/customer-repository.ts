import { Prisma, PrismaClient, CustomerStatus } from '@/prisma/client';
import { BaseRepository, type ModelDelegateOperations } from '@/lib/baseRepository';
import { getPaginationMetadata } from '@/lib/utils';
import type {
  CustomerPagination,
  CustomerListItem,
  CustomerFilters,
} from '@/features/crm/customers/types';
import type { CreateCustomerInput, UpdateCustomerInput } from '@/schemas/customers';
import type { AddressInput } from '@/schemas/address';

/**
 * Customer Repository
 * Handles all database operations for customers
 * Extends BaseRepository for common CRUD operations
 */
export class CustomerRepository extends BaseRepository<Prisma.CustomerGetPayload<object>> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected get model(): ModelDelegateOperations<Prisma.CustomerGetPayload<object>> {
    return this.prisma.customer as unknown as ModelDelegateOperations<
      Prisma.CustomerGetPayload<object>
    >;
  }

  /**
   * Maps raw database customer fields to a structured AddressInput object.
   * @param customer - The raw customer object from Prisma
   * @returns An AddressInput object if address information exists, otherwise null
   * @private
   */
  private mapToAddress(customer: {
    address1: string | null;
    address2?: string | null;
    city?: string | null;
    region?: string | null;
    postalCode?: string | null;
    country?: string | null;
    lat?: number | null;
    lng?: number | null;
    formattedAddress?: string | null;
  }): AddressInput | null {
    if (!customer.address1) {
      return null;
    }

    return {
      address1: customer.address1,
      address2: customer.address2 ?? '',
      city: customer.city ?? '',
      region: customer.region ?? '',
      postalCode: customer.postalCode ?? '',
      country: customer.country ?? 'Australia',
      lat: Number(customer.lat) ?? 0,
      lng: Number(customer.lng) ?? 0,
      formattedAddress: customer.formattedAddress ?? '',
    };
  }

  /**
   * Search and paginate customers with advanced filtering capabilities.
   * Supports full-text search across name, email, phone, and organization,
   * status filtering, and custom sorting.
   * @param params - Filter parameters for the search
   * @param params.search - Optional search term
   * @param params.status - Optional array of customer statuses to filter by
   * @param params.page - Page number for pagination (1-indexed)
   * @param params.perPage - Number of items per page
   * @param params.sort - Optional array of sort criteria
   * @returns A promise that resolves to paginated customer results with metadata
   * @example
   * const result = await repo.searchAndPaginate({
   *   search: "Acme",
   *   status: ["ACTIVE"],
   *   page: 1,
   *   perPage: 20
   * });
   */
  async searchCustomers(params: CustomerFilters, tenantId: string): Promise<CustomerPagination> {
    const { search, status, page, perPage, sort } = params;

    const whereClause: Prisma.CustomerWhereInput = {
      tenantId,
      deletedAt: null,
    };

    if (search) {
      const searchFilter: Prisma.StringFilter = {
        contains: search,
        mode: Prisma.QueryMode.insensitive,
      };

      whereClause.OR = [
        { firstName: searchFilter },
        { lastName: searchFilter },
        { email: searchFilter },
        { phone: searchFilter },
        { organization: { name: searchFilter } },
      ];
    }

    if (status && status.length > 0) {
      whereClause.status = {
        in: status,
      };
    }

    const skip = page > 0 ? perPage * (page - 1) : 0;

    const orderBy: Prisma.CustomerOrderByWithRelationInput[] =
      sort && sort.length > 0
        ? sort.map((sortItem) => {
            const order: Prisma.SortOrder = sortItem.desc ? 'desc' : 'asc';
            if (sortItem.id === 'organization') {
              return { organization: { name: order } };
            }

            return { [sortItem.id]: order };
          })
        : [{ createdAt: 'desc' }];

    const countOperation = this.prisma.customer.count({ where: whereClause });
    const findManyOperation = this.prisma.customer.findMany({
      where: whereClause,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            invoices: true,
            quotes: true,
          },
        },
      },
      orderBy,
      skip,
      take: perPage,
    });

    // Run count and query in parallel without transaction
    // These are read-only operations so transaction isn't necessary
    const [totalItems, customers] = await Promise.all([countOperation, findManyOperation]);

    const items: CustomerListItem[] = customers.map((customer) => ({
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer?.phone,
      gender: customer.gender,
      status: customer.status,
      organizationId: customer?.organization?.id ?? null,
      organizationName: customer?.organization?.name ?? null,
      useOrganizationAddress: customer.useOrganizationAddress,
      createdAt: customer.createdAt,
      deletedAt: customer.deletedAt ?? null,
      invoicesCount: customer._count.invoices ?? 0,
      quotesCount: customer._count.quotes ?? 0,
      address: this.mapToAddress(customer),
    }));

    return {
      items,
      pagination: getPaginationMetadata(totalItems, perPage, page),
    };
  }

  /**
   * Find a customer by ID with detailed relationship data.
   * Includes organization details and counts of invoices/quotes.
   * @param id - The unique identifier of the customer
   * @returns A promise that resolves to the customer details or null if not found
   */
  async findCustomerById(id: string, tenantId: string): Promise<CustomerListItem | null> {
    const customer = await this.prisma.customer.findUnique({
      where: { id, tenantId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        gender: true,
        status: true,
        createdAt: true,
        deletedAt: true,
        useOrganizationAddress: true,
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            invoices: true,
            quotes: true,
          },
        },
        address1: true,
        address2: true,
        city: true,
        region: true,
        postalCode: true,
        country: true,
        lat: true,
        lng: true,
        formattedAddress: true,
      },
    });

    if (!customer) {
      return null;
    }

    return {
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer?.phone,
      gender: customer.gender,
      status: customer.status,
      organizationId: customer?.organization?.id ?? null,
      organizationName: customer?.organization?.name ?? null,
      useOrganizationAddress: customer.useOrganizationAddress,
      createdAt: customer.createdAt,
      deletedAt: customer.deletedAt ?? null,
      invoicesCount: customer._count.invoices ?? 0,
      quotesCount: customer._count.quotes ?? 0,
      address: this.mapToAddress(customer),
    };
  }

  /**
   * Find a single customer by their email address.
   * @param email - The email address to search for
   * @returns A promise that resolves to the customer or null
   */
  async findCustomerByEmail(email: string, tenantId: string) {
    return this.prisma.customer.findFirst({
      where: { email, tenantId },
    });
  }

  /**
   * Get a list of active customers for population of selection components.
   * Returns a minimal set of fields needed for dropdowns and pickers.
   * @returns A promise that resolves to an array of active customer summaries
   */
  async findActiveCustomers(tenantId: string) {
    return this.prisma.customer.findMany({
      where: {
        tenantId,
        deletedAt: null,
        status: CustomerStatus.ACTIVE,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        firstName: 'asc',
      },
    });
  }

  /**
   * Create a new customer record.
   * Automatically handles address logic based on organization settings.
   * @param data - The customer creation input data
   * @returns A promise that resolves to the newly created customer
   */
  async createCustomer(data: CreateCustomerInput, tenantId: string) {
    const { organizationId, useOrganizationAddress, ...customerData } = data;

    // If using organisation address, don't store customer address
    const addressData = useOrganizationAddress ? {} : customerData.address || {};

    return this.prisma.customer.create({
      data: {
        tenantId,
        firstName: customerData.firstName,
        lastName: customerData.lastName,
        email: customerData.email,
        phone: customerData.phone,
        gender: customerData.gender,
        organizationId: organizationId || null,
        useOrganizationAddress: useOrganizationAddress ?? false,
        status: CustomerStatus.ACTIVE,
        ...addressData,
      },
    });
  }

  /**
   * Update an existing customer record.
   * Handles complex address updates and organization connections.
   * @param id - The unique identifier of the customer
   * @param data - The update data
   * @param updatedBy - Optional identifier of the user making the update
   * @returns A promise that resolves to the updated customer with details, or null if update failed
   */
  async updateCustomer(
    id: string,
    tenantId: string,
    data: UpdateCustomerInput,
  ): Promise<CustomerListItem | null> {
    const {
      id: _,
      organizationId,
      organizationName: _orgName,
      useOrganizationAddress,
      ...updateData
    } = data;

    const { address, ...restUpdateData } = updateData;

    // If using organization address, clear customer address fields
    const addressData = useOrganizationAddress
      ? {
          address1: null,
          address2: null,
          city: null,
          region: null,
          postalCode: null,
          country: null,
          lat: null,
          lng: null,
          formattedAddress: null,
        }
      : address || {
          address1: null,
          address2: null,
          city: null,
          region: null,
          postalCode: null,
          country: null,
          lat: null,
          lng: null,
          formattedAddress: null,
        };

    try {
      const updatedCustomer = await this.prisma.customer.update({
        where: { id, tenantId },
        data: {
          ...restUpdateData,
          ...addressData,
          useOrganizationAddress: useOrganizationAddress ?? false,
          organization: organizationId ? { connect: { id: organizationId } } : { disconnect: true },
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return await this.findCustomerById(updatedCustomer.id, tenantId);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Performs a soft delete on a customer by setting deletedAt and updating status.
   * @param id - The unique identifier of the customer to delete
   * @returns A promise that resolves to the soft-deleted customer
   */
  async softDeleteCustomer(id: string, tenantId: string) {
    return this.prisma.customer.update({
      where: { id, tenantId },
      data: {
        deletedAt: new Date(),
        status: CustomerStatus.DELETED,
      },
    });
  }
}
