import type { UserRole } from '@/zod/schemas/enums/UserRole.schema';
import type { UserStatus } from '@/zod/schemas/enums/UserStatus.schema';
import type { PaginationMeta } from '@/types/pagination';

export type UserListItem = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  lastLoginAt: Date | null;
  addedBy: { firstName: string; lastName: string } | null;
};

export type UserDetail = UserListItem & {
  isTwoFactorEnabled: boolean;
};

export type UserPagination = {
  items: UserListItem[];
  pagination: PaginationMeta;
};

export type UserFilters = {
  search?: string;
  role?: UserRole[];
  status?: UserStatus[];
  page: number;
  perPage: number;
  sort?: { id: string; desc: boolean }[];
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  USER: 'Staff',
  MANAGER: 'Manager',
  ADMIN: 'Admin',
  SUPER_ADMIN: 'Super Admin',
};
