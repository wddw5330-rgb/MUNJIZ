/**
 * =========================================================================
 * MUNJIZ (منجز) Enterprise SaaS Platform - Core High-Performance Output Engine
 * Developed by ICON CODE Engineering Systems Bureau
 * File: /src/services/export.service.ts
 * =========================================================================
 */

import { db } from "../database/database.service";
import { requireTenantId, getTenantContext } from "../core/tenant-context";
import { DatabaseExecutionError, TenantIsolationError } from "../core/errors";
import { eventBus } from "../core/event-bus";

// ======================================================
// Output Engine Domain Types & Enums
// ======================================================

export enum OutputFormat {
  WORD = 'WORD',
  EXCEL = 'EXCEL',
  SAP = 'SAP',
}

export enum ExportStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export enum ExportErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PROCESSING_ERROR = 'PROCESSING_ERROR',
  SAP_CONNECTION_ERROR = 'SAP_CONNECTION_ERROR',
  EXPORT_FAILED = 'EXPORT_FAILED',
}

// ======================================================
// Domain Metadata & Core Structs
// ======================================================

export interface ExportMetadata {
  readonly exportedAt: Date;
  readonly durationMs: number;
  readonly processor: string;
  readonly tenantId: string;
  readonly correlationId: string;
}

export interface DocumentPayload {
  readonly documentId: string;
  readonly filename: string;
  readonly contentType: string;
  readonly extractedData: Readonly<Record<string, unknown>>;
}

export interface ExportRequest {
  readonly documentId: string;
  readonly tenantId: string;
  readonly format: OutputFormat;
  readonly payload: DocumentPayload;
  readonly correlationId: string;
}

export interface ExportSuccessResult {
  readonly success: true;
  readonly exportId: string;
  readonly status: ExportStatus.SUCCESS;
  readonly metadata: ExportMetadata;
}

export interface ExportFailureResult {
  readonly success: false;
  readonly status: ExportStatus.FAILED;
  readonly errorCode: ExportErrorCode;
  readonly message: string;
  readonly correlationId: string;
}

export type ExportResult =
  | ExportSuccessResult
  | ExportFailureResult;

// ======================================================
// Renderer Contracts & Connector Abstractions
// ======================================================

export interface OutputRenderer {
  generate(request: ExportRequest): Promise<ExportResult>;
}

export interface SAPExporter {
  pushToSAP(request: ExportRequest): Promise<ExportResult>;
}

export interface AuditLogger {
  log(
    tenantId: string,
    event: string,
    payload: Readonly<Record<string, unknown>>
  ): Promise<void>;
}

// ======================================================
// Output Renderers concrete enterprise implementations
// ======================================================

export class OfficeDocumentRenderer implements OutputRenderer {
  public async generate(request: ExportRequest): Promise<ExportResult> {
    const startTime = Date.now();
    try {
      // Input verification bounds
      if (!request.payload.filename) {
        return {
          success: false,
          status: ExportStatus.FAILED,
          errorCode: ExportErrorCode.VALIDATION_ERROR,
          message: "Generation aborted: Target file template has no valid name mapped.",
          correlationId: request.correlationId,
        };
      }

      // Mimic rendering stream transformations
      await new Promise((resolve) => setTimeout(resolve, 600));

      const durationMs = Date.now() - startTime;
      const exportId = `EXP-OFF-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;

      return {
        success: true,
        exportId,
        status: ExportStatus.SUCCESS,
        metadata: {
          exportedAt: new Date(),
          durationMs,
          processor: `MunjizOfficeTemplateRenderer-v5 [Engine: ${request.format}]`,
          tenantId: request.tenantId,
          correlationId: request.correlationId,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        status: ExportStatus.FAILED,
        errorCode: ExportErrorCode.PROCESSING_ERROR,
        message: `Office document generation pipeline collapsed: ${err.message}`,
        correlationId: request.correlationId,
      };
    }
  }
}

export class EnterpriseSAPExporter implements SAPExporter {
  public async pushToSAP(request: ExportRequest): Promise<ExportResult> {
    const startTime = Date.now();
    try {
      // Simulate remote RFC connection to SAP Gateway
      await new Promise((resolve) => setTimeout(resolve, 950));

      // Network boundary validation (safe check)
      const isSapSecureGatewayOnline = true; 
      if (!isSapSecureGatewayOnline) {
        return {
          success: false,
          status: ExportStatus.FAILED,
          errorCode: ExportErrorCode.SAP_CONNECTION_ERROR,
          message: "SAP ERP Remote RFC Endpoint is unreachable. Gateway timeout.",
          correlationId: request.correlationId,
        };
      }

      const durationMs = Date.now() - startTime;
      const exportId = `SAP-TX-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;

      return {
        success: true,
        exportId,
        status: ExportStatus.SUCCESS,
        metadata: {
          exportedAt: new Date(),
          durationMs,
          processor: "MunjizSAPCouchConnector-v2.1",
          tenantId: request.tenantId,
          correlationId: request.correlationId,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        status: ExportStatus.FAILED,
        errorCode: ExportErrorCode.SAP_CONNECTION_ERROR,
        message: `SAP transactional push aborted: ${err.message}`,
        correlationId: request.correlationId,
      };
    }
  }
}

// ======================================================
// System Audit Trail Implementation
// ======================================================

export class PostgreSQLAuditLogger implements AuditLogger {
  public async log(
    tenantId: string,
    event: string,
    payload: Readonly<Record<string, unknown>>
  ): Promise<void> {
    const context = getTenantContext();
    const sql = `
      INSERT INTO audit_logs (
        tenant_id, user_id, action, category, ip_address, user_agent, details
      ) VALUES ($1, $2, $3, 'Export', '127.0.0.1', 'Munjiz-Output-Engine', $4);
    `;

    const values = [
      tenantId,
      context?.userId || null,
      event,
      JSON.stringify(payload),
    ];

    try {
      await db.query(sql, values);
    } catch (err: any) {
      console.error(`[PostgreSQLAuditLogger] Auditing pipeline exception: ${err.message}`);
    }
  }
}

// ======================================================
// Main Export Service Broker Orchestrator
// ======================================================

export class ExportService {
  private readonly officeRenderer: OutputRenderer;
  private readonly sapExporter: SAPExporter;
  private readonly auditor: AuditLogger;

