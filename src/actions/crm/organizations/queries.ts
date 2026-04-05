'use server';

import { SearchParams } from 'nuqs/server';
import { prisma } from '@/lib/prisma';
import { handleActionError } from '@/lib/error-handler';
import { withTenant } from '@/lib/action-auth';
import { OrganizationRepository } from '@/repositories/organization-repository';
import type {
  OrganizationListItem,
  OrganizationPagination,
} from '@/features/crm/organizations/types';
import {
  searchParamsCache,
  validateOrganizationSearchParams,
} from '@/filters/organizations/organizations-filters';

const organizationRepo = new OrganizationRepository(prisma);

/**
 * Retrieves all active organisations with customer counts.
 * Returns a list of all organisations sorted alphabetically by name.
 * @returns A promise that resolves to an `ActionResult` containing an array of organisation items.
 */
export const getActiveOrganizations = withTenant<void, OrganizationListItem[]>(async (session) => {
  try {
    const organizations = await prisma.organization.findMany({
      where: { tenantId: session.user.tenantId },
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
    return handleActionError(error, 'Failed to fetch organisations');
  }
});

/**
 * Retrieves a paginated list of organisations based on search and filter criteria.
 * Supports filtering by name, status, sorting, and pagination.
 * @param searchParams - The search parameters for filtering, sorting, and pagination.
 * @returns A promise that resolves to an `ActionResult` containing the paginated organisation data.
 */
export const getOrganizations = withTenant<SearchParams, OrganizationPagination>(
  async (session, searchParams) => {
    try {
      const parsedParams = searchParamsCache.parse(searchParams);
      const validatedFilters = validateOrganizationSearchParams(parsedParams);
      const result = await organizationRepo.searchAndPaginate(
        validatedFilters,
        session.user.tenantId,
      );

      return { success: true, data: result };
    } catch (error) {
      return handleActionError(error, 'Failed to fetch organisations');
    }
  },
);

/**
 * Retrieves a single organisation by ID with full details.
 * Includes all organisation fields, customer count, and related metadata.
 * @param id - The unique identifier of the organisation to retrieve.
 * @returns A promise that resolves to an `ActionResult` containing the organisation details,
 * or an error if the organisation is not found.
 */
export const getOrganizationById = withTenant<string, OrganizationListItem>(async (session, id) => {
  try {
    const organization = await organizationRepo.findByIdWithDetails(id, session.user.tenantId);

    if (!organization) {
      return { success: false, error: 'Organisation not found' };
    }

    return { success: true, data: organization };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch organisation');
  }
});
