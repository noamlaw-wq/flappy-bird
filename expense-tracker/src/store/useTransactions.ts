import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Transaction, TransactionCategory } from '../types';
import { detectDirectDebitDuplicates } from '../utils/duplicateDetection';
import { CATEGORY_LABELS } from '../utils/categories';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface TransactionStore {
  transactions: Transaction[];
  hideDirectDebit: boolean;
  addTransactions: (txns: Transaction[]) => void;
  removeImportBatch: (batchId: string) => void;
  updateCategory: (id: string, category: TransactionCategory) => void;
  toggleHideDirectDebit: () => void;
  clearAll: () => void;
  getVisible: () => Transaction[];
  getMonthlyStats: () => MonthlyStatItem[];
}

export interface MonthlyStatItem {
  label: string;
  month: number;
  year: number;
  total: number;
  byCategory: Partial<Record<TransactionCategory, number>>;
}

export const useTransactions = create<TransactionStore>()(
  persist(
    (set, get) => ({
      transactions: [],
      hideDirectDebit: true,

      addTransactions: (newTxns) => {
        set(state => {
          const combined = [...state.transactions, ...newTxns];
          const deduped = detectDirectDebitDuplicates(combined);
          return { transactions: deduped };
        });
      },

      removeImportBatch: (batchId) => {
        set(state => ({
          transactions: state.transactions.filter(t => t.importBatch !== batchId),
        }));
      },

      updateCategory: (id, category) => {
        set(state => ({
          transactions: state.transactions.map(t => t.id === id ? { ...t, category } : t),
        }));
      },

      toggleHideDirectDebit: () => {
        set(state => ({ hideDirectDebit: !state.hideDirectDebit }));
      },

      clearAll: () => set({ transactions: [] }),

      getVisible: () => {
        const { transactions, hideDirectDebit } = get();
        const expenses = transactions.filter(t => t.amount < 0);
        return hideDirectDebit ? expenses.filter(t => !t.isCalDirectDebit) : expenses;
      },

      getMonthlyStats: () => {
        const visible = get().getVisible();
        const map = new Map<string, MonthlyStatItem>();

        for (const tx of visible) {
          const key = `${tx.date.getFullYear()}-${tx.date.getMonth()}`;
          if (!map.has(key)) {
            map.set(key, {
              label: format(tx.date, 'MMM yy', { locale: he }),
              month: tx.date.getMonth(),
              year: tx.date.getFullYear(),
              total: 0,
              byCategory: {},
            });
          }
          const stat = map.get(key)!;
          const abs = Math.abs(tx.amount);
          stat.total += abs;
          stat.byCategory[tx.category] = (stat.byCategory[tx.category] ?? 0) + abs;
        }

        return Array.from(map.values()).sort((a, b) =>
          a.year !== b.year ? a.year - b.year : a.month - b.month
        );
      },
    }),
    {
      name: 'expense-tracker-v1',
      // Date objects need special serialization
      partialize: (state) => ({ transactions: state.transactions, hideDirectDebit: state.hideDirectDebit }),
      onRehydrateStorage: () => (state) => {
        if (state?.transactions) {
          state.transactions = state.transactions.map(t => ({
            ...t,
            date: new Date(t.date),
          }));
          const rerun = detectDirectDebitDuplicates(state.transactions);
          state.transactions = rerun;
        }
      },
    }
  )
);

export { CATEGORY_LABELS };
