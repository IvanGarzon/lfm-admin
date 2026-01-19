'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import type { ActionResult } from '@/types/actions';
import { handleActionError } from '@/lib/error-handler';

export async function getOrganizations(): Promise<
  ActionResult<Array<{ id: string; name: string; city: string | null; state: string | null }>>
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
        city: true,
        state: true,
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
