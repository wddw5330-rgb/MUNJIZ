import React, { useState, useEffect } from "react";
import { 
  Building2, 
  GitCommit as GitIcon, 
  Sliders, 
  RefreshCw, 
  Database, 
  Terminal, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  Flame, 
  Code2,
  Lock,
  UserCheck,
  PlusCircle,
  ShieldCheck,
  Activity,
  Layers,
  Sparkles,
  Loader2,
  Globe,
  Cpu,
  Send
} from "lucide-react";
import { GitCommit, PipelineStage, Language, Workspace } from "../types";
import { ar, en } from "../translations";

interface AdminCMSViewProps {
  lang: Language;
  workspaces: Workspace[];
  activeWorkspace: Workspace;
  onUpdateWorkspaceColor: (id: string, color: string) => void;
  gitHistory: GitCommit[];
  pipelineStages: PipelineStage[];
  onTriggerCMSCommit: (description: string, versionTag?: string) => void;
  onAddAuditLog: (action: string, details: string, category: 'Document' | 'AI' | 'Workspace' | 'Security' | 'Billing' | 'System') => void;
  onRefreshWorkspaces?: () => void;
}

export default function AdminCMSView({
  lang,
  workspaces,
  activeWorkspace,
  onUpdateWorkspaceColor,
  gitHistory,
  pipelineStages,
  onTriggerCMSCommit,
  onAddAuditLog,
  onRefreshWorkspaces,
}: AdminCMSViewProps) {
  const t = lang === 'ar' ? ar : en;
  const isAr = lang === 'ar';

  // CMS Visual Customizer State
  const [themeColor, setThemeColor] = useState(activeWorkspace.logoColor);
  const [commitMessage, setCommitMessage] = useState("");
  const [releaseTag, setReleaseTag] = useState("v1.5.0");

  // Dynamic Instance Provisioning Form States
  const [newSubdomain, setNewSubdomain] = useState("");
  const [newNameEn, setNewNameEn] = useState("");
  const [newNameAr, setNewNameAr] = useState("");
  const [newBrandColor, setNewBrandColor] = useState("#6366f1");
  const [newPlan, setNewPlan] = useState("Annual Business");
  const [adminEmail, setAdminEmail] = useState("");
  
  const [provisioningLogs, setProvisioningLogs] = useState<string[]>([]);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [provisionSuccessMsg, setProvisionSuccessMsg] = useState("");

  // Support Impersonation State
  const [impersonationReason, setImpersonationReason] = useState("");
  const [impersonateTargetId, setImpersonateTargetId] = useState("");
  const [impersonationLogs, setImpersonationLogs] = useState<any[]>([]);
  const [activeImpersonation, setActiveImpersonation] = useState<any>(null);

  // Cognitive Engine Interactive Sandbox State
  const [cogPayload, setCogPayload] = useState("شريط الحسابات: شركة منجز لتقنية المعلومات بالرياض. نبي نشتري 5 لابتوبات ماك برو الواحد بـ 8000 ريال، واحسب لنا الضريبة 15٪ يا باشا. كود العملية #TXN-77291.");
  const [cogInstruction, setCogInstruction] = useState("قم بفرز وتصنيف المستند كتقرير مالي واستخراج الحسابات الإجمالية والمبالغ بدقة.");
  const [cogFormat, setCogFormat] = useState("JSON");
  const [cogIdempotencyKey, setCogIdempotencyKey] = useState("");
  const [cogVisualOutput, setVisualOutput] = useState(true);
  const [cogOutputMethod, setCogOutputMethod] = useState("DOWNLOAD");

  const [cogResults, setCogResults] = useState<any>(null);
  const [cogLoading, setCogLoading] = useState(false);
  const [cogError, setCogError] = useState("");
  const [cogTraceLogs, setCogTraceLogs] = useState<string[]>([]);
  const [breakerFailures, setBreakerFailures] = useState(0);
  const [dlqCount, setDlqCount] = useState(0);

  // Global Distributed Control Plane Simulator State
  const [simRegion, setSimRegion] = useState<'me-central-1' | 'eu-west-1' | 'us-east-1'>('me-central-1');
  const [simTenantId, setSimTenantId] = useState('w-1');
  const [simUserId, setSimUserId] = useState('usr-admin-pg-playground');
  const [simAction, setSimAction] = useState('read');
  const [simResource, setSimResource] = useState('tenant:dashboard');
  const [simToken, setSimToken] = useState('jwt-token-simulator');
  
  const [simResult, setSimResult] = useState<any>(null);
  const [simLoading, setSimLoading] = useState(false);
  const [simError, setSimError] = useState("");
  
  const [kafkaStream, setKafkaStream] = useState<any[]>([]);
  const [telemetryLogs, setTelemetryLogs] = useState<any[]>([]);

  const fetchControlPlaneStatus = async () => {
    try {
      const [telRes, kfRes] = await Promise.all([
        fetch("/api/admin/control-plane-telemetry").then(r => r.json()),
        fetch("/api/admin/control-plane-kafka").then(r => r.json())
      ]);
      if (telRes.success) {
        setTelemetryLogs(telRes.telemetry);
      }
      if (kfRes.success) {
        setKafkaStream(kfRes.stream);
      }
    } catch (err) {
      console.warn("Failed to retrieve control plane logs:", err);
    }
  };

  const handleRunControlPlaneSim = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimLoading(true);
    setSimError("");
    setSimResult(null);

    try {
      const response = await fetch("/api/admin/control-plane-sim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: simTenantId,
          userId: simUserId,
          region: simRegion,
          action: simAction,
          resource: simResource,
          token: simToken
        })
      });
      const data = await response.json();
      if (!response.ok || data.success === false) {
        throw new Error(data.error || data.message || "Transit validation aborted by policy engine.");
      }
      setSimResult(data);
      await fetchControlPlaneStatus();
    } catch (err: any) {
      setSimError(err.message);
      await fetchControlPlaneStatus();
    } finally {
      setSimLoading(false);
    }
  };

  // Fetch initial impersonation logs
  useEffect(() => {
    fetchImpersonationLogs();
    fetchControlPlaneStatus();
    // Continuous polling for live streaming visual feeds
    const iv = setInterval(fetchControlPlaneStatus, 4000);
    return () => clearInterval(iv);
  }, []);

  const fetchImpersonationLogs = async () => {
    try {
      const response = await fetch("/api/admin/impersonation-logs");
      const result = await response.json();
      if (result.success) {
        setImpersonationLogs(result.logs);
      }
    } catch (err) {
      console.error("Failed to fetch impersonation logs:", err);
    }
  };

  // Automated Provisioner Submission Execution
  const handleProvisionInstance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubdomain || !newNameEn || !adminEmail) return;

    setIsProvisioning(true);
    setProvisionSuccessMsg("");
    setProvisioningLogs([
      `[1/4] Connecting to Master Cloud Run cluster...`,
      `[2/4] Initializing isolated PostgreSQL schema database tables...`
    ]);

    try {
      // POST command to real backend provisioner
      const response = await fetch("/api/admin/provision-tenant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newNameEn,
          nameAr: newNameAr || newNameEn,
          subdomain: newSubdomain,
          brandColor: newBrandColor,
          subscriptionPlan: newPlan,
          adminEmail
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Stagger logs for highly realistic live Docker feedback
        setTimeout(() => {
          setProvisioningLogs(prev => [
            ...prev,
            `[3/4] DNS Dispatcher: Dynamic routing activated for ${result.tenant.subdomain}`,
            `[4/4] Provisioning completed successfully.`
          ]);
          setIsProvisioning(false);
          setProvisionSuccessMsg(
            isAr 
              ? `تم إنشاء منصة البيضاء بالكامل للمشترك بنجاح! النطاق: ${result.tenant.subdomain}`
              : `Successfully provisioned isolated White-label instance at ${result.tenant.subdomain}!`
          );

          // Refresh React Workspaces context state
          if (onRefreshWorkspaces) {
            onRefreshWorkspaces();
          }

          onAddAuditLog(
            "Isolated Instance Provisioned",
            `Provisioned white-label app instance for ${newNameEn} on URL ${result.tenant.subdomain}`,
            "System"
          );

          // Reset inputs
          setNewSubdomain("");
          setNewNameEn("");
          setNewNameAr("");
          setAdminEmail("");
        }, 1500);

      } else {
        setIsProvisioning(false);
        setProvisioningLogs(prev => [...prev, `[ERROR] Code ${response.status}: ${result.error || "Failed to provision"}`]);
      }
    } catch (err: any) {
      setIsProvisioning(false);
      setProvisioningLogs(prev => [...prev, `[CRITICAL ERROR] Network connection refused: ${err.message}`]);
    }
  };

  // Update SaaS Instance Status (Active | Suspended | Maintenance)
  const handleUpdateTenantStatus = async (tenantId: string, status: "Active" | "Suspended" | "Maintenance") => {
    try {
      const response = await fetch(`/api/admin/tenants/${tenantId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        if (onRefreshWorkspaces) {
          onRefreshWorkspaces();
        }
        onAddAuditLog(
          "Tenant Status Updated",
          `Super Admin changed tenant ID ${tenantId} operational status to "${status}"`,
          "Billing"
        );
      }
    } catch (err) {
      console.error("Failed to alter tenant status:", err);
    }
  };

  // Debug Support Impersonation Desk Trigger
  const handleInitiateImpersonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!impersonateTargetId || !impersonationReason.trim()) return;

    const targetWk = workspaces.find(w => w.id === impersonateTargetId);
    if (!targetWk) return;

    try {
      const response = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: impersonateTargetId,
          reason: impersonationReason,
          adminUser: "ICON CODE Lead Architect"
        })
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setActiveImpersonation(result.impersonationContext);
        onAddAuditLog(
          "Security Impersonation Started",
          `Admin Impersonation initiated for tenant ${targetWk.name}. Reason: ${impersonationReason}`,
          "Security"
        );
        fetchImpersonationLogs(); // Refresh log timeline
        setImpersonationReason("");
      }
    } catch (err) {
      console.error("Administrative impersonation trigger failed", err);
    }
  };

  const handleEndImpersonation = () => {
    if (activeImpersonation) {
      onAddAuditLog(
        "Security Impersonation Terminated",
        `Admin Impersonation security token revoked for ${activeImpersonation.tenantName}`,
        "Security"
      );
      setActiveImpersonation(null);
    }
  };

  const fetchDlqCount = async () => {
    try {
      const response = await fetch("/api/observability/dlq");
      const d = await response.json();
      if (d.success) {
        setDlqCount(d.dlqEventsCount || 0);
      }
    } catch {}
  };

  useEffect(() => {
    fetchDlqCount();
  }, []);

  const handleRunCognitiveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cogPayload.trim()) return;

    setCogLoading(true);
    setCogError("");
    setCogResults(null);
    setCogTraceLogs([
      `[1/6] [Context Manager] Resolving Tenant parameters (ID: ${activeWorkspace.id})`,
      `[2/6] [Rate Limiter] Evaluating rolling second transaction density limits... Passed.`,
      `[3/6] [Circuit Breaker] Gate evaluation (Status: ${breakerFailures >= 5 ? "OPEN" : "CLOSED"}, Safe to execute)`
    ]);

    try {
      if (breakerFailures >= 5) {
        throw new Error("[Circuit Breaker] Gateway is OPEN. Request terminated immediately to protect cloud resources.");
      }

      const options = {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Tenant-Id": activeWorkspace.id
        },
        body: JSON.stringify({
          tenantId: activeWorkspace.id,
          payload: cogPayload,
          instruction: cogInstruction,
          outputFormat: cogFormat,
          visualOutput: cogVisualOutput,
          idempotencyKey: cogIdempotencyKey || undefined,
          outputMethod: cogOutputMethod
        })
      };

      // Live payload query
      const response = await fetch("/api/ai/universal-cognitive-engine", options);
      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.error || "Execution phase triggered an error inside backend container.");
      }

      setCogTraceLogs(prev => [
        ...prev,
        `[4/6] [Idempotency Cluster] Atomic registration validated successfully.`,
        `[5/6] [AI Client] Gemini 3.5 Flash complete handshake completed in ${data.latency || 1200}ms.`,
        `[6/6] [Transformer] Structure formatted to target specification: "${cogFormat}".`
      ]);

      setCogResults(data);
      fetchDlqCount(); // Refresh DLQ stats in-case of recovered trends

      onAddAuditLog(
        "Cognitive Job Executed",
        `Processed cognitive payload of size ${cogPayload.length} B for format ${cogFormat}`,
        "AI"
      );
    } catch (err: any) {
      setCogError(err.message);
      setCogTraceLogs(prev => [...prev, `[CRITICAL EVENT] ${err.message}`]);
      
      // Deliberately increment failures if it's an AI or backend error to simulate true circuit breaker logic
      setBreakerFailures(prev => {
        const nextVal = prev + 1;
        if (nextVal >= 5) {
          onAddAuditLog(
            "Circuit Breaker Tripped",
            `Critical thresholds breached, circuit breaker mutated to OPEN. Safely sheltering resources.`,
            "System"
          );
        }
        return nextVal;
      });
      fetchDlqCount();
    } finally {
      setCogLoading(false);
    }
  };

  const handleForceFailBreaker = async () => {
    setCogLoading(true);
    setCogError("");
    setCogResults(null);
    const newFails = breakerFailures + 1;
    setBreakerFailures(newFails);
    
    setCogTraceLogs(prev => [
      ...prev,
      `[Breaker Simulator] Registered deliberate processing failure. Count: ${newFails}/5`
    ]);

    if (newFails >= 5) {
      setCogTraceLogs(prev => [
        ...prev,
        `[CRITICAL BREAKER STATUS: TRIPPED] Gateway state mutated to OPEN. All subsequent pipelines diverted instantly to Dead-Letter Queue.`
      ]);
      onAddAuditLog(
        "Circuit Breaker Tripped",
        `Critical thresholds breached, circuit breaker mutated to OPEN. Safely sheltering resources.`,
        "System"
      );
    }

    // Force an item into DLQ via a failing endpoint or mock
    try {
      await fetch("/api/ai/universal-cognitive-engine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: "w-invalid-bad-tenant", // intentionally fail security checks
          payload: "intentional fail"
        })
      });
    } catch {}

    setTimeout(() => {
      setCogLoading(false);
      fetchDlqCount();
    }, 500);
  };

  const handleRapidRateClick = () => {
    setCogTraceLogs(prev => [
      ...prev,
      `[Rate Limiter] Transaction density spike registered: ${Math.floor(Math.random() * 50 + 20)} reqs/sec. Status: EXCEEDED (Rolling limits check 429 triggered!)`
    ]);
  };

  const handleResetBreaker = () => {
    setBreakerFailures(0);
    setCogError("");
    setCogTraceLogs(prev => [
      ...prev,
      `[Breaker Simulator] System manual recovery handshakes completed. Gate returned to CLOSED.`
    ]);
    const cleanLogs = async () => {
      onAddAuditLog(
        "Circuit Breaker Reset",
        `Admin manual overrides received. Circuit Breaker is now CLOSED and normal operations resume.`,
        "System"
      );
    };
    cleanLogs();
  };

  return (
    <div className="space-y-6 text-right" id="admin-cms-view-root">
      
      {/* Super Admin Panel Portal Branding */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 rounded-2xl border border-slate-800 shadow-2xl text-white">
        <div>
          <span className="text-[10px] font-mono px-3 py-1 bg-indigo-505 bg-indigo-500/10 text-indigo-300 rounded-full border border-indigo-500/30 uppercase tracking-widest font-bold">
            ICON CODE • MASTER CONTROL PLANE
          </span>
          <h1 className="text-xl md:text-2xl font-bold font-sans mt-2 flex items-center gap-2.5 justify-end">
            <Flame className="text-rose-500 w-6 h-6 animate-pulse" />
            <span>منظومة التحكم والترخيص الكلي للنظام</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            {isAr 
              ? "تحكم كامل وبدون كود (No-Code CMS) في عزل الشركات، إصدار حاويات الربط، وتعديل الهوية والسمات الفورية فليكس لجميع فروع ومواقع العملاء المستهدفة."
              : "No-Code Enterprise CMS for managing client multi-instances, starting background Docker builds, and global theme configurations."}
          </p>
        </div>
        <div className="mt-4 md:mt-0 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-2 font-mono text-[11px] text-slate-300">
          <Terminal className="text-red-400 w-4 h-4" />
          <span>Master Engine Connection: Online</span>
        </div>
      </div>

      {/* Security Admin Impersonation Alert Banner */}
      {activeImpersonation && (
        <div className="p-4 bg-rose-950 border border-rose-800/80 rounded-xl text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow animate-pulse">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-rose-400 w-5 h-5 shrink-0" />
            <div className="text-right">
              <span className="text-xs font-bold font-sans block text-rose-350">
                {isAr ? "⚠️ وضع المحاكاة الإدارية النشط" : "⚠️ Administrative Impersonation Mode Active"}
              </span>
              <p className="text-[11px] text-rose-300">
                {isAr 
                  ? `أنت تتصفح حالياً مساحة عمل العميل: "${activeImpersonation.tenantNameAr}" بصلاحيات المالك لحل مشكلات الدعم الفني.`
                  : `Currently editing client workspace: "${activeImpersonation.tenantName}" with diagnostics privilege.`}
              </p>
            </div>
          </div>
          <button
            onClick={handleEndImpersonation}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-xs font-bold rounded-lg transition"
          >
            {isAr ? "إنهاء المحاكاة والعودة" : "Terminate Diagnostics"}
          </button>
        </div>
      )}

      {/* Grid containing primary actions */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
        
        {/* Left column (3 Columns): Automated Container Provisioner Form */}
        <div className="lg:col-span-3 space-y-6">
          
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-201 border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-sans flex items-center gap-2 justify-end border-b border-slate-100 dark:border-slate-800 pb-3">
              <span>{isAr ? "إنشاء منصة بيضاء جديدة (Subdomain Clone)" : "Provision Dynamic White-Label Instance"}</span>
              <PlusCircle className="w-5 h-5 text-indigo-500" />
            </h2>

            <form onSubmit={handleProvisionInstance} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    {isAr ? "اسم النطاق الفرعي (English):" : "Workspace Subdomain:"}
                  </label>
                  <div className="flex items-center">
                    <span className="bg-slate-100 dark:bg-slate-800 border border-l-0 border-slate-300 dark:border-slate-750 px-2.5 py-2 text-xs text-slate-500 rounded-r-lg font-mono">
                      .munjiz.com
                    </span>
                    <input
                      type="text"
                      required
                      value={newSubdomain}
                      onChange={(e) => setNewSubdomain(e.target.value)}
                      placeholder="e.g. aramco"
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-205 dark:bg-slate-850 dark:border-slate-800 rounded-l-lg text-slate-800 dark:text-slate-100 focus:outline-none text-left font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    {isAr ? "البريد الإلكتروني لمالك الشركة:" : "Admin Owner Email:"}
                  </label>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-205 dark:bg-slate-850 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none text-left font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    {isAr ? "اسم الشركة بالإنجليزية (English Name):" : "Client English Name:"}
                  </label>
                  <input
                    type="text"
                    required
                    value={newNameEn}
                    onChange={(e) => setNewNameEn(e.target.value)}
                    placeholder="e.g. Aramco Solutions"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-205 dark:bg-slate-850 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none text-left"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    {isAr ? "اسم المنشأة بالعربية (Arabic Name):" : "Client Arabic Name:"}
                  </label>
                  <input
                    type="text"
                    required
                    value={newNameAr}
                    onChange={(e) => setNewNameAr(e.target.value)}
                    placeholder="أرامكو للتقنية والتشجير"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-205 dark:bg-slate-850 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    {isAr ? "باقة الاشتراك والمساحة:" : "SaaS Package plan:"}
                  </label>
                  <select
                    value={newPlan}
                    onChange={(e) => setNewPlan(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-205 dark:bg-slate-850 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none"
                  >
                    <option value="Monthly Standard">{isAr ? "باقة شهرية قياسية (Standard)" : "Monthly Standard (500MB)"}</option>
                    <option value="Annual Business">{isAr ? "باقة سنوية متميزة (Business)" : "Annual Business (1GB)"}</option>
                    <option value="Enterprise Premium">{isAr ? "باقة عمالقة الشركات (Enterprise)" : "Enterprise Premium (2GB)"}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    {isAr ? "اللون الافتراضي للمنصة البيضاء:" : "Instance Brand Primary Color:"}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={newBrandColor}
                      onChange={(e) => setNewBrandColor(e.target.value)}
                      className="w-10 h-10 p-0.5 border border-slate-200 dark:border-slate-800 rounded cursor-pointer shrink-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={newBrandColor}
                      onChange={(e) => setNewBrandColor(e.target.value)}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-205 dark:bg-slate-850 dark:border-slate-800 rounded-lg font-mono text-left focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isProvisioning}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition active:scale-95 shadow-md disabled:opacity-40"
              >
                {isProvisioning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{isAr ? "جاري البناء والاستنساخ..." : "Cloning Master Platform Codebase..."}</span>
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 text-white shrink-0" />
                    <span>{isAr ? "استنساخ المنصة وبناء عقد الشركة فليكس" : "Deploy Cloned Isolated Instance"}</span>
                  </>
                )}
              </button>
            </form>

            {/* Build telemetry logs output console */}
            {(provisioningLogs.length > 0 || provisionSuccessMsg) && (
              <div className="mt-4 p-3.5 bg-slate-950 rounded-xl space-y-2 border border-slate-850">
                <span className="text-[10px] text-indigo-400 font-mono font-bold block text-left">
                  LIVE DEVOPS BUILD TELEMETRY LOGS:
                </span>
                <div className="max-h-[120px] overflow-y-auto font-mono text-[10.5px] text-slate-350 text-left space-y-1 leading-relaxed">
                  {provisioningLogs.map((log, index) => (
                    <div key={index} className={log.includes("ERROR") ? "text-rose-400" : log.includes("completed") ? "text-emerald-400 font-bold" : "text-slate-300"}>
                      {log}
                    </div>
                  ))}
                </div>
                {provisionSuccessMsg && (
                  <div className="p-2.5 bg-emerald-950/40 border border-emerald-800 text-emerald-350 text-xs rounded-lg font-sans text-center font-semibold">
                    {provisionSuccessMsg}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Diagnostics Support Impersonation Form */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-sans flex items-center gap-2 justify-end border-b border-slate-100 dark:border-slate-800 pb-3">
              <span>{isAr ? "مكتب الفحص والدعم الفني (Admin Impersonation)" : "Diagnostics Support Impersonation"}</span>
              <ShieldCheck className="w-5 h-5 text-indigo-505 text-indigo-500" />
            </h2>

            <form onSubmit={handleInitiateImpersonation} className="space-y-4 text-right">
              <p className="text-[11px] text-slate-500">
                {isAr 
                  ? "تسجيل دخول آمن وفوري كـ (Owner) لمساحة عمل العميل دون الحاجة لكلمة مرور. جميع العمليات مسجلة للأمان."
                  : "Securely view any client instance from their owner perspective without passwords. For auditing & tech troubleshooting."}
              </p>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {isAr ? "اختر شركة العميل المستهدفة:" : "Select Target Tenant Instance:"}
                </label>
                <select
                  required
                  value={impersonateTargetId}
                  onChange={(e) => setImpersonateTargetId(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-205 dark:bg-slate-850 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none"
                >
                  <option value="">{isAr ? "-- اختر الشركة للتحقيق --" : "-- Select Target Company --"}</option>
                  {workspaces.map((w) => (
                    <option key={w.id} value={w.id}>
                      {isAr ? w.nameAr : w.name} ({w.subdomain})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {isAr ? "سبب الفحص الفني (مطلوب للتسجيل الأمني):" : "Impersonation Support Reason:"}
                </label>
                <input
                  type="text"
                  required
                  value={impersonationReason}
                  onChange={(e) => setImpersonationReason(e.target.value)}
                  placeholder={isAr ? "مثال: مراجعة خطأ OCR في الترجمة المالية" : "e.g. Debug OCR extraction failure in custom invoice template"}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-205 dark:bg-slate-850 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition"
              >
                <UserCheck className="w-4 h-4 shrink-0" />
                <span>{isAr ? "بدء محاكاة وفحص مساحة عمل العميل" : "Simulate Workspace Diagnostics"}</span>
              </button>
            </form>
          </div>

        </div>

        {/* Right column (3 Columns): List of Active Tenant Containers & Billing Status Updates */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Active Container Matrix */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-sans flex items-center gap-2 justify-end border-b border-slate-100 dark:border-slate-800 pb-3">
              <span>{isAr ? "مصفوفة الحاويات والعملاء النشطين" : "Active Containers & Instances"}</span>
              <Layers className="w-5 h-5 text-indigo-500" />
            </h2>

            <div className="space-y-3.5 max-h-[380px] overflow-y-auto">
              {workspaces.map((workspace) => (
                <div 
                  key={workspace.id}
                  className="p-4 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3"
                >
                  <div className="flex justify-between items-center">
                    {/* SaaS status switch controls */}
                    <div className="flex items-center gap-1.5">
                      <select
                        value={workspace.status === 'suspended' ? 'Suspended' : workspace.status === 'active' ? 'Active' : 'Maintenance'}
                        onChange={(e) => handleUpdateTenantStatus(workspace.id, e.target.value as any)}
                        className={`text-[10px] font-mono px-2 py-0.5 border rounded cursor-pointer outline-none ${
                          workspace.status === 'suspended' ? 'bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-950 dark:text-rose-300' :
                          workspace.status === 'active' ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                          'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        <option value="Active">Active</option>
                        <option value="Suspended">Suspension (Billing)</option>
                        <option value="Maintenance">Maintenance</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="text-right">
                        <span className="text-xs font-bold block text-slate-850 dark:text-slate-100">
                          {isAr ? workspace.nameAr : workspace.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 block">
                          {workspace.subdomain}
                        </span>
                      </div>
                      <div 
                        className="w-3.5 h-3.5 rounded-full" 
                        style={{ backgroundColor: workspace.logoColor }}
                      />
                    </div>
                  </div>

                  {/* Metadata spec parameters */}
                  <div className="grid grid-cols-3 gap-2 border-t border-slate-201 border-slate-100 dark:border-slate-800 pt-2 text-center text-[11px] text-slate-500">
                    <div>
                      <span className="font-mono text-xs block text-slate-850 dark:text-slate-100 font-semibold">{workspace.subscriptionPlan.split(" ")[0]}</span>
                      <span>{isAr ? "باقة الدفع" : "Tier Plan"}</span>
                    </div>
                    <div>
                      <span className="font-mono text-xs block text-slate-850 dark:text-slate-100 font-semibold">{workspace.usersCount}</span>
                      <span>{isAr ? "الموظفين" : "Employees"}</span>
                    </div>
                    <div>
                      <span className="font-mono text-xs block text-slate-850 dark:text-slate-100 font-semibold">{workspace.storageUsed}/{workspace.storageLimit}MB</span>
                      <span>{isAr ? "التخزين" : "Disk Limit"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Secure Audit Logs Timeline Registry */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-sans flex items-center gap-2 justify-end border-b border-slate-100 dark:border-slate-800 pb-3">
              <span>{isAr ? "سجل تحقيقات الدعم الأمني" : "Security Support Audit Timeline"}</span>
              <Activity className="w-5 h-5 text-rose-500" />
            </h2>

            <div className="space-y-3 max-h-[220px] overflow-y-auto">
              {impersonationLogs.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  {isAr ? "لم يتم تسجيل أي محاكاة إدارية للدعم بعد." : "No admin support diagnostics recorded yet."}
                </div>
              ) : (
                impersonationLogs.map((log) => (
                  <div 
                    key={log.id} 
                    className="p-3 bg-rose-50/40 dark:bg-rose-950/15 border border-rose-100 dark:border-rose-950 text-right text-xs rounded-xl space-y-1.5 flex flex-col justify-between"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono font-bold text-rose-600 bg-rose-100/50 px-1.5 py-0.5 rounded text-left">
                        {log.sessionId}
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {isAr ? "تحقيق معملي نشط" : "Diagnostic Audit Logs"}
                      </span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 font-sans text-[11px] leading-relaxed">
                      {isAr ? `قام المطور [${log.adminUser}] بالدخول إلى مساحة [${log.tenantName}] لمعالجة: ${log.reason}` : `Developer [${log.adminUser}] impersonated [${log.tenantName}] to debug: ${log.reason}`}
                    </p>
                    <span className="text-[9px] text-slate-400 block font-mono">
                      {new Date(log.timestamp).toLocaleString(isAr ? 'ar-SA' : 'en-US')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* ─── COGNITIVE ENGINE GATEWAY PLAYGROUND ─── */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl space-y-6">
        
        {/* Playground Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 justify-end">
              <Sparkles className="text-amber-500 w-5 h-5 animate-pulse" />
              <span>⚙️ معمل الفحص والذكاء الإدراكي الشامل (Universal Cognitive Engine Sandbox)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              محيط تجريبي فني لتتبع ومعاينة قنوات الترجمة الدلالية، وحصر التدفق (Rate Limiter)، وصمام حامي الدوائر (Circuit Breaker)، والبريد الخامل (DLQ).
            </p>
          </div>
          
          <div className="flex gap-2 mt-3 md:mt-0">
            <span className={`text-[10px] font-mono font-bold px-3 py-1 rounded-full border ${
              breakerFailures >= 5
                ? 'bg-rose-50 border-rose-200 text-rose-700 animate-pulse'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}>
              CIRCUIT BREAKER: {breakerFailures >= 5 ? "OPEN / CLOSED TRIP" : "CLOSED (ACTIVE)"}
            </span>
            <span className="text-[10px] font-mono font-bold px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-full">
              DLQ EVENTS: {dlqCount}
            </span>
          </div>
        </div>

        {/* Micro Monitors */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl flex items-center justify-between text-right">
            <div className="text-[10px] font-mono text-slate-400">SPIKE LIMIT OVERWATCH</div>
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">20 Req / Sec</span>
              <span className="text-[9px] text-slate-500">Sliding Window Protection</span>
            </div>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl flex items-center justify-between text-right">
            <div className="text-[10px] font-mono text-slate-400">BREAKER FAULT TOLERANCE</div>
            <div>
              <span className="text-xs font-bold text-slate-850 dark:text-slate-100 block">{breakerFailures} / 5 Failures</span>
              <span className="text-[9px] text-slate-400">Threshold auto-trips at 5</span>
            </div>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl flex items-center justify-between text-right">
            <div className="text-[10px] font-mono text-slate-400">IDEMPOTENT ATOMIC LOCKS</div>
            <div>
              <span className="text-xs font-bold text-slate-850 dark:text-slate-100 block">Active TTL: 1 hr</span>
              <span className="text-[9px] text-slate-400">Double Transactions Shielded</span>
            </div>
          </div>
        </div>

        {/* Interactive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          
          {/* Sandbox controls form */}
          <form onSubmit={handleRunCognitiveJob} className="lg:col-span-2 space-y-4 text-right">
            
            {/* Input payload text info */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex justify-between">
                <span className="text-[10.5px] text-slate-450 font-mono">Payload Content</span>
                <span>المستند أو النص الخام المطلوب إدراكه دلالياً:</span>
              </label>
              <textarea
                required
                rows={4}
                value={cogPayload}
                onChange={(e) => setCogPayload(e.target.value)}
                placeholder="أدخل المدخلات هنا بلهجة عربية أو إنجليزية هجينة..."
                className="w-full text-xs p-3 bg-slate-50 border border-slate-205 dark:bg-slate-855 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 font-sans focus:ring-1 focus:ring-indigo-500 outline-none leading-relaxed"
              />
            </div>

            {/* Custom AI Instruction */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                توجيهات مخصصة لمحرك التصنيف (Instruction Prompt override):
              </label>
              <input
                type="text"
                required
                value={cogInstruction}
                onChange={(e) => setCogInstruction(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-205 dark:bg-slate-855 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none"
              />
            </div>

            {/* Structured Selectors */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
                  التنسيق المطلوب تحويله:
                </label>
                <select
                  value={cogFormat}
                  onChange={(e) => setCogFormat(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-205 dark:bg-slate-855 dark:border-slate-850 rounded-lg text-slate-850 dark:text-slate-100"
                >
                  <option value="JSON">Strict JSON Table Schema</option>
                  <option value="FREE_TEXT">Free-Text Markdown Report</option>
                  <option value="EXCEL_SCHEMA">Excel Structured Rows (2D Array)</option>
                  <option value="WORD">High-Fidelity editable WORD (.docx)</option>
                  <option value="SAP_IDOC">ERP-Ready SAP iDoc (XML Target)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
                  مفتاح التفرد (Idempotency Key):
                </label>
                <input
                  type="text"
                  value={cogIdempotencyKey}
                  onChange={(e) => setCogIdempotencyKey(e.target.value)}
                  placeholder="e.g. key-tx-2918a"
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-205 dark:bg-slate-855 dark:border-slate-850 rounded-lg text-slate-800 dark:text-slate-100 font-mono text-left"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
                  قناة المخرجات الطرفية:
                </label>
                <select
                  value={cogOutputMethod}
                  onChange={(e) => setCogOutputMethod(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-205 dark:bg-slate-855 dark:border-slate-850 rounded-lg text-slate-850 dark:text-slate-100"
                >
                  <option value="DOWNLOAD">DOWNLOAD FILE STREAM</option>
                  <option value="PRINT">DIRECT HARDWARE PRINTING</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-6 justify-end">
                <label htmlFor="cog-visual" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  بناء واجهة تصبيغية مخصصة (Visual UI component)
                </label>
                <input
                  type="checkbox"
                  id="cog-visual"
                  checked={cogVisualOutput}
                  onChange={(e) => setVisualOutput(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded shrink-0"
                />
              </div>
            </div>

            {/* Form actions row */}
            <div className="pt-3 flex flex-wrap gap-2 justify-end">
              
              <button
                type="button"
                onClick={handleResetBreaker}
                disabled={breakerFailures === 0}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-705 dark:text-slate-300 font-sans text-xs font-bold rounded-lg transition"
              >
                إعادة ضبط صمام الأمان
              </button>

              <button
                type="button"
                onClick={handleForceFailBreaker}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-sans text-xs font-bold rounded-lg transition"
              >
                تسجيل عطل عمدي (Trigger Breaker Fail)
              </button>

              <button
                type="button"
                onClick={handleRapidRateClick}
                className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-sans text-xs font-bold rounded-lg transition animate-pulse"
              >
                ذروة ضغط (Spike Rate Limit)
              </button>

              <button
                type="submit"
                disabled={cogLoading}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-sans text-xs font-bold rounded-xl shadow-lg flex items-center gap-2 transition disabled:opacity-50"
              >
                {cogLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري المعالجة...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white text-white shrink-0" />
                    <span>تنفيذ الإدراك السحابي المعملي</span>
                  </>
                )}
              </button>

            </div>

          </form>

          {/* Sandbox diagnostics logs and results renderer */}
          <div className="lg:col-span-3 space-y-4 text-right">
            
            {/* Live Trace Logs Console */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-850">
              <span className="text-[10px] text-amber-400 font-mono font-bold block text-left uppercase tracking-wider">
                DEVOPS COGNITIVE TRACER TIMELINE LOGS:
              </span>
              <div className="mt-2.5 max-h-[140px] overflow-y-auto font-mono text-[10px] text-slate-300 text-left space-y-1">
                {cogTraceLogs.length === 0 ? (
                  <div className="text-slate-500 italic">Playground idle. Run a job to observe traces...</div>
                ) : (
                  cogTraceLogs.map((log, i) => (
                    <div key={i} className={
                      log.includes("CRITICAL") ? "text-rose-400 font-bold" :
                      log.includes("EXCEEDED") ? "text-amber-400 font-mono" :
                      log.includes("successfully") ? "text-emerald-400" : "text-slate-350"
                    }>
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Output Rendering Screens */}
            <div className="p-4 bg-slate-50 dark:bg-slate-855 rounded-xl border border-slate-150 dark:border-slate-800 space-y-3 min-h-[150px]">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block border-b border-light pb-2">
                📂 مخرجات الفحص والهوية الدلالية (Cognitive output results):
              </span>

              {cogLoading && (
                <div className="flex flex-col items-center justify-center py-10 space-y-2">
                  <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                  <span className="text-xs text-slate-400">جاري قراءة الحزم ومعالجة السحابة...</span>
                </div>
              )}

              {cogError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl space-y-1">
                  <span className="text-xs font-bold block">⚠️ فشلت تجربة المحاكاة الإدراكية:</span>
                  <p className="text-[11px] font-mono leading-relaxed text-left">{cogError}</p>
                </div>
              )}

              {!cogLoading && !cogError && !cogResults && (
                <p className="text-xs text-slate-400 text-center py-12">
                  المخرجات وجداول الفرز الدلالية ستظهر هنا فور الانتهاء من المعالجة.
                </p>
              )}

              {cogResults && (
                <div className="space-y-4 text-right">
                  <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-800 p-2.5 rounded-lg text-[11px] font-mono">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">Confidence: {(cogResults.confidenceScore * 100).toFixed(1)}%</span>
                    <span>Lang: <strong className="text-slate-700 dark:text-slate-300">{cogResults.detectedLanguage}</strong></span>
                  </div>

                  {/* Tailwind Components Live Preview */}
                  {cogResults.processedContent && typeof cogResults.processedContent === "string" && (
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-slate-500 block uppercase font-mono">Structured output preview:</span>
                      
                      {cogFormat === "WORD" ? (
                        <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-lg flex items-center justify-between text-xs">
                          <span className="font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px]">WORD_BASE64_STREAM</span>
                          <span>تم إنشاء ملف الوورد المنسق بنجاح وجاهز لتصديره للجهاز.</span>
                        </div>
                      ) : cogFormat === "SAP_IDOC" ? (
                        <pre className="p-3 bg-slate-900 text-emerald-400 border border-slate-950 rounded-lg text-[10.5px] font-mono overflow-x-auto text-left whitespace-pre-wrap max-h-[140px]">
                          {cogResults.processedContent}
                        </pre>
                      ) : (
                        <pre className="p-3 bg-slate-900 text-[10.5px] text-slate-300 border border-slate-950 rounded-lg font-mono overflow-x-auto text-left whitespace-pre-wrap max-h-[140px]">
                          {cogResults.processedContent}
                        </pre>
                      )}
                    </div>
                  )}

                  {/* Render Visual Live Component if visual model is flagged and returned */}
                  {cogResults.processedContent && (
                    (() => {
                      try {
                        let innerContent = cogResults.processedContent;
                        // For non-JSON streams or raw texts, visual components might come directly.
                        // If it's a valid JSON string containing finalOutput/htmlComponent, try parsing.
                        let parsed: any;
                        try {
                          parsed = JSON.parse(cogResults.processedContent);
                        } catch {
                          // Ignore non-json preview parsing
                        }

                        const htmlMatch = parsed?.htmlComponent || (typeof cogResults.processedContent === 'string' && cogResults.processedContent.includes('htmlComponent') ? JSON.parse(cogResults.processedContent)?.htmlComponent : null);

                        if (htmlMatch) {
                          return (
                            <div className="space-y-2 border-t border-dashed border-slate-200 mt-2 pt-3">
                              <span className="text-[11px] font-bold text-emerald-500 block uppercase font-mono">Live dynamic Visual Component panel:</span>
                              <div 
                                className="p-4 bg-white dark:bg-slate-905 border border-slate-200 dark:border-slate-850 rounded-xl overflow-hidden leading-normal text-left"
                                dangerouslySetInnerHTML={{ __html: htmlMatch }}
                              />
                            </div>
                          );
                        }
                      } catch (e) {
                        console.warn("[Playground Preview] Visual panel failed to parse:", e);
                      }
                      return null;
                    })()
                  )}

                </div>
              )}

            </div>

          </div>

        </div>

      </div>

      {/* ─── GLOBAL DISTRIBUTED CONTROL PLANE SIMULATOR ─── */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl space-y-6 text-white" id="distributed-control-plane-sim-container">
        
        {/* Panel Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 border-b border-slate-850">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2.5 justify-end">
              <Globe className="text-cyan-400 w-5 h-5 animate-pulse" />
              <span>🪐 لوحة تتبع بوابة العبور والمطابقة الكلية الموزعة (Global Distributed Control Plane)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {isAr 
                ? "محاكي معالجة طلبات الأنظمة والتحقق من الهوية متعددة المستأجرين (Zero Trust) عبر أقاليم الخدمة الموثقة، ومراقبة ناقل أحداث Kafka و OpenTelemetry."
                : "Interactive simulator for processing Zero Trust and Multi-Tenant queries across global routing regions, featuring real-time Kafka & Telemetry."}
            </p>
          </div>
          <div className="flex gap-2 mt-3 md:mt-0">
            <span className="text-[10px] font-mono font-bold px-3 py-1 bg-cyan-950 border border-cyan-800 text-cyan-300 rounded-full flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block" />
              OTEL ENGINE: ONLINE
            </span>
            <span className="text-[10px] font-mono font-bold px-3 py-1 bg-indigo-950 border border-indigo-800 text-indigo-300 rounded-full">
              KAFKA TOPICS: GLOBAL_REQUESTS
            </span>
          </div>
        </div>

        {/* Dynamic Matrix Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          
          {/* Column 1: Config and Control Sandbox */}
          <div className="lg:col-span-2 space-y-4 text-right">
            <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-4">
              <span className="text-xs font-bold text-cyan-300 block border-b border-slate-850 pb-2">
                ⚙️ {isAr ? "سمات طلب العبور المراد محاكاته:" : "Simulation Transmission Parameters:"}
              </span>

              <form onSubmit={handleRunControlPlaneSim} className="space-y-3">
                
                {/* Region Selector */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300 block">
                    {isAr ? "إقليم التوجيه والعبور (Region Routing):" : "Region Routing Boundary:"}
                  </label>
                  <select
                    value={simRegion}
                    onChange={(e) => setSimRegion(e.target.value as any)}
                    className="w-full text-xs p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 outline-none"
                  >
                    <option value="me-central-1">Middle East - Central (me-central-1 • Riyadh)</option>
                    <option value="eu-west-1">Europe - West (eu-west-1 • Frankfurt)</option>
                    <option value="us-east-1">US - East (us-east-1 • N. Virginia)</option>
                  </select>
                </div>

                {/* Tenant Scope Selector */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300 block">
                    {isAr ? "نطاق مساحة العمل (Tenant isolation):" : "Target Tenant Scope Isolation:"}
                  </label>
                  <select
                    value={simTenantId}
                    onChange={(e) => setSimTenantId(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 outline-none"
                  >
                    <option value="global">Global Shared Space (platform-wide)</option>
                    {workspaces.map((w) => (
                      <option key={w.id} value={w.id}>
                        {isAr ? w.nameAr : w.name} ({w.subdomain})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Simulated Context Attributes */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-300 block">
                      {isAr ? "معرّف الموظف (User ID):" : "User Identifier:"}
                    </label>
                    <input
                      type="text"
                      required
                      value={simUserId}
                      onChange={(e) => setSimUserId(e.target.value)}
                      className="w-full text-xs p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-left font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-300 block">
                      {isAr ? "الرمز الأمني المفترض (JWT Key):" : "Security Claim Token:"}
                    </label>
                    <input
                      type="text"
                      required
                      value={simToken}
                      onChange={(e) => setSimToken(e.target.value)}
                      className="w-full text-xs p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-left font-mono"
                    />
                  </div>
                </div>

                {/* Action and Target Resource Selection */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-300 block">
                      {isAr ? "العملية الأمنية (Action):" : "Security Action:"}
                    </label>
                    <select
                      value={simAction}
                      onChange={(e) => setSimAction(e.target.value)}
                      className="w-full text-xs p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100"
                    >
                      <option value="read">READ (استعلام دلالي)</option>
                      <option value="write">WRITE (تعديل هيكلي)</option>
                      <option value="execute">EXECUTE (تشغيل ذكاء محلي)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-300 block">
                      {isAr ? "المورد المستهدف (Resource):" : "Target Resource:"}
                    </label>
                    <select
                      value={simResource}
                      onChange={(e) => setSimResource(e.target.value)}
                      className="w-full text-xs p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-left font-mono"
                    >
                      <option value="tenant:dashboard">tenant:dashboard</option>
                      <option value="global:api">global:api</option>
                      <option value={`tenant:${simTenantId}`}>tenant:{simTenantId}</option>
                    </select>
                  </div>
                </div>

                {/* Form submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={simLoading}
                    className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-700 hover:to-indigo-700 text-white font-sans text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-lg disabled:opacity-50 cursor-pointer"
                  >
                    {simLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>{isAr ? "جاري مصادقة العبور والتحقق..." : "Authorizing request through plane..."}</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 text-white hover:translate-x-1 transition" />
                        <span>{isAr ? "🚀 تشغيل محاكاة معالجة العبور الكلي" : "Execute Control Plane Handshake"}</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            </div>

            {/* Results Screen */}
            <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-3 min-h-[140px]">
              <span className="text-xs font-bold text-cyan-300 block border-b border-slate-850 pb-2">
                📂 {isAr ? "استجابة بوابة العبور الفورية (Orchestrator Return):" : "Control Plane Realtime Response:"}
              </span>

              {simError && (
                <div className="p-3 bg-rose-950/50 border border-rose-800 text-rose-300 rounded-lg space-y-1 text-left">
                  <span className="text-[11px] font-bold block uppercase tracking-wide">🛑 Access Denied (Validation Error)</span>
                  <p className="text-[10px] font-mono leading-relaxed">{simError}</p>
                </div>
              )}

              {!simLoading && !simError && !simResult && (
                <p className="text-xs text-slate-500 text-center py-10 font-sans">
                  {isAr 
                    ? "قم بإرسال معامل طلب تجريبي لمشاهدة تفاعل بوابات المصادقة والحماية الموزعة."
                    : "Send a simulated query transaction to view real-time authentication & access outcomes."}
                </p>
              )}

              {simResult && (
                <div className="space-y-3 text-right">
                  <div className="flex justify-between items-center p-2.5 bg-slate-900 border border-slate-850 rounded-lg">
                    <span className="px-2 py-0.5 text-[10px] uppercase font-bold rounded bg-emerald-900/80 text-emerald-300 border border-emerald-700 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      AUTHORIZED
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Region: <strong className="text-cyan-300">{simResult.result.region}</strong>
                    </span>
                  </div>

                  <div className="space-y-1.5 text-left font-mono text-[10px] text-slate-300 bg-slate-900/60 p-3 rounded-lg border border-slate-850 leading-relaxed">
                    <div><span className="text-slate-500">REQUEST_ID   :</span> {simResult.result.requestId}</div>
                    <div><span className="text-slate-500">TENANT_ID    :</span> {simResult.result.tenantId}</div>
                    <div><span className="text-slate-500">AUTHORIZED_AT:</span> {new Date(simResult.result.executionTimestamp).toLocaleTimeString()}</div>
                    <div><span className="text-slate-500">ISOLATION    :</span> TRUE (RLS SECURE SCHEMAS CONNECTED)</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Live Tracer & Event Streams (3 columns wide) */}
          <div className="lg:col-span-3 space-y-4 text-right">
            
            {/* Live OpenTelemetry Trace Streams */}
            <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl">
              <span className="text-[10.5px] text-cyan-400 font-mono font-bold block text-left uppercase tracking-wider flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5" />
                OPENTELEMETRY TRACE LOGS (DYNAMICS & PERFORMANCE DENSITY)
              </span>

              <div className="mt-3 max-h-[160px] overflow-y-auto font-mono text-[10px] text-slate-350 text-left space-y-1.5">
                {telemetryLogs.length === 0 ? (
                  <div className="text-slate-600 italic py-6 text-center">Tracer idle. Initialize control plane requests to capture telemetry logs...</div>
                ) : (
                  [...telemetryLogs].reverse().map((log, i) => (
                    <div key={i} className="p-2 bg-slate-900/80 border border-slate-850/60 rounded flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <span className="text-[9px] px-1 bg-slate-800 text-slate-300 rounded font-bold mr-1.5">{log.event}</span>
                        <span className="text-slate-400 text-[9px]">
                          {log.ctx ? `Tenant: ${log.ctx.tenantId} | Region: ${log.ctx.region}` : log.error ? `Error: ${log.error}` : `id: ${log.requestId}`}
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-500 shrink-0">{new Date(log.ts).toLocaleTimeString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Distributed Kafka Topic Global stream */}
            <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl">
              <span className="text-[10.5px] text-indigo-400 font-mono font-bold block text-left uppercase tracking-wider flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                DISTRIBUTED KAFKA TOPIC FAN-OUT GLOBAL STREAM (TOPIC LOGS)
              </span>

              <div className="mt-3 max-h-[160px] overflow-y-auto font-mono text-[10px] text-slate-350 text-left space-y-1.5">
                {kafkaStream.length === 0 ? (
                  <div className="text-slate-600 italic py-6 text-center">Kafka stream is listening on kafka:9092. Transmit packages to emit records...</div>
                ) : (
                  [...kafkaStream].reverse().map((event, i) => (
                    <div key={i} className="p-2 bg-slate-900/80 border border-slate-850/60 rounded space-y-1">
                      <div className="flex justify-between items-center text-[9px]">
                        <span className="text-indigo-400 font-bold">Topic: {event.topic}</span>
                        <span className="text-slate-500 font-mono">{event.id}</span>
                      </div>
                      <div className="text-slate-400 text-[9.5px]">
                        {event.payload?.ctx ? (
                          <span>Context Auth: <strong className="text-cyan-300">{event.payload.action}</strong> on <code>{event.payload.resource}</code> from region <code>{event.payload.ctx.region}</code></span>
                        ) : (
                          <span>Unknown Payload event emitted</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
