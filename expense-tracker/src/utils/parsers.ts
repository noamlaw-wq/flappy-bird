import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from '../utils/uuid';
import type { Transaction, TransactionSource, ImportResult } from '../types';
import { detectCategory } from './categories';

function parseHebrewDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const cleaned = dateStr.toString().trim();
  // DD/MM/YYYY or DD-MM-YYYY
  const match = cleaned.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if (match) {
    const day = parseInt(match[1]);
    const month = parseInt(match[2]) - 1;
    const year = match[3].length === 2 ? 2000 + parseInt(match[3]) : parseInt(match[3]);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }
  // Excel serial number
  if (/^\d{4,6}$/.test(cleaned)) {
    const serial = parseInt(cleaned);
    if (serial > 40000 && serial < 60000) {
      return XLSX.SSF.parse_date_code ? new Date((serial - 25569) * 86400 * 1000) : null;
    }
  }
  const d = new Date(cleaned);
  return isNaN(d.getTime()) ? null : d;
}

function parseAmount(val: string | number): number {
  if (typeof val === 'number') return val;
  const cleaned = val.toString().replace(/[₪,\s]/g, '').replace(/\((.+)\)/, '-$1');
  return parseFloat(cleaned) || 0;
}

function findColumn(headers: string[], candidates: string[]): string | null {
  for (const c of candidates) {
    const found = headers.find(h => h && h.toString().toLowerCase().includes(c.toLowerCase()));
    if (found) return found;
  }
  return null;
}

export function parseWorkbook(file: File): Promise<XLSX.WorkBook> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array', cellDates: true, dateNF: 'dd/mm/yyyy' });
        resolve(wb);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function sheetToRows(sheet: XLSX.WorkSheet): string[][] {
  const raw = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' });
  return raw as string[][];
}

function findHeaderRow(rows: string[][], keywords: string[]): number {
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const rowStr = rows[i].join('|').toLowerCase();
    if (keywords.every(k => rowStr.includes(k))) return i;
  }
  return -1;
}

export async function parseMercantileFile(file: File): Promise<ImportResult> {
  const wb = await parseWorkbook(file);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = sheetToRows(sheet);

  // Find header row - look for date + debit/credit columns
  let headerIdx = findHeaderRow(rows, ['תאריך']);
  if (headerIdx === -1) headerIdx = findHeaderRow(rows, ['date']);
  if (headerIdx === -1) headerIdx = 0;

  const headers = rows[headerIdx].map(h => h?.toString().trim() ?? '');
  const dateCol = findColumn(headers, ['תאריך ערך', 'תאריך', 'date']) ?? headers[0];
  const descCol = findColumn(headers, ['תיאור', 'פרטים', 'description', 'אסמכתא']) ?? headers[1];
  const debitCol = findColumn(headers, ['חיוב', 'debit', 'יציאה', 'הוצאה']);
  const creditCol = findColumn(headers, ['זכות', 'credit', 'כניסה', 'הכנסה']);
  const amountCol = findColumn(headers, ['סכום', 'amount']);

  const transactions: Transaction[] = [];
  let skipped = 0;
  const batchId = Date.now().toString();

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.every(c => !c || c.toString().trim() === '')) continue;

    const hIdx = (col: string) => headers.indexOf(col);

    const rawDate = dateCol ? row[hIdx(dateCol)] : '';
    const rawDesc = descCol ? row[hIdx(descCol)] : '';

    let amount = 0;
    if (amountCol) {
      amount = parseAmount(row[hIdx(amountCol)]);
    } else if (debitCol && creditCol) {
      const debit = parseAmount(row[hIdx(debitCol)] ?? '');
      const credit = parseAmount(row[hIdx(creditCol)] ?? '');
      amount = debit > 0 ? -debit : credit;
    }

    const date = parseHebrewDate(rawDate?.toString() ?? '');
    if (!date || !rawDesc) { skipped++; continue; }
    if (amount === 0) { skipped++; continue; }

    const desc = rawDesc.toString().trim();
    transactions.push({
      id: uuidv4(),
      date,
      description: desc,
      amount: amount < 0 ? amount : -amount, // expenses are negative
      source: 'mercantile',
      category: detectCategory(desc),
      importBatch: batchId,
    });
  }

  return {
    transactions,
    source: 'mercantile',
    fileName: file.name,
    rowsRead: rows.length - headerIdx - 1,
    rowsSkipped: skipped,
  };
}

export async function parseCalFile(file: File): Promise<ImportResult> {
  const wb = await parseWorkbook(file);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = sheetToRows(sheet);

  let headerIdx = findHeaderRow(rows, ['תאריך', 'עסק']);
  if (headerIdx === -1) headerIdx = findHeaderRow(rows, ['תאריך', 'סכום']);
  if (headerIdx === -1) headerIdx = 0;

  const headers = rows[headerIdx].map(h => h?.toString().trim() ?? '');
  const dateCol = findColumn(headers, ['תאריך עסקה', 'תאריך', 'date']);
  const descCol = findColumn(headers, ['שם בית', 'בית עסק', 'פרטים', 'תיאור', 'description']);
  const amountCol = findColumn(headers, ['סכום לחיוב', 'סכום חיוב', 'סכום', 'amount', 'חיוב']);
  const billingDateCol = findColumn(headers, ['תאריך חיוב', 'billing']);

  const transactions: Transaction[] = [];
  let skipped = 0;
  const batchId = Date.now().toString();

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.every(c => !c || c.toString().trim() === '')) continue;

    const hIdx = (col: string | null) => col ? headers.indexOf(col) : -1;

    const rawDate = dateCol ? row[hIdx(dateCol)] : '';
    const rawDesc = descCol ? row[hIdx(descCol)] : row[0];
    const rawAmount = amountCol ? row[hIdx(amountCol)] : '';

    const date = parseHebrewDate(rawDate?.toString() ?? '');
    if (!date || !rawDesc) { skipped++; continue; }

    const amount = parseAmount(rawAmount?.toString() ?? '');
    if (amount === 0) { skipped++; continue; }

    const desc = rawDesc.toString().trim();
    const billingDateRaw = billingDateCol ? row[hIdx(billingDateCol)] : null;
    const billingDate = billingDateRaw ? parseHebrewDate(billingDateRaw.toString()) : null;

    transactions.push({
      id: uuidv4(),
      date,
      description: desc,
      amount: -Math.abs(amount), // CAL charges are expenses
      source: 'cal',
      category: detectCategory(desc),
      importBatch: batchId,
      rawRow: billingDate ? { billingDate: billingDate.toISOString() } : undefined,
    });
  }

  return {
    transactions,
    source: 'cal',
    fileName: file.name,
    rowsRead: rows.length - headerIdx - 1,
    rowsSkipped: skipped,
  };
}

export async function parseFile(file: File, source: TransactionSource): Promise<ImportResult> {
  if (source === 'mercantile') return parseMercantileFile(file);
  return parseCalFile(file);
}
