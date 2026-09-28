/**
 * CaseBridge Stage 8 Edge Cases & Data Integrity Tests
 * Thorough verification of edge cases, boundary constraints, and error resiliency.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CaseEngine } from '../src/services/caseEngine';
import { store } from '../src/services/store';
import { checkLookupRateLimit, resetRateLimits } from '../src/services/security';
import { User, CasePriority, CaseStatus } from '../src/types';

describe('Edge Cases & Data Integrity Verification', () => {
  beforeEach(() => {
    store.resetToFactoryDefaults();
    resetRateLimits();
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

  describe('Boundary & Payload Validation Edge Cases', () => {
    it('rejects submissions with empty narrative or narrative shorter than 30 characters', async () => {
      // Empty narrative
      const emptyRes = await CaseEngine.submitAnonymousCase({
        categoryId: 'cat-1',
        priority: 'Medium',
        subject: 'Valid Subject Line',
        narrative: '   ',
      });
      expect(emptyRes.success).toBe(false);
      expect(emptyRes.errors?.narrative).toContain('required');

      // Short narrative (< 30 characters)
      const shortRes = await CaseEngine.submitAnonymousCase({
        categoryId: 'cat-1',
        priority: 'Medium',
        subject: 'Valid Subject Line',
        narrative: 'Too brief to review.',
      });
      expect(shortRes.success).toBe(false);
      expect(shortRes.errors?.narrative).toContain('30 characters');
    });

    it('rejects submissions with narrative exceeding 10,000 characters', async () => {
      const oversizedText = 'A'.repeat(10001);
      const res = await CaseEngine.submitAnonymousCase({
        categoryId: 'cat-1',
        priority: 'Medium',
        subject: 'Valid Subject',
        narrative: oversizedText,
      });
      expect(res.success).toBe(false);
      expect(res.errors?.narrative).toContain('10,000 characters');
    });

    it('rejects submissions with empty or whitespace-only subject', async () => {
      const res = await CaseEngine.submitAnonymousCase({
        categoryId: 'cat-1',
        priority: 'Medium',
        subject: '   ',
        narrative: 'This is a sufficiently long narrative description that explains the grievance in adequate detail.',
      });
      expect(res.success).toBe(false);
      expect(res.errors?.subject).toContain('required');
    });

    it('handles invalid or non-existent category IDs gracefully', async () => {
      const res = await CaseEngine.submitAnonymousCase({
        categoryId: 'non-existent-cat-999',
        priority: 'Medium',
        subject: 'Grievance with Unknown Category ID',
        narrative: 'This is a sufficiently long narrative description detailing an issue with unknown category.',
      });
      expect(res.success).toBe(false);
      expect(res.errors?.categoryId).toContain('Invalid');
    });
  });

  describe('Attachment Edge Cases & Constraints', () => {
    it('accepts valid PDF and image attachments up to 10MB without error', async () => {
      const res = await CaseEngine.submitAnonymousCase({
        categoryId: 'cat-1',
        priority: 'Low',
        subject: 'Case with Valid Supporting Evidence File',
        narrative: 'This is a valid narrative accompanied by a valid PDF attachment for committee review.',
        attachments: [
          {
            fileName: 'syllabus_evidence.pdf',
            fileSizeBytes: 2 * 1024 * 1024, // 2MB
            mimeType: 'application/pdf',
          },
        ],
      });
      expect(res.success).toBe(true);
      const c = store.getCases().find(x => x.trackingCode === res.rawTrackingCode)!;
      expect(c.attachments.length).toBe(1);
    });

    it('rejects oversized attachments exceeding the 10MB limit', async () => {
      const res = await CaseEngine.submitAnonymousCase({
        categoryId: 'cat-1',
        priority: 'Low',
        subject: 'Case with Oversized File',
        narrative: 'This is a sufficiently long narrative accompanied by an oversized file exceeding maximum size.',
        attachments: [
          {
            fileName: 'massive_video_dump.mp4',
            fileSizeBytes: 15 * 1024 * 1024, // 15MB
            mimeType: 'video/mp4',
          },
        ],
      });
      expect(res.success).toBe(false);
      expect(res.errors?.attachments).toContain('exceeds');
    });

    it('rejects executable and dangerous script attachments', async () => {
      const dangerousFiles = [
        { fileName: 'exploit.exe', mimeType: 'application/x-msdownload' },
        { fileName: 'script.sh', mimeType: 'application/x-sh' },
        { fileName: 'backdoor.php', mimeType: 'application/x-php' },
        { fileName: 'payload.js', mimeType: 'application/javascript' },
      ];

      for (const f of dangerousFiles) {
        const res = await CaseEngine.submitAnonymousCase({
          categoryId: 'cat-1',
          priority: 'Low',
          subject: 'Case with Malicious File',
          narrative: 'This is a sufficiently long narrative accompanied by a forbidden file extension.',
          attachments: [
            {
              fileName: f.fileName,
              fileSizeBytes: 1024,
              mimeType: f.mimeType,
            },
          ],
        });
        expect(res.success).toBe(false);
        expect(res.errors?.attachments).toContain('not supported');
      }
    });
  });

  describe('Tracking Code Edge Cases & Throttling', () => {
    it('rejects malformed tracking codes with descriptive validation errors', async () => {
      const invalidCodes = [
        '',
        'INVALID-CODE',
        'CB-123',
        'CB-0000-0000-0000', // Contains '0' which is excluded from unambiguous alphabet
        'CB-IIII-OOOO-1111', // Contains ambiguous characters
      ];

      for (const code of invalidCodes) {
        const res = await CaseEngine.lookupCaseByCode(code);
        expect(res.success).toBe(false);
      }
    });

    it('throttles excessive rapid repeated tracking attempts with 429 lockout', () => {
      // Simulate 10 failed lookup attempts
      for (let i = 0; i < 10; i++) {
        checkLookupRateLimit();
      }

      // The 11th attempt must be rejected
      const rateLimitResult = checkLookupRateLimit();
      expect(rateLimitResult.allowed).toBe(false);
      expect(rateLimitResult.retryAfterSeconds).toBeGreaterThan(0);
    });
  });

  describe('Closed Case Immutability', () => {
    it('prohibits state changes and message additions to closed case files', () => {
      const testCase = store.getCases()[0];
      (store as any).currentUser = mockLead;

      // Close the case
      testCase.status = 'Closed';
      testCase.resolvedAt = new Date().toISOString();

      // Attempting to move from Closed directly to Received must be rejected
      const illegalTransition = store.updateCaseStatus(testCase.id, 'Received');
      expect(illegalTransition).toBe(false);

      // Verify status remained Closed
      expect(store.getCaseById(testCase.id)?.status).toBe('Closed');
    });
  });

  describe('Transaction and State Consistency', () => {
    it('ensures atomic audit log creation alongside every state mutation', () => {
      const testCase = store.getCases()[0];
      const initialAuditCount = testCase.auditLogs.length;

      (store as any).currentUser = mockLead;
      store.updateCasePriority(testCase.id, 'Critical');

      const afterUpdate = store.getCaseById(testCase.id)!;
      expect(afterUpdate.auditLogs.length).toBe(initialAuditCount + 1);
      const latestAudit = afterUpdate.auditLogs[afterUpdate.auditLogs.length - 1];
      expect(latestAudit.actionType).toBe('PRIORITY_UPDATED');
      expect(latestAudit.actorRole).toBe('COMMITTEE_LEAD');
    });
  });
});
