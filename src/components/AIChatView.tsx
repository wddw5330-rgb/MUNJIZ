import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  FileText, 
  Loader2, 
  Play, 
  Check, 
  ArrowRight, 
  HelpCircle,
  Database,
  ArrowRightLeft
} from "lucide-react";
import { WorkspaceDocument, Language } from "../types";
import { ar, en } from "../translations";

interface AIChatViewProps {
  lang: Language;
  selectedDoc: WorkspaceDocument | null;
  documents: WorkspaceDocument[];
  onSelectDoc: (doc: WorkspaceDocument | null) => void;
  chatHistory: { role: 'user' | 'model'; text: string }[];
  onAddChatMessage: (msg: { role: 'user' | 'model'; text: string }) => void;
  onClearChatHistory: () => void;
}

export default function AIChatView({
  lang,
  selectedDoc,
  documents,
  onSelectDoc,
  chatHistory,
  onAddChatMessage,
  onClearChatHistory,
}: AIChatViewProps) {
  const t = lang === 'ar' ? ar : en;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, loading]);

  const handleSend = async (textToSend?: string) => {
    const messageText = textToSend || input;
    if (!messageText.trim() || loading) return;

    if (!textToSend) {
      setInput("");
    }

    // Add user message to history
    onAddChatMessage({ role: "user", text: messageText });
    setLoading(true);

    try {
      // Build context of selected document if any
      let documentContext = "";
      if (selectedDoc) {
        documentContext = `Document Name: ${selectedDoc.name}
Type: ${selectedDoc.type}
Size: ${selectedDoc.size} KB
OCR Text Extracted:
${selectedDoc.ocrText || "(No OCR text was extracted)"}
Executive Summary:
${selectedDoc.aiSummary || "(No AI summary created)"}`;
      }

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText,
          history: chatHistory,
          documentContext
        })
      });

      const data = await response.json();
      if (data.success && data.text) {
        onAddChatMessage({ role: "model", text: data.text });
      } else {
        throw new Error(data.error || "Failed to generate AI response");
      }
    } catch (err: any) {
      console.error(err);
      onAddChatMessage({ 
        role: "model", 
        text: `⚠️ Error: Could not reach MUNJIZ AI gateway. ${err.message}` 
      });
    } finally {
      setLoading(false);
    }
  };

  const executeSuggestPrompt = (prompt: string) => {
    handleSend(prompt);
  };

  return (
    <div className="space-y-6 h-[calc(100vh-190px)] flex flex-col justify-between" id="ai-chat-view-root">
      
      {/* Top Bar Description */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm h-auto shrink-0">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="text-indigo-600 w-5 h-5" />
            {t.aiChatTitle}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {t.aiChatSubtitle}
          </p>
        </div>
        <div className="mt-2 md:mt-0 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-mono rounded-lg font-bold">
          {t.geminiActive}
        </div>
      </div>

      {/* Main Split Screen container to maintain focus */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 grow overflow-hidden h-[75%] md:h-[80%] min-h-0">
        
        {/* Left Column (1 of 4): Document Context Selector */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col justify-between h-full overflow-hidden">
          <div className="space-y-4 h-full flex flex-col overflow-hidden min-h-0">
            <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold">
              {lang === 'ar' ? 'تركيز المستند الحالي' : 'Active Document Target'}
            </h3>

            {/* Selector listing simple finished docs */}
            <div className="space-y-2 pr-1 overflow-y-auto max-h-[160px] md:max-h-none grow">
              <button
                onClick={() => onSelectDoc(null)}
                className={`w-full p-2.5 rounded-xl text-right text-xs transition-all border flex items-center justify-between ${
                  !selectedDoc 
                    ? 'border-indigo-600 bg-indigo-50/20 text-indigo-700 dark:bg-indigo-950/10 dark:text-indigo-300 font-bold' 
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                }`}
              >
                <span>💬 {lang === 'ar' ? 'نقاش مساعد عام (بدون مستند)' : 'General Assistant Chat'}</span>
                {!selectedDoc && <Check className="w-4 h-4 text-indigo-600" />}
              </button>

              {documents.filter(d => d.status === 'Completed').map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => onSelectDoc(doc)}
                  className={`w-full p-2.5 rounded-xl text-right text-xs transition-all border flex items-center justify-between min-w-0 ${
                    selectedDoc?.id === doc.id
                      ? 'border-indigo-600 bg-indigo-50/20 text-indigo-700 dark:bg-indigo-950/10 dark:text-indigo-300 font-bold'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <span className="truncate max-w-[130px] font-sans">📄 {doc.name}</span>
                  {selectedDoc?.id === doc.id && <Check className="w-4 h-4 text-indigo-650" />}
                </button>
              ))}
            </div>

            {/* Info pane */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-100 dark:border-slate-800 text-xs shrink-0">
              {selectedDoc ? (
                <div className="space-y-2 text-right">
                  <div className="flex justify-between items-center text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-bold">
                    <span>{selectedDoc.type}</span>
                    <span>{selectedDoc.size} KB</span>
                  </div>
                  <h4 className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                    {selectedDoc.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed truncate-3-lines">
                    {selectedDoc.aiSummary || (lang === 'ar' ? 'لم تتوفر خلاصة ذكية.' : 'No executive digest available.')}
                  </p>
                </div>
              ) : (
                <div className="text-center py-4 text-slate-500 text-[11px] leading-relaxed">
                  <Bot className="w-8 h-8 text-indigo-500/50 mx-auto mb-2" />
                  {t.noDocLoaded}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 3 Columns: Chat playground */}
        <div className="lg:col-span-3 p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col justify-between h-full overflow-hidden min-h-0">
          
          {/* Chat message timeline scrolls */}
          <div className="grow overflow-y-auto space-y-4 pr-2 scrollbar-thin pl-1 h-full max-h-[400px]">
            
            {/* Standard Welcome System prompt */}
            <div className="flex gap-3 text-xs md:text-sm leading-relaxed max-w-[85%] text-slate-800">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-850 border border-slate-150 dark:border-slate-800 rounded-2xl text-right">
                <p className="font-semibold text-indigo-600 dark:text-indigo-400 mb-1 font-sans">
                  {lang === 'ar' ? 'مساعد مُنجِز الذكي لمستندات السحابة' : 'MUNJIZ Intelligent Document Pilot'}
                </p>
                <p>
                  {lang === 'ar' 
                    ? "أهلاً بك في منصة مُنجِز سيادية الذكاء لترجمة المستندات واستقرائها. لقد قمت بتحميل الذكاء الاصطناعي الأحدث Google Gemini 3.5. يمكنك الاستفسار عن محتويات جداول إكسل، عقد العمل، أو صياغة البنود التنظيمية."
                    : "Welcome to MUNJIZ Cloud AI Sandbox. Ask anything to analyze your uploaded contracts, search accounting spreadsheets, generate formal PDFs, or map corporate workflows."}
                </p>
              </div>
            </div>

            {/* Chat message items mapping */}
            {chatHistory.map((msg, index) => (
              <div 
                key={index} 
                className={`flex gap-3 text-xs md:text-sm leading-relaxed max-w-[85%] ${
                  msg.role === 'user' ? 'mr-auto self-end flex-row-reverse' : 'self-start'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'user' 
                    ? 'bg-slate-800 text-white' 
                    : 'bg-indigo-600 text-white'
                }`}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                
                <div className={`p-3.5 rounded-2xl text-right border ${
                  msg.role === 'user'
                    ? 'bg-slate-105 bg-slate-100 dark:bg-slate-800 border-slate-200'
                    : 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100/50 dark:border-indigo-950/50'
                }`}>
                  <p className="whitespace-pre-wrap leading-relaxed text-slate-800 dark:text-slate-100">
                    {msg.text}
                  </p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 text-sm leading-relaxed self-start">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
                <div className="p-3.5 bg-indigo-50/30 dark:bg-indigo-950/10 border border-indigo-100/20 rounded-2xl">
                  <span className="text-xs text-indigo-500 animate-pulse font-mono">
                    MUNJIZ Engine is compiling semantic analysis...
                  </span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions shortcuts */}
          <div className="py-2 shrink-0">
            <div className="flex gap-1.5 flex-wrap justify-end">
              <button 
                onClick={() => executeSuggestPrompt(lang === 'ar' ? 'صغ لي عقد عمل مهندس برمجيات رسمي باللغة العربية والانجليزية ويشمل فترات التجربة' : 'Draft software engineer employment contract')}
                className="px-2.5 py-1 text-[11px] bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:text-slate-350 dark:hover:bg-slate-800 text-slate-600 rounded-lg hover:text-indigo-600 transition truncate text-right border border-slate-200 dark:border-slate-800"
              >
                ✨ {t.suggestPrompt1}
              </button>
              <button 
                onClick={() => executeSuggestPrompt(lang === 'ar' ? 'قم بعمل تحليل مالي للفوتير المرفقة واستخلص الجدول الضريبي بمعدلات القيمة المضافة' : 'Audit transactions VAT and yield tabular structure')}
                className="px-2.5 py-1 text-[11px] bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:text-slate-350 dark:hover:bg-slate-800 text-slate-600 rounded-lg hover:text-indigo-600 transition truncate text-right border border-slate-200 dark:border-slate-800"
              >
                📊 {t.suggestPrompt2}
              </button>
              <button 
                onClick={() => executeSuggestPrompt(lang === 'ar' ? 'لخص البنود الحاكمة وطرق فسخ العقود من هذا الملف للتأكيد القانوني' : 'Summarize conditions and arbitration covenants')}
                className="px-2.5 py-1 text-[11px] bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:text-slate-350 dark:hover:bg-slate-800 text-slate-600 rounded-lg hover:text-indigo-600 transition truncate text-right border border-slate-200 dark:border-slate-800"
              >
                🛡️ {t.suggestPrompt3}
              </button>
              {chatHistory.length > 0 && (
                <button
                  onClick={onClearChatHistory}
                  className="px-2.5 py-1 text-[11px] bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 rounded-lg font-semibold transition"
                >
                  {lang === 'ar' ? 'مسح السجل' : 'Clear Chat History'}
                </button>
              )}
            </div>
          </div>

          {/* Prompt Entry Box */}
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-850 shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              placeholder={t.aiPlaceholder}
              className="w-full text-xs md:text-sm p-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-850 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl transition disabled:opacity-50 flex items-center justify-center shrink-0"
            >
              <Send className="w-4 h-4 transform rotate-180" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
