import type { Transaction } from '../types';
import { isLikelyCalPayment } from './categories';

export function detectDirectDebitDuplicates(transactions: Transaction[]): Transaction[] {
  const bankTxns = transactions.filter(t => t.source === 'mercantile');
  const calTxns = transactions.filter(t => t.source === 'cal');

  const markedDuplicates = new Set<string>();

  for (const bankTx of bankTxns) {
    // Auto-mark any bank entry that describes a credit card charge as direct debit
    if (isLikelyCalPayment(bankTx.description)) {
      markedDuplicates.add(bankTx.id);
      continue;
    }

    // If CAL file is loaded, also try to match by amount to catch other patterns
    if (calTxns.length > 0) {
      const calByBillingMonth = new Map<string, number>();
      for (const tx of calTxns) {
        const billingDate = tx.rawRow?.billingDate ? new Date(tx.rawRow.billingDate) : tx.date;
        const key = `${billingDate.getFullYear()}-${billingDate.getMonth()}`;
        calByBillingMonth.set(key, (calByBillingMonth.get(key) ?? 0) + Math.abs(tx.amount));
      }
      const bankAmt = Math.abs(bankTx.amount);
      for (const calAmt of calByBillingMonth.values()) {
        if (calAmt > 0 && Math.abs(bankAmt - calAmt) / calAmt < 0.05) {
          markedDuplicates.add(bankTx.id);
          break;
        }
      }
    }
  }

  return transactions.map(tx => ({
    ...tx,
    isCalDirectDebit: markedDuplicates.has(tx.id),
    duplicateOfId: markedDuplicates.has(tx.id) ? 'cal-payment' : undefined,
  }));
}

export function getEffectiveTransactions(transactions: Transaction[], hideDirectDebit: boolean): Transaction[] {
  if (!hideDirectDebit) return transactions;
  return transactions.filter(tx => !tx.isCalDirectDebit);
}
