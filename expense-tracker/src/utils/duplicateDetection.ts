import type { Transaction } from '../types';
import { isLikelyCalPayment } from './categories';

/**
 * Find a subset of `amounts` that sums to `target` within 2% tolerance.
 * Returns the indices of matching items, or null if no match found.
 * Only runs for groups ≤ 20 items (2^20 ≈ 1M iterations, fast enough).
 */
function subsetSumIndices(amounts: number[], target: number): number[] | null {
  const n = amounts.length;
  if (n === 0 || target <= 0) return null;
  if (n > 20) {
    // Fallback: check total only
    const total = amounts.reduce((s, a) => s + a, 0);
    return Math.abs(total - target) / target <= 0.02
      ? amounts.map((_, i) => i)
      : null;
  }
  for (let mask = 1; mask < (1 << n); mask++) {
    let sum = 0;
    const indices: number[] = [];
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) {
        sum += amounts[i];
        indices.push(i);
      }
    }
    if (Math.abs(sum - target) / target <= 0.02) return indices;
  }
  return null;
}

export function detectDirectDebitDuplicates(transactions: Transaction[]): Transaction[] {
  const bankTxns = transactions.filter(t => t.source === 'mercantile');
  const calTxns = transactions.filter(t => t.source === 'cal');

  // Without CAL data, nothing to deduplicate — show all bank entries
  if (calTxns.length === 0) {
    return transactions.map(tx => ({ ...tx, isCalDirectDebit: false, duplicateOfId: undefined }));
  }

  // Group CAL entries by billing date key ("YYYY-MM-DD")
  // Each entry tracks whether it's been claimed by a bank match
  const calByBillingDate = new Map<string, Array<{ tx: Transaction; used: boolean }>>();
  for (const tx of calTxns) {
    const key = tx.rawRow?.billingDate;
    if (!key) continue;
    if (!calByBillingDate.has(key)) calByBillingDate.set(key, []);
    calByBillingDate.get(key)!.push({ tx, used: false });
  }

  const markedBankDuplicates = new Set<string>();

  // Sort bank card entries by amount descending so larger amounts match first
  // (helps when one billing date has multiple bank entries)
  const cardBankEntries = bankTxns
    .filter(tx => isLikelyCalPayment(tx.description))
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));

  for (const bankTx of cardBankEntries) {
    markedBankDuplicates.add(bankTx.id); // always hide card entries when CAL is loaded

    const valueDateKey = bankTx.rawRow?.valueDate;
    if (!valueDateKey) continue;

    const calGroup = calByBillingDate.get(valueDateKey);
    if (!calGroup) continue;

    const available = calGroup.filter(item => !item.used);
    if (available.length === 0) continue;

    const bankAmt = Math.abs(bankTx.amount);
    const amounts = available.map(item => Math.abs(item.tx.amount));
    const matchIndices = subsetSumIndices(amounts, bankAmt);

    if (matchIndices !== null) {
      // Mark these CAL entries as matched to this bank entry
      matchIndices.forEach(i => { available[i].used = true; });
    }
  }

  return transactions.map(tx => ({
    ...tx,
    isCalDirectDebit: markedBankDuplicates.has(tx.id),
    duplicateOfId: markedBankDuplicates.has(tx.id) ? 'cal-payment' : undefined,
  }));
}

export function getEffectiveTransactions(transactions: Transaction[], hideDirectDebit: boolean): Transaction[] {
  if (!hideDirectDebit) return transactions;
  return transactions.filter(tx => !tx.isCalDirectDebit);
}
