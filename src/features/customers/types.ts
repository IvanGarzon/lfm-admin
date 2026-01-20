import type { CustomerStatus } from '@/zod/schemas/enums/CustomerStatus.schema';
import type { Gender } from '@/zod/schemas/enums/Gender.schema';
import type { PaginationMeta } from '@/types/pagination';
import type { AddressInput } from '@/schemas/address';
import type { CreateCustomerInput, UpdateCustomerInput } from '@/schemas/customers';

export type CustomerFormInput = CreateCustomerInput | UpdateCustomerInput;

export type CustomerListItem = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  gender: Gender;
  status: CustomerStatus;
  organizationId: string | null;
  organizationName: string | null;
  address: AddressInput | null;
  createdAt: Date;
  deletedAt: Date | null;
  invoicesCount: number;
  quotesCount: number;
};

export type CustomerPagination = {
  items: CustomerListItem[];
  pagination: PaginationMeta;
};

export interface CustomerFilters {
  search?: string;
  status?: CustomerStatus[];
  page: number;
  perPage: number;
  sort?: {
    id: string;
    desc: boolean;
  }[];
}
