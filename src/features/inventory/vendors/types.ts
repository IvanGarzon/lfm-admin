import type { CreateVendorInput, UpdateVendorInput } from '@/schemas/vendors';
import type { VendorStatus } from '@/zod/schemas/enums/VendorStatus.schema';
import type { AddressInput } from '@/schemas/address';
import type { PaginationMeta } from '@/types/pagination';

export type VendorFormInput = CreateVendorInput | UpdateVendorInput;

export type VendorSelectItem = {
  id: string;
  vendorCode: string;
  name: string;
};

export type VendorListItem = {
  id: string;
  vendorCode: string;
  name: string;
  email: string;
  phone: string | null;
  status: VendorStatus;
  paymentTerms: number | null;
  transactionCount?: number;
};

export type VendorWithDetails = {
  id: string;
  vendorCode: string;
  name: string;
  email: string;
  phone: string | null;
  abn: string | null;
  status: VendorStatus;
  address: AddressInput | null;
  website: string | null;
  paymentTerms: number | null;
  taxId: string | null;
  notes: string | null;
  transactionCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export interface VendorFilters {
  search?: string;
  status?: VendorStatus[];
  page: number;
  perPage: number;
  sort?: { id: string; desc: boolean }[];
}

export type VendorPagination = {
  items: VendorListItem[];
  pagination: PaginationMeta;
};

export type VendorStatistics = {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
};
