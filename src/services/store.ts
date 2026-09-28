/**
 * CaseBridge In-Memory / LocalStorage State Store
 */

import { Case, Category, User, CaseAuditLog, SystemSettings, CasePriority, CaseStatus } from '../types';
import { generateTrackingCode, hashTrackingCode } from './security';

const STORAGE_KEY_PREFIX = 'casebridge_data_v1';

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Harassment', description: 'Unwanted verbal, physical, sexual, or visual conduct violating dignity.', slaDays: 3, isActive: true },
  { id: 'cat-2', name: 'Bullying', description: 'Persistent intimidation, humiliation, or psychological distress by peers or faculty.', slaDays: 5, isActive: true },
  { id: 'cat-3', name: 'Corruption', description: 'Misuse of authority, bribery, financial fraud, or grade altering for favors.', slaDays: 5, isActive: true },
  { id: 'cat-4', name: 'Discrimination', description: 'Unfavorable treatment based on race, gender, disability, religion, or origin.', slaDays: 5, isActive: true },
  { id: 'cat-5', name: 'Unfair Treatment', description: 'Arbitrary grading, procedural bias, or violation of student handbook policies.', slaDays: 7, isActive: true },
  { id: 'cat-6', name: 'Academic Issue', description: 'Plagiarism disputes, exam misconduct allegations, or advisor neglect.', slaDays: 7, isActive: true },
  { id: 'cat-7', name: 'Administrative Issue', description: 'Fee mismanagement, enrollment obstacles, or delayed transcript services.', slaDays: 10, isActive: true },
  { id: 'cat-8', name: 'Other', description: 'Other institutional grievances not captured in predefined categories.', slaDays: 7, isActive: true },
];

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-1',
    email: 'elena.vance@university.edu',
    fullName: 'Dr. Elena Vance',
    role: 'COMMITTEE_MEMBER',
    department: 'Student Affairs & Welfare',
    isActive: true,
    createdAt: '2026-08-01T09:00:00Z',
    lastLoginAt: '2026-09-24T06:30:00Z',
  },
  {
    id: 'usr-2',
    email: 'marcus.thorne@university.edu',
    fullName: 'Marcus Thorne, J.D.',
    role: 'COMMITTEE_LEAD',
    department: 'Ethics & Compliance Office',
    isActive: true,
    createdAt: '2026-07-15T09:00:00Z',
    lastLoginAt: '2026-09-24T07:15:00Z',
  },
  {
    id: 'usr-3',
    email: 'sarah.jenkins@university.edu',
    fullName: 'Sarah Jenkins',
    role: 'SYSTEM_ADMIN',
    department: 'Institutional Oversight IT',
    isActive: true,
    createdAt: '2026-06-01T09:00:00Z',
    lastLoginAt: '2026-09-24T07:30:00Z',
  },
];

export const INITIAL_SETTINGS: SystemSettings = {
  institutionName: 'Metropolitan University Integrity & Case Office',
  supportEmail: 'integrity-helpdesk@university.edu',
  emergencyPhone: '555-0199',
  dataRetentionDays: 180,
  slaDaysLow: 14,
  slaDaysMedium: 7,
  slaDaysHigh: 3,
  slaDaysCriticalHours: 24,
  allowFileUploads: true,
  maxUploadSizeBytes: 5 * 1024 * 1024, // 5MB
};

