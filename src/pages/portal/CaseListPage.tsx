import React, { useState } from 'react';
import { Search, Filter, AlertTriangle, ArrowRight, UserCheck, Inbox } from 'lucide-react';
import { User, CasePriority, CaseStatus } from '../../types';
import { store } from '../../services/store';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/FeedbackStates';

interface CaseListPageProps {
  currentUser: User;
  onNavigate: (path: string) => void;
}

export const CaseListPage: React.FC<CaseListPageProps> = ({ currentUser, onNavigate }) => {
  const cases = store.getCases();
  const categories = store.getCategories(false);
  const isMember = currentUser.role === 'COMMITTEE_MEMBER';

  // Case-level Access: Committee Members strictly see cases assigned to them
  const baseCases = isMember ? cases.filter((c) => c.assignedToId === currentUser.id) : cases;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [onlyOverdue, setOnlyOverdue] = useState(false);
  const [assignmentFilter, setAssignmentFilter] = useState<'ALL' | 'ME' | 'UNASSIGNED'>('ALL');

  const filteredCases = baseCases.filter((c) => {
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSubject = c.subject.toLowerCase().includes(q);
      const matchCode = c.trackingCode.toLowerCase().includes(q);
      const matchCat = c.categoryName.toLowerCase().includes(q);
      if (!matchSubject && !matchCode && !matchCat) return false;
    }

    // Category
    if (selectedCategory !== 'ALL' && c.categoryId !== selectedCategory) return false;

    // Status
    if (selectedStatus !== 'ALL' && c.status !== selectedStatus) return false;

    // Priority
    if (selectedPriority !== 'ALL' && c.priority !== selectedPriority) return false;

    // Overdue
    if (onlyOverdue && (!c.isOverdue || c.status === 'Resolved' || c.status === 'Closed')) return false;

    // Assignment (for Lead and Admin)
    if (!isMember) {
      if (assignmentFilter === 'ME' && c.assignedToId !== currentUser.id) return false;
      if (assignmentFilter === 'UNASSIGNED' && c.assignedToId) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Case Queue & Triage Console
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review incoming complaints, manage assignments, monitor resolution deadlines, and communicate securely.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-slate-100 text-slate-700 font-mono px-3 py-1.5 rounded-lg border border-slate-200">
            Showing <strong className="text-slate-900">{filteredCases.length}</strong> of {cases.length} records
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 sm:p-5 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by keyword, subject, or tracking credential (CB-XXXX...)"
            aria-label="Search cases"
            className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-colors"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" aria-hidden="true" />
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label htmlFor="filter-cat" className="block text-xs font-semibold text-slate-700 mb-1">
              Category
            </label>
            <select
              id="filter-cat"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-blue-600"
            >
              <option value="ALL">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filter-status" className="block text-xs font-semibold text-slate-700 mb-1">
              Status
            </label>
            <select
              id="filter-status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-blue-600"
            >
              <option value="ALL">All Statuses</option>
              <option value="Received">Received</option>
              <option value="Assigned">Assigned</option>
              <option value="In Review">In Review</option>
              <option value="Action Required">Action Required</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div>
            <label htmlFor="filter-priority" className="block text-xs font-semibold text-slate-700 mb-1">
              Urgency / Priority
            </label>
            <select
              id="filter-priority"
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-blue-600"
            >
              <option value="ALL">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <div>
            <label htmlFor="filter-assignment" className="block text-xs font-semibold text-slate-700 mb-1">
              Investigator
            </label>
            <select
              id="filter-assignment"
              value={isMember ? 'ME' : assignmentFilter}
              disabled={isMember}
              onChange={(e) => setAssignmentFilter(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-blue-600 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {isMember ? (
                <option value="ME">Assigned to You ({baseCases.length})</option>
              ) : (
                <>
                  <option value="ALL">All Assignments</option>
                  <option value="ME">Assigned to Me</option>
                  <option value="UNASSIGNED">Unassigned Only</option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* Quick Filter Pill Buttons */}
        <div className="flex items-center gap-3 pt-1 border-t border-slate-100 text-xs">
          <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
            <input
              type="checkbox"
              checked={onlyOverdue}
              onChange={(e) => setOnlyOverdue(e.target.checked)}
              className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 w-4 h-4"
            />
            <span className="text-rose-700 font-semibold">Overdue Target SLA Only</span>
          </label>

          {(searchQuery || selectedCategory !== 'ALL' || selectedStatus !== 'ALL' || selectedPriority !== 'ALL' || onlyOverdue || assignmentFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                setSelectedStatus('ALL');
                setSelectedPriority('ALL');
                setOnlyOverdue(false);
                setAssignmentFilter('ALL');
              }}
              className="text-xs text-blue-700 hover:text-blue-900 underline font-medium ml-auto"
            >
              Reset All Filters
            </button>
          )}
        </div>
      </Card>

      {/* Case List Table / Card View */}
      {filteredCases.length === 0 ? (
        <EmptyState
          title="No Matching Cases Found"
          description="Try broadening your search query or clearing active filter parameters."
          actionText="Clear Filters"
          onAction={() => {
            setSearchQuery('');
            setSelectedCategory('ALL');
            setSelectedStatus('ALL');
            setSelectedPriority('ALL');
            setOnlyOverdue(false);
            setAssignmentFilter('ALL');
          }}
        />
      ) : (
        <Table caption="Active Cases Registry">
          <TableHeader>
            <TableRow>
              <TableHead>Tracking Code</TableHead>
              <TableHead>Subject & Category</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Lifecycle Status</TableHead>
              <TableHead>Assigned Reviewer</TableHead>
              <TableHead>Target SLA</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCases.map((c) => (
              <TableRow
                key={c.id}
                onClick={() => onNavigate(`/portal/cases/${c.id}`)}
                className="cursor-pointer"
              >
                <TableCell className="font-mono text-xs font-bold text-slate-900 whitespace-nowrap">
                  {c.trackingCode}
                </TableCell>
                <TableCell className="max-w-xs">
                  <div className="font-semibold text-slate-900 truncate">{c.subject}</div>
                  <div className="text-xs text-slate-500">{c.categoryName}</div>
                </TableCell>
                <TableCell>
                  <PriorityBadge priority={c.priority} size="sm" />
                </TableCell>
                <TableCell>
                  <StatusBadge status={c.status} isOverdue={c.isOverdue} size="sm" />
                </TableCell>
                <TableCell className="text-xs">
                  {c.assignedToName ? (
                    <span className="font-medium text-slate-800">{c.assignedToName}</span>
                  ) : (
                    <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Unassigned
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-slate-600 whitespace-nowrap tabular-nums">
                  {new Date(c.deadlineAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate(`/portal/cases/${c.id}`);
                    }}
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    Open
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};
