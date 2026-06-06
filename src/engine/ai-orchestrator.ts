/**
 * =========================================================================
 * MUNJIZ (منجز) Enterprise SaaS Platform - Core AI DAG Orchestrator
 * Developed by ICON CODE Engineering Systems Bureau
 * File: /src/engine/ai-orchestrator.ts
 * =========================================================================
 */

import { eventBus } from "../core/event-bus";
import { documentService, DocumentStatus, DocumentRow } from "../services/document.service";
import { ocrService } from "./ocr.service";
import { requireTenantId, TenantContextPayload, runWithTenant, getTenantContext } from "../core/tenant-context";
import { DatabaseExecutionError, TenantIsolationError } from "../core/errors";

// ─── STAGE IDENTIFIERS ───
export type OrchestratorNodeName =
  | "OCR"
  | "EXTRACTION"
  | "CLASSIFICATION"
  | "VALIDATION"
  | "CONVERSION";

export interface NodeRegistryExecutor {
  name: OrchestratorNodeName;
  execute(context: ExecutionContext): Promise<Record<string, any>>;
}

export interface ExecutionContext {
  documentId: string;
  tenantId: string;
  prompt: string;
  correlationId: string;
  traceId: string;
  accumulatedData: Record<string, any>;
}

export interface DAGNode {
  name: OrchestratorNodeName;
  dependencies: OrchestratorNodeName[];
  status: "IDLE" | "RUNNING" | "COMPLETED" | "FAILED";
  retryCount: number;
  maxRetries: number;
  compensation?: (context: ExecutionContext) => Promise<void>;
}

export interface DAGOrchestratorPayload {
  documentId: string;
  prompt: string;
  correlationId?: string;
  traceId?: string;
}

export interface OrchestrationSummary {
  workflowId: string;
  documentId: string;
  tenantId: string;
  status: "SUCCESS" | "FAILED";
  executedNodes: OrchestratorNodeName[];
  elapsedMs: number;
  outputMetadata: Record<string, any>;
  error?: string;
}

export class AiOrchestrator {
  private nodeRegistry = new Map<OrchestratorNodeName, NodeRegistryExecutor>();

  constructor() {
    this.bootstrapStandardNodeRegistry();
  }

  /**
   * Safe registration hook to allow extensibility of individual executor blocks.
   */
  public registerNodeExecutor(executor: NodeRegistryExecutor): void {
    this.nodeRegistry.set(executor.name, executor);
  }

