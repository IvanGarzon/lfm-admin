/**
 * Represents a single execution attempt of a scheduled task.
 * Contains all information about the task run including timing, status, and results.
 */
export interface TaskRun {
  /** Unique identifier for this task run (CUID2) */
  id: string;

  /** Name of the task that was executed */
  taskName: string;

  /** Current status of the task execution */
  status: TaskRunStatus;

  /** Timestamp when the task execution began */
  startedAt: Date;

  /** Timestamp when the task execution finished (success or failure) */
  completedAt?: Date;

  /** Total execution time in milliseconds */
  durationMs?: number;

  /** Error message if the task failed */
  errorMessage?: string;

  /** Categorized error code for programmatic error handling */
  errorCode?: string;

  /** Success message returned by the task handler */
  resultMessage?: string;

  /** PostgreSQL advisory lock ID used to prevent concurrent executions */
  advisoryLockId?: bigint;

  /** ID of the original failed run if this is a retry attempt */
  retryOfRunId?: string;
}

/**
 * Possible states of a task execution.
 */
export type TaskRunStatus =
  /** Task is currently executing */
  | 'RUNNING'
  /** Task completed successfully */
  | 'COMPLETED'
  /** Task failed with an error */
  | 'FAILED'
  /** Task was terminated due to timeout */
  | 'TIMEOUT';

/**
 * Data required to create a new task run record.
 * Used when starting task execution to track the attempt.
 */
export interface CreateTaskRunData {
  /** Name of the task being executed */
  taskName: string;

  /** Initial status (typically 'RUNNING') */
  status: TaskRunStatus;

  /** When the task execution started */
  startedAt: Date;

  /** Advisory lock ID to prevent concurrent runs of the same task */
  advisoryLockId?: bigint;

  /** If this is a retry, the ID of the original failed run */
  retryOfRunId?: string;
}

/**
 * Data for updating an existing task run record.
 * Used to record completion, failure, or other status changes.
 */
export interface UpdateTaskRunData {
  /** New status of the task run */
  status?: TaskRunStatus;

  /** When the task finished executing */
  completedAt?: Date;

  /** Total execution time in milliseconds */
  durationMs?: number;

  /** Error message if the task failed */
  errorMessage?: string;

  /** Structured error code for categorizing failures */
  errorCode?: string;

  /** Success message from the task handler */
  resultMessage?: string;
}

/**
 * Database interface for the task scheduler system.
 * Abstracts database operations for task run tracking and concurrency control.
 *
 * This interface allows different database implementations (Prisma, raw SQL, etc.)
 * while maintaining consistent behavior for task scheduling operations.
 */
export interface TaskSchedulerDatabase {
  /**
   * Find any currently running instance of the specified task.
   * Used to prevent concurrent executions of the same task.
   *
   * @param taskName - Name of the task to check
   * @returns The running task record, or null if no instance is running
   */
  findRunningTask(taskName: string): Promise<TaskRun | null>;

  /**
   * Create a new task run record when starting task execution.
   *
   * @param data - Initial data for the task run
   * @returns The created task run record with assigned ID
   */
  createTaskRun(data: CreateTaskRunData): Promise<TaskRun>;

  /**
   * Update an existing task run record with new status or completion data.
   *
   * @param id - ID of the task run to update
   * @param data - Updated fields for the task run
   * @returns The updated task run record
   */
  updateTaskRun(id: string, data: UpdateTaskRunData): Promise<TaskRun>;

  /**
   * Attempt to acquire a PostgreSQL advisory lock for task execution.
   * Prevents multiple instances of the same task from running concurrently.
   *
   * @param lockId - Unique lock identifier (typically derived from task name)
   * @returns true if lock was acquired, false if already held by another process
   */
  acquireTaskLock(lockId: bigint): Promise<boolean>;

  /**
   * Release a previously acquired PostgreSQL advisory lock.
   * Should be called when task execution completes (success or failure).
   *
   * @param lockId - Lock identifier to release
   */
  releaseTaskLock(lockId: bigint): Promise<void>;

  /**
   * Find a retry attempt for a specific original task run.
   * Used to prevent duplicate retries of the same failed task.
   *
   * @param originalRunId - ID of the original failed task run
   * @returns The retry task run if one exists, null otherwise
   */
  findRetryTaskRun(originalRunId: string): Promise<TaskRun | null>;

  /**
   * Get recent task runs for a specific task within a time window.
   * Used for scheduling decisions and retry logic.
   *
   * @param taskName - Name of the task to query
   * @param since - Only return runs started after this timestamp
   * @returns Array of matching task runs, ordered by start time (most recent first)
   */
  getRecentTaskRun(taskName: string, since: Date): Promise<TaskRun[]>;

  /**
   * Get the current database time.
   * Ensures consistent timestamps across distributed systems.
   *
   * @returns Current timestamp
   */
  getCurrentTime(): Date;

  /**
   * Clean up database connections and resources.
   * Should be called when shutting down the task scheduler.
   */
  disconnect(): Promise<void>;
}
