import React from 'react';
import { Inbox, Clock, AlertTriangle, CheckCircle2, ShieldAlert, ArrowRight, UserCheck, FileText } from 'lucide-react';
import { User } from '../../types';
import { store } from '../../services/store';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Alert } from '../../components/ui/Alert';

interface DashboardPageProps {
  currentUser: User;
  onNavigate: (path: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ currentUser, onNavigate }) => {
  const cases = store.getCases();

  const totalCases = cases.length;
  const inReviewCases = cases.filter((c) => c.status === 'In Review').length;
  const actionRequiredCases = cases.filter((c) => c.status === 'Action Required').length;
  const overdueCases = cases.filter(
    (c) => c.isOverdue && c.status !== 'Resolved' && c.status !== 'Closed'
  ).length;
  const resolvedCases = cases.filter((c) => c.status === 'Resolved' || c.status === 'Closed').length;
  const myAssignedCases = cases.filter(
    (c) => c.assignedToId === currentUser.id && c.status !== 'Closed' && c.status !== 'Resolved'
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome & Role Banner */}
      <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Reviewer Console: {currentUser.fullName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Institutional Role: <span className="font-semibold text-slate-700">{currentUser.role.replace('_', ' ')}</span> · {currentUser.department}
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => onNavigate('/portal/cases')}
          leftIcon={<Inbox className="w-4 h-4" />}
        >
          Open Case Queue
        </Button>
      </Card>

      {/* Overdue Alert Banner */}
      {overdueCases > 0 && (
        <Alert
          variant="error"
          title={`Escalation Notice: ${overdueCases} Case${overdueCases > 1 ? 's' : ''} Exceeded Target SLA`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
            <p className="text-xs sm:text-sm text-rose-900">
              One or more complaints have exceeded established resolution deadlines. Committee Leads must review assignments or expedite findings.
            </p>
            <Button
              variant="danger"
              size="sm"
              onClick={() => onNavigate('/portal/cases')}
              className="shrink-0"
            >
              Review Overdue Queue
            </Button>
          </div>
        </Alert>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Active Registry
          </span>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">{totalCases}</div>
          <span className="text-xs text-slate-400">Total registered complaints</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
            In Review
          </span>
          <div className="text-2xl font-bold text-blue-600 tabular-nums">{inReviewCases}</div>
          <span className="text-xs text-slate-400">Actively under investigation</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
            Action Required
          </span>
          <div className="text-2xl font-bold text-amber-900 tabular-nums">{actionRequiredCases}</div>
          <span className="text-xs text-slate-400">Awaiting input or hearing</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-700">
            Overdue SLA
          </span>
          <div className="text-2xl font-bold text-rose-700 tabular-nums">{overdueCases}</div>
          <span className="text-xs text-rose-600 font-medium">Requires escalation</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            Resolved
          </span>
          <div className="text-2xl font-bold text-emerald-800 tabular-nums">{resolvedCases}</div>
          <span className="text-xs text-slate-400">Findings documented</span>
        </div>
      </div>

      {/* Two Columns: Assigned to Me + Recent Caseload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Assigned to Current User */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-blue-700" aria-hidden="true" />
              <span>Assigned to You ({myAssignedCases.length})</span>
            </h2>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('/portal/cases')}>
              View Queue
            </Button>
          </div>

          {myAssignedCases.length === 0 ? (
            <p className="text-xs sm:text-sm text-slate-500 italic py-6 text-center">
              No active cases are currently assigned to your profile.
            </p>
          ) : (
            <div className="space-y-2.5">
              {myAssignedCases.map((c) => (
                <div
                  key={c.id}
                  onClick={() => onNavigate(`/portal/cases/${c.id}`)}
                  className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-lg hover:border-blue-400 hover:bg-white transition-all cursor-pointer space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-800">{c.trackingCode}</span>
                    <StatusBadge status={c.status} isOverdue={c.isOverdue} size="sm" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 truncate">{c.subject}</h3>
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5">
                    <span>{c.categoryName}</span>
                    <PriorityBadge priority={c.priority} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Inflow Cases */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-700" aria-hidden="true" />
              <span>Recent Submissions ({cases.slice(0, 5).length})</span>
            </h2>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('/portal/cases')}>
              All Cases
            </Button>
          </div>

          <div className="space-y-2.5">
            {cases.slice(0, 5).map((c) => (
              <div
                key={c.id}
                onClick={() => onNavigate(`/portal/cases/${c.id}`)}
                className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-lg hover:border-blue-400 hover:bg-white transition-all cursor-pointer space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-800">{c.trackingCode}</span>
                  <StatusBadge status={c.status} isOverdue={c.isOverdue} size="sm" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 truncate">{c.subject}</h3>
                <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5">
                  <span>Assigned: <strong className="text-slate-700">{c.assignedToName || 'Unassigned'}</strong></span>
                  <PriorityBadge priority={c.priority} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </Card>

      </div>
    </div>
  );
};
