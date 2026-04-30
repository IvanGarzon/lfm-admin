import { StatusCodes, getReasonPhrase } from 'http-status-codes';

// isOperational: true Expected User-caused or handled errors
// isOperational: false Unexpected Bugs, crashes, unknown behavior
class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR,
    options?: {
      isOperational?: boolean;
      context?: Record<string, unknown>;
    },
  ) {
    super(message);

    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = options?.isOperational ?? true;
    this.context = options?.context;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

class BadRequestError extends AppError {
  constructor(
    message = getReasonPhrase(StatusCodes.BAD_REQUEST),
    context?: Record<string, unknown>,
  ) {
    super(message, StatusCodes.BAD_REQUEST, { context });
  }
}

class UnauthorizedError extends AppError {
  constructor(
    message = getReasonPhrase(StatusCodes.UNAUTHORIZED),
    context?: Record<string, unknown>,
  ) {
    super(message, StatusCodes.UNAUTHORIZED, { context });
  }
}

class ForbiddenError extends AppError {
  constructor(message = getReasonPhrase(StatusCodes.FORBIDDEN), context?: Record<string, unknown>) {
    super(message, StatusCodes.FORBIDDEN, { context });
  }
}

class NotFoundError extends AppError {
  constructor(message = getReasonPhrase(StatusCodes.NOT_FOUND), context?: Record<string, unknown>) {
    super(message, StatusCodes.NOT_FOUND, { context });
  }
}

class InternalServerError extends AppError {
  constructor(
    message = getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
    context?: Record<string, unknown>,
  ) {
    super(message, StatusCodes.INTERNAL_SERVER_ERROR, { context });
  }
}

class DuplicateRecordError extends AppError {
  constructor(message = getReasonPhrase(StatusCodes.CONFLICT), context?: Record<string, unknown>) {
    super(message, StatusCodes.CONFLICT, { context });
  }
}

class BusinessRuleError extends AppError {
  constructor(
    message = getReasonPhrase(StatusCodes.UNPROCESSABLE_ENTITY),
    context?: Record<string, unknown>,
  ) {
    super(message, StatusCodes.UNPROCESSABLE_ENTITY, { context });
  }
}

class ResourceInUseError extends AppError {
  constructor(message = getReasonPhrase(StatusCodes.CONFLICT), context?: Record<string, unknown>) {
    super(message, StatusCodes.CONFLICT, { context });
  }
}

class RateLimitError extends AppError {
  constructor(
    message = getReasonPhrase(StatusCodes.TOO_MANY_REQUESTS),
    context?: Record<string, unknown>,
  ) {
    super(message, StatusCodes.TOO_MANY_REQUESTS, { context });
  }
}

class FileError extends AppError {
  constructor(
    message = getReasonPhrase(StatusCodes.BAD_REQUEST),
    context?: Record<string, unknown>,
  ) {
    super(message, StatusCodes.BAD_REQUEST, { context });
  }
}

export {
  AppError,
  BadRequestError,
  UnauthorizedError,
  InternalServerError,
  RateLimitError,
  // ForbiddenError,
  // NotFoundError,
  // DuplicateRecordError,
  // DatabaseError,
  // BusinessRuleError,
  // ResourceInUseError,
  // FileError,
};
