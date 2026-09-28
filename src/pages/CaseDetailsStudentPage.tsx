import React, { useState, useEffect } from 'react';
import { Shield, Clock, MessageSquare, Send, FileText, ArrowLeft, Download, Check, Copy } from 'lucide-react';
import { Case } from '../types';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import { store } from '../services/store';
import { Button } from '../components/ui/Button';
import { FormField, Textarea } from '../components/ui/FormField';
import { Alert } from '../components/ui/Alert';
import { Card } from '../components/ui/Card';
import { StatusTimeline } from '../components/ui/StatusTimeline';
import { LoadingState, ErrorState } from '../components/ui/FeedbackStates';

interface CaseDetailsStudentPageProps {
  trackingCode: string;
  onNavigate: (path: string) => void;
}

export const CaseDetailsStudentPage: React.FC<CaseDetailsStudentPageProps> = ({
  trackingCode,
  onNavigate,
}) => {
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [messageSuccess, setMessageSuccess] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const loadCase = async () => {
    setIsLoading(true);
    setNotFound(false);
    try {
      const found = await store.findCaseByTrackingCode(trackingCode);
      if (found) {
        setCaseData({ ...found });
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCase();
  }, [trackingCode]);

  const handleCopyCode = () => {
    if (!caseData) return;
    navigator.clipboard.writeText(caseData.trackingCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseData || !replyMessage.trim()) return;

    setIsSending(true);
    setMessageError(null);
    setMessageSuccess(null);

    const success = store.addStudentMessage(caseData.id, replyMessage.trim());
    if (success) {
      setReplyMessage('');
      setMessageSuccess('Your follow-up statement was securely delivered to the review committee.');
      loadCase();
    } else {
      setMessageError('Unable to send follow-up message at this time. Please try again.');
    }
    setIsSending(false);
  };

  if (isLoading) {
    return (
      <LoadingState
        message="Verifying Tracking Hash..."
        subtext="Fetching authorized case file records from secure storage"
        className="py-24"
      />
    );
  }

  if (notFound || !caseData) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <ErrorState
          title="Case Record Not Found"
          message={`No active grievance record was found matching tracking token "${trackingCode}". Please verify that all characters were entered accurately.`}
          onRetry={() => onNavigate('/track')}
        />
        <div className="flex justify-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => onNavigate('/track')}>
            Try Another Code
          </Button>
          <Button variant="primary" size="sm" onClick={() => onNavigate('/submit')}>
            File a New Report
          </Button>
        </div>
      </div>
    );
  }

  // Filter messages to show only student messages and official committee messages (hide internal notes)
  const publicMessages = caseData.messages.filter((m) => !m.isInternalNote);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <button
            onClick={() => onNavigate('/track')}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1.5 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Back to Case Lookup</span>
          </button>
          
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tracking Credential:
            </span>
            <div className="inline-flex items-center gap-1 bg-slate-100 border border-slate-300 rounded px-2.5 py-1">
              <span className="font-mono text-xs sm:text-sm font-bold text-slate-900 select-all">
                {caseData.trackingCode}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                title="Copy tracking code"
                className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition-colors"
                aria-label="Copy tracking code to clipboard"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2 tracking-tight">
            {caseData.subject}
          </h1>
        </div>

        <div className="flex flex-col sm:items-end gap-2 shrink-0">
          <StatusBadge status={caseData.status} isOverdue={caseData.isOverdue} size="lg" />
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Category: <strong className="text-slate-700">{caseData.categoryName}</strong></span>
            <span>·</span>
            <PriorityBadge priority={caseData.priority} />
          </div>
        </div>
      </div>

      {/* Accessible Status Stepper Timeline */}
      <Card className="p-6">
        <StatusTimeline
          currentStatus={caseData.status}
          isOverdue={caseData.isOverdue}
          deadlineAt={caseData.deadlineAt}
          createdAt={caseData.createdAt}
          resolvedAt={caseData.resolvedAt}
        />
      </Card>

      {/* Main Grid: Case Overview + Two-Way Messaging Thread */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Complaint Record & Attachments (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
              Complaint Record
            </h2>

            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <span className="text-slate-400 text-xs block">Date Filed:</span>
                <span className="text-slate-800 font-medium">
                  {new Date(caseData.createdAt).toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>

              {caseData.location && (
                <div>
                  <span className="text-slate-400 text-xs block">Reported Location:</span>
                  <span className="text-slate-800 font-medium">{caseData.location}</span>
                </div>
              )}

              {caseData.incidentDate && (
                <div>
                  <span className="text-slate-400 text-xs block">Date of Occurrence:</span>
                  <span className="text-slate-800 font-medium">{caseData.incidentDate}</span>
                </div>
              )}

              <div>
                <span className="text-slate-400 text-xs block mb-1">Narrative Statement:</span>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 leading-relaxed whitespace-pre-wrap text-xs sm:text-sm">
                  {caseData.narrative}
                </div>
              </div>
            </div>
          </Card>

          {/* Attachments Section */}
          <Card className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
              Attached Evidence ({caseData.attachments.length})
            </h2>

            {caseData.attachments.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">
                No files were attached with this submission.
              </p>
            ) : (
              <ul className="space-y-2">
                {caseData.attachments.map((att) => (
                  <li
                    key={att.id}
                    className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <FileText className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                      <span className="font-medium text-slate-800 truncate">{att.fileName}</span>
                      <span className="text-slate-400 text-[11px] shrink-0">
                        ({(att.fileSizeBytes / 1024).toFixed(0)} KB)
                      </span>
                    </div>

                    {att.dataUrl ? (
                      <a
                        href={att.dataUrl}
                        download={att.fileName}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium shrink-0 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
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
          </Card>
        </div>

        {/* Right Column: Two-Way Dialogue Thread (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Two-Way Communication Channel
                </h2>
                <p className="text-xs text-slate-500">
                  Direct inquiries and official updates between you and the committee.
                </p>
              </div>
              <span className="text-xs font-mono bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-200 font-medium">
                {publicMessages.length} {publicMessages.length === 1 ? 'Message' : 'Messages'}
              </span>
            </div>

            {/* Messages Thread */}
            <div className="space-y-3.5 max-h-[420px] overflow-y-auto pr-1">
              {publicMessages.length === 0 ? (
                <div className="text-center py-8 text-slate-400 space-y-1">
                  <MessageSquare className="w-8 h-8 mx-auto text-slate-300" aria-hidden="true" />
                  <p className="text-xs font-medium text-slate-600">No dialogue recorded yet.</p>
                  <p className="text-xs text-slate-400">
                    You can post supplemental information below, or await official committee review.
                  </p>
                </div>
              ) : (
                publicMessages.map((msg) => {
                  const isStudent = msg.senderType === 'STUDENT';
                  return (
                    <div
                      key={msg.id}
                      className={`p-4 rounded-xl border space-y-1.5 ${
                        isStudent
                          ? 'bg-blue-50/50 border-blue-200 ml-4 sm:ml-8'
                          : 'bg-slate-50 border-slate-200 mr-4 sm:mr-8'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span
                          className={`font-semibold ${
                            isStudent ? 'text-blue-700' : 'text-slate-900'
                          }`}
                        >
                          {isStudent ? 'You (Anonymous Submitter)' : msg.senderName || 'Review Committee'}
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {msg.messageBody}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Post Reply Form */}
            {caseData.status !== 'Closed' ? (
              <form onSubmit={handleSendMessage} className="space-y-3 pt-3 border-t border-slate-100">
                {messageSuccess && (
                  <Alert variant="success" onDismiss={() => setMessageSuccess(null)}>
                    {messageSuccess}
                  </Alert>
                )}
                {messageError && (
                  <Alert variant="error" onDismiss={() => setMessageError(null)}>
                    {messageError}
                  </Alert>
                )}

                <FormField
                  id="student-reply"
                  label="Submit Additional Information or Clarification"
                  helpText="Responses remain anonymous and are linked directly to your case record."
                >
                  <Textarea
                    id="student-reply"
                    rows={3}
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Provide additional facts, answer committee questions, or submit status inquiries..."
                  />
                </FormField>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={!replyMessage.trim()}
                    isLoading={isSending}
                    loadingText="Sending..."
                    rightIcon={<Send className="w-3.5 h-3.5" />}
                  >
                    Send to Review Committee
                  </Button>
                </div>
              </form>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-500 text-center">
                This case is formally closed. The communication channel is archived.
              </div>
            )}
          </Card>
        </div>

      </div>
    </div>
  );
};
