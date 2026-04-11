'use server';

import { revalidatePath } from 'next/cache';
import { VendorRepository } from '@/repositories/vendor-repository';
import { prisma } from '@/lib/prisma';
import { handleActionError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { withTenantPermission } from '@/lib/action-auth';
import {
  CreateVendorSchema,
  UpdateVendorSchema,
  UpdateVendorStatusSchema,
  DeleteVendorSchema,
  type CreateVendorInput,
  type UpdateVendorInput,
  type UpdateVendorStatusInput,
  type DeleteVendorInput,
} from '@/schemas/vendors';

const vendorRepo = new VendorRepository(prisma);

/**
 * Creates a new vendor with the provided data.
 * Auto-generates vendor code with format VEN-YYYY-####.
 * @param data - The input data for creating the vendor
 * @returns A promise that resolves to an ActionResult with the new vendor's ID and code
 */
export const createVendor = withTenantPermission<
  CreateVendorInput,
  { id: string; vendorCode: string }
>('canManageVendors', async (ctx, data) => {
  try {
    const validatedData = CreateVendorSchema.parse(data);

    const vendor = await vendorRepo.createVendor(validatedData, ctx.tenantId);

    logger.info(`Vendor created: ${vendor.vendorCode}`, {
      context: 'createVendor',
      metadata: {
        vendorId: vendor.id,
        vendorCode: vendor.vendorCode,
        userId: ctx.userId,
      },
    });

    revalidatePath('/inventory/vendors');

    return {
      success: true,
      data: { id: vendor.id, vendorCode: vendor.vendorCode },
    };
  } catch (error) {
    return handleActionError(error, 'Failed to create vendor');
  }
});

/**
 * Updates an existing vendor with the provided data.
 * @param data - The input data for updating the vendor
 * @returns A promise that resolves to an ActionResult with the updated vendor's ID
 */
export const updateVendor = withTenantPermission<UpdateVendorInput, { id: string }>(
  'canManageVendors',
  async (ctx, data) => {
    try {
      const validatedData = UpdateVendorSchema.parse(data);

      const vendor = await vendorRepo.updateVendor(validatedData.id, ctx.tenantId, validatedData);

      if (!vendor) {
        return { success: false, error: 'Failed to update vendor' };
      }

      logger.info(`Vendor updated: ${vendor.vendorCode}`, {
        context: 'updateVendor',
        metadata: {
          vendorId: vendor.id,
          vendorCode: vendor.vendorCode,
          userId: ctx.userId,
        },
      });

      revalidatePath('/inventory/vendors');
      revalidatePath(`/inventory/vendors/${vendor.id}`);

      return { success: true, data: { id: vendor.id } };
    } catch (error) {
      return handleActionError(error, 'Failed to update vendor');
    }
  },
);

/**
 * Updates a vendor's status.
 * @param data - An object containing the vendor ID and new status
 * @returns A promise that resolves to an ActionResult with the updated vendor's ID
 */
export const updateVendorStatus = withTenantPermission<UpdateVendorStatusInput, { id: string }>(
  'canManageVendors',
  async (ctx, data) => {
    try {
      const validatedData = UpdateVendorStatusSchema.parse(data);

      const vendor = await vendorRepo.updateVendorStatus(
        validatedData.id,
        ctx.tenantId,
        validatedData.status,
      );

      logger.info(`Vendor status updated: ${vendor.vendorCode} -> ${vendor.status}`, {
        context: 'updateVendorStatus',
        metadata: {
          vendorId: vendor.id,
          vendorCode: vendor.vendorCode,
          status: vendor.status,
          userId: ctx.userId,
        },
      });

      revalidatePath('/inventory/vendors');
      revalidatePath(`/inventory/vendors/${vendor.id}`);

      return { success: true, data: { id: vendor.id } };
    } catch (error) {
      return handleActionError(error, 'Failed to update vendor status');
    }
  },
);

/**
 * Soft deletes a vendor.
 * Only allows deletion if the vendor has no associated transactions.
 * @param data - An object containing the vendor ID to delete
 * @returns A promise that resolves to an ActionResult with the deleted vendor's ID
 */
export const deleteVendor = withTenantPermission<DeleteVendorInput, { id: string }>(
  'canManageVendors',
  async (ctx, data) => {
    try {
      const validatedData = DeleteVendorSchema.parse(data);

      const vendor = await vendorRepo.softDeleteVendor(validatedData.id, ctx.tenantId);

      logger.info(`Vendor deleted: ${vendor.vendorCode}`, {
        context: 'deleteVendor',
        metadata: {
          vendorId: vendor.id,
          vendorCode: vendor.vendorCode,
          userId: ctx.userId,
        },
      });

      revalidatePath('/inventory/vendors');

      return { success: true, data: { id: vendor.id } };
    } catch (error) {
      return handleActionError(error, 'Failed to delete vendor');
    }
  },
);
