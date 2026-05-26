import { Download, FileSpreadsheet, Copy, CheckCheck } from 'lucide-react';
import { useState } from 'react';
import { useTransactions } from '../store/useTransactions';
import { exportToExcel, generateGoogleSheetsCSV, downloadCSV } from '../utils/export';

export function ExportPanel() {
  const { getVisible, clearAll, transactions } = useTransactions();
  const [copied, setCopied] = useState(false);

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

  const count = getVisible().length;

  return (
    <div dir="rtl" className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
        <span className="font-medium text-gray-800">{count.toLocaleString('he-IL')}</span> עסקאות מוכנות לייצוא
        {useTransactions.getState().hideDirectDebit && (
          <span className="text-xs text-green-600 mr-2">(ללא כפילויות דיירקט)</span>
        )}
      </div>

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
            <p className="font-medium text-sm">הורד CSV</p>
            <p className="text-xs opacity-80">מתאים לייבוא ל-Google Sheets</p>
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

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-700 font-medium mb-1">איך לייבא ל-Google Sheets:</p>
        <ol className="text-xs text-blue-600 space-y-0.5 list-decimal list-inside">
          <li>לחץ "הורד CSV" למעלה</li>
          <li>פתח Google Sheets</li>
          <li>קובץ ← ייבוא ← העלה את הקובץ</li>
          <li>בחר "הוסף לגיליון הנוכחי"</li>
        </ol>
      </div>

      <div className="pt-2 border-t border-gray-100">
        <button
          onClick={() => {
            if (confirm('האם למחוק את כל הנתונים? פעולה זו אינה הפיכה.')) {
              clearAll();
            }
          }}
          disabled={transactions.length === 0}
          className="text-xs text-red-500 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          מחק את כל הנתונים
        </button>
      </div>
    </div>
  );
}
