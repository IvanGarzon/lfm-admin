import { useQueryClient, QueryFunction, useMutation } from '@tanstack/react-query';
import {
  getTasks as getTasksAction,
  getTaskById as getTaskByIdAction,
  getTaskExecutions as getTaskExecutionsAction,
  getExecutionById as getExecutionByIdAction,
  getRecentExecutions as getRecentExecutionsAction,
  updateTask,
  setTaskEnabled,
  executeTask,
  syncTasks,
} from '@/actions/tasks';
import { toast } from 'sonner';
import type {
  ScheduledTask,
  TaskExecution,
  TaskCategory,
  ScheduleType,
  ExecutionStatus,
} from '@/prisma/client';

// Query keys as constants
export const QueryKeys = {
  TASK: {
    GET_ALL: 'TASKS_GET_ALL',
    GET_BY_ID: 'TASK_GET_BY_ID',
    GET_EXECUTIONS: 'TASK_GET_EXECUTIONS',
    GET_EXECUTION_BY_ID: 'TASK_GET_EXECUTION_BY_ID',
    GET_RECENT_EXECUTIONS: 'TASK_GET_RECENT_EXECUTIONS',
  },
};

export const MutationKeys = {
  TASK: {
    UPDATE: 'TASK_UPDATE',
    SET_ENABLED: 'TASK_SET_ENABLED',
    EXECUTE: 'TASK_EXECUTE',
  },
};

type QueryOptions<T, E = Error> = {
  queryKey: readonly [string, any];
  queryFn: QueryFunction<T, readonly [string, any], E>;
  placeholderData?: (previousData: T | undefined) => T | undefined;
  initialData?: () => T | undefined;
  refetchOnWindowFocus?: boolean;
  refetchInterval?: number | false;
  staleTime?: number;
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
 * Query options for fetching all tasks
 */
export const getTasks = (filters?: {
  category?: TaskCategory;
  isEnabled?: boolean;
  scheduleType?: ScheduleType;
}): Pick<QueryOptions<TaskWithStats[], Error>, 'queryKey' | 'queryFn'> => {
  return {
    queryKey: [QueryKeys.TASK.GET_ALL, filters || {}] as const,
    queryFn: async () => {
      const result = await getTasksAction(filters);

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch tasks');
      }

      return result.data;
    },
  };
};

/**
 * Hook to fetch all scheduled tasks with optional filters
 */
export function useTasks(filters?: {
  category?: TaskCategory;
  isEnabled?: boolean;
  scheduleType?: ScheduleType;
}): QueryOptions<TaskWithStats[], Error> {
  const queryClient = useQueryClient();

  return {
    ...getTasks(filters),
    placeholderData: (previousData) => previousData,
    initialData: () =>
      queryClient.getQueryData<TaskWithStats[]>([QueryKeys.TASK.GET_ALL, filters || {}]) ||
      undefined,
    refetchOnWindowFocus: true,
    refetchInterval: 5000, // Poll every 5 seconds to update task execution status
    staleTime: 0, // Always consider data stale to ensure fresh data
  };
}

/**
 * Query options for fetching a task by ID with stats
 */
export const getTaskById = (
  taskId: string,
): Pick<
  QueryOptions<
    ScheduledTask & {
      _count: { executions: number };
      lastExecution?: {
        id: string;
        status: string;
        startedAt: Date;
        completedAt: Date | null;
      } | null;
    },
    Error
  >,
  'queryKey' | 'queryFn'
> => {
  return {
    queryKey: [QueryKeys.TASK.GET_BY_ID, taskId] as const,
    queryFn: async () => {
      const result = await getTaskByIdAction(taskId);

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch task');
      }

      return result.data;
    },
  };
};

/**
 * Hook to fetch a task by ID with statistics
 */
export function useTask(taskId: string): QueryOptions<
  ScheduledTask & {
    _count: { executions: number };
    lastExecution?: {
      id: string;
      status: string;
      startedAt: Date;
      completedAt: Date | null;
    } | null;
  },
  Error
> {
  const queryClient = useQueryClient();

  return {
    ...getTaskById(taskId),
    placeholderData: (previousData) => previousData,
    initialData: () => queryClient.getQueryData([QueryKeys.TASK.GET_BY_ID, taskId]) || undefined,
    refetchOnWindowFocus: true,
    staleTime: 10000, // 10 seconds
  };
}

/**
 * Query options for fetching task executions
 */