// Seed Cases
export const INITIAL_CASES: Case[] = [
  {
    id: 'case-101',
    trackingCode: 'CB-9K2M-4F8X-7R3A',
    codeHash: 'hash_demo_101',
    categoryId: 'cat-4',
    categoryName: 'Discrimination',
    priority: 'Critical',
    status: 'In Review',
    subject: 'Systematic exclusion from lab research project funding',
    narrative: 'A departmental coordinator has repeatedly denied laboratory project allocations to minority postgraduate students, stating informal preference for particular alumni circles despite meeting all grant merit benchmarks.',
    location: 'Chemistry Research Annex, Room 410',
    incidentDate: '2026-09-12',
    assignedToId: 'usr-2',
    assignedToName: 'Marcus Thorne, J.D.',
    deadlineAt: '2026-09-20T12:00:00Z', // Past deadline -> triggers Overdue condition!
    createdAt: '2026-09-18T10:30:00Z',
    updatedAt: '2026-09-22T14:15:00Z',
    isOverdue: true,
    attachments: [
      {
        id: 'att-1',
        fileName: 'grant_application_rejection_notice.pdf',
        fileSizeBytes: 420100,
        mimeType: 'application/pdf',
        createdAt: '2026-09-18T10:30:00Z'
      }
    ],
    messages: [
      {
        id: 'msg-1',
        caseId: 'case-101',
        senderType: 'COMMITTEE',
        senderUserId: 'usr-2',
        senderName: 'Ethics & Compliance Office',
        messageBody: 'Your case has been received by the Committee Lead and prioritized under Critical SLA. Could you clarify if other students received written denial reasons?',
        isInternalNote: false,
        createdAt: '2026-09-19T09:00:00Z'
      },
      {
        id: 'msg-2',
        caseId: 'case-101',
        senderType: 'STUDENT',
        messageBody: 'Yes, three cohort members received identical boilerplate rejections while other allocations were processed verbally without standard review forms.',
        isInternalNote: false,
        createdAt: '2026-09-19T14:40:00Z'
      }
    ],
    auditLogs: [
      {
        id: 'aud-1',
        caseId: 'case-101',
        caseRef: 'CB-9K2M-4F8X-7R3A',
        actionType: 'CASE_SUBMITTED',
        actorRole: 'ANONYMOUS_STUDENT',
        actorName: 'Anonymous Submitter',
        details: 'Initial anonymous complaint submitted in category Discrimination',
        createdAt: '2026-09-18T10:30:00Z'
      },
      {
        id: 'aud-2',
        caseId: 'case-101',
        caseRef: 'CB-9K2M-4F8X-7R3A',
        actionType: 'ASSIGNMENT_UPDATED',
        actorRole: 'COMMITTEE_LEAD',
        actorName: 'Marcus Thorne, J.D.',
        details: 'Assigned to Marcus Thorne, J.D. for expedited investigation',
        createdAt: '2026-09-18T11:00:00Z'
      },
      {
        id: 'aud-3',
        caseId: 'case-101',
        caseRef: 'CB-9K2M-4F8X-7R3A',
        actionType: 'STATUS_UPDATED',
        actorRole: 'COMMITTEE_LEAD',
        actorName: 'Marcus Thorne, J.D.',
        details: 'Status changed from Received to In Review',
        createdAt: '2026-09-18T11:05:00Z'
      }
    ]
  },
  {
    id: 'case-102',
    trackingCode: 'CB-7T4H-2W9P-5B6N',
    codeHash: 'hash_demo_102',
    categoryId: 'cat-2',
    categoryName: 'Bullying',
    priority: 'High',
    status: 'Action Required',
    subject: 'Intimidation and harassment in departmental WhatsApp group',
    narrative: 'A senior teaching assistant has been creating disparaging memes regarding students who ask questions during lectures, threatening poor tutorial participation marks.',
    location: 'Faculty of Engineering, Departmental Course 302',
    incidentDate: '2026-09-20',
    assignedToId: 'usr-1',
    assignedToName: 'Dr. Elena Vance',
    deadlineAt: '2026-09-27T17:00:00Z',
    createdAt: '2026-09-21T08:15:00Z',
    updatedAt: '2026-09-23T16:00:00Z',
    isOverdue: false,
    attachments: [
      {
        id: 'att-2',
        fileName: 'chat_screenshot_redacted.png',
        fileSizeBytes: 285400,
        mimeType: 'image/png',
        createdAt: '2026-09-21T08:15:00Z'
      }
    ],
    messages: [
      {
        id: 'msg-3',
        caseId: 'case-102',
        senderType: 'COMMITTEE',
        senderUserId: 'usr-1',
        senderName: 'Student Affairs & Welfare',
        messageBody: 'We have initiated preliminary review. We have requested departmental syllabus policies to verify marking rubric criteria.',
        isInternalNote: false,
        createdAt: '2026-09-22T10:00:00Z'
      }
    ],
    auditLogs: [
      {
        id: 'aud-4',
        caseId: 'case-102',
        caseRef: 'CB-7T4H-2W9P-5B6N',
        actionType: 'CASE_SUBMITTED',
        actorRole: 'ANONYMOUS_STUDENT',
        actorName: 'Anonymous Submitter',
        details: 'Initial anonymous complaint submitted in category Bullying',
        createdAt: '2026-09-21T08:15:00Z'
      },
      {
        id: 'aud-5',
        caseId: 'case-102',
        caseRef: 'CB-7T4H-2W9P-5B6N',
        actionType: 'PRIORITY_UPDATED',
        actorRole: 'COMMITTEE_MEMBER',
        actorName: 'Dr. Elena Vance',
        details: 'Priority adjusted from Medium to High due to grading reprisal threat',
        createdAt: '2026-09-21T10:00:00Z'
      }
    ]
  },
  {
    id: 'case-103',
    trackingCode: 'CB-3D8E-6Q1Z-8K9V',
    codeHash: 'hash_demo_103',
    categoryId: 'cat-6',
    categoryName: 'Academic Issue',
    priority: 'Medium',
    status: 'Resolved',
    subject: 'Unnotified midterm syllabus change two days before examination',
    narrative: 'Course instructors added two unannounced textbooks to the examinable scope 48 hours prior to the sit-down midterm examination without lecture coverage.',
    location: 'School of Humanities, Exam Hall B',
    incidentDate: '2026-09-10',
    assignedToId: 'usr-1',
    assignedToName: 'Dr. Elena Vance',
    deadlineAt: '2026-09-25T17:00:00Z',
    createdAt: '2026-09-11T12:00:00Z',
    updatedAt: '2026-09-16T15:30:00Z',
    resolvedAt: '2026-09-16T15:30:00Z',
    isOverdue: false,
    attachments: [],
    messages: [
      {
        id: 'msg-4',
        caseId: 'case-103',
        senderType: 'COMMITTEE',
        senderUserId: 'usr-1',
        senderName: 'Student Affairs & Welfare',
        messageBody: 'The Committee met with the Faculty Dean. The exam questions relating to the unannounced readings have been struck from grading criteria and marked as full bonus points for all students.',
        isInternalNote: false,
        createdAt: '2026-09-16T15:00:00Z'
      }
    ],
    auditLogs: [
      {
        id: 'aud-6',
        caseId: 'case-103',
        caseRef: 'CB-3D8E-6Q1Z-8K9V',
        actionType: 'STATUS_UPDATED',
        actorRole: 'COMMITTEE_MEMBER',
        actorName: 'Dr. Elena Vance',
        details: 'Status changed from In Review to Resolved. Formal academic remedy granted.',
        createdAt: '2026-09-16T15:30:00Z'
      }
    ]
  }
];

