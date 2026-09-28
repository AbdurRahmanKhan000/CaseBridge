import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  header,
  footer,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`bg-white border border-slate-200 rounded-xl shadow-xs transition-colors overflow-hidden ${className}`}
      {...props}
    >
      {header && (
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          {header}
        </div>
      )}
      <div className="p-5 sm:p-6">{children}</div>
      {footer && (
        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50">
          {footer}
        </div>
      )}
    </div>
  );
};
