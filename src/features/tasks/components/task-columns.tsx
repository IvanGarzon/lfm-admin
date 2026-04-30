'use client';

import { ColumnDef } from '@tanstack/react-table';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Play, Eye, Clock, Zap, Repeat, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ScheduleTypeSchema, type ScheduleType } from '@/zod/schemas/enums/ScheduleType.schema';
import {
  ExecutionStatusSchema,
  type ExecutionStatus,
} from '@/zod/schemas/enums/ExecutionStatus.schema';
import type { TaskWithStats } from '@/features/tasks/types';
import { TaskExecutionStatusBadge } from './task-execution-status-badge';
import { TaskCategoryBadge } from './task-category-badge';

const getStatusBadge = (status?: string) => {
  if (!status) return null;

  const parsedStatus = ExecutionStatusSchema.safeParse(status);
  if (!parsedStatus.success) return null;

  return <TaskExecutionStatusBadge status={parsedStatus.data} />;
};

const getScheduleTypeIcon = (scheduleType: ScheduleType) => {
  if (scheduleType === ScheduleTypeSchema.enum.CRON) {
    return <Clock className="h-4 w-4" aria-hidden="true" />;
  }

  if (scheduleType === ScheduleTypeSchema.enum.EVENT) {
    return <Zap className="h-4 w-4" aria-hidden="true" />;
  }

  return <Repeat className="h-4 w-4" aria-hidden="true" />;
};

export function createTaskColumns(
  onToggleEnabled: (taskId: string, isEnabled: boolean) => void,
  onExecute: (taskId: string) => void,
  onViewExecutions: (taskId: string, taskName: string) => void,
  isExecuting: boolean,
  executingTaskId?: string,
  isTogglingEnabled?: boolean,
): ColumnDef<TaskWithStats>[] {
  return [
    {
      accessorKey: 'isEnabled',
      header: 'Enabled',
      cell: ({ row }) => (
        <Switch
          checked={row.original.isEnabled}
          onCheckedChange={(checked) => onToggleEnabled(row.original.id, checked)}
          disabled={isTogglingEnabled}
        />
      ),
    },
    {
      accessorKey: 'functionName',
      header: 'Task Name',
      cell: ({ row }) => (
        <div>
          <Link href={`/tools/tasks/${row.original.id}`} className="hover:underline font-medium">
            {row.original.functionName}
          </Link>
          {row.original.description && (
            <p className="text-sm text-muted-foreground">{row.original.description}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => <TaskCategoryBadge category={row.original.category} />,
    },
    {
      accessorKey: 'lastExecution.status',
      header: 'Status',
      cell: ({ row }) => (
        <div>
          {getStatusBadge(row.original.lastExecution?.status)}
          {row.original.lastExecution?.startedAt && (
            <p className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(row.original.lastExecution.startedAt), {
                addSuffix: true,
              })}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'scheduleType',
      header: 'Schedule',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {getScheduleTypeIcon(row.original.scheduleType)}
          <span className="text-sm font-mono">
            {row.original.cronSchedule || row.original.eventName || '-'}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'lastExecution.user',
      header: 'Last Run By',
      cell: ({ row }) =>
        row.original.lastExecution?.user ? (
          <div className="text-sm">
            <p className="font-medium">
              {`${row.original.lastExecution.user.firstName} ${row.original.lastExecution.user.lastName}`}
            </p>
            <p className="text-muted-foreground text-xs">{row.original.lastExecution.user.email}</p>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end">
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 p-0"
            onClick={() => onExecute(row.original.id)}
            disabled={
              !row.original.isEnabled || (isExecuting && executingTaskId === row.original.id)
            }
            aria-label="Run task"
          >
            {isExecuting && executingTaskId === row.original.id ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Play className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 p-0"
            onClick={() => onViewExecutions(row.original.id, row.original.functionName)}
            aria-label="View executions"
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      ),
    },
  ];
}
