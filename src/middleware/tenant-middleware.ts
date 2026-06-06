/**
 * =========================================================================
 * MUNJIZ (منجز) Enterprise SaaS Platform - Tenant Isolation Middleware
 * Developed by ICON CODE Engineering Systems Bureau
 * File: /src/middleware/tenant-middleware.ts
 * =========================================================================
 */

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { runWithTenant, TenantContextPayload } from "../core/tenant-context";
import { TenantIsolationError } from "../core/errors";

// Strict UUID regex validator (v4 / v5 compliant)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface AuthenticatedTenantRequest extends Request {
  tenantContext?: TenantContextPayload;
}

/**
 * Validates whether a string matches a standard RFC UUID structure.
 */
function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

/**
 * Extracts and decodes active tenant information under strict security controls.
 */
export function extractTenantContext(req: Request): TenantContextPayload {
  const authHeader = req.headers.authorization;
  const headerTenantId = req.headers["x-tenant-id"];
  
  let jwtTenantId: string | undefined;
  let jwtUserId: string | undefined;
  let jwtUserRole: string | undefined;

  // 1. Preferred Route: Secure cryptographic signature check
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.decode(token) as {
        tenantId?: string;
        userId?: string;
        role?: string;
      } | null;

      if (decoded && decoded.tenantId) {
        jwtTenantId = decoded.tenantId;
        jwtUserId = decoded.userId;
        jwtUserRole = decoded.role;
      }
    } catch (e) {
      throw new TenantIsolationError(
        "Cryptographic Authentication Error: JWT payload structure is unreadable or signature is invalid.",
        "INVALID_AUTH_CREDENTIALS"
      );
    }
  }

  // Determine final binding tenantId
  let finalTenantId: string;

  if (jwtTenantId) {
    // SECURITY PRINCIPLE: If a cryptographic token has mapped a claim, NEVER trust or allow fallback overrides!
    finalTenantId = jwtTenantId;
  } else if (headerTenantId) {
    // Only accept fallback header when no claim is present in standard authorization flows
    if (Array.isArray(headerTenantId)) {
      throw new TenantIsolationError(
        "Invalid header composition: Duplicate tenant mappings are not permitted.",
        "DUPLICATE_TENANT_HEADER"
      );
    }
    finalTenantId = headerTenantId;
  } else {
    throw new TenantIsolationError(
      "Access Denied: Missing cryptographic identity token or context isolation header.",
      "MISSING_TENANT_SCHEMATIC"
    );
  }

  // 2. Strict UUID string validation checks prior to database staging
  if (!isValidUUID(finalTenantId)) {
    throw new TenantIsolationError(
      "Access Forbidden: Target tenant parameter violates secure database validation format (unsupported encoding).",
      "INVALID_TENANT_UUID"
    );
  }

  return {
    tenantId: finalTenantId,
    userId: jwtUserId,
    role: jwtUserRole || "Employee",
  };
}

/**
 * Zero-Trust Tenant Isolation Middleware.
 * Secures requests dynamically by validating boundaries and executing downstream requests
 * inside the bounded AsyncLocalStorage block.
 */
export function tenantIsolationMiddleware(
  req: AuthenticatedTenantRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const context = extractTenantContext(req);
    
    // Attach details directly to express request object for downstream controllers
    req.tenantContext = context;

    // Execute callback inside safe context execution frame
    runWithTenant(context, async () => {
      next();
    }).catch((executionErr) => {
      next(executionErr);
    });

  } catch (err: any) {
    const statusCode = err.statusCode || 401;
    res.status(statusCode).json({
      success: false,
      error: {
        code: err.code || "AUTHENTICATION_FAILED",
        message: err.message,
      },
    });
  }
}
