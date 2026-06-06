/**
 * =========================================================================
 * MUNJIZ (منجز) Enterprise SaaS Platform - Core Tenant-Scoped Document Service
 * Developed by ICON CODE Engineering Systems Bureau
 * File: /src/services/document.service.ts
 * =========================================================================
 */

import { db } from "../database/database.service";
import { DatabaseExecutionError, TenantIsolationError } from "../core/errors";
import { requireTenantId, getTenantContext } from "../core/tenant-context";

// ─── STATUS ENUMERATION ───
export enum DocumentStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  OCR_COMPLETED = "OCR_COMPLETED",
  EXTRACTION_COMPLETED = "EXTRACTION_COMPLETED",
  CONVERSION_COMPLETED = "CONVERSION_COMPLETED",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED"
}

// ─── DTO ENVELOPE STRUCTS ───
export interface CreateDocumentDto {
  ownerId: string;
  name: string;
  filePath: string;
  fileSizeBytes: number;
  mimeType: string;
  correlationId?: string;
}

export interface UpdateDocumentStatusDto {
  documentId: string;
  status: DocumentStatus;
  correlationId?: string;
}

export interface DocumentRow {
  id: string;
  tenant_id: string;
  owner_id: string;
  name: string;
  file_path: string;
  file_size_bytes: string; // BIGINT yields string in node-postgres
  mime_type: string;
  version: number;
  status: string;
  ocr_text: string | null;
  ai_summary: string | null;
  metadata_json: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export class DocumentService {
  /**
   * Registers a new document and records details in both document registry and immutable audit trails.
   */
  public async createDocument(dto: CreateDocumentDto): Promise<DocumentRow> {
    const tenantId = requireTenantId();
    const context = getTenantContext();

    this.validateCreateDto(dto);

    // Initial structured metadata parameters payload
    const metadata = {
      correlationId: dto.correlationId || `corr-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      isSoftDeleted: false,
      systemIngestionVersion: "MUNJIZ-DOC-V2",
    };

    return db.runInTenantTransaction<DocumentRow>(async (client) => {
      // 1. Persist the main document record
      const sqlDoc = `
        INSERT INTO documents (
          tenant_id, owner_id, name, file_path, file_size_bytes, mime_type, status, metadata_json
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *;
      `;

      const valuesDoc = [
        tenantId,
        dto.ownerId,
        dto.name,
        dto.filePath,
        dto.fileSizeBytes,
        dto.mimeType,
        DocumentStatus.PENDING,
        JSON.stringify(metadata)
      ];

      const docRes = await client.query(sqlDoc, valuesDoc);
      if (!docRes.rows || docRes.rows.length === 0) {
        throw new DatabaseExecutionError(
          "Transaction Aborted: Insertion returned clean empty matching result.",
          "DOCUMENT_CREATION_FAILED"
        );
      }

      const createdDoc = docRes.rows[0] as DocumentRow;

      // 2. Write details down into our system audits table for zero-trust compliance
      const sqlLogs = `
        INSERT INTO audit_logs (
          tenant_id, user_id, action, category, ip_address, user_agent, details
        ) VALUES ($1, $2, $3, 'Document', $4, $5, $6);
      `;

      const valuesLogs = [
        tenantId,
        dto.ownerId,
        "DOCUMENT_UPLOAD",
        "127.0.0.1",
        "MUNJIZ Node Server Core Engine",
        JSON.stringify({
          documentId: createdDoc.id,
          correlationId: metadata.correlationId,
          fileName: dto.name,
          role: context?.role || "Employee",
        }),
      ];

      await client.query(sqlLogs, valuesLogs);

      console.log(`[DocumentService] CREATED document: ${createdDoc.id} under Tenant: ${tenantId}`);
      return createdDoc;
    });
  }

  /**
   * Performs an update of the document stage step safely inside database transaction layers.
   */
  public async updateStatus(dto: UpdateDocumentStatusDto): Promise<DocumentRow> {
    const tenantId = requireTenantId();
    const context = getTenantContext();

    const sql = `
      UPDATE documents
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND tenant_id = $3 AND (metadata_json->>'isSoftDeleted')::boolean = false
      RETURNING *;
    `;

    return db.runInTenantTransaction<DocumentRow>(async (client) => {
      const result = await client.query(sql, [dto.status, dto.documentId, tenantId]);
      if (!result.rows || result.rows.length === 0) {
        throw new TenantIsolationError(
          `Unauthorized Database Request: Document ${dto.documentId} either is soft-deleted, not mapped, or belongs to another tenant.`,
          "DOCUMENT_STATE_UPDATE_DENIED"
        );
      }

      const updatedDoc = result.rows[0] as DocumentRow;

      // Log auditing record for strict compliance tracing
      const sqlLogs = `
        INSERT INTO audit_logs (
          tenant_id, user_id, action, category, ip_address, user_agent, details
        ) VALUES ($1, $2, $3, 'Document', $4, $5, $6);
      `;
      const valuesLogs = [
        tenantId,
        context?.userId || null,
        "DOCUMENT_STATUS_TRANSITION",
        "127.0.0.1",
        "MUNJIZ Core Engine Pipeline",
        JSON.stringify({
          documentId: dto.documentId,
          oldStatus: updatedDoc.status,
          newStatus: dto.status,
          correlationId: dto.correlationId,
        }),
      ];
      await client.query(sqlLogs, valuesLogs);

      return updatedDoc;
    });
  }

  /**
   * Safe soft-delete mechanism preserving files and data structures under strict audit trails.
   */
  public async softDeleteDocument(documentId: string, userId?: string): Promise<void> {
    const tenantId = requireTenantId();

    const fetchSql = `
      SELECT id, metadata_json FROM documents 
      WHERE id = $1 AND tenant_id = $2 AND (metadata_json->>'isSoftDeleted')::boolean = false;
    `;

    await db.runInTenantTransaction<void>(async (client) => {
      const fetchRes = await client.query(fetchSql, [documentId, tenantId]);
      if (!fetchRes.rows || fetchRes.rows.length === 0) {
        throw new TenantIsolationError(
          "Resource not found: Request to delete document has been aborted.",
          "DELETE_TARGET_MISSING"
        );
      }

      const currentMeta = fetchRes.rows[0].metadata_json || {};
      const updatedMeta = {
        ...currentMeta,
        isSoftDeleted: true,
        deletedAt: new Date().toISOString(),
        deletedByUserId: userId,
      };

      const updateSql = `
        UPDATE documents
        SET metadata_json = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND tenant_id = $3;
      `;

      await client.query(updateSql, [JSON.stringify(updatedMeta), documentId, tenantId]);

      // Write security trace
      const auditSql = `
        INSERT INTO audit_logs (
          tenant_id, user_id, action, category, ip_address, user_agent, details
        ) VALUES ($1, $2, $3, 'Security', '127.0.0.1', 'MUNJIZ System Admin Portal', $4);
      `;
      const auditDetails = JSON.stringify({
        documentId,
        deletionTrigger: "SOFT_DELETION",
        actorUserId: userId,
      });

      await client.query(auditSql, [tenantId, userId || null, "DOCUMENT_SOFT_DELETE", auditDetails]);
      console.warn(`[DocumentService] SOFT-DELETED document ID: ${documentId} on Tenant ID: ${tenantId}`);
    });
  }

  /**
   * Retrieves single document records if and only if they are not soft-deleted.
   */
  public async getDocumentById(id: string): Promise<DocumentRow> {
    const tenantId = requireTenantId();

    const sql = `
      SELECT * FROM documents
      WHERE id = $1 AND tenant_id = $2 AND (metadata_json->>'isSoftDeleted')::boolean = false;
    `;

    const rows = await db.query<DocumentRow>(sql, [id, tenantId]);
    if (!rows || rows.length === 0) {
      throw new TenantIsolationError(
        "Resource Denied: Requested document payload is inaccessible or does not exist.",
        "UNAUTHORIZED_RESOURCE_READ_ATTEMPT"
      );
    }
    return rows[0];
  }

  /**
   * Obtains all active documents inside the tenant pool.
   */
  public async getTenantDocuments(): Promise<DocumentRow[]> {
    const tenantId = requireTenantId();

    const sql = `
      SELECT * FROM documents
      WHERE tenant_id = $1 AND (metadata_json->>'isSoftDeleted')::boolean = false
      ORDER BY created_at DESC;
    `;

    return db.query<DocumentRow>(sql, [tenantId]);
  }

  /**
   * Updates extracted details outputting completion status maps.
   */
  public async setExtractedIntelligence(
    id: string,
    ocrText: string,
    summary: string,
    metadataDetails: Record<string, any>
  ): Promise<DocumentRow> {
    const tenantId = requireTenantId();

    const fetchSql = `
      SELECT metadata_json FROM documents 
      WHERE id = $1 AND tenant_id = $2 AND (metadata_json->>'isSoftDeleted')::boolean = false;
    `;

    return db.runInTenantTransaction<DocumentRow>(async (client) => {
      const fetchRes = await client.query(fetchSql, [id, tenantId]);
      if (!fetchRes.rows || fetchRes.rows.length === 0) {
        throw new TenantIsolationError(
          "Update failed: target document not active or accessible.",
          "INTELLIGENCE_TARGET_UNAVAILABLE"
        );
      }

      const baselineMetaValue = fetchRes.rows[0].metadata_json || {};
      const unifiedMetadata = {
        ...baselineMetaValue,
        ...metadataDetails,
        aiEngineProcessor: "MUNJIZ_COGNITIVE_CORE_V2"
      };

      const updateSql = `
        UPDATE documents
        SET status = $1,
            ocr_text = $2,
            ai_summary = $3,
            metadata_json = $4,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $5 AND tenant_id = $6
        RETURNING *;
      `;

      const result = await client.query(updateSql, [
        DocumentStatus.COMPLETED,
        ocrText,
        summary,
        JSON.stringify(unifiedMetadata),
        id,
        tenantId,
      ]);

      return result.rows[0];
    });
  }

  /**
   * Field validation routines preventing buffer overflows or SQL boundary leaks.
   */
  private validateCreateDto(dto: CreateDocumentDto): void {
    if (!dto.ownerId || dto.ownerId.length < 5) {
      throw new DatabaseExecutionError("Invalid Owner ID representation structure.", "VALIDATION_FAILED");
    }
    if (!dto.name || dto.name.trim().length === 0) {
      throw new DatabaseExecutionError("Original filename cannot be empty.", "VALIDATION_FAILED");
    }
    if (!dto.filePath || dto.filePath.trim().length === 0) {
      throw new DatabaseExecutionError("Document file physical path MUST be provided.", "VALIDATION_FAILED");
    }
    if (dto.fileSizeBytes <= 0) {
      throw new DatabaseExecutionError("Uploaded file size must be greater than zero.", "VALIDATION_FAILED");
    }
  }
}

export const documentService = new DocumentService();
export default documentService;
