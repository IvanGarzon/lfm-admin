'use server';

import { SearchParams } from 'nuqs/server';
import { VendorRepository } from '@/repositories/vendor-repository';
import { prisma } from '@/lib/prisma';
import { handleActionError } from '@/lib/error-handler';
import { withTenantPermission } from '@/lib/action-auth';
import type {
  VendorStatistics,
  VendorWithDetails,
  VendorPagination,
} from '@/features/inventory/vendors/types';
import { searchParamsCache } from '@/filters/vendors/vendors-filters';

const vendorRepo = new VendorRepository(prisma);

/**
 * Retrieves a paginated list of vendors based on specified search and filter criteria.
 * @param searchParams - The search parameters for filtering, sorting, and pagination
 * @returns A promise that resolves to an ActionResult containing the paginated vendor data
 */
export const getVendors = withTenantPermission<SearchParams, VendorPagination>(
  'canReadVendors',
  async (session, searchParams) => {
    try {
      const filters = searchParamsCache.parse(searchParams);
      const result = await vendorRepo.searchAndPaginate(filters, session.user.tenantId);

      return { success: true, data: result };
    } catch (error) {
      return handleActionError(error, 'Failed to fetch vendors');
    }
  },
);

/**
 * Retrieves a single vendor by its unique identifier, including associated details.
 * @param id - The ID of the vendor to retrieve
 * @returns A promise that resolves to an ActionResult containing the vendor details
 */
export const getVendorById = withTenantPermission<string, VendorWithDetails>(
  'canReadVendors',
  async (session, id) => {
    try {
      const vendor = await vendorRepo.findByIdWithDetails(id, session.user.tenantId);

      if (!vendor) {
        return { success: false, error: 'Vendor not found' };
      }

      return { success: true, data: vendor };
    } catch (error) {
      return handleActionError(error, 'Failed to fetch vendor');
    }
  },
);

/**
 * Retrieves vendor statistics including counts by status.
 * @returns A promise that resolves to an ActionResult containing vendor statistics
 */
export const getVendorStatistics = withTenantPermission<void, VendorStatistics>(
  'canReadVendors',
  async (session) => {
    try {
      const statistics = await vendorRepo.getStatistics(session.user.tenantId);

      return { success: true, data: statistics };
    } catch (error) {
      return handleActionError(error, 'Failed to fetch vendor statistics');
    }
  },
);

/**
 * Retrieves all active vendors for dropdown selection.
 * Used in transaction forms and other places where vendor selection is needed.
 * @returns A promise that resolves to an ActionResult containing active vendors
 */
export const getActiveVendors = withTenantPermission<
  void,
  Array<{ id: string; vendorCode: string; name: string }>
>('canReadVendors', async (session) => {
  try {
    const vendors = await vendorRepo.getActiveVendors(session.user.tenantId);

    return { success: true, data: vendors };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch active vendors');
  }
});
