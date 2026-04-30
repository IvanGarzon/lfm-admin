import { Audit, PrismaClient } from '@/prisma/client';
import { Prisma } from '@/prisma/client';
import { BaseRepository, type ModelDelegateOperations } from '@/lib/baseRepository';
import type { AccessChange } from '@/features/users/types';
import { UserRoleSchema } from '@/zod/schemas/enums/UserRole.schema';
import type { AuditLevel } from '@/zod/schemas/enums/AuditLevel.schema';

// -- Repository -------------------------------------------------------------

export class AuditRepository extends BaseRepository<Audit> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected get model(): ModelDelegateOperations<Audit> {
    return this.prisma.audit as unknown as ModelDelegateOperations<Prisma.AuditGetPayload<object>>;
  }

  /**
   * Creates a new audit log entry.
   * @param props - The audit log data to persist
   * @returns The created Audit record
   */
  async createLog(props: {
    userId: string;
    tag: string;
    event: string;
    message: string;
    data?: Prisma.JsonValue;
    level?: AuditLevel;
  }): Promise<Audit> {
    return await this.prisma.audit.create({
      data: {
        userId: props.userId,
        tag: props.tag,
        event: props.event,
        message: props.message,
        data: props.data as Prisma.InputJsonValue,
        level: props.level ?? 'INFO',
      },
    });
  }

  /**
   * Returns the 10 most recent role change audit entries for a given user.
   * @param targetUserId - The ID of the user whose role change history is requested
   * @returns Array of access change records ordered newest first
   */
  async findRoleChangesForUser(targetUserId: string): Promise<AccessChange[]> {
    const records = await this.prisma.$queryRaw<
      Array<{ id: string; message: string; data: unknown; created_at: Date }>
    >`
      SELECT id, message, data, created_at
      FROM audit
      WHERE tag = 'users'
        AND data->>'targetUserId' = ${targetUserId}
      ORDER BY created_at DESC
      LIMIT 10
    `;

    return records.map((r) => {
      const data = r.data as { changedByName?: string; toRole?: unknown };
      const parsedRole = UserRoleSchema.safeParse(data?.toRole);
      return {
        id: r.id,
        message: r.message,
        toRole: parsedRole.success ? parsedRole.data : undefined,
        changedByName: data?.changedByName ?? 'System',
        createdAt: r.created_at,
      };
    });
  }

  /**
   * Deletes audit log entries older than 6 months.
   * @returns The Prisma batch delete result
   */
  async cleanupOldLogs(): Promise<Prisma.BatchPayload> {
    return await this.prisma.audit.deleteMany({
      where: {
        createdAt: {
          lt: new Date(new Date().setMonth(new Date().getMonth() - 6)),
        },
      },
    });
  }
}
