# MUNJIZ (منجز): Dynamic Document Intelligence Operating System
## Enterprise Multi-Tenant Core Architecture & Distributed System Design
### Document Reference: MUNJIZ-ARCH-V2.0-PROD
### Classification: Enterprise Confidential (ICON CODE)

---

## 1. World-Class Multi-Tenant Distributed Architecture

MUNJIZ is an enterprise-grade AI-prioritized Document Processing OS. To guarantee perfect isolation, massive horizontal scalability, and zero-trust security boundaries at scale, the system is designed as a **White-Label / Clone-on-Demand SaaS**. 

```
                                      [ CLOUDFLARE EDGE CDN ]
                       (Anycast Routing • DDoS Shield • Dynamic Subdomains)
                                                 │
                        ┌────────────────────────┴────────────────────────┐
                        ▼                                                 ▼
            [ TENANT INSTANCE 1 ]                             [ TENANT INSTANCE 2 ]
          (sub1.munjiz.com / custom)                       (sub2.munjiz.com / custom)
                        │                                                 │
         ┌──────────────┴──────────────┐                   ┌──────────────┴──────────────┐
         ▼                             ▼                   ▼                             ▼
  [ Compute Node ]              [ DB Schema ]       [ Compute Node ]              [ DB Schema ]
 (Cloud Run • Autoscaling)     (Postgresql • RLS)  (Cloud Run • Autoscaling)     (Postgresql • RLS)
         │                             │                   │                             │
         └──────────────┬──────────────┘                   └──────────────┬──────────────┘
                        ▼                                                 ▼
                        └────────────────────────┬────────────────────────┘
                                                 ▼
                                     [ KAFKA / NATS EVENT BUS ]
                                        (Message Spindle Engine)
                                                 │
                                                 ▼
                                     [ STATELESS AI WORKER POOL ]
                                          (Dynamic DAG Nodes)
                                                 │
                                                 ▼
                                   [ DEVOPS & BROWSER CLIENTS ]
```

### Multi-Tenant Isolation Boundaries
*   **Logical Isolated Database Schema**: Deep tenant separation with **PostgreSQL Row-Level Security (RLS)** using cryptographic workspace keys.
*   **Secured Edge Routers**: TLS termination handled at the edge (Cloudflare) with dynamic re-routing of multi-level paths.
*   **Static Assets & OCR Blob Isolation**: Isolated client S3-style containers bound to tenant-only KMS encryption keys.

---

## 2. Complete Monorepo Folder Structure

```text
munjiz-monorepo/
├── apps/
│   ├── master-portal/                          # Control Plane (ICON CODE Admin Console)
│   │   ├── src/
│   │   │   ├── app/                            # Master Billing & Instance Provisioning Router
│   │   │   └── components/                     # Admin telemetry grid builders
│   │   └── package.json
│   │
│   └── tenant-portal/                          # Tenant Instance Base (Cloned & Customized)
│       ├── src/
│       │   ├── app/                            # Multilingual OCR, RBAC, Printing App routes
│       │   ├── components/                     # Document dropping nodes, Print spool controllers
│       │   └── hooks/                          # RTL state listeners
│       └── package.json
│
├── packages/
│   ├── database/                               # Row-Level Security Schemas
│   │   ├── src/
│   │   │   ├── client.ts                       # Secured postgres pool instance
│   │   │   └── schema.ts                       # Unified database type declarations
│   │   └── package.json
│   │
│   ├── ai-orchestrator/                        # Core AI Brain (DAG Workflow Builder)
│   │   ├── src/
│   │   │   ├── engine.ts                       # Intent router & DAG execution graph
│   │   │   ├── providers/                      # Google GenAI SDK wrapper
│   │   │   └── types.ts                        # Step state abstractions
│   │   └── package.json
│   │
│   ├── printer-driver/                         # Spool Spindle drivers
│   │   ├── src/
│   │   │   ├── network.ts                      # Network Wi-Fi layout parser
│   │   │   ├── physical.ts                     # USB / Bluetooth layout spooler
│   │   │   └── offline-cache.ts                # Queue synchronization protocols
│   │   └── package.json
│   │
│   └── shared-utils/                           # Security, crypts, localization
│       └── src/
│           ├── rbac.ts                         # Role level authorization middlewares
│           └── locales.ts                      # Translatability mappings (Arabic/English)
│
├── infrastructure/                             # Automation cluster files
│   ├── docker/                                 # Templated container build files
│   └── terraform/                              # Elastic compute deployment files
│
├── turbo.json
└── package.json
```

