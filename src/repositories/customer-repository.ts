import { Prisma, PrismaClient, CustomerStatus } from '@/prisma/client';
import { BaseRepository, type ModelDelegateOperations } from '@/lib/baseRepository';
import { getPaginationMetadata } from '@/lib/utils';
import type {
  CustomerPagination,
  CustomerListItem,
  CustomerFilters,
} from '@/features/customers/types';
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

  private mapToAddress(customer: any): AddressInput | null {
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
   * Search and paginate customers with filters
   * Follows the same pattern as employeeRepository.searchAndPaginate
   */
  async searchAndPaginate(params: CustomerFilters): Promise<CustomerPagination> {
    const { search, status, page, perPage, sort } = params;

    const whereClause: Prisma.CustomerWhereInput = {
      deletedAt: null,
    };

    if (status && status.length > 0) {
      whereClause.status = {
        in: status,
      };
    }

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
   * Find customer by ID with detailed relations
   */
  async findByIdWithDetails(id: string): Promise<CustomerListItem | null> {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
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
   * Find customer by email
   */
  async findByEmail(email: string) {
    return this.prisma.customer.findUnique({
      where: { email },
    });
  }

  /**
   * Get active customers for selection lists
   */
  async findActiveSelection() {
    return this.prisma.customer.findMany({
      where: {
        deletedAt: null,
        status: 'ACTIVE',
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
   * Create customer
   */
  async createCustomer(data: CreateCustomerInput) {
    const { organizationId, useOrganizationAddress, ...customerData } = data;

    // If using organization address, don't store customer address
    const addressData = useOrganizationAddress ? {} : customerData.address || {};

    return this.prisma.customer.create({
      data: {
        firstName: customerData.firstName,
        lastName: customerData.lastName,
        email: customerData.email,
        phone: customerData.phone,
        gender: customerData.gender,
        organizationId: organizationId || null,
        useOrganizationAddress: useOrganizationAddress ?? false,
        status: 'ACTIVE',
        ...addressData,
      },
    });
  }

  /**
   * Update customer
   */
  async updateCustomer(
    id: string,
    data: UpdateCustomerInput,
    updatedBy?: string,
  ): Promise<CustomerListItem | null> {
    const { organizationId, useOrganizationAddress, ...updateData } = data;

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

    const updatedCustomer = await this.prisma.customer.update({
      where: { id },
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

    if (!updatedCustomer) {
      return null;
    }

    return await this.findByIdWithDetails(updatedCustomer.id);
  }

  /**
   * Soft delete customer
   */
  async softDelete(id: string) {
    return this.prisma.customer.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: CustomerStatus.DELETED,
      },
    });
  }
}
