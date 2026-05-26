import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { ChevronDown, Search, AlertCircle } from 'lucide-react';
import { useTransactions } from '../store/useTransactions';
import type { TransactionCategory } from '../types';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../utils/categories';

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as TransactionCategory[];

export function TransactionList() {
  const { getVisible, updateCategory, hideDirectDebit, toggleHideDirectDebit } = useTransactions();
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<TransactionCategory | 'all'>('all');
  const [filterSource, setFilterSource] = useState<'all' | 'mercantile' | 'cal'>('all');
  const [page, setPage] = useState(1);
  const PER_PAGE = 50;

  const visible = getVisible();

  const filtered = useMemo(() => {
    return visible.filter(tx => {
      if (search && !tx.description.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterCategory !== 'all' && tx.category !== filterCategory) return false;
      if (filterSource !== 'all' && tx.source !== filterSource) return false;
      return true;
    }).sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [visible, search, filterCategory, filterSource]);

  const paged = filtered.slice(0, page * PER_PAGE);
  const hasMore = paged.length < filtered.length;

  if (visible.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400" dir="rtl">
        <AlertCircle size={40} className="mx-auto mb-3 opacity-50" />
        <p className="font-medium">אין עסקאות עדיין</p>
        <p className="text-sm mt-1">ייבא קבצים מהבנק ומכאל כדי להתחיל</p>
      </div>
    );
  }

  return (
    <div dir="rtl" className="space-y-3">
      {/* Filters */}
      <div className="flex flex-col gap-2">
        <div className="relative">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="חיפוש עסקאות..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pr-8 pl-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <select
            value={filterCategory}
            onChange={e => { setFilterCategory(e.target.value as TransactionCategory | 'all'); setPage(1); }}
            className="flex-shrink-0 border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
          >
            <option value="all">כל הקטגוריות</option>
            {ALL_CATEGORIES.map(c => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </select>
          <select
            value={filterSource}
            onChange={e => { setFilterSource(e.target.value as 'all' | 'mercantile' | 'cal'); setPage(1); }}
            className="flex-shrink-0 border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
          >
            <option value="all">כל המקורות</option>
            <option value="mercantile">מרכנתיל</option>
            <option value="cal">כאל</option>
          </select>
          <button
            onClick={toggleHideDirectDebit}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              hideDirectDebit
                ? 'bg-green-100 text-green-700 border border-green-300'
                : 'bg-gray-100 text-gray-600 border border-gray-300'
            }`}
          >
            {hideDirectDebit ? '✓ הסתר דיירקט' : 'הצג דיירקט'}
          </button>
        </div>
        <p className="text-xs text-gray-500">
          מציג {filtered.length.toLocaleString('he-IL')} מתוך {visible.length.toLocaleString('he-IL')} עסקאות
        </p>
      </div>

      {/* Transaction rows */}
      <div className="space-y-1">
        {paged.map(tx => (
          <div
            key={tx.id}
            className={`flex items-start gap-3 p-3 rounded-lg border bg-white hover:bg-gray-50 transition-colors ${
              tx.isCalDirectDebit ? 'opacity-50 border-yellow-300 bg-yellow-50' : 'border-gray-100'
            }`}
          >
            {/* Category color dot */}
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5"
              style={{ backgroundColor: CATEGORY_COLORS[tx.category] }}
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-gray-800 truncate">{tx.description}</p>
                <p className="text-sm font-bold text-red-600 flex-shrink-0">
                  {Math.abs(tx.amount).toLocaleString('he-IL', { minimumFractionDigits: 2 })} ₪
                </p>
              </div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-xs text-gray-400">
                  {format(tx.date, 'dd/MM/yy', { locale: he })}
                </span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  tx.source === 'mercantile' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                }`}>
                  {tx.source === 'mercantile' ? 'מרכנתיל' : 'כאל'}
                </span>
                {tx.isCalDirectDebit && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                    דיירקט
                  </span>
                )}
                <CategorySelect
                  value={tx.category}
                  onChange={(cat) => updateCategory(tx.id, cat)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          onClick={() => setPage(p => p + 1)}
          className="w-full py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-1"
        >
          <ChevronDown size={14} /> טען עוד ({filtered.length - paged.length} נוספים)
        </button>
      )}
    </div>
  );
}

function CategorySelect({ value, onChange }: { value: TransactionCategory; onChange: (c: TransactionCategory) => void }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value as TransactionCategory)}
      className="text-xs border border-transparent hover:border-gray-300 rounded px-1 py-0.5 bg-transparent focus:outline-none focus:border-blue-400 focus:bg-white cursor-pointer"
      style={{ color: CATEGORY_COLORS[value] }}
      onClick={e => e.stopPropagation()}
    >
      {(Object.keys(CATEGORY_LABELS) as TransactionCategory[]).map(cat => (
        <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
      ))}
    </select>
  );
}
