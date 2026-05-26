import { useState, useCallback } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import { parseFile } from '../utils/parsers';
import type { TransactionSource } from '../types';
import { useTransactions } from '../store/useTransactions';

interface ImportState {
  status: 'idle' | 'parsing' | 'done' | 'error';
  message: string;
  count?: number;
  batchId?: string;
}

export function FileImport() {
  const [dragOver, setDragOver] = useState(false);
  const [selectedSource, setSelectedSource] = useState<TransactionSource>('mercantile');
  const [imports, setImports] = useState<ImportState[]>([]);
  const addTransactions = useTransactions(s => s.addTransactions);

  const processFile = useCallback(async (file: File) => {
    const stateIdx = imports.length;
    setImports(prev => [...prev, { status: 'parsing', message: `מעבד ${file.name}...` }]);

    try {
      const result = await parseFile(file, selectedSource);
      if (result.transactions.length === 0) {
        setImports(prev => prev.map((s, i) => i === stateIdx
          ? { status: 'error', message: `לא נמצאו עסקאות ב-${file.name}. בדוק את פורמט הקובץ.` }
          : s));
        return;
      }

      const batchId = result.transactions[0].importBatch!;
      addTransactions(result.transactions);
      setImports(prev => prev.map((s, i) => i === stateIdx
        ? { status: 'done', message: `${file.name}`, count: result.transactions.length, batchId }
        : s));
    } catch (err) {
      setImports(prev => prev.map((s, i) => i === stateIdx
        ? { status: 'error', message: `שגיאה בקריאת ${file.name}: ${(err as Error).message}` }
        : s));
    }
  }, [selectedSource, addTransactions, imports.length]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(f =>
      f.name.endsWith('.xlsx') || f.name.endsWith('.xls') || f.name.endsWith('.csv')
    );
    files.forEach(processFile);
  }, [processFile]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    files.forEach(processFile);
    e.target.value = '';
  };

  const removeImport = useTransactions(s => s.removeImportBatch);

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setSelectedSource('mercantile')}
          className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
            selectedSource === 'mercantile'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          מרכנתיל
        </button>
        <button
          onClick={() => setSelectedSource('cal')}
          className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
            selectedSource === 'cal'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          כאל
        </button>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        }`}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <Upload className="mx-auto mb-3 text-gray-400" size={32} />
        <p className="text-gray-600 font-medium">גרור קבצים לכאן או לחץ לבחירה</p>
        <p className="text-sm text-gray-400 mt-1">Excel (.xlsx, .xls) או CSV</p>
        <p className="text-xs text-gray-400 mt-1">
          מקור נבחר: <span className="font-medium text-blue-600">
            {selectedSource === 'mercantile' ? 'מרכנתיל' : 'כאל'}
          </span>
        </p>
        <input
          id="file-input"
          type="file"
          multiple
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={handleFileInput}
        />
      </div>

      {imports.length > 0 && (
        <div className="space-y-2">
          {imports.map((imp, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 p-3 rounded-lg ${
                imp.status === 'done' ? 'bg-green-50 border border-green-200' :
                imp.status === 'error' ? 'bg-red-50 border border-red-200' :
                'bg-gray-50 border border-gray-200'
              }`}
            >
              {imp.status === 'parsing' && <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />}
              {imp.status === 'done' && <CheckCircle size={16} className="text-green-600 flex-shrink-0" />}
              {imp.status === 'error' && <AlertCircle size={16} className="text-red-600 flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{imp.message}</p>
                {imp.count !== undefined && (
                  <p className="text-xs text-green-700">{imp.count} עסקאות נוספו</p>
                )}
              </div>
              {imp.status === 'done' && imp.batchId && (
                <button
                  onClick={() => {
                    removeImport(imp.batchId!);
                    setImports(prev => prev.filter((_, j) => j !== i));
                  }}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  title="הסר ייבוא"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <div className="flex gap-2">
          <FileText size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-700">
            <p className="font-medium mb-1">איך מוריד קבצים:</p>
            <p><strong>מרכנתיל:</strong> אתר הבנק → פעולות → ייצוא עסקאות → Excel/CSV</p>
            <p><strong>כאל:</strong> my.cal-online.co.il → פעילות כרטיס → הורדת דף חיוב</p>
          </div>
        </div>
      </div>
    </div>
  );
}
