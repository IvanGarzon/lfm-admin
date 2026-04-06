import type { UserRole } from '@/prisma/client';

export type UserListItem = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  role: UserRole;
  tenantId: string | null;
  tenant: { name: string } | null;
};

export type CreateUserForTenantInput = {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  tenantId: string;
  password?: string;
};
