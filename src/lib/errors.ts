/**
 * Application error codes for structured error handling
 * Provides specific error codes for better client-side error handling
 */
export enum ErrorCode {
  // Authentication & Authorization (1xxx)
  UNAUTHORIZED = 'AUTH_001',
  FORBIDDEN = 'AUTH_002',
  SESSION_EXPIRED = 'AUTH_003',
  INVALID_CREDENTIALS = 'AUTH_004',

  // Validation (2xxx)
  VALIDATION_ERROR = 'VAL_001',
  INVALID_INPUT = 'VAL_002',
  REQUIRED_FIELD_MISSING = 'VAL_003',
  INVALID_FORMAT = 'VAL_004',
  VALUE_TOO_LONG = 'VAL_005',
  VALUE_TOO_SHORT = 'VAL_006',
  INVALID_EMAIL = 'VAL_007',
  INVALID_PHONE = 'VAL_008',
  INVALID_URL = 'VAL_009',

  // Database (3xxx)
  DATABASE_ERROR = 'DB_001',
  RECORD_NOT_FOUND = 'DB_002',
  DUPLICATE_RECORD = 'DB_003',
  FOREIGN_KEY_VIOLATION = 'DB_004',
  DATABASE_CONNECTION_ERROR = 'DB_005',
  DATABASE_TIMEOUT = 'DB_006',
  INVALID_DATA_TYPE = 'DB_007',

  // Business Logic (4xxx)
  BUSINESS_RULE_VIOLATION = 'BIZ_001',
  OPERATION_NOT_ALLOWED = 'BIZ_002',
  RESOURCE_IN_USE = 'BIZ_003',
  INSUFFICIENT_PERMISSIONS = 'BIZ_004',
  QUOTA_EXCEEDED = 'BIZ_005',

  // External Services (5xxx)
  EXTERNAL_SERVICE_ERROR = 'EXT_001',
  API_REQUEST_FAILED = 'EXT_002',
  NETWORK_ERROR = 'EXT_003',
  TIMEOUT_ERROR = 'EXT_004',

  // File Operations (6xxx)
  FILE_NOT_FOUND = 'FILE_001',
  FILE_TOO_LARGE = 'FILE_002',
  INVALID_FILE_TYPE = 'FILE_003',
  FILE_UPLOAD_FAILED = 'FILE_004',

  // Rate Limiting (7xxx)
  RATE_LIMIT_EXCEEDED = 'RATE_001',
  TOO_MANY_REQUESTS = 'RATE_002',

  // General (9xxx)
  INTERNAL_ERROR = 'SYS_001',
  NOT_IMPLEMENTED = 'SYS_002',
  MAINTENANCE_MODE = 'SYS_003',
  UNKNOWN_ERROR = 'SYS_999',
}

/**
 * Base application error class
 * All custom errors should extend this class
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.INTERNAL_ERROR,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Authentication/Authorization errors
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access', context?: Record<string, unknown>) {
    super(message, ErrorCode.UNAUTHORIZED, 401, true, context);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden', context?: Record<string, unknown>) {
    super(message, ErrorCode.FORBIDDEN, 403, true, context);
  }
}

/**
 * Validation errors
 */
export class ValidationError extends AppError {
  public readonly fields?: Record<string, string[]>;

  constructor(
    message: string = 'Validation failed',
    fields?: Record<string, string[]>,
    context?: Record<string, unknown>,
  ) {
    super(message, ErrorCode.VALIDATION_ERROR, 400, true, context);
    this.fields = fields;
  }
}

/**
 * Database errors
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', context?: Record<string, unknown>) {
    super(`${resource} not found`, ErrorCode.RECORD_NOT_FOUND, 404, true, context);
  }
}

export class DuplicateRecordError extends AppError {
  constructor(field: string = 'Record', context?: Record<string, unknown>) {
    super(`${field} already exists`, ErrorCode.DUPLICATE_RECORD, 409, true, context);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database error', context?: Record<string, unknown>) {
    super(message, ErrorCode.DATABASE_ERROR, 500, true, context);
  }
}

/**
 * Business logic errors
 */
export class BusinessRuleError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, ErrorCode.BUSINESS_RULE_VIOLATION, 422, true, context);
  }
}

export class ResourceInUseError extends AppError {
  constructor(resource: string = 'Resource', context?: Record<string, unknown>) {
    super(
      `${resource} is in use and cannot be modified`,
      ErrorCode.RESOURCE_IN_USE,
      409,
      true,
      context,
    );
  }
}

/**
 * Rate limiting errors
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', context?: Record<string, unknown>) {
    super(message, ErrorCode.RATE_LIMIT_EXCEEDED, 429, true, context);
  }
}

/**
 * File operation errors
 */
export class FileError extends AppError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.FILE_NOT_FOUND,
    context?: Record<string, unknown>,
  ) {
    super(message, code, 400, true, context);
  }
}

/**
 * Type guard to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Helper to create a user-friendly error message
 */
export function getUserFriendlyMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
}
