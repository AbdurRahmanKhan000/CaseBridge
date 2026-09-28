import React from 'react';
import { Shield, AlertCircle } from 'lucide-react';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-300 mt-auto" role="contentinfo">
      {/* Emergency Assistance Notice */}
      <div className="bg-slate-950 border-b border-slate-800 py-2.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
            <span>
              <strong className="text-slate-200">Emergency:</strong> In immediate physical danger, contact the appropriate emergency or campus response service. <a href="tel:+924299029216" className="text-amber-300 font-semibold hover:underline">+92 42 99029216</a>
            </span>
          </div>
          <span className="text-slate-500">
            CaseBridge is designed for administrative case reporting and review. It is not an emergency-response or crisis-dispatch service.
          </span>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand & Brief Summary */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Shield className="w-4 h-4" aria-hidden="true" />
              </div>
              <span className="text-base font-bold text-white tracking-tight">CaseBridge</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Privacy-focused case and complaint management with secure tracking, controlled review, communication, and accountable case handling.
            </p>
          </div>

          {/* Grievance Services */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Services
            </h3>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button
                  onClick={() => onNavigate('/submit')}
                  className="hover:text-white transition-colors text-left"
                >
                  Submit a Case
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/track')}
                  className="hover:text-white transition-colors text-left"
                >
                  Track a Case
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/how-it-works')}
                  className="hover:text-white transition-colors text-left"
                >
                  How It Works
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/faq')}
                  className="hover:text-white transition-colors text-left"
                >
                  FAQ
                </button>
              </li>
            </ul>
          </div>

          {/* Governance & Information */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Information
            </h3>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button
                  onClick={() => onNavigate('/about')}
                  className="hover:text-white transition-colors text-left"
                >
                  About & ARK Ecosystem
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/privacy')}
                  className="hover:text-white transition-colors text-left"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/security')}
                  className="hover:text-white transition-colors text-left"
                >
                  Security Controls
                </button>
              </li>
            </ul>
          </div>

          {/* Staff Access */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              STAFF ACCESS
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Authorized committee members and review staff can securely access assigned cases here.
            </p>
            <div className="pt-1">
              <button
                onClick={() => onNavigate('/login')}
                className="text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 px-3 py-2 rounded-lg transition-colors"
              >
                Staff Portal Sign In
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <p>© {new Date().getFullYear()} CaseBridge. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate('/privacy')} className="hover:text-slate-300 transition-colors">
              Privacy
            </button>
            <span aria-hidden="true" className="text-slate-700">·</span>
            <button onClick={() => onNavigate('/security')} className="hover:text-slate-300 transition-colors">
              Security
            </button>
            <span aria-hidden="true" className="text-slate-700">·</span>
            <button onClick={() => onNavigate('/faq')} className="hover:text-slate-300 transition-colors">
              FAQ
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
