import type { EmployeeStatus } from '@/zod/schemas/enums/EmployeeStatus.schema';
import type { Gender } from '@/zod/schemas/enums/Gender.schema';
import type { PaginationMeta } from '@/types/pagination';

export type EmployeeListItem = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: Gender;
  dob: Date;
  rate: number;
  status: EmployeeStatus;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type EmployeePagination = {
  items: EmployeeListItem[];
  pagination: PaginationMeta;
};

export interface EmployeeFilters {
  search?: string;
  status?: EmployeeStatus[];
  page: number;
  perPage: number;
  sort?: {
    id: string;
    desc: boolean;
  }[];
  gender?: Gender[];
  alphabet?: string;
}
