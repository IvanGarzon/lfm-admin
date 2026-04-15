import { Prisma, PrismaClient, EmployeeStatus } from '@/prisma/client';
import { BaseRepository, type ModelDelegateOperations } from '@/lib/baseRepository';
import { getPaginationMetadata } from '@/lib/utils';
import type {
  EmployeePagination,
  EmployeeListItem,
  EmployeeFilters,
} from '@/features/staff/employees/types';
import type { CreateEmployeeInput, UpdateEmployeeInput } from '@/schemas/employees';

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

  /**
   * Maps a raw employee model to a structured EmployeeListItem.
   * Ensures that numeric fields like rate are correctly typed.
   * @param employee - The raw employee data from the database
   * @returns A structured EmployeeListItem object
   * @private
   */
  private mapToListItem(employee: Prisma.EmployeeGetPayload<object>): EmployeeListItem {
    return {
      id: employee.id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone ?? '',
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

  /**
   * Search and paginate employees with filtering.
   * Supports name/email search, alphabetical filtering, gender, and status.
   * @param params - Filter parameters for the search
   * @param tenantId - The tenant to scope the query to
   * @returns Paginated results with metadata
   */
  async searchEmployees(params: EmployeeFilters, tenantId: string): Promise<EmployeePagination> {
    const { search, alphabet, gender, status, page, perPage, sort } = params;
    const whereClause: Prisma.EmployeeWhereInput = { tenantId };

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

    const [totalItems, employees] = await Promise.all([
      this.prisma.employee.count({ where: whereClause }),
      this.prisma.employee.findMany({
        where: whereClause,
        orderBy,
        skip,
        take: perPage,
      }),
    ]);

    return {
      items: employees.map((employee) => this.mapToListItem(employee)),
      pagination: getPaginationMetadata(totalItems, perPage, page),
    };
  }

  /**
   * Retrieves a list of active employees for a given tenant, typically for selection components.
   * @param tenantId - The tenant to scope the query to
   * @param limit - Maximum number of employees to return
   * @returns A promise that resolves to an array of active employees
   */
  async getActiveEmployees(tenantId: string, limit: number = 20): Promise<EmployeeListItem[]> {
    const employees = await this.prisma.employee.findMany({
      where: {
        tenantId,
        status: EmployeeStatus.ACTIVE,
      },
      take: limit,
      orderBy: { firstName: 'asc' },
    });
    return employees.map((e) => this.mapToListItem(e));
  }

  /**
   * Locates an employee by their email address within a tenant.
   * @param email - The email address to look up
   * @param tenantId - The tenant to scope the query to
   * @returns The employee details or null if not found
   */
  async findEmployeeByEmail(email: string, tenantId: string): Promise<EmployeeListItem | null> {
    const employee = await this.prisma.employee.findFirst({
      where: { email, tenantId },
    });
    return employee ? this.mapToListItem(employee) : null;
  }

  /**
   * Locates an employee by their ID within a tenant.
   * @param id - The ID of the employee
   * @param tenantId - The tenant to scope the query to
   * @returns The employee details or null if not found
   */
  async findEmployeeById(id: string, tenantId: string): Promise<EmployeeListItem | null> {
    const employee = await this.prisma.employee.findFirst({
      where: { id, tenantId },
    });

    return employee ? this.mapToListItem(employee) : null;
  }

  /**
   * Creates a new employee record scoped to the given tenant.
   * @param data - The employee creation input data
   * @param tenantId - The tenant this employee belongs to
   * @returns A promise that resolves to the new employee's ID
   */
  async createEmployee(data: CreateEmployeeInput, tenantId: string): Promise<{ id: string }> {
    const employee = await this.prisma.employee.create({
      data: {
        tenantId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        gender: data.gender,
        dob: data.dob,
        rate: data.rate,
        status: data.status ?? EmployeeStatus.ACTIVE,
        avatarUrl: data.avatarUrl ?? null,
      },
      select: { id: true },
    });

    return { id: employee.id };
  }

  /**
   * Updates an existing employee record scoped to the given tenant.
   * @param id - The ID of the employee to update
   * @param tenantId - The tenant to scope the operation to
   * @param data - The fields to update
   * @returns The updated employee or null if not found
   */
  async updateEmployee(
    id: string,
    tenantId: string,
    data: Omit<UpdateEmployeeInput, 'id'>,
  ): Promise<EmployeeListItem | null> {
    const employee = await this.prisma.employee.updateMany({
      where: { id, tenantId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        gender: data.gender,
        dob: data.dob,
        rate: data.rate,
        status: data.status,
        avatarUrl: data.avatarUrl || null,
      },
    });

    if (employee.count === 0) {
      return null;
    }

    return this.findEmployeeById(id, tenantId);
  }

  /**
   * Deletes an employee record scoped to the given tenant.
   * @param id - The ID of the employee to delete
   * @param tenantId - The tenant to scope the operation to
   * @returns True if the employee was deleted, false if not found
   */
  async deleteEmployee(id: string, tenantId: string): Promise<boolean> {
    const result = await this.prisma.employee.deleteMany({
      where: { id, tenantId },
    });

    return result.count > 0;
  }
}
