import React, { useState } from "react";
import { 
  Server, 
  KeyRound, 
  Plus, 
  Trash2, 
  Sliders, 
  Copy, 
  Check, 
  Code, 
  Terminal,
  ShieldCheck,
  Zap
} from "lucide-react";
import { APIToken, Language } from "../types";
import { ar, en } from "../translations";

interface APITokensViewProps {
  lang: Language;
  apiTokens: APIToken[];
  onGenerateToken: (name: string, rateLimit: number) => void;
  onDeleteToken: (id: string) => void;
  onAddAuditLog: (action: string, details: string, category: 'Document' | 'AI' | 'Workspace' | 'Security' | 'Billing' | 'System') => void;
}

export default function APITokensView({
  lang,
  apiTokens,
  onGenerateToken,
  onDeleteToken,
  onAddAuditLog,
}: APITokensViewProps) {
  const t = lang === 'ar' ? ar : en;
  const [tokenName, setTokenName] = useState("");
  const [rateLimit, setRateLimit] = useState(60);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenName.trim()) return;

    onGenerateToken(tokenName, rateLimit);
    onAddAuditLog(
      "API Token Created",
      `Generated new REST token "${tokenName}" with rate limit of ${rateLimit} req/min`,
      "Security"
    );
    setTokenName("");
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1805);
  };

  // Pre-configured cURL matching server structure dynamically
  const curlCode = `curl -X POST "${window.location.origin}/api/ai/ocr-understanding" \\
  -H "Authorization: Bearer ${apiTokens[0]?.token || "mnjz_live_92a8fcdd..."}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "fileName": "employment_contract.pdf",
    "fileType": "Contract",
    "simulationType": "Urgent executive parse with structural key-values"
  }'`;

  const pythonCode = `import requests

url = "${window.location.origin}/api/ai/ocr-understanding"
headers = {
    "Authorization": "Bearer ${apiTokens[0]?.token || "mnjz_live_92a8fcdd..."}",
    "Content-Type": "application/json"
}
payload = {
    "fileName": "commercial_invoice.png",
    "fileType": "Invoice",
    "simulationType": "Table recognition & tax aggregation"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`;

  return (
    <div className="space-y-6" id="api-tokens-view-root">
      
      {/* Header Profile */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Server className="text-indigo-600 w-5 h-5" />
            {t.apiTitle}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {t.apiSubtitle}
          </p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 font-mono text-xs px-2.5 py-1 rounded-lg font-bold mt-2 md:mt-0">
          SAP & ERP LEGACY CONNECTOR ACTIVE
        </div>
      </div>

      {/* Main Grid: Management Form and Live Documentation */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Side (2 Columns): Generation Form & Active lists */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Form */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-widest font-mono flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-indigo-500" />
              {t.generateTokenBtn}
            </h2>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t.tokenName}
                </label>
                <input
                  type="text"
                  required
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  placeholder="e.g. SAP Gateway ERP-2"
                  className="w-full text-xs p-2.5 bg-slate-55 bg-slate-50 border border-slate-250 border-slate-205 dark:bg-slate-850 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>{t.rateLimit}</span>
                  <span className="font-mono text-indigo-650 font-bold">{rateLimit} req/min</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="300"
                  step="10"
                  value={rateLimit}
                  onChange={(e) => setRateLimit(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <p className="text-[10px] text-slate-400">
                  {lang === 'ar' ? 'يمنع هجمات الحرمان من الخدمة ويضمن حوكمة التكاليف' : 'Ensures DDoS fallback prevention & cost capping.'}
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                {lang === 'ar' ? 'تشييد مفتاح وصول جديد' : 'Generate Secure API Token'}
              </button>
            </form>
          </div>

          {/* Tokens List */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-widest font-mono">
              {lang === 'ar' ? 'مفاتيح الربط التكاملي النشطة' : 'Active Deployment Tokens'}
            </h2>

            {apiTokens.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">
                {lang === 'ar' ? 'لا يوجد مفاتيح مفعّلة حالياً' : 'No integration keys configured yet.'}
              </p>
            ) : (
              <div className="space-y-3">
                {apiTokens.map((tk) => (
                  <div key={tk.id} className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl space-y-2 border border-slate-100">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                        {tk.name}
                      </span>
                      <button
                        onClick={() => onDeleteToken(tk.id)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 p-1.5 bg-slate-950 rounded text-xs font-mono select-all">
                      <span className="text-amber-400 truncate grow">{tk.token}</span>
                      <button
                        onClick={() => copyToClipboard(tk.token, tk.id)}
                        className="p-1 text-slate-450 hover:text-white rounded"
                        title="Copy Key"
                      >
                        {copiedId === tk.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <div className="flex justify-between text-[10px] font-mono text-slate-400 pt-1">
                      <span>Limit: {tk.rateLimit} RPM</span>
                      <span>Hits: {tk.usageHits} Hits</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Side (3 Columns): Live Code Playgrounds & Interactive Documentation */}
        <div className="lg:col-span-3 p-6 bg-slate-900 rounded-2xl shadow-xl border border-slate-800 text-white space-y-6 flex flex-col justify-between" id="developer-docs-sandbox">
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h2 className="text-sm font-semibold uppercase tracking-widest font-mono text-indigo-400 flex items-center gap-2">
                <Code className="w-5 h-5 text-indigo-400" />
                {t.devDocsTitle}
              </h2>
              <span className="text-[10px] bg-indigo-505 bg-indigo-500/10 border border-indigo-500/30 px-2 py-0.5 rounded text-indigo-300 font-mono">
                API v1.07.6
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {lang === 'ar'
                ? "يمكنك إدماج محرك معالجة مستندات MUNJIZ الذكي ذو القدرات السيادية في أنظمتك الخاصة مباشرة ومجانياً بدقائق معدودة، باستخدام الرمز المولد."
                : "Transmit encrypted files programmatically into MUNJIZ cloud clusters. Leverage standard POST protocols and receive complete JSON nodes of semantic data."}
            </p>

            {/* TAB-LIKE CHIPS FOR LANGS */}
            <div className="space-y-4">
              
              {/* cURL section */}
              <div className="space-y-2">
                <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-slate-400" />
                  Shell Bash (cURL Request)
                </span>
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed max-h-[170px] relative group scrollbar-thin">
                  <button 
                    onClick={() => copyToClipboard(curlCode, 'curl')}
                    className="absolute top-2 right-2 p-1 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded"
                    title="Copy snippet"
                  >
                    {copiedId === 'curl' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                  <pre className="text-emerald-400 text-left">
                    {curlCode}
                  </pre>
                </div>
              </div>

              {/* Python section */}
              <div className="space-y-2">
                <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-slate-400" />
                  Python integration
                </span>
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed max-h-[170px] relative group scrollbar-thin">
                  <button 
                    onClick={() => copyToClipboard(pythonCode, 'python')}
                    className="absolute top-2 right-2 p-1 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded"
                    title="Copy snippet"
                  >
                    {copiedId === 'python' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                  <pre className="text-blue-400 text-left">
                    {pythonCode}
                  </pre>
                </div>
              </div>

            </div>
          </div>

          <div className="p-4 bg-indigo-950/20 border border-indigo-900/40 rounded-xl flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="text-[11px] text-indigo-200">
              <strong>{lang === 'ar' ? 'تحقق الأمان السيبراني:' : 'API Token Cappings security policy:'}</strong>
              {" "}
              {lang === 'ar'
                ? "يتم تشفير كافة رموز الـ Bearer مخرجات خوادم الـ Base64 لضمان حجب البوابة من التفتيش الخارجي العشوائي."
                : "Tokens are signed locally with multi-level SHA-256 salts. Key scopes can be disabled instantly."}
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