export const getTaskExecutions = (
  taskId: string,
  options?: {
    limit?: number;
    offset?: number;
    status?: ExecutionStatus;
  },
): Pick<
  QueryOptions<
    {
      executions: TaskExecution[];
      stats: {
        total: number;
        completed: number;
        failed: number;
        running: number;
        avgDuration: number | null;
      };
    },
    Error
  >,
  'queryKey' | 'queryFn'
> => {
  return {
    queryKey: [QueryKeys.TASK.GET_EXECUTIONS, taskId, options || {}] as const,
    queryFn: async () => {
      const result = await getTaskExecutionsAction(taskId, options);

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch task executions');
      }

      return result.data;
    },
  };
};

/**
 * Hook to fetch execution history for a task
 */
export function useTaskExecutions(
  taskId: string,
  options?: {
    limit?: number;
    offset?: number;
    status?: ExecutionStatus;
  },
): QueryOptions<
  {
    executions: TaskExecution[];
    stats: {
      total: number;
      completed: number;
      failed: number;
      running: number;
      avgDuration: number | null;
    };
  },
  Error
> {
  const queryClient = useQueryClient();

  return {
    ...getTaskExecutions(taskId, options),
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: true,
    refetchInterval: 3000, // Poll every 3 seconds to catch status updates from background tasks
    staleTime: 0, // Always consider data stale to ensure fresh data
  };
}

/**
 * Hook to update task configuration
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [MutationKeys.TASK.UPDATE],
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
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
      queryClient.invalidateQueries({ queryKey: [QueryKeys.TASK.GET_ALL] });
      queryClient.invalidateQueries({ queryKey: [QueryKeys.TASK.GET_BY_ID, data.id] });
      toast.success('Task updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update task');
    },
  });
}

/**
 * Hook to enable or disable a task
 */
export function useSetTaskEnabled() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [MutationKeys.TASK.SET_ENABLED],
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    mutationFn: async (params: { taskId: string; isEnabled: boolean }) => {
      const result = await setTaskEnabled(params.taskId, params.isEnabled);

      if (!result.success) {
        throw new Error(result.error || 'Failed to update task status');
      }

      return result.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.TASK.GET_ALL] });
      queryClient.invalidateQueries({ queryKey: [QueryKeys.TASK.GET_BY_ID, data.id] });
      toast.success(`Task ${variables.isEnabled ? 'enabled' : 'disabled'} successfully`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update task status');
    },
  });
}

/**
 * Hook to manually execute a task
 */
export function useExecuteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [MutationKeys.TASK.EXECUTE],
    retry: 1,
    retryDelay: 1000,
    mutationFn: async (taskId: string) => {
      const result = await executeTask(taskId);

      if (!result.success) {
        throw new Error(result.error || 'Failed to execute task');
      }

      return result.data;
    },
    onSuccess: (data, taskId) => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.TASK.GET_BY_ID, taskId] });
      queryClient.invalidateQueries({ queryKey: [QueryKeys.TASK.GET_EXECUTIONS, taskId] });
      queryClient.invalidateQueries({ queryKey: [QueryKeys.TASK.GET_RECENT_EXECUTIONS] });
      toast.success('Task triggered successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to execute task');
    },
  });
}

/**
 * Query options for fetching recent executions
 */
export const getRecentExecutions = (
  limit: number = 10,
): Pick<
  QueryOptions<
    (TaskExecution & {
      task: {
        id: string;
        functionName: string;
        category: string;
      };
    })[],
    Error
  >,
  'queryKey' | 'queryFn'
> => {
  return {
    queryKey: [QueryKeys.TASK.GET_RECENT_EXECUTIONS, limit] as const,
    queryFn: async () => {
      const result = await getRecentExecutionsAction(limit);

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch recent executions');
      }

      return result.data;
    },
  };
};

/**
 * Hook to fetch recent executions across all tasks
 */
export function useRecentExecutions(limit: number = 10): QueryOptions<
  (TaskExecution & {
    task: {
      id: string;
      functionName: string;
      category: string;
    };
  })[],
  Error
> {
  const queryClient = useQueryClient();

  return {
    ...getRecentExecutions(limit),
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: true,
    staleTime: 5000, // 5 seconds
  };
}

/**
 * Hook to sync tasks from code definitions to database
 */
export function useSyncTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['TASK_SYNC'],
    retry: 1,
    retryDelay: 1000,
    mutationFn: async () => {
      const result = await syncTasks();

      if (!result.success) {
        throw new Error(result.error || 'Failed to sync tasks');
      }

      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.TASK.GET_ALL] });
      toast.success(`Synced ${data.synced} tasks successfully`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to sync tasks');
    },
  });
}
