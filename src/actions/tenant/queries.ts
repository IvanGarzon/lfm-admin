'use server';

import { cache } from 'react';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { handleActionError } from '@/lib/error-handler';
import { TenantRepository } from '@/repositories/tenant-repository';
import { EMPTY_BRANDING } from '@/features/admin/tenants/types';
import type { ActionResult } from '@/types/actions';

const tenantRepo = new TenantRepository(prisma);

export type { TenantBranding } from '@/features/admin/tenants/types';
import type { TenantBranding } from '@/features/admin/tenants/types';

// -- Cached fetcher ----------------------------------------------------------

/**
 * Fetches tenant branding for the current session's tenant.
 * Cached per request via React cache() — safe to call multiple times.
 * Returns EMPTY_BRANDING when there is no tenant context.
 */
export const getTenantBranding = cache(async (): Promise<TenantBranding> => {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return EMPTY_BRANDING;
  }

  const branding = await tenantRepo.findBranding(session.user.tenantId);
  return branding ?? EMPTY_BRANDING;
});

// -- Background-job fetcher --------------------------------------------------

/**
 * Fetches tenant branding by tenantId directly — no session required.
 * For use in Inngest background jobs and other non-request contexts.
 */
export async function getTenantBrandingById(tenantId: string): Promise<TenantBranding | null> {
  return tenantRepo.findBranding(tenantId);
}

// -- Server action wrapper ---------------------------------------------------

/**
 * Server action to fetch tenant branding for client-side use.
 */
export async function getTenantBrandingAction(): Promise<ActionResult<TenantBranding>> {
  try {
    const branding = await getTenantBranding();
    return { success: true, data: branding };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch tenant branding');
  }
}
