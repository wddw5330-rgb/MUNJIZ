import React from "react";
import { 
  Building2, 
  Database, 
  Users, 
  ShieldCheck, 
  Clock, 
  FileText, 
  TrendingUp, 
  Server, 
  CheckCircle2, 
  AlertTriangle 
} from "lucide-react";
import { Workspace, WorkspaceDocument, AuditLog, Language } from "../types";
import { ar, en } from "../translations";

interface DashboardViewProps {
  lang: Language;
  workspaces: Workspace[];
  activeWorkspace: Workspace;
  documents: WorkspaceDocument[];
  onSelectDoc: (doc: WorkspaceDocument) => void;
  onNavigateTab: (tab: string) => void;
  auditLogs: AuditLog[];
}

export default function DashboardView({
  lang,
  workspaces,
  activeWorkspace,
  documents,
  onSelectDoc,
  onNavigateTab,
  auditLogs,
}: DashboardViewProps) {
  const t = lang === 'ar' ? ar : en;

  // Filter documents belonging to active Workspace
  const activeDocs = documents.filter(d => d.workspaceId === activeWorkspace.id);

  // Quick stats
  const totalDocsCount = activeDocs.length;
  const docsProcessingCount = activeDocs.filter(d => d.status === 'Processing').length;
  
  // Calculate storage percentage
  const storagePercentage = Math.round((activeWorkspace.storageUsed / activeWorkspace.storageLimit) * 100);

  // Filter logs for this workspace only
  const activeLogs = auditLogs.filter(log => log.details.includes(activeWorkspace.name) || log.details.includes(activeWorkspace.subdomain));

  return (
    <div className="space-y-6" id="dashboard-view-root">
      {/* Platform Branding Heading */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl shadow-xl text-white border border-slate-700/50">
        <div>
          <span className="text-xs font-mono px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30 uppercase tracking-widest">
            {t.developerCredit}
          </span>
          <h1 className="text-2xl md:text-3xl font-sans font-bold mt-2 flex items-center gap-3">
            <Building2 className="text-indigo-400 w-8 h-8" />
            {activeWorkspace[lang === 'ar' ? 'nameAr' : 'name']} 
            <span className="text-sm font-mono text-slate-400 bg-slate-900/60 px-3 py-1 rounded-lg border border-slate-800">
              {activeWorkspace.subdomain}
            </span>
          </h1>
          <p className="text-sm text-slate-300 mt-2 max-w-2xl">
            {lang === 'ar' 
              ? "موقع عمل ذكي آمن بالكامل ومعزول البيانات لتسريع أعمال المستندات وإجراء معالجة OCR الفورية والترجمة بمحرك ذكاء اصطناعي سيادي عالي الموثوقية."
              : "A fully unified, containerized corporate node designed to automate core paper pipelines, handle smart OCR parsing, and translate corporate contracts with total tenant isolated schema."}
          </p>
        </div>
        <div className="mt-4 md:mt-0 px-4 py-3 bg-indigo-600/20 border border-indigo-500/30 rounded-xl flex items-center gap-3">
          <ShieldCheck className="text-emerald-400 w-6 h-6 animate-pulse" />
          <div className="text-left">
            <div className="text-xs text-indigo-300 uppercase tracking-wider font-mono">
              SECURITY STATUS
            </div>
            <div className="text-sm font-semibold text-emerald-300 font-mono">
              ZERO-TRUST ACTIVE
            </div>
          </div>
        </div>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        
        {/* Workspace Card */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between" id="stat-card-workspace">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-slate-500 font-medium">{t.statsActiveWorkspace}</span>
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-sans text-slate-900 dark:text-white truncate">
              {activeWorkspace[lang === 'ar' ? 'nameAr' : 'name']}
            </div>
            <p className="text-xs font-mono text-slate-400 mt-1">{activeWorkspace.subdomain}</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-800 flex justify-between text-xs text-slate-400">
            <span>{t.planLabel}</span>
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">{activeWorkspace.subscriptionPlan}</span>
          </div>
        </div>

        {/* Storage Capacity Card */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between" id="stat-card-storage">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500 font-medium">{t.statsStorage}</span>
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                {activeWorkspace.storageUsed} MB
              </span>
              <span className="text-xs text-slate-400">
                {storagePercentage}% {lang === 'ar' ? 'ممتلئ' : 'filled'}
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${storagePercentage > 85 ? 'bg-rose-500' : 'bg-amber-500'}`} 
                style={{ width: `${storagePercentage}%` }}
              />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-800 flex justify-between text-xs text-slate-400">
            <span>{t.limitLabel}</span>
            <span className="font-mono text-slate-700 dark:text-slate-300">{activeWorkspace.storageLimit} MB</span>
          </div>
        </div>

        {/* Members Count Card */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between" id="stat-card-members">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-slate-500 font-medium">{t.statsUsers}</span>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold font-mono text-slate-900 dark:text-white">
              {activeWorkspace.usersCount}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {lang === 'ar' ? 'يمتلكون أدوارًا مخصصة وعزل كامل' : 'Active users assigned unique enterprise roles.'}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-800 flex justify-between text-xs text-slate-400">
            <span>{lang === 'ar' ? 'نشط الآن:' : 'Live Connected:'}</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1">
              <span className="block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              {Math.min(activeWorkspace.usersCount, 3)} {lang === 'ar' ? 'مستخدمين' : 'Users'}
            </span>
          </div>
        </div>

        {/* API Integration Card */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between" id="stat-card-api">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-slate-500 font-medium">{t.statsAPIs}</span>
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Server className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold font-mono text-slate-900 dark:text-white">
              {activeWorkspace.apiKeysCount}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {lang === 'ar' ? 'واجهات برمجية نشطة للاتصال الفوري' : 'Automated programmatic endpoint tokens.'}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-800 flex justify-between text-xs text-slate-400">
            <span>{lang === 'ar' ? 'بروتوكول الاتصال:' : 'Interface Standard:'}</span>
            <span className="font-semibold text-indigo-500 font-mono">REST JSON API</span>
          </div>
        </div>

      </div>

      {/* Main Grid: Document Tracking & Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Documents Listing */}
        <div className="lg:col-span-2 p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-sans font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="text-indigo-500 w-5 h-5" />
                  {t.recentUploads}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {lang === 'ar' ? 'المستندات والمعالجات المرفوعة مؤخراً في مساحة العزل الحالية' : 'Files scanned and processed in this tenant security boundaries.'}
                </p>
              </div>
              <button 
                onClick={() => onNavigateTab('upload')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {lang === 'ar' ? 'إدارة كافة المستندات ←' : 'Manage all documents ←'}
              </button>
            </div>

            {activeDocs.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {lang === 'ar' ? 'لا يوجد مستندات حتى الآن' : 'No documents in this workspace yet'}
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {lang === 'ar' ? 'قم بزيارة مركز التحميل لرفع المستند الفعلي ومعالجته عبر الذكاء الاصطناعي.' : 'Navigate to the Upload Center to drag in your company contracts or bills.'}
                </p>
                <button 
                  onClick={() => onNavigateTab('upload')}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  {lang === 'ar' ? 'رفع مستند الآن' : 'Upload Document Now'}
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-xs text-slate-400 font-mono">
                      <th className="pb-3 text-right">{t.fileName}</th>
                      <th className="pb-3 px-4 text-center">{t.fileType}</th>
                      <th className="pb-3 text-center">{t.fileSize}</th>
                      <th className="pb-3 text-center">{t.status}</th>
                      <th className="pb-3 text-center">{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeDocs.map((doc) => (
                      <tr 
                        key={doc.id} 
                        className="border-b border-slate-50 dark:border-slate-800 text-sm hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-3.5 font-sans font-medium text-slate-800 dark:text-slate-200 text-right shrink-0">
                          {doc.name}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-block text-xs font-mono px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded">
                            {doc.type}
                          </span>
                        </td>
                        <td className="py-3.5 text-center font-mono text-xs text-slate-500">
                          {doc.size} KB
                        </td>
                        <td className="py-3.5 text-center">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 rounded-full ${
                            doc.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' :
                            doc.status === 'Processing' ? 'bg-indigo-50 text-indigo-700 animate-pulse' :
                            'bg-rose-50 text-rose-700'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              doc.status === 'Completed' ? 'bg-emerald-500' :
                              doc.status === 'Processing' ? 'bg-indigo-500' :
                              'bg-rose-500'
                            }`} />
                            {doc.status === 'Completed' ? t.completed : doc.status === 'Processing' ? t.processing : t.failed}
                          </span>
                        </td>
                        <td className="py-3.5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => {
                                onSelectDoc(doc);
                                onNavigateTab('ai-chat');
                              }}
                              className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 rounded-md transition-colors"
                            >
                              {lang === 'ar' ? 'تحليل AI 💬' : 'Chat AI 💬'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {/* Storage Information Alert */}
          <div className="mt-5 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-lg shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                <strong className="text-slate-700 dark:text-slate-200">
                  {lang === 'ar' ? 'مزايا عزل كامل:' : 'Multi-Tenant Sandbox Protection:'}
                </strong>
                {" "}
                {lang === 'ar' 
                  ? "معالجة المستندات في مجمع حاويات معزول لا يتداخل فيه الكود أو البيانات مع الشركات الأخرى لحماية منتهى خصوصية عقودك ومستنداتك القانونية."
                  : "All document states are maintained in secure sandboxed schemas ensuring zero cross-tenant metadata exposure."}
              </p>
            </div>
            <div className="text-xs font-mono text-emerald-500 font-bold bg-emerald-500/10 px-2.5 py-1 rounded shrink-0">
              ISO 27001
            </div>
          </div>
        </div>

        {/* Right 1 Column: Activity Log Timeline */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-sans font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
              <Clock className="text-indigo-500 w-5 h-5" />
              {t.workspaceActivity}
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              {lang === 'ar' ? 'سجل غير قابل للتعديل لكافة عمليات الموظفين والمساعدين الذكيين' : 'Immutable transactional register of employee & AI activity.'}
            </p>

            <div className="space-y-4">
              {activeLogs.slice(0, 6).map((log) => (
                <div key={log.id} className="flex gap-3 text-xs leading-relaxed">
                  <div className="relative flex flex-col items-center shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 border-2 border-white dark:border-slate-900 z-10" />
                    <div className="w-0.5 grow bg-slate-100 dark:bg-slate-850 my-1" />
                  </div>
                  <div className="space-y-1 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {log.user}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400 px-1 bg-slate-50 dark:bg-slate-800 rounded">
                        {log.role}
                      </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">
                      {log.details}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-450 font-mono">
                      <span>{log.timestamp.slice(11, 19)} UTC</span>
                      <span>•</span>
                      <span className="text-indigo-400">{log.category}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-150 dark:border-slate-800 text-center">
            <span className="text-xs text-slate-450 font-mono flex items-center justify-center gap-2">
              <Server className="w-3.5 h-3.5 text-slate-400" />
              DB Node: postgresql-cluster.sfo-02
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}
