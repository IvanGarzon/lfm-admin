import { Prisma, PrismaClient, EmployeeStatus } from '@/prisma/client';
import { BaseRepository, type ModelDelegateOperations } from '@/lib/baseRepository';
import { getPaginationMetadata } from '@/lib/utils';
import type {
  EmployeePagination,
  EmployeeListItem,
  EmployeeFilters,
} from '@/features/staff/employees/types';
import type { CreateEmployeeInput } from '@/schemas/employees';

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

  /**
   * Search and paginate employees with filtering.
   * Supports name/email search, alphabetical filtering, gender, and status.
   * @param params - Filter parameters for the search
   * @param params.search - Text search for name or email
   * @param params.alphabet - Optional starting letter for first name
   * @param params.gender - Array of genders to filter by
   * @param params.status - Array of statuses to filter by
   * @param params.page - Current page number
   * @param params.perPage - Items per page
   * @param params.sort - Sorting criteria
   * @returns Paginated results with metadata
   */
  async searchAndPaginate(params: EmployeeFilters, tenantId: string): Promise<EmployeePagination> {
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

  /**
   * Retrieves a list of active employees, typically for selection components.
   * @param limit - Maximum number of employees to return
   * @returns A promise that resolves to an array of active employees
   */
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

  /**
   * Locates an employee by their unique email address.
   * @param email - The email address to look up
   * @returns The employee details or null if not found
   */
  async findByEmail(email: string): Promise<EmployeeListItem | null> {
    const employee = await this.model.findUnique({
      where: { email },
    });
    return employee ? this.mapToListItem(employee) : null;
  }

  /**
   * Locates an employee by their ID.
   * @param id - The ID of the employee
   * @param tenantId - The tenant to scope the query to
   * @returns The employee details or null if not found
   */
  async findEmployeeById(id: string, tenantId: string): Promise<EmployeeListItem | null> {
    const employee = await this.model.findUnique({
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
        gender: data.gender ?? null,
        dob: data.dob ?? null,
        rate: data.rate,
        status: data.status ?? EmployeeStatus.ACTIVE,
        avatarUrl: data.avatarUrl || null,
      },
      select: { id: true },
    });

    return { id: employee.id };
  }
}
