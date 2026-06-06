export type TranslationKeys = typeof ar;

export const ar = {
  // Navigation & Shell
  appName: "مُنجِز | MUNJIZ",
  developerCredit: "تطوير: ICON CODE",
  subdomainLabel: "نطاق العمل الإلكتروني:",
  languageToggle: "English",
  chooseWorkspace: "اختر مساحة العمل",
  tenantScope: "مساحة عزل البيانات النشطة",
  activeWorkspaceLabel: "المساحة النشطة:",

  // Navigation Tabs
  tabDashboard: "لوحة التحكم الرئيسية",
  tabUpload: "مركز التحميل والمستندات",
  tabAIChat: "مساعد الذكاء الاصطناعي",
  tabRBAC: "الصلاحيات والمستخدمين",
  tabAPI: "منصة المطورين (API)",
  tabCMS: "لوحة تحكم النظام (ICON CODE)",
  tabPrint: "منصة الطباعة والتصدير",

  // Dashboard Summary
  dashboardTitle: "لوحة معالجة ذكاء المستندات",
  statsActiveWorkspace: "بيانات مساحة العمل",
  statsStorage: "التخزين السحابي الآمن",
  statsUsers: "أعضاء مساحة العمل",
  statsAPIs: "مفاتيح ربط API النشطة",
  planLabel: "اشتراك الشركة:",
  limitLabel: "الحد الأقصى:",
  usedLabel: "المستخدم:",
  
  // Dashboard Visualizations
  workspaceActivity: "سجل عمليات معالجة المستندات",
  recentUploads: "أحدث المستندات المرفقة",
  fileName: "اسم الملف",
  fileType: "النوع",
  fileSize: "الحجم",
  status: "الحالة",
  actions: "الإجراءات",
  completed: "مكتمل",
  processing: "جاري المعالجة",
  failed: "فشل",
  
  // Upload Module
  uploadTitle: "مركز التحميل غير المحدود",
  uploadSubtitle: "قم بسحب وإفلات أي مستند (صور، PDF، Word، Excel، عقود، خطوط اليد) للرفع الفوري والمعالجة الذكية بواسطة OCR والذكاء الاصطناعي",
  dragDropPrompt: "اسحب وأفلت الملفات هنا أو اضغط للتصفح",
  cameraScan: "مسح فوري بالكاميرا",
  bulkUpload: "تحميل دفعات متعددة",
  bulkActions: "معالجة جماعية",
  ocrExtractBtn: "معالجة ذكية OCR & AI",
  formatConvert: "تصدير فوري للملف",
  uploadedFilesCount: "الملفات المرفوعة بمساحة العمل:",
  
  // AI Chat playground
  aiChatTitle: "مساعد الذكاء الاصطناعي الذكي",
  aiChatSubtitle: "تخاطب مع مستنداتك وسجلاتك مباشرة باللغة الطبيعية. أنشئ التقارير المباشرة، العقود الرسمية، المخططات البيانية، أو حلل البيانات الضخمة.",
  loadedDocAlert: "المستند النشط للتحليل:",
  noDocLoaded: "لم يتم اختيار مستند، يمكنك المحادثة العامة أو اختيار ملف من مركز التحميل.",
  aiPlaceholder: "اطرح سؤالاً على المستند (مثال: 'قم بتحويل الصورة إلى ملف إكسل مبرمج'، 'صغ لي عقد عمل مهندس'، 'لخص هذه الميزانية'...)",
  suggestPrompt1: "صياغة عقد عمل احترافي",
  suggestPrompt2: "تحليل مالي للمستند وتصديره لإكسل",
  suggestPrompt3: "لخص البنود القانونية للمستند المختار",
  suggestPrompt4: "استخراج جداول الفاتورة المحددة",
  send: "إرسال",
  geminiActive: "بوابة الذكاء الاصطناعي: Google Gemini 3.5 Active",

  // RBAC permissions Tab
  rbacTitle: "إدارة الصلاحيات والمستخدمين (RBAC)",
  rbacSubtitle: "التحكم المؤسسي الشامل للشركة في نظام توزيع الأدوار. عزل كامل للأعضاء والوصول السحابي الآمن.",
  addMemberBtn: "إضافة عضو جديد",
  memberName: "الاسم",
  memberEmail: "البريد الإلكتروني",
  memberStatus: "الحالة في النظام",
  memberRole: "الدور المؤسسي",
  permissionsMatrix: "مصفوفة الأدوار والصلاحيات للشركة",
  permissionUpload: "رفع المستندات",
  permissionEdit: "تعديل الملفات",
  permissionAI: "استخدام الذكاء الاصطناعي",
  permissionExport: "التصدير والطباعة",
  permissionManageUsers: "إدارة المستخدمين",

  // API Tokens Portal
  apiTitle: "بوابة المطورين والربط الخارجي",
  apiSubtitle: "قم بربط نظام ERP أو SAP بمستندات MUNJIZ لمعالجة مستندات الـ OCR والذكاء الاصطناعي المؤتمتة عبر رمز وصول آمن.",
  generateTokenBtn: "إنشاء رمز API جديد",
  tokenName: "اسم التطبيق / المفتاح",
  tokenValue: "مفتاح الوصول (Token)",
  rateLimit: "معدل الطلبات",
  usageHits: "الطلبات المستهلكة",
  devDocsTitle: "توثيق واجهة API للمطورين",
  apiEndpointSim: "طلب معالجة المستند البرمجي OCR Matrix API",

  // Print & Export Center
  printTitle: "محرك التصدير والطباعة المؤسسية",
  printSubtitle: "اتصال لاسلكي بالشبكات المحلية والطباعة الفورية مع محرك توليد التشكيل المالي المتوافق مع SAP و ERP.",
  selectPrinter: "اختر الطابعة المتصلة:",
  copies: "عدد النسخ المطلوبة:",
  printAction: "أرسل أمر طباعة فوري",
  exportFormat: "تنسيق تصدير السحابة:",
  printerStatus: "حالة الطابعات النشطة",

  // Admin and DevOps Center (ICON CODE controls)
  cmsTitle: "منصة المطورين والتحكم الكلي لشركة (ICON CODE)",
  cmsSubtitle: "التحكم في الـ No-Code CMS، مصفوفة البناء الفوري، تتبع خطوط إنتاج Git-Like، وتدفق عمليات الحوكمة والتوزيع السحابي المستمر.",
  cmsHeroText: "تعديل الهوية والـ CMS بدون كود:",
  cmsLogoBg: "لون هوية المنصة الفوري",
  pipelineStatus: "خط إنتاج DevOps وتحديث خوادم السحاب",
  gitCommitLabel: "سجل البناء و Git Commits من نظام الـ CMS",
  commitChangeBtn: "تحديث النظام وصناعة Git Release فوري",
};

