import { useState } from 'react';
import { Upload, BarChart2, List, Download, AlertCircle } from 'lucide-react';
import { FileImport } from './components/FileImport';
import { TransactionList } from './components/TransactionList';
import { Dashboard } from './components/Dashboard';
import { ExportPanel } from './components/ExportPanel';
import { useTransactions } from './store/useTransactions';

type Tab = 'import' | 'dashboard' | 'transactions' | 'export';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'import', label: 'ייבוא', icon: <Upload size={18} /> },
  { id: 'dashboard', label: 'סיכום', icon: <BarChart2 size={18} /> },
  { id: 'transactions', label: 'עסקאות', icon: <List size={18} /> },
  { id: 'export', label: 'ייצוא', icon: <Download size={18} /> },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('import');
  const transactions = useTransactions(s => s.transactions);
  const duplicates = transactions.filter(t => t.isCalDirectDebit).length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="font-bold text-gray-900 text-base leading-tight">מעקב הוצאות</h1>
          <p className="text-xs text-gray-400 leading-tight">מרכנתיל + כאל</p>
        </div>
        <div className="flex items-center gap-2">
          {duplicates > 0 && (
            <div className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
              <AlertCircle size={12} />
              {duplicates} כפילויות דיירקט
            </div>
          )}
          <div className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
            {transactions.length.toLocaleString('he-IL')} עסקאות
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-4 pb-24">
        {tab === 'import' && <FileImport />}
        {tab === 'dashboard' && <Dashboard />}
        {tab === 'transactions' && <TransactionList />}
        {tab === 'export' && <ExportPanel />}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="flex max-w-2xl mx-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors ${
                tab === t.id
                  ? 'text-blue-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {t.icon}
              <span className="text-[10px] font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
