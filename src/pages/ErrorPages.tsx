import React from 'react';
import { AlertCircle, ShieldAlert, Clock, ArrowLeft } from 'lucide-react';

interface ErrorViewProps {
  type: '404' | '403' | '429' | '500';
  onNavigate: (path: string) => void;
}

export const ErrorView: React.FC<ErrorViewProps> = ({ type, onNavigate }) => {
  const configs = {
    '404': {
      code: '404',
      title: 'Page Not Found',
      desc: 'The page or resource you requested could not be found. Check the URL or return to safe university navigation.',
      icon: AlertCircle,
      iconColor: 'text-slate-500 bg-slate-100',
    },
    '403': {
      code: '403',
      title: 'Access Denied / Insufficient Privileges',
      desc: 'You do not have the required administrative or committee credentials to inspect this area.',
      icon: ShieldAlert,
      iconColor: 'text-rose-600 bg-rose-50',
    },
    '429': {
      code: '429',
      title: 'Rate Limit Threshold Exceeded',
      desc: 'To prevent tracking code enumeration and brute-force guessing attacks, your requests have been throttled. Please wait two minutes before attempting again.',
      icon: Clock,
      iconColor: 'text-amber-600 bg-amber-50',
    },
    '500': {
      code: '500',
      title: 'Internal Integrity Service Error',
      desc: 'An unexpected processing fault occurred. No private student data has been compromised.',
      icon: AlertCircle,
      iconColor: 'text-rose-600 bg-rose-50',
    }
  };

  const config = configs[type] || configs['404'];
  const Icon = config.icon;

  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center space-y-5">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto ${config.iconColor}`}>
        <Icon className="w-8 h-8" />
      </div>

      <div className="space-y-1">
        <span className="font-mono text-xs font-bold uppercase text-slate-400">Error {config.code}</span>
        <h1 className="text-2xl font-bold text-slate-900">{config.title}</h1>
      </div>

      <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
        {config.desc}
      </p>

      <div className="pt-2">
        <button
          onClick={() => onNavigate('/')}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Home</span>
        </button>
      </div>
    </div>
  );
};
