import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { Prisma } from '@/prisma/client';
import type { AuditLevel } from '@/zod/schemas/enums/AuditLevel.schema';
import { UserRoleSchema } from '@/zod/schemas/enums/UserRole.schema';
import type { AccessChange } from '@/features/users/types';

// -- Event registry -----------------------------------------------------------

enum LogEventMessage {
  UserLoginSuccessful = 'User logged in successfully',
  UserLogoutSuccessful = 'User logged out successfully',
  EmployeeUpdated = 'Updated employee details',
  UserRoleChanged = 'User role changed',
  OtpRequested = 'OTP verification code requested',
  OtpVerified = 'OTP verification code verified',
  OtpFailed = 'OTP verification attempt failed',
  OtpLocked = 'OTP verification locked after max attempts',
  OtpExpired = 'OTP verification code expired',
}

enum LogEventTag {
  LOGIN = 'login',
  EMPLOYEES = 'employees',
  USERS = 'users',
  AUTH = 'auth',
}

const LogEventMapping: Record<keyof typeof LogEventMessage, LogEventTag> = {
  UserLoginSuccessful: LogEventTag.LOGIN,
  UserLogoutSuccessful: LogEventTag.LOGIN,
  EmployeeUpdated: LogEventTag.EMPLOYEES,
  UserRoleChanged: LogEventTag.USERS,
  OtpRequested: LogEventTag.AUTH,
  OtpVerified: LogEventTag.AUTH,
  OtpFailed: LogEventTag.AUTH,
  OtpLocked: LogEventTag.AUTH,
  OtpExpired: LogEventTag.AUTH,
};

const LogEventMessages: Record<keyof typeof LogEventMessage, string> = {
  UserLoginSuccessful: 'User logged in successfully',
  UserLogoutSuccessful: 'User logged out successfully',
  EmployeeUpdated: 'Updated employee details',
  UserRoleChanged: 'User role changed',
  OtpRequested: 'OTP verification code requested',
  OtpVerified: 'OTP verification code verified',
  OtpFailed: 'OTP verification attempt failed',
  OtpLocked: 'OTP verification locked after max attempts',
  OtpExpired: 'OTP verification code expired',
};

// -- Event data shapes --------------------------------------------------------

interface LogEventData {
  userId: string;
  employeeId?: string;
  targetUserId?: string;
  fromRole?: string;
  toRole?: string;
  changedByName?: string;
  ipAddress?: string;
  userAgent?: string;
  attemptsRemaining?: number;
}

interface LogEventProp {
  data: Required<Pick<LogEventData, 'userId'>>;
  event: keyof typeof LogEventMessage;
}

interface LoggedIn extends LogEventProp {
  data: LogEventProp['data'];
}

interface LoggedOut extends LogEventProp {
  data: LogEventProp['data'];
}

interface EmployeeUpdated extends LogEventProp {
  data: LogEventProp['data'] & Required<Pick<LogEventData, 'employeeId'>>;
}

interface UserRoleChangedEvent extends LogEventProp {
  data: LogEventProp['data'] & {
    targetUserId: string;
    fromRole: string;
    toRole: string;
    changedByName: string;
  };
  message: string;
}

interface OtpRequestedEvent extends LogEventProp {
  data: LogEventProp['data'] & { ipAddress?: string; userAgent?: string };
}

interface OtpVerifiedEvent extends LogEventProp {
  data: LogEventProp['data'] & { ipAddress?: string };
}

interface OtpFailedEvent extends LogEventProp {
  data: LogEventProp['data'] & { attemptsRemaining: number };
}

interface OtpLockedEvent extends LogEventProp {
  data: LogEventProp['data'];
}

interface OtpExpiredEvent extends LogEventProp {
  data: LogEventProp['data'];
}

// -- Internal helpers ---------------------------------------------------------

interface CreateAuditLogProps {
  userId: string;
  tag: string;
  event: keyof typeof LogEventMessage;
  message: string;
  data?: Prisma.JsonValue;
  level?: AuditLevel;
}

async function createAuditLog({
  userId,
  tag,
  event,
  message,
  data,
  level = 'INFO',
}: CreateAuditLogProps) {
  await prisma.audit.create({
    data: {
      userId,
      tag,
      event,
      message,
      data: data as Prisma.InputJsonValue,
      level,
    },
  });
}

// -- Service ------------------------------------------------------------------

export class AuditService {
  #logEvent(props: LogEventProp & { message?: string; level?: 'info' | 'warn' | 'error' }) {
    const { event, data, message: customMessage, level = 'info' } = props;
    const message = customMessage ?? LogEventMessages[event];
    const tag = LogEventMapping[event];

    logger[level](`[Audit] ${message}`, { context: 'AuditService', metadata: { tag, data } });

    createAuditLog({
      userId: data.userId,
      tag,
      event,
      message,
      data,
      level: level.toUpperCase() as AuditLevel,
    }).catch((err) => {
      logger.error('Failed to write audit log', err, { context: 'AuditService' });
    });
  }

  LoggedIn(props: Omit<LoggedIn, 'event'>) {
    this.#logEvent({ ...props, event: 'UserLoginSuccessful' });
  }

  LoggedOut(props: Omit<LoggedOut, 'event'>) {
    this.#logEvent({ ...props, event: 'UserLogoutSuccessful' });
  }

  EmployeeUpdated(props: Omit<EmployeeUpdated, 'event'>) {
    this.#logEvent({ ...props, event: 'EmployeeUpdated' });
  }

  UserRoleChanged(props: Omit<UserRoleChangedEvent, 'event'>) {
    this.#logEvent({ ...props, event: 'UserRoleChanged' });
  }

  OtpRequested(props: Omit<OtpRequestedEvent, 'event'>) {
    this.#logEvent({ ...props, event: 'OtpRequested' });
  }

  OtpVerified(props: Omit<OtpVerifiedEvent, 'event'>) {
    this.#logEvent({ ...props, event: 'OtpVerified' });
  }

  OtpFailed(props: Omit<OtpFailedEvent, 'event'>) {
    this.#logEvent({ ...props, event: 'OtpFailed', level: 'warn' });
  }

  OtpLocked(props: Omit<OtpLockedEvent, 'event'>) {
    this.#logEvent({ ...props, event: 'OtpLocked', level: 'warn' });
  }

  OtpExpired(props: Omit<OtpExpiredEvent, 'event'>) {
    this.#logEvent({ ...props, event: 'OtpExpired', level: 'warn' });
  }

  /**
   * Returns the 10 most recent role change audit entries for a given user.
   * @param targetUserId - The ID of the user whose role change history is requested
   * @returns Array of access change records ordered newest first
   */
  async findRoleChangesForUser(targetUserId: string): Promise<AccessChange[]> {
    const records = await prisma.$queryRaw<
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

  async cleanupOldLogs() {
    await prisma.audit.deleteMany({
      where: {
        createdAt: {
          lt: new Date(new Date().setMonth(new Date().getMonth() - 6)),
        },
      },
    });
  }
}
