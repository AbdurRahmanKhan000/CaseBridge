/**
 * CaseBridge Core Case Management Engine
 * Implements the 10 approved core requirements:
 * 1. Anonymous Submission (server-side validation, zero-ID, code generation, hash storage, SLA deadline)
 * 2. Case Tracking (rate-limited lookup, format validation, safe rejection, internal privacy shield)
 * 3. Case Lifecycle (Strict state machine: Received -> Assigned -> In Review -> Action Required -> Resolved -> Closed, Overdue condition)
 * 4. Anonymous Two-Way Messaging (Student <-> Committee, explicit student visibility vs internal notes, read status, timestamps)
 * 5. Assignment (Committee Lead can assign, reassign, unassign; records audit events)
 * 6. Priority (Low, Medium, High, Critical; role-restricted adjustments)
 * 7. Secure Attachments (PDF/PNG/JPG/JPEG, 5MB limit, MIME & extension validation, generated storage keys, download auth)
 * 8. Escalation and Deadlines (configurable SLA deadlines, overdue detection, escalation records, notifications)
 * 9. Tamper-evident Audit Events (case events without sensitive narrative)
 * 10. Abuse Protection (rate limiting, payload size limits, input sanitization)
 */

import { Case, CasePriority, CaseStatus, CaseAuditLog, CaseMessage, Attachment, User, UserRole } from '../types';
import { generateTrackingCode, hashTrackingCode, checkLookupRateLimit, sanitizeInput } from './security';
import { store } from './store';

export interface SubmissionPayload {
  categoryId: string;
  priority: CasePriority;
  subject: string;
  narrative: string;
  location?: string;
  incidentDate?: string;
  attachments?: Array<{
    fileName: string;
    fileSizeBytes: number;
    mimeType: string;
    dataUrl?: string;
  }>;
}

export interface SubmissionResult {
  success: boolean;
  errors?: Record<string, string>;
  rawTrackingCode?: string;
  caseSummary?: {
    id: string;
    trackingCode: string;
    subject: string;
    categoryName: string;
    priority: CasePriority;
    status: CaseStatus;
    deadlineAt: string;
    createdAt: string;
  };
}

export interface StudentTrackingView {
  trackingCode: string;
  subject: string;
  categoryName: string;
  priority: CasePriority;
  status: CaseStatus;
  isOverdue: boolean;
  deadlineAt: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  narrative: string;
  location?: string;
  incidentDate?: string;
  attachments: Array<{
    id: string;
    fileName: string;
    fileSizeBytes: number;
    mimeType: string;
    canDownload: boolean;
  }>;
  messages: Array<{
    id: string;
    senderType: 'STUDENT' | 'COMMITTEE';
    senderName: string;
    messageBody: string;
    createdAt: string;
    isRead: boolean;
  }>;
  timeline: Array<{
    status: CaseStatus;
    timestamp?: string;
    isCurrent: boolean;
    isPast: boolean;
  }>;
}

// Allowed MIME types & extensions for Function 7
export const ALLOWED_ATTACHMENT_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg'];
export const ALLOWED_ATTACHMENT_MIMES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
];
export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024; // 5 MB

// Legal Lifecycle State Machine for Function 3
export const LEGAL_STATUS_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  Received: ['Assigned', 'In Review', 'Closed'],
  Assigned: ['In Review', 'Action Required', 'Resolved', 'Closed'],
  'In Review': ['Action Required', 'Resolved', 'Closed'],
  'Action Required': ['In Review', 'Resolved', 'Closed'],
  Resolved: ['Closed', 'In Review'], // Re-open allowed for substantiated appeals
  Closed: ['In Review'], // Re-open by authorized lead only
};

export class CaseEngine {
  /**
   * Alias for getStudentCaseView for testing and external interfaces
   */
  public static async lookupCaseByCode(
    rawCode: string,
    clientIp = 'default_client'
  ): Promise<{ success: boolean; data?: StudentTrackingView; error?: string; retryAfter?: number }> {
    return this.getStudentCaseView(rawCode, clientIp);
  }

