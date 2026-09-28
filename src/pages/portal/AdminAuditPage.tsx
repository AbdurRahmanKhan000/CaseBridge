import React, { useState } from 'react';
import { store } from '../../services/store';
import { History, Download, Search, Filter, ShieldCheck } from 'lucide-react';
import { CaseAuditLog } from '../../types';

export const AdminAuditPage: React.FC = () => {
  const auditLogs = store.getGlobalAuditLogs();
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState<string>('ALL');

  const filteredLogs = auditLogs.filter((log) => {
    if (filterAction !== 'ALL' && log.actionType !== filterAction) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchDetails = log.details.toLowerCase().includes(q);
      const matchActor = log.actorName.toLowerCase().includes(q);
      const matchRef = (log.caseRef || '').toLowerCase().includes(q);
      const matchType = log.actionType.toLowerCase().includes(q);
      if (!matchDetails && !matchActor && !matchRef && !matchType) return false;
    }
    return true;
  });

  const exportAsJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `casebridge-audit-log-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const exportAsCSV = () => {
    const headers = ['Timestamp', 'Action Type', 'Actor Role', 'Actor Name', 'Case Reference', 'Details'];
    const rows = filteredLogs.map(l => [
      `"${l.createdAt}"`,
      `"${l.actionType}"`,
      `"${l.actorRole}"`,
      `"${l.actorName}"`,
      `"${l.caseRef || 'N/A'}"`,
      `"${l.details.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', encodeURI(csvContent));
    downloadAnchor.setAttribute('download', `casebridge-audit-log-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Technical Audit Trail
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tamper-evident, append-only event logs tracking all case transitions, priority adjustments, and administrative actions.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={exportAsCSV}
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={exportAsJSON}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="sm:col-span-2 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search audit trail by actor, case tracking code, or keyword..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <div>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Event Types</option>
              <option value="CASE_SUBMITTED">Case Submitted</option>
              <option value="STATUS_UPDATED">Status Updated</option>
              <option value="PRIORITY_UPDATED">Priority Updated</option>
              <option value="ASSIGNMENT_UPDATED">Assignment Updated</option>
              <option value="INTERNAL_NOTE_ADDED">Internal Note Added</option>
              <option value="COMMITTEE_MESSAGE_SENT">Committee Message Sent</option>
              <option value="STUDENT_MESSAGE_SENT">Student Message Sent</option>
              <option value="STAFF_LOGIN">Staff Login</option>
              <option value="USER_CREATED">User Created</option>
              <option value="CATEGORY_UPDATED">Category Updated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Case Reference</th>
                <th className="py-3 px-4">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-sans">
                    No audit records match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {log.actionType}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-sans text-slate-800 whitespace-nowrap">
                      <div className="font-semibold">{log.actorName}</div>
                      <div className="text-[10px] text-slate-500 uppercase">{log.actorRole}</div>
                    </td>
                    <td className="py-2.5 px-4 font-bold text-blue-900 whitespace-nowrap">
                      {log.caseRef || '—'}
                    </td>
                    <td className="py-2.5 px-4 font-sans text-slate-700 max-w-md">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
