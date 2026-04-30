/**
 * Standardized Error Handler for Server Actions
 *
 * Provides consistent error handling across all server actions.
 * Handles Zod validation errors, Prisma errors, and generic errors.
 *
 * Usage:
 * ```typescript
 * import { handleActionError } from '@/lib/error-handler';
 *
 * try {
 *   // ... action logic
 * } catch (error) {
 *   return handleActionError(error, 'Failed to perform action');
 * }
 * ```
 */

import { ZodError } from 'zod';
import { Prisma } from '@/prisma/client';
import { logger } from '@/lib/logger';
import type { ActionResult } from '@/types/actions';
import { AppError } from '@/services/error';
import { StatusCodes } from 'http-status-codes';

/**
 * Handles errors in server actions and returns a standardized ActionResult
 * @param error - The error that was thrown
 * @param fallbackMessage - The default error message to use if no specific message is available
 * @param context - Optional context metadata for debugging (e.g., user ID, request params)
 * @returns ActionResult with success: false and appropriate error message
 */
export function handleActionError<T = never>(
  error: unknown,
  fallbackMessage = 'An unexpected error occurred',
  context?: Record<string, unknown>,
): ActionResult<T> {
  // Handle custom AppError instances first
  if (error instanceof AppError) {
    logger.error('Application error', error, {
      context: 'handleActionError',
      metadata: { statusCode: error.statusCode, ...context, ...error.context },
    });

    return {
      success: false,
      error: error.message,
      statusCode: error.statusCode,
      context: { ...context, ...error.context },
    };
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const firstError = error.issues[0];
    const fieldName = firstError?.path.join('.') || 'field';
    const message = firstError?.message || 'Validation failed';

    // Map Zod issues to errors field
    const errors: Record<string, string[]> = {};
    error.issues.forEach((issue) => {
      const path = issue.path.join('.') || 'root';
      if (!errors[path]) {
        errors[path] = [];
      }
      errors[path].push(issue.message);
    });

    logger.warn('Validation error in server action', {
      context: 'handleActionError',
      metadata: { errors: error.issues, ...context },
    });

    return {
      success: false,
      error: `Invalid ${fieldName}: ${message}`,
      statusCode: StatusCodes.BAD_REQUEST,
      errors,
      context,
    };
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (context) {
      logger.error('Prisma error with context', error, {
        context: 'handleActionError',
        metadata: context,
      });
    }

    return handlePrismaError(error);
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    logger.error('Prisma validation error', error, {
      context: 'handleActionError',
      metadata: context,
    });

    return {
      success: false,
      error: 'Database validation error. Please check your input.',
      statusCode: StatusCodes.BAD_REQUEST,
      context,
    };
  }

  // Handle standard Error instances
  if (error instanceof Error) {
    logger.error('Error in server action', error, {
      context: 'handleActionError',
      metadata: { message: error.message, ...context },
    });

    return {
      success: false,
      error: error.message || fallbackMessage,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      context,
    };
  }

  // Handle unknown errors
  logger.error('Unknown error in server action', error, {
    context: 'handleActionError',
    metadata: context,
  });

  return {
    success: false,
    error: fallbackMessage,
    statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    context,
  };
}

/**
 * Handles Prisma-specific errors and returns appropriate error messages
 * @param error - The Prisma error
 * @returns ActionResult with success: false and appropriate error message
 */
function handlePrismaError<T = never>(
  error: Prisma.PrismaClientKnownRequestError,
): ActionResult<T> {
  logger.error('Prisma error in server action', error, {
    context: 'handlePrismaError',
    metadata: { code: error.code, meta: error.meta },
  });

  switch (error.code) {
    // Unique constraint violation
    case 'P2002': {
      const rawTarget = error.meta?.target;
      const target = Array.isArray(rawTarget)
        ? rawTarget.filter((item): item is string => typeof item === 'string')
        : [];
      const field = target.join(', ') || 'field';

      return {
        success: false,
        error: `A record with this ${field} already exists`,
        statusCode: StatusCodes.CONFLICT,
        context: { prismaCode: error.code, field },
      };
    }

    // Foreign key constraint violation
    case 'P2003': {
      const rawFieldName = error.meta?.target;
      const field = Array.isArray(rawFieldName)
        ? rawFieldName.filter((item): item is string => typeof item === 'string').join(', ') ||
          'field'
        : 'field';

      return {
        success: false,
        error: field ? `Related ${field} not found` : 'Related record not found',
        statusCode: StatusCodes.CONFLICT,
        context: { prismaCode: error.code, field },
      };
    }

    // Record not found
    case 'P2025':
      return {
        success: false,
        error: 'Record not found or already deleted',
        statusCode: StatusCodes.NOT_FOUND,
        context: { prismaCode: error.code },
      };

    // Record to delete does not exist
    case 'P2018':
      return {
        success: false,
        error: 'Record not found',
        statusCode: StatusCodes.NOT_FOUND,
        context: { prismaCode: error.code },
      };

    // Null constraint violation
    case 'P2011':
      return {
        success: false,
        error: 'Required field is missing',
        statusCode: StatusCodes.BAD_REQUEST,
        context: { prismaCode: error.code },
      };

    // Invalid data type
    case 'P2006':
      return {
        success: false,
        error: 'Invalid data type provided',
        statusCode: StatusCodes.BAD_REQUEST,
        context: { prismaCode: error.code },
      };

    // Timeout
    case 'P2024':
      return {
        success: false,
        error: 'Database operation timed out. Please try again.',
        statusCode: StatusCodes.REQUEST_TIMEOUT,
        context: { prismaCode: error.code },
      };

    // Connection error
    case 'P1001':
    case 'P1002':
    case 'P1008':
      return {
        success: false,
        error: 'Database connection error. Please try again later.',
        statusCode: StatusCodes.SERVICE_UNAVAILABLE,
        context: { prismaCode: error.code },
      };

    // Default case for unknown Prisma errors
    default:
      return {
        success: false,
        error: 'A database error occurred. Please try again.',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        context: { prismaCode: error.code },
      };
  }
}

/**
 * Type guard to check if an error is a Prisma error
 * @param error - The error to check
 * @returns true if the error is a Prisma error
 */
export function isPrismaError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError;
}

/**
 * Type guard to check if an error is a Zod validation error
 * @param error - The error to check
 * @returns true if the error is a Zod error
 */
export function isZodError(error: unknown): error is ZodError {
  return error instanceof ZodError;
}
