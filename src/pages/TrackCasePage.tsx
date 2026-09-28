import React, { useState } from 'react';
import { Search, Shield, Lock, AlertCircle, Key, ArrowRight, HelpCircle } from 'lucide-react';
import { checkLookupRateLimit } from '../services/security';
import { Button } from '../components/ui/Button';
import { FormField, TextInput } from '../components/ui/FormField';
import { Alert } from '../components/ui/Alert';
import { Card } from '../components/ui/Card';

interface TrackCasePageProps {
  onNavigate: (path: string) => void;
  initialCode?: string;
}

export const TrackCasePage: React.FC<TrackCasePageProps> = ({ onNavigate, initialCode = '' }) => {
  const [code, setCode] = useState(initialCode);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const [formatError, setFormatError] = useState<string | null>(null);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setFormatError('Please enter your tracking code.');
      return;
    }

    // Format validation
    const formatRegex = /^CB-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/;
    if (!formatRegex.test(cleanCode) && !cleanCode.match(/^[A-Z2-9]{12}$/)) {
      setFormatError('Tracking codes follow the format CB-XXXX-XXXX-XXXX.');
      return;
    }

    // Rate limiting check
    const rateCheck = checkLookupRateLimit();
    if (!rateCheck.allowed) {
      setRateLimitError(
        `Too many lookup attempts. To protect student case files against brute-force guessing, please wait ${
          rateCheck.retryAfterSeconds || 60
        } seconds before trying again.`
      );
      return;
    }

    setFormatError(null);
    setRateLimitError(null);
    onNavigate(`/track/${encodeURIComponent(cleanCode)}`);
  };

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Track Your Case
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
          Enter your 16-character tracking code to view status updates and committee messages.
        </p>
      </div>

      {/* Lookup Card */}
      <Card className="p-6 sm:p-8 space-y-5">
        <form onSubmit={handleLookup} className="space-y-4">
          <FormField
            id="track-code-input"
            label="Tracking Code"
            required
            error={formatError || undefined}
          >
            <div className="relative">
              <TextInput
                id="track-code-input"
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (formatError) setFormatError(null);
                  if (rateLimitError) setRateLimitError(null);
                }}
                placeholder="CB-XXXX-XXXX-XXXX"
                error={!!formatError}
                className="font-mono uppercase tracking-wider pr-10 text-base"
              />
              <Key className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" aria-hidden="true" />
            </div>
          </FormField>

          {rateLimitError && (
            <Alert variant="error" onDismiss={() => setRateLimitError(null)}>
              {rateLimitError}
            </Alert>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            leftIcon={<Search className="w-4 h-4" />}
          >
            Access Case Record
          </Button>
        </form>

        {/* Demo Fast Fill Helpers */}
        <div className="border-t border-slate-100 pt-3.5 space-y-2">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Sample Tracking Codes:
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setCode('CB-9K2M-4F8X-7R3A');
                setFormatError(null);
              }}
              className="px-2.5 py-1 text-xs font-mono bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-md border border-slate-200 transition-colors"
            >
              CB-9K2M-4F8X-7R3A (In Review)
            </button>
            <button
              type="button"
              onClick={() => {
                setCode('CB-7T4H-2W9P-5B6N');
                setFormatError(null);
              }}
              className="px-2.5 py-1 text-xs font-mono bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-md border border-slate-200 transition-colors"
            >
              CB-7T4H-2W9P-5B6N (Overdue)
            </button>
            <button
              type="button"
              onClick={() => {
                setCode('CB-3D8E-6Q1Z-8K9V');
                setFormatError(null);
              }}
              className="px-2.5 py-1 text-xs font-mono bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-md border border-slate-200 transition-colors"
            >
              CB-3D8E-6Q1Z-8K9V (Resolved)
            </button>
          </div>
        </div>
      </Card>

      {/* Helpful Guidance */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 flex items-start gap-2.5">
        <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
        <p className="leading-relaxed">
          Your tracking code was generated upon submission. Because CaseBridge stores only irreversible hashes, lost codes cannot be recovered by staff.
        </p>
      </div>
    </div>
  );
};
