'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { handleActionError } from '@/lib/error-handler';
import {
  CreateOrganizationSchema,
  UpdateOrganizationSchema,
  DeleteOrganizationSchema,
  type CreateOrganizationInput,
  type UpdateOrganizationInput,
  type DeleteOrganizationInput,
} from '@/schemas/organizations';
import type { ActionResult } from '@/types/actions';
import { OrganizationRepository } from '@/repositories/organization-repository';

const organizationRepo = new OrganizationRepository(prisma);

export async function createOrganization(
  data: CreateOrganizationInput,
): Promise<ActionResult<{ id: string; name: string }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const validatedData = CreateOrganizationSchema.parse(data);

    const organization = await organizationRepo.createOrganization(validatedData);

    // Revalidate paths that use organizations
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
    return handleActionError(error, 'Failed to create organization');
  }
}

export async function updateOrganization(
  data: UpdateOrganizationInput,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const validatedData = UpdateOrganizationSchema.parse(data);

    const existing = await organizationRepo.findById(validatedData.id);
    if (!existing) {
      return { success: false, error: 'Organization not found' };
    }

    const organization = await organizationRepo.updateOrganization(validatedData.id, validatedData);

    if (!organization) {
      return { success: false, error: 'Failed to update organization' };
    }

    revalidatePath('/customers');
    revalidatePath('/organizations');

    return { success: true, data: { id: organization.id } };
  } catch (error) {
    return handleActionError(error, 'Failed to update organization');
  }
}

export async function deleteOrganization(
  data: DeleteOrganizationInput,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const validatedData = DeleteOrganizationSchema.parse(data);
    const { id } = validatedData;

    const existing = await organizationRepo.findById(id);
    if (!existing) {
      return { success: false, error: 'Organization not found' };
    }

    await organizationRepo.deleteOrganization(id);

    revalidatePath('/customers');
    revalidatePath('/organizations');

    return { success: true, data: { id } };
  } catch (error) {
    return handleActionError(error, 'Failed to delete organization');
  }
}
