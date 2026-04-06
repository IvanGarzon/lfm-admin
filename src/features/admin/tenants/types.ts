import type { TenantStatus } from '@/prisma/client';

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
  state: string | null;
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
  state?: string | null;
  postcode?: string | null;
  country?: string | null;
};
