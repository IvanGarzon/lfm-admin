'use client';

import { ColumnDef } from '@tanstack/react-table';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import {
  Play,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Zap,
  Repeat,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { TaskCategorySchema, type TaskCategory } from '@/zod/schemas/enums/TaskCategory.schema';
import {
  ExecutionStatusSchema,
  type ExecutionStatus,
} from '@/zod/schemas/enums/ExecutionStatus.schema';
import { ScheduleTypeSchema, type ScheduleType } from '@/zod/schemas/enums/ScheduleType.schema';
import type { TaskWithStats } from '@/features/tasks/types';

const getCategoryColor = (category: TaskCategory) => {
  const colors: Record<TaskCategory, string> = {
    [TaskCategorySchema.enum.SYSTEM]: 'bg-gray-100 text-gray-800',
    [TaskCategorySchema.enum.EMAIL]: 'bg-blue-100 text-blue-800',
    [TaskCategorySchema.enum.CLEANUP]: 'bg-orange-100 text-orange-800',
    [TaskCategorySchema.enum.FINANCE]: 'bg-green-100 text-green-800',
    [TaskCategorySchema.enum.CUSTOM]: 'bg-purple-100 text-purple-800',
  };

  return colors[category] || 'bg-gray-100 text-gray-800';
};

const getStatusBadge = (status?: string) => {
  if (!status) {
    return (
      <Badge variant="outline" className="text-gray-500">
        Never run
      </Badge>
    );
  }

  const statusConfig: Record<
    ExecutionStatus,
    { color: string; icon: React.ReactNode; label: string }
  > = {
    [ExecutionStatusSchema.enum.RUNNING]: {
      color: 'bg-blue-100 text-blue-800',
      icon: <Loader2 className="h-3 w-3 animate-spin mr-1" />,
      label: 'Running',
    },
    [ExecutionStatusSchema.enum.COMPLETED]: {
      color: 'bg-green-100 text-green-800',
      icon: <CheckCircle2 className="h-3 w-3 mr-1" />,
      label: 'Completed',
    },
    [ExecutionStatusSchema.enum.FAILED]: {
      color: 'bg-red-100 text-red-800',
      icon: <XCircle className="h-3 w-3 mr-1" />,
      label: 'Failed',
    },
    [ExecutionStatusSchema.enum.CANCELLED]: {
      color: 'bg-gray-100 text-gray-800',
      icon: <AlertCircle className="h-3 w-3 mr-1" />,
      label: 'Cancelled',
    },
    [ExecutionStatusSchema.enum.TIMEOUT]: {
      color: 'bg-orange-100 text-orange-800',
      icon: <Clock className="h-3 w-3 mr-1" />,
      label: 'Timeout',
    },
  };

  const parsedStatus = ExecutionStatusSchema.safeParse(status);
  const config = parsedStatus.success
    ? statusConfig[parsedStatus.data]
    : {
        color: 'bg-gray-100 text-gray-800',
        icon: null,
        label: status,
      };

  return (
    <Badge className={`${config.color} flex items-center w-fit`} variant="secondary">
      {config.icon}
      {config.label}
    </Badge>
  );
};

const getScheduleTypeIcon = (scheduleType: ScheduleType) => {
  if (scheduleType === ScheduleTypeSchema.enum.CRON) {
    return <Clock className="h-4 w-4" />;
  }

  if (scheduleType === ScheduleTypeSchema.enum.EVENT) {
    return <Zap className="h-4 w-4" />;
  }

  return <Repeat className="h-4 w-4" />;
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
      cell: ({ row }) => (
        <Badge className={getCategoryColor(row.original.category)} variant="secondary">
          {row.original.category}
        </Badge>
      ),
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
            title="Run task"
          >
            {isExecuting && executingTaskId === row.original.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 p-0"
            onClick={() => onViewExecutions(row.original.id, row.original.functionName)}
            title="View executions"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];
}
