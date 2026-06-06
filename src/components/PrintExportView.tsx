import React, { useState } from "react";
import { 
  Printer, 
  FileText, 
  Wifi, 
  Bluetooth, 
  Sliders, 
  Loader2, 
  CheckCircle2, 
  Send, 
  ListOrdered,
  RefreshCw,
  FolderDown,
  FileDown
} from "lucide-react";
import { Workspace, WorkspaceDocument, PrintingServer, PrintJob, Language } from "../types";
import { ar, en } from "../translations";

interface PrintExportViewProps {
  lang: Language;
  activeWorkspace: Workspace;
  documents: WorkspaceDocument[];
  printingServers: PrintingServer[];
  printJobs: PrintJob[];
  onDispatchPrintJob: (job: PrintJob) => void;
  onAddAuditLog: (action: string, details: string, category: 'Document' | 'AI' | 'Workspace' | 'Security' | 'Billing' | 'System') => void;
}

export default function PrintExportView({
  lang,
  activeWorkspace,
  documents,
  printingServers,
  printJobs,
  onDispatchPrintJob,
  onAddAuditLog,
}: PrintExportViewProps) {
  const t = lang === 'ar' ? ar : en;

  // Form parameters
  const [selectedDocId, setSelectedDocId] = useState("");
  const [selectedPrinterId, setSelectedPrinterId] = useState("");
  const [copies, setCopies] = useState(1);
  const [doubleSided, setDoubleSided] = useState(false);
  const [exportFormat, setExportFormat] = useState("PDF");

  // Get active documents
  const activeDocs = documents.filter(d => d.workspaceId === activeWorkspace.id && d.status === 'Completed');

  const handlePrintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocId || !selectedPrinterId) return;

    const doc = activeDocs.find(d => d.id === selectedDocId);
    const printer = printingServers.find(p => p.id === selectedPrinterId);

    if (!doc || !printer) return;

    const newJob: PrintJob = {
      id: Math.random().toString(36).substring(2, 9),
      documentName: doc.name,
      printerName: printer.name,
      copies,
      status: "Queued",
      timestamp: new Date().toISOString(),
    };

    onDispatchPrintJob(newJob);
    onAddAuditLog(
      "Print Job Dispatched",
      `Dispatched job for printing "${doc.name}" on printer "${printer.name}" (${copies} copies)`,
      "Document"
    );

    // Simulate standard state transition
    setTimeout(() => {
      // Simulate status changes in state flow
    }, 1500);
  };

  const handleExportSimulated = (format: string) => {
    if (!selectedDocId) return;
    const doc = activeDocs.find(d => d.id === selectedDocId);
    if (!doc) return;

    onAddAuditLog(
      "Document Exported",
      `Exported document "${doc.name}" into high-fidelity format "${format}"`,
      "Document"
    );
    alert(lang === 'ar' ? `تم ترحيل وتجهيز كود التحميل بتنسيق ${format} للجهاز بنجاح.` : `Exported and packed ${format} schema archive securely.`);
  };

  return (
    <div className="space-y-6" id="print-export-view-root">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Printer className="text-indigo-600 w-5 h-5" />
            {t.printTitle}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {t.printSubtitle}
          </p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-mono text-xs px-2.5 py-1 rounded-lg font-bold">
          LOCAL HARDWARE CONNECTIVITY: ESTABLISHED
        </div>
      </div>

      {/* Grid: Print Client Form and Queue tracking */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left column (3 Columns): Dispatch command block */}
        <div className="lg:col-span-3 p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-widest font-mono flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-500" />
            {lang === 'ar' ? 'معالجة الطباعة والتصدير' : 'Print Job Dispatch Controller'}
          </h2>

          <form onSubmit={handlePrintSubmit} className="space-y-4">
            
            {/* Choose doc */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-705 text-slate-700 dark:text-slate-300">
                {lang === 'ar' ? 'المستند المراد طباعته أو تصديره:' : 'Select Completed Target Document:'}
              </label>
              <select
                required
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-850 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none"
              >
                <option value="">-- {lang === 'ar' ? 'اختر مستند مكتمل المعالجة' : 'Select completed document'} --</option>
                {activeDocs.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} ({doc.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Choose hardware node */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-705 text-slate-700 dark:text-slate-300">
                {t.selectPrinter}
              </label>
              <select
                required
                value={selectedPrinterId}
                onChange={(e) => setSelectedPrinterId(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-850 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none"
              >
                <option value="">-- {lang === 'ar' ? 'تحديد الطابعة النشطة للشركة' : 'Select target active printer'} --</option>
                {printingServers.map((srv) => (
                  <option key={srv.id} value={srv.id} disabled={srv.status === 'Offline'}>
                    {srv.name} [{srv.type}] ({srv.status === 'Online' ? 'Online' : 'Offline'})
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity and parameters */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-705 text-slate-700 dark:text-slate-300">
                  {t.copies}
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={copies}
                  onChange={(e) => setCopies(Number(e.target.value))}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-850 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="double-sided"
                  checked={doubleSided}
                  onChange={(e) => setDoubleSided(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-505 shrink-0"
                />
                <label htmlFor="double-sided" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  {lang === 'ar' ? 'طباعة وجهين (Duplex)' : 'Double-Sided Printing'}
                </label>
              </div>
            </div>

            <div className="pt-4 flex gap-2">
              <button
                type="submit"
                disabled={!selectedDocId || !selectedPrinterId}
                className="grow py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition active:scale-95 shadow-md"
              >
                <Printer className="w-4 h-4" />
                {t.printAction}
              </button>

              <button
                type="button"
                disabled={!selectedDocId}
                onClick={() => handleExportSimulated(exportFormat)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
              >
                <FileDown className="w-4 h-4 text-indigo-650" />
                {lang === 'ar' ? 'حفظ فوري' : 'Direct Save'}
              </button>
            </div>

          </form>

          {/* Export alternatives formats section */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-850">
            <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2.5">
              {t.exportFormat}
            </h3>
            <div className="flex gap-2 flex-wrap">
              {["PDF", "DOCX", "XLSX", "CSV", "JSON", "XML", "SAP-Ready", "ERP-Schema"].map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setExportFormat(fmt)}
                  className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg border transition-colors ${
                    exportFormat === fmt
                      ? 'bg-indigo-600 border-indigo-650 text-white'
                      : 'bg-slate-50 border-slate-100 dark:bg-slate-850 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Right column (2 Columns): Servers statuses & Queue */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Printers lists */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-widest font-mono">
              {t.printerStatus}
            </h2>

            <div className="space-y-2.5">
              {printingServers.map((p) => (
                <div key={p.id} className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {p.type === 'Wi-Fi' || p.type === 'Network' ? (
                      <Wifi className="w-4 h-4 text-indigo-500" />
                    ) : (
                      <Bluetooth className="w-4 h-4 text-blue-500" />
                    )}
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-850 dark:text-slate-200">{p.name}</div>
                      <div className="text-[9px] font-mono text-slate-450">{p.address} • {p.type}</div>
                    </div>
                  </div>

                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    p.status === 'Online'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-rose-50 text-rose-700'
                  }`}>
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Printing Job Trackers */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-widest font-mono flex items-center justify-between">
              <span>{lang === 'ar' ? 'قائمة مهام الطباعة النشطة' : 'Live Print Queue Monitor'}</span>
              <span className="text-[10px] bg-indigo-650 bg-indigo-600 text-white font-bold px-2 py-0.5 rounded-full font-mono">
                {printJobs.length} Jobs
              </span>
            </h2>

            {printJobs.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">
                {lang === 'ar' ? 'سجل طابور المهام خالي حالياً.' : 'Print queue is vacant.'}
              </p>
            ) : (
              <div className="space-y-2 max-h-[180px] overflow-y-auto">
                {printJobs.map((j) => (
                  <div key={j.id} className="p-2.5 bg-slate-55 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                    <div className="min-w-0 text-right">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[130px]">{j.documentName}</div>
                      <div className="text-[10px] text-slate-450 font-mono italic">Printer: {j.printerName} • Copies: {j.copies}</div>
                    </div>

                    <div className="flex items-center gap-1.5 font-mono text-[10px] font-semibold">
                      {j.status === 'Queued' ? (
                        <span className="text-indigo-600 animate-pulse">Queued</span>
                      ) : j.status === 'Printing' ? (
                        <span className="text-blue-600 flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Printing
                        </span>
                      ) : (
                        <span className="text-emerald-600 flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          Done
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
