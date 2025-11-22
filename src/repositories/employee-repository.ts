import { Prisma, Employee, Gender, EmployeeStatus, type PrismaClient } from '@/prisma/client';
import { prisma } from '@/lib/prisma';
import { BaseRepository } from '@/lib/baseRepository';
import { getPaginationMetadata } from '@/lib/utils';
import { EmployeePagination } from '@/types/employee';

export interface EmployeeSearchAndPaginateParams {
  search?: string;
  alphabet?: string;
  gender?: Gender;
  status?: EmployeeStatus;
  page: number;
  perPage: number;
}

// export class EmployeeRepository extends BaseRepository<Prisma.EmployeeDelegate> {
// constructor(prisma: PrismaClient) {
//   super(prisma.employee);
// }

export class EmployeeRepository extends BaseRepository<Employee> {
  constructor() {
    // Pass the specific Prisma delegate (prisma.employee) to the BaseRepository.
    // This allows BaseRepository's this.modelClient to be prisma.employee.
    super(prisma.employee);
  }

  async searchAndPaginate(params: EmployeeSearchAndPaginateParams): Promise<EmployeePagination> {
    const { search, alphabet, gender, status, page, perPage } = params;
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

    if (gender) {
      whereClause.gender = gender;
    }

    if (status) {
      whereClause.status = status;
    }

    const skip = page > 0 ? perPage * (page - 1) : 0;

    const countOperation = prisma.employee.count({ where: whereClause });
    const findManyOperation = prisma.employee.findMany({
      where: whereClause,
      skip,
      take: perPage,
      orderBy: { id: 'asc' },
    });

    const [totalItems, items] = await prisma.$transaction([countOperation, findManyOperation]);

    return {
      items,
      pagination: getPaginationMetadata(totalItems, perPage, page),
    };
  }

  async getActiveEmployees(limit: number = 20): Promise<Employee[]> {
    return this.findMany({
      where: { status: EmployeeStatus.ACTIVE },
      take: limit,
      orderBy: { firstName: 'asc' },
    });
  }

  async findByEmail(email: string): Promise<Employee | null> {
    return this.model.findUnique({
      where: { email },
    });
  }
}
