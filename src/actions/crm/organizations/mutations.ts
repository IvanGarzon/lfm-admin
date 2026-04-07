'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { handleActionError } from '@/lib/error-handler';
import { withTenant } from '@/lib/action-auth';
import {
  CreateOrganizationSchema,
  UpdateOrganizationSchema,
  DeleteOrganizationSchema,
  type CreateOrganizationInput,
  type UpdateOrganizationInput,
  type DeleteOrganizationInput,
} from '@/schemas/organizations';
import { OrganizationRepository } from '@/repositories/organization-repository';

const organizationRepo = new OrganizationRepository(prisma);

/**
 * Creates a new organisation with the provided data.
 * Validates input and creates a new organisation record in the database.
 * @param data - The input data for creating the organisation, conforming to `CreateOrganizationInput`.
 * @returns A promise that resolves to an `ActionResult` with the new organisation's ID and name.
 */
export const createOrganization = withTenant<CreateOrganizationInput, { id: string; name: string }>(
  async ({ tenantId }, data) => {
    try {
      const validatedData = CreateOrganizationSchema.parse(data);

      const organization = await organizationRepo.createOrganization(validatedData, tenantId);

      // Revalidate paths that use organisations
      revalidatePath('/customers');
      revalidatePath('/organizations');

      return {
        success: true,
        data: {
          id: organization.id,
          name: organization.name,
        },
      };
    } catch (error) {
      return handleActionError(error, 'Failed to create organisation');
    }
  },
);

/**
 * Updates an existing organisation with the provided data.
 * Validates input and checks that the organisation exists before updating.
 * @param data - The input data for updating the organisation, conforming to `UpdateOrganizationInput`.
 * @returns A promise that resolves to an `ActionResult` with the updated organisation's ID.
 */
export const updateOrganization = withTenant<UpdateOrganizationInput, { id: string }>(
  async (ctx, data) => {
    try {
      const validatedData = UpdateOrganizationSchema.parse(data);

      const existing = await organizationRepo.findOrganizationById(validatedData.id, ctx.tenantId);
      if (!existing) {
        return { success: false, error: 'Organisation not found' };
      }

      const organization = await organizationRepo.updateOrganization(
        validatedData.id,
        ctx.tenantId,
        validatedData,
      );

      if (!organization) {
        return { success: false, error: 'Failed to update organisation' };
      }

      revalidatePath('/customers');
      revalidatePath('/organizations');

      return { success: true, data: { id: organization.id } };
    } catch (error) {
      return handleActionError(error, 'Failed to update organisation');
    }
  },
);

/**
 * Deletes an organisation from the system.
 * Verifies the organisation exists before attempting deletion.
 * @param data - An object containing the organisation ID to delete.
 * @returns A promise that resolves to an `ActionResult` with the deleted organisation's ID.
 */
export const deleteOrganization = withTenant<DeleteOrganizationInput, { id: string }>(
  async (ctx, data) => {
    try {
      const validatedData = DeleteOrganizationSchema.parse(data);
      const { id } = validatedData;

      const existing = await organizationRepo.findOrganizationById(id, ctx.tenantId);
      if (!existing) {
        return { success: false, error: 'Organisation not found' };
      }

      await organizationRepo.deleteOrganization(id, ctx.tenantId);

      revalidatePath('/customers');
      revalidatePath('/organizations');

      return { success: true, data: { id } };
    } catch (error) {
      return handleActionError(error, 'Failed to delete organisation');
    }
  },
);
