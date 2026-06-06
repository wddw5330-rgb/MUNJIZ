import React, { useState, useEffect } from "react";
import { 
  Building2, 
  Sparkles, 
  Files, 
  ShieldCheck, 
  Settings, 
  Plus, 
  HelpCircle, 
  Globe, 
  LogOut,
  FolderLock,
  Lock,
  Server,
  Printer,
  Flame,
  LayoutDashboard,
  Eye,
  Activity,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  Clock,
  ExternalLink,
  LockKeyhole
} from "lucide-react";
import { 
  Language, 
  Workspace, 
  WorkspaceDocument, 
  TeamMember, 
  APIToken, 
  AuditLog, 
  GitCommit, 
  PipelineStage, 
  PrintingServer, 
  PrintJob 
} from "./types";
import { ar, en } from "./translations";

// Components
import DashboardView from "./components/DashboardView";
import UploadView from "./components/UploadView";
import AIChatView from "./components/AIChatView";
import RBACView from "./components/RBACView";
import APITokensView from "./components/APITokensView";
import PrintExportView from "./components/PrintExportView";
import AdminCMSView from "./components/AdminCMSView";

export default function App() {
  // Locale State
  const [lang, setLang] = useState<Language>("ar");
  const t = lang === 'ar' ? ar : en;
  const isAr = lang === 'ar';

  // Routing Scope: 'master' means ICON CODE admin console, 'tenant' means Client Workspace
  const [routingMode, setRoutingMode] = useState<'master' | 'tenant'>('tenant');

  // Active workspace subdomain
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Multi-Tenant Workspaces State
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(true);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>("w-1");

  // Fetch tenants from backend database API on mount
  const fetchWorkspaces = async () => {
    try {
      const response = await fetch("/api/admin/tenants");
      const result = await response.json();
      if (response.ok && result.success && result.tenants) {
        // Map backend schema parameters to UI structure
        const mapped: Workspace[] = result.tenants.map((wk: any) => ({
          id: wk.id,
          name: wk.name,
          nameAr: wk.nameAr,
          subdomain: wk.subdomain,
          logoColor: wk.logoColor,
          storageUsed: wk.storageUsed || 142.5,
          storageLimit: wk.storageLimit || 500,
          subscriptionPlan: wk.subscriptionPlan || "Annual Business",
          usersCount: wk.usersCount || 8,
          apiKeysCount: wk.apiKeysCount || 0,
          status: wk.status.toLowerCase() as 'active' | 'suspended' | 'maintenance'
        }));
        setWorkspaces(mapped);
        
        // Handle active ID safety validation
        if (!mapped.some(w => w.id === activeWorkspaceId) && mapped.length > 0) {
          setActiveWorkspaceId(mapped[0].id);
        }
      }
    } catch (err) {
      console.error("Connection failed to PostgreSQL admin tenants API, fallback to client state:", err);
    } finally {
      setIsLoadingWorkspaces(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, [routingMode]);

  // Selected Active tenant
  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0] || {
    id: "w-1",
    name: "Al-Riyadah Group LLC",
    nameAr: "مجموعة الريادة القابضة",
    subdomain: "riyadah.munjiz.com",
    logoColor: "#6366f1",
    storageUsed: 142.5,
    storageLimit: 500,
    subscriptionPlan: "Annual Business",
    usersCount: 8,
    apiKeysCount: 0,
    status: "active" as const
  };

  // Documents Multi-Tenant Store State
  const [documents, setDocuments] = useState<WorkspaceDocument[]>([
    {
      id: "doc-1",
      name: "riyadah_commercial_registry.pdf",
      type: "Contract",
      workspaceId: "w-1",
      size: 412,
      status: "Completed",
      createdAt: "2026-06-05T12:00:00Z",
      ocrText: `المملكة العربية السعودية\nوزارة التجارة والاستثمار\nرقم السجل التجاري: 101039824\nتاريخ الصدور: 1445/02/10\nاسم المنشأة: شركة الريادة للتجارة والمقاولات\nالنشاط الرئيسي: تقنية المعلومات والحلول البرمجية المتكاملة\nرأس المال: 5,000,000 ريال سعودي\nالنوع: شركة ذات مسؤولية محدودة \nالشركاء: يوسف بن عبدالرحمن الدوسري (50%)، شركة التقني المتقدمة (50%).`,
      aiSummary: "السجل التجاري الرسمي لشركة الريادة برأس مال 5 ملايين ريال. نشاط المنشأة يتركز في تقنيات الحلول البرمجية وتقييم أثر الأمن السيبراني.",
      convertedText: JSON.stringify({
        registry_number: "101039824",
        issue_date: "1445/02/10",
        capital: "5,000,000 SAR",
        status: "Validated"
      }, null, 2)
    },
    {
      id: "doc-2",
      name: "vendor_invoice_2984.png",
      type: "Invoice",
      workspaceId: "w-1",
      size: 105,
      status: "Completed",
      createdAt: "2026-06-05T14:30:00Z",
      ocrText: `TAX INVOICE\nInvoice #: INV-2026-2984\nDate: 2026-05-18\nVendor: SafeNet Cyber Security\nClient: Al-Riyadah Group LLC\n=========================\nDescription | Qty | Unit Price | Total\nFirewall Suite | 1 | 8,500.00 | 8,500.00\nConsulting | 10 | 150.00 | 1,500.00\n=========================\nNet Amount: 10,000.00\nVAT (15%): 1,500.00\nTotal Amount: 11,500.00 SAR`,
      aiSummary: "فاتورة ضريبية بقيمة 11,500 ريال مقابل ترخيص Firewall Suite وتقديم خدمات استشارية أمنية من شركة SafeNet.",
      convertedText: JSON.stringify({
        invoice_number: "INV-2026-2984",
        total_taxable: 10000.0,
        vat_15: 1500.0,
        net_total: 11500.0
      }, null, 2)
    },
    {
      id: "doc-3",
      name: "school_term_plan.docx",
      type: "Report",
      workspaceId: "w-2",
      size: 89,
      status: "Completed",
      createdAt: "2026-06-04T09:00:00Z",
      ocrText: `Excellence International School\nTerm Academic Plan - Fall 2026\nGrade 10 Mathematics Outline.\n\nWeeks 1-3: Quadratic Equations & Graphing Analysis.\nWeeks 4-6: Trigonometric Identities and Functions.\nWeeks 7-9: Introduction to Limits and Calculus foundations.`,
      aiSummary: "Plan outlining mathematics coursework structure for Grade 10 Fall 2026 terms.",
      convertedText: JSON.stringify({ term: "Fall 2026", grades: ["Grade 10 math"], weeks: 9 }, null, 2)
    }
  ]);

  const [selectedDocForChat, setSelectedDocForChat] = useState<WorkspaceDocument | null>(null);

  // Teams mock data
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: "m-1",
      name: "يوسف الدوسري",
      email: "yousef@riyadah.com",
      role: "Owner",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=yousef",
      status: "Active",
      createdAt: "2026-01-10T00:00:00Z"
    },
    {
      id: "m-2",
      name: "نهال العتيبي",
      email: "nihal@riyadah.com",
      role: "Admin",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=nihal",
      status: "Active",
      createdAt: "2026-02-15T00:00:00Z"
    },
    {
      id: "m-3",
      name: "أحمد بن علي",
      email: "ahmad@riyadah.com",
      role: "Employee",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=ahmad",
      status: "Active",
      createdAt: "2026-03-20T00:00:00Z"
    }
  ]);

  // API Tokens mock data
  const [apiTokens, setApiTokens] = useState<APIToken[]>([
    {
      id: "tok-1",
      name: "SAP Cloud Bridge Portal",
      token: "mnjz_live_9a2f7edd81c3bc41a95e2fc8cfac81ea8bde71f9",
      rateLimit: 60,
      usageHits: 412,
      status: "Active",
      createdAt: "2026-03-01T08:00:00Z"
    },
    {
      id: "tok-2",
      name: "Salesforce CRM Automated Pipeline",
      token: "mnjz_live_c10bf228de1f74bf0e09fc22aefacd18055bf9ad",
      rateLimit: 120,
      usageHits: 2894,
      status: "Active",
      createdAt: "2026-04-12T11:20:00Z"
    }
  ]);

  // Audit Logs mock data
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    {
      id: "log-1",
      user: "يوسف الدوسري",
      role: "Owner",
      action: "Login",
      category: "Security",
      timestamp: "2026-06-06T00:10:00Z",
      ipAddress: "95.109.12.84",
      details: "User authenticated securely from Al-Riyadah Group LLC (riyadah.munjiz.com)"
    },
    {
      id: "log-2",
      user: "نهال العتيبي",
      role: "Admin",
      action: "Document OCR Processing",
      category: "Document",
      timestamp: "2026-06-06T00:18:22Z",
      ipAddress: "93.120.44.15",
      details: "Processed document vendor_invoice_2984.png successfully with standard Gemini AI extraction schemas"
    },
    {
      id: "log-3",
      user: "نهال العتيبي",
      role: "Admin",
      action: "API Key Created",
      category: "Security",
      timestamp: "2026-06-06T00:22:15Z",
      ipAddress: "93.120.44.15",
      details: "Authorized corporate Salesforce CRM token block in excellence-school.munjiz.com domain"
    }
  ]);

  // Printing Servers mock state
  const [printingServers, setPrintingServers] = useState<PrintingServer[]>([
    {
      id: "pr-1",
      name: "Riyadah Admin Wi-Fi Printer - Floor 3",
      type: "Wi-Fi",
      status: "Online",
      address: "192.168.1.185"
    },
    {
      id: "pr-2",
      name: "Warehouse Label Printer - Bluetooth Low Energy",
      type: "Bluetooth",
      status: "Online",
      address: "B0:5A:F3:11:80:4F"
    },
    {
      id: "pr-3",
      name: "Legacy SAP Network Parallel Node",
      type: "Network",
      status: "Offline",
      address: "10.0.4.55"
    }
  ]);

  // Printing job states
  const [printJobs, setPrintJobs] = useState<PrintJob[]>([]);

  // DevOps Git History mock states
  const [gitHistory, setGitHistory] = useState<GitCommit[]>([
    {
      id: "c-1",
      hash: "82bcad4",
      description: "Implemented Multi-Tenant Isolated S3 Buckets encryption blocks",
      author: "ICON CODE Build Agent",
      timestamp: "2026-06-05T20:10:00Z",
      versionTag: "v1.4.1",
      type: "Production Update",
      status: "Success"
    },
    {
      id: "c-2",
      hash: "df82f1b",
      description: "Added Arabic Neural OCR pre-processing model tags under Gemini Flash gateways",
      author: "ICON CODE Build Agent",
      timestamp: "2026-06-05T22:30:00Z",
      versionTag: "v1.4.2",
      type: "Code Generation",
      status: "Success"
    }
  ]);

  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([
    { name: "Unit Build", status: "success", duration: "1.2s", logs: ["Compile check: Green", "TS strip: complete"] },
    { name: "Code Lint", status: "success", duration: "0.8s", logs: ["TS validation check done"] },
    { name: "Git Release", status: "success", duration: "2.5s", logs: ["Git tags created and packed"] },
    { name: "Deploy Node", status: "success", duration: "1.9s", logs: ["Cloud Run launch: complete"] }
  ]);

  // Chat History state
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model'; text: string }[]>([]);

  // ─── STATE WORKFLOW HELPERS ───

  const handleAddDocument = (newDoc: WorkspaceDocument) => {
    setDocuments(prev => [newDoc, ...prev]);
  };

  const handleUpdateDocStatus = (id: string, updates: Partial<WorkspaceDocument>) => {
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const handleDeleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  const handleAddTeamMember = (newMember: TeamMember) => {
    setTeamMembers(prev => [...prev, newMember]);
  };

  const handleRemoveTeamMember = (id: string) => {
    setTeamMembers(prev => prev.filter(m => m.id !== id));
  };

  const handleGenerateToken = (name: string, rateLimit: number) => {
    const newToken: APIToken = {
      id: Math.random().toString(36).substring(2, 9),
      name,
      token: `mnjz_live_${Math.random().toString(16).substring(2, 22)}${Math.random().toString(16).substring(2, 22)}`,
      rateLimit,
      usageHits: 0,
      status: "Active",
      createdAt: new Date().toISOString()
    };
    setApiTokens(prev => [...prev, newToken]);
  };

  const handleDeleteToken = (id: string) => {
    setApiTokens(prev => prev.filter(k => k.id !== id));
  };

  const handleDispatchPrintJob = (newJob: PrintJob) => {
    setPrintJobs(prev => [newJob, ...prev]);

    // Simulate print queue progress step transitions
    setTimeout(() => {
      setPrintJobs(prev => prev.map(j => j.id === newJob.id ? { ...j, status: "Printing" } : j));
    }, 1800);

    setTimeout(() => {
      setPrintJobs(prev => prev.map(j => j.id === newJob.id ? { ...j, status: "Completed" } : j));
    }, 4500);
  };

  const handleUpdateWorkspaceColor = (id: string, color: string) => {
    setWorkspaces(prev => prev.map(w => w.id === id ? { ...w, logoColor: color } : w));
  };

  const handleTriggerCMSCommit = (description: string, versionTag?: string) => {
    const newCommit: GitCommit = {
      id: Math.random().toString(36).substring(2, 9),
      hash: Math.random().toString(36).substring(2, 9).slice(0, 7),
      description,
      author: "ICON CODE No-Code Visual Engine",
      timestamp: new Date().toISOString(),
      versionTag,
      type: "Visual Change",
      status: "Success"
    };

    setGitHistory(prev => [newCommit, ...prev]);

    // Simulate code pipeline execution feedback
    setPipelineStages(prev => prev.map(p => ({ ...p, status: 'running' })));
    setTimeout(() => {
      setPipelineStages(prev => prev.map(p => ({ ...p, status: 'success' })));
    }, 2800);
  };

  const handleAddAuditLog = (
    action: string, 
    details: string, 
    category: 'Document' | 'AI' | 'Workspace' | 'Security' | 'Billing' | 'System'
  ) => {
    const newLog: AuditLog = {
      id: Math.random().toString(36).substring(2, 9),
      user: teamMembers[0]?.name || "Super Admin",
      role: teamMembers[0]?.role || "Owner",
      action,
      category,
      timestamp: new Date().toISOString(),
      ipAddress: "95.109.12.84",
      details
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Switch Active Workspace Tenant
  const handleWorkspaceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setActiveWorkspaceId(val);
    const targetWk = workspaces.find(w => w.id === val);
    if (targetWk) {
      handleAddAuditLog(
        "Tenant Workspace Session Changed",
        `Switched active monitoring tenant directory context to ${targetWk.name} (${targetWk.subdomain})`,
        "Workspace"
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col font-sans transition-colors duration-250 select-none">
      
      {/* ─── DESKTOP BROWSER INTERFACE ROUTER SIMULATOR ─── */}
      <div className="bg-slate-900 border-b border-slate-800 p-2.5 px-4 flex flex-col md:flex-row items-center justify-between gap-3 text-right">
        
        {/* Address URL simulator */}
        <div className="flex items-center gap-3 w-full md:max-w-2xl bg-slate-950/80 border border-slate-800 px-3.5 py-1.5 rounded-xl">
          <LockKeyhole className="w-3.5 h-3.5 text-emerald-450 text-emerald-500 shrink-0" />
          <span className="text-slate-500 text-xs font-mono">https://</span>
          <span className="text-slate-200 text-xs font-mono grow text-left overflow-hidden truncate">
            {routingMode === 'master' ? 'master.munjiz.com/super-admin' : `${activeWorkspace.subdomain}/workspace/${activeTab}`}
          </span>
          <span className="text-[10px] uppercase font-bold text-slate-505 bg-slate-800 px-2 py-0.5 rounded text-slate-400 shrink-0 font-mono">
            {isAr ? "إنترنت آمن" : "Secure Node"}
          </span>
        </div>

        {/* Dynamic Mode Selector toggle */}
        <div className="flex items-center gap-2">
          
          <button
            onClick={() => {
              setRoutingMode('master');
              setActiveTab('cms');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-sans flex items-center gap-2 transition ${
              routingMode === 'master'
                ? 'bg-rose-600/15 text-rose-400 border border-rose-500/30 shadow'
                : 'bg-slate-800 text-slate-400 hover:text-slate-205 border border-transparent'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-rose-500" />
            <span>{isAr ? "لوحة التحكم الكلية (ICON CODE)" : "Central Super Admin Plane"}</span>
          </button>

          <button
            onClick={() => {
              setRoutingMode('tenant');
              setActiveTab('dashboard');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-sans flex items-center gap-2 transition ${
              routingMode === 'tenant'
                ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow'
                : 'bg-slate-800 text-slate-400 hover:text-slate-201 border border-transparent'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-indigo-500" />
            <span>{isAr ? "منصة الشركات التابعة" : "Client Template Node"}</span>
          </button>

        </div>

      </div>

      <div 
        className="grow flex flex-col md:flex-row text-right shrink-0 min-h-0"
        dir={isAr ? "rtl" : "ltr"}
      >
        
        {/* ─── VERTICAL SIDEBAR ─── */}
        <aside 
          className="w-full md:w-64 bg-slate-900 text-slate-100 flex flex-col border-l border-slate-800 shrink-0"
          style={{ borderLeftColor: routingMode === 'tenant' ? activeWorkspace.logoColor : "#ef4444" }}
        >
          {/* Workspace Brand and Logo */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold transition-all transform shadow-lg text-sm font-sans"
                style={{ backgroundColor: routingMode === 'tenant' ? activeWorkspace.logoColor : "#ef4444" }}
              >
                {routingMode === 'tenant' ? 'م٘' : 'إك'}
              </div>
              <div className="text-right">
                <h1 className="text-md font-bold tracking-tight font-sans">
                  {routingMode === 'tenant' ? t.appName : "منصة ICON CONTROL"}
                </h1>
                <span className="text-[10px] text-slate-400 font-mono">
                  {routingMode === 'tenant' ? activeWorkspace.subdomain : "master.munjiz.com"}
                </span>
              </div>
            </div>
          </div>

          {/* Tenant Switcher Portal (Only active in Tenant view mode) */}
          {routingMode === 'tenant' && (
            <div className="p-4 border-b border-slate-800 bg-slate-950/40 space-y-1.5 shrink-0">
              <label className="text-[10px] uppercase font-bold text-indigo-450 text-indigo-400 font-mono tracking-wider block">
                {t.chooseWorkspace}
              </label>
              <div className="relative">
                <select
                  value={activeWorkspaceId}
                  onChange={handleWorkspaceChange}
                  className="w-full text-xs p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-205 text-slate-200 outline-none cursor-pointer focus:ring-1 focus:ring-indigo-650"
                >
                  {workspaces.map((w) => (
                    <option key={w.id} value={w.id}>
                      {isAr ? w.nameAr : w.name} ({w.subdomain.split('.')[0]})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Master View scope title helper */}
          {routingMode === 'master' && (
            <div className="p-4 border-b border-slate-800 bg-red-950/10 space-y-1 block text-right shrink-0">
              <span className="text-[10px] uppercase font-bold text-rose-500 font-mono block">
                GLOBAL PLATFORM MODE
              </span>
              <p className="text-[11px] text-slate-400 font-sans">
                You are managing all distributed client clusters in this panel.
              </p>
            </div>
          )}

          {/* Navigation Tab lists based on routingMode */}
          <nav className="grow p-4 space-y-1.5 overflow-y-auto">
            {routingMode === 'tenant' ? (
              // Tenant Mode Navigation
              [
                { id: "dashboard", icon: <LayoutDashboard className="w-4 h-4" />, label: t.tabDashboard },
                { id: "upload", icon: <Files className="w-4 h-4" />, label: t.tabUpload },
                { id: "ai-chat", icon: <Sparkles className="w-4 h-4" />, label: t.tabAIChat },
                { id: "rbac", icon: <Lock className="w-4 h-4" />, label: t.tabRBAC },
                { id: "api", icon: <Server className="w-4 h-4" />, label: t.tabAPI },
                { id: "print", icon: <Printer className="w-4 h-4" />, label: t.tabPrint },
              ].map((navTab) => {
                const isActive = activeTab === navTab.id;
                return (
                  <button
                    key={navTab.id}
                    onClick={() => setActiveTab(navTab.id)}
                    disabled={activeWorkspace.status === 'suspended'}
                    className={`w-full py-2.5 px-3 rounded-xl flex items-center gap-3 text-xs font-semibold font-sans transition-all text-right disabled:opacity-45 ${
                      isActive 
                        ? 'text-white font-bold shadow' 
                        : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                    }`}
                    style={isActive ? { backgroundColor: activeWorkspace.logoColor } : undefined}
                  >
                    {navTab.icon}
                    <span>{navTab.label}</span>
                  </button>
                )
              })
            ) : (
              // Master Super Admin Navigation
              [
                { id: "cms", icon: <Flame className="w-4 h-4" />, label: "لوحة التحكم الكلية والشركات" },
              ].map((navTab) => {
                const isActive = activeTab === navTab.id;
                return (
                  <button
                    key={navTab.id}
                    onClick={() => setActiveTab(navTab.id)}
                    className={`w-full py-2.5 px-3 rounded-xl flex items-center gap-3 text-xs font-bold font-sans transition-all text-right ${
                      isActive 
                        ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/40' 
                        : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                    }`}
                  >
                    {navTab.icon}
                    <span>{navTab.label}</span>
                  </button>
                )
              })
            )}
          </nav>

          {/* Footer info & credits */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/20 text-center shrink-0">
            <span className="text-[10px] font-mono text-slate-500 uppercase block tracking-wider">
              {t.developerCredit}
            </span>
            <span className="text-[9px] text-slate-600 block mt-1">
              CLOUD NATIVE SECURE CODES
            </span>
          </div>
        </aside>

        {/* ─── MAIN CONTENT VIEWPORT ─── */}
        <main className="grow flex flex-col min-w-0" id="main-view-wrapper">
          
          {/* Top Header */}
          <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-201 border-slate-100 dark:border-slate-800 px-6 flex items-center justify-between shrink-0">
            
            {/* Active isolation scope indicator */}
            <div className="flex items-center gap-2">
              <span 
                className="block w-2.5 h-2.5 rounded-full animate-pulse" 
                style={{ backgroundColor: routingMode === 'tenant' ? activeWorkspace.logoColor : "#f43f5e" }} 
              />
              <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">
                {routingMode === 'tenant' ? (
                  <>
                    {t.tenantScope}: <strong className="text-slate-800 dark:text-slate-100">{isAr ? activeWorkspace.nameAr : activeWorkspace.name}</strong>
                  </>
                ) : (
                  <>
                    الحالة التشغيلية للنظام: <strong className="text-rose-500">مطور كلي</strong>
                  </>
                )}
              </span>
            </div>

            {/* Quick Actions Panel */}
            <div className="flex items-center gap-3">
              
              {/* Lang switcher button */}
              <button
                onClick={() => {
                  const newLang = lang === 'ar' ? 'en' : 'ar';
                  setLang(newLang);
                  handleAddAuditLog(
                    "Language Selector Triggered",
                    `Toggled primary locale viewpoint context to "${newLang.toUpperCase()}"`,
                    "Workspace"
                  );
                }}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 dark:bg-slate-850 dark:border-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all text-center"
              >
                <Globe className="w-4 h-4 text-slate-500" />
                <span>{t.languageToggle}</span>
              </button>

              {routingMode === 'tenant' && (
                <button
                  onClick={() => {
                    setRoutingMode("master");
                    setActiveTab("cms");
                  }}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all shadow"
                >
                  <Flame className="w-4 h-4" />
                  <span>{isAr ? "تحكم المطور" : "Admin Panel"}</span>
                </button>
              )}

            </div>

          </header>

          {/* Main Viewport Content scrolls */}
          <div className="p-6 grow overflow-y-auto space-y-6">
            {isLoadingWorkspaces ? (
              <div className="flex flex-col items-center justify-center p-20 space-y-3">
                <RefreshCw className="w-8 h-8 text-indigo-550 text-indigo-500 animate-spin" />
                <span className="text-sm font-sans text-slate-500">{isAr ? "جاري الاتصال بقواعد البيانات وقراءة الحاويات..." : "Loading Workspace Clusters..."}</span>
              </div>
            ) : routingMode === 'tenant' && activeWorkspace.status === 'suspended' ? (
              
              /* ─── INTERACTIVE BILLING LOCK SCREEN (Step 4 & 6 Proof of suspension functionality) ─── */
              <div className="max-w-2xl mx-auto my-12 p-8 bg-white dark:bg-slate-900 border-2 border-rose-150 border-rose-200 rounded-2xl shadow-xl border-t-8 border-t-rose-600 space-y-6 text-center">
                <div className="w-16 h-16 bg-rose-55 bg-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-600 border border-rose-350">
                  <AlertTriangle className="w-8 h-8 animate-bounce" />
                </div>
                
                <div className="space-y-2">
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white font-sans">
                    {isAr ? "مساحة العمل معطلة مؤقتاً لسداد الفواتير" : "Workspace Temporarily Suspended for Unpaid Balances"}
                  </h1>
                  <p className="text-xs text-slate-400 font-mono">
                    ID: {activeWorkspace.id} • Domain: {activeWorkspace.subdomain}
                  </p>
                </div>

                <p className="text-sm text-slate-650 text-slate-600 leading-relaxed">
                  {isAr 
                    ? `نأسف للإزعاج، تم تعليق صلاحية الوصول إلى مساحة العمل "${activeWorkspace.nameAr}" بواسطة مشرف الدفع في شركة ICON CODE لعدم استلام مبالغ الاشتراك الشهري المحددة للباقة.` 
                    : `We apologize for the inconvenience. Access to workspace "${activeWorkspace.name}" has been disabled due to outstanding billing balances. Please register payment to resume operations.`}
                </p>

                <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-xl space-y-1 bg-rose-50/20 text-right text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">{isAr ? "💡 تجربة المحاكاة التشغيلية لمطوري النظام:" : "💡 Developers simulation helper:"}</span>
                  <p className="text-[11px] text-slate-500">
                    {isAr
                      ? "بصفتك مهندس تجريبي لدى ICON CODE، يمكنك استئناف تشغيل الباقة بالنقر على خيار 'تحكم المطور' في الأعلى للوصول للوحة التحكم Super-Admin، ثم تحويل حالة الشركة المعينة من 'Suspension (Billing)' إلى 'Active'."
                      : "To resume this client instance, click 'Admin Panel' at the top, scroll to the workspace matrix, and change their billing status from 'Suspension' to 'Active.'"}
                  </p>
                </div>

                <div className="flex gap-3 justify-center pt-2">
                  <button
                    onClick={() => {
                      setRoutingMode('master');
                      setActiveTab('cms');
                    }}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition shadow"
                  >
                    {isAr ? "الدخول للوحة التحكم السحابي Super Admin" : "Access Super Admin Command Plane"}
                  </button>
                </div>
              </div>

            ) : routingMode === 'tenant' ? (
              
              /* ─── CLIENT TENANT VIEWS DISPATCHER ─── */
              <>
                {activeTab === 'dashboard' && (
                  <DashboardView
                    lang={lang}
                    workspaces={workspaces}
                    activeWorkspace={activeWorkspace}
                    documents={documents}
                    onSelectDoc={(doc) => setSelectedDocForChat(doc)}
                    onNavigateTab={(tab) => {
                      setActiveTab(tab);
                      if (tab === 'ai-chat' && documents.length > 0) {
                        const finishedDocs = documents.filter(d => d.workspaceId === activeWorkspace.id && d.status === 'Completed');
                        if (finishedDocs.length > 0) {
                          setSelectedDocForChat(finishedDocs[0]);
                        }
                      }
                    }}
                    auditLogs={auditLogs}
                  />
                )}

                {activeTab === 'upload' && (
                  <UploadView
                    lang={lang}
                    activeWorkspace={activeWorkspace}
                    documents={documents}
                    onAddDocument={handleAddDocument}
                    onUpdateDocumentStatus={handleUpdateDocStatus}
                    onDeleteDocument={handleDeleteDocument}
                    onSelectDocForChat={(doc) => {
                      setSelectedDocForChat(doc);
                      setActiveTab('ai-chat');
                    }}
                  />
                )}

                {activeTab === 'ai-chat' && (
                  <AIChatView
                    lang={lang}
                    selectedDoc={selectedDocForChat}
                    documents={documents.filter(d => d.workspaceId === activeWorkspace.id)}
                    onSelectDoc={(doc) => setSelectedDocForChat(doc)}
                    chatHistory={chatHistory}
                    onAddChatMessage={(msg) => setChatHistory(prev => [...prev, msg])}
                    onClearChatHistory={() => setChatHistory([])}
                  />
                )}

                {activeTab === 'rbac' && (
                  <RBACView
                    lang={lang}
                    activeWorkspace={activeWorkspace}
                    teamMembers={teamMembers}
                    onAddTeamMember={handleAddTeamMember}
                    onRemoveTeamMember={handleRemoveTeamMember}
                    onAddAuditLog={handleAddAuditLog}
                  />
                )}

                {activeTab === 'api' && (
                  <APITokensView
                    lang={lang}
                    apiTokens={apiTokens}
                    onGenerateToken={handleGenerateToken}
                    onDeleteToken={handleDeleteToken}
                    onAddAuditLog={handleAddAuditLog}
                  />
                )}

                {activeTab === 'print' && (
                  <PrintExportView
                    lang={lang}
                    activeWorkspace={activeWorkspace}
                    documents={documents}
                    printingServers={printingServers}
                    printJobs={printJobs}
                    onDispatchPrintJob={handleDispatchPrintJob}
                    onAddAuditLog={handleAddAuditLog}
                  />
                )}
              </>
            ) : (
              
              /* ─── MASTER SUPER ADMIN CONTROLLERS VIEW ─── */
              <AdminCMSView
                lang={lang}
                workspaces={workspaces}
                activeWorkspace={activeWorkspace}
                onUpdateWorkspaceColor={handleUpdateWorkspaceColor}
                gitHistory={gitHistory}
                pipelineStages={pipelineStages}
                onTriggerCMSCommit={handleTriggerCMSCommit}
                onAddAuditLog={handleAddAuditLog}
                onRefreshWorkspaces={fetchWorkspaces}
              />
            )}
          </div>

        </main>

      </div>

    </div>
  );
}