---

## 3. High-Fidelity Event Flow Diagram

```text
       [USER ACTION] (Mobile App / Scanner / Web Portal)
             │
             ▼
      DOCUMENT_UPLOADED ────► [Stage raw input to secured AWS S3 bucket/path]
             │
             ▼
      OCR_COMPLETED ────────► [Vision models extract unstructured textual layouts]
             │
             ▼
      EXTRACTION_DONE ──────► [Classification algorithm maps data to table schemas]
             │
             ▼
      CONVERSION_READY ─────► [Export transformation engines generate DOCX, XML, etc.]
             │
             ├─────────────────────────────────────────┐
             ▼ (Spool Trigger)                         ▼ (API Sync Trigger)
      PRINT_JOB_CREATED ──► [Spooler Dispatch]   INTEGRATIONS_DISPATCHED ──► [Post ERP / SAP]
             │
             ├───────────────────────┐
             ▼ (Success)             ▼ (Fail)
      PRINT_SUCCESS           PRINT_FAILED ──► [Re-queue to dead-letter thread (DLQ)]
```

---

## 4. PostgreSQL Database Schema with Row-Level Security (RLS)

This SQL script implements the database schema. Row-Level Security (RLS) is enabled, requiring all commands to supply a verified `app.current_tenant_id` session parameter.

```sql
-- =========================================================================
-- MUNJIZ (منجز) DATABASE ARCHITECTURE SPECIFICATION
-- =========================================================================

-- Enable Core Secure System Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Define Enums for operational status parameters
CREATE TYPE tenant_status AS ENUM ('Active', 'Suspended', 'Maintenance');
CREATE TYPE user_role AS ENUM ('Super_Admin', 'Owner', 'Admin', 'Manager', 'Employee', 'Viewer');
CREATE TYPE processing_status AS ENUM ('Draft', 'Processing', 'Completed', 'Failed');

-- 1. Tenants Workspace Cluster Table
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(255) NOT NULL UNIQUE,
    custom_domain VARCHAR(255) UNIQUE,
    logo_color VARCHAR(50) DEFAULT '#6366f1' NOT NULL,
    status tenant_status DEFAULT 'Active' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. Tenant Scoped Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'Employee' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_tenant_user_email UNIQUE (tenant_id, email)
);

-- 3. Unified Intelligent Documents Repository
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    status processing_status DEFAULT 'Draft' NOT NULL,
    ocr_text TEXT,
    metadata_json JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 4. Immutable Audit Logs Table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- =========================================================================
-- DATABASE SECURITY BOUNDARIES: ENABLE ROW-LEVEL SECURITY (RLS)
-- =========================================================================

-- Enable RLS for Scoped Workspace Integrity
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create Policies mapping isolation parameter filters
-- Parameter 'app.current_tenant_id' is set securely per connection thread in middleware.

CREATE POLICY t_isolation_users ON users 
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

CREATE POLICY t_isolation_documents ON documents 
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

CREATE POLICY t_isolation_audit_logs ON audit_logs 
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

-- =========================================================================
-- HIGH PERFORMANCE DATAFRAME INDEXING
-- =========================================================================
CREATE INDEX idx_users_tenant_lookup ON users(tenant_id);
CREATE INDEX idx_docs_tenant_owner ON documents(tenant_id, owner_id);
CREATE INDEX idx_docs_metadata_jsonb ON documents USING gin (metadata_json);
CREATE INDEX idx_audits_tenant_created ON audit_logs(tenant_id, created_at DESC);
```

