import * as XLSX from 'xlsx';
import type { Transaction } from '../types';
import { CATEGORY_LABELS } from './categories';
import { format } from 'date-fns';

export function exportToExcel(transactions: Transaction[]): void {
  const rows = transactions.map(tx => ({
    'תאריך': format(tx.date, 'dd/MM/yyyy'),
    'תיאור': tx.description,
    'סכום': Math.abs(tx.amount),
    'הכנסה/הוצאה': tx.amount > 0 ? 'הכנסה' : 'הוצאה',
    'קטגוריה': CATEGORY_LABELS[tx.category],
    'מקור': tx.source === 'mercantile' ? 'מרכנתיל' : 'כאל',
    'כפילות דיירקט': tx.isCalDirectDebit ? 'כן' : 'לא',
  }));

  const ws = XLSX.utils.json_to_sheet(rows, { skipHeader: false });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'הוצאות');

  // Column widths
  ws['!cols'] = [
    { wch: 12 }, { wch: 40 }, { wch: 12 }, { wch: 14 }, { wch: 18 }, { wch: 10 }, { wch: 14 },
  ];

  XLSX.writeFile(wb, `הוצאות_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
}

export function generateGoogleSheetsCSV(transactions: Transaction[]): string {
  const header = 'תאריך,תיאור,סכום,הכנסה_הוצאה,קטגוריה,מקור,כפילות_דיירקט';
  const rows = transactions.map(tx =>
    [
      format(tx.date, 'dd/MM/yyyy'),
      `"${tx.description.replace(/"/g, '""')}"`,
      Math.abs(tx.amount).toFixed(2),
      tx.amount > 0 ? 'הכנסה' : 'הוצאה',
      CATEGORY_LABELS[tx.category],
      tx.source === 'mercantile' ? 'מרכנתיל' : 'כאל',
      tx.isCalDirectDebit ? 'כן' : 'לא',
    ].join(',')
  );
  return [header, ...rows].join('\n');
}

export function downloadCSV(content: string, filename: string): void {
  const bom = '﻿'; // BOM for Hebrew support in Excel
  const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
