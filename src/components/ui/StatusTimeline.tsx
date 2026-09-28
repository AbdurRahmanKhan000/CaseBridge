import React from 'react';
import { CaseStatus } from '../../types';
import { Check, Clock, AlertTriangle, FileText, CheckCircle2, UserCheck, AlertCircle } from 'lucide-react';

interface StatusTimelineProps {
  currentStatus: CaseStatus;
  isOverdue?: boolean;
  deadlineAt?: string;
  createdAt?: string;
  resolvedAt?: string;
}

const STAGES: { status: CaseStatus; label: string; desc: string }[] = [
  { status: 'Received', label: 'Received', desc: 'Securely logged in system' },
  { status: 'Assigned', label: 'Assigned', desc: 'Delegated to review lead' },
  { status: 'In Review', label: 'In Review', desc: 'Active investigation' },
  { status: 'Action Required', label: 'Action Required', desc: 'Clarification or response' },
  { status: 'Resolved', label: 'Resolved', desc: 'Formal findings documented' },
  { status: 'Closed', label: 'Closed', desc: 'Case file completed' },
];

export const StatusTimeline: React.FC<StatusTimelineProps> = ({
  currentStatus,
  isOverdue = false,
  deadlineAt,
  createdAt,
  resolvedAt,
}) => {
  const getStageIndex = (s: CaseStatus): number => {
    switch (s) {
      case 'Received':
        return 0;
      case 'Assigned':
        return 1;
      case 'In Review':
        return 2;
      case 'Action Required':
        return 3;
      case 'Resolved':
        return 4;
      case 'Closed':
        return 5;
      default:
        return 0;
    }
  };

  const currentIndex = getStageIndex(currentStatus);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Case Lifecycle Status
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <h3 className="text-lg font-bold text-slate-900">{currentStatus}</h3>
            {isOverdue && currentStatus !== 'Resolved' && currentStatus !== 'Closed' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Overdue Target SLA</span>
              </span>
            )}
          </div>
        </div>

        {deadlineAt && currentStatus !== 'Resolved' && currentStatus !== 'Closed' && (
          <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
            <span>Target Resolution: </span>
            <strong className="text-slate-800">
              {new Date(deadlineAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </strong>
          </div>
        )}
      </div>

      {/* Accessible Stepper Timeline */}
      <nav aria-label="Progress Timeline" className="py-2">
        <ol className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          {STAGES.map((stage, idx) => {
            const isCompleted = idx < currentIndex || (currentStatus === 'Closed');
            const isCurrent = idx === currentIndex && currentStatus !== 'Closed';
            const isPending = idx > currentIndex && currentStatus !== 'Closed';

            return (
              <li
                key={stage.status}
                className={`relative flex flex-col p-3 rounded-lg border text-left transition-all ${
                  isCurrent
                    ? 'border-blue-600 bg-blue-50/50 shadow-2xs'
                    : isCompleted
                    ? 'border-slate-200 bg-slate-50/80'
                    : 'border-dashed border-slate-200 bg-white opacity-70'
                }`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
                      isCurrent
                        ? 'bg-blue-600 text-white'
                        : isCompleted
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-3 h-3 stroke-[3]" aria-hidden="true" />
                    ) : (
                      idx + 1
                    )}
                  </span>

                  <span
                    className={`text-[11px] font-medium uppercase tracking-wider ${
                      isCurrent
                        ? 'text-blue-800 font-bold'
                        : isCompleted
                        ? 'text-slate-600'
                        : 'text-slate-400'
                    }`}
                  >
                    {isCurrent ? 'Active' : isCompleted ? 'Completed' : 'Pending'}
                  </span>
                </div>

                <div className="font-semibold text-xs sm:text-sm text-slate-900 leading-snug">
                  {stage.label}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 leading-tight line-clamp-2">
                  {stage.desc}
                </div>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
};
