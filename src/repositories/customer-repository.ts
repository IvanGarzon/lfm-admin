import { Prisma, PrismaClient, Customer } from '@/prisma/client';
import { BaseRepository, type ModelDelegateOperations } from '@/lib/baseRepository';
import { getPaginationMetadata } from '@/lib/utils';
import type {
  CustomerPagination,
  CustomerListItem,
  CustomerFilters,
} from '@/features/customers/types';

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

            // if (sortItem.id === 'search') {
            //   return { invoiceNumber: order };
            // }

            return { [sortItem.id]: order };
          })
        : [{ firstName: 'desc' }];

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
      },
      orderBy,
      skip,
      take: perPage,
    });

    const [totalItems, customers] = await this.prisma.$transaction([
      countOperation,
      findManyOperation,
    ]);

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
      createdAt: customer.createdAt,
      deletedAt: customer.deletedAt ?? null,
    }));

    return {
      items,
      pagination: getPaginationMetadata(totalItems, perPage, page),
    };
  }
}
