'use client';

import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ScheduledTask, TaskCategory, ScheduleType, ExecutionStatus } from '@/prisma/client';
import {
  getTasks,
  getTaskById,
  getTaskExecutions,
  getExecutionById,
  getRecentExecutions,
} from '@/actions/tasks/queries';
import { updateTask, setTaskEnabled, executeTask, syncTasks } from '@/actions/tasks/mutations';

// -- Task Query Keys -------------------------------------------------------

export const TASK_KEYS = {
  all: ['tasks'] as const,
  lists: () => [...TASK_KEYS.all, 'list'] as const,
  list: (filters?: { category?: TaskCategory; isEnabled?: boolean; scheduleType?: ScheduleType }) =>
    [...TASK_KEYS.lists(), { filters }] as const,
  details: () => [...TASK_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...TASK_KEYS.details(), id] as const,
  executions: (id: string) => [...TASK_KEYS.detail(id), 'executions'] as const,
  execution: (executionId: string) => [...TASK_KEYS.all, 'execution', executionId] as const,
  recentExecutions: () => [...TASK_KEYS.all, 'recent-executions'] as const,
};

export type TaskWithStats = ScheduledTask & {
  _count: { executions: number };
  lastExecution?: {
    id: string;
    status: string;
    startedAt: Date;
    completedAt: Date | null;
    triggeredByUser: string | null;
    user?: {
      firstName: string;
      lastName: string;
      email: string | null;
    } | null;
  } | null;
};

/**
 * Invalidates task-related queries after mutations.
 * Ensures cache consistency across task lists, details, and executions.
 */
function invalidateTaskQueries(
  queryClient: QueryClient,
  options?: {
    taskId?: string;
    invalidateExecutions?: boolean;
  },
) {
  if (options?.taskId) {
    queryClient.invalidateQueries({ queryKey: TASK_KEYS.detail(options.taskId) });
    if (options.invalidateExecutions) {
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.executions(options.taskId) });
    }
  }

  queryClient.invalidateQueries({ queryKey: TASK_KEYS.lists() });
}

/**
 * Fetches all scheduled tasks with optional filters.
 * Use this hook for task list views and tables.
 *
 * @param filters - Optional filtering options (category, isEnabled, scheduleType)
 * @returns Query result containing the filtered task list
 */
export function useTasks(filters?: {
  category?: TaskCategory;
  isEnabled?: boolean;
  scheduleType?: ScheduleType;
}) {
  return useQuery({
    queryKey: TASK_KEYS.list(filters),
    queryFn: async () => {
      const result = await getTasks(filters);

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch tasks');
      }

      return result.data;
    },
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
    staleTime: 10000,
  });
}

/**
 * Fetches a single task by ID with statistics.
 * Use this hook for task detail views.
 *
 * @param taskId - The unique identifier of the task
 * @returns Query result containing the task with statistics
 */
export function useTask(taskId: string) {
  return useQuery({
    queryKey: TASK_KEYS.detail(taskId),
    queryFn: async () => {
      const result = await getTaskById(taskId);

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch task');
      }

      return result.data;
    },
    refetchOnWindowFocus: true,
    staleTime: 10000,
  });
}

/**
 * Fetches execution history for a task.
 * Use this hook for viewing task execution logs and statistics.
 *
 * @param taskId - The unique identifier of the task
 * @param options - Pagination and filtering options
 * @returns Query result containing executions and statistics
 */
export function useTaskExecutions(
  taskId: string,
  options?: {
    limit?: number;
    offset?: number;
    status?: ExecutionStatus;
  },
) {
  return useQuery({
    queryKey: TASK_KEYS.executions(taskId),
    queryFn: async () => {
      const result = await getTaskExecutions(taskId, options);

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch task executions');
      }

      return result.data;
    },
    refetchOnWindowFocus: false,
    refetchInterval: 15000, // Poll every 15 seconds
    staleTime: 5000, // 5 seconds
  });
}

/**
 * Fetches a single execution by ID.
 * Use this hook for execution detail views.
 *
 * @param executionId - The unique identifier of the execution
 * @returns Query result containing the execution details
 */
export function useExecution(executionId: string) {
  return useQuery({
    queryKey: TASK_KEYS.execution(executionId),
    queryFn: async () => {
      const result = await getExecutionById(executionId);

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch execution');
      }

      return result.data;
    },
    staleTime: 5000,
  });
}

/**
 * Fetches recent executions across all tasks.
 * Use this hook for dashboard views or recent activity lists.
 *
 * @param limit - Maximum number of executions to return (default: 10)
 * @returns Query result containing recent executions
 */
export function useRecentExecutions(limit: number = 10) {
  return useQuery({
    queryKey: TASK_KEYS.recentExecutions(),
    queryFn: async () => {
      const result = await getRecentExecutions(limit);

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch recent executions');
      }

      return result.data;
    },
    refetchOnWindowFocus: true,
    staleTime: 5000,
  });
}

/**
 * Updates task configuration.
 * Use this hook to modify task settings like cron schedule, retries, etc.
 *
 * @returns Mutation hook for updating tasks
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      taskId: string;
      data: {
        isEnabled?: boolean;
        cronSchedule?: string;
        retries?: number;
        concurrencyLimit?: number;
        timeout?: number;
        metadata?: any;
      };
    }) => {
      const result = await updateTask(params.taskId, params.data);

      if (!result.success) {
        throw new Error(result.error || 'Failed to update task');
      }

      return result.data;
    },
    onSuccess: (data) => {
      invalidateTaskQueries(queryClient, { taskId: data.id });
      toast.success('Task updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update task');
    },
  });
}

/**
 * Enables or disables a task.
 * Use this hook to toggle task execution status.
 *
 * @returns Mutation hook for enabling/disabling tasks
 */
export function useSetTaskEnabled() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { taskId: string; isEnabled: boolean }) => {
      const result = await setTaskEnabled(params.taskId, params.isEnabled);

      if (!result.success) {
        throw new Error(result.error || 'Failed to update task status');
      }

      return result.data;
    },
    onSuccess: (data, variables) => {
      invalidateTaskQueries(queryClient, { taskId: data.id });
      toast.success(`Task ${variables.isEnabled ? 'enabled' : 'disabled'} successfully`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update task status');
    },
  });
}

/**
 * Manually executes a task.
 * Use this hook to trigger task execution on demand.
 *
 * @returns Mutation hook for executing tasks
 */
export function useExecuteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const result = await executeTask(taskId);

      if (!result.success) {
        throw new Error(result.error || 'Failed to execute task');
      }

      return result.data;
    },
    onSuccess: (data, taskId) => {
      invalidateTaskQueries(queryClient, { taskId, invalidateExecutions: true });
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.recentExecutions() });
      toast.success('Task triggered successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to execute task');
    },
  });
}

/**
 * Syncs task definitions from code to database.
 * Use this hook to update database with latest task configurations.
 *
 * @returns Mutation hook for syncing tasks
 */
export function useSyncTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const result = await syncTasks();

      if (!result.success) {
        throw new Error(result.error || 'Failed to sync tasks');
      }

      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.all });
      toast.success(`Synced ${data.synced} tasks successfully`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to sync tasks');
    },
  });
}
