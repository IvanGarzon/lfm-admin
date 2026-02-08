/**
 * Common types for server actions
 */

import type { ErrorCode } from '@/lib/errors';

/**
 * Standard result type for server actions
 * Provides consistent error handling across all actions
 */
export type ActionResult<T> =
  | { success: true; data: T; message?: string }
  | {
      success: false;
      error: string;
      code?: ErrorCode;
      errors?: Record<string, string[]>;
      context?: Record<string, unknown>;
    };

/**
 * Action result without data (for void operations)
 */
export type ActionResultVoid = ActionResult<void>;
