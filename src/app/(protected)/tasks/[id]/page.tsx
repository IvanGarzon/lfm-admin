'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTask, useSetTaskEnabled, useExecuteTask } from '@/features/tasks/hooks/use-tasks';
import { ExecutionHistoryTable } from '@/features/tasks/components/execution-history-table';
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
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/tasks">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{task.functionName}</h1>
            {task.description && <p className="text-muted-foreground mt-1">{task.description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Enabled</span>
            <Switch
              checked={task.isEnabled}
              onCheckedChange={(checked) => setEnabled({ taskId: task.id, isEnabled: checked })}
              disabled={isTogglingEnabled}
            />
          </div>
          <Button onClick={() => executeMutate(task.id)} disabled={!task.isEnabled || isExecuting}>
            <Play className="h-4 w-4 mr-2" />
            Run Now
          </Button>
        </div>
      </div>

      {/* Task Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Task Details</CardTitle>
          <CardDescription>Configuration and metadata</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Category</div>
              <Badge className={getCategoryColor(task.category)} variant="secondary">
                {task.category}
              </Badge>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Schedule Type</div>
              <Badge variant="outline">{task.scheduleType}</Badge>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Cron Schedule
              </div>
              <code className="text-sm bg-muted px-2 py-1 rounded">
                {task.cronSchedule || 'N/A'}
              </code>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Event Name</div>
              <code className="text-sm bg-muted px-2 py-1 rounded">{task.eventName || 'N/A'}</code>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Retries</div>
              <div className="text-lg font-semibold">{task.retries || 0}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">
                Concurrency Limit
              </div>
              <div className="text-lg font-semibold">{task.concurrencyLimit || 1}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Timeout</div>
              <div className="text-lg font-semibold">
                {task.timeout ? `${task.timeout / 1000}s` : 'N/A'}
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Function ID
              </div>
              <code className="text-sm bg-muted px-2 py-1 rounded">{task.functionId}</code>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Last Synced
              </div>
              <div className="text-sm">
                {formatDistanceToNow(new Date(task.lastSyncedAt), { addSuffix: true })}
              </div>
            </div>
          </div>

          {task._count && (
            <>
              <Separator />
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Total Executions
                </div>
                <div className="text-2xl font-bold">{task._count.executions}</div>
              </div>
            </>
          )}

          {task.lastExecution && (
            <>
              <Separator />
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-2">Last Execution</div>
                <div className="flex items-center justify-between">
                  <div>
                    <Badge
                      variant={
                        task.lastExecution.status === 'COMPLETED' ? 'default' : 'destructive'
                      }
                    >
                      {task.lastExecution.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(task.lastExecution.startedAt), 'MMM d, yyyy HH:mm:ss')}
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Execution History */}
      <ExecutionHistoryTable taskId={task.id} />
    </div>
  );
}
