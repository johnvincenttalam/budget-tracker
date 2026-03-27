import type { Transaction } from '../types';

export function transactionsToCSV(transactions: Transaction[]): string {
  const headers = ['Date', 'Type', 'Amount', 'Category', 'Source', 'Tag', 'Note'];
  const rows = transactions
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((t) => [
      t.date,
      t.type,
      t.amount.toFixed(2),
      t.category ?? '',
      t.source ?? '',
      t.tag ?? '',
      t.note ? `"${t.note.replace(/"/g, '""')}"` : '',
    ].join(','));

  return [headers.join(','), ...rows].join('\n');
}

export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
