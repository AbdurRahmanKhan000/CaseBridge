import React from 'react';
import { LayoutDashboard, Inbox, Users, Layers, Settings, FileText, LogOut, Shield } from 'lucide-react';
import { User } from '../../types';

interface PortalLayoutProps {
  currentUser: User;
  currentPath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const PortalLayout: React.FC<PortalLayoutProps> = ({
  currentUser,
  currentPath,
  onNavigate,
  onLogout,
  children,
}) => {
  const isLead = currentUser.role === 'COMMITTEE_LEAD' || currentUser.role === 'SYSTEM_ADMIN';
  const isAdmin = currentUser.role === 'SYSTEM_ADMIN';

  const navItems = [
    { label: 'Overview Dashboard', path: '/portal/dashboard', icon: LayoutDashboard },
    { label: 'Case Queue & Triage', path: '/portal/cases', icon: Inbox },
    ...(isAdmin ? [{ label: 'User & Role Management', path: '/portal/admin/users', icon: Users }] : []),
    ...(isAdmin ? [{ label: 'Complaint Categories', path: '/portal/admin/categories', icon: Layers }] : []),
    ...(isAdmin ? [{ label: 'System Settings', path: '/portal/admin/settings', icon: Settings }] : []),
    ...(isLead ? [{ label: 'Technical Audit Logs', path: '/portal/admin/audit', icon: FileText }] : []),
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Staff Header bar */}
      <header className="bg-white border-b border-slate-200 text-slate-800 shadow-2xs" role="banner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('/portal/dashboard')}
              className="flex items-center gap-2.5 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg p-1"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
                <Shield className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <span className="font-bold text-sm text-slate-900 block tracking-tight">CaseBridge Console</span>
                <span className="text-[11px] text-slate-500 block font-normal">Committee Review Portal</span>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-semibold text-slate-800 block">{currentUser.fullName}</span>
              <span className="text-[11px] text-blue-600 font-mono block">
                {currentUser.role.replace('_', ' ')} · {currentUser.department}
              </span>
            </div>

            <button
              onClick={onLogout}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 border border-slate-200 focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Sign out of committee portal"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Horizontal Navigation Tabs */}
        <div className="bg-slate-50/70 border-t border-slate-200">
          <nav
            aria-label="Portal Navigation Tabs"
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto scrollbar-none py-1.5 space-x-1"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                currentPath === item.path ||
                (item.path === '/portal/cases' && currentPath.startsWith('/portal/cases/'));
              return (
                <button
                  key={item.path}
                  onClick={() => onNavigate(item.path)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8" role="main">
        {children}
      </main>
    </div>
  );
};
