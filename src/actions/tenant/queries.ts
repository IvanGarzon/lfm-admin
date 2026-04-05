'use server';

import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { handleActionError } from '@/lib/error-handler';
import type { ActionResult } from '@/types/actions';

// -- Types ------------------------------------------------------------------

/**
 * Tenant branding and business details used across templates,
 * previews, and email subjects.
 */
export type TenantBranding = {
  name: string;
  email: string | null;
  phone: string | null;
  abn: string | null;
  logoUrl: string | null;
  website: string | null;
  bankName: string | null;
  bsb: string | null;
  accountNumber: string | null;
  accountName: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postcode: string | null;
  country: string | null;
};

// -- Cached fetcher ----------------------------------------------------------

/**
 * Fetches tenant branding for the current session's tenant.
 * Cached per request via React cache() — safe to call multiple times.
 */
export const getTenantBranding = cache(async (): Promise<TenantBranding | null> => {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return null;
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: {
      name: true,
      settings: {
        select: {
          email: true,
          phone: true,
          abn: true,
          logoUrl: true,
          website: true,
          bankName: true,
          bsb: true,
          accountNumber: true,
          accountName: true,
          address: true,
          city: true,
          state: true,
          postcode: true,
          country: true,
        },
      },
    },
  });

  if (!tenant) {
    return null;
  }

  const s = tenant.settings;

  return {
    name: tenant.name,
    email: s?.email ?? null,
    phone: s?.phone ?? null,
    abn: s?.abn ?? null,
    logoUrl: s?.logoUrl ?? null,
    website: s?.website ?? null,
    bankName: s?.bankName ?? null,
    bsb: s?.bsb ?? null,
    accountNumber: s?.accountNumber ?? null,
    accountName: s?.accountName ?? tenant.name,
    address: s?.address ?? null,
    city: s?.city ?? null,
    state: s?.state ?? null,
    postcode: s?.postcode ?? null,
    country: s?.country ?? null,
  };
});

// -- Background-job fetcher --------------------------------------------------

/**
 * Fetches tenant branding by tenantId directly — no session required.
 * For use in Inngest background jobs and other non-request contexts.
 */
export async function getTenantBrandingById(tenantId: string): Promise<TenantBranding | null> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      name: true,
      settings: {
        select: {
          email: true,
          phone: true,
          abn: true,
          logoUrl: true,
          website: true,
          bankName: true,
          bsb: true,
          accountNumber: true,
          accountName: true,
          address: true,
          city: true,
          state: true,
          postcode: true,
          country: true,
        },
      },
    },
  });

  if (!tenant) {
    return null;
  }

  const s = tenant.settings;

  return {
    name: tenant.name,
    email: s?.email ?? null,
    phone: s?.phone ?? null,
    abn: s?.abn ?? null,
    logoUrl: s?.logoUrl ?? null,
    website: s?.website ?? null,
    bankName: s?.bankName ?? null,
    bsb: s?.bsb ?? null,
    accountNumber: s?.accountNumber ?? null,
    accountName: s?.accountName ?? tenant.name,
    address: s?.address ?? null,
    city: s?.city ?? null,
    state: s?.state ?? null,
    postcode: s?.postcode ?? null,
    country: s?.country ?? null,
  };
}

// -- Fallback ----------------------------------------------------------------

/**
 * Empty branding used as a safe fallback when tenant settings are unavailable
 * (e.g. in Inngest background jobs that run outside a request context).
 */
export const emptyBranding: TenantBranding = {
  name: '',
  email: null,
  phone: null,
  abn: null,
  logoUrl: null,
  website: null,
  bankName: null,
  bsb: null,
  accountNumber: null,
  accountName: null,
  address: null,
  city: null,
  state: null,
  postcode: null,
  country: null,
};

// -- Server action wrapper ---------------------------------------------------

/**
 * Server action to fetch tenant branding for client-side use.
 */
export async function getTenantBrandingAction(): Promise<ActionResult<TenantBranding>> {
  try {
    const branding = await getTenantBranding();
    if (!branding) {
      return { success: false, error: 'Tenant not found' };
    }
    return { success: true, data: branding };
  } catch (error) {
    return handleActionError(error, 'Failed to fetch tenant branding');
  }
}
