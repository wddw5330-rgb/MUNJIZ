/**
 * =========================================================================
 * MUNJIZ (منجز) Enterprise SaaS Platform - Core Event Bus (Distributed NATS/Kafka Hub Emulator)
 * Developed by ICON CODE Engineering Systems Bureau
 * File: /src/core/event-bus.ts
 * =========================================================================
 */

import { EventEmitter } from "events";

export type SystemEventType =
  | "DOCUMENT_UPLOADED"
  | "OCR_STARTED"
  | "OCR_COMPLETED"
  | "EXTRACTION_STARTED"
  | "EXTRACTION_COMPLETED"
  | "CLASSIFICATION_STARTED"
  | "CLASSIFICATION_COMPLETED"
  | "VALIDATION_COMPLETED"
  | "CONVERSION_COMPLETED"
  | "WORKFLOW_COMPLETED"
  | "WORKFLOW_FAILED"
  | "DocumentRefinedEvent"
  | "DocumentRefinementFailedEvent"
  | "DocumentVersionCreatedEvent";

export interface EventMetadata {
  correlationId: string;
  traceId: string;
  timestamp: string;
  tenantId: string;
  userId?: string;
  retryCount: number;
}

export interface BaseEventEnvelope<T = any> {
  id: string;
  type: SystemEventType;
  metadata: EventMetadata;
  payload: T;
}

export interface EventPayloads {
  DOCUMENT_UPLOADED: {
    documentId: string;
    filePath: string;
    fileName: string;
    mimeType: string;
    fileSizeBytes: number;
  };
  OCR_STARTED: {
    documentId: string;
    stage: string;
  };
  OCR_COMPLETED: {
    documentId: string;
    ocrText: string;
    detectedLanguage: string;
    confidence: number;
  };
  EXTRACTION_STARTED: {
    documentId: string;
  };
  EXTRACTION_COMPLETED: {
    documentId: string;
    extractedData: Record<string, any>;
  };
  CLASSIFICATION_STARTED: {
    documentId: string;
  };
  CLASSIFICATION_COMPLETED: {
    documentId: string;
    category: string;
    documentType: string;
    confidenceScore: number;
  };
  VALIDATION_COMPLETED: {
    documentId: string;
    isValidated: boolean;
    validationErrors: string[];
    rulesRunCount: number;
  };
  CONVERSION_COMPLETED: {
    documentId: string;
    targetFormat: string;
    convertedUrl: string;
    fileSizeBytes: number;
  };
  WORKFLOW_COMPLETED: {
    documentId: string;
    workflowId: string;
    stepsExecuted: string[];
    summary: string;
  };
  WORKFLOW_FAILED: {
    documentId: string;
    workflowId: string;
    failedStep: string;
    errorReason: string;
    rollbackExecuted: boolean;
  };
  DocumentRefinedEvent: {
    readonly tenantId: string;
    readonly documentId: string;
    readonly versionId: string;
    readonly correlationId: string;
  };
  DocumentRefinementFailedEvent: {
    readonly tenantId: string;
    readonly documentId: string;
    readonly reason: string;
    readonly correlationId: string;
  };
  DocumentVersionCreatedEvent: {
    readonly tenantId: string;
    readonly documentId: string;
    readonly versionId: string;
    readonly versionNumber: number;
    readonly correlationId: string;
  };
}

export type EventListenerCallback<T> = (envelope: BaseEventEnvelope<T>) => Promise<void> | void;

export class EnterpriseEventBus {
  private emitter = new EventEmitter();
  private dlq: BaseEventEnvelope[] = [];

  constructor() {
    this.emitter.setMaxListeners(100);
  }

  /**
   * Publishes an event to the system event bus asynchronously.
   */
  public publish<E extends SystemEventType>(
    type: E,
    tenantId: string,
    payload: EventPayloads[E],
    trackingContext?: { correlationId?: string; traceId?: string; userId?: string }
  ): void {
    const envelope: BaseEventEnvelope<EventPayloads[E]> = {
      id: `evt-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      type,
      metadata: {
        correlationId: trackingContext?.correlationId || `corr-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        traceId: trackingContext?.traceId || `trc-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        timestamp: new Date().toISOString(),
        tenantId,
        userId: trackingContext?.userId,
        retryCount: 0,
      },
      payload,
    };

    // Process on the next execution loop cycle as non-blocking async emit
    process.nextTick(() => {
      console.log(`[EventBus] PUBLISH: ${type} | ID: ${envelope.id} | CorrelationId: ${envelope.metadata.correlationId} | TenantId: ${tenantId}`);
      this.emitter.emit(type, envelope);
      this.persistEventToArchive(envelope);
    });
  }

  /**
   * Subscribes with retry handlers and auto-routing to Dead-letter Queue on hard failures.
   */
  public subscribe<E extends SystemEventType>(
    type: E,
    listener: EventListenerCallback<EventPayloads[E]>,
    config?: { retries?: number; backoffMs?: number }
  ): void {
    const maxRetries = config?.retries ?? 3;
    const backoffMs = config?.backoffMs ?? 500;

    this.emitter.on(type, async (envelope: BaseEventEnvelope<EventPayloads[E]>) => {
      let success = false;
      
      while (envelope.metadata.retryCount <= maxRetries && !success) {
        try {
          await listener(envelope);
          success = true;
        } catch (err: any) {
          envelope.metadata.retryCount += 1;
          console.warn(
            `[EventBus] Handler execution failed. Retrying event: ${type} (${envelope.metadata.retryCount}/${maxRetries}). Error: ${err.message}`
          );
          if (envelope.metadata.retryCount <= maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, backoffMs * Math.pow(2, envelope.metadata.retryCount)));
          } else {
            console.error(`[EventBus] Hard failure. Routing event standard envelope ${envelope.id} to Dead-Letter Queue (DLQ).`);
            this.routeToDLQ(envelope);
          }
        }
      }
    });
  }

  /**
   * Safe retention hook to hold crashed messages.
   */
  private routeToDLQ(envelope: BaseEventEnvelope): void {
    this.dlq.push(envelope);
    console.error(`[EventBus] DLQ Staged: ${envelope.type} | ID: ${envelope.id} | Context: ${JSON.stringify(envelope.metadata)}`);
  }

  /**
   * Expose DLQ telemetry for observability inspection.
   */
  public getDLQ(): ReadonlyArray<BaseEventEnvelope> {
    return this.dlq;
  }

  /**
   * Persist event structures directly inside the audit schema blocks (Archive-on-dispatch rule)
   */
  private persistEventToArchive(envelope: BaseEventEnvelope): void {
    // In live deployments, this triggers a fast write to PostgreSQL or centralized Elasticsearch node
    // db.query('INSERT INTO event_store ...')
    console.log(`[EventStore] Archiving trace payload index for Event: ${envelope.type} [ID: ${envelope.id}]`);
  }
}

export const eventBus = new EnterpriseEventBus();
export default eventBus;
