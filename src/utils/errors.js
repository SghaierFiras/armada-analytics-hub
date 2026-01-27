/**
 * Custom Error Classes
 * Provides structured error handling with specific error types
 */

/**
 * Base application error class
 * All custom errors should extend this class
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // Distinguishes operational errors from programming errors

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation Error - 400 Bad Request
 * Used when input validation fails
 */
class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

/**
 * Authentication Error - 401 Unauthorized
 * Used when authentication is required but not provided
 */
class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization Error - 403 Forbidden
 * Used when authenticated user doesn't have permission
 */
class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

/**
 * Not Found Error - 404 Not Found
 * Used when a requested resource doesn't exist
 */
class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Database Error - 500 Internal Server Error
 * Used for database-related errors
 */
class DatabaseError extends AppError {
  constructor(message = 'Database operation failed') {
    super(message, 500);
    this.name = 'DatabaseError';
  }
}

/**
 * External Service Error - 502 Bad Gateway
 * Used when external service calls fail (APIs, third-party services)
 */
class ExternalServiceError extends AppError {
  constructor(message = 'External service error', service = 'unknown') {
    super(message, 502);
    this.name = 'ExternalServiceError';
    this.service = service;
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  DatabaseError,
  ExternalServiceError
};
