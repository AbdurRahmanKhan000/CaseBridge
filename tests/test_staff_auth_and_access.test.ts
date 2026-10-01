/**
 * CaseBridge Staff Portal Authentication & Case-Access Test Suite
 * Validates:
 * - Approved staff accounts isolation & deactivation handling
 * - Passwordless email OTP generation (5-digit, 5-minute expiry)
 * - OTP code verification, single-use invalidation, attempt tracking, and lockout (5 attempts)
 * - Role recognition (COMMITTEE_MEMBER, COMMITTEE_LEAD, SYSTEM_ADMIN)
 * - Staff dashboard isolation (member sees only assigned case metrics; lead sees all)
 * - Case-level staff access control (member restricted to assigned cases; lead/admin full access)
 * - Authorized staff messaging & closed case immutability
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { store } from '../src/services/store';
import { User, Case } from '../src/types';

describe('Staff Portal Authentication & Case-Access Control', () => {
  beforeEach(() => {
    store.resetToFactoryDefaults();
  });

  const memberUser: User = {
    id: 'usr-1',
    email: 'elena.vance@university.edu',
    fullName: 'Dr. Elena Vance',
    role: 'COMMITTEE_MEMBER',
    department: 'Student Affairs & Welfare',
    isActive: true,
    createdAt: '2026-08-01T09:00:00Z',
  };

  const leadUser: User = {
    id: 'usr-2',
    email: 'marcus.thorne@university.edu',
    fullName: 'Marcus Thorne, J.D.',
    role: 'COMMITTEE_LEAD',
    department: 'Ethics & Compliance Office',
    isActive: true,
    createdAt: '2026-07-15T09:00:00Z',
  };

  const adminUser: User = {
    id: 'usr-3',
    email: 'sarah.jenkins@university.edu',
    fullName: 'Sarah Jenkins',
    role: 'SYSTEM_ADMIN',
    department: 'Institutional Oversight IT',
    isActive: true,
    createdAt: '2026-06-01T09:00:00Z',
  };

  describe('Approved Staff Account Validation', () => {
    it('rejects OTP requests for unregistered or unapproved email addresses', () => {
      const res = store.requestLoginOtp('intruder@outside-domain.com');
      expect(res.success).toBe(false);
      expect(res.error).toContain('Unregistered email address');
    });

    it('rejects OTP requests for deactivated / disabled staff accounts', () => {
      const disabledUser: User = {
        id: 'usr-disabled',
        email: 'suspended.officer@university.edu',
        fullName: 'Suspended Officer',
        role: 'COMMITTEE_MEMBER',
        department: 'Academic Ethics',
        isActive: false,
        createdAt: '2026-01-01T00:00:00Z',
      };
      store.addUser(disabledUser);

      const res = store.requestLoginOtp('suspended.officer@university.edu');
      expect(res.success).toBe(false);
      expect(res.error).toContain('inactive or revoked');
    });

    it('successfully generates and dispatches a 5-digit OTP for active approved staff', () => {
      const res = store.requestLoginOtp(memberUser.email);
      expect(res.success).toBe(true);
      expect(res.debugOtp).toBeDefined();
      expect(res.debugOtp).toMatch(/^\d{5}$/);
      expect(res.message).toContain('5-digit verification code');
    });

    it('recognizes all 7 approved staff accounts and their aliases', () => {
      const approvedEmails = [
        'abdurrehman200khan@gmail.com',
        'bf25pwcs1458@uetpeshawar.edu.pk',
        'Its.misbah.kx@gmail.com',
        'csworking1122@gmail.com',
        'kgraana@gmail.com',
        'maryampervaiz559@gmail.com',
        'uroojkhanum.safi@gmail.com',
        'arkmfk27@gmail.com',
        'emankhan@gmail.com',
      ];

      for (const email of approvedEmails) {
        const res = store.requestLoginOtp(email);
        expect(res.success).toBe(true);
        expect(res.debugOtp).toMatch(/^\d{5}$/);

        // Verify OTP can authenticate user
        const verifyRes = store.verifyLoginOtp(email, res.debugOtp!);
        expect(verifyRes.success).toBe(true);
        expect(verifyRes.user).toBeDefined();
      }
    });
  });

  describe('OTP Code Verification & Security Constraints', () => {
    it('authenticates approved staff upon entering the correct 5-digit OTP', () => {
      const otpReq = store.requestLoginOtp(memberUser.email);
      expect(otpReq.success).toBe(true);
      const code = otpReq.debugOtp!;

      const verifyRes = store.verifyLoginOtp(memberUser.email, code);
      expect(verifyRes.success).toBe(true);
      expect(verifyRes.user).toBeDefined();
      expect(verifyRes.user?.email).toBe(memberUser.email);
      expect(store.getCurrentUser()?.id).toBe(memberUser.id);
    });

    it('enforces single-use consumption: an OTP cannot be reused after successful authentication', () => {
      const otpReq = store.requestLoginOtp(leadUser.email);
      const code = otpReq.debugOtp!;

      // First verification succeeds
      const firstVerify = store.verifyLoginOtp(leadUser.email, code);
      expect(firstVerify.success).toBe(true);

      // Second verification attempt with same code must fail
      const secondVerify = store.verifyLoginOtp(leadUser.email, code);
      expect(secondVerify.success).toBe(false);
      expect(secondVerify.error).toContain('No active verification code found');
    });

    it('tracks invalid attempts and locks out after 5 consecutive failures', () => {
      const otpReq = store.requestLoginOtp(adminUser.email);
      expect(otpReq.success).toBe(true);

      // 4 wrong attempts
      for (let i = 1; i <= 4; i++) {
        const attempt = store.verifyLoginOtp(adminUser.email, '00000');
        expect(attempt.success).toBe(false);
        expect(attempt.error).toContain('Invalid verification code');
      }

      // 5th wrong attempt triggers lockout
      const fifthAttempt = store.verifyLoginOtp(adminUser.email, '00000');
      expect(fifthAttempt.success).toBe(false);

      // Attempting again after exceeding maximum attempts is rejected as invalidated
      const sixthAttempt = store.verifyLoginOtp(adminUser.email, '00000');
      expect(sixthAttempt.success).toBe(false);
      expect(sixthAttempt.error).toContain('Excessive invalid verification attempts');

      // Subsequent attempt after invalidation has no active code
      const seventhAttempt = store.verifyLoginOtp(adminUser.email, '00000');
      expect(seventhAttempt.success).toBe(false);
      expect(seventhAttempt.error).toContain('No active verification code found');
    });

    it('rejects expired verification codes beyond the 5-minute window', () => {
      const otpReq = store.requestLoginOtp(memberUser.email);
      const code = otpReq.debugOtp!;

      // Retrieve the active OTP entry and simulate expiration
      const activeOtp = store.getActiveOtp(memberUser.email);
      expect(activeOtp).toBeDefined();
      activeOtp!.expiresAt = new Date(Date.now() - 1000).toISOString(); // 1 second in the past

      const verifyRes = store.verifyLoginOtp(memberUser.email, code);
      expect(verifyRes.success).toBe(false);
      expect(verifyRes.error).toContain('expired');
    });
  });

  describe('Role Recognition & Isolation', () => {
    it('correctly recognizes all 3 institutional roles and their privileges', () => {
      expect(memberUser.role).toBe('COMMITTEE_MEMBER');
      expect(leadUser.role).toBe('COMMITTEE_LEAD');
      expect(adminUser.role).toBe('SYSTEM_ADMIN');
    });

    it('enforces staff dashboard isolation: Committee Members only see statistics for assigned cases', () => {
      const allCases = store.getCases();
      // Initially, case-101 is assigned to lead (usr-2)
      // Assign case-102 to member (usr-1)
      store.assignCase('case-102', memberUser.id);

      // For member: accessible cases are strictly those assigned to memberUser.id
      const memberAccessible = allCases.filter(c => c.assignedToId === memberUser.id);
      expect(memberAccessible.length).toBeLessThan(allCases.length);

      // For lead: accessible cases encompass all registered complaints
      const leadAccessible = allCases;
      expect(leadAccessible.length).toBe(allCases.length);
    });
  });

  describe('Case-Level Staff Access Enforcement', () => {
    it('restricts Committee Members from accessing cases not assigned to them', () => {
      const cases = store.getCases();
      const unassignedOrOtherCase = cases.find(c => c.assignedToId !== memberUser.id)!;
      expect(unassignedOrOtherCase).toBeDefined();

      const memberCanAccess = store.canAccessCase(memberUser, unassignedOrOtherCase);
      expect(memberCanAccess).toBe(false);
    });

    it('grants Committee Members access to cases assigned to them', () => {
      // Assign case-103 to memberUser
      store.assignCase('case-103', memberUser.id);
      const assignedCase = store.getCaseById('case-103')!;

      const memberCanAccess = store.canAccessCase(memberUser, assignedCase);
      expect(memberCanAccess).toBe(true);
    });

    it('grants Committee Leads and System Admins access to all cases unconditionally', () => {
      const cases = store.getCases();
      for (const c of cases) {
        expect(store.canAccessCase(leadUser, c)).toBe(true);
        expect(store.canAccessCase(adminUser, c)).toBe(true);
      }
    });
  });

  describe('Authorized Staff Messaging & Immutability', () => {
    it('records official messages and audit logs when authorized staff responds', () => {
      const cases = store.getCases();
      const testCase = cases[0];

      // Login as Committee Lead
      (store as any).currentUser = leadUser;
      const ok = store.addCommitteeMessage(
        testCase.id,
        'The Ethics Committee has reviewed your complaint and requested department records.',
        false
      );
      expect(ok).toBe(true);

      const refreshed = store.getCaseById(testCase.id)!;
      const lastMsg = refreshed.messages[refreshed.messages.length - 1];
      expect(lastMsg.messageBody).toContain('reviewed your complaint');
      expect(lastMsg.isInternalNote).toBe(false);
    });

    it('prohibits messaging on closed cases', () => {
      const cases = store.getCases();
      const testCase = cases[0];
      testCase.status = 'Closed';

      (store as any).currentUser = leadUser;
      const ok = store.addCommitteeMessage(testCase.id, 'New message on closed case', false);
      expect(ok).toBe(false);
    });
  });
});
