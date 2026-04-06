import type { InvitationStatus, UserRole } from '@/prisma/client';

export type InvitationListItem = {
  id: string;
  email: string;
  role: UserRole;
  status: InvitationStatus;
  expiresAt: Date;
  createdAt: Date;
};

export type InvitationWithTenant = {
  id: string;
  email: string;
  token: string;
  role: UserRole;
  status: InvitationStatus;
  expiresAt: Date;
  createdAt: Date;
  tenantId: string;
  invitedBy: string;
  tenant: { id: string; name: string; slug: string };
};

export type CreateInvitationInput = {
  email: string;
  role: UserRole;
  tenantId: string;
  invitedBy: string;
  expiresAt: Date;
};
