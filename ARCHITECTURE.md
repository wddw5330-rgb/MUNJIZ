# MUNJIZ (منجز) Enterprise SaaS Monorepo Architecture Blueprint
### Designed by ICON CODE Lead System Architect
### Project Structure: White-Label, Highly-Scaled Clustered App Workspace

This document defines the official production-grade, feature-based monorepo folder structure for the **MUNJIZ** platform. It utilizes a Turborepo/Yarn Workspaces style arrangement to cleanly separate the **Master Control Plane** (ICON CODE superadmin hub) from **Tenant Instances** (white-labeled client websites) while sharing core security, database, and AI systems.

---

```text
munjiz-monorepo/
├── apps/
│   ├── master/                               # Master Control Plane (ICON CODE Central Hub)
│   │   ├── src/
│   │   │   ├── app/                          # Next.js App Router Core
│   │   │   │   ├── (auth)/                   # Master Super Admin login logs
│   │   │   │   │   ├── login/
│   │   │   │   │   └── layout.tsx
│   │   │   │   ├── (dashboard)/              # Controlled Operations & Billing Dashboard
│   │   │   │   │   ├── tenants/              # Manage white-label child sites
│   │   │   │   │   │   ├── [tenantId]/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── subscriptions/        # Global tier controller
│   │   │   │   │   ├── support/              # Admin Impersonation Control Desk
│   │   │   │   │   ├── telemetry/            # System CPU/IO & DB cluster health
│   │   │   │   │   ├── layout.tsx
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── api/                      # Global administrative endpoints
│   │   │   │   │   ├── provisioning/         # Automated Docker container/DB provisioners
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── billing-webhook/      # Stripe webhook endpoints
│   │   │   │   │   └── route.ts
│   │   │   │   ├── favicon.ico
│   │   │   │   ├── globals.css
│   │   │   │   └── layout.tsx
│   │   │   ├── components/                   # Specific Components for Super Admin console
│   │   │   │   ├── TenantProvisioningForm.tsx
│   │   │   │   ├── ImpersonationTracker.tsx
│   │   │   │   └── AnalyticsMetricsGrid.tsx
│   │   │   ├── hooks/                        # Admin Specific State hooks
│   │   │   └── lib/                          # Admin integrations (Stripe, Cloud Run CLI)
│   │   ├── next.config.js
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── tenant/                               # Tenant Instances Master Template (Cloned on deploy)
│       ├── src/
│       │   ├── app/                          # Next.js App Router (RTL/LTR Translation Ready)
│       │   │   ├── (auth)/                   # Client Login/Signup & Password recovery
│       │   │   │   ├── login/
│       │   │   │   ├── signup/               # Isolated Workspace Register flow
│       │   │   │   └── layout.tsx
│       │   │   ├── (dashboard)/              # Local Client Space (riyadah.munjiz.com)
│       │   │   │   ├── documents/            # OCR Upload, view, key extraction fields
│       │   │   │   │   ├── [docId]/
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── team/                 # Local RBAC Employee Directory Management
│       │   │   │   ├── api-keys/             # Local REST API token generation panel
│       │   │   │   ├── print-server/         # Local WiFi/BT physical print job dispatcher
│       │   │   │   ├── settings/             # No-Code Branding & Color visualizer
│       │   │   │   ├── layout.tsx
│       │   │   │   └── page.tsx
│       │   │   ├── api/                      # Client scoped isolate API gateways
│       │   │   │   ├── ai/
│       │   │   │   │   ├── ocr/              # Local multi-provider AI Gateway Proxy
│       │   │   │   │   └── chat/             # Contextual document chat assistant logic
│       │   │   │   ├── document/             # Upload/Retrieve local docs
│       │   │   │   └── integrations/         # ERP/SAP Webhook bindings
│       │   │   ├── globals.css
│       │   │   └── layout.tsx
│       │   ├── components/                   # Scoped Component Architecture
│       │   │   ├── DocumentDropzone.tsx
│       │   │   ├── InteractiveOcrCanvas.tsx
│       │   │   ├── VisualThemeSync.tsx       # Syncs styles with DB custom tenant theme
│       │   │   └── ArabicFirstLayout.tsx
│       │   └── hooks/
│       │       ├── useTenantTheme.ts
│       │       └── useOcrEngine.ts
│       ├── next.config.js
│       ├── package.json
│       └── tsconfig.json
│
├── packages/                                 # Common & Reusable Shared Core Packages
│   ├── ui/                                   # Shared Tailwind raw design components
│   │   ├── src/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── FormInput.tsx
│   │   │   └── Select.tsx
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── database/                             # Shared Schema and Drizzle ORM configuration
│   │   ├── src/
│   │   │   ├── db.ts                         # Connection pool initialization logic
│   │   │   └── schema.ts                     # Single centralized TS types from PostgreSQL schema
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── ai-gateway/                           # Central Multi-provider AI Gateway (Dual SDK)
│   │   ├── src/
│   │   │   ├── gateway.ts                    # Factory Dispatcher Engine
│   │   │   ├── providers/
│   │   │   │   ├── gemini.ts                 # Google GenAI SDK (@google/genai) integration
│   │   │   │   └── openai.ts                 # OpenAI SDK integration
│   │   │   └── types.ts                      # Common abstract intelligence payloads
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── shared-utils/                         # Shared Helpers, Encryption & Locales
│       ├── src/
│       │   ├── rbac.ts                       # Permission checker routines
│       │   ├── crypto.ts                     # Salt hashes, HMAC verification utilities
│       │   └── translations.ts               # Shared localization (Arabic-first & English)
│       └── package.json
│
├── infrastructure/                           # Multi-Instance Provisioning & Deployment Control
│   ├── docker/
│   │   ├── master.Dockerfile                 # Minimal NodeJS image optimized for Cloud Run
│   │   └── tenant.Dockerfile                 # Templated container for White-Label instances
│   ├── terraform/                            # Automated Cloud Run & DB Cloning automation
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── instances.tf
│   ├── github-actions/
│   │   ├── deploy-master.yml                 # Master build deployment script
│   │   └── provision-tenant-instance.yml     # Automated workflow triggered by superadmin panel
│   └── scripts/
│       ├── provision-gcp-resources.sh        # Core infra creation wrapper
│       └── migrate-databases.sh              # Auto migration runner for instances
│
├── package.json                              # Root monorepo workspace configurations
├── turbo.json                                # Build orchestration configuration
└── README.md
```

---

## Architecture Design Principles

### 1. Unified Schema with Separated Compute (Logical Isolation)
While the monorepo provides structural unification, the white-label architecture utilizes dedicated, parameterized container deployments. Local client domains routing to matching **tenant subdomains** dynamically resolve their respective metadata scope at the platform's API boundaries.

### 2. Multi-Provider AI Gateway Abstraction (`packages/ai-gateway`)
All system calls to OpenAI or Gemini are wrapped inside a shared package. This prevents vendor lock-in and isolates sensitive prompt engineering patterns. If Gemini Flash receives traffic caps, the gateway immediately implements transparent fallback routing to OpenAI models.

### 3. Comprehensive Zero-Trust Security Scaffolding
- All tenant operations **MUST** validate the requesting context via tenant scopes.
- Every write, read, and administrative task is piped through `packages/shared-utils/rbac` before triggering.
- Support-level Admin Impersonation is explicitly documented with high security bounds.

### 4. Code Reuse Without Duplication
By extracting the database tables, validation systems, UI elements, and API proxy logic into separate packages (`packages/*`), we keep the master and tenant applications lightweight. This pattern yields an extremely low memory footprint during cold container boots.
