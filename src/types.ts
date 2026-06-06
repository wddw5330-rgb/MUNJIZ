export type Language = 'ar' | 'en';

export type UserRole = 'Owner' | 'Admin' | 'Manager' | 'Employee' | 'Viewer';

export interface Workspace {
  id: string;
  name: string;
  nameAr: string;
  subdomain: string;
  logoColor: string;
  storageUsed: number; // in MB
  storageLimit: number; // in MB
  subscriptionPlan: 'Monthly Standard' | 'Annual Business' | 'Enterprise Premium' | 'Custom Company';
  usersCount: number;
  apiKeysCount: number;
  status: 'active' | 'suspended';
}

export type DocumentType = 'PDF' | 'Image' | 'DOCX' | 'XLSX' | 'Contract' | 'Invoice' | 'Report' | 'Handwritten';

export interface WorkspaceDocument {
  id: string;
  name: string;
  type: DocumentType;
  workspaceId: string;
  size: number; // in KB
  status: 'Completed' | 'Processing' | 'Draft' | 'Failed';
  createdAt: string;
  ocrText?: string;
  convertedText?: string;
  aiSummary?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  status: 'Active' | 'Pending' | 'Suspended';
  createdAt: string;
}

export interface APIToken {
  id: string;
  name: string;
  token: string;
  rateLimit: number; // req/min
  usageHits: number;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export interface AuditLog {
  id: string;
  user: string;
  role: string;
  action: string;
  category: 'Document' | 'AI' | 'Workspace' | 'Security' | 'Billing' | 'System';
  timestamp: string;
  ipAddress: string;
  details: string;
}

export interface GitCommit {
  id: string;
  hash: string;
  description: string;
  author: string;
  timestamp: string;
  versionTag?: string;
  type: 'Visual Change' | 'Code Generation' | 'Git Commit' | 'Production Update';
  status: 'Success' | 'Pending' | 'Failed';
}

export interface PipelineStage {
  name: string;
  status: 'idle' | 'running' | 'success' | 'failed';
  duration?: string;
  logs: string[];
}

export interface PrintingServer {
  id: string;
  name: string;
  type: 'Bluetooth' | 'Wi-Fi' | 'Network' | 'USB';
  status: 'Online' | 'Offline';
  address: string;
}

export interface PrintJob {
  id: string;
  documentName: string;
  printerName: string;
  copies: number;
  status: 'Queued' | 'Printing' | 'Completed' | 'Failed';
  timestamp: string;
}
