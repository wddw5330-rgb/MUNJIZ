/**
 * =========================================================================
 * MUNJIZ (منجز) Enterprise SaaS Platform - Core System Exception Classes
 * Developed by ICON CODE Engineering Systems Bureau
 * File: /src/core/errors.ts
 * =========================================================================
 */

/**
 * Base platform error from which all standard sub-errors derive.
 */
export class PlatformError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(message: string, code = "INTERNAL_PLATFORM_ERROR", statusCode = 500) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Thrown when tenant detection fails or isolation policies are violated.
 */
export class TenantIsolationError extends PlatformError {
  constructor(message: string, code = "TENANT_ISOLATION_VIOLATION") {
    super(message, code, 401);
  }
}

/**
 * Thrown when accessing database services outside a valid context or when database errors happen.
 */
export class DatabaseExecutionError extends PlatformError {
  constructor(message: string, code = "DATABASE_EXECUTION_FAILURE") {
    super(message, code, 500);
  }
}

/**
 * Thrown when unauthorized actions are attempted within a tenant group.
 */
export class UnauthorizedError extends PlatformError {
  constructor(message: string, code = "UNAUTHORIZED_ACCESS_ATTEMPT") {
    super(message, code, 403);
  }
}
