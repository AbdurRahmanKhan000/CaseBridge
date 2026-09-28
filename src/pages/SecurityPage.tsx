import React from 'react';
import { Shield, Lock, FileCheck, Server, KeyRound, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

interface SecurityPageProps {
  onNavigate: (path: string) => void;
}

export const SecurityPage: React.FC<SecurityPageProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
          Security Controls
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-lg mx-auto leading-relaxed">
          How CaseBridge protects case confidentiality and preserves data integrity.
        </p>
      </div>

      {/* 4 Security Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="space-y-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <KeyRound className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-slate-900">Cryptographic Hashing</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Tracking codes use SHA-256 salted hashes. Raw codes are never persisted in plaintext, preventing rainbow-table lookup attacks.
          </p>
        </Card>

        <Card className="space-y-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Lock className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-slate-900">Automated Rate Limiting</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Lookup endpoints automatically throttle repeated requests to protect case files against automated brute-force attacks.
          </p>
        </Card>

        <Card className="space-y-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Server className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-slate-900">Role-Based Access</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Strict permissions segregate administrative functions. Reviewers only access cases assigned to their departmental queue.
          </p>
        </Card>

        <Card className="space-y-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileCheck className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-slate-900">Immutable Audit Trail</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Status changes, priority adjustments, and assignments generate permanent timestamped logs that cannot be modified or deleted.
          </p>
        </Card>
      </div>

      {/* Security Architecture Summary */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-2">
        <h2 className="text-sm font-bold text-slate-900">Engineering Standards</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          CaseBridge is built adhering to OWASP Application Security Verification Standards (ASVS), enforcing strict input validation, CSP headers, and WCAG 2.2 AA accessibility guidelines.
        </p>
      </div>

      {/* Action */}
      <div className="text-center pt-2">
        <Button variant="primary" size="md" onClick={() => onNavigate('/submit')}>
          Submit a Case
        </Button>
      </div>
    </div>
  );
};
