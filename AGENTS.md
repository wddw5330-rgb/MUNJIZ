# Agent Operational Guidelines & Architectural Policies
## MUNJIZ (منجز) Enterprise SaaS Platform

This document defines and enforces the absolute coding and architectural principles of the **MUNJIZ** platform. Any agent operating in this workspace must strictly adhere to these policies.

---

### 1. Security & Isolation Manifesto
*   **Zero-Trust Security Model**: Never assume any request is safe or authentic. All incoming tokens, session scopes, and resource requests must undergo cryptographically secure validation at the boundary.
*   **Strict Multi-Tenant Isolation**: There must be absolute logical database and filesystem isolation between company workspaces. No cross-tenant data access is allowed under any condition.
*   **PostgreSQL with RLS Mandatory**: PostgreSQL is the immutable source of truth. All tenant-owned tables must have **Row-Level Security (RLS)** explicitly enabled and strictly enforced using PostgreSQL session parameters.
*   **Row-Level Security Configuration**:
    *   Row-Level Security must be enabled and forced on all tables containing tenant-scoped data:
        ```sql
        ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;
        ALTER TABLE <table_name> FORCE ROW LEVEL SECURITY;
        ```
    *   All system queries matching tenant boundaries must resolve the active scope dynamically using the session parameter:
        ```sql
        current_setting('app.current_tenant_id')::uuid
        ```

### 2. Physical & Logical Data Design Policies
*   **UUID Primary Keys**: All reference identifiers, primary keys, and foreign keys must exclusively use `UUID` data-types generated via `gen_random_uuid()` or `uuid_generate_v4()`. Avoid incremental integer IDs to prevent metadata harvesting attacks.
*   **Highly Flexible Metadata Structuring**: Utilize PostgreSQL `JSONB` for storing extracted OCR values, dynamic workflow metadata, and multi-tenant custom schema parameters. This ensures high-performance schema-less extensibility.
*   **Explicit Indexing Strategy**: All tables containing a foreign relation or frequently filtered context keys (such as `tenant_id`, `owner_id`, `created_at`) must contain explicit index declarations for sub-millisecond query execution metrics.
*   **Principle of Least Privilege**:
    *   Application database connections must never use superuser/owner roles.
    *   Application users are restricted to tenant boundaries using RLS policies.
    *   All write and delete queries must be executed within transactional wrappers verifying tenant context explicitly.

### 3. Professional Engineering Standards
*   **Auditability by Design**: Every write, status transition, billing change, and admin operation (especially Administrative Impersonation) must write an immutable audit trail to the transaction log table showing actor context and parameters.
*   **Production-Ready Baseline**: Do not output demo placeholders, incomplete mock scripts, or code cutoffs containing remarks like `// TODO: add code here`. All files must contain syntax-valid, ready-to-run logical statements.
*   **Backward-Compatible Migrations**: All schema updates must preserve backwards-compatibility. Standard table mutations must run without service disruption using standard column modification syntax patterns.
