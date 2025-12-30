export enum TaskSchedulerErrorCode {
  TASK_TIMEOUT = 'TASK_TIMEOUT',
  TASK_FAILED = 'TASK_FAILED',
  TASK_NOT_FOUND = 'TASK_NOT_FOUND',
  RETRY_SCHEDULED = 'RETRY_SCHEDULED',
  RETRY_EXHAUSTED = 'RETRY_EXHAUSTED',
  LOCK_ACQUISITION_FAILED = 'LOCK_ACQUISITION_FAILED',
  TASK_ALREADY_RUNNING = 'TASK_ALREADY_RUNNING',
  DATABASE_ERROR = 'DATABASE_ERROR',
  RUN_RECORD_NOT_FOUND = 'RUN_RECORD_NOT_FOUND',
  INVALID_TASK_DEFINITION = 'INVALID_TASK_DEFINITION',
  INVALID_SCHEDULE = 'INVALID_SCHEDULE',
}

export class TaskSchedulerError extends Error {
  public readonly code: TaskSchedulerErrorCode;
  public readonly originalError?: Error;

  constructor(code: TaskSchedulerErrorCode, message: string, originalError?: Error) {
    super(message);
    this.name = 'TaskSchedulerError';
    this.code = code;
    this.originalError = originalError;

    if (Error.captureStackTrace !== undefined) {
      Error.captureStackTrace(this, TaskSchedulerError);
    }
  }

  isRetryable(): boolean {
    return this.code === TaskSchedulerErrorCode.RETRY_SCHEDULED;
  }

  static taskFailed(message: string, originalError?: Error): TaskSchedulerError {
    return new TaskSchedulerError(TaskSchedulerErrorCode.TASK_FAILED, message, originalError);
  }

  static taskTimeout(taskName: string, timeoutMinutes: number): TaskSchedulerError {
    return new TaskSchedulerError(
      TaskSchedulerErrorCode.TASK_TIMEOUT,
      `Task ${taskName} timed out after ${timeoutMinutes} minutes`,
    );
  }

  static retryScheduled(taskName: string, originalError: Error): TaskSchedulerError {
    return new TaskSchedulerError(
      TaskSchedulerErrorCode.RETRY_SCHEDULED,
      `Task ${taskName} failed but will be retried in next scheduler run: ${originalError.message}`,
      originalError,
    );
  }

  static taskNotFound(taskName: string): TaskSchedulerError {
    return new TaskSchedulerError(
      TaskSchedulerErrorCode.TASK_NOT_FOUND,
      `Task not found: ${taskName}`,
    );
  }

  static lockAcquisitionFailed(taskName: string): TaskSchedulerError {
    return new TaskSchedulerError(
      TaskSchedulerErrorCode.LOCK_ACQUISITION_FAILED,
      `Failed to acquire lock for task: ${taskName}`,
    );
  }

  static databaseError(operation: string, originalError: Error): TaskSchedulerError {
    return new TaskSchedulerError(
      TaskSchedulerErrorCode.DATABASE_ERROR,
      `Database error during ${operation}: ${originalError.message}`,
      originalError,
    );
  }
}

export function isTaskSchedulerError(
  error: unknown,
  code?: TaskSchedulerErrorCode,
): error is TaskSchedulerError {
  if (!(error instanceof TaskSchedulerError)) {
    return false;
  }

  if (code !== undefined) {
    return error.code === code;
  }

  return true;
}

export function getErrorCode(error: unknown): TaskSchedulerErrorCode | undefined {
  if (isTaskSchedulerError(error)) {
    return error.code;
  }
  return undefined;
}

export function shouldScheduleRetry(error: unknown): boolean {
  return isTaskSchedulerError(error, TaskSchedulerErrorCode.RETRY_SCHEDULED);
}
