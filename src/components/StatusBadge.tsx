import React from 'react';
import { CasePriority, CaseStatus } from '../types';
import { AlertCircle, Clock, CheckCircle2, ShieldAlert, FileText, ArrowRightCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: CaseStatus;
  isOverdue?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, isOverdue, size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5 font-medium'
  }[size];

  const getStatusConfig = () => {
    switch (status) {
      case 'Received':
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-300',
          icon: FileText,
          label: 'Received'
        };
      case 'Assigned':
        return {
          bg: 'bg-sky-50 text-sky-800 border-sky-300',
          icon: Clock,
          label: 'Assigned'
        };
      case 'In Review':
        return {
          bg: 'bg-blue-50 text-blue-800 border-blue-300',
          icon: ArrowRightCircle,
          label: 'In Review'
        };
      case 'Action Required':
        return {
          bg: 'bg-amber-50 text-amber-900 border-amber-300',
          icon: AlertCircle,
          label: 'Action Required'
        };
      case 'Resolved':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          icon: CheckCircle2,
          label: 'Resolved'
        };
      case 'Closed':
        return {
          bg: 'bg-slate-200 text-slate-800 border-slate-400',
          icon: CheckCircle2,
          label: 'Closed'
        };
      default:
        return {
          bg: 'bg-slate-100 text-slate-800 border-slate-300',
          icon: FileText,
          label: status
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap">
      <span className={`inline-flex items-center gap-1 rounded-md border font-medium ${config.bg} ${sizeClasses}`}>
        <Icon className="w-3.5 h-3.5" aria-hidden="true" />
        <span>{config.label}</span>
      </span>
      {isOverdue && status !== 'Resolved' && status !== 'Closed' && (
        <span className="inline-flex items-center gap-1 rounded-md border border-rose-300 bg-rose-50 text-rose-800 text-xs px-2 py-0.5 font-semibold animate-pulse">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" aria-hidden="true" />
          <span>OVERDUE</span>
        </span>
      )}
    </div>
  );
};

export const PriorityBadge: React.FC<{ priority: CasePriority; size?: 'sm' | 'md' }> = ({ priority, size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1 font-medium';

  const getPriorityConfig = () => {
    switch (priority) {
      case 'Low':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'Medium':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'High':
        return 'bg-amber-50 text-amber-800 border-amber-300';
      case 'Critical':
        return 'bg-rose-50 text-rose-800 border-rose-300 font-semibold';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <span className={`inline-flex items-center rounded border font-medium ${getPriorityConfig()} ${sizeClasses}`}>
      {priority}
    </span>
  );
};
