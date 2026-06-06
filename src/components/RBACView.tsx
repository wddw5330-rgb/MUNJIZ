import React, { useState } from "react";
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  ShieldAlert, 
  Building2, 
  UserMinus, 
  Check, 
  X, 
  Lock, 
  Info,
  KeyRound
} from "lucide-react";
import { TeamMember, Workspace, Language, UserRole } from "../types";
import { ar, en } from "../translations";

interface RBACViewProps {
  lang: Language;
  activeWorkspace: Workspace;
  teamMembers: TeamMember[];
  onAddTeamMember: (member: TeamMember) => void;
  onRemoveTeamMember: (id: string) => void;
  onAddAuditLog: (action: string, details: string, category: 'Document' | 'AI' | 'Workspace' | 'Security' | 'Billing' | 'System') => void;
}

export default function RBACView({
  lang,
  activeWorkspace,
  teamMembers,
  onAddTeamMember,
  onRemoveTeamMember,
  onAddAuditLog,
}: RBACViewProps) {
  const t = lang === 'ar' ? ar : en;
  const [showInviteModal, setShowInviteModal] = useState(false);
  
  // Invite States
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("Employee");

  // Keep a structured permissions matrix to render beautifully
  const permissionsMatrix = [
    { nameEn: "Upload Tenant Files", nameAr: "رفع الملفات والمستندات للمساحة", roles: { Owner: true, Admin: true, Manager: true, Employee: true, Viewer: false } },
    { nameEn: "Apply AI OCR & Understanding", nameAr: "تشغيل معالجة ذكاء اصطناعي OCR", roles: { Owner: true, Admin: true, Manager: true, Employee: true, Viewer: false } },
    { nameEn: "Edit & Correct Document Fields", nameAr: "تعديل واستبدال حقول المستندات", roles: { Owner: true, Admin: true, Manager: true, Employee: false, Viewer: false } },
    { nameEn: "Database Archiving & Soft Delete", nameAr: "أرشفة المستندات وحذفها المؤقت", roles: { Owner: true, Admin: true, Manager: false, Employee: false, Viewer: false } },
    { nameEn: "Export to SAP / ERP API JSON", nameAr: "تصدير الملفات وترحيلها لـ ERP/SAP", roles: { Owner: true, Admin: true, Manager: true, Employee: false, Viewer: false } },
    { nameEn: "Manage API Secret Integration Keys", nameAr: "إدارة مفاتيح المطورين وربط الأنظمة", roles: { Owner: true, Admin: true, Manager: false, Employee: false, Viewer: false } },
    { nameEn: "Configure Workspace & Workspace Theme", nameAr: "تغيير هوية الشركة وإعدادات المساحة", roles: { Owner: true, Admin: false, Manager: false, Employee: false, Viewer: false } },
  ];

  // Filter team members based on selected workspace scope
  const filteredMembers = teamMembers;

  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;

    const newMember: TeamMember = {
      id: Math.random().toString(36).substring(2, 9),
      name: inviteName,
      email: inviteEmail,
      role: inviteRole,
      avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${inviteName}`,
      status: 'Active',
      createdAt: new Date().toISOString(),
    };

    onAddTeamMember(newMember);
    onAddAuditLog(
      "User Assigned Role",
      `Invited ${inviteName} (${inviteEmail}) to workspace ${activeWorkspace.name} with role ${inviteRole}`,
      "Security"
    );

    // Reset states
    setInviteName("");
    setInviteEmail("");
    setInviteRole("Employee");
    setShowInviteModal(false);
  };

  return (
    <div className="space-y-6" id="rbac-view-root">
      
      {/* Title Block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Lock className="text-indigo-650 w-5 h-5" />
            {t.rbacTitle}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {t.rbacSubtitle}
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="mt-3 md:mt-0 px-4 py-2 bg-indigo-650 hover:bg-indigo-700 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition shadow-md active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          {t.addMemberBtn}
        </button>
      </div>

      {/* Tenant Isolation Map / Banner alert */}
      <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 rounded-2xl flex items-center gap-3">
        <ShieldCheck className="w-6 h-6 text-emerald-500 animate-pulse shrink-0" />
        <div className="text-right text-xs">
          <strong>{lang === 'ar' ? 'نموذج عزل البيانات والأعضاء:' : 'Active Directory Isolation Map:'}</strong>
          {" "}
          {lang === 'ar'
            ? `أنت تستعرض ملفات ومستخدمي نطاق (${activeWorkspace.subdomain}). لا تتدخل الصلاحيات، ويمنع أي موظف من الوصول لبيانات أي مساحات أخرى تزامناً مع إجراءات الأمن السيبراني.`
            : `You are monitoring the directory under domain (${activeWorkspace.subdomain}). Cross-tenant database leakage is physically prohibited in our multi-instance container model.`}
        </div>
      </div>

      {/* Main Grid: Member directory & Permissions matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Side (3 Columns): Team Directory Table */}
        <div className="lg:col-span-3 p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-widest font-mono">
            {lang === 'ar' ? 'سجل الموظفين والمستخدمين النشطين' : 'SaaS Active Tenant Directory'}
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-xs text-slate-400 font-mono">
                  <th className="pb-3 text-right">{t.memberName}</th>
                  <th className="pb-3 text-center">{t.memberRole}</th>
                  <th className="pb-3 text-center">{t.memberStatus}</th>
                  <th className="pb-3 text-center">{lang === 'ar' ? 'إجراءات' : 'Trigger'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => (
                  <tr 
                    key={member.id} 
                    className="border-b border-slate-50 dark:border-slate-800 text-sm hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition"
                  >
                    <td className="py-3 flex items-center gap-3 text-right shrink-0">
                      <img src={member.avatar} alt="avatar" className="w-8 h-8 rounded-full bg-slate-100" />
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{member.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{member.email}</div>
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <span className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded ${
                        member.role === 'Owner' ? 'bg-indigo-50 text-indigo-700 font-bold' :
                        member.role === 'Admin' ? 'bg-blue-50 text-blue-700' :
                        member.role === 'Manager' ? 'bg-amber-50 text-amber-700' :
                        member.role === 'Employee' ? 'bg-emerald-50 text-emerald-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {member.role}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {member.status}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      {member.role !== 'Owner' ? (
                        <button
                          onClick={() => {
                            onRemoveTeamMember(member.id);
                            onAddAuditLog("User Removed", `Deleted ${member.name} from directory`, "Security");
                          }}
                          className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-650 rounded hover:text-rose-500 transition"
                          title="Remove user"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono">- Primary -</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side (2 Columns): Permissions matrix details */}
        <div className="lg:col-span-2 p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-widest font-mono mb-1">
              {t.permissionsMatrix}
            </h2>
            <p className="text-xs text-slate-400">
              {lang === 'ar' ? 'توزع الصلاحيات الحاكمة للمساحة حسب الأدوار المعينة تلقائياً' : 'Automated security permission matrix based on assigned tenancy level.'}
            </p>
          </div>

          <div className="space-y-3">
            {permissionsMatrix.map((item, idx) => (
              <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl space-y-2.5 border border-slate-100 dark:border-slate-800">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {lang === 'ar' ? item.nameAr : item.nameEn}
                </div>
                
                {/* Horizontal badge check */}
                <div className="grid grid-cols-5 text-center text-[10px] font-mono font-semibold gap-1">
                  {(Object.keys(item.roles) as UserRole[]).map((r) => {
                    const active = item.roles[r];
                    return (
                      <div 
                        key={r}
                        className={`p-1 rounded ${
                          active 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/50' 
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        <div>{r.slice(0, 3)}</div>
                        <div className="mt-0.5 flex justify-center">
                          {active ? <Check className="w-3 h-3 text-emerald-600" /> : <X className="w-2.5 h-2.5 text-slate-300" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Invite Modal Overlay */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 text-right space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <button 
                onClick={() => setShowInviteModal(false)}
                className="text-slate-450 hover:bg-slate-100 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="text-indigo-600 w-5 h-5" />
                {t.addMemberBtn}
              </h2>
            </div>

            <form onSubmit={handleAddMemberSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-705 text-slate-700 dark:text-slate-300 block">
                  {t.memberName}
                </label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. احمد الدوسري"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-850 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  {t.memberEmail}
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-850 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  {t.memberRole}
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserRole)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-850 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none"
                >
                  <option value="Admin">Admin (مدير نظام مساعد)</option>
                  <option value="Manager">Manager (مدير مشاريع ومستندات)</option>
                  <option value="Employee">Employee (موظف معالجة ومستندات)</option>
                  <option value="Viewer">Viewer (مراقب ومستعرض فقط)</option>
                </select>
              </div>

              <div className="pt-4 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-100 border border-slate-200"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-650 bg-indigo-600 hover:bg-indigo-705 text-white rounded-lg text-xs font-semibold transition"
                >
                  {lang === 'ar' ? 'إرسال دعوة الانضمام' : 'Dispatch Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
