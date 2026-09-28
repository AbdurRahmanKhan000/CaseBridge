import React, { useState } from 'react';
import { Shield, Lock, Upload, X, Copy, Check, FileText, ArrowRight, Download, Info } from 'lucide-react';
import { Category, CasePriority } from '../types';
import { store } from '../services/store';
import { Button } from '../components/ui/Button';
import { FormField, TextInput, Textarea, Select } from '../components/ui/FormField';
import { Alert } from '../components/ui/Alert';
import { Card } from '../components/ui/Card';

interface SubmitCasePageProps {
  categories: Category[];
  onNavigate: (path: string) => void;
}

interface FileAttachmentPreview {
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  dataUrl?: string;
}

export const SubmitCasePage: React.FC<SubmitCasePageProps> = ({ categories, onNavigate }) => {
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [priority, setPriority] = useState<CasePriority>('Medium');
  const [subject, setSubject] = useState('');
  const [narrative, setNarrative] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [location, setLocation] = useState('');
  const [attachments, setAttachments] = useState<FileAttachmentPreview[]>([]);
  const [ackZeroId, setAckZeroId] = useState(false);
  const [ackCodeSave, setAckCodeSave] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Success state
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg'];
  const allowedMimeTypes = ['application/pdf', 'image/png', 'image/jpeg'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    const errors: string[] = [];

    files.forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        errors.push(`"${file.name}" exceeds the 10 MB limit.`);
        return;
      }
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!allowedExtensions.includes(ext) || !allowedMimeTypes.includes(file.type)) {
        errors.push(`"${file.name}" is not an accepted format (PDF, PNG, JPG).`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setAttachments((prev) => [
          ...prev,
          {
            fileName: file.name,
            fileSizeBytes: file.size,
            mimeType: file.type || 'application/octet-stream',
            dataUrl: reader.result as string,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    if (errors.length > 0) {
      setFormErrors((prev) => ({ ...prev, attachments: errors.join(' ') }));
    } else {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next.attachments;
        return next;
      });
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!subject.trim()) {
      errs.subject = 'Please provide a clear title or summary.';
    }
    if (!narrative.trim()) {
      errs.narrative = 'Please describe the incident or concern.';
    } else if (narrative.trim().length < 30) {
      errs.narrative = 'Please provide at least 30 characters so the committee has sufficient context.';
    }
    if (!ackZeroId) {
      errs.ackZeroId = 'Please confirm that you understand this report is submitted without personal identity.';
    }
    if (!ackCodeSave) {
      errs.ackCodeSave = 'Please confirm you understand the tracking code must be saved.';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmissionError(null);
    try {
      const { rawTrackingCode } = await store.submitAnonymousCase({
        categoryId,
        priority,
        subject,
        narrative,
        location,
        incidentDate,
        attachments,
      });

      setCreatedCode(rawTrackingCode);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setSubmissionError('Unable to complete case submission. Please review your entries and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    if (!createdCode) return;
    navigator.clipboard.writeText(createdCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadBackup = () => {
    if (!createdCode) return;
    const textContent =
      `CASEBRIDGE REPORT CONFIRMATION\n` +
      `==========================================\n` +
      `Tracking Code : ${createdCode}\n` +
      `Date Filed    : ${new Date().toLocaleString()}\n` +
      `Subject       : ${subject}\n` +
      `Category      : ${categories.find((c) => c.id === categoryId)?.name || 'General'}\n` +
      `Priority      : ${priority}\n\n` +
      `CRITICAL INSTRUCTION:\n` +
      `- Save this tracking code securely.\n` +
      `- Because CaseBridge uses zero-knowledge hashed storage, lost codes cannot be recovered by staff.\n` +
      `- Visit the CaseBridge Track portal anytime with this code to view status and messages.\n` +
      `==========================================\n`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CaseBridge-Tracking-${createdCode}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // SUCCESS CONFIRMATION VIEW
  if (createdCode) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 space-y-8 animate-fade-in">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 mx-auto">
            <Check className="w-6 h-6 stroke-[3]" aria-hidden="true" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Case Successfully Received
          </h1>
          <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
            Your grievance report has been encrypted and queued for independent committee review. No personal identifying information was persisted.
          </p>
        </div>

        {/* Vital Instruction Card */}
        <Card className="border-blue-200 bg-blue-50/40 p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-800">
              Save This Tracking Code Securely
            </span>
            <p className="text-xs text-slate-600">
              This credential is your only key to check inquiry progress and communicate with the committee.
            </p>
          </div>

          {/* Large Code Display */}
          <div className="bg-white border-2 border-dashed border-blue-300 rounded-xl p-5 text-center space-y-3 shadow-xs">
            <div className="text-2xl sm:text-3xl font-mono font-bold text-slate-900 tracking-wider select-all">
              {createdCode}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopyCode}
                leftIcon={copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              >
                {copied ? 'Copied to Clipboard' : 'Copy Tracking Code'}
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownloadBackup}
                leftIcon={<Download className="w-4 h-4" />}
              >
                Download Receipt (.txt)
              </Button>
            </div>
          </div>

          <Alert variant="warning" title="Important Notice on Code Recovery">
            Because CaseBridge stores only a one-way cryptographic hash of your code, university staff cannot recover lost codes. Please copy or download it now before closing this page.
          </Alert>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={() => onNavigate(`/track/${encodeURIComponent(createdCode)}`)}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              Proceed to Case Tracking Portal
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={() => onNavigate('/')}
              className="w-full sm:w-auto"
            >
              Return to Homepage
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // INGESTION FORM VIEW
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Calm, reassuring heading */}
      <div className="space-y-2 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Submit a Case
        </h1>
        <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
          Your statement is forwarded directly to the university review committee without personal identifying details.
        </p>
      </div>

      {submissionError && (
        <Alert variant="error" onDismiss={() => setSubmissionError(null)}>
          {submissionError}
        </Alert>
      )}

      {/* Main Intake Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="space-y-5">
          {/* Category & Urgency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              id="case-category"
              label="Grievance Category"
              required
            >
              <Select
                id="case-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.slaDays}d SLA)
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField
              id="case-priority"
              label="Urgency Level"
              required
            >
              <Select
                id="case-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as CasePriority)}
              >
                <option value="Low">Low (General inquiry, non-urgent)</option>
                <option value="Medium">Medium (Standard grievance)</option>
                <option value="High">High (Impending deadline or dispute)</option>
                <option value="Critical">Critical (Immediate safety concern)</option>
              </Select>
            </FormField>
          </div>

          {/* Subject Line */}
          <FormField
            id="case-subject"
            label="Subject Summary"
            required
            error={formErrors.subject}
          >
            <TextInput
              id="case-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of concern"
              error={!!formErrors.subject}
            />
          </FormField>

          {/* Detailed Narrative */}
          <FormField
            id="case-narrative"
            label="Detailed Narrative"
            required
            error={formErrors.narrative}
            helpText={`Provide facts, dates, or relevant context (${narrative.length}/10,000 characters, min 30).`}
          >
            <Textarea
              id="case-narrative"
              rows={6}
              value={narrative}
              onChange={(e) => setNarrative(e.target.value)}
              placeholder="Describe what occurred, involved parties (if appropriate), and any corrective action requested..."
              error={!!formErrors.narrative}
            />
          </FormField>

          {/* Location & Incident Date (Optional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <FormField
              id="case-location"
              label="Campus Location (Optional)"
            >
              <TextInput
                id="case-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Science Hall, Room 204"
              />
            </FormField>

            <FormField
              id="case-date"
              label="Date of Incident (Optional)"
            >
              <TextInput
                id="case-date"
                type="date"
                value={incidentDate}
                onChange={(e) => setIncidentDate(e.target.value)}
              />
            </FormField>
          </div>

          {/* Attachments Section */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div>
              <span className="block text-sm font-semibold text-slate-800">
                Supporting Documentation (Optional)
              </span>
              <p className="text-xs text-slate-500 mt-0.5">
                Attach relevant emails, documents, or screenshots (PDF, PNG, JPG up to 10 MB).
              </p>
            </div>

            <div className="border border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-blue-400 transition-colors bg-slate-50/50">
              <label htmlFor="file-upload" className="cursor-pointer block space-y-1.5">
                <Upload className="w-5 h-5 text-slate-400 mx-auto" aria-hidden="true" />
                <span className="text-sm font-medium text-blue-600 hover:text-blue-700">
                  Select files to upload
                </span>
                <span className="block text-[11px] text-slate-400">
                  Stored securely and accessible only to assigned review officers.
                </span>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </label>
            </div>

            {formErrors.attachments && (
              <p className="text-xs font-medium text-rose-600" role="alert">
                {formErrors.attachments}
              </p>
            )}

            {/* Attachment List */}
            {attachments.length > 0 && (
              <ul className="space-y-2 pt-1" aria-label="Attached files">
                {attachments.map((file, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                      <span className="font-medium text-slate-800 truncate">{file.fileName}</span>
                      <span className="text-slate-400 text-[11px]">
                        ({(file.fileSizeBytes / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                      aria-label={`Remove ${file.fileName}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Acknowledgments */}
          <div className="space-y-2.5 pt-3 border-t border-slate-100">
            <div className="flex items-start gap-2.5">
              <input
                id="ack-zero-id"
                type="checkbox"
                checked={ackZeroId}
                onChange={(e) => {
                  setAckZeroId(e.target.checked);
                  if (formErrors.ackZeroId) {
                    setFormErrors((prev) => {
                      const next = { ...prev };
                      delete next.ackZeroId;
                      return next;
                    });
                  }
                }}
                className="w-4 h-4 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="ack-zero-id" className="text-xs text-slate-700 leading-normal">
                I understand this report is submitted anonymously. Reviewers will not know my identity unless I disclose it in the statement.
              </label>
            </div>
            {formErrors.ackZeroId && (
              <p className="text-xs font-medium text-rose-600 ml-6" role="alert">
                {formErrors.ackZeroId}
              </p>
            )}

            <div className="flex items-start gap-2.5">
              <input
                id="ack-code-save"
                type="checkbox"
                checked={ackCodeSave}
                onChange={(e) => {
                  setAckCodeSave(e.target.checked);
                  if (formErrors.ackCodeSave) {
                    setFormErrors((prev) => {
                      const next = { ...prev };
                      delete next.ackCodeSave;
                      return next;
                    });
                  }
                }}
                className="w-4 h-4 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="ack-code-save" className="text-xs text-slate-700 leading-normal">
                I understand I must save the tracking code shown after submission, and that lost codes cannot be recovered by staff.
              </label>
            </div>
            {formErrors.ackCodeSave && (
              <p className="text-xs font-medium text-rose-600 ml-6" role="alert">
                {formErrors.ackCodeSave}
              </p>
            )}
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              loadingText="Submitting..."
              className="w-full"
            >
              Submit Confidential Case
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
};
