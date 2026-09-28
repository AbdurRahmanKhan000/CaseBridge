import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ArrowRight, HelpCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';

interface FaqPageProps {
  onNavigate: (path: string) => void;
}

interface FaqItem {
  question: string;
  answer: string;
}

export const FaqPage: React.FC<FaqPageProps> = ({ onNavigate }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FaqItem[] = [
    {
      question: 'What is CaseBridge?',
      answer:
        'CaseBridge is an independent university reporting portal. It allows students, researchers, and campus staff to submit complaints about misconduct, grading irregularities, or safety concerns directly to authorized committees without revealing personal identity.',
    },
    {
      question: 'Do I need an account to report?',
      answer:
        'No. Submissions do not require creating an account or logging into campus credentials. When you submit a case, you receive a unique 16-character tracking code that serves as your access credential.',
    },
    {
      question: 'What is the tracking code and what if I lose it?',
      answer:
        'The tracking code (e.g. CB-8F3K-9M2X-7R4Q) is your only access key to check status updates and communicate with reviewers. Because CaseBridge stores only irreversible cryptographic hashes, staff cannot recover lost codes. If lost, you should submit a new report.',
    },
    {
      question: 'Can I communicate with the committee after submitting?',
      answer:
        'Yes. You can access your case anytime via the Track portal using your tracking code. You can read reviewer updates and reply with supplemental information while remaining completely anonymous.',
    },
    {
      question: 'Can I attach evidence or documents?',
      answer:
        'Yes. Supporting files in PDF, PNG, or JPG formats up to 10 MB each can be attached during submission or added later in follow-up messages.',
    },
    {
      question: 'Who reviews my report?',
      answer:
        'Only authorized members of the University Ethics Committee assigned to your case have access to review the statement and evidence.',
    },
    {
      question: 'Is CaseBridge an emergency service?',
      answer:
        'No. CaseBridge is for administrative review and does not provide emergency dispatch. If someone is in immediate physical danger, contact Campus Emergency Dispatch at 555-0199 or call 911 immediately.',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
          Frequently Asked Questions
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-lg mx-auto leading-relaxed">
          Quick answers about case submission, tracking codes, and confidentiality.
        </p>
      </div>

      {/* Accordion List */}
      <div className="space-y-3" role="region" aria-label="Frequently Asked Questions">
        {faqs.map((item, idx) => {
          const isOpen = openIndex === idx;

          return (
            <div
              key={idx}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs transition-colors"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-expanded={isOpen}
              >
                <span className="font-semibold text-sm sm:text-base text-slate-900 pr-4">
                  {item.question}
                </span>
                <span className="text-slate-400 shrink-0">
                  {isOpen ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4" />}
                </span>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/40">
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Action Footer */}
      <div className="text-center pt-4">
        <p className="text-xs text-slate-500 mb-3">Still have questions or ready to submit?</p>
        <div className="flex justify-center gap-3">
          <Button variant="primary" size="md" onClick={() => onNavigate('/submit')}>
            Submit a Case
          </Button>
          <Button variant="secondary" size="md" onClick={() => onNavigate('/track')}>
            Track Case
          </Button>
        </div>
      </div>
    </div>
  );
};
