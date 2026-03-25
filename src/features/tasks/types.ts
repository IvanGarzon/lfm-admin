import type { ScheduledTask } from '@/prisma/client';
import type { ExecutionStatus } from '@/zod/schemas/enums/ExecutionStatus.schema';
import type { PaginationMeta } from '@/types/pagination';

export type TaskWithStats = Pick<
  ScheduledTask,
  | 'id'
  | 'functionName'
  | 'description'
  | 'isEnabled'
  | 'category'
  | 'scheduleType'
  | 'cronSchedule'
  | 'eventName'
> & {
  _count: {
    executions: number;
  };
  lastExecution?: {
    id: string;
    status: ExecutionStatus;
    startedAt: Date;
    completedAt: Date | null;
    triggeredByUser: string | null;
    user?: { firstName: string; lastName: string; email: string } | null;
  } | null;
};

export type TaskPagination = {
  items: TaskWithStats[];
  pagination: PaginationMeta;
};
