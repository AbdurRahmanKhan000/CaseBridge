import { describe, it, expect, beforeEach } from 'vitest';
import { CaseEngine } from '../src/services/caseEngine';
import { store } from '../src/services/store';
import { resetRateLimits, sanitizeInput, generateTrackingCode, hashTrackingCode } from '../src/services/security';
import { User } from '../src/types';

describe('CaseBridge Security Hardening Test Suite (Stage 6)', () => {
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
  // THREAT 1 & 14: Case Disclosure & Insecure Direct Object References
  // -------------------------------------------------------------
  describe('Threat 1 & 14: Case Disclosure & IDOR Resistance', () => {
    it('shields internal integer IDs, confidential notes, and staff credentials from student tracking view', async () => {
      const submitRes = await CaseEngine.submitAnonymousCase({
        categoryId: 'cat-1',
        priority: 'High',
        subject: 'Confidential investigation request',
        narrative: 'A detailed narrative meeting the thirty character minimum requirement.',
      });
      const rawCode = submitRes.rawTrackingCode!;
      const caseId = submitRes.caseSummary!.id;

      // Add a confidential note and an official message
      store.loginUser(mockMember.id);
      CaseEngine.postCommitteeMessage(caseId, 'Official Inquiry for Complainant', false, mockMember);
      CaseEngine.postCommitteeMessage(caseId, 'INTERNAL CLASSIFIED NOTE: Accused faculty interviewed.', true, mockMember);
      store.logoutUser();

      const studentView = await CaseEngine.getStudentCaseView(rawCode);
      expect(studentView.success).toBe(true);
      const data = studentView.data!;

      // 1. Must not leak internal database primary key or assigned user identity
      expect((data as any).id).toBeUndefined();
      expect((data as any).assignedToId).toBeUndefined();
      expect((data as any).assignedToName).toBeUndefined();

      // 2. Must not reveal confidential internal notes
      const bodies = data.messages.map((m) => m.messageBody);
      expect(bodies.some((b) => b.includes('Official Inquiry'))).toBe(true);
      expect(bodies.some((b) => b.includes('INTERNAL CLASSIFIED NOTE'))).toBe(false);

      // 3. Must not reveal staff private email or department credentials
      const senderNames = data.messages.map((m) => m.senderName);
      expect(senderNames.some((n) => n.includes('@university.edu'))).toBe(false);
    });
  });

  // -------------------------------------------------------------
  // THREAT 2: Tracking Code Guessing & Enumeration Resistance
  // -------------------------------------------------------------
  describe('Threat 2: Tracking Code Guessing & Entropy', () => {
    it('produces high-entropy non-sequential tracking codes without ambiguous characters', () => {
      const generated = new Set<string>();
      const ambiguousChars = ['0', 'O', '1', 'I'];

      for (let i = 0; i < 100; i++) {
        const code = generateTrackingCode();
        expect(code).toMatch(/^CB-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
        for (const char of ambiguousChars) {
          expect(code).not.toContain(char);
        }
        generated.add(code);
      }
      expect(generated.size).toBe(100);
    });

    it('enforces lockout throttling after repeated failed tracking lookups', async () => {
      const attackerClient = 'brute_force_scanner_ip';

      // 5 failed lookup queries
      for (let i = 0; i < 5; i++) {
        const res = await CaseEngine.getStudentCaseView('CB-9999-9999-9999', attackerClient);
        expect(res.success).toBe(false);
      }

      // The 6th attempt must be blocked by rate limit
      const blockedRes = await CaseEngine.getStudentCaseView('CB-9999-9999-9999', attackerClient);
      expect(blockedRes.success).toBe(false);
      expect(blockedRes.error).toContain('limit reached');
      expect(blockedRes.retryAfter).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------
  // THREAT 3 & 4: Unauthorized Staff Access & Privilege Escalation
  // -------------------------------------------------------------
  describe('Threat 3 & 4: Staff Access & Privilege Escalation', () => {
    it('prevents standard committee members from performing Lead-only reassignments', async () => {
      const submitRes = await CaseEngine.submitAnonymousCase({
        categoryId: 'cat-2',
        priority: 'Medium',
        subject: 'Investigation into bullying allegations',
        narrative: 'A thirty character minimum statement detailing inappropriate bullying actions.',
      });
      const caseId = submitRes.caseSummary!.id;

      // Regular member attempts to reassign case to another user
      const unauthorizedAssign = CaseEngine.manageAssignment(caseId, mockLead.id, mockMember);
      expect(unauthorizedAssign.success).toBe(false);
      expect(unauthorizedAssign.error).toContain('Only Committee Leads');

      // Lead is authorized
      const authorizedAssign = CaseEngine.manageAssignment(caseId, mockMember.id, mockLead);
      expect(authorizedAssign.success).toBe(true);
    });
  });

  // -------------------------------------------------------------
  // THREAT 6: Cross-Site Scripting (XSS) Sanitization
  // -------------------------------------------------------------
  describe('Threat 6: Cross-Site Scripting (XSS) Prevention', () => {
    it('escapes dangerous HTML tags and script injections', () => {
      const maliciousPayload = '<script>alert("XSS")</script><img src="x" onerror="evil()" />';
      const sanitized = sanitizeInput(maliciousPayload);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('&lt;script&gt;');
      expect(sanitized).toContain('&lt;img');
      expect(sanitized).toContain('&quot;');
    });

    it('sanitizes malicious input upon anonymous submission', async () => {
      const xssSubject = '<script>fetch("/steal")</script>Grade dispute';
      const submitRes = await CaseEngine.submitAnonymousCase({
        categoryId: 'cat-5',
        priority: 'Low',
        subject: xssSubject,
        narrative: 'A safe incident description with more than thirty valid characters.',
      });

      expect(submitRes.success).toBe(true);
      const retrieved = store.getCaseById(submitRes.caseSummary!.id);
      expect(retrieved?.subject).not.toContain('<script>');
      expect(retrieved?.subject).toContain('&lt;script&gt;');
    });
  });

  // -------------------------------------------------------------
  // THREAT 9 & 15: Malicious File Uploads & Path Traversal
  // -------------------------------------------------------------
  describe('Threat 9 & 15: Malicious File Uploads & Path Traversal Prevention', () => {
    it('rejects path traversal attempts in uploaded filenames (e.g. ../../etc/passwd)', () => {
      const traversalAttachment = {
        fileName: '../../../../etc/passwd.pdf',
        fileSizeBytes: 2048,
        mimeType: 'application/pdf',
      };
      const res = CaseEngine.validateAttachment(traversalAttachment);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('path traversal');
    });

    it('rejects executable and script files regardless of claimed content', () => {
      const maliciousFiles = [
        { fileName: 'payload.exe', fileSizeBytes: 1024, mimeType: 'application/x-msdownload' },
        { fileName: 'exploit.sh', fileSizeBytes: 1024, mimeType: 'application/x-sh' },
        { fileName: 'backdoor.php', fileSizeBytes: 1024, mimeType: 'application/x-php' },
        { fileName: 'script.js', fileSizeBytes: 1024, mimeType: 'application/javascript' },
      ];

      for (const file of maliciousFiles) {
        const res = CaseEngine.validateAttachment(file);
        expect(res.valid).toBe(false);
      }
    });

    it('rejects MIME type mismatches and oversized uploads', () => {
      // PDF extension with untrusted HTML mime type
      const mimeMismatch = {
        fileName: 'report.pdf',
        fileSizeBytes: 2048,
        mimeType: 'text/html',
      };
      expect(CaseEngine.validateAttachment(mimeMismatch).valid).toBe(false);

      // Oversized >5MB
      const oversized = {
        fileName: 'huge.pdf',
        fileSizeBytes: 5 * 1024 * 1024 + 1,
        mimeType: 'application/pdf',
      };
      expect(CaseEngine.validateAttachment(oversized).valid).toBe(false);
    });
  });

  // -------------------------------------------------------------
  // THREAT 11 & 12: Sensitive Data Leakage in Logs & Audit Events
  // -------------------------------------------------------------
  describe('Threat 11 & 12: Sensitive Data Leakage in Audit Trail', () => {
    it('preserves privacy by omitting sensitive narrative from audit logs', async () => {
      const secretWhistleblowerDetail = 'TopSecretWhistleblowerIdentityPayload999';
      const submitRes = await CaseEngine.submitAnonymousCase({
        categoryId: 'cat-3',
        priority: 'High',
        subject: 'Financial misappropriation',
        narrative: `Narrative containing ${secretWhistleblowerDetail} for thirty characters minimum requirement.`,
      });

      const c = store.getCaseById(submitRes.caseSummary!.id)!;
      for (const log of c.auditLogs) {
        expect(log.details).not.toContain(secretWhistleblowerDetail);
      }
    });
  });

  // -------------------------------------------------------------
  // THREAT 10: Excessive Automated Submissions
  // -------------------------------------------------------------
  describe('Threat 10: Input Boundary Validation', () => {
    it('rejects oversized narrative payloads exceeding 10,000 characters', async () => {
      const hugeNarrative = 'A'.repeat(10001);
      const res = await CaseEngine.submitAnonymousCase({
        categoryId: 'cat-1',
        priority: 'Medium',
        subject: 'Title',
        narrative: hugeNarrative,
      });

      expect(res.success).toBe(false);
      expect(res.errors?.narrative).toContain('maximum allowed length');
    });
  });
});