  /**
   * Sets up our robust default executors mapping to OCR, EXTRACTION, CLASSIFICATION, VALIDATION, and CONVERSION
   */
  private bootstrapStandardNodeRegistry(): void {
    // 1. OCR Node
    this.registerNodeExecutor({
      name: "OCR",
      execute: async (context) => {
        // Fetch original document first representing physical file reference
        const doc = await documentService.getDocumentById(context.documentId);
        eventBus.publish("OCR_STARTED", context.tenantId, { documentId: context.documentId, stage: "OCR" }, context);

        const ocrPayload = await ocrService.extractTextAndStructure({
          documentId: context.documentId,
          filePath: doc.file_path,
          fileName: doc.name,
        });

        eventBus.publish("OCR_COMPLETED", context.tenantId, {
          documentId: context.documentId,
          ocrText: ocrPayload.text,
          detectedLanguage: ocrPayload.language,
          confidence: ocrPayload.confidence,
        }, context);

        return {
          ocrText: ocrPayload.text,
          detectedLanguage: ocrPayload.language,
          ocrConfidence: ocrPayload.confidence,
          ocrEntities: ocrPayload.entities,
          ocrMetadata: ocrPayload.metadata,
        };
      },
    });

    // 2. EXTRACTION Node
    this.registerNodeExecutor({
      name: "EXTRACTION",
      execute: async (context) => {
        eventBus.publish("EXTRACTION_STARTED", context.tenantId, { documentId: context.documentId }, context);
        await new Promise((resolve) => setTimeout(resolve, 800)); // Simulating NLP processing latency

        const extractedData = {
          extractedTaxNumber: context.accumulatedData.ocrEntities?.taxRegistrationNumber || "N/A",
          extractedTotalPayable: context.accumulatedData.ocrEntities?.totalPayableAmount || 0,
          documentParties: context.accumulatedData.ocrEntities?.parties || [],
          extractionEngineVersion: "MunjizLLM-v2.5",
        };

        eventBus.publish("EXTRACTION_COMPLETED", context.tenantId, {
          documentId: context.documentId,
          extractedData,
        }, context);

        return { ...extractedData };
      },
    });

    // 3. CLASSIFICATION Node
    this.registerNodeExecutor({
      name: "CLASSIFICATION",
      execute: async (context) => {
        eventBus.publish("CLASSIFICATION_STARTED", context.tenantId, { documentId: context.documentId }, context);
        await new Promise((resolve) => setTimeout(resolve, 600));

        const derivedType = context.accumulatedData.ocrMetadata?.documentClassification || "Standard_Unclassified";
        const category = derivedType.toLowerCase().includes("invoice") ? "Finance" : "Administrative_Ops";

        eventBus.publish("CLASSIFICATION_COMPLETED", context.tenantId, {
          documentId: context.documentId,
          category,
          documentType: derivedType,
          confidenceScore: 0.941,
        }, context);

        return {
          derivedType,
          category,
          classificationEngine: "MunjizNaiveClassifier-v1",
        };
      },
    });

    // 4. VALIDATION Node
    this.registerNodeExecutor({
      name: "VALIDATION",
      execute: async (context) => {
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Let's run a set of compliance sanity checks
        const validationErrors: string[] = [];
        const isTaxOk = context.accumulatedData.extractedTaxNumber !== "N/A";
        const isTotalOk = context.accumulatedData.extractedTotalPayable >= 0;

        if (!isTaxOk) validationErrors.push("Tax compliance registration identifier missing under OCR scanning.");
        if (!isTotalOk) validationErrors.push("Financial value mismatch: aggregate value evaluates to negative domain.");

        const isValidated = validationErrors.length === 0;

        eventBus.publish("VALIDATION_COMPLETED", context.tenantId, {
          documentId: context.documentId,
          isValidated,
          validationErrors,
          rulesRunCount: 2,
        }, context);

        return {
          isValidated,
          validationErrors,
          complianceLevel: isValidated ? "SECURE" : "WARNING",
        };
      },
    });

    // 5. CONVERSION Node
    this.registerNodeExecutor({
      name: "CONVERSION",
      execute: async (context) => {
        await new Promise((resolve) => setTimeout(resolve, 700));

        const originalText = context.accumulatedData.ocrText || "";
        const language = context.accumulatedData.detectedLanguage || "en";
        const noticeTitle = language === "ar" ? "تفاصيل معالجة نظام منجز الإلكتروني" : "Munjiz Core Markdown Summary Output";

        const generatedSummary = `# ${noticeTitle}\n\n- **Reference ID**: ${context.documentId}\n- **Compliance Rating**: ${context.accumulatedData.complianceLevel || "N/A"}\n- **Extracted Total**: ${context.accumulatedData.extractedTotalPayable || 0}\n\n## Abstracted Content Layout\n\n\`\`\`\n${originalText.substring(0, 150)}...\n\`\`\``;

        eventBus.publish("CONVERSION_COMPLETED", context.tenantId, {
          documentId: context.documentId,
          targetFormat: "MARKDOWN_HTML",
          convertedUrl: `https://munjiz.storage.internal/output/${context.documentId}.md`,
          fileSizeBytes: Buffer.byteLength(generatedSummary, "utf8"),
        }, context);

        return {
          markdownSummary: generatedSummary,
          conversionTarget: "MARKDOWN_HTML",
        };
      },
    });
  }

