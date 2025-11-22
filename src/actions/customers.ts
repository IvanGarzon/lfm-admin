'use server';

import { prisma } from '@/lib/prisma';
import { Customer } from '@/prisma/client';
import {
  CustomerStatusSchema,
  type CustomerStatusType,
} from '@/zod/inputTypeSchemas/CustomerStatusSchema';
import type { ActionResult } from '@/types/actions';

export async function getActiveCustomers(): Promise<ActionResult<Partial<Customer>[]>> {
  try {
    const customers = await prisma.customer.findMany({
      where: {
        deletedAt: null,
        status: CustomerStatusSchema.enum.ACTIVE,
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

    return { success: true, data: customers };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: 'Failed to fetch customers' };
  }
}

export async function getCustomers(params: {
  status?: CustomerStatusType;
}): Promise<ActionResult<Partial<Customer>[]>> {
  try {
    const customers = await prisma.customer.findMany({
      where: {
        deletedAt: null,
        status: CustomerStatusSchema.enum.ACTIVE,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        firstName: 'desc',
      },
    });

    return { success: true, data: customers };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: 'Failed to fetch customers' };
  }
}

export async function createCustomer(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  gender: 'MALE' | 'FEMALE';
  organizationId?: string;
  organizationName?: string;
}): Promise<ActionResult<Customer>> {
  try {
    // Check if email already exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { email: data.email },
    });

    if (existingCustomer) {
      return {
        success: false,
        error: 'A customer with this email already exists',
        errors: { email: ['Email already in use'] },
      };
    }

    let organizationId = data.organizationId;

    // If organizationName is provided but no organizationId, create new organization
    if (data.organizationName && !data.organizationId) {
      const organization = await prisma.organization.create({
        data: {
          name: data.organizationName,
        },
      });
      organizationId = organization.id;
    }

    const customer = await prisma.customer.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        gender: data.gender,
        organizationId,
        status: CustomerStatusSchema.enum.ACTIVE,
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

    return { success: true, data: customer };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: 'Failed to create customer' };
  }
}

export async function getOrganizations(): Promise<
  ActionResult<Array<{ id: string; name: string }>>
> {
  try {
    const organizations = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return { success: true, data: organizations };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: 'Failed to fetch organizations' };
  }
}
