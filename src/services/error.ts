import { StatusCodes, getReasonPhrase } from 'http-status-codes';

// isOperational: true Expected User-caused or handled errors
// isOperational: false Unexpected Bugs, crashes, unknown behavior
class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR,
    options?: {
      isOperational?: boolean;
      details?: unknown;
    },
  ) {
    super(message);

    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = options?.isOperational ?? true;
    this.details = options?.details;

    Error.captureStackTrace(this);
  }
}

class BadRequestError extends AppError {
  constructor(message = getReasonPhrase(StatusCodes.BAD_REQUEST), details?: unknown) {
    super(message, StatusCodes.BAD_REQUEST, { details });
  }
}

class UnauthorizedError extends AppError {
  constructor(message = getReasonPhrase(StatusCodes.UNAUTHORIZED), details?: unknown) {
    super(message, StatusCodes.UNAUTHORIZED, { details });
  }
}

class ForbiddenError extends AppError {
  constructor(message = getReasonPhrase(StatusCodes.FORBIDDEN), details?: unknown) {
    super(message, StatusCodes.FORBIDDEN, { details });
  }
}

class NotFoundError extends AppError {
  constructor(message = getReasonPhrase(StatusCodes.NOT_FOUND), details?: unknown) {
    super(message, StatusCodes.NOT_FOUND, { details });
  }
}

class InternalServerError extends AppError {
  constructor(message = getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR), details?: unknown) {
    super(message, StatusCodes.INTERNAL_SERVER_ERROR, { details });
  }
}

export {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  InternalServerError,
};
