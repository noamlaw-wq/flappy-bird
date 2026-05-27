import { Download, FileSpreadsheet, Copy, CheckCheck, Save, FolderOpen, AlertTriangle } from 'lucide-react';
import type { Transaction } from '../types';
import { useState, useRef } from 'react';
import { useTransactions } from '../store/useTransactions';
import { exportToExcel, generateGoogleSheetsCSV, downloadCSV } from '../utils/export';

export function ExportPanel() {
  const { getVisible, clearAll, transactions, addTransactions, hideDirectDebit } = useTransactions();
  const [copied, setCopied] = useState(false);
  const [backupMsg, setBackupMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const count = getVisible().length;
  const totalCount = transactions.length;

  const handleExcelExport = () => {
    const visible = getVisible();
    if (visible.length === 0) return;
    exportToExcel(visible);
  };

  const handleCSVExport = () => {
    const visible = getVisible();
    if (visible.length === 0) return;
    const csv = generateGoogleSheetsCSV(visible);
    downloadCSV(csv, `הוצאות_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleCopyForSheets = async () => {
    const visible = getVisible();
    if (visible.length === 0) return;
    const csv = generateGoogleSheetsCSV(visible);
    await navigator.clipboard.writeText(csv);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Backup: export all raw transaction data as JSON
  const handleBackup = () => {
    if (transactions.length === 0) return;
    const data = JSON.stringify({ version: 2, transactions, exportedAt: new Date().toISOString() }, null, 0);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `גיבוי_הוצאות_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupMsg('גיבוי הורד בהצלחה');
    setTimeout(() => setBackupMsg(''), 3000);
  };

  // Restore: import JSON backup
  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target!.result as string);
        const txns = data.transactions ?? [];
        if (!Array.isArray(txns) || txns.length === 0) {
          setBackupMsg('קובץ לא תקין');
          return;
        }
        // Restore dates
        const restored = txns.map((t: Record<string, unknown>) => ({ ...t, date: new Date(t.date as string) })) as Transaction[];
        if (confirm(`שחזר ${restored.length} עסקאות? הנתונים הנוכחיים ימחקו.`)) {
          clearAll();
          // Small delay to let clearAll commit
          setTimeout(() => {
            addTransactions(restored);
            setBackupMsg(`שוחזרו ${restored.length} עסקאות`);
          }, 100);
        }
      } catch {
        setBackupMsg('שגיאה בקריאת הקובץ');
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div dir="rtl" className="space-y-4">
      {/* Status */}
      <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
        <span className="font-medium text-gray-800">{count.toLocaleString('he-IL')}</span> עסקאות לייצוא
        {' · '}
        <span className="font-medium text-gray-800">{totalCount.toLocaleString('he-IL')}</span> סה"כ שמורות
        {hideDirectDebit && <span className="text-xs text-green-600 mr-2">(ללא דיירקט)</span>}
      </div>

      {/* Backup / Restore section */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
        <p className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
          <Save size={13} /> גיבוי ושחזור נתונים
        </p>
        <p className="text-xs text-amber-700">
          שמור גיבוי כדי שלא תאבד נתונים בעת ניקוי הדפדפן.
          מומלץ לגבות אחרי כל ייבוא.
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleBackup}
            disabled={totalCount === 0}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700 disabled:opacity-40 transition-colors"
          >
            <Save size={14} /> הורד גיבוי
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-amber-100 text-amber-800 text-xs font-medium rounded-lg hover:bg-amber-200 border border-amber-300 transition-colors"
          >
            <FolderOpen size={14} /> שחזר מגיבוי
          </button>
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleRestoreFile} />
        </div>
        {backupMsg && (
          <p className="text-xs text-amber-700 font-medium">{backupMsg}</p>
        )}
      </div>

      {/* Export buttons */}
      <div className="space-y-2">
        <button
          onClick={handleExcelExport}
          disabled={count === 0}
          className="w-full flex items-center gap-3 p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <FileSpreadsheet size={18} />
          <div className="text-right">
            <p className="font-medium text-sm">הורד Excel</p>
            <p className="text-xs opacity-80">פתיחה ישירה ב-Excel</p>
          </div>
        </button>

        <button
          onClick={handleCSVExport}
          disabled={count === 0}
          className="w-full flex items-center gap-3 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Download size={18} />
          <div className="text-right">
            <p className="font-medium text-sm">הורד CSV לGoogle Sheets</p>
            <p className="text-xs opacity-80">קובץ ← ייבוא ב-Sheets</p>
          </div>
        </button>

        <button
          onClick={handleCopyForSheets}
          disabled={count === 0}
          className="w-full flex items-center gap-3 p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {copied ? <CheckCheck size={18} /> : <Copy size={18} />}
          <div className="text-right">
            <p className="font-medium text-sm">{copied ? 'הועתק!' : 'העתק לGoogle Sheets'}</p>
            <p className="text-xs opacity-80">פתח Sheets → הדבק (Ctrl+V)</p>
          </div>
        </button>
      </div>

      {/* iOS warning */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2">
        <AlertTriangle size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700">
          <strong>אייפון:</strong> הנתונים נשמרים בדפדפן. Safari עלול לנקות אוטומטית.
          גבה ל-JSON אחרי כל ייבוא, ובמיוחד לפני ניקוי Safari.
        </p>
      </div>

      {/* Delete all */}
      <div className="pt-2 border-t border-gray-100">
        <button
          onClick={() => {
            if (confirm('האם למחוק את כל הנתונים? פעולה זו אינה הפיכה.')) clearAll();
          }}
          disabled={totalCount === 0}
          className="text-xs text-red-500 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          מחק את כל הנתונים
        </button>
      </div>
    </div>
  );
}