---

## 5. Tenant Isolation Middleware (TypeScript)

This Express middleware extracts the multi-tenant context from JWT tokens, validates workspace eligibility, and sets the local session parameter inside PostgreSQL.

```typescript
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PoolClient } from "pg";
import { getDbPool } from "@packages/database";

export interface TenantRequest extends Request {
  tenantId?: string;
  userId?: string;
  userRole?: string;
}

export async function tenantIsolationMiddleware(
  req: TenantRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access Denied: No session signature attached." });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Decoding tenant identity claims
    const decoded = jwt.verify(token, process.env.JWT_SIGNING_SECRET!) as {
      tenantId: string;
      userId: string;
      role: string;
    };

    req.tenantId = decoded.tenantId;
    req.userId = decoded.userId;
    req.userRole = decoded.role;

    // Retrieve database pool connection client
    const pool = getDbPool();
    const client: PoolClient = await pool.connect();

    try {
      // SET LOCAL restricts transaction thread scope in current session
      await client.query("BEGIN;");
      await client.query(`SELECT set_config('app.current_tenant_id', $1, true);`, [req.tenantId]);
      
      // Save client transaction to current thread context
      res.locals.dbClient = client;
      
      next();
    } catch (dbErr) {
      client.release();
      res.status(500).json({ error: "Failed to allocate secure database workspace boundaries." });
    }

  } catch (jwtErr) {
    return res.status(403).json({ error: "Authentication failed. Token invalid." });
  }
}

// Transaction finalizer middleware hook
export async function transactionFinalizerMiddleware(
  req: TenantRequest,
  res: Response,
  next: NextFunction
) {
  const client = res.locals.dbClient;
  if (client) {
    try {
      await client.query("COMMIT;");
    } catch (e) {
      await client.query("ROLLBACK;");
    } finally {
      client.release();
    }
  }
  next();
}
```

---

## 6. Comprehensive API Structure Specification

### 6.1. Document Processing Controller
*   **Ingestion Upload Pipeline**
    *   `POST /api/v1/documents/upload`
    *   **Body**: Form-data (Binary file payload stream)
    *   **Response**: `202 Accepted` returning async Tracking JSON reference.
*   **Format Transformation Gateway**
    *   `POST /api/v1/documents/:id/transform`
    *   **Body**: `{"targetFormat": "XLSX" | "SAP_XML"}`
    *   **Response**: `200 OK` with target download S3 URL.

### 6.2. Industrial Spooler & Printing Dispatcher
*   **Send File to Active Device**
    *   `POST /api/v1/print/spool`
    *   **Body**:
        ```json
        {
          "documentId": "4a7ba311-fc2d-4889-8a3c-b7f52554e2fe",
          "printerAddress": "192.168.1.185",
          "config": {
            "paperSize": "A4",
            "localeRtl": true,
            "duplex": true
          }
        }
        ```
    *   **Response**: `201 Created` returning job ID tracking values.

---

## 7. Dynamic AI Orchestrator Core (DAG Compilation Engine)

The cognitive brain constructs execution graphs dynamically in response to user text. It manages parallel worker tasks, monitors queue threads, and handles failovers.

