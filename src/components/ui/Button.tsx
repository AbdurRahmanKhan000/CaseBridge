import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      className = '',
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 cursor-pointer disabled:cursor-not-allowed select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 active:scale-[0.99] shrink-0 whitespace-nowrap';

    const sizeClasses = {
      sm: 'text-xs h-8 px-3 gap-1.5 min-h-[36px] sm:min-h-[32px]',
      md: 'text-sm h-10 px-4 gap-2 min-h-[44px] sm:min-h-[40px]',
      lg: 'text-base h-12 px-6 gap-2.5 min-h-[48px]',
    }[size];

    const variantClasses = {
      primary:
        'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-300 disabled:text-white shadow-xs border border-transparent',
      secondary:
        'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-400 active:bg-slate-100 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-200 shadow-2xs',
      danger:
        'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 disabled:bg-rose-200 disabled:text-rose-400 shadow-xs border border-transparent',
      outline:
        'bg-transparent text-blue-600 border border-blue-500 hover:bg-blue-50 active:bg-blue-100 disabled:text-blue-300 disabled:border-blue-200',
      ghost:
        'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 disabled:text-slate-300',
    }[variant];

    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={isLoading}
        className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin shrink-0 text-current" aria-hidden="true" />
            <span>{loadingText || children}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0" aria-hidden="true">{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span className="shrink-0" aria-hidden="true">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
