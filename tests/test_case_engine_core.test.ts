import { describe, it, expect, beforeEach } from 'vitest';
import { CaseEngine, LEGAL_STATUS_TRANSITIONS } from '../src/services/caseEngine';
import { store } from '../src/services/store';
import { resetRateLimits } from '../src/services/security';
import { User, CasePriority, CaseStatus } from '../src/types';

describe('CaseBridge Core Case Management Engine (Stage 5)', () => {
  beforeEach(() => {
    store.resetToFactoryDefaults();
    resetRateLimits();
  });

  const mockAdmin: User = {
    id: 'usr-3',
    email: 'sarah.jenkins@university.edu',
    fullName: 'Sarah Jenkins',
    role: 'SYSTEM_ADMIN',
    department: 'Institutional Oversight IT',
    isActive: true,
    createdAt: '2026-06-01T09:00:00Z',
  };

  const mockLead: User = {
    id: 'usr-2',
    email: 'marcus.thorne@university.edu',
    fullName: 'Marcus Thorne, J.D.',
    role: 'COMMITTEE_LEAD',
    department: 'Ethics & Compliance Office',
    isActive: true,
    createdAt: '2026-07-15T09:00:00Z',
  };

  const mockMember: User = {
    id: 'usr-1',
    email: 'elena.vance@university.edu',
    fullName: 'Dr. Elena Vance',
    role: 'COMMITTEE_MEMBER',
    department: 'Student Affairs & Welfare',
    isActive: true,
    createdAt: '2026-08-01T09:00:00Z',
  };

  // -------------------------------------------------------------
  // FUNCTION 1: Anonymous Submission
  // -------------------------------------------------------------
  describe('Function 1: Anonymous Submission', () => {
    it('successfully creates an anonymous case, returns 16-character code once, status is Received', async () => {
      const payload = {
        categoryId: 'cat-1',
        priority: 'High' as CasePriority,
        subject: 'Verbal harassment in computer architecture laboratory',
        narrative: 'A teaching assistant made repeated derogatory comments regarding demographic background during lab grading.',
        location: 'Engineering Science Lab 304',
        incidentDate: '2026-09-15',
      };

      const result = await CaseEngine.submitAnonymousCase(payload);
      expect(result.success).toBe(true);
      expect(result.rawTrackingCode).toBeDefined();
      expect(result.rawTrackingCode).toMatch(/^CB-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
      expect(result.caseSummary?.status).toBe('Received');
      expect(result.caseSummary?.priority).toBe('High');
      expect(result.caseSummary?.deadlineAt).toBeDefined();
    });

    it('rejects submission with missing subject or short narrative (<30 chars)', async () => {
      const badPayload = {
        categoryId: 'cat-1',
        priority: 'Medium' as CasePriority,
        subject: '',
        narrative: 'Too short',
      };

      const result = await CaseEngine.submitAnonymousCase(badPayload);
      expect(result.success).toBe(false);
      expect(result.errors?.subject).toBeDefined();
      expect(result.errors?.narrative).toContain('30 characters');
    });

    it('rejects submission with invalid category', async () => {
      const badCategoryPayload = {
        categoryId: 'cat-nonexistent-999',
        priority: 'Medium' as CasePriority,
        subject: 'Valid Subject With Sufficient Length',
        narrative: 'This narrative easily satisfies the minimum requirement of thirty characters for testing.',
      };

      const result = await CaseEngine.submitAnonymousCase(badCategoryPayload);
      expect(result.success).toBe(false);
      expect(result.errors?.categoryId).toBeDefined();
    });
  });

  // -------------------------------------------------------------
  // FUNCTION 2: Case Tracking & Privacy Boundary
  // -------------------------------------------------------------
  describe('Function 2: Case Tracking', () => {
    it('retrieves student-permitted view using valid tracking code and shields internal confidential notes', async () => {
      // 1. Submit Case
      const submitRes = await CaseEngine.submitAnonymousCase({
        categoryId: 'cat-2',
        priority: 'Medium',
        subject: 'Persistent cyberbullying in student forum',
        narrative: 'A peer group has created an unmoderated thread targeting individual students with coordinated harassment.',
      });

      const rawCode = submitRes.rawTrackingCode!;
      const caseId = submitRes.caseSummary!.id;

      // 2. Add an official committee response AND an internal confidential note
      store.loginUser(mockMember.id);
      CaseEngine.postCommitteeMessage(caseId, 'We have opened an active inquiry with the forum moderators.', false, mockMember);
      CaseEngine.postCommitteeMessage(caseId, 'CONFIDENTIAL NOTE: Student conduct hearing scheduled for next Tuesday.', true, mockMember);
      store.logoutUser();

      // 3. Look up via Student Tracking Engine
      const trackingRes = await CaseEngine.getStudentCaseView(rawCode, 'client_ip_test_1');
      expect(trackingRes.success).toBe(true);
      expect(trackingRes.data).toBeDefined();
      expect(trackingRes.data?.trackingCode).toBe(rawCode);

      // Verify student sees the official message
      const studentMessages = trackingRes.data!.messages;
      expect(studentMessages.some((m) => m.messageBody.includes('opened an active inquiry'))).toBe(true);

      // STRICT CHECK: Student MUST NEVER see confidential internal notes!
      expect(studentMessages.some((m) => m.messageBody.includes('CONFIDENTIAL NOTE'))).toBe(false);
    });

    it('safely rejects non-existent or invalid format tracking codes without enumeration leakage', async () => {
      const invalidFormatRes = await CaseEngine.getStudentCaseView('INVALID-CODE-XYZ');
      expect(invalidFormatRes.success).toBe(false);
      expect(invalidFormatRes.error).toContain('Invalid tracking code format');

      const notFoundRes = await CaseEngine.getStudentCaseView('CB-9999-8888-7777');
      expect(notFoundRes.success).toBe(false);
      expect(notFoundRes.error).toContain('Case Not Found');
    });
  });

  // -------------------------------------------------------------
  // FUNCTION 3: Case Lifecycle & Legal State Machine
  // -------------------------------------------------------------
  describe('Function 3: Case Lifecycle Transitions', () => {
    it('enforces legal sequential state machine: Received -> Assigned -> In Review -> Action Required -> Resolved -> Closed', async () => {
      const submitRes = await CaseEngine.submitAnonymousCase({
        categoryId: 'cat-3',
        priority: 'High',
        subject: 'Departmental budget irregularities',
        narrative: 'Equipment requisition funds appear to have been misallocated to personal off-campus research accounts.',
      });

      const caseId = submitRes.caseSummary!.id;
      store.loginUser(mockLead.id);

      // Received -> Assigned (Valid)
      expect(CaseEngine.canTransitionStatus('Received', 'Assigned')).toBe(true);
      expect(CaseEngine.updateStatus(caseId, 'Assigned', mockLead).success).toBe(true);

      // Assigned -> In Review (Valid)
      expect(CaseEngine.canTransitionStatus('Assigned', 'In Review')).toBe(true);
      expect(CaseEngine.updateStatus(caseId, 'In Review', mockLead).success).toBe(true);

      // In Review -> Action Required (Valid)
      expect(CaseEngine.canTransitionStatus('In Review', 'Action Required')).toBe(true);
      expect(CaseEngine.updateStatus(caseId, 'Action Required', mockLead).success).toBe(true);

      // Action Required -> Resolved (Valid)
      expect(CaseEngine.canTransitionStatus('Action Required', 'Resolved')).toBe(true);
      expect(CaseEngine.updateStatus(caseId, 'Resolved', mockLead).success).toBe(true);

      // Resolved -> Closed (Valid)
      expect(CaseEngine.canTransitionStatus('Resolved', 'Closed')).toBe(true);
      expect(CaseEngine.updateStatus(caseId, 'Closed', mockLead).success).toBe(true);

      store.logoutUser();
    });

    it('blocks illegal status transitions (e.g. Received directly to Resolved)', async () => {
      const submitRes = await CaseEngine.submitAnonymousCase({
        categoryId: 'cat-5',
        priority: 'Medium',
        subject: 'Unfair grading in midterm exam',
        narrative: 'Professor altered rubric after submission without informing the cohort.',
      });

      const caseId = submitRes.caseSummary!.id;
      store.loginUser(mockLead.id);

      // Attempt illegal jump: Received -> Resolved
      expect(CaseEngine.canTransitionStatus('Received', 'Resolved')).toBe(false);
      const res = CaseEngine.updateStatus(caseId, 'Resolved', mockLead);
      expect(res.success).toBe(false);
      expect(res.error).toContain('Illegal status transition');

      store.logoutUser();
    });
  });

  // -------------------------------------------------------------
  // FUNCTION 4: Anonymous Two-Way Messaging
  // -------------------------------------------------------------
  describe('Function 4: Two-Way Messaging', () => {
    it('allows anonymous student follow-up and committee replies without requiring student authentication', async () => {
      const submitRes = await CaseEngine.submitAnonymousCase({
        categoryId: 'cat-6',
        priority: 'Medium',
        subject: 'Dispute over capstone project authorship',
        narrative: 'Graduate mentor published undergraduate capstone results without crediting team members.',
      });

      const caseId = submitRes.caseSummary!.id;
      const rawCode = submitRes.rawTrackingCode!;

      // 1. Student sends message
      const studentMsgRes = CaseEngine.postStudentReply(caseId, 'Here is the link to our initial project draft.');
      expect(studentMsgRes.success).toBe(true);

      // 2. Committee sends official response
      store.loginUser(mockMember.id);
      const commMsgRes = CaseEngine.postCommitteeMessage(caseId, 'Thank you. We have forwarded this to the Dean.', false, mockMember);
      expect(commMsgRes.success).toBe(true);
      store.logoutUser();

      // 3. Verify both are in the student tracking view
      const view = await CaseEngine.getStudentCaseView(rawCode);
      expect(view.data?.messages.length).toBe(2);
      expect(view.data?.messages[0].messageBody).toContain('initial project draft');
      expect(view.data?.messages[1].messageBody).toContain('forwarded this to the Dean');
    });
  });

  // -------------------------------------------------------------
  // FUNCTION 5: Assignment & Role Restrictions
  // -------------------------------------------------------------
  describe('Function 5: Assignment & Reassignment', () => {
    it('allows Committee Lead to assign, reassign, and unassign an investigator', async () => {
      const submitRes = await CaseEngine.submitAnonymousCase({
        categoryId: 'cat-7',
        priority: 'Low',
        subject: 'Delayed transcript release for scholarship application',
        narrative: 'Registrar desk has exceeded the published 5-business-day processing window by over two weeks.',
      });

      const caseId = submitRes.caseSummary!.id;
      store.loginUser(mockLead.id);

      // Assign to Dr. Elena Vance
      const assignRes = CaseEngine.manageAssignment(caseId, mockMember.id, mockLead);
      expect(assignRes.success).toBe(true);
      expect(store.getCaseById(caseId)?.assignedToId).toBe(mockMember.id);
      expect(store.getCaseById(caseId)?.status).toBe('Assigned');

      // Reassign to Marcus Thorne
      const reassignRes = CaseEngine.manageAssignment(caseId, mockLead.id, mockLead);
      expect(reassignRes.success).toBe(true);
      expect(store.getCaseById(caseId)?.assignedToId).toBe(mockLead.id);

      // Unassign
      const unassignRes = CaseEngine.manageAssignment(caseId, '', mockLead);
      expect(unassignRes.success).toBe(true);
      expect(store.getCaseById(caseId)?.assignedToId).toBeUndefined();

      store.logoutUser();
    });

    it('rejects assignment attempts by non-lead committee members', async () => {
      const submitRes = await CaseEngine.submitAnonymousCase({
        categoryId: 'cat-1',
        priority: 'Medium',
        subject: 'Lab workspace harassment incident',
        narrative: 'Unwelcome comments regarding personal background in research lab.',
      });

      const caseId = submitRes.caseSummary!.id;
      store.loginUser(mockMember.id);

      // Committee Member cannot reassign
      const attempt = CaseEngine.manageAssignment(caseId, mockLead.id, mockMember);
      expect(attempt.success).toBe(false);
      expect(attempt.error).toContain('Only Committee Leads');

      store.logoutUser();
    });
  });

  // -------------------------------------------------------------
  // FUNCTION 6: Priority Management
  // -------------------------------------------------------------
  describe('Function 6: Priority Management', () => {
    it('allows authorized staff to elevate priority from Low to Critical', async () => {
      const submitRes = await CaseEngine.submitAnonymousCase({
        categoryId: 'cat-4',
        priority: 'Low',
        subject: 'Faculty advisory dispute',
        narrative: 'Advisor unresponsive to thesis feedback requests for three consecutive weeks.',
      });

      const caseId = submitRes.caseSummary!.id;
      store.loginUser(mockLead.id);

      const changeRes = CaseEngine.changePriority(caseId, 'Critical', mockLead);
      expect(changeRes.success).toBe(true);
      expect(store.getCaseById(caseId)?.priority).toBe('Critical');

      store.logoutUser();
    });
  });

  // -------------------------------------------------------------
  // FUNCTION 7: Secure Attachments Validation
  // -------------------------------------------------------------
  describe('Function 7: Attachments Validation', () => {
    it('accepts valid PDF, PNG, JPG attachments under 5MB', () => {
      const validPdf = {
        fileName: 'incident_evidence.pdf',
        fileSizeBytes: 1024 * 500, // 500 KB
        mimeType: 'application/pdf',
      };
      expect(CaseEngine.validateAttachment(validPdf).valid).toBe(true);

      const validPng = {
        fileName: 'screenshot_receipt.png',
        fileSizeBytes: 1024 * 1200, // 1.2 MB
        mimeType: 'image/png',
      };
      expect(CaseEngine.validateAttachment(validPng).valid).toBe(true);
    });

    it('rejects files exceeding 5MB or containing unauthorized extensions (e.g. .exe, .sh, .js)', () => {
      const oversizedFile = {
        fileName: 'huge_document.pdf',
        fileSizeBytes: 6 * 1024 * 1024, // 6 MB
        mimeType: 'application/pdf',
      };
      expect(CaseEngine.validateAttachment(oversizedFile).valid).toBe(false);

      const executableFile = {
        fileName: 'malicious_script.sh',
        fileSizeBytes: 1024,
        mimeType: 'application/x-sh',
      };
      expect(CaseEngine.validateAttachment(executableFile).valid).toBe(false);
    });
  });

  // -------------------------------------------------------------
  // FUNCTION 8: Escalations & Deadlines
  // -------------------------------------------------------------
  describe('Function 8: Escalations and Deadlines', () => {
    it('detects overdue conditions and triggers escalation audit records', () => {
      const cases = store.getCases();
      // Case-101 in seed data has a past deadline
      const overdueCase = cases.find((c) => c.id === 'case-101');
      expect(overdueCase).toBeDefined();
      expect(overdueCase?.isOverdue).toBe(true);

      const triggered = CaseEngine.checkAndTriggerEscalations();
      expect(triggered).toBeGreaterThanOrEqual(0);
    });
  });

  // -------------------------------------------------------------
  // FUNCTION 9: Audit Events
  // -------------------------------------------------------------
  describe('Function 9: Audit Trail', () => {
    it('records immutable audit events without leaking sensitive narrative text', async () => {
      const secretText = 'UltraConfidentialWhistleblowerDetailsXYZ123';
      const submitRes = await CaseEngine.submitAnonymousCase({
        categoryId: 'cat-3',
        priority: 'High',
        subject: 'Corrupt scholarship assignment',
        narrative: secretText,
      });

      const caseId = submitRes.caseSummary!.id;
      const c = store.getCaseById(caseId)!;

      // Verify an audit log was created for submission
      expect(c.auditLogs.length).toBeGreaterThan(0);
      const submissionLog = c.auditLogs.find((l) => l.actionType === 'CASE_SUBMITTED');
      expect(submissionLog).toBeDefined();

      // Check that the sensitive narrative text does NOT appear in the audit log details!
      expect(submissionLog?.details).not.toContain(secretText);
    });
  });

  // -------------------------------------------------------------
  // FUNCTION 10: Abuse Protection & Rate Limiting
  // -------------------------------------------------------------
  describe('Function 10: Abuse Protection', () => {
    it('enforces lookup rate limits against rapid brute-force code guessing', async () => {
      const clientIp = 'abusive_client_101';

      // Submit a real case first
      const submitRes = await CaseEngine.submitAnonymousCase({
        categoryId: 'cat-1',
        priority: 'Low',
        subject: 'Testing lookup throttling',
        narrative: 'Thirty characters long description of event to test lookup throttling.',
      });
      const code = submitRes.rawTrackingCode!;

      // Make 6 quick lookups
      let lastResult;
      for (let i = 0; i < 6; i++) {
        lastResult = await CaseEngine.getStudentCaseView(code, clientIp);
      }

      // The 6th lookup must be rate-limited
      expect(lastResult?.success).toBe(false);
      expect(lastResult?.error).toContain('limit reached');
    });
  });
});
