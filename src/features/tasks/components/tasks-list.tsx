'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { RefreshCw } from 'lucide-react';

import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { useDataTable } from '@/hooks/use-data-table';
import {
  useSetTaskEnabled,
  useExecuteTask,
  useSyncTasks,
  type TaskWithStats,
} from '../hooks/use-tasks';
import { createTaskColumns } from './task-columns';
import { TaskTable } from './task-table';

const TaskExecutionDrawer = dynamic(
  () =>
    import('@/features/tasks/components/task-execution-drawer').then(
      (mod) => mod.TaskExecutionDrawer,
    ),
  {
    ssr: false,
    loading: () => null,
  },
);

interface TasksListProps {
  data: TaskWithStats[];
}

export function TasksList({ data }: TasksListProps) {
  const { mutate: setEnabled, isPending: isTogglingEnabled } = useSetTaskEnabled();
  const {
    mutate: executeMutate,
    isPending: isExecuting,
    variables: executingTaskId,
  } = useExecuteTask();
  const { mutate: syncTasks, isPending: isSyncing } = useSyncTasks();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedTaskName, setSelectedTaskName] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleViewExecutions = (taskId: string, taskName: string) => {
    setSelectedTaskId(taskId);
    setSelectedTaskName(taskName);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedTaskId(null);
    setSelectedTaskName(null);
  };

  const columns = useMemo(
    () =>
      createTaskColumns(
        (taskId, isEnabled) => setEnabled({ taskId, isEnabled }),
        (taskId) => executeMutate(taskId),
        handleViewExecutions,
        isExecuting,
        executingTaskId,
        isTogglingEnabled,
      ),
    [setEnabled, executeMutate, isExecuting, executingTaskId, isTogglingEnabled],
  );

  const { table } = useDataTable({
    data,
    columns,
    pageCount: 1,
    shallow: false,
    debounceMs: 500,
  });

  return (
    <>
      <Box className="space-y-4 min-w-0 w-full">
        <Box className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Box className="min-w-0">
            <h1 className="text-3xl font-bold tracking-tight">Schedule Tasks</h1>
            <p className="text-muted-foreground text-sm">
              Manage and monitor your background jobs and scheduled tasks
            </p>
          </Box>
          <Box className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center shrink-0">
            <Button onClick={() => syncTasks()} disabled={isSyncing} className="w-full sm:w-auto">
              <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              Sync Tasks
            </Button>
          </Box>
        </Box>

        <TaskTable table={table} items={data} totalItems={data.length} />
      </Box>

      <TaskExecutionDrawer
        taskId={selectedTaskId || undefined}
        taskName={selectedTaskName || undefined}
        open={drawerOpen}
        onClose={handleCloseDrawer}
      />
    </>
  );
}