  /**
   * Main orchestration pipeline constructing dynamic DAG steps and stepping through node executions.
   */
  public async orchestrate(payload: DAGOrchestratorPayload): Promise<OrchestrationSummary> {
    const startTime = Date.now();
    const tenantId = requireTenantId();
    const parentContext = getTenantContext();

    if (!parentContext) {
      throw new TenantIsolationError(
        "Access Denied: Core Orchestration engine requires active security request boundaries.",
        "ORCHESTRATION_CONTEXT_MISSING"
      );
    }

    const workflowId = `WFCMD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const correlationId = payload.correlationId || `corr-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const traceId = payload.traceId || `trc-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // 1. Build dynamic DAG plan using prompt instruction mapping
    const dagNodes = this.constructDAGPlan(payload.prompt);

    const executionContext: ExecutionContext = {
      documentId: payload.documentId,
      tenantId,
      prompt: payload.prompt,
      correlationId,
      traceId,
      accumulatedData: {},
    };

    console.log(`[DAGOrchestrator] Beginning workflow: ${workflowId} (Trace: ${traceId}) with ${dagNodes.length} mapped steps.`);
    
    // Explicitly transition document status to 'PROCESSING' in PostgreSQL
    await documentService.updateStatus({
      documentId: payload.documentId,
      status: DocumentStatus.PROCESSING,
      correlationId,
    });

    const completedNodes: OrchestratorNodeName[] = [];

    try {
      // 2. Perform Topologically Ordered Node Execution with automatic retries
      for (const node of dagNodes) {
        node.status = "RUNNING";
        let nodeResult: Record<string, any> = {};
        let success = false;

        const executor = this.nodeRegistry.get(node.name);
        if (!executor) {
          throw new DatabaseExecutionError(
            `Orchestrator Registry Error: Mapped Executor for '${node.name}' has not been configured.`,
            "NODE_EXECUTOR_UNAVAILABLE"
          );
        }

        while (node.retryCount <= node.maxRetries && !success) {
          try {
            console.log(`[DAGOrchestrator] Executing node: ${node.name} (Attempt: ${node.retryCount + 1}/${node.maxRetries + 1})`);
            nodeResult = await executor.execute(executionContext);
            success = true;
          } catch (err: any) {
            node.retryCount += 1;
            console.warn(`[DAGOrchestrator] Node execution fault inside [${node.name}]: ${err.message}. Retrying...`);
            if (node.retryCount > node.maxRetries) {
              node.status = "FAILED";
              throw err;
            }
            // Double actual wait duration (simple backoff sequence)
            await new Promise((resolve) => setTimeout(resolve, 200 * node.retryCount));
          }
        }

        // Merge state variables downstream
        executionContext.accumulatedData = {
          ...executionContext.accumulatedData,
          ...nodeResult,
        };

        // Transition system database status markers as completion evidence checkpoints
        const checkpointStatus = this.mapNodeToDocumentStatus(node.name);
        await documentService.updateStatus({
          documentId: payload.documentId,
          status: checkpointStatus,
          correlationId,
        });

        node.status = "COMPLETED";
        completedNodes.push(node.name);

        // Bind rollback handlers on progress stack (Transactional Sagas pattern)
        node.compensation = async (ctx) => {
          console.warn(`[DAGOrchestrator-Compensation] Rewinding state transition targets of step: ${node.name}`);
          // Clear variables to release resources safely on crash
          ctx.accumulatedData = {};
        };
      }

      // 3. Finalize. Consolidate completely extracted metadata schemas and persist
      const finalSummaryText = executionContext.accumulatedData.markdownSummary || "Document metadata compiled flawlessly.";
      
      await documentService.setExtractedIntelligence(
        payload.documentId,
        executionContext.accumulatedData.ocrText || "",
        finalSummaryText,
        executionContext.accumulatedData
      );

      eventBus.publish("WORKFLOW_COMPLETED", tenantId, {
        documentId: payload.documentId,
        workflowId,
        stepsExecuted: completedNodes,
        summary: "Pipeline complete.",
      }, executionContext);

      return {
        workflowId,
        documentId: payload.documentId,
        tenantId,
        status: "SUCCESS",
        executedNodes: completedNodes,
        elapsedMs: Date.now() - startTime,
        outputMetadata: executionContext.accumulatedData,
      };

    } catch (orchestrationFault: any) {
      console.error(`[DAGOrchestrator-CRITICAL] Execution interrupted on workflow: ${workflowId}. Triggering rollback cascades.`);

      // 4. TRANSACTIONAL COMPENSATION & RECOVERY PIPELINE
      eventBus.publish("WORKFLOW_FAILED", tenantId, {
        documentId: payload.documentId,
        workflowId,
        failedStep: completedNodes[completedNodes.length - 1] || "INCEPTION",
        errorReason: orchestrationFault.message,
        rollbackExecuted: true,
      }, executionContext);

      // Rewind actions in reverse chronological stack order
      for (let i = completedNodes.length - 1; i >= 0; i--) {
        const stepName = completedNodes[i];
        const activeNodeItem = dagNodes.find((n) => n.name === stepName);
        if (activeNodeItem && activeNodeItem.compensation) {
          try {
            await runWithTenant(parentContext, async () => {
              await activeNodeItem.compensation!(executionContext);
            });
          } catch (rollbackErr: any) {
            console.error(`[DAGOrchestrator-Compensation] Double Fault: Rollback failed for node [${stepName}]: ${rollbackErr.message}`);
          }
        }
      }

      // Explicitly adjust final DB status state to FAILED
      try {
        await runWithTenant(parentContext, async () => {
          await documentService.updateStatus({
            documentId: payload.documentId,
            status: DocumentStatus.FAILED,
            correlationId,
          });
        });
      } catch (dbStatusUpdateErr: any) {
        console.error("Database connection failed during disaster rollback status marking.", dbStatusUpdateErr);
      }

      return {
        workflowId,
        documentId: payload.documentId,
        tenantId,
        status: "FAILED",
        executedNodes: completedNodes,
        elapsedMs: Date.now() - startTime,
        outputMetadata: {},
        error: orchestrationFault.message,
      };
    }
  }

  /**
   * Translates active node execution into respective DocumentStatus markers
   */
  private mapNodeToDocumentStatus(node: OrchestratorNodeName): DocumentStatus {
    switch (node) {
      case "OCR":
        return DocumentStatus.OCR_COMPLETED;
      case "EXTRACTION":
        return DocumentStatus.EXTRACTION_COMPLETED;
      case "CLASSIFICATION":
        return DocumentStatus.PROCESSING; // Categorization pipeline block is still in progression
      case "VALIDATION":
        return DocumentStatus.PROCESSING;
      case "CONVERSION":
        return DocumentStatus.CONVERSION_COMPLETED;
      default:
        return DocumentStatus.PROCESSING;
    }
  }

  /**
   * Decodes natural language triggers inside prompt commands to compile task pathways.
   */
  private constructDAGPlan(prompt: string): DAGNode[] {
    const rawLower = prompt.toLowerCase();

    // OCR is always the immutable foundation starting point
    const plan: DAGNode[] = [
      {
        name: "OCR",
        dependencies: [],
        status: "IDLE",
        retryCount: 0,
        maxRetries: 3,
      },
    ];

    const needsExtraction =
      rawLower.includes("extract") ||
      rawLower.includes("structure") ||
      rawLower.includes("json") ||
      rawLower.includes("tax") ||
      rawLower.includes("إستخراج") ||
      rawLower.includes("بيانات");

    const needsClassification =
      rawLower.includes("classify") ||
      rawLower.includes("categorize") ||
      rawLower.includes("type") ||
      rawLower.includes("صنف") ||
      rawLower.includes("نوعية");

    const needsValidation =
      rawLower.includes("validate") ||
      rawLower.includes("compliance") ||
      rawLower.includes("check") ||
      rawLower.includes("تحقق") ||
      rawLower.includes("تدقيق");

    const needsConversion =
      rawLower.includes("convert") ||
      rawLower.includes("summary") ||
      rawLower.includes("markdown") ||
      rawLower.includes("html") ||
      rawLower.includes("تلخيص") ||
      rawLower.includes("تحويل");

    // Topologically ordered build
    if (needsExtraction) {
      plan.push({
        name: "EXTRACTION",
        dependencies: ["OCR"],
        status: "IDLE",
        retryCount: 0,
        maxRetries: 2,
      });
    }

    if (needsClassification) {
      plan.push({
        name: "CLASSIFICATION",
        dependencies: needsExtraction ? ["EXTRACTION"] : ["OCR"],
        status: "IDLE",
        retryCount: 0,
        maxRetries: 2,
      });
    }

    if (needsValidation) {
      const prevDepend = needsClassification
        ? "CLASSIFICATION"
        : needsExtraction
        ? "EXTRACTION"
        : "OCR";
      plan.push({
        name: "VALIDATION",
        dependencies: [prevDepend],
        status: "IDLE",
        retryCount: 0,
        maxRetries: 1,
      });
    }

    if (needsConversion) {
      const lastTriggerNode = needsValidation
        ? "VALIDATION"
        : needsClassification
        ? "CLASSIFICATION"
        : needsExtraction
        ? "EXTRACTION"
        : "OCR";
      plan.push({
        name: "CONVERSION",
        dependencies: [lastTriggerNode],
        status: "IDLE",
        retryCount: 0,
        maxRetries: 2,
      });
    }

    return plan;
  }
}

export const aiOrchestrator = new AiOrchestrator();
export default aiOrchestrator;
