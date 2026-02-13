import { Prisma, PrismaClient, EmployeeStatus } from '@/prisma/client';
import { BaseRepository, type ModelDelegateOperations } from '@/lib/baseRepository';
import { getPaginationMetadata } from '@/lib/utils';
import type {
  EmployeePagination,
  EmployeeListItem,
  EmployeeFilters,
} from '@/features/staff/employees/types';

/**
 * Employee Repository
 * Handles all database operations for employees
 * Extends BaseRepository for common CRUD operations
 */
export class EmployeeRepository extends BaseRepository<Prisma.EmployeeGetPayload<object>> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected get model(): ModelDelegateOperations<Prisma.EmployeeGetPayload<object>> {
    return this.prisma.employee as unknown as ModelDelegateOperations<
      Prisma.EmployeeGetPayload<object>
    >;
  }

  private mapToListItem(employee: any): EmployeeListItem {
    return {
      id: employee.id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee?.phone ?? '',
      gender: employee.gender,
      dob: employee.dob,
      rate: Number(employee.rate),
      status: employee.status,
      avatarUrl: employee.avatarUrl,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
      deletedAt: employee.deletedAt ?? null,
    };
  }

  async searchAndPaginate(params: EmployeeFilters): Promise<EmployeePagination> {
    const { search, alphabet, gender, status, page, perPage, sort } = params;
    const whereClause: Prisma.EmployeeWhereInput = {};

    if (search) {
      const searchFilter: Prisma.StringFilter = {
        contains: search,
        mode: Prisma.QueryMode.insensitive,
      };

      whereClause.OR = [
        { firstName: searchFilter },
        { lastName: searchFilter },
        { email: searchFilter },
      ];
    }

    if (alphabet) {
      whereClause.firstName = {
        startsWith: alphabet,
        mode: Prisma.QueryMode.insensitive,
      };
    }

    if (gender && gender.length > 0) {
      whereClause.gender = {
        in: gender,
      };
    }

    if (status && status.length > 0) {
      whereClause.status = {
        in: status,
      };
    }

    const skip = page > 0 ? perPage * (page - 1) : 0;

    const orderBy: Prisma.EmployeeOrderByWithRelationInput[] =
      sort && sort.length > 0
        ? sort.map((sortItem) => {
            const order: Prisma.SortOrder = sortItem.desc ? 'desc' : 'asc';
            return { [sortItem.id]: order };
          })
        : [{ createdAt: 'desc' }];

    const countOperation = this.prisma.employee.count({ where: whereClause });
    const findManyOperation = this.prisma.employee.findMany({
      where: whereClause,
      orderBy,
      skip,
      take: perPage,
    });

    const [totalItems, employees] = await Promise.all([countOperation, findManyOperation]);

    const items: EmployeeListItem[] = employees.map((employee) => ({
      id: employee.id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee?.phone,
      gender: employee.gender,
      dob: employee.dob,
      rate: Number(employee.rate),
      status: employee.status,
      avatarUrl: employee.avatarUrl,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
      deletedAt: employee.deletedAt ?? null,
    }));

    return {
      items,
      pagination: getPaginationMetadata(totalItems, perPage, page),
    };
  }

  async getActiveEmployees(limit: number = 20): Promise<EmployeeListItem[]> {
    const employees = await this.findMany({
      where: {
        status: EmployeeStatus.ACTIVE,
      },
      take: limit,
      orderBy: { firstName: 'asc' },
    });
    return employees.map((e) => this.mapToListItem(e));
  }

  async findByEmail(email: string): Promise<EmployeeListItem | null> {
    const employee = await this.model.findUnique({
      where: { email },
    });
    return employee ? this.mapToListItem(employee) : null;
  }

  async findEmployeeById(id: string | number): Promise<EmployeeListItem | null> {
    const employee = await this.model.findUnique({
      where: { id: id as string },
    });

    return employee ? this.mapToListItem(employee) : null;
  }
}
