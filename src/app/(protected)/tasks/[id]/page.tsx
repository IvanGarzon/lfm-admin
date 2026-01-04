'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTask, useSetTaskEnabled, useExecuteTask } from '@/features/tasks/hooks/use-tasks';
import { ExecutionHistoryTable } from '@/features/tasks/components/execution-history-table';
import { Box } from '@/components/ui/box';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Play, Loader2, Clock, Hash, Calendar } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import Link from 'next/link';
import type { TaskCategory } from '@/prisma/client';

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: task, isLoading, error } = useQuery(useTask(id));
  const { mutate: setEnabled, isPending: isTogglingEnabled } = useSetTaskEnabled();
  const { mutate: executeMutate, isPending: isExecuting } = useExecuteTask();

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

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-destructive">
              <p>{error?.message || 'Task not found'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Box className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <Box className="flex items-center justify-between">
        <Box className="flex items-center gap-4">
          <Link href="/tasks">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <Box>
            <h1 className="text-3xl font-bold">{task.functionName}</h1>
            {task.description && <p className="text-muted-foreground mt-1">{task.description}</p>}
          </Box>
        </Box>
        <Box className="flex items-center gap-4">
          <Box className="flex items-center gap-2">
            <span className="text-sm font-medium">Enabled</span>
            <Switch
              checked={task.isEnabled}
              onCheckedChange={(checked) => setEnabled({ taskId: task.id, isEnabled: checked })}
              disabled={isTogglingEnabled}
            />
          </Box>
          <Button onClick={() => executeMutate(task.id)} disabled={!task.isEnabled || isExecuting}>
            <Play className="h-4 w-4 mr-2" />
            Run Now
          </Button>
        </Box>
      </Box>

      {/* Task Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Task Details</CardTitle>
          <CardDescription>Configuration and metadata</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Box className="grid grid-cols-2 gap-4">
            <Box>
              <Box className="text-sm font-medium text-muted-foreground mb-1">Category</Box>
              <Badge className={getCategoryColor(task.category)} variant="secondary">
                {task.category}
              </Badge>
            </Box>
            <Box>
              <Box className="text-sm font-medium text-muted-foreground mb-1">Schedule Type</Box>
              <Badge variant="outline">{task.scheduleType}</Badge>
            </Box>
          </Box>

          <Separator />

          <Box className="grid grid-cols-2 gap-4">
            <Box>
              <Box className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Cron Schedule
              </Box>
              <code className="text-sm bg-muted px-2 py-1 rounded">
                {task.cronSchedule || 'N/A'}
              </code>
            </Box>
            <Box>
              <Box className="text-sm font-medium text-muted-foreground mb-1">Event Name</Box>
              <code className="text-sm bg-muted px-2 py-1 rounded">{task.eventName || 'N/A'}</code>
            </Box>
          </Box>

          <Separator />

          <Box className="grid grid-cols-3 gap-4">
            <Box>
              <Box className="text-sm font-medium text-muted-foreground mb-1">Retries</Box>
              <Box className="text-lg font-semibold">{task.retries || 0}</Box>
            </Box>
            <Box>
              <Box className="text-sm font-medium text-muted-foreground mb-1">
                Concurrency Limit
              </Box>
              <Box className="text-lg font-semibold">{task.concurrencyLimit || 1}</Box>
            </Box>
            <Box>
              <Box className="text-sm font-medium text-muted-foreground mb-1">Timeout</Box>
              <Box className="text-lg font-semibold">
                {task.timeout ? `${task.timeout / 1000}s` : 'N/A'}
              </Box>
            </Box>
          </Box>

          <Separator />

          <Box className="grid grid-cols-2 gap-4">
            <Box>
              <Box className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Function ID
              </Box>
              <code className="text-sm bg-muted px-2 py-1 rounded">{task.functionId}</code>
            </Box>
            <Box>
              <Box className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Last Synced
              </Box>
              <Box className="text-sm">
                {formatDistanceToNow(new Date(task.lastSyncedAt), { addSuffix: true })}
              </Box>
            </Box>
          </Box>

          {task._count && (
            <>
              <Separator />
              <Box>
                <Box className="text-sm font-medium text-muted-foreground mb-1">
                  Total Executions
                </Box>
                <Box className="text-2xl font-bold">{task._count.executions}</Box>
              </Box>
            </>
          )}

          {task.lastExecution && (
            <>
              <Separator />
              <Box>
                <Box className="text-sm font-medium text-muted-foreground mb-2">Last Execution</Box>
                <Box className="flex items-center justify-between">
                  <Box>
                    <Badge
                      variant={
                        task.lastExecution.status === 'COMPLETED' ? 'default' : 'destructive'
                      }
                    >
                      {task.lastExecution.status}
                    </Badge>
                  </Box>
                  <Box className="text-sm text-muted-foreground">
                    {format(new Date(task.lastExecution.startedAt), 'MMM d, yyyy HH:mm:ss')}
                  </Box>
                </Box>
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* Execution History */}
      <ExecutionHistoryTable taskId={task.id} />
    </Box>
  );
}
