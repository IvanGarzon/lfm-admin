import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { Prisma } from '@/prisma/client';
import { EmployeeUpdateInputSchema } from '@/zod/inputTypeSchemas/EmployeeUpdateInputSchema';
import { LoggerService } from '@/services/logger';
import { getCurrentUser } from '@/lib/auth';
import { EmployeeRepository } from '@/repositories/employee-repository';
import { prisma } from '@/lib/prisma';

// import { ExposedPrismaRepository } from '@/repo/ExposedPrismaRepository';
// class EmployeeRepository extends ExposedPrismaRepository<Prisma.EmployeeDelegate> {}

// import { ExposedPrismaRepository } from '@/repo/ExposedPrismaRepository';
// class EmployeeRepository extends ExposedPrismaRepository<Prisma.EmployeeDelegate> {}

const logger = new LoggerService();

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const startTime = Date.now();
  const { id } = await params;

  try {
    const authStart = Date.now();
    // For employee API, we can use a more aggressive cache since it's not user-specific data
    // and we're already checking authorization once per request
    const user = await getCurrentUser();
    const authTime = Date.now() - authStart;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbStart = Date.now();
    const employeeRepository = new EmployeeRepository();
    const employee = await employeeRepository.findById(id);
    const dbTime = Date.now() - dbStart;

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const totalTime = Date.now() - startTime;
    console.log(`Employee ${id} fetch: Total=${totalTime}ms, Auth=${authTime}ms, DB=${dbTime}ms`);

    const response = NextResponse.json(employee);

    // Add aggressive caching for individual employees
    // Cache for 5 minutes, stale-while-revalidate for 10 minutes
    response.headers.set(
      'Cache-Control',
      'public, max-age=300, s-maxage=300, stale-while-revalidate=600',
    );
    response.headers.set('CDN-Cache-Control', 'public, max-age=300');
    response.headers.set('Vercel-CDN-Cache-Control', 'public, max-age=300');

    return response;
  } catch (error) {
    console.error(`Failed to fetch employee ${id}:`, error);
    return NextResponse.json({ error: 'Failed to fetch employee' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = EmployeeUpdateInputSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.issues }, { status: 400 });
    }

    const employeeRepository = new EmployeeRepository();
    const updatedEmployee = await employeeRepository.update(id, { ...validation.data });

    if (!updatedEmployee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    logger.EmployeeUpdated({
      data: {
        userId: user.id as string,
        employeeId: updatedEmployee.id,
      },
    });

    return NextResponse.json(updatedEmployee);
  } catch (error: any) {
    console.error(`Failed to update employee ${id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      // Prisma code for record not found
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Instantiate the repository
    const employeeRepository = new EmployeeRepository(prisma);
    const deletedEmployee = await employeeRepository.delete({ where: { id } });

    // const client = new PrismaClient();
    // const employeeRepository = new EmployeeRepository(client.employee, client);
    // const deletedEmployee = await employeeRepository.delete({ where: { id } });
    // console.log('deletedEmployee => ', deletedEmployee);

    // const client = new PrismaClient();
    // const employeeRepository = new EmployeeRepository(client.employee, client);
    // const deletedEmployee = await employeeRepository.delete({ where: { id } });
    // console.log('deletedEmployee => ', deletedEmployee);

    if (!deletedEmployee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // logger.EmployeeDeleted({
    //   data: {
    //     userId: user.id as string,
    //     employeeId: deletedEmployee.id,
    //   },
    // });

    return NextResponse.json({ data: {} }, { status: 200 });
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 });
  }
}