export const en = {
  // Navigation & Shell
  appName: "MUNJIZ | Enterprise AI",
  developerCredit: "Developed by: ICON CODE",
  subdomainLabel: "Workspace Domain:",
  languageToggle: "العربية",
  chooseWorkspace: "Select Workspace",
  tenantScope: "Secure Data Isolation Scope",
  activeWorkspaceLabel: "Active Workspace:",

  // Navigation Tabs
  tabDashboard: "Executive Dashboard",
  tabUpload: "Upload & Documents",
  tabAIChat: "Document AI Assistant",
  tabRBAC: "RBAC & Team Members",
  tabAPI: "Developer Portal (API)",
  tabCMS: "Developer CMS Console (ICON CODE)",
  tabPrint: "Enterprise Print & Export",

  // Dashboard Summary
  dashboardTitle: "Document Intelligence Center",
  statsActiveWorkspace: "Workspace Details",
  statsStorage: "Secure Cloud Storage",
  statsUsers: "Workspace Team Members",
  statsAPIs: "Active API Integration Gateways",
  planLabel: "SaaS Subscription Plan:",
  limitLabel: "Storage Limit:",
  usedLabel: "Storage Used:",

  // Dashboard Visualizations
  workspaceActivity: "Document Operations Timeline",
  recentUploads: "Recently Processed Documents",
  fileName: "File Name",
  fileType: "Type",
  fileSize: "Size",
  status: "Status",
  actions: "Actions",
  completed: "Completed",
  processing: "Processing",
  failed: "Failed",

  // Upload Module
  uploadTitle: "Unlimited Upload Center",
  uploadSubtitle: "Drag & drop files (Images, PDFs, Office formats, Handwritings) for instant OCR transcription, table analysis, and AI semantics.",
  dragDropPrompt: "Drag & drop files here or click to choose from system",
  cameraScan: "Camera Live Scan",
  bulkUpload: "Bulk Upload",
  bulkActions: "Batch Actions",
  ocrExtractBtn: "OCR & Intelligent Extract",
  formatConvert: "Export Formats",
  uploadedFilesCount: "Workspace Uploads:",

  // AI Chat playground
  aiChatTitle: "Conversational Document AI",
  aiChatSubtitle: "Interact directly with files or spreadsheet logs via natural language. Extract structured tables, draft legal contracts, or query stats.",
  loadedDocAlert: "Active Document Focus:",
  noDocLoaded: "No document selected. Type a general question, or choose a file from the Upload Center first.",
  aiPlaceholder: "Ask the document a query (e.g. 'convert this invoice into an Excel table', 'draft an employee agreement', 'explain financial spreadsheet')",
  suggestPrompt1: "Draft high-quality employee contract",
  suggestPrompt2: "Execute financial audit and export to Excel",
  suggestPrompt3: "Extract & summarize legal provisions",
  suggestPrompt4: "Isolate transaction invoice tables",
  send: "Send",
  geminiActive: "AI Model Gateway: Google Gemini 3.5 Active",

  // RBAC permissions Tab
  rbacTitle: "Role-Based Access Control (RBAC)",
  rbacSubtitle: "Enterprise governance, team directories, and tenant isolation scopes. Manage complete corporate roles & fine-grain system permissions.",
  addMemberBtn: "Invite Team Member",
  memberName: "Full Name",
  memberEmail: "Corporate Email Address",
  memberStatus: "Account Status",
  memberRole: "Assigned Authority",
  permissionsMatrix: "Enterprise Matrix Role Permissions Map",
  permissionUpload: "Upload Documents",
  permissionEdit: "Edit Resources",
  permissionAI: "Leverage AI Engine",
  permissionExport: "Print & Cloud Export",
  permissionManageUsers: "Configure Workspace Directory",

  // API Tokens Portal
  apiTitle: "Developer API Platform Gateway",
  apiSubtitle: "Access secure automated pipelines. Connect legacy ERP or SAP clients directly to MUNJIZ's AI OCR document translation endpoints.",
  generateTokenBtn: "Generate Secret Token",
  tokenName: "API App Identification / Name",
  tokenValue: "Encrypted API Token Key",
  rateLimit: "Rate Limitation",
  usageHits: "Accumulated API Requests",
  devDocsTitle: "Live Developer API Specifications",
  apiEndpointSim: "Execute Client OCR Document Analysis Query",

  // Print & Export Center
  printTitle: "Enterprise Print & Export Services",
  printSubtitle: "Simulate zero-lag direct Local Network, Bluetooth, or Wi-Fi hardware printing alongside SAP-ready file conversions.",
  selectPrinter: "Select Output Hardware Node:",
  copies: "Total Print Instances / Copies:",
  printAction: "Dispatch Print Command",
  exportFormat: "Target Export Integration Specification:",
  printerStatus: "Corporate Print Hardware Monitors",

  // Admin and DevOps Center (ICON CODE controls)
  cmsTitle: "ICON CODE Central Developer Control Plane",
  cmsSubtitle: "Manage No-Code Platform Themes, view DevOps server telemetry, test suite diagnostics, and trigger live Git updates.",
  cmsHeroText: "Real-time Theme & CMS System Updates:",
  cmsLogoBg: "Platform Identity Color Key",
  pipelineStatus: "Cloud Deployment Pipeline Feed",
  gitCommitLabel: "Git History & CMS Code Integrity Stream",
  commitChangeBtn: "Generate Build & Create Production Release tag",
};
