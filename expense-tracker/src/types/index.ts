export type TransactionSource = 'mercantile' | 'cal';

export type TransactionCategory =
  | 'מזון_מכולת'
  | 'מסעדות_קפה'
  | 'דלק_רכב'
  | 'קניות_בגדים'
  | 'בריאות_רפואה'
  | 'חינוך'
  | 'בידור'
  | 'תחבורה'
  | 'תשלומים_קבועים'
  | 'ביטוח'
  | 'שיפוצים_בית'
  | 'אחר';

export interface Transaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  source: TransactionSource;
  category: TransactionCategory;
  isCalDirectDebit?: boolean;
  duplicateOfId?: string;
  importBatch?: string;
  rawRow?: Record<string, string>;
}

export interface MonthlyStats {
  month: string;
  year: number;
  monthNum: number;
  total: number;
  byCategory: Partial<Record<TransactionCategory, number>>;
  calTotal: number;
  bankTotal: number;
}

export interface ImportResult {
  transactions: Transaction[];
  source: TransactionSource;
  fileName: string;
  rowsRead: number;
  rowsSkipped: number;
}
