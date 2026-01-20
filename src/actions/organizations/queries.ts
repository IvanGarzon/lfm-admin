'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import type { ActionResult } from '@/types/actions';
import { handleActionError } from '@/lib/error-handler';

export async function getOrganizations(): Promise<
  ActionResult<
    Array<{
      id: string;
      name: string;
      address: string | null;
      city: string | null;
      state: string | null;
      postcode: string | null;
      country: string | null;
    }>
  >
> {
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
      },
      orderBy: {
        name: 'asc',
      },
    });
    return { success: true, data: organizations };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch organizations');
  }
}
