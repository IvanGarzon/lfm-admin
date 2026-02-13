import type { States } from '@/zod/schemas/enums/States.schema';
import type { OrganizationStatus } from '@/zod/schemas/enums/OrganizationStatus.schema';
import type { PaginationMeta } from '@/types/pagination';
import type { CreateOrganizationInput, UpdateOrganizationInput } from '@/schemas/organizations';

export type OrganizationFormInput = CreateOrganizationInput | UpdateOrganizationInput;

export type OrganizationListItem = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: States | null;
  postcode: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  abn: string | null;
  status: OrganizationStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  customersCount: number;
};

export type OrganizationPagination = {
  items: OrganizationListItem[];
  pagination: PaginationMeta;
};

export interface OrganizationFilters {
  name?: string;
  status?: OrganizationStatus[];
  page: number;
  perPage: number;
  sort?: {
    id: string;
    desc: boolean;
  }[];
}
