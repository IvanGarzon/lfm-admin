import { prisma } from '@/lib/prisma';
import { Prisma } from '@/prisma/client';
import pino from 'pino';
import type { AuditLevel } from '@/zod/schemas/enums/AuditLevel.schema';
import { env } from 'env';
// import * as Sentry from '@sentry/node';

const logger = pino(
  env.NODE_ENV !== 'production'
    ? {
        level: 'info',
      }
    : { level: 'info' },
);

// Initialize Sentry
// Sentry.init({ dsn: env.SENTRY_DSN });

enum LogEventMessage {
  UserLoginSuccessful = 'User logged in successfully',
  UserLogoutSuccessful = 'User logged out successfully',
  EmployeeUpdated = 'Updated employee details',
  UserRoleChanged = 'User role changed',
}

enum LogEventTag {
  LOGIN = 'login',
  EMPLOYEES = 'employees',
  USERS = 'users',
}

const LogEventMapping: Record<keyof typeof LogEventMessage, LogEventTag> = {
  UserLoginSuccessful: LogEventTag.LOGIN,
  UserLogoutSuccessful: LogEventTag.LOGIN,
  EmployeeUpdated: LogEventTag.EMPLOYEES,
  UserRoleChanged: LogEventTag.USERS,
};

const LogEventMessages: Record<keyof typeof LogEventMessage, string> = {
  UserLoginSuccessful: 'User logged in successfully',
  UserLogoutSuccessful: 'User logged out successfully',
  EmployeeUpdated: 'Updated employee details',
  UserRoleChanged: 'User role changed',
};

interface LogEventData {
  userId: string;
  employeeId?: string;
  targetUserId?: string;
  fromRole?: string;
  toRole?: string;
  changedByName?: string;
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

type AccessChange = {
  id: string;
  message: string;
  changedByName: string;
  createdAt: Date;
};

export class AuditService {
  level;

  constructor(level: pino.Level = 'info') {
    this.level = level;
  }

  #logEvent(props: LogEventProp & { message?: string }) {
    const { event, data, message: customMessage } = props;
    const level = this.level;
    const message = customMessage ?? LogEventMessages[event];
    const tag = LogEventMapping[event];

    logger[level]({ tag, data }, `[Audit] ${message}`);

    createAuditLog({
      userId: data.userId,
      tag,
      event,
      message,
      data,
      level: level.toUpperCase() as AuditLevel,
    }).catch((err) => {
      console.error('Failed to write audit log:', err);
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
      const data = r.data as { changedByName?: string };
      return {
        id: r.id,
        message: r.message,
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
