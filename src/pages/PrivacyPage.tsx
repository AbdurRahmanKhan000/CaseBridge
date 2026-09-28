import React from 'react';
import { Shield, EyeOff, Lock, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

interface PrivacyPageProps {
  onNavigate: (path: string) => void;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-lg mx-auto leading-relaxed">
          How CaseBridge protects submitter confidentiality and enforces zero-identity storage.
        </p>
      </div>

      {/* 1. What You Provide */}
      <Card className="space-y-3">
        <h2 className="text-base font-bold text-slate-900 tracking-tight">
          1. Information You Provide
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          When submitting a report, you provide only the details required to evaluate the issue:
        </p>
        <ul className="text-xs sm:text-sm text-slate-600 space-y-1.5 list-disc pl-5 leading-relaxed">
          <li><strong>Grievance Category & Urgency:</strong> Classification of the issue and assessed priority.</li>
          <li><strong>Incident Summary & Narrative:</strong> Factual statement of the concern. You decide what context to share.</li>
          <li><strong>Optional Details:</strong> Date, campus location, and supporting documents (PDF, PNG, JPG).</li>
        </ul>
      </Card>

      {/* 2. What We Never Collect */}
      <Card className="space-y-3 border-blue-200">
        <h2 className="text-base font-bold text-slate-900 tracking-tight">
          2. What We Never Collect
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Our systems are deliberately architected to omit personal identifiers:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span><strong>No Identity Data:</strong> We never collect student IDs, names, or email addresses.</span>
          </div>

          <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span><strong>No Network Logs:</strong> Client IP addresses and browser fingerprints are not stored.</span>
          </div>

          <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span><strong>No Third-Party Trackers:</strong> Zero advertising pixels, analytics cookies, or beacons.</span>
          </div>

          <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span><strong>No Account Sign-Up:</strong> Track cases using only your private 16-character code.</span>
          </div>
        </div>
      </Card>

      {/* 3. Tracking Code & Hashing */}
      <Card className="space-y-3">
        <h2 className="text-base font-bold text-slate-900 tracking-tight">
          3. Credential Hashing & Access Control
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Your tracking code is stored solely as a one-way salted cryptographic hash (SHA-256). Staff cannot view the raw code or recover misplaced codes. Case files are strictly accessible only by entering the exact code or by authorized committee members assigned to review the matter.
        </p>
      </Card>

      {/* Action */}
      <div className="text-center pt-2">
        <Button variant="primary" size="md" onClick={() => onNavigate('/submit')}>
          Submit a Confidential Case
        </Button>
      </div>
    </div>
  );
};
