import { Invitation, InvitationStatus, PrismaClient, UserRole } from '@/prisma/client';
import { prisma } from '@/lib/prisma';
import type {
  CreateInvitationInput,
  InvitationWithTenant,
} from '@/features/admin/invitations/types';

export class InvitationRepository {
  constructor(private prismaClient: PrismaClient = prisma) {}

  async create(data: CreateInvitationInput): Promise<Invitation> {
    return this.prismaClient.invitation.create({ data });
  }

  async findByToken(token: string): Promise<InvitationWithTenant | null> {
    const result = await this.prismaClient.invitation.findUnique({
      where: { token },
      include: { tenant: { select: { id: true, name: true, slug: true } } },
    });
    return result ?? null;
  }

  async findByTenant(tenantId: string): Promise<Invitation[]> {
    return this.prismaClient.invitation.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPendingByEmail(email: string, tenantId: string): Promise<Invitation | null> {
    return this.prismaClient.invitation.findFirst({
      where: { email, tenantId, status: InvitationStatus.PENDING },
    });
  }

  async accept(token: string): Promise<Invitation> {
    return this.prismaClient.invitation.update({
      where: { token },
      data: { status: InvitationStatus.ACCEPTED },
    });
  }

  async revoke(id: string): Promise<Invitation> {
    return this.prismaClient.invitation.update({
      where: { id },
      data: { status: InvitationStatus.REVOKED },
    });
  }

  async expireStale(): Promise<void> {
    await this.prismaClient.invitation.updateMany({
      where: {
        status: InvitationStatus.PENDING,
        expiresAt: { lt: new Date() },
      },
      data: { status: InvitationStatus.EXPIRED },
    });
  }
}

// Re-export for consumers that just need the type
export type { InvitationWithTenant, CreateInvitationInput };

export const invitationRepo = new InvitationRepository(prisma);
