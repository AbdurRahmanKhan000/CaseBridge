import React from 'react';
import { Shield, Clock, FileCheck, MessageSquare, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

interface HowItWorksPageProps {
  onNavigate: (path: string) => void;
}

export const HowItWorksPage: React.FC<HowItWorksPageProps> = ({ onNavigate }) => {
  const steps = [
    {
      step: '1',
      title: 'Submit Your Case',
      desc: 'Select a category, describe the concern, and attach any relevant files. No login, student ID, or personal information is ever required.',
    },
    {
      step: '2',
      title: 'Save Your Tracking Code',
      desc: 'Receive a private 16-character tracking code. This code is your unique key to check progress and communicate with reviewers.',
    },
    {
      step: '3',
      title: 'Review & Anonymous Dialogue',
      desc: 'The committee investigates the submission. If clarifying questions arise, reviewers post messages directly to your private thread.',
    },
    {
      step: '4',
      title: 'Resolution & Findings',
      desc: 'Once the inquiry concludes, the committee records formal findings and actions taken. All steps are logged to maintain integrity.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
          How CaseBridge Works
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
          From initial intake to formal resolution, learn how your report is securely handled.
        </p>
      </div>

      {/* 4 Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {steps.map((item) => (
          <Card key={item.step} className="p-5 space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                {item.step}
              </span>
              <h2 className="text-base font-semibold text-slate-900">{item.title}</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {item.desc}
            </p>
          </Card>
        ))}
      </div>

      {/* Target Timelines */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" aria-hidden="true" />
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Target Resolution Timelines
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-600">
          Cases are prioritized by urgency and tracked against standard response targets:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
            <span className="text-xs font-semibold text-rose-600 block">Critical</span>
            <span className="text-xl font-bold text-slate-900 mt-1 block">3 Days</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">Active threats / hazards</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
            <span className="text-xs font-semibold text-amber-600 block">High</span>
            <span className="text-xl font-bold text-slate-900 mt-1 block">7 Days</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">Grading / immediate bias</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
            <span className="text-xs font-semibold text-blue-600 block">Medium</span>
            <span className="text-xl font-bold text-slate-900 mt-1 block">14 Days</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">Standard grievances</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
            <span className="text-xs font-semibold text-slate-600 block">Low</span>
            <span className="text-xl font-bold text-slate-900 mt-1 block">21 Days</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">General inquiries</span>
          </div>
        </div>
      </div>

      {/* CTA Band */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
        <div>
          <h3 className="font-semibold text-sm text-slate-900">Ready to file a concern?</h3>
          <p className="text-xs text-slate-600">No account required. Your identity remains private.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Button variant="secondary" size="sm" onClick={() => onNavigate('/faq')}>
            Read FAQ
          </Button>
          <Button variant="primary" size="sm" onClick={() => onNavigate('/submit')}>
            Submit a Case
          </Button>
        </div>
      </div>
    </div>
  );
};
