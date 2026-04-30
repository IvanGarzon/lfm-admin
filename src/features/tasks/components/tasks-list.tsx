'use client';

import { useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { SearchParams } from 'nuqs/server';
import { RefreshCw } from 'lucide-react';

import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { useDataTable } from '@/hooks/use-data-table';
import { useSetTaskEnabled, useExecuteTask, useSyncTasks } from '../hooks/use-tasks';
import { createTaskColumns } from './task-columns';
import { TaskTable } from './task-table';
import type { TaskPagination } from '@/features/tasks/types';

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

const DEFAULT_PAGE_SIZE = 20;

interface TasksListProps {
  initialData: TaskPagination;
  searchParams: SearchParams;
}

export function TasksList({ initialData, searchParams: serverSearchParams }: TasksListProps) {
  const perPage = Number(serverSearchParams.perPage) || DEFAULT_PAGE_SIZE;
  const pageCount = Math.ceil(initialData.pagination.totalItems / perPage);

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedTaskName, setSelectedTaskName] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const setEnabledMutation = useSetTaskEnabled();
  const executeTaskMutation = useExecuteTask();
  const syncTasksMutation = useSyncTasks();

  const handleToggleEnabled = useCallback(
    (taskId: string, isEnabled: boolean) => {
      setEnabledMutation.mutate({ taskId, isEnabled });
    },
    [setEnabledMutation],
  );

  const handleExecuteTask = useCallback(
    (taskId: string) => {
      executeTaskMutation.mutate(taskId);
    },
    [executeTaskMutation],
  );

  const handleViewExecutions = useCallback((taskId: string, taskName: string) => {
    setSelectedTaskId(taskId);
    setSelectedTaskName(taskName);
    setDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false);
    setSelectedTaskId(null);
    setSelectedTaskName(null);
  }, []);

  const handleSyncTasks = useCallback(() => {
    syncTasksMutation.mutate();
  }, [syncTasksMutation]);

  const columns = useMemo(
    () =>
      createTaskColumns(
        handleToggleEnabled,
        handleExecuteTask,
        handleViewExecutions,
        executeTaskMutation.isPending,
        executeTaskMutation.variables,
        setEnabledMutation.isPending,
      ),
    [
      handleToggleEnabled,
      handleExecuteTask,
      handleViewExecutions,
      executeTaskMutation.isPending,
      executeTaskMutation.variables,
      setEnabledMutation.isPending,
    ],
  );

  const { table } = useDataTable({
    data: initialData.items,
    columns,
    pageCount: pageCount,
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
            <Button
              onClick={handleSyncTasks}
              disabled={syncTasksMutation.isPending}
              className="w-full sm:w-auto"
            >
              <RefreshCw
                aria-hidden="true"
                className={`h-4 w-4 ${syncTasksMutation.isPending ? 'animate-spin' : ''}`}
              />
              Sync Tasks
            </Button>
          </Box>
        </Box>

        <TaskTable
          table={table}
          items={initialData.items}
          totalItems={initialData.pagination.totalItems}
        />
      </Box>

      {drawerOpen ? (
        <TaskExecutionDrawer
          id={selectedTaskId || undefined}
          taskName={selectedTaskName || undefined}
          open={drawerOpen}
          onClose={handleCloseDrawer}
        />
      ) : null}
    </>
  );
}