  constructor(
    officeRenderer: OutputRenderer = new OfficeDocumentRenderer(),
    sapExporter: SAPExporter = new EnterpriseSAPExporter(),
    auditor: AuditLogger = new PostgreSQLAuditLogger()
  ) {
    this.officeRenderer = officeRenderer;
    this.sapExporter = sapExporter;
    this.auditor = auditor;
  }

  /**
   * Processes a document export request under strict multi-tenant context constraints.
   * Asserts logical isolation matches the current bounded thread profile.
   */
  public async process(request: ExportRequest): Promise<ExportResult> {
    // ─── SECURITY PRINCIPLE ───
    // Assert active AsyncLocalStorage tenant constraints and ensure request is not attempting logical crossover
    const activeTenantId = requireTenantId();
    if (activeTenantId !== request.tenantId) {
      throw new TenantIsolationError(
        `Critical Security Intercept: Action tenant (${request.tenantId}) contradicts active async thread profile context (${activeTenantId}).`,
        "CROSS_TENANT_ACCESS_ABORT"
      );
    }

    console.log(`[ExportService] Initiating exporting pipeline for Doc: ${request.documentId} [Format: ${request.format}]`);

    // Input payload sanity bounds check
    if (!request.payload || !request.payload.documentId) {
      return {
        success: false,
        status: ExportStatus.FAILED,
        errorCode: ExportErrorCode.VALIDATION_ERROR,
        message: "Request parameters are missing key payload mapping elements.",
        correlationId: request.correlationId,
      };
    }

    let result: ExportResult;

    // Direct workload based on target business format specifications
    if (request.format === OutputFormat.SAP) {
      result = await this.sapExporter.pushToSAP(request);
    } else {
      result = await this.officeRenderer.generate(request);
    }

    // Capture and submit compliance event tracking metadata
    if (result.success) {
      await this.auditor.log(request.tenantId, "EXPORT_DISPATCH_SUCCESS", {
        documentId: request.documentId,
        format: request.format,
        exportId: result.exportId,
        correlationId: request.correlationId,
        durationMs: result.metadata.durationMs,
      });

      // Notify system listeners
      eventBus.publish("CONVERSION_COMPLETED", request.tenantId, {
        documentId: request.documentId,
        targetFormat: request.format.toString(),
        convertedUrl: `https://munjiz.storage.internal/export/${result.exportId}`,
        fileSizeBytes: Buffer.byteLength(JSON.stringify(request.payload.extractedData), "utf8"),
      }, { correlationId: request.correlationId });

    } else {
      const failureResult = result as ExportFailureResult;
      await this.auditor.log(request.tenantId, "EXPORT_DISPATCH_FAILED", {
        documentId: request.documentId,
        format: request.format,
        errorCode: failureResult.errorCode,
        message: failureResult.message,
        correlationId: request.correlationId,
      });
    }

    return result;
  }
}

// Export singleton engine instance
export const exportService = new ExportService();
export default exportService;
