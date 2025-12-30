'use client';

import { ColumnDef } from '@tanstack/react-table';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Play, Eye, Clock, CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import type { TaskCategory, ExecutionStatus } from '@/prisma/client';
import type { TaskWithStats } from '../hooks/use-tasks';

const getCategoryColor = (category: TaskCategory) => {
  const colors: Record<TaskCategory, string> = {
    SYSTEM: 'bg-gray-100 text-gray-800',
    EMAIL: 'bg-blue-100 text-blue-800',
    CLEANUP: 'bg-orange-100 text-orange-800',
    FINANCE: 'bg-green-100 text-green-800',
    CUSTOM: 'bg-purple-100 text-purple-800',
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
    RUNNING: {
      color: 'bg-blue-100 text-blue-800',
      icon: <Loader2 className="h-3 w-3 animate-spin mr-1" />,
      label: 'Running',
    },
    COMPLETED: {
      color: 'bg-green-100 text-green-800',
      icon: <CheckCircle2 className="h-3 w-3 mr-1" />,
      label: 'Completed',
    },
    FAILED: {
      color: 'bg-red-100 text-red-800',
      icon: <XCircle className="h-3 w-3 mr-1" />,
      label: 'Failed',
    },
    CANCELLED: {
      color: 'bg-gray-100 text-gray-800',
      icon: <AlertCircle className="h-3 w-3 mr-1" />,
      label: 'Cancelled',
    },
    TIMEOUT: {
      color: 'bg-orange-100 text-orange-800',
      icon: <Clock className="h-3 w-3 mr-1" />,
      label: 'Timeout',
    },
  };

  const config = statusConfig[status as ExecutionStatus] || {
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

const getScheduleTypeIcon = (scheduleType: 'CRON' | 'EVENT') => {
  if (scheduleType === 'CRON') return <Clock className="h-4 w-4" />;
  return <span className="text-xs">⚡</span>;
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
          <Link href={`/tasks/${row.original.id}`} className="hover:underline font-medium">
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
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onExecute(row.original.id)}
            disabled={
              !row.original.isEnabled || (isExecuting && executingTaskId === row.original.id)
            }
          >
            {isExecuting && executingTaskId === row.original.id ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-1" />
            )}
            Run Now
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onViewExecutions(row.original.id, row.original.functionName)}
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
        </div>
      ),
    },
  ];
}
