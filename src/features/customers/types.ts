import type { CustomerStatusType } from '@/zod/inputTypeSchemas/CustomerStatusSchema';
import type { GenderType } from '@/zod/inputTypeSchemas/GenderSchema';
import type { PaginationMeta } from '@/types/pagination';

export type CustomerListItem = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  gender: GenderType;
  status: CustomerStatusType;
  organizationId: string | null;
  organizationName: string | null;
  createdAt: Date;
  deletedAt: Date | null;
};

export type CustomerPagination = {
  items: CustomerListItem[];
  pagination: PaginationMeta;
};

export interface CustomerFilters {
  search?: string;
  status?: CustomerStatusType[];
  page: number;
  perPage: number;
  sort?: {
    id: string;
    desc: boolean;
  }[];
}