class StoreService {
  private cases: Case[] = [];
  private categories: Category[] = [];
  private users: User[] = [];
  private settings: SystemSettings = INITIAL_SETTINGS;
  private currentUser: User | null = null;
  private globalAuditLogs: CaseAuditLog[] = [];

  constructor() {
    this.loadState();
  }

  private loadState() {
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        this.cases = [...INITIAL_CASES];
        this.categories = [...INITIAL_CATEGORIES];
        this.users = [...INITIAL_USERS];
        this.settings = { ...INITIAL_SETTINGS };
        this.globalAuditLogs = this.gatherInitialAudits();
        this.currentUser = null;
        this.refreshOverdueStates();
        return;
      }

      const storedCases = localStorage.getItem(`${STORAGE_KEY_PREFIX}_cases`);
      const storedCats = localStorage.getItem(`${STORAGE_KEY_PREFIX}_categories`);
      const storedUsers = localStorage.getItem(`${STORAGE_KEY_PREFIX}_users`);
      const storedSettings = localStorage.getItem(`${STORAGE_KEY_PREFIX}_settings`);
      const storedAudits = localStorage.getItem(`${STORAGE_KEY_PREFIX}_audits`);
      const storedUser = localStorage.getItem(`${STORAGE_KEY_PREFIX}_current_user`);

      this.cases = storedCases ? JSON.parse(storedCases) : [...INITIAL_CASES];
      this.categories = storedCats ? JSON.parse(storedCats) : [...INITIAL_CATEGORIES];
      this.users = storedUsers ? JSON.parse(storedUsers) : [...INITIAL_USERS];
      this.settings = storedSettings ? JSON.parse(storedSettings) : { ...INITIAL_SETTINGS };
      this.globalAuditLogs = storedAudits ? JSON.parse(storedAudits) : this.gatherInitialAudits();

