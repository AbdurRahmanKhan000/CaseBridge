/**
 * CaseBridge Core Data Types & Enums
 */

export type UserRole = 'COMMITTEE_MEMBER' | 'COMMITTEE_LEAD' | 'SYSTEM_ADMIN';

export type CasePriority = 'Low' | 'Medium' | 'High' | 'Critical';

export type CaseStatus = 
  | 'Received'
  | 'Assigned'
  | 'In Review'
  | 'Action Required'
  | 'Resolved'
  | 'Closed';

export type SenderType = 'STUDENT' | 'COMMITTEE';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  department: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  slaDays: number;
  isActive: boolean;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  dataUrl?: string;
  createdAt: string;
}

export interface CaseMessage {
  id: string;
  caseId: string;
  senderType: SenderType;
  senderUserId?: string;
  senderName?: string;
  messageBody: string;
  isInternalNote: boolean;
  isRead?: boolean;
  createdAt: string;
}

export interface CaseAuditLog {
  id: string;
  caseId?: string;
  caseRef?: string;
  actionType: string;
  actorRole: string;
  actorName: string;
  details: string;
  createdAt: string;
}

export interface Case {
  id: string;
  trackingCode: string; // Stored locally/mock; codeHash represents the hashed representation
  codeHash: string;
  categoryId: string;
  categoryName: string;
  priority: CasePriority;
  status: CaseStatus;
  subject: string;
  narrative: string;
  location?: string;
  incidentDate?: string;
  assignedToId?: string;
  assignedToName?: string;
  deadlineAt: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  isOverdue?: boolean;
  attachments: Attachment[];
  messages: CaseMessage[];
  auditLogs: CaseAuditLog[];
}

export interface SystemSettings {
  institutionName: string;
  supportEmail: string;
  emergencyPhone: string;
  dataRetentionDays: number;
  slaDaysLow: number;
  slaDaysMedium: number;
  slaDaysHigh: number;
  slaDaysCriticalHours: number;
  allowFileUploads: boolean;
  maxUploadSizeBytes: number;
}
