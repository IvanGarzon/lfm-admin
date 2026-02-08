'use server';

import { auth } from '@/auth';
import { SearchParams } from 'nuqs/server';
import { prisma } from '@/lib/prisma';
import type { ActionResult } from '@/types/actions';
import { handleActionError } from '@/lib/error-handler';
import { OrganizationRepository } from '@/repositories/organization-repository';
import type { OrganizationListItem, OrganizationPagination } from '@/features/organizations/types';
import {
  searchParamsCache,
  validateOrganizationSearchParams,
} from '@/filters/organizations/organizations-filters';

const organizationRepo = new OrganizationRepository(prisma);

export async function getActiveOrganizations(): Promise<ActionResult<OrganizationListItem[]>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const organizations = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        state: true,
        postcode: true,
        country: true,
        phone: true,
        email: true,
        website: true,
        abn: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        _count: {
          select: {
            customers: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return {
      success: true,
      data: organizations.map((org) => ({
        id: org.id,
        name: org.name,
        address: org.address,
        city: org.city,
        state: org.state,
        postcode: org.postcode,
        country: org.country,
        phone: org.phone,
        email: org.email,
        website: org.website,
        abn: org.abn,
        status: org.status,
        createdAt: org.createdAt,
        updatedAt: org.updatedAt,
        deletedAt: org.deletedAt,
        customersCount: org._count.customers ?? 0,
      })),
    };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch organizations');
  }
}

/**
 * Retrieves a paginated list of organizations based on search and filter criteria
 * Supports filtering by name, status, sorting, and pagination
 */
export async function getOrganizations(
  searchParams: SearchParams,
): Promise<ActionResult<OrganizationPagination>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const parsedParams = searchParamsCache.parse(searchParams);
    const validatedFilters = validateOrganizationSearchParams(parsedParams);
    const result = await organizationRepo.searchAndPaginate(validatedFilters);

    return { success: true, data: result };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch organizations');
  }
}

export async function getOrganizationById(id: string): Promise<ActionResult<OrganizationListItem>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const organization = await organizationRepo.findByIdWithDetails(id);

    if (!organization) {
      return { success: false, error: 'Organization not found' };
    }

    return { success: true, data: organization };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch organization');
  }
}
