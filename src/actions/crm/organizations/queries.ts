'use server';

import { SearchParams } from 'nuqs/server';
import { prisma } from '@/lib/prisma';
import { handleActionError } from '@/lib/error-handler';
import { withTenantPermission } from '@/lib/action-auth';
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
export const getActiveOrganizations = withTenantPermission<void, OrganizationListItem[]>(
  'canReadOrganisations',
  async (ctx) => {
    try {
      const organizations = await organizationRepo.findActiveOrganizations(ctx.tenantId);
      return { success: true, data: organizations };
    } catch (error) {
      return handleActionError(error, 'Failed to fetch organisations');
    }
  },
);

/**
 * Retrieves a paginated list of organisations based on search and filter criteria.
 * Supports filtering by name, status, sorting, and pagination.
 * @param searchParams - The search parameters for filtering, sorting, and pagination.
 * @returns A promise that resolves to an `ActionResult` containing the paginated organisation data.
 */
export const getOrganizations = withTenantPermission<SearchParams, OrganizationPagination>(
  'canReadOrganisations',
  async (ctx, searchParams) => {
    try {
      const parsedParams = searchParamsCache.parse(searchParams);
      const validatedFilters = validateOrganizationSearchParams(parsedParams);
      const result = await organizationRepo.searchOrganizations(validatedFilters, ctx.tenantId);

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
export const getOrganizationById = withTenantPermission<string, OrganizationListItem>(
  'canReadOrganisations',
  async (ctx, id) => {
    try {
      const organization = await organizationRepo.findOrganizationById(id, ctx.tenantId);

      if (!organization) {
        return { success: false, error: 'Organisation not found' };
      }

      return { success: true, data: organization };
    } catch (error) {
      return handleActionError(error, 'Failed to fetch organisation');
    }
  },
);
