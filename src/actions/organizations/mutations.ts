'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { handleActionError } from '@/lib/error-handler';
import { CreateOrganizationSchema, type CreateOrganizationInput } from '@/schemas/organizations';
import type { ActionResult } from '@/types/actions';

export async function createOrganization(
  data: CreateOrganizationInput,
): Promise<ActionResult<{ id: string; name: string }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const validatedData = CreateOrganizationSchema.parse(data);

    const organization = await prisma.organization.create({
      data: {
        name: validatedData.name,
        address: validatedData.address,
        city: validatedData.city,
        state: validatedData.state,
        postcode: validatedData.postcode,
        country: validatedData.country ?? 'Australia',
      },
    });

    // Revalidate paths that use organizations
    revalidatePath('/customers');

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
