import React, { useState, useRef } from "react";
import { 
  FileUp, 
  Sparkles, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  FileCode, 
  Printer, 
  Check, 
  FolderPlus,
  HelpCircle,
  TrendingUp,
  Table,
  Eye,
  ChevronDown
} from "lucide-react";
import { Workspace, WorkspaceDocument, Language, DocumentType } from "../types";
import { ar, en } from "../translations";

interface UploadViewProps {
  lang: Language;
  activeWorkspace: Workspace;
  documents: WorkspaceDocument[];
  onAddDocument: (doc: WorkspaceDocument) => void;
  onUpdateDocumentStatus: (id: string, updates: Partial<WorkspaceDocument>) => void;
  onDeleteDocument: (id: string) => void;
  onSelectDocForChat: (doc: WorkspaceDocument) => void;
}

export default function UploadView({
  lang,
  activeWorkspace,
  documents,
  onAddDocument,
  onUpdateDocumentStatus,
  onDeleteDocument,
  onSelectDocForChat,
}: UploadViewProps) {
  const t = lang === 'ar' ? ar : en;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<DocumentType>('PDF');
  const [customPrompt, setCustomPrompt] = useState("");
  const [viewDetailsDoc, setViewDetailsDoc] = useState<WorkspaceDocument | null>(null);

  // Filter docs for current workspace
  const activeDocs = documents.filter(d => d.workspaceId === activeWorkspace.id);

  // File categories for selection
  const docTypes: { type: DocumentType; labelAr: string; labelEn: string }[] = [
    { type: 'PDF', labelAr: 'مستند PDF رقمي', labelEn: 'Digital PDF Document' },
    { type: 'Image', labelAr: 'صورة ممسوحة', labelEn: 'Scanned Image Capture' },
    { type: 'DOCX', labelAr: 'ملف Word رسمي', labelEn: 'Word DOCX Contract' },
    { type: 'XLSX', labelAr: 'جدول مالي Excel', labelEn: 'Excel XLSX Spreadsheet' },
    { type: 'Contract', labelAr: 'عقد اتفاقية ملزم', labelEn: 'Binding Legal Contract' },
    { type: 'Invoice', labelAr: 'فاتورة ضريبية', labelEn: 'Commercial Invoice' },
    { type: 'Report', labelAr: 'تقرير مالي أو أكاديمي', labelEn: 'Corporate Business Report' },
    { type: 'Handwritten', labelAr: 'ملاحظة مكتوبة بخط اليد', labelEn: 'Handwritten Note OCR' },
  ];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const createNewDocObject = (name: string, sizeKb: number, type: DocumentType): WorkspaceDocument => {
    return {
      id: Math.random().toString(36).substring(2, 9),
      name,
      type,
      workspaceId: activeWorkspace.id,
      size: sizeKb,
      status: 'Draft',
      createdAt: new Date().toISOString(),
    };
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files) as File[];
      files.forEach(file => {
        const sizeKb = Math.round(file.size / 1024) || 12;
        // Map common extensions
        let detectedType: DocumentType = selectedType;
        if (file.name.endsWith('.pdf')) detectedType = 'PDF';
        else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) detectedType = 'XLSX';
        else if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) detectedType = 'DOCX';
        else if (/\.(jpg|jpeg|png|gif|webp)$/i.test(file.name)) detectedType = 'Image';

        const newDoc = createNewDocObject(file.name, sizeKb, detectedType);
        onAddDocument(newDoc);
        simulateAIProcessing(newDoc);
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files) as File[];
      files.forEach(file => {
        const sizeKb = Math.round(file.size / 1024) || 15;
        let detectedType: DocumentType = selectedType;
        if (file.name.endsWith('.pdf')) detectedType = 'PDF';
        else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) detectedType = 'XLSX';
        else if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) detectedType = 'DOCX';
        else if (/\.(jpg|jpeg|png|gif|webp)$/i.test(file.name)) detectedType = 'Image';

        const newDoc = createNewDocObject(file.name, sizeKb, detectedType);
        onAddDocument(newDoc);
        simulateAIProcessing(newDoc);
      });
    }
  };

  const triggerUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Perform Gemini AI OCR and semantic analysis
  const simulateAIProcessing = async (doc: WorkspaceDocument) => {
    onUpdateDocumentStatus(doc.id, { status: 'Processing' });
    setIsProcessingId(doc.id);

    try {
      const response = await fetch("/api/ai/ocr-understanding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: doc.name,
          fileType: doc.type,
          simulationType: customPrompt || "Standard parsing with extraction"
        })
      });

      const resData = await response.json();
      if (resData.success && resData.data) {
        const payload = resData.data;
        onUpdateDocumentStatus(doc.id, {
          status: 'Completed',
          ocrText: payload.ocrText,
          convertedText: JSON.stringify(payload.tables || payload.metadataFields, null, 2),
          aiSummary: payload.aiSummary
        });
        
        // auto-set viewed document to show results beautifully
        const updatedDoc: WorkspaceDocument = {
          ...doc,
          status: 'Completed',
          ocrText: payload.ocrText,
          convertedText: JSON.stringify(payload.tables || payload.metadataFields, null, 2),
          aiSummary: payload.aiSummary
        };
        setViewDetailsDoc(updatedDoc);
      } else {
        throw new Error(resData.error || "OCR Backend response failed");
      }
    } catch (err: any) {
      console.error(err);
      onUpdateDocumentStatus(doc.id, { status: 'Failed', aiSummary: `Error: ${err.message}` });
    } finally {
      setIsProcessingId(null);
    }
  };

  return (
    <div className="space-y-6" id="upload-view-root">
      
      {/* Title */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FileUp className="text-indigo-650 w-6 h-6" />
          {t.uploadTitle}
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-4xl">
          {t.uploadSubtitle}
        </p>
      </div>

      {/* Upload Zone */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Drag/Drop Column */}
        <div className="lg:col-span-2 space-y-4">
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={triggerUploadClick}
            className={`cursor-pointer p-10 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center transition-all min-h-[220px] ${
              isDragging 
                ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20' 
                : 'border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-400'
            }`}
            id="drag-drop-zone"
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileSelect}
              multiple
            />
            <FileUp className={`w-14 h-14 ${isDragging ? 'text-indigo-500 animate-bounce' : 'text-slate-400'} mb-4`} />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {t.dragDropPrompt}
            </h3>
            <p className="text-xs text-slate-450 mt-1 max-w-sm">
              {lang === 'ar' 
                ? "يدعم صيغ JPG، PNG، PDF، DOCX، XLSX حتى 20 ميجابايت للتحليل الفوري" 
                : "Handles high-resolution JPG, PNG, multi-page PDFs, and spreadsheets up to 20MB."}
            </p>
            <div className="flex gap-2 mt-4 flex-wrap justify-center">
              <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-850 px-2 py-1 rounded text-slate-500">
                PDF
              </span>
              <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-850 px-2 py-1 rounded text-slate-500">
                XLSX
              </span>
              <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-850 px-2 py-1 rounded text-slate-500">
                DOCX
              </span>
              <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-850 px-2 py-1 rounded text-slate-500">
                PNG
              </span>
            </div>
          </div>

          {/* Quick upload pre-selectors */}
          <div className="p-4 bg-slate-55 bg-slate-50 dark:bg-slate-850 rounded-xl space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {lang === 'ar' ? 'تصنيف الملف المراد معالجته:' : 'Select Target Analysis Specification:'}
              </span>
              <span className="text-[10px] text-slate-400">
                {lang === 'ar' ? 'يمنح ميزة التعرف الدقيق' : 'Gives tailored OCR weights'}
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {docTypes.map((dt) => (
                <button
                  key={dt.type}
                  onClick={() => setSelectedType(dt.type)}
                  className={`px-3 py-2 text-xs font-medium rounded-lg text-right truncate border transition-colors ${
                    selectedType === dt.type
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-semibold">{dt.type}</div>
                  <div className={`text-[9px] ${selectedType === dt.type ? 'text-indigo-200' : 'text-slate-400'}`}>
                    {lang === 'ar' ? dt.labelAr : dt.labelEn}
                  </div>
                </button>
              ))}
            </div>

            {/* Custom Instruction Prompt */}
            <div className="space-y-1 pt-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {lang === 'ar' ? 'توجيهات إضافية للمستند (مترجم، استخراج حقول، تدقيق مالي):' : 'Add custom translation or analysis prompt instructions:'}
              </label>
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder={lang === 'ar' ? 'مثال: "ترجم الاتفاقية للعربية واستخرج أسماء الأطراف"' : 'e.g., "Translate contract into Arabic and extract primary stakeholders"'}
                className="w-full text-xs p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Right Active Workspace Files List */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col justify-between" id="upload-sidebar">
          <div>
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-mono uppercase tracking-widest text-slate-400">
                {t.uploadedFilesCount} {activeDocs.length}
              </span>
              <span className="text-[10px] text-indigo-500 font-bold bg-indigo-500/10 px-2 py-0.5 rounded">
                {activeWorkspace.subdomain}
              </span>
            </div>

            {activeDocs.length === 0 ? (
              <div className="text-center py-10">
                <FileUp className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">
                  {lang === 'ar' ? 'سجل الملفات فارغ حالياً.' : 'Your workspace uploads registry is empty.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3/2 max-h-[350px] overflow-y-auto space-y-2.5 pr-1">
                {activeDocs.map((doc) => (
                  <div 
                    key={doc.id}
                    onClick={() => {
                      if (doc.status === 'Completed') {
                        setViewDetailsDoc(doc);
                      }
                    }}
                    className={`p-3 border rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                      viewDetailsDoc?.id === doc.id
                        ? 'border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/10'
                        : 'border-slate-150 dark:border-slate-800 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-slate-50 dark:bg-slate-850 rounded text-slate-500">
                        <FileCode className="w-4 h-4 text-indigo-500" />
                      </div>
                      <div className="min-w-0 text-right">
                        <h4 className="text-xs font-semibold text-slate-800 dark:text-white truncate max-w-[130px]">
                          {doc.name}
                        </h4>
                        <div className="flex gap-1.5 items-center mt-0.5">
                          <span className="text-[10px] text-slate-400 font-mono">
                            {doc.size} KB
                          </span>
                          <span className="text-[10px] text-slate-400">•</span>
                          <span className="text-[9px] text-indigo-500 font-bold">
                            {doc.type}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {doc.status === 'Processing' ? (
                        <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                      ) : doc.status === 'Completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-500" />
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (viewDetailsDoc?.id === doc.id) {
                            setViewDetailsDoc(null);
                          }
                          onDeleteDocument(doc.id);
                        }}
                        className="p-1 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/25 rounded text-slate-400"
                        title={lang === 'ar' ? 'حذف الملف المرفق' : 'Delete uploaded node'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-850 text-center">
            <span className="text-[10px] font-mono text-slate-450">
              SECURE TLS S3 COMPATIBLE STORAGE
            </span>
          </div>
        </div>

      </div>

      {/* Document OCR & AI Analysis Results Section */}
      {viewDetailsDoc && (
        <div className="p-6 bg-slate-900 rounded-2xl shadow-xl text-white border border-slate-700/80 mt-6" id="digital-ocr-matrix">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-800">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 font-bold bg-indigo-500/10 px-2.5 py-1 rounded">
                {viewDetailsDoc.type} Matrix Analysis Results
              </span>
              <h2 className="text-lg font-bold font-sans mt-2 text-slate-100">
                {viewDetailsDoc.name}
              </h2>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => onSelectDocForChat(viewDetailsDoc)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-all shadow-md active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                {lang === 'ar' ? 'محادثة المساعد الذكي لهذا المستند' : 'Explore with AI Chat assistant'}
              </button>
              <button
                onClick={() => setViewDetailsDoc(null)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-705 text-xs text-slate-300 rounded-lg hover:bg-slate-700 transition"
              >
                {lang === 'ar' ? 'إغلاق المعاينة' : 'Close Preview'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            
            {/* Left Box: OCR text */}
            <div className="space-y-2">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-widest block">
                [Raw OCR Extraction Layout]
              </span>
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl overflow-y-auto max-h-[300px] text-sm text-slate-100 leading-relaxed scrollbar-thin">
                {viewDetailsDoc.ocrText ? (
                  <pre className="whitespace-pre-wrap font-sans text-right">
                    {viewDetailsDoc.ocrText}
                  </pre>
                ) : (
                  <p className="text-slate-400 text-center font-mono py-8">
                    {lang === 'ar' ? 'جاري قراءة المنسق الهيكلي للمستند...' : 'Generating Raw Multi-Language OCR output...'}
                  </p>
                )}
              </div>
            </div>

            {/* Right Box: AI Syntaph/Summary & Structures Table */}
            <div className="space-y-6">
              
              {/* Executive Summary */}
              <div className="space-y-2">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-widest block">
                  🛡️ [MUNJIZ executive intelligence report]
                </span>
                <div className="p-4 bg-indigo-950/20 border border-indigo-900/40 rounded-xl text-sm leading-relaxed text-indigo-200">
                  <p>
                    {viewDetailsDoc.aiSummary || (lang === 'ar' ? 'جاري صياغة التقرير التنفيذي...' : 'Formulating premium semantic report...')}
                  </p>
                </div>
              </div>

              {/* Struct/Keys Export */}
              {viewDetailsDoc.convertedText && (
                <div className="space-y-2">
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-widest block">
                    📊 [Extracted ERP Struct / Tables JSON]
                  </span>
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl max-h-[140px] overflow-y-auto">
                    <pre className="text-emerald-400 text-xs font-mono">
                      {viewDetailsDoc.convertedText}
                    </pre>
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
