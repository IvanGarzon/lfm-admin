import { z } from 'zod';
import { NextResponse, type NextRequest } from 'next/server';
import { Prisma } from '@/prisma/client';
import { EmployeeCreateInputSchema } from '@/zod/inputTypeSchemas/EmployeeCreateInputSchema';
import { GenderSchema } from '@/zod/inputTypeSchemas/GenderSchema';
import { EmployeeStatusSchema } from '@/zod/inputTypeSchemas';
import { auth } from '@/auth';

import {
  EmployeeRepository,
  type EmployeeSearchAndPaginateParams,
} from '@/repositories/employee-repository';

const SearchParamsSchema = z.object({
  search: z.string().trim().default(''),
  alphabet: z.string().trim().default(''),
  gender: z
    .union([GenderSchema, z.literal('')])
    .transform((val) => (val === '' ? undefined : val))
    .optional(),
  status: z
    .union([EmployeeStatusSchema, z.literal('')])
    .transform((val) => (val === '' ? undefined : val))
    .optional(),
  page: z.coerce.number().min(1).default(1),
  perPage: z.coerce.number().min(1).max(100).default(20),
});

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const params = Object.fromEntries(searchParams.entries());
  const parseResult = SearchParamsSchema.safeParse(params);

  if (!parseResult.success) {
    return NextResponse.json(
      {
        error: 'Invalid query parameters',
        details: parseResult.error.flatten(),
      },
      { status: 400 },
    );
  }

  // Instantiate the repository
  const employeeRepository = new EmployeeRepository();

  // Map Zod-parsed data to the repository's expected parameter type.
  // This step is important for decoupling the repository from Zod-specific types.
  const repoParams: EmployeeSearchAndPaginateParams = {
    search: parseResult.data.search,
    alphabet: parseResult.data.alphabet,
    gender: parseResult.data.gender,
    status: parseResult.data.status,
    page: parseResult.data.page,
    perPage: parseResult.data.perPage,
  };

  try {
    const employees = await employeeRepository.searchAndPaginate(repoParams);

    // REMOVED: Redundant count() call - searchAndPaginate already provides totalItems
    // const total = await employeeRepository.count();
    // console.log('[EMPLOYEE TOTAL] => ', total);

    // Add caching headers for better performance
    const response = NextResponse.json(employees);

    // Cache for 30 seconds in browser, 60 seconds on CDN
    response.headers.set(
      'Cache-Control',
      'public, max-age=30, s-maxage=60, stale-while-revalidate=120',
    );

    return response;
  } catch (error) {
    console.error('Failed to fetch employees:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = EmployeeCreateInputSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.issues }, { status: 400 });
    }

    // Instantiate the repository
    const employeeRepository = new EmployeeRepository();
    const employee = await employeeRepository.create(body);

    // const employee = await employeeRepository.create({
    //   data: {
    //     ...body,
    //   },
    // });

    return NextResponse.json(employee);
  } catch (error: any) {
    console.error(`Failed to create employee`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      // Prisma code for record not found
      return NextResponse.json({ error: 'Failed to create employee' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 });
  }
}
