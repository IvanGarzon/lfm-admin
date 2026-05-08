import { Invitation, InvitationStatus, PrismaClient, UserRole } from '@/prisma/client';
import { prisma } from '@/lib/prisma';
import type {
  CreateInvitationInput,
  InvitationWithTenant
} from '@/features/admin/invitations/types';

export class InvitationRepository {
  constructor(private prismaClient: PrismaClient = prisma) {}

  /**
   * Create a new invitation record.
   * @param data - The invitation data including email, role, tenantId, invitedBy, and expiresAt
   * @returns The created invitation record
   */
  async create(data: CreateInvitationInput): Promise<Invitation> {
    return this.prismaClient.invitation.create({ data });
  }

  /**
   * Find an invitation by its unique token, including tenant details.
   * @param token - The unique invitation token
   * @returns The invitation with tenant data, or null if not found
   */
  async findByToken(token: string): Promise<InvitationWithTenant | null> {
    const result = await this.prismaClient.invitation.findUnique({
      where: { token },
      include: { tenant: { select: { id: true, name: true, slug: true } } }
    });
    return result ?? null;
  }

  /**
   * Find all invitations for a given tenant, ordered by most recent first.
   * @param tenantId - The tenant ID to scope the query
   * @returns All invitations belonging to the tenant
   */
  async findByTenant(tenantId: string): Promise<Invitation[]> {
    return this.prismaClient.invitation.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Find a pending invitation for a specific email within a tenant.
   * @param email - The email address to look up
   * @param tenantId - The tenant ID to scope the query
   * @returns The pending invitation if one exists, or null
   */
  async findPendingByEmail(email: string, tenantId: string): Promise<Invitation | null> {
    return this.prismaClient.invitation.findFirst({
      where: { email, tenantId, status: InvitationStatus.PENDING }
    });
  }

  /**
   * Mark an invitation as accepted by its token.
   * @param token - The unique invitation token to accept
   * @returns The updated invitation record
   */
  async accept(token: string): Promise<Invitation> {
    return this.prismaClient.invitation.update({
      where: { token },
      data: { status: InvitationStatus.ACCEPTED }
    });
  }

  /**
   * Revoke an invitation by its ID, preventing it from being accepted.
   * @param id - The invitation ID to revoke
   * @returns The updated invitation record
   */
  async revoke(id: string): Promise<Invitation> {
    return this.prismaClient.invitation.update({
      where: { id },
      data: { status: InvitationStatus.REVOKED }
    });
  }

  /**
   * Mark all pending invitations past their expiry date as expired.
   * Intended to be called by a scheduled task.
   * @returns A promise that resolves when the batch update is complete
   */
  async expireStale(): Promise<void> {
    await this.prismaClient.invitation.updateMany({
      where: {
        status: InvitationStatus.PENDING,
        expiresAt: { lt: new Date() }
      },
      data: { status: InvitationStatus.EXPIRED }
    });
  }
}

// Re-export for consumers that just need the type
export type { InvitationWithTenant, CreateInvitationInput };

export const invitationRepo = new InvitationRepository(prisma);
