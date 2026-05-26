import type { Transaction } from '../types';

const CAL_BANK_KEYWORDS = ['כאל', 'cal', 'חברת כאל', 'כרטיס אשראי', 'ישראכרט', 'visa cal'];

export function detectDirectDebitDuplicates(transactions: Transaction[]): Transaction[] {
  const bankTxns = transactions.filter(t => t.source === 'mercantile');
  const calTxns = transactions.filter(t => t.source === 'cal');

  if (calTxns.length === 0 || bankTxns.length === 0) return transactions;

  // Group CAL transactions by billing month to find monthly totals
  const calByBillingMonth = new Map<string, { total: number; ids: string[] }>();
  for (const tx of calTxns) {
    const billingDate = tx.rawRow?.billingDate ? new Date(tx.rawRow.billingDate) : tx.date;
    const key = `${billingDate.getFullYear()}-${billingDate.getMonth()}`;
    const existing = calByBillingMonth.get(key) ?? { total: 0, ids: [] };
    existing.total += Math.abs(tx.amount);
    existing.ids.push(tx.id);
    calByBillingMonth.set(key, existing);
  }

  // Find bank transactions that look like CAL payment debits
  const markedDuplicates = new Set<string>();

  for (const bankTx of bankTxns) {
    const desc = bankTx.description.toLowerCase();
    const isCalPayment = CAL_BANK_KEYWORDS.some(k => desc.includes(k));
    if (!isCalPayment) continue;

    for (const calGroup of calByBillingMonth.values()) {
      const bankAmt = Math.abs(bankTx.amount);
      const calAmt = calGroup.total;
      // Allow 5% tolerance for fees
      if (Math.abs(bankAmt - calAmt) / calAmt < 0.05) {
        markedDuplicates.add(bankTx.id);
        break;
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
