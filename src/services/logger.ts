import { prisma } from '@/lib/prisma';
import { Prisma } from '@/prisma/client';
import pino from 'pino';
import type { AuditLevelType } from '@/zod/inputTypeSchemas/AuditLevelSchema';
import { env } from 'env';
// import * as Sentry from '@sentry/node';

const logger = pino(
  env.NODE_ENV !== 'production'
    ? {
        level: 'info',
        // transport: {
        //   target: 'pino-pretty',
        //   options: { colorize: true, translateTime: 'SYS:standard', ignore: 'pid,hostname' }
        // }
      }
    : { level: 'info' }, // Use default logger in production
);

// Initialize Sentry
// Sentry.init({ dsn: env.SENTRY_DSN });

enum LogEventMessage {
  UserLoginSuccessful = 'User logged in successfully',
  UserLogoutSuccessful = 'User logged out successfully',
  EmployeeUpdated = 'Updated employee details',
}

enum LogEventTag {
  LOGIN = 'login',
  EMPLOYEES = 'employees',
}

const LogEventMapping: Record<keyof typeof LogEventMessage, LogEventTag> = {
  UserLoginSuccessful: LogEventTag.LOGIN,
  UserLogoutSuccessful: LogEventTag.LOGIN,
  EmployeeUpdated: LogEventTag.EMPLOYEES,
};

const LogEventMessages: Record<keyof typeof LogEventMessage, string> = {
  UserLoginSuccessful: 'User logged in successfully',
  UserLogoutSuccessful: 'User logged out successfully',
  EmployeeUpdated: 'Updated employee details',
};

interface LogEventData {
  userId: string;
  employeeId?: string;
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

interface CreateAuditLogProps {
  userId: string;
  tag: string;
  event: keyof typeof LogEventMessage;
  message: string;
  data?: Prisma.JsonValue;
  level?: AuditLevelType;
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

export class LoggerService {
  level;

  constructor(level: pino.Level = 'info') {
    this.level = level;
  }

  // Private method for logging events
  #logEvent(props: LogEventProp) {
    const { event, data } = props;
    const level = this.level;
    const message = LogEventMessages[event];
    const tag = LogEventMapping[event];

    // 1. Log to console (existing behavior)
    logger[level]({ tag, data }, `[Audit] ${message}`);

    // 2. Save to DB
    createAuditLog({
      userId: data.userId,
      tag,
      event,
      message,
      data,
      level: level.toUpperCase() as AuditLevelType,
    }).catch((err) => {
      console.error('Failed to write audit log:', err);
      // Optionally send to Sentry here
    });
  }

  // Specific event loggers for each type of event
  LoggedIn(props: Omit<LoggedIn, 'event'>) {
    this.#logEvent({ ...props, event: 'UserLoginSuccessful' });
  }

  LoggedOut(props: Omit<LoggedOut, 'event'>) {
    this.#logEvent({ ...props, event: 'UserLogoutSuccessful' });
  }

  EmployeeUpdated(props: Omit<EmployeeUpdated, 'event'>) {
    this.#logEvent({ ...props, event: 'EmployeeUpdated' });
  }

  // Auto-delete logs older than 6 months
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
