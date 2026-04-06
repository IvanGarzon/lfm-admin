import type { TenantStatus, States } from '@/prisma/client';

// -- Branding -----------------------------------------------------------------

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
  state: States | null;
  postcode: string | null;
  country: string | null;
};

export const EMPTY_BRANDING: TenantBranding = {
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

export type TenantListItem = {
  id: string;
  slug: string;
  name: string;
  status: TenantStatus;
  createdAt: Date;
  userCount: number;
};

export type TenantSettings = {
  id: string;
  logoUrl: string | null;
  abn: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  bankName: string | null;
  bsb: string | null;
  accountNumber: string | null;
  accountName: string | null;
  address: string | null;
  city: string | null;
  state: States | null;
  postcode: string | null;
  country: string | null;
};

export type TenantWithSettings = {
  id: string;
  slug: string;
  name: string;
  status: TenantStatus;
  createdAt: Date;
  updatedAt: Date;
  settings: TenantSettings | null;
};

export type CreateTenantInput = {
  name: string;
  slug: string;
};

export type UpdateTenantInput = {
  name?: string;
  slug?: string;
};

export type UpdateTenantSettingsInput = {
  logoUrl?: string | null;
  abn?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  bankName?: string | null;
  bsb?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
  address?: string | null;
  city?: string | null;
  state?: States | null;
  postcode?: string | null;
  country?: string | null;
};
