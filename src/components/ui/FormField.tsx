import React from 'react';

interface FormFieldProps {
  id: string;
  label: string;
  required?: boolean;
  helpText?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  required = false,
  helpText,
  error,
  children,
  className = '',
}) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="block text-sm font-semibold text-slate-800">
          {label}
          {required && (
            <span className="text-rose-600 ml-1 font-bold" aria-hidden="true">
              *
            </span>
          )}
        </label>
      </div>

      {children}

      {helpText && !error && (
        <p id={`${id}-help`} className="text-xs text-slate-500 leading-normal">
          {helpText}
        </p>
      )}

      {error && (
        <p id={`${id}-error`} className="text-xs font-medium text-rose-700 leading-normal" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  ({ className = '', error, id, ...props }, ref) => {
    return (
      <input
        ref={ref}
        id={id}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${id}-error` : `${id}-help`}
        className={`w-full text-base sm:text-sm bg-white border rounded-lg px-3.5 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-1 transition-colors min-h-[44px] sm:min-h-[40px] ${
          error
            ? 'border-rose-400 focus:border-rose-600 focus:ring-rose-500/20 bg-rose-50/20'
            : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/20'
        } disabled:bg-slate-100 disabled:text-slate-500 disabled:border-slate-200 ${className}`}
        {...props}
      />
    );
  }
);
TextInput.displayName = 'TextInput';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', error, id, rows = 4, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${id}-error` : `${id}-help`}
        className={`w-full text-base sm:text-sm bg-white border rounded-lg p-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-1 transition-colors leading-relaxed ${
          error
            ? 'border-rose-400 focus:border-rose-600 focus:ring-rose-500/20 bg-rose-50/20'
            : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/20'
        } disabled:bg-slate-100 disabled:text-slate-500 disabled:border-slate-200 ${className}`}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', error, id, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        id={id}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${id}-error` : `${id}-help`}
        className={`w-full text-base sm:text-sm bg-white border rounded-lg px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-1 transition-colors min-h-[44px] sm:min-h-[40px] ${
          error
            ? 'border-rose-400 focus:border-rose-600 focus:ring-rose-500/20 bg-rose-50/20'
            : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/20'
        } disabled:bg-slate-100 disabled:text-slate-500 disabled:border-slate-200 ${className}`}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = 'Select';
