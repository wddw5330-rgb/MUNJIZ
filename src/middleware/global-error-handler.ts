/**
 * =========================================================================
 * MUNJIZ (منجز) Enterprise SaaS Platform - Core Observability & Global Error Handling Middleware
 * Developed by ICON CODE Engineering Systems Bureau
 * File: /src/middleware/global-error-handler.ts
 * =========================================================================
 */

import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

import { 
  PlatformError, 
  TenantIsolationError, 
  DatabaseExecutionError, 
  UnauthorizedError 
} from "../core/errors";

import { requireTenantId } from "../core/tenant-context";

// ─── DOMAIN EXCEPTIONS (Adhering to Elite Enterprise SaaS Guidelines) ───

/**
 * Superclass for business rules violations.
 */
export class DomainError extends Error {
  public readonly code: string;
  constructor(message: string, code = "DOMAIN_RULE_VIOLATION") {
    super(message);
    this.name = "DomainError";
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown if resource is forbidden for active user roles.
 */
export class ForbiddenError extends Error {
  public readonly code = "FORBIDDEN";
  constructor(message: string = "Access denied") {
    super(message);
    this.name = "ForbiddenError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// ─── AUDIT INTERFACING CONTRACT ───
export interface AuditLogger {
  log(
    tenantId: string,
    event: string,
    payload: Readonly<Record<string, unknown>>
  ): Promise<void>;
}

/**
 * Global HTTP Error Interrogator and Responder Middleware.
 * Prevents internal system details exposure while maintaining strict audit trails on tenant scopes.
 */
export const globalErrorHandler =
  (auditLogger: AuditLogger) =>
  async (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    
    // Extract tracing correlations
    const correlationId =
      (req.headers["x-correlation-id"] as string) ??
      `corr-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;

    let tenantId = "unknown-tenant";

    try {
      tenantId = requireTenantId();
    } catch {
      // Trace header fallback if context is not yet nested under AsyncLocalStorage
      const clientTenantHeader = req.headers["x-tenant-id"];
      if (clientTenantHeader && typeof clientTenantHeader === "string") {
        tenantId = clientTenantHeader;
      }
    }

    // ==================================================
    // Zero-Trust Security Audit Logging (Non-blocking loop)
    // ==================================================
    try {
      // Offload to async callback to avoid blocking the Express request flow
      process.nextTick(async () => {
        try {
          await auditLogger.log(
            tenantId,
            "SYSTEM_ERROR_ENCOUNTERED",
            {
              correlationId,
              message: error.message,
              errorType: error.name || error.constructor.name,
              stack: error.stack,
              path: req.originalUrl,
              method: req.method,
              userAgent: req.headers["user-agent"] || "Unknown UI Suite",
            }
          );
        } catch (logErr: any) {
          console.error(`[GlobalErrorHandler] Secure logging failed: ${logErr.message}`);
        }
      });
    } catch {
      // Logging failure must never prevent response serialization
    }

    // ==================================================
    // Schema Validation Failure (Zod Validation)
    // ==================================================
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        message: "Request payload did not match schema expectations.",
        errors: error.issues.map((i) => ({
          path: i.path.join(". "),
          message: i.message,
        })),
        correlationId,
      });
      return;
    }

    // ==================================================
    // Authentication Validation Failures
    // ==================================================
    if (error instanceof UnauthorizedError || error.name === "UnauthorizedError") {
      res.status(401).json({
        success: false,
        code: "UNAUTHORIZED",
        message: error.message || "Authentication required. Missing token.",
        correlationId,
      });
      return;
    }

    // ==================================================
    // Authorization Permissions Failures
    // ==================================================
    if (error instanceof ForbiddenError || error.name === "ForbiddenError") {
      res.status(403).json({
        success: false,
        code: "FORBIDDEN",
        message: error.message || "Access denied. Insufficient operational scopes.",
        correlationId,
      });
      return;
    }

    // ==================================================
    // Cloud Tenant Partition Intercept Failures
    // ==================================================
    if (error instanceof TenantIsolationError) {
      res.status(401).json({
        success: false,
        code: "TENANT_ISOLATION_VIOLATION",
        message: error.message,
        correlationId,
      });
      return;
    }

    // ==================================================
    // Business Rule Constraints Failures (Domain)
    // ==================================================
    if (error instanceof DomainError) {
      res.status(422).json({
        success: false,
        code: error.code,
        message: error.message,
        correlationId,
      });
      return;
    }

    // ==================================================
    // Database Execution Constraints Failures (PostgreSQL)
    // ==================================================
    if (error instanceof DatabaseExecutionError) {
      res.status(500).json({
        success: false,
        code: "DATABASE_TRANSACTION_ABORTED",
        message: "A database driver error interrupted the transaction.",
        correlationId,
      });
      return;
    }

    // ==================================================
    // Platform Core Constraints Failures
    // ==================================================
    if (error instanceof PlatformError) {
      res.status(error.statusCode).json({
        success: false,
        code: error.code,
        message: error.message,
        correlationId,
      });
      return;
    }

    // ==================================================
    // Unhandled Standard Server Crashes
    // ==================================================
    console.error(`[UnhandledSystemFault] Internal error tracked via ${correlationId}:`, error);

    res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected system error occurred. Please contact MUNJIZ enterprise support.",
      correlationId,
    });
  };
