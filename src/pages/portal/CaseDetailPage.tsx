import React, { useState } from 'react';
import {
  Shield,
  Clock,
  AlertTriangle,
  ArrowLeft,
  Send,
  Lock,
  FileText,
  UserCheck,
  MessageSquare,
  History,
  CheckCircle2,
  Download,
  AlertCircle,
  UserMinus,
} from 'lucide-react';
import { User, CasePriority, CaseStatus } from '../../types';
import { store } from '../../services/store';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import { Button } from '../../components/ui/Button';
import { FormField, Textarea, Select } from '../../components/ui/FormField';
import { Alert } from '../../components/ui/Alert';
import { Card } from '../../components/ui/Card';
import { ConfirmationModal } from '../../components/ui/FeedbackStates';
import { StatusTimeline } from '../../components/ui/StatusTimeline';

interface CaseDetailPageProps {
  caseId: string;
  currentUser: User;
  onNavigate: (path: string) => void;
}

export const CaseDetailPage: React.FC<CaseDetailPageProps> = ({
  caseId,
  currentUser,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'MESSAGES' | 'NOTES' | 'AUDIT'>('MESSAGES');
  const [committeeMessage, setCommitteeMessage] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isUnassignModalOpen, setIsUnassignModalOpen] = useState(false);

  const currentCase = store.getCaseById(caseId);
  const users = store.getUsers();

  if (!currentCase) {
    return (
      <div className="text-center py-16 space-y-4">
        <h1 className="text-xl font-bold text-slate-800">Case Record Not Found</h1>
        <p className="text-xs sm:text-sm text-slate-500">
          The requested case does not exist or may have been archived.
        </p>
        <Button variant="primary" size="sm" onClick={() => onNavigate('/portal/cases')}>
          Return to Queue
        </Button>
      </div>
    );
  }

  // Authoritative case-level access check for staff members
  const canAccess = store.canAccessCase(currentUser, currentCase);
  if (!canAccess) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 animate-fade-in">
        <Card className="p-8 text-center space-y-4 border-rose-200 bg-rose-50/30">
          <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-2xs">
            <Lock className="w-6 h-6" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Access Restricted</h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            This case record is not assigned to your staff profile. Under CaseBridge institutional policy, Committee Members may only access and review cases specifically assigned to their account.
          </p>
          <div className="pt-2">
            <Button variant="primary" size="sm" onClick={() => onNavigate('/portal/cases')}>
              Return to Assigned Queue
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const showNotification = (msg: string) => {
    setActionSuccess(msg);
    setActionError(null);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const showError = (msg: string) => {
    setActionError(msg);
    setActionSuccess(null);
  };

  const handleStatusChange = (newStatus: CaseStatus) => {
    if (newStatus === currentCase.status) return;
    if (newStatus === 'Closed') {
      setIsCloseModalOpen(true);
      return;
    }
    const allowed = store.getAllowedTransitions(currentCase.status);
    if (!allowed.includes(newStatus)) {
      showError(`Illegal transition: Cannot move directly from "${currentCase.status}" to "${newStatus}".`);
      return;
    }
    const ok = store.updateCaseStatus(caseId, newStatus);
    if (ok) showNotification(`Status successfully transitioned to "${newStatus}".`);
  };

  const confirmCloseCase = () => {
    const ok = store.updateCaseStatus(caseId, 'Closed');
    setIsCloseModalOpen(false);
    if (ok) showNotification('Case file formally closed and archived.');
  };

  const handlePriorityChange = (newPriority: CasePriority) => {
    const ok = store.updateCasePriority(caseId, newPriority);
    if (ok) showNotification(`Urgency priority adjusted to "${newPriority}".`);
  };

  const handleAssign = (targetUserId: string) => {
    if (!targetUserId) {
      setIsUnassignModalOpen(true);
      return;
    }
    const ok = store.assignCase(caseId, targetUserId);
    if (ok) {
      const u = users.find((x) => x.id === targetUserId);
      showNotification(`Case assigned to reviewer ${u?.fullName || 'Committee Member'}.`);
    }
  };

  const confirmUnassign = () => {
    const ok = store.assignCase(caseId, '');
    setIsUnassignModalOpen(false);
    if (ok) showNotification('Case assignment removed. Case is now Unassigned.');
  };

  const handleSendOfficialResponse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!committeeMessage.trim()) return;
    const ok = store.addCommitteeMessage(caseId, committeeMessage.trim(), false);
    if (ok) {
      setCommitteeMessage('');
      showNotification('Official committee response delivered to student tracking portal.');
    }
  };

  const handleAddInternalNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!internalNote.trim()) return;
    const ok = store.addCommitteeMessage(caseId, internalNote.trim(), true);
    if (ok) {
      setInternalNote('');
      showNotification('Internal confidential deliberative note added.');
    }
  };

  const isLead = currentUser.role === 'COMMITTEE_LEAD' || currentUser.role === 'SYSTEM_ADMIN';
  const allowedTransitions = store.getAllowedTransitions(currentCase.status);

  // Filter messages
  const publicMessages = currentCase.messages.filter((m) => !m.isInternalNote);
  const internalNotes = currentCase.messages.filter((m) => m.isInternalNote);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <button
            onClick={() => onNavigate('/portal/cases')}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1.5 mb-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Back to Case Queue</span>
          </button>

          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-mono text-sm font-bold bg-slate-900 text-white px-2.5 py-0.5 rounded shadow-2xs">
              {currentCase.trackingCode}
            </span>
            <span className="text-xs text-slate-500">
              Filed {new Date(currentCase.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2 tracking-tight">
            {currentCase.subject}
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:justify-end">
          <StatusBadge status={currentCase.status} isOverdue={currentCase.isOverdue} size="lg" />
          <PriorityBadge priority={currentCase.priority} size="md" />
        </div>
      </div>

      {actionSuccess && (
        <Alert variant="success" onDismiss={() => setActionSuccess(null)}>
          {actionSuccess}
        </Alert>
      )}

      {actionError && (
        <Alert variant="error" onDismiss={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}

      {/* Case Status Stepper */}
      <Card className="p-6">
        <StatusTimeline
          currentStatus={currentCase.status}
          isOverdue={currentCase.isOverdue}
          deadlineAt={currentCase.deadlineAt}
          createdAt={currentCase.createdAt}
          resolvedAt={currentCase.resolvedAt}
        />
      </Card>

      {/* Main 2-Column Grid: Reviewer Controls (4 cols) & Dialogue/Notes/Audit (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Case Facts & Administrative Controls */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Administrative Triage Actions */}
          <Card className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
              Case Management Actions
            </h2>

            {/* Lifecycle Status Transition */}
            <div className="space-y-1.5">
              <label htmlFor="status-select" className="block text-xs font-semibold text-slate-700">
                Update Case Status
              </label>
              <select
                id="status-select"
                value={currentCase.status}
                onChange={(e) => handleStatusChange(e.target.value as CaseStatus)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-blue-600"
              >
                <option value={currentCase.status}>{currentCase.status} (Current)</option>
                {allowedTransitions.map((st) => (
                  <option key={st} value={st}>Move to: {st}</option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500">
                Only procedurally legal state transitions are permitted.
              </p>
            </div>

            {/* Urgency Priority Adjustment */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <label htmlFor="priority-select" className="block text-xs font-semibold text-slate-700">
                Adjust Urgency / Priority
              </label>
              <select
                id="priority-select"
                value={currentCase.priority}
                onChange={(e) => handlePriorityChange(e.target.value as CasePriority)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-blue-600"
              >
                <option value="Low">Low (21-day target)</option>
                <option value="Medium">Medium (14-day target)</option>
                <option value="High">High (7-day target)</option>
                <option value="Critical">Critical (3-day target)</option>
              </select>
            </div>

            {/* Investigator Assignment (Lead Only) */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label htmlFor="assign-select" className="block text-xs font-semibold text-slate-700">
                  Assign Lead Reviewer
                </label>
                {!isLead && (
                  <span className="text-[10px] text-slate-400 font-mono">Lead-Only</span>
                )}
              </div>

              {isLead ? (
                <div className="space-y-2">
                  <select
                    id="assign-select"
                    value={currentCase.assignedToId || ''}
                    onChange={(e) => handleAssign(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="">-- Unassigned --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.role.replace('_', ' ')})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                  {currentCase.assignedToName || 'Unassigned'}
                </div>
              )}
            </div>
          </Card>

          {/* Grievance Summary & Metadata */}
          <Card className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
              Submitted Case Facts
            </h2>

            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-slate-400 block">Category:</span>
                <span className="font-semibold text-slate-800">{currentCase.categoryName}</span>
              </div>

              {currentCase.location && (
                <div>
                  <span className="text-slate-400 block">Reported Location:</span>
                  <span className="text-slate-800">{currentCase.location}</span>
                </div>
              )}

              {currentCase.incidentDate && (
                <div>
                  <span className="text-slate-400 block">Date of Occurrence:</span>
                  <span className="text-slate-800">{currentCase.incidentDate}</span>
                </div>
              )}

              <div>
                <span className="text-slate-400 block mb-1">Narrative Statement:</span>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {currentCase.narrative}
                </div>
              </div>

              {/* Attachments */}
              <div>
                <span className="text-slate-400 block mb-1">
                  Evidence Files ({currentCase.attachments.length}):
                </span>
                {currentCase.attachments.length === 0 ? (
                  <p className="text-slate-500 italic">No attachments provided.</p>
                ) : (
                  <ul className="space-y-1.5 pt-1">
                    {currentCase.attachments.map((att) => (
                      <li
                        key={att.id}
                        className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      >
                        <div className="flex items-center gap-1.5 truncate pr-2">
                          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                          <span className="truncate font-medium text-slate-800">{att.fileName}</span>
                        </div>
                        {att.dataUrl ? (
                          <a
                            href={att.dataUrl}
                            download={att.fileName}
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium shrink-0"
                          >
                            <Download className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Download</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Protected file</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Tabbed Dialogue, Internal Deliberation Notes, & Audit Trail */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="space-y-5">
            {/* Tabs Header */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3" role="tablist">
              <button
                role="tab"
                aria-selected={activeTab === 'MESSAGES'}
                onClick={() => setActiveTab('MESSAGES')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  activeTab === 'MESSAGES'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Student Dialogue ({publicMessages.length})</span>
              </button>

              <button
                role="tab"
                aria-selected={activeTab === 'NOTES'}
                onClick={() => setActiveTab('NOTES')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  activeTab === 'NOTES'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Confidential Notes ({internalNotes.length})</span>
              </button>

              <button
                role="tab"
                aria-selected={activeTab === 'AUDIT'}
                onClick={() => setActiveTab('AUDIT')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  activeTab === 'AUDIT'
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <History className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Audit Trail ({currentCase.auditLogs.length})</span>
              </button>
            </div>

            {/* TAB 1: Student Dialogue (Public to Student Tracking Portal) */}
            {activeTab === 'MESSAGES' && (
              <div className="space-y-5 animate-fade-in">
                <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3 text-xs text-blue-900 flex items-start gap-2">
                  <Shield className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    Messages here are visible to the student via their tracking credential. Use this channel to ask clarifying questions or issue official status updates.
                  </span>
                </div>

                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {publicMessages.length === 0 ? (
                    <p className="text-center py-8 text-xs text-slate-400 italic">
                      No dialogue recorded yet with the student.
                    </p>
                  ) : (
                    publicMessages.map((msg) => {
                      const isStudent = msg.senderType === 'STUDENT';
                      return (
                        <div
                          key={msg.id}
                          className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                            isStudent
                              ? 'bg-slate-50 border-slate-200 mr-8'
                              : 'bg-blue-50/60 border-blue-200 ml-8'
                          }`}
                        >
                          <div className="flex items-center justify-between font-semibold">
                            <span className={isStudent ? 'text-slate-800' : 'text-blue-700'}>
                              {isStudent ? 'Anonymous Student' : `${msg.senderName} (Committee)`}
                            </span>
                            <span className="text-slate-400 text-[11px] font-normal">
                              {new Date(msg.createdAt).toLocaleString(undefined, {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })}
                            </span>
                          </div>
                          <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                            {msg.messageBody}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>

                {currentCase.status !== 'Closed' && (
                  <form onSubmit={handleSendOfficialResponse} className="space-y-3 pt-3 border-t border-slate-100">
                    <FormField
                      id="committee-response"
                      label="Post Official Response to Student"
                      helpText="This response will be visible on the student's tracking portal."
                    >
                      <Textarea
                        id="committee-response"
                        rows={3}
                        value={committeeMessage}
                        onChange={(e) => setCommitteeMessage(e.target.value)}
                        placeholder="Draft official statement, request additional evidence, or communicate next steps..."
                      />
                    </FormField>

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        disabled={!committeeMessage.trim()}
                        className="bg-blue-700 hover:bg-blue-800"
                        rightIcon={<Send className="w-3.5 h-3.5" />}
                      >
                        Deliver Response
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* TAB 2: Confidential Staff Deliberation Notes (Hidden from Student) */}
            {activeTab === 'NOTES' && (
              <div className="space-y-5 animate-fade-in">
                <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3 text-xs text-amber-950 flex items-start gap-2">
                  <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    Confidential internal deliberative channel. These notes are strictly restricted to authorized committee members and are NEVER displayed to students.
                  </span>
                </div>

                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {internalNotes.length === 0 ? (
                    <p className="text-center py-8 text-xs text-slate-400 italic">
                      No internal notes recorded.
                    </p>
                  ) : (
                    internalNotes.map((note) => (
                      <div
                        key={note.id}
                        className="p-3.5 bg-amber-50/40 border border-amber-200 rounded-xl text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between font-semibold text-amber-950">
                          <span>{note.senderName}</span>
                          <span className="text-slate-400 text-[11px] font-normal">
                            {new Date(note.createdAt).toLocaleString(undefined, {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>
                        <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                          {note.messageBody}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {currentCase.status !== 'Closed' && (
                  <form onSubmit={handleAddInternalNote} className="space-y-3 pt-3 border-t border-slate-100">
                    <FormField
                      id="internal-note"
                      label="Add Confidential Deliberation Note"
                      helpText="Record investigative findings, witness interviews, or legal counsel recommendations."
                    >
                      <Textarea
                        id="internal-note"
                        rows={3}
                        value={internalNote}
                        onChange={(e) => setInternalNote(e.target.value)}
                        placeholder="Internal deliberative notes, hearing observations, or investigator remarks..."
                      />
                    </FormField>

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        variant="secondary"
                        size="sm"
                        disabled={!internalNote.trim()}
                        className="border-amber-300 text-amber-900 hover:bg-amber-50"
                      >
                        Save Internal Note
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* TAB 3: Immutable Audit Trail */}
            {activeTab === 'AUDIT' && (
              <div className="space-y-3 animate-fade-in">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600">
                  Append-only immutable record of all administrative interactions, state changes, and assignments.
                </div>

                <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
                  {currentCase.auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 bg-white border border-slate-200 rounded-lg text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800 font-mono text-[11px]">
                          {log.actionType}
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          {new Date(log.createdAt).toLocaleString(undefined, {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>
                      <p className="text-slate-600">{log.details}</p>
                      <div className="text-[10px] text-slate-400">
                        Actor: {log.actorName} ({log.actorRole.replace('_', ' ')})
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

      </div>

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        onConfirm={confirmCloseCase}
        title="Formally Close & Archive Case"
        message="Are you sure you want to transition this case to Closed status? Once closed, further messages and status modifications are disabled, and findings are locked in the audit trail."
        confirmLabel="Close Case"
        isDangerous
      />

      <ConfirmationModal
        isOpen={isUnassignModalOpen}
        onClose={() => setIsUnassignModalOpen(false)}
        onConfirm={confirmUnassign}
        title="Remove Case Assignment"
        message="Are you sure you want to unassign this case? The case will return to the unassigned queue until a lead reallocates it."
        confirmLabel="Unassign Case"
      />
    </div>
  );
};
