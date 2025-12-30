import { isPrismaError } from './error-handler';

/**
 * Retry configuration options
 */
export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Base delay in milliseconds before first retry (default: 100ms) */
  baseDelay?: number;
  /** Maximum delay in milliseconds (default: 5000ms) */
  maxDelay?: number;
  /** Whether to use exponential backoff (default: true) */
  exponentialBackoff?: boolean;
  /** Function to determine if error is retryable (default: retries all errors except validation) */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
}

/**
 * Default retry predicate - retries everything except Prisma validation errors
 */
function defaultShouldRetry(error: unknown): boolean {
  // Don't retry on validation errors (unique constraint violations, etc.)
  if (isPrismaError(error)) {
    const nonRetryableCodes = ['P2002', 'P2003', 'P2025']; // Unique, foreign key, not found
    return !nonRetryableCodes.includes(error.code);
  }
  return true;
}

/**
 * Executes a function with exponential backoff retry logic.
 *
 * @param fn - The async function to execute
 * @param options - Retry configuration options
 * @returns Promise resolving to the function's return value
 * @throws The last error encountered if all retries fail
 *
 * @example
 * ```typescript
 * const result = await withRetry(
 *   () => prisma.invoice.findMany(),
 *   { maxRetries: 3, baseDelay: 100 }
 * );
 * ```
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 100,
    maxDelay = 5000,
    exponentialBackoff = true,
    shouldRetry = defaultShouldRetry,
  } = options;

  let lastError: Error;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      attempt++;

      // Don't retry if we've exhausted attempts
      if (attempt > maxRetries) {
        break;
      }

      // Check if error is retryable
      if (!shouldRetry(error, attempt)) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = exponentialBackoff
        ? Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay)
        : baseDelay;

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Convenience function for retrying database operations with sensible defaults
 */
export async function withDatabaseRetry<T>(
  fn: () => Promise<T>,
  options: Omit<RetryOptions, 'shouldRetry'> = {},
): Promise<T> {
  return withRetry(fn, {
    maxRetries: 3,
    baseDelay: 100,
    maxDelay: 2000,
    ...options,
    shouldRetry: defaultShouldRetry,
  });
}
