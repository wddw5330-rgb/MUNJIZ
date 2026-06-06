-- =========================================================================
-- MUNJIZ (منجز) Enterprise SaaS Platform
-- Developed by ICON CODE
-- Master Database Initialization & Production Schema Definition
-- Target: PostgreSQL 14+
-- Design: Strict Multi-Tenant Isolation with Row-Level Security (RLS)
-- =========================================================================

-- Enable Core Extensions for Cryptographic Integrity & Dynamic ID Generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================================
-- 1. ENUMS & SYSTEM OPERATIONAL STATUSES
-- =========================================================================

-- Tenant physical states (Billing lock triggers or administrative freeze operations)
CREATE TYPE tenant_status AS ENUM ('Active', 'Suspended', 'Maintenance');

-- Granular role allocation inside the system context
CREATE TYPE user_role AS ENUM ('Super_Admin', 'Owner', 'Admin', 'Manager', 'Employee', 'Viewer');

-- Structured categories for auditing system processes
CREATE TYPE audit_category AS ENUM ('Security', 'Access_Control', 'Document', 'AI', 'Billing', 'System');

-- Document processing states 
CREATE TYPE processing_status AS ENUM ('Draft', 'Processing', 'Completed', 'Failed');

-- =========================================================================
-- 2. AUTOMATION PROCEDURES & TRIGGERS
-- =========================================================================

-- Automatically update timestamps on mutation operations
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================================================
-- 3. CORE MULTI-TENANT SCHEMAS
-- =========================================================================

-- 3.1. TENANTS TABLE (Workspace Containers)
-- Security Context: Every tenant operates as a distinct isolated platform bubble.
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(255) NOT NULL UNIQUE,
    custom_domain VARCHAR(255) UNIQUE,
    logo_url TEXT,
    brand_color VARCHAR(50) DEFAULT '#6366f1' NOT NULL,
    status tenant_status NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexing subdomain for fast context switching middleware operations
CREATE INDEX idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX idx_tenants_custom_domain ON tenants(custom_domain) WHERE custom_domain IS NOT NULL;

CREATE TRIGGER trg_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();


-- 3.2. USERS TABLE (Identity & Credentials Context)
-- Security Context: Tenant-scoped logins. No email duplicates can exist in the same workspace.
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE, -- NULL refers to Super Admin controls in administrative pools
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'Employee',
    avatar_url TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Suspended', 'Inactive')),
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Prevent duplicate email addresses in the same tenant group
    CONSTRAINT uq_tenant_email UNIQUE (tenant_id, email)
);

CREATE INDEX idx_users_tenant_id ON users(tenant_id);

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();


-- 3.3. DOCUMENTS TABLE (Enterprise Extracted Scans & Records)
-- Security Context: Securely referenced assets with modular AI indexing capability.
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
    status processing_status NOT NULL DEFAULT 'Draft',
    ocr_text TEXT,
    ai_summary TEXT,
    metadata_json JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_documents_tenant_id ON documents(tenant_id);
CREATE INDEX idx_documents_tenant_owner ON documents(tenant_id, owner_id);
CREATE INDEX idx_documents_metadata_json ON documents USING gin (metadata_json);

CREATE TRIGGER trg_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();


-- 3.4. AUDIT LOGS TABLE (Zero-Trust Cryptographically Audit Rails)
-- Security Context: Strictly trace and record operations.
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Retain logs even if user records are scrubbed
    action VARCHAR(255) NOT NULL,
    category audit_category NOT NULL DEFAULT 'System',
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    details JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_category ON audit_logs(category);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);


-- =========================================================================
-- 4. ROW-LEVEL SECURITY policies (Absolute Tenant Boundaries)
-- =========================================================================

-- Enable RLS and force security configurations globally across database layers
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents FORCE ROW LEVEL SECURITY;

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;

-- 4.1. USERS POLICIES
CREATE POLICY tenant_isolation_select_users ON users
    FOR SELECT
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

CREATE POLICY tenant_isolation_insert_users ON users
    FOR INSERT
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

CREATE POLICY tenant_isolation_update_users ON users
    FOR UPDATE
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

CREATE POLICY tenant_isolation_delete_users ON users
    FOR DELETE
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);


-- 4.2. DOCUMENTS POLICIES
CREATE POLICY tenant_isolation_select_documents ON documents
    FOR SELECT
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

CREATE POLICY tenant_isolation_insert_documents ON documents
    FOR INSERT
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

CREATE POLICY tenant_isolation_update_documents ON documents
    FOR UPDATE
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

CREATE POLICY tenant_isolation_delete_documents ON documents
    FOR DELETE
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);


-- 4.3. AUDIT LOGS POLICIES
CREATE POLICY tenant_isolation_select_audit_logs ON audit_logs
    FOR SELECT
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

CREATE POLICY tenant_isolation_insert_audit_logs ON audit_logs
    FOR INSERT
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

CREATE POLICY tenant_isolation_update_audit_logs ON audit_logs
    FOR UPDATE
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

CREATE POLICY tenant_isolation_delete_audit_logs ON audit_logs
    FOR DELETE
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
