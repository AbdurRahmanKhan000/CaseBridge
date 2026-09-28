/**
 * CaseBridge Stage 8 Integration & Workflow Tests
 * Tests complete end-to-end whistleblower journeys and committee lifecycles.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CaseEngine } from '../src/services/caseEngine';
import { store } from '../src/services/store';
import { User, CasePriority, CaseStatus } from '../src/types';

describe('Integration Workflows: Whistleblower & Committee Lifecycles', () => {
  beforeEach(() => {
    store.resetToFactoryDefaults();
  });

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

  it('executes a complete end-to-end whistleblower lifecycle with zero identity exposure', async () => {
    // 1. Submit Anonymous Complaint
    const submission = await CaseEngine.submitAnonymousCase({
      categoryId: 'cat-1', // Harassment
      priority: 'High',
      subject: 'Lab Supervisor Repeated Unprofessional Conduct',
      narrative: 'During bi-weekly research meetings, the lab supervisor has repeatedly engaged in verbal harassment and threatened to withhold thesis signoffs without cause.',
      location: 'Science Building East, Lab 304',
      incidentDate: '2026-09-20',
      attachments: [
        {
          fileName: 'meeting_minutes_excerpt.pdf',
          fileSizeBytes: 204800,
          mimeType: 'application/pdf',
        },
      ],
    });

    expect(submission.success).toBe(true);
    expect(submission.rawTrackingCode).toBeDefined();
    const trackingCode = submission.rawTrackingCode!;
    expect(trackingCode).toMatch(/^CB-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);

    const createdCase = store.getCases().find(c => c.trackingCode === trackingCode)!;
    expect(createdCase).toBeDefined();
    expect(createdCase.status).toBe('Received');
    expect(createdCase.attachments.length).toBe(1);

    // 2. Student Tracking Lookup
    const studentView = await CaseEngine.lookupCaseByCode(trackingCode);
    expect(studentView.success).toBe(true);
    expect(studentView.data).toBeDefined();
    expect(studentView.data?.trackingCode).toBe(trackingCode);
    expect(studentView.data?.status).toBe('Received');
    // Ensure zero ID exposure:
    expect((studentView.data as any).id).toBeUndefined();
    expect((studentView.data as any).assignedToId).toBeUndefined();

    // 3. Committee Lead assigns case to Committee Member
    const assignResult = CaseEngine.manageAssignment(createdCase.id, mockMember.id, mockLead);
    expect(assignResult.success).toBe(true);

    const afterAssign = store.getCaseById(createdCase.id)!;
    expect(afterAssign.assignedToId).toBe(mockMember.id);
    expect(afterAssign.assignedToName).toBe(mockMember.fullName);
    expect(afterAssign.status).toBe('Assigned');

    // 4. Assigned Member moves case to In Review
    (store as any).currentUser = mockMember;
    const reviewStatusOk = store.updateCaseStatus(createdCase.id, 'In Review');
    expect(reviewStatusOk).toBe(true);
    expect(store.getCaseById(createdCase.id)?.status).toBe('In Review');

    // 5. Committee Member sends official response to student requesting clarification
    const msgOk = store.addCommitteeMessage(
      createdCase.id,
      'The Ethics Committee has initiated an inquiry. Could you specify if other researchers were present during the incident?',
      false // public to student
    );
    expect(msgOk).toBe(true);

    // 6. Committee Member adds private internal note (shielded from student)
    const noteOk = store.addCommitteeMessage(
      createdCase.id,
      'Consulted Department Chair Dr. Patel. Will review previous complaints from 2025.',
      true // internal note
    );
    expect(noteOk).toBe(true);

    // 7. Student checks case and responds
    const studentCheck = await CaseEngine.lookupCaseByCode(trackingCode);
    expect(studentCheck.data?.messages.length).toBe(1);
    expect(studentCheck.data?.messages[0].messageBody).toContain('initiated an inquiry');
    // Verify internal note is shielded:
    const hasInternalNote = studentCheck.data?.messages.some(m => m.messageBody.includes('Dr. Patel'));
    expect(hasInternalNote).toBe(false);

    // Student replies
    const studentReplyOk = store.addStudentMessage(
      createdCase.id,
      'Yes, two graduate research assistants were present during the September 20th lab meeting.'
    );
    expect(studentReplyOk).toBe(true);

    // 8. Committee Member documents findings and transitions to Resolved
    const resolveOk = store.updateCaseStatus(createdCase.id, 'Resolved');
    expect(resolveOk).toBe(true);

    const resolvedCase = store.getCaseById(createdCase.id)!;
    expect(resolvedCase.status).toBe('Resolved');
    expect(resolvedCase.resolvedAt).toBeDefined();

    // 9. Committee Lead formally closes and archives the case
    (store as any).currentUser = mockLead;
    const closeOk = store.updateCaseStatus(createdCase.id, 'Closed');
    expect(closeOk).toBe(true);

    const closedCase = store.getCaseById(createdCase.id)!;
    expect(closedCase.status).toBe('Closed');

    // 10. Verify post-resolution audit trail integrity
    expect(closedCase.auditLogs.length).toBeGreaterThanOrEqual(6);
    const actions = closedCase.auditLogs.map(a => a.actionType);
    expect(actions).toContain('CASE_SUBMITTED');
    expect(actions).toContain('ASSIGNMENT_UPDATED');
    expect(actions).toContain('STATUS_UPDATED');
    expect(actions).toContain('COMMITTEE_MESSAGE_SENT');
    expect(actions).toContain('INTERNAL_NOTE_ADDED');
    expect(actions).toContain('STUDENT_MESSAGE_SENT');
  });

  it('handles SLA escalation flow when resolution target date has passed', async () => {
    // Submit case with critical SLA
    const submission = await CaseEngine.submitAnonymousCase({
      categoryId: 'cat-3', // Corruption
      priority: 'Critical',
      subject: 'Improper Financial Coercion for Exam Passing Grades',
      narrative: 'Demands for cash contributions to a private account in exchange for passing final evaluation marks.',
    });

    const c = store.getCases().find(x => x.trackingCode === submission.rawTrackingCode)!;
    expect(c.isOverdue).toBe(false);

    // Artificially backdate the deadline to simulate an overdue condition
    c.deadlineAt = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(); // 48 hours ago
    store.refreshOverdueStates();

    // Verify overdue status triggers
    const updated = store.getCaseById(c.id)!;
    expect(updated.isOverdue).toBe(true);

    // Verify tracking view reflects the overdue escalation status
    const studentView = await CaseEngine.lookupCaseByCode(submission.rawTrackingCode!);
    expect(studentView.data?.isOverdue).toBe(true);

    // Committee Lead re-assigns and resolves the case
    CaseEngine.manageAssignment(c.id, mockMember.id, mockLead);
    (store as any).currentUser = mockLead;
    store.updateCaseStatus(c.id, 'Resolved');

    // Once resolved, isOverdue flag is deactivated for resolution compliance
    const resolved = store.getCaseById(c.id)!;
    expect(resolved.status).toBe('Resolved');
  });
});