      if (storedUser) {
        this.currentUser = JSON.parse(storedUser);
      } else {
        this.currentUser = null;
      }
    } catch {
      this.cases = [...INITIAL_CASES];
      this.categories = [...INITIAL_CATEGORIES];
      this.users = [...INITIAL_USERS];
      this.settings = { ...INITIAL_SETTINGS };
      this.globalAuditLogs = this.gatherInitialAudits();
    }
    this.refreshOverdueStates();
  }

  private gatherInitialAudits(): CaseAuditLog[] {
    const list: CaseAuditLog[] = [];
    for (const c of INITIAL_CASES) {
      if (c.auditLogs) list.push(...c.auditLogs);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  private saveState() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}_cases`, JSON.stringify(this.cases));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}_categories`, JSON.stringify(this.categories));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}_users`, JSON.stringify(this.users));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}_settings`, JSON.stringify(this.settings));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}_audits`, JSON.stringify(this.globalAuditLogs));
      if (this.currentUser) {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}_current_user`, JSON.stringify(this.currentUser));
      } else {
        localStorage.removeItem(`${STORAGE_KEY_PREFIX}_current_user`);
      }
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  public refreshOverdueStates() {
    const now = Date.now();
    for (const c of this.cases) {
      if (c.status === 'Resolved' || c.status === 'Closed') {
        c.isOverdue = false;
      } else {
        c.isOverdue = now > new Date(c.deadlineAt).getTime();
      }
    }
  }

  // --- Auth / Session ---
  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public loginUser(userId: string): User | null {
    const user = this.users.find(u => u.id === userId && u.isActive);
    if (user) {
      user.lastLoginAt = new Date().toISOString();
      this.currentUser = user;
      this.saveState();
      this.recordAudit({
        actionType: 'STAFF_LOGIN',
        actorRole: user.role,
        actorName: user.fullName,
        details: `Staff member logged in: ${user.fullName} (${user.role})`
      });
      return user;
    }
    return null;
  }

  public logoutUser() {
    if (this.currentUser) {
      this.recordAudit({
        actionType: 'STAFF_LOGOUT',
        actorRole: this.currentUser.role,
        actorName: this.currentUser.fullName,
        details: `Staff member logged out: ${this.currentUser.fullName}`
      });
    }
    this.currentUser = null;
    this.saveState();
  }

  // --- Categories ---
  public getCategories(activeOnly = true): Category[] {
    if (activeOnly) {
      return this.categories.filter(c => c.isActive);
    }
    return [...this.categories];
  }

  public addCategory(cat: Omit<Category, 'id'>): Category {
    const newCat: Category = {
      ...cat,
      id: `cat-${Date.now()}`
    };
    this.categories.push(newCat);
    this.saveState();
    this.recordAudit({
      actionType: 'CATEGORY_CREATED',
      actorRole: this.currentUser?.role || 'SYSTEM_ADMIN',
      actorName: this.currentUser?.fullName || 'System Admin',
      details: `New category created: "${newCat.name}" with SLA of ${newCat.slaDays} days`
    });
    return newCat;
  }

  public updateCategory(id: string, updates: Partial<Category>): Category | null {
    const cat = this.categories.find(c => c.id === id);
    if (!cat) return null;
    Object.assign(cat, updates);
    this.saveState();
    this.recordAudit({
      actionType: 'CATEGORY_UPDATED',
      actorRole: this.currentUser?.role || 'SYSTEM_ADMIN',
      actorName: this.currentUser?.fullName || 'System Admin',
      details: `Category "${cat.name}" updated`
    });
    return cat;
  }

  // --- Users ---
  public getUsers(): User[] {
    return [...this.users];
  }

  public addUser(userData: Omit<User, 'id' | 'createdAt'>): User {
    const newUser: User = {
      ...userData,
      id: `usr-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    this.users.push(newUser);
    this.saveState();
    this.recordAudit({
      actionType: 'USER_CREATED',
      actorRole: this.currentUser?.role || 'SYSTEM_ADMIN',
      actorName: this.currentUser?.fullName || 'System Admin',
      details: `New staff user added: ${newUser.fullName} (${newUser.email}) as ${newUser.role}`
    });
    return newUser;
  }

  public updateUser(id: string, updates: Partial<User>): User | null {
    const user = this.users.find(u => u.id === id);
    if (!user) return null;
    Object.assign(user, updates);
    this.saveState();
    this.recordAudit({
      actionType: 'USER_UPDATED',
      actorRole: this.currentUser?.role || 'SYSTEM_ADMIN',
      actorName: this.currentUser?.fullName || 'System Admin',
      details: `User profile modified: ${user.fullName} (${user.role}, Active: ${user.isActive})`
    });
    return user;
  }

  // --- Cases ---
  public getCases(): Case[] {
    this.refreshOverdueStates();
    return [...this.cases].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getCaseById(id: string): Case | null {
    this.refreshOverdueStates();
    return this.cases.find(c => c.id === id) || null;
  }

  public async findCaseByTrackingCode(rawCode: string): Promise<Case | null> {
    this.refreshOverdueStates();
    const cleanCode = rawCode.trim().toUpperCase().replace(/\s+/g, '');
    
    // Direct match against clean code (for testing / demo instances)
    const exact = this.cases.find(c => c.trackingCode.replace(/-/g, '') === cleanCode.replace(/-/g, ''));
    if (exact) return exact;

    // Hash match
    const computedHash = await hashTrackingCode(cleanCode);
    const byHash = this.cases.find(c => c.codeHash === computedHash);
    return byHash || null;
  }

  public async submitAnonymousCase(payload: {
    categoryId: string;
    priority: CasePriority;
    subject: string;
    narrative: string;
    location?: string;
    incidentDate?: string;
    attachments?: Array<{ fileName: string; fileSizeBytes: number; mimeType: string; dataUrl?: string }>;
  }): Promise<{ newCase: Case; rawTrackingCode: string }> {
    const category = this.categories.find(c => c.id === payload.categoryId) || this.categories[0];
    const rawTrackingCode = generateTrackingCode();
    const codeHash = await hashTrackingCode(rawTrackingCode);

    // Calculate deadline based on priority and category SLA
    const now = new Date();
    let deadlineDays = category.slaDays;
    if (payload.priority === 'Critical') {
      deadlineDays = 1; // 24 hours
    } else if (payload.priority === 'High') {
      deadlineDays = 3;
    } else if (payload.priority === 'Low') {
      deadlineDays = Math.max(10, category.slaDays);
    }
    const deadlineAt = new Date(now.getTime() + deadlineDays * 24 * 60 * 60 * 1000).toISOString();

    const newCaseId = `case-${Date.now()}`;
    const newCase: Case = {
      id: newCaseId,
      trackingCode: rawTrackingCode,
      codeHash,
      categoryId: category.id,
      categoryName: category.name,
      priority: payload.priority,
      status: 'Received',
      subject: payload.subject.trim(),
      narrative: payload.narrative.trim(),
      location: payload.location?.trim() || undefined,
      incidentDate: payload.incidentDate || undefined,
      deadlineAt,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      isOverdue: false,
      attachments: (payload.attachments || []).map((att, idx) => ({
        id: `att-${Date.now()}-${idx}`,
        fileName: att.fileName,
        fileSizeBytes: att.fileSizeBytes,
        mimeType: att.mimeType,
        dataUrl: att.dataUrl,
        createdAt: now.toISOString()
      })),
      messages: [],
      auditLogs: [
        {
          id: `aud-${Date.now()}`,
          caseId: newCaseId,
          caseRef: rawTrackingCode,
          actionType: 'CASE_SUBMITTED',
          actorRole: 'ANONYMOUS_STUDENT',
          actorName: 'Anonymous Submitter',
          details: `Anonymous complaint submitted under "${category.name}" with priority "${payload.priority}". Zero direct identifiers persisted.`,
          createdAt: now.toISOString()
        }
      ]
    };

    this.cases.unshift(newCase);
    this.recordAudit(newCase.auditLogs[0]);
    this.saveState();

    return { newCase, rawTrackingCode };
  }

  public addStudentMessage(caseId: string, body: string): boolean {
    const c = this.cases.find(x => x.id === caseId);
    if (!c) return false;

    const newMsg = {
      id: `msg-${Date.now()}`,
      caseId,
      senderType: 'STUDENT' as const,
      messageBody: body.trim(),
      isInternalNote: false,
      createdAt: new Date().toISOString()
    };

    c.messages.push(newMsg);
    c.updatedAt = new Date().toISOString();

    const audit: CaseAuditLog = {
      id: `aud-${Date.now()}`,
      caseId: c.id,
      caseRef: c.trackingCode,
      actionType: 'STUDENT_MESSAGE_SENT',
      actorRole: 'ANONYMOUS_STUDENT',
      actorName: 'Anonymous Student',
      details: 'Anonymous student sent follow-up message via tracking portal',
      createdAt: new Date().toISOString()
    };
    c.auditLogs.push(audit);
    this.recordAudit(audit);

    this.saveState();
    return true;
  }

  public addCommitteeMessage(caseId: string, body: string, isInternalNote = false): boolean {
    const c = this.cases.find(x => x.id === caseId);
    if (!c || !this.currentUser) return false;

    const newMsg = {
      id: `msg-${Date.now()}`,
      caseId,
      senderType: 'COMMITTEE' as const,
      senderUserId: this.currentUser.id,
      senderName: isInternalNote ? `${this.currentUser.fullName} (${this.currentUser.department})` : `${this.currentUser.department}`,
      messageBody: body.trim(),
      isInternalNote,
      createdAt: new Date().toISOString()
    };

    c.messages.push(newMsg);
    c.updatedAt = new Date().toISOString();

    const audit: CaseAuditLog = {
      id: `aud-${Date.now()}`,
      caseId: c.id,
      caseRef: c.trackingCode,
      actionType: isInternalNote ? 'INTERNAL_NOTE_ADDED' : 'COMMITTEE_MESSAGE_SENT',
      actorRole: this.currentUser.role,
      actorName: this.currentUser.fullName,
      details: isInternalNote 
        ? `Internal note added by ${this.currentUser.fullName}` 
        : `Official committee response sent to student by ${this.currentUser.fullName}`,
      createdAt: new Date().toISOString()
    };
    c.auditLogs.push(audit);
    this.recordAudit(audit);

    this.saveState();
    return true;
  }

  public getAllowedTransitions(currentStatus: CaseStatus): CaseStatus[] {
    const transitions: Record<CaseStatus, CaseStatus[]> = {
      Received: ['Assigned', 'In Review', 'Closed'],
      Assigned: ['In Review', 'Action Required', 'Resolved', 'Closed'],
      'In Review': ['Action Required', 'Resolved', 'Closed'],
      'Action Required': ['In Review', 'Resolved', 'Closed'],
      Resolved: ['Closed', 'In Review'],
      Closed: ['In Review'],
    };
    return transitions[currentStatus] || [];
  }

  public updateCaseStatus(caseId: string, newStatus: CaseStatus): boolean {
    const c = this.cases.find(x => x.id === caseId);
    if (!c || !this.currentUser) return false;

    if (newStatus !== c.status) {
      const allowed = this.getAllowedTransitions(c.status);
      if (!allowed.includes(newStatus)) {
        console.warn(`Illegal transition attempted: ${c.status} -> ${newStatus}`);
        return false;
      }
    }

    const oldStatus = c.status;
    c.status = newStatus;
    c.updatedAt = new Date().toISOString();
    if (newStatus === 'Resolved' || newStatus === 'Closed') {
      c.resolvedAt = new Date().toISOString();
    }

    const audit: CaseAuditLog = {
      id: `aud-${Date.now()}`,
      caseId: c.id,
      caseRef: c.trackingCode,
      actionType: 'STATUS_UPDATED',
      actorRole: this.currentUser.role,
      actorName: this.currentUser.fullName,
      details: `Status changed from "${oldStatus}" to "${newStatus}" by ${this.currentUser.fullName}`,
      createdAt: new Date().toISOString()
    };
    c.auditLogs.push(audit);
    this.recordAudit(audit);

    this.saveState();
    return true;
  }

  public updateCasePriority(caseId: string, newPriority: CasePriority): boolean {
    const c = this.cases.find(x => x.id === caseId);
    if (!c || !this.currentUser) return false;

    const oldPriority = c.priority;
    c.priority = newPriority;
    c.updatedAt = new Date().toISOString();

    const audit: CaseAuditLog = {
      id: `aud-${Date.now()}`,
      caseId: c.id,
      caseRef: c.trackingCode,
      actionType: 'PRIORITY_UPDATED',
      actorRole: this.currentUser.role,
      actorName: this.currentUser.fullName,
      details: `Priority adjusted from "${oldPriority}" to "${newPriority}" by ${this.currentUser.fullName}`,
      createdAt: new Date().toISOString()
    };
    c.auditLogs.push(audit);
    this.recordAudit(audit);

    this.saveState();
    return true;
  }

  public assignCase(caseId: string, targetUserId: string): boolean {
    const c = this.cases.find(x => x.id === caseId);
    if (!c || !this.currentUser) return false;

    // Only Committee Lead or System Admin can assign/reassign/unassign
    if (this.currentUser.role !== 'COMMITTEE_LEAD' && this.currentUser.role !== 'SYSTEM_ADMIN') {
      console.warn('Unauthorized: Only Committee Lead or System Admin can manage assignments.');
      return false;
    }

    if (!targetUserId) {
      // Unassign action
      const prevAssignee = c.assignedToName || 'Unassigned';
      c.assignedToId = undefined;
      c.assignedToName = undefined;
      c.updatedAt = new Date().toISOString();

      const audit: CaseAuditLog = {
        id: `aud-${Date.now()}`,
        caseId: c.id,
        caseRef: c.trackingCode,
        actionType: 'ASSIGNMENT_REMOVED',
        actorRole: this.currentUser.role,
        actorName: this.currentUser.fullName,
        details: `Case unassigned (previously assigned to ${prevAssignee}) by ${this.currentUser.fullName}`,
        createdAt: new Date().toISOString()
      };
      c.auditLogs.push(audit);
      this.recordAudit(audit);
      this.saveState();
      return true;
    }

    const targetUser = this.users.find(u => u.id === targetUserId);
    if (!targetUser) return false;

    const isReassign = !!c.assignedToId && c.assignedToId !== targetUser.id;
    c.assignedToId = targetUser.id;
    c.assignedToName = targetUser.fullName;
    if (c.status === 'Received') {
      c.status = 'Assigned';
    }
    c.updatedAt = new Date().toISOString();

    const audit: CaseAuditLog = {
      id: `aud-${Date.now()}`,
      caseId: c.id,
      caseRef: c.trackingCode,
      actionType: isReassign ? 'ASSIGNMENT_REASSIGNED' : 'ASSIGNMENT_UPDATED',
      actorRole: this.currentUser.role,
      actorName: this.currentUser.fullName,
      details: isReassign
        ? `Case reassigned to ${targetUser.fullName} (${targetUser.role}) by ${this.currentUser.fullName}`
        : `Case assigned to ${targetUser.fullName} (${targetUser.role}) by ${this.currentUser.fullName}`,
      createdAt: new Date().toISOString()
    };
    c.auditLogs.push(audit);
    this.recordAudit(audit);

    this.saveState();
    return true;
  }

  // --- Audit Trail ---
  private recordAudit(entry: Omit<CaseAuditLog, 'id' | 'createdAt'> & { id?: string; createdAt?: string }) {
    const log: CaseAuditLog = {
      id: entry.id || `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: entry.createdAt || new Date().toISOString(),
      ...entry
    };
    this.globalAuditLogs.unshift(log);
    if (this.globalAuditLogs.length > 500) {
      this.globalAuditLogs.pop();
    }
  }

  public getGlobalAuditLogs(): CaseAuditLog[] {
    return [...this.globalAuditLogs];
  }

  // --- Settings ---
  public getSettings(): SystemSettings {
    return { ...this.settings };
  }

  public updateSettings(newSettings: Partial<SystemSettings>): SystemSettings {
    this.settings = { ...this.settings, ...newSettings };
    this.saveState();
    this.recordAudit({
      actionType: 'SETTINGS_UPDATED',
      actorRole: this.currentUser?.role || 'SYSTEM_ADMIN',
      actorName: this.currentUser?.fullName || 'System Admin',
      details: 'System configuration settings updated'
    });
    return { ...this.settings };
  }

  public resetToFactoryDefaults() {
    this.cases = [...INITIAL_CASES];
    this.categories = [...INITIAL_CATEGORIES];
    this.users = [...INITIAL_USERS];
    this.settings = { ...INITIAL_SETTINGS };
    this.globalAuditLogs = this.gatherInitialAudits();
    this.currentUser = null;
    this.saveState();
  }
}

export const store = new StoreService();
