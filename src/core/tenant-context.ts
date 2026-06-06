/**
 * =========================================================================
 * MUNJIZ (منجز) Enterprise SaaS Platform - Tenant Context Manager
 * Developed by ICON CODE Engineering Systems Bureau
 * File: /src/core/tenant-context.ts
 * =========================================================================
 */

import { AsyncLocalStorage } from "async_hooks";
import { TenantIsolationError } from "./errors";

export interface TenantContextPayload {
  tenantId: string;
  userId?: string;
  role?: string;
}

// Immutable context instance scoped cleanly per asynchronous execution stack frame
const contextStorage = new AsyncLocalStorage<TenantContextPayload>();

/**
 * Retrieves the current tenant context from AsyncLocalStorage.
 * Returns undefined if called outside active middleware wrappers.
 *
 * @returns TenantContextPayload | undefined
 */
export function getTenantContext(): TenantContextPayload | undefined {
  return contextStorage.getStore();
}

/**
 * Retrieves the current active tenant ID from AsyncLocalStorage.
 * Returns undefined if context has not been configured.
 *
 * @returns string | undefined
 */
export function getTenantId(): string | undefined {
  return contextStorage.getStore()?.tenantId;
}

/**
 * Enforces active presence of the tenantId.
 * Throws a TenantIsolationError immediately if context or tenantId is missing.
 *
 * @returns string
 */
export function requireTenantId(): string {
  const tenantId = getTenantId();
  if (!tenantId) {
    throw new TenantIsolationError(
      "Access Denied: Thread operation executed without a validated tenant isolation envelope.",
      "MISSING_TENANT_CONTEXT"
    );
  }
  return tenantId;
}

/**
 * Runs an asynchronous callback bounded firmly within a dedicated Isolation Context wrapper.
 * This ensures full separation of concurrent user requests in Node.js event-loop environments.
 *
 * @param context - Tenant details to attach to the context store
 * @param callback - Operation to run within isolation boundaries
 * @returns Promise<T>
 */
export function runWithTenant<T>(
  context: TenantContextPayload,
  callback: () => Promise<T>
): Promise<T> {
  return contextStorage.run(context, callback);
}
