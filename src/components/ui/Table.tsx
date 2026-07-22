import React from 'react';
import Loader from './Loader';

export interface TableColumn<T> {
  key: string;
  header: React.ReactNode;
  render?: (row: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string | number;
  isLoading?: boolean;
  emptyText?: string;
  onRowClick?: (row: T) => void;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyText = 'No data available',
  onRowClick,
}: TableProps<T>) {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <div className="w-full overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-sm">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/50">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`py-3 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase ${
                  alignClasses[col.align || 'left']
                } ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="py-12 text-center">
                <div className="flex flex-col items-center justify-center gap-3">
                  <Loader size="md" />
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 animate-pulse uppercase tracking-wider">
                    Loading records...
                  </span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-12 text-center text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr
                key={keyExtractor(row, index)}
                onClick={() => onRowClick?.(row)}
                className={`transition-colors duration-150 border-b border-slate-50 dark:border-slate-800/40
                  ${onRowClick ? 'cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/20' : 'hover:bg-slate-50/25 dark:hover:bg-slate-800/10'}
                `}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`py-3.5 px-4 text-xs font-medium text-slate-700 dark:text-slate-300 ${
                      alignClasses[col.align || 'left']
                    } ${col.className || ''}`}
                  >
                    {col.render ? col.render(row, index) : (row as any)[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
