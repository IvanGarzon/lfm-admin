/**
 * Common types for server actions
 */

/**
 * Standard result type for server actions
 * Provides consistent error handling across all actions
 */
export type ActionResult<T> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string; errors?: Record<string, string[]> };

/**
 * Action result without data (for void operations)
 */
export type ActionResultVoid = ActionResult<void>;