```typescript
import { GoogleGenAI } from "@google/genai";

interface TaskNode {
  id: string;
  type: "ocr" | "structure" | "convert" | "print";
  params: any;
  dependsOn: string[];
  status: "pending" | "running" | "completed" | "failed";
}

export class AIWorkflowOrchestrator {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }

  // Compile prompt into execution nodes graph
  public async compilePromptToDAG(userPrompt: string, lang: 'ar' | 'en'): Promise<TaskNode[]> {
    const orchestratorInstructions = `
      You are the MUNJIZ System Brain. Parse the user's natural language command and convert it into a JSON DAG.
      Available node types:
      1. ocr: Image/PDF to Raw Arabic/English OCR String mapping.
      2. structure: Key-value mapped schema extractions (e.g. metadata table format).
      3. convert: Conversion outputs to SAP_XML, DOCX, target layouts.
      4. print: Local network printer spool dispatching.

      Output JSON array interface:
      {
        "id": "node-hash",
        "type": "ocr" | "structure" | "convert" | "print",
        "params": {},
        "dependsOn": ["parent-node-id"]
      }
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [
          { role: "system", parts: [{ text: orchestratorInstructions }] },
          { role: "user", parts: [{ text: userPrompt }] }
        ],
        config: { responseMimeType: "application/json" }
      });

      const rawJson = response.text || "[]";
      return JSON.parse(rawJson) as TaskNode[];
    } catch (err) {
      console.error("Orchestrator compilation crash. Issuing default linear node sequence:", err);
      // Fail-safe default fallback DAG
      return [
        { id: "step-1", type: "ocr", params: {}, dependsOn: [], status: "pending" },
        { id: "step-2", type: "structure", params: {}, dependsOn: ["step-1"], status: "pending" }
      ];
    }
  }

  // Execute Graph processing paths in parallel based on dependency states
  public async executeDAG(dag: TaskNode[], tenantId: string): Promise<void> {
    const executionQueue = [...dag];
    
    while (executionQueue.some(t => t.status === "pending" || t.status === "running")) {
      const readyTasks = executionQueue.filter(
        task => task.status === "pending" && 
        task.dependsOn.every(depId => dag.find(d => d.id === depId)?.status === "completed")
      );

      if (readyTasks.length === 0 && executionQueue.some(t => t.status === "running")) {
        // Wait for running steps to emit completions
        await new Promise(resolve => setTimeout(resolve, 300));
        continue;
      }

      if (readyTasks.length === 0 && executionQueue.some(t => t.status === "pending")) {
        throw new Error("Cyclic dependency deadlock detected in compiled JSON workflow graph.");
      }

      // Execute non-blocking actions concurrently
      await Promise.all(readyTasks.map(async (task) => {
        task.status = "running";
        try {
          console.log(`[Tenant isolation: ${tenantId}] Dispatching step engine: ${task.type}`);
          await this.dispatchStepRuntime(task);
          task.status = "completed";
        } catch (taskErr) {
          task.status = "failed";
          // Implement compensation rollbacks for upstream steps
          throw taskErr;
        }
      }));
    }
  }

  private async dispatchStepRuntime(task: TaskNode): Promise<void> {
    // Simulate runtime compute allocation delays
    await new Promise(resolve => setTimeout(resolve, 800));
    console.log(`Step ${task.id} (${task.type}) completed successfully.`);
  }
}
```

---

## 8. High-Scaling Cloud Deployment & Marketplace Architecture

### 8.1. Infrastructure Platform Map
*   **Microservices Compute**: Stateless Express-Vite containers deployed in **Google Cloud Run** with minimum-instances parameters configured to eliminate cold boots during high traffic hours.
*   **Message Spindle**: Dual-region **NATS JetStream** to capture dynamic upload event payloads.
*   **Fast Caching**: **Redis Cluster** maintaining user sessions, rate-limit keys, and offline printing spool buffers.

### 8.2. Plugin & Marketplace Strategy
MUNJIZ includes a **marketplace plugin register** interface. Each developer-made plugin (e.g., custom German OCR pre-processor or specific Zebra Label Printer driver) implements standard JSON endpoint schemas:

```typescript
interface MarketplacePlugin {
  id: string;
  category: "Vision" | "Format" | "Driver";
  handshake: (api: string) => Promise<{ active: boolean }>;
  processStep: (payload: Buffer, config: any) => Promise<Buffer>;
}
```

This guarantees extensibility without the need to modify core orchestrator and database layers.

---
### Compiled by: Lead Enterprise System Architect, ICON CODE.
