'use client';

import { useQuery } from '@tanstack/react-query';
import { useTaskExecutions } from '../hooks/use-tasks';
import { Box } from '@/components/ui/box';
import { Badge } from '@/components/ui/badge';
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
import { ExecutionStatus } from '@/prisma/client';

interface ExecutionHistoryTableProps {
  taskId: string;
  limit?: number;
}

export function ExecutionHistoryTable({ taskId, limit = 50 }: ExecutionHistoryTableProps) {
  const { data, isLoading, error } = useQuery(useTaskExecutions(taskId, { limit }));

  const getStatusIcon = (status: ExecutionStatus) => {
    switch (status) {
      case ExecutionStatus.COMPLETED:
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case ExecutionStatus.FAILED:
        return <XCircle className="h-4 w-4 text-red-600" />;
      case ExecutionStatus.RUNNING:
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      case ExecutionStatus.CANCELLED:
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case ExecutionStatus.TIMEOUT:
        return <Clock className="h-4 w-4 text-orange-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: ExecutionStatus) => {
    const variants: Record<ExecutionStatus, string> = {
      COMPLETED: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800',
      RUNNING: 'bg-blue-100 text-blue-800',
      CANCELLED: 'bg-orange-100 text-orange-800',
      TIMEOUT: 'bg-orange-100 text-orange-800',
    };

    return (
      <Badge className={variants[status]} variant="secondary">
        {status}
      </Badge>
    );
  };

  const getTriggerBadge = (triggeredBy: string) => {
    const colors: Record<string, string> = {
      SCHEDULE: 'bg-gray-100 text-gray-800',
      MANUAL: 'bg-purple-100 text-purple-800',
      EVENT: 'bg-blue-100 text-blue-800',
      RETRY: 'bg-yellow-100 text-yellow-800',
    };

    return (
      <Badge className={colors[triggeredBy] || 'bg-gray-100 text-gray-800'} variant="secondary">
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
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <Box className="text-center text-destructive">
            <XCircle className="mx-auto h-12 w-12 mb-4" />
            <p>{error.message || 'Failed to load execution history'}</p>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const { executions, stats } = data || { executions: [], stats: null };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Execution History</CardTitle>
        <CardDescription>
          {stats ? (
            <Box className="flex gap-4 mt-2">
              <span>Total: {stats.total}</span>
              <span className="text-green-600">Completed: {stats.completed}</span>
              <span className="text-red-600">Failed: {stats.failed}</span>
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
                      {getStatusBadge(execution.status)}
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
