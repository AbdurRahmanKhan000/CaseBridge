import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  onDismiss,
  className = '',
}) => {
  const configs = {
    info: {
      bg: 'bg-blue-50/80 border-blue-200 text-blue-900',
      icon: Info,
      iconColor: 'text-blue-700',
    },
    success: {
      bg: 'bg-emerald-50/80 border-emerald-200 text-emerald-950',
      icon: CheckCircle2,
      iconColor: 'text-emerald-700',
    },
    warning: {
      bg: 'bg-amber-50/80 border-amber-200 text-amber-950',
      icon: AlertTriangle,
      iconColor: 'text-amber-700',
    },
    error: {
      bg: 'bg-rose-50/80 border-rose-200 text-rose-950',
      icon: AlertCircle,
      iconColor: 'text-rose-700',
    },
  }[variant];

  const Icon = configs.icon;
  const role = variant === 'error' ? 'alert' : 'status';

  return (
    <div
      role={role}
      className={`border rounded-xl p-4 flex items-start gap-3 text-sm leading-relaxed transition-all ${configs.bg} ${className}`}
    >
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${configs.iconColor}`} aria-hidden="true" />
      <div className="flex-1 space-y-1">
        {title && <h4 className="font-semibold tracking-tight">{title}</h4>}
        <div className="text-sm opacity-95">{children}</div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss alert"
          className="text-slate-400 hover:text-slate-700 p-1 -mr-1 -mt-1 rounded-md transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
