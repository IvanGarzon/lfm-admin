'use client';

import {
  ExecutionStatusSchema,
  type ExecutionStatus,
} from '@/zod/schemas/enums/ExecutionStatus.schema';
import { useTaskExecutions } from '../hooks/use-tasks';
import { Box } from '@/components/ui/box';
import { Badge } from '@/components/ui/badge';
import { TaskExecutionStatusBadge } from './task-execution-status-badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CheckCircle2, XCircle, Loader2, Clock, AlertCircle } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface ExecutionHistoryTableProps {
  taskId: string;
  limit?: number;
}

export function ExecutionHistoryTable({ taskId, limit = 50 }: ExecutionHistoryTableProps) {
  const { data, isLoading, error } = useTaskExecutions(taskId, { limit });

  const getStatusIcon = (status: ExecutionStatus) => {
    switch (status) {
      case ExecutionStatusSchema.enum.COMPLETED:
        return <CheckCircle2 className="h-4 w-4 text-green-600" aria-hidden="true" />;
      case ExecutionStatusSchema.enum.FAILED:
        return <XCircle className="h-4 w-4 text-red-600" aria-hidden="true" />;
      case ExecutionStatusSchema.enum.RUNNING:
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" aria-hidden="true" />;
      case ExecutionStatusSchema.enum.CANCELLED:
        return <AlertCircle className="h-4 w-4 text-orange-600" aria-hidden="true" />;
      case ExecutionStatusSchema.enum.TIMEOUT:
        return <Clock className="h-4 w-4 text-orange-600" aria-hidden="true" />;
      default:
        return null;
    }
  };

  const getTriggerBadge = (triggeredBy: string) => {
    const colors: Record<string, string> = {
      SCHEDULE: 'bg-muted text-muted-foreground border-border',
      MANUAL: 'bg-purple-50 text-purple-700 border-purple-200',
      EVENT: 'bg-blue-50 text-blue-700 border-blue-200',
      RETRY: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    };

    return (
      <Badge
        variant="outline"
        className={colors[triggeredBy] || 'bg-muted text-muted-foreground border-border'}
      >
        {triggeredBy}
      </Badge>
    );
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden="true" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <Box className="text-center text-destructive">
            <XCircle className="mx-auto h-12 w-12 mb-4" aria-hidden="true" />
            <p>{error.message || 'Failed to load execution history'}</p>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const { executions, stats } = data;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Execution History</CardTitle>
        <CardDescription>
          {stats ? (
            <Box className="flex gap-4 mt-2">
              <span>Total: {stats.total}</span>
              <span className="text-green-600">Completed: {stats.completed}</span>
              <span className="text-destructive">Failed: {stats.failed}</span>
              <span className="text-blue-600">Running: {stats.running}</span>
              {stats.avgDuration && <span>Avg Duration: {formatDuration(stats.avgDuration)}</span>}
            </Box>
          ) : null}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {executions.length === 0 ? (
          <Box className="text-center text-muted-foreground py-8">
            <p>No execution history</p>
          </Box>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Triggered By</TableHead>
                <TableHead>Retries</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {executions.map((execution) => (
                <TableRow key={execution.id}>
                  <TableCell>
                    <Box className="flex items-center gap-2">
                      {getStatusIcon(execution.status)}
                      <TaskExecutionStatusBadge status={execution.status} />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Box className="text-sm">
                        {format(new Date(execution.startedAt), 'MMM d, yyyy')}
                      </Box>
                      <Box className="text-xs text-muted-foreground">
                        {format(new Date(execution.startedAt), 'HH:mm:ss')}
                      </Box>
                      <Box className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(execution.startedAt), { addSuffix: true })}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{formatDuration(execution.duration)}</TableCell>
                  <TableCell>{getTriggerBadge(execution.triggeredBy)}</TableCell>
                  <TableCell>
                    {execution.retryCount > 0 ? (
                      <Badge variant="outline">{execution.retryCount}</Badge>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {execution.error ? (
                      <Box
                        className="max-w-md truncate text-sm text-destructive"
                        title={execution.error}
                      >
                        {execution.error}
                      </Box>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
