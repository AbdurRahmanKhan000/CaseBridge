import React, { useState } from 'react';
import { Menu, X, ArrowRight, UserCircle, LogOut } from 'lucide-react';
import { User } from '../types';
import { Button } from './ui/Button';
import { Logo } from './ui/Logo';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  currentUser: User | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate, currentUser, onLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quickCode, setQuickCode] = useState('');

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'How It Works', path: '/how-it-works' },
    { label: 'Track Case', path: '/track' },
    { label: 'About', path: '/about' },
    { label: 'FAQ', path: '/faq' },
    { label: 'Privacy', path: '/privacy' },
  ];

  const handleQuickTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCode.trim()) return;
    onNavigate(`/track/${encodeURIComponent(quickCode.trim().toUpperCase())}`);
    setQuickCode('');
    setMobileMenuOpen(false);
  };

  const isStaffArea = currentPath.startsWith('/portal');

  return (
    <header className="bg-white border-b border-slate-200 text-slate-800 sticky top-0 z-40 shadow-2xs" role="banner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('/')}
              className="group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg p-1 transition-opacity hover:opacity-95"
              aria-label="CaseBridge Home"
            >
              <Logo size="md" variant="dark" />
            </button>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center space-x-1" aria-label="Main Navigation">
            {navLinks.map((link) => {
              const isActive = currentPath === link.path;
              return (
                <button
                  key={link.path}
                  onClick={() => onNavigate(link.path)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-semibold'
                      : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Header Action Controls */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Quick Track Input */}
            <form onSubmit={handleQuickTrack} className="relative flex items-center" role="search">
              <input
                type="text"
                value={quickCode}
                onChange={(e) => setQuickCode(e.target.value)}
                placeholder="CB-XXXX-XXXX-XXXX"
                aria-label="Quick track code lookup"
                className="w-44 text-xs font-mono uppercase bg-slate-50 border border-slate-200 rounded-lg py-2 pl-2.5 pr-7 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-500 transition-colors"
              />
              <button
                type="submit"
                aria-label="Submit tracking code"
                className="absolute right-1 text-slate-400 hover:text-blue-600 p-1 rounded transition-colors"
              >
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </form>

            <Button
              variant="primary"
              size="sm"
              onClick={() => onNavigate('/submit')}
            >
              Submit Case
            </Button>

            {currentUser ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <button
                  onClick={() => onNavigate('/portal/dashboard')}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                    isStaffArea
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <UserCircle className="w-4 h-4 text-blue-600" aria-hidden="true" />
                  <span className="max-w-[120px] truncate">{currentUser.fullName}</span>
                </button>
                <button
                  onClick={onLogout}
                  title="Sign out of staff portal"
                  className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors rounded-lg"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onNavigate('/login')}
              >
                Staff Portal
              </Button>
            )}
          </div>

          {/* Mobile menu toggle button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-600 hover:text-slate-900 p-2 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-3 shadow-md">
          <form onSubmit={handleQuickTrack} className="flex gap-2">
            <input
              type="text"
              value={quickCode}
              onChange={(e) => setQuickCode(e.target.value)}
              placeholder="Track: CB-XXXX-XXXX-XXXX"
              aria-label="Mobile quick track lookup"
              className="w-full text-sm font-mono uppercase bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button type="submit" variant="secondary" size="md">
              Track
            </Button>
          </form>

          <nav className="space-y-1" aria-label="Mobile Navigation">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => {
                  onNavigate(link.path);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  currentPath === link.path
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                onNavigate('/submit');
                setMobileMenuOpen(false);
              }}
              className="w-full"
            >
              Submit a Case
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                onNavigate('/track');
                setMobileMenuOpen(false);
              }}
              className="w-full"
            >
              Track Case
            </Button>

            {currentUser ? (
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 p-3 rounded-lg mt-1">
                <button
                  onClick={() => {
                    onNavigate('/portal/dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs text-blue-600 font-medium text-left truncate mr-2"
                >
                  Portal: {currentUser.fullName} ({currentUser.role})
                </button>
                <button
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs text-rose-600 underline font-medium"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  onNavigate('/login');
                  setMobileMenuOpen(false);
                }}
                className="w-full"
              >
                Staff Portal
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
