import React from 'react';
import { Loader2, AlertCircle, CheckCircle2, Inbox, AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import { Modal } from './Modal';

export const LoadingState: React.FC<{
  message?: string;
  subtext?: string;
  className?: string;
}> = ({
  message = 'Loading record details...',
  subtext = 'Connecting to secure university data store',
  className = '',
}) => {
  return (
    <div
      role="status"
      className={`flex flex-col items-center justify-center p-12 text-center space-y-3 ${className}`}
    >
      <Loader2 className="w-8 h-8 text-blue-700 animate-spin" aria-hidden="true" />
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-slate-800">{message}</h3>
        {subtext && <p className="text-xs text-slate-500">{subtext}</p>}
      </div>
      <span className="sr-only">Loading content, please wait.</span>
    </div>
  );
};

export const EmptyState: React.FC<{
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}> = ({
  title,
  description,
  actionText,
  onAction,
  icon,
  className = '',
}) => {
  return (
    <div
      className={`border border-dashed border-slate-300 rounded-xl p-8 sm:p-12 text-center flex flex-col items-center justify-center max-w-md mx-auto space-y-4 ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
        {icon || <Inbox className="w-6 h-6" aria-hidden="true" />}
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-slate-800">{title}</h3>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{description}</p>
      </div>
      {actionText && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};

export const ErrorState: React.FC<{
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}> = ({
  title = 'Unable to Complete Request',
  message,
  onRetry,
  className = '',
}) => {
  return (
    <div
      role="alert"
      className={`border border-rose-200 bg-rose-50/50 rounded-xl p-6 sm:p-8 text-center flex flex-col items-center justify-center max-w-md mx-auto space-y-3 ${className}`}
    >
      <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-700">
        <AlertCircle className="w-6 h-6" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-rose-950">{title}</h3>
        <p className="text-xs text-rose-800 leading-relaxed">{message}</p>
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} className="mt-2">
          Try Again
        </Button>
      )}
    </div>
  );
};

export const SuccessState: React.FC<{
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}> = ({
  title,
  description,
  actionText,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`border border-emerald-200 bg-emerald-50/40 rounded-xl p-6 sm:p-8 text-center flex flex-col items-center justify-center max-w-md mx-auto space-y-3 ${className}`}
    >
      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
        <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-emerald-950">{title}</h3>
        <p className="text-xs text-emerald-800 leading-relaxed">{description}</p>
      </div>
      {actionText && onAction && (
        <Button variant="primary" size="sm" onClick={onAction} className="mt-2">
          {actionText}
        </Button>
      )}
    </div>
  );
};

export const ConfirmationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDangerous?: boolean;
  isLoading?: boolean;
}> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  isDangerous = false,
  isLoading = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant={isDangerous ? 'danger' : 'primary'}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        {isDangerous && (
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
        )}
        <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
      </div>
    </Modal>
  );
};
