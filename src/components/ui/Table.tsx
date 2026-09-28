import React from 'react';

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  caption?: string;
  children: React.ReactNode;
  className?: string;
}

export const Table: React.FC<TableProps> = ({
  caption,
  children,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-xs">
      <table className={`w-full text-left text-sm text-slate-800 ${className}`} {...props}>
        {caption && <caption className="sr-only">{caption}</caption>}
        {children}
      </table>
    </div>
  );
};

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <thead className={`bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-600 ${className}`} {...props}>
      {children}
    </thead>
  );
};

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <tbody className={`divide-y divide-slate-100 ${className}`} {...props}>
      {children}
    </tbody>
  );
};

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <tr className={`hover:bg-slate-50/70 transition-colors ${className}`} {...props}>
      {children}
    </tr>
  );
};

export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <th className={`px-4 py-3 font-semibold text-slate-700 whitespace-nowrap ${className}`} scope="col" {...props}>
      {children}
    </th>
  );
};

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <td className={`px-4 py-3 text-slate-700 align-middle ${className}`} {...props}>
      {children}
    </td>
  );
};