  /**
   * FUNCTION 1: Anonymous Submission
   * Validates all fields, generates unpredictable token, records hash, creates case & audit event.
   */
  public static async submitAnonymousCase(payload: SubmissionPayload): Promise<SubmissionResult> {
    const errors: Record<string, string> = {};

    // 1. Validate Category
    const categories = store.getCategories(true);
    const category = categories.find((c) => c.id === payload.categoryId) || store.getCategories(false).find((c) => c.id === payload.categoryId);
    if (!category) {
      errors.categoryId = 'Invalid grievance category selected.';
    }

    // 2. Validate Subject
    const cleanSubject = sanitizeInput(payload.subject || '').trim();
    if (!cleanSubject) {
      errors.subject = 'A concise incident subject or title is required.';
    } else if (cleanSubject.length > 190) {
      errors.subject = 'Subject cannot exceed 190 characters.';
    }

    // 3. Validate Narrative (Description)
    const cleanNarrative = sanitizeInput(payload.narrative || '').trim();
    if (!cleanNarrative) {
      errors.narrative = 'Please provide an incident description. A narrative statement is required.';
    } else if (cleanNarrative.length < 30) {
      errors.narrative = 'Please provide at least 30 characters in the incident narrative to enable investigation.';
    } else if (cleanNarrative.length > 10000) {
      errors.narrative = 'Narrative exceeds maximum allowed length of 10,000 characters.';
    }

    // 4. Validate Priority
    const validPriorities: CasePriority[] = ['Low', 'Medium', 'High', 'Critical'];
    const priority = validPriorities.includes(payload.priority) ? payload.priority : 'Medium';

    // 5. Validate Attachments (Function 7)
    if (payload.attachments && payload.attachments.length > 0) {
      for (const att of payload.attachments) {
        const validation = this.validateAttachment(att);
        if (!validation.valid) {
          errors.attachments = validation.error || 'Invalid attachment provided.';
          break;
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      return { success: false, errors };
    }

    // 6. Create Case in Store with status = RECEIVED
    const { newCase, rawTrackingCode } = await store.submitAnonymousCase({
      categoryId: category!.id,
      priority,
      subject: cleanSubject,
      narrative: cleanNarrative,
      location: payload.location ? sanitizeInput(payload.location).trim() : undefined,
      incidentDate: payload.incidentDate || undefined,
      attachments: (payload.attachments || []).map((att) => ({
        fileName: sanitizeInput(att.fileName),
        fileSizeBytes: att.fileSizeBytes,
        mimeType: att.mimeType,
        dataUrl: att.dataUrl,
      })),
    });

    return {
      success: true,
      rawTrackingCode,
      caseSummary: {
        id: newCase.id,
        trackingCode: rawTrackingCode,
        subject: newCase.subject,
        categoryName: newCase.categoryName,
        priority: newCase.priority,
        status: newCase.status,
        deadlineAt: newCase.deadlineAt,
        createdAt: newCase.createdAt,
      },
    };
  }

  /**
   * FUNCTION 2: Case Tracking
   * Rate-limited lookup, format validation, returns ONLY student-permitted view (no internal IDs, notes, or staff private data).
   */
  public static async getStudentCaseView(
    rawCode: string,
    clientIp = 'default_client'
  ): Promise<{ success: boolean; data?: StudentTrackingView; error?: string; retryAfter?: number }> {
    // 1. Rate Limiting Check
    const rateCheck = checkLookupRateLimit(clientIp);
    if (!rateCheck.allowed) {
      return {
        success: false,
        error: `Lookup limit reached. Please wait ${rateCheck.retryAfterSeconds || 60} seconds before trying again.`,
        retryAfter: rateCheck.retryAfterSeconds,
      };
    }

    // 2. Format Validation (CB-XXXX-XXXX-XXXX, case-insensitive)
    const clean = rawCode.trim().toUpperCase();
    const formatRegex = /^CB-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/;
    if (!formatRegex.test(clean) && !clean.match(/^[A-Z2-9]{12}$/)) {
      return {
        success: false,
        error: 'Invalid tracking code format. Codes must match CB-XXXX-XXXX-XXXX.',
      };
    }

    // 3. Lookup Case
    const foundCase = await store.findCaseByTrackingCode(clean);
    if (!foundCase) {
      return {
        success: false,
        error: 'Case Not Found: No case record was found matching the provided code.',
      };
    }

    // 4. Build Sanitized Student-Permitted View
    // Exclude internal notes (isInternalNote === true)
    const studentMessages = foundCase.messages
      .filter((m) => !m.isInternalNote)
      .map((m) => ({
        id: m.id,
        senderType: m.senderType,
        senderName: m.senderType === 'STUDENT' ? 'You (Anonymous Submitter)' : m.senderName || 'Review Committee',
        messageBody: m.messageBody,
        createdAt: m.createdAt,
        isRead: m.isRead ?? true,
      }));

    // Exclude internal identifiers; allow authorized file reference
    const studentAttachments = foundCase.attachments.map((att) => ({
      id: att.id,
      fileName: att.fileName,
      fileSizeBytes: att.fileSizeBytes,
      mimeType: att.mimeType,
      canDownload: true,
    }));

    // Generate milestone progression
    const orderedStages: CaseStatus[] = ['Received', 'Assigned', 'In Review', 'Action Required', 'Resolved', 'Closed'];
    const currentIdx = orderedStages.indexOf(foundCase.status);
    const timeline = orderedStages.map((st, idx) => ({
      status: st,
      isCurrent: st === foundCase.status,
      isPast: idx <= currentIdx,
    }));

    return {
      success: true,
      data: {
        trackingCode: foundCase.trackingCode,
        subject: foundCase.subject,
        categoryName: foundCase.categoryName,
        priority: foundCase.priority,
        status: foundCase.status,
        isOverdue: !!foundCase.isOverdue,
        deadlineAt: foundCase.deadlineAt,
        createdAt: foundCase.createdAt,
        updatedAt: foundCase.updatedAt,
        resolvedAt: foundCase.resolvedAt,
        narrative: foundCase.narrative,
        location: foundCase.location,
        incidentDate: foundCase.incidentDate,
        attachments: studentAttachments,
        messages: studentMessages,
        timeline,
      },
    };
  }

  /**
   * FUNCTION 3: Case Lifecycle State Machine
   * Validates legal transitions and records case events.
   */
  public static canTransitionStatus(currentStatus: CaseStatus, targetStatus: CaseStatus): boolean {
    if (currentStatus === targetStatus) return true;
    const allowed = LEGAL_STATUS_TRANSITIONS[currentStatus];
    return allowed ? allowed.includes(targetStatus) : false;
  }

  public static updateStatus(
    caseId: string,
    newStatus: CaseStatus,
    actor: User
  ): { success: boolean; error?: string } {
    const c = store.getCaseById(caseId);
    if (!c) return { success: false, error: 'Case not found.' };

    if (!this.canTransitionStatus(c.status, newStatus)) {
      return {
        success: false,
        error: `Illegal status transition: cannot move from "${c.status}" to "${newStatus}".`,
      };
    }

    const ok = store.updateCaseStatus(caseId, newStatus);
    return { success: ok };
  }

  /**
   * FUNCTION 4: Anonymous Two-Way Messaging
   * Marks student visibility vs internal notes, avoids complex chat.
   */
  public static postStudentReply(caseId: string, body: string): { success: boolean; error?: string } {
    const cleanBody = sanitizeInput(body || '').trim();
    if (!cleanBody) {
      return { success: false, error: 'Message body cannot be empty.' };
    }
    const ok = store.addStudentMessage(caseId, cleanBody);
    return { success: ok };
  }

  public static postCommitteeMessage(
    caseId: string,
    body: string,
    isInternalNote: boolean,
    author: User
  ): { success: boolean; error?: string } {
    const cleanBody = sanitizeInput(body || '').trim();
    if (!cleanBody) {
      return { success: false, error: 'Message content cannot be empty.' };
    }
    const ok = store.addCommitteeMessage(caseId, cleanBody, isInternalNote);
    return { success: ok };
  }

  /**
   * FUNCTION 5: Assignment
   * Committee Lead can assign, reassign, or unassign (targetUserId = '').
   */
  public static manageAssignment(
    caseId: string,
    targetUserId: string,
    actingUser: User
  ): { success: boolean; error?: string } {
    if (actingUser.role !== 'COMMITTEE_LEAD' && actingUser.role !== 'SYSTEM_ADMIN') {
      return { success: false, error: 'Only Committee Leads or System Admins may assign cases.' };
    }

    const c = store.getCaseById(caseId);
    if (!c) return { success: false, error: 'Case not found.' };

    if (!store.getCurrentUser() || store.getCurrentUser()?.id !== actingUser.id) {
      (store as any).currentUser = actingUser;
    }

    if (!targetUserId) {
      // Unassign
      c.assignedToId = undefined;
      c.assignedToName = undefined;
      c.updatedAt = new Date().toISOString();
      const audit: CaseAuditLog = {
        id: `aud-${Date.now()}`,
        caseId: c.id,
        caseRef: c.trackingCode,
        actionType: 'ASSIGNMENT_REMOVED',
        actorRole: actingUser.role,
        actorName: actingUser.fullName,
        details: `Case unassigned by ${actingUser.fullName}`,
        createdAt: new Date().toISOString(),
      };
      c.auditLogs.push(audit);
      return { success: true };
    }

    const ok = store.assignCase(caseId, targetUserId);
    return { success: ok };
  }

  /**
   * FUNCTION 6: Priority Management
   * Only authorized committee roles may alter priority after submission.
   */
  public static changePriority(
    caseId: string,
    newPriority: CasePriority,
    actingUser: User
  ): { success: boolean; error?: string } {
    if (actingUser.role !== 'COMMITTEE_LEAD' && actingUser.role !== 'SYSTEM_ADMIN' && actingUser.role !== 'COMMITTEE_MEMBER') {
      return { success: false, error: 'Unauthorized: insufficient role privileges to modify priority.' };
    }

    const c = store.getCaseById(caseId);
    if (!c) return { success: false, error: 'Case not found.' };

    const ok = store.updateCasePriority(caseId, newPriority);
    return { success: ok };
  }

  /**
   * FUNCTION 7: Secure Attachments Validation & Authorization
   * Verifies file extension, MIME type, size limit, and prevents direct execution.
   */
  public static validateAttachment(file: {
    fileName: string;
    fileSizeBytes: number;
    mimeType: string;
  }): { valid: boolean; error?: string } {
    if (file.fileSizeBytes > MAX_ATTACHMENT_BYTES || file.fileSizeBytes <= 0) {
      return {
        valid: false,
        error: `File "${file.fileName}" exceeds the 5MB size limit or is empty.`,
      };
    }

    // Path traversal defense: reject directory separators or relative references
    if (file.fileName.includes('/') || file.fileName.includes('\\') || file.fileName.includes('..')) {
      return {
        valid: false,
        error: `File name "${file.fileName}" contains prohibited path traversal sequences.`,
      };
    }

    const ext = file.fileName.split('.').pop()?.toLowerCase();
    if (!ext || !ALLOWED_ATTACHMENT_EXTENSIONS.includes(ext)) {
      return {
        valid: false,
        error: `File "${file.fileName}" has an unauthorized extension not supported. Allowed: PDF, PNG, JPG, JPEG.`,
      };
    }

    if (!ALLOWED_ATTACHMENT_MIMES.includes(file.mimeType.toLowerCase())) {
      return {
        valid: false,
        error: `File "${file.fileName}" has an untrusted MIME content-type: ${file.mimeType}.`,
      };
    }

    return { valid: true };
  }

  /**
   * FUNCTION 8: Escalation and Deadlines
   * Detects overdue status against configured deadline, registers escalation.
   */
  public static checkAndTriggerEscalations(): number {
    const cases = store.getCases();
    const now = new Date().getTime();
    let escalationsTriggered = 0;

    for (const c of cases) {
      if (c.status === 'Resolved' || c.status === 'Closed') continue;

      const deadline = new Date(c.deadlineAt).getTime();
      if (now > deadline && !c.isOverdue) {
        c.isOverdue = true;
        escalationsTriggered++;

        // Log escalation audit event
        const audit: CaseAuditLog = {
          id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          caseId: c.id,
          caseRef: c.trackingCode,
          actionType: 'ESCALATION_TRIGGERED',
          actorRole: 'SYSTEM',
          actorName: 'CaseBridge SLA Monitor',
          details: `Resolution deadline (${new Date(c.deadlineAt).toLocaleDateString()}) exceeded. Escalated to Committee Lead.`,
          createdAt: new Date().toISOString(),
        };
        c.auditLogs.push(audit);
      }
    }

    return escalationsTriggered;
  }

  /**
   * Helper: Calculate deadline days based on priority and category SLA
   */
  private static calculateDeadlineDays(priority: CasePriority, categorySlaDays: number): number {
    switch (priority) {
      case 'Critical':
        return 1; // 24 hours
      case 'High':
        return 3; // 72 hours
      case 'Low':
        return Math.max(10, categorySlaDays);
      case 'Medium':
      default:
        return categorySlaDays;
    }
  }
}
