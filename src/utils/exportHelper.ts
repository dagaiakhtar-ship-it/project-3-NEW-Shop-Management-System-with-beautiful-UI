/**
 * Export Helper
 * Utility for converting structured JSON records to downloadable CSV files,
 * enabling shop managers to export their lists directly.
 */
export const exportToCSV = <T,>(
  data: T[],
  headers: { key: keyof T; label: string }[],
  filename = 'shop-export.csv'
): void => {
  if (data.length === 0) return;

  // Header row
  const headerRow = headers.map((h) => `"${h.label.replace(/"/g, '""')}"`).join(',');

  // Value rows
  const valueRows = data.map((row) => {
    return headers
      .map((h) => {
        const val = row[h.key];
        const stringVal = val === null || val === undefined ? '' : String(val);
        return `"${stringVal.replace(/"/g, '""')}"`;
      })
      .join(',');
  });

  const csvContent = [headerRow, ...valueRows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
