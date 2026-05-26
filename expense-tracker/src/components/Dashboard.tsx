import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import { useTransactions } from '../store/useTransactions';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../utils/categories';
import type { TransactionCategory } from '../types';
import { TrendingUp, TrendingDown, Minus, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

function formatCurrency(n: number) {
  return n.toLocaleString('he-IL', { maximumFractionDigits: 0 }) + ' ₪';
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ value?: number; name?: string; color?: string }>;
  label?: string;
}

function CurrencyTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow p-2 text-xs" dir="rtl">
      <p className="font-medium text-gray-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-bold">
          {p.name}: {formatCurrency(p.value ?? 0)}
        </p>
      ))}
    </div>
  );
}

export function Dashboard() {
  const { getMonthlyStats, getExpenses, getIncome } = useTransactions();
  const monthlyStats = getMonthlyStats();
  const expenses = getExpenses();
  const income = getIncome();

  if (expenses.length === 0 && income.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400" dir="rtl">
        <TrendingUp size={40} className="mx-auto mb-3 opacity-50" />
        <p className="font-medium">ייבא נתונים כדי לראות גרפים</p>
      </div>
    );
  }

  const latestMonth = monthlyStats[monthlyStats.length - 1];
  const prevMonth = monthlyStats[monthlyStats.length - 2];
  const monthChange = prevMonth && prevMonth.total > 0
    ? ((latestMonth.total - prevMonth.total) / prevMonth.total) * 100
    : 0;

  const totalExpenses = expenses.reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalIncome = income.reduce((s, t) => s + t.amount, 0);
  const net = totalIncome - totalExpenses;

  const categoryTotals: Partial<Record<TransactionCategory, number>> = {};
  for (const tx of expenses) {
    categoryTotals[tx.category] = (categoryTotals[tx.category] ?? 0) + Math.abs(tx.amount);
  }
  const pieData = Object.entries(categoryTotals)
    .map(([cat, total]) => ({ name: CATEGORY_LABELS[cat as TransactionCategory], value: total as number, cat }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return (
    <div dir="rtl" className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <SummaryCard
          title="הוצאות"
          value={formatCurrency(totalExpenses)}
          icon={<ArrowDownCircle size={16} />}
          color="red"
        />
        <SummaryCard
          title="הכנסות"
          value={totalIncome > 0 ? formatCurrency(totalIncome) : '—'}
          icon={<ArrowUpCircle size={16} />}
          color="green"
          sub={totalIncome > 0 ? 'מחשבון הבנק' : 'לא נמצאו'}
        />
        <SummaryCard
          title={net >= 0 ? 'עודף' : 'גירעון'}
          value={totalIncome > 0 ? formatCurrency(Math.abs(net)) : '—'}
          icon={net >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          color={net >= 0 ? 'green' : 'red'}
          sub={totalIncome > 0 ? (net >= 0 ? 'הכנסות > הוצאות' : 'הוצאות > הכנסות') : undefined}
        />
      </div>

      {/* Last month card */}
      {latestMonth && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-indigo-500 font-medium">{latestMonth.label} — חודש אחרון</p>
            <p className="text-2xl font-bold text-indigo-700">{formatCurrency(latestMonth.total)}</p>
            {latestMonth.income > 0 && (
              <p className="text-xs text-green-600 mt-0.5">הכנסות: {formatCurrency(latestMonth.income)}</p>
            )}
          </div>
          {prevMonth && (
            <div className="text-left">
              <p className="text-xs text-gray-500">לעומת {prevMonth.label}</p>
              <p className={`text-lg font-bold ${monthChange > 5 ? 'text-red-500' : monthChange < -5 ? 'text-green-500' : 'text-gray-600'}`}>
                {monthChange > 0 ? '+' : ''}{monthChange.toFixed(1)}%
              </p>
              {monthChange > 5 ? <TrendingUp size={14} className="text-red-400 mr-auto" /> :
               monthChange < -5 ? <TrendingDown size={14} className="text-green-400 mr-auto" /> :
               <Minus size={14} className="text-gray-400 mr-auto" />}
            </div>
          )}
        </div>
      )}

      {/* Monthly Bar Chart — income vs expenses */}
      {monthlyStats.length >= 1 && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-700 mb-4 text-sm">הוצאות חודשיות</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyStats} margin={{ top: 5, right: 5, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${((v as number) / 1000).toFixed(0)}k`} />
              <Tooltip content={<CurrencyTooltip />} />
              {monthlyStats.some(m => m.income > 0) && (
                <Bar dataKey="income" name="הכנסות" fill="#4ade80" radius={[4, 4, 0, 0]} />
              )}
              <Bar dataKey="total" name="הוצאות" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          {monthlyStats.some(m => m.income > 0) && (
            <div className="flex gap-4 justify-center mt-2 text-xs text-gray-500">
              <span><span className="inline-block w-2.5 h-2.5 rounded-sm bg-green-400 ml-1" />הכנסות</span>
              <span><span className="inline-block w-2.5 h-2.5 rounded-sm bg-indigo-500 ml-1" />הוצאות</span>
            </div>
          )}
        </div>
      )}

      {/* Month over month trend */}
      {monthlyStats.length >= 3 && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-700 mb-4 text-sm">מגמת הוצאות</h3>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={monthlyStats} margin={{ top: 5, right: 5, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${((v as number) / 1000).toFixed(0)}k`} />
              <Tooltip content={<CurrencyTooltip />} />
              <Line type="monotone" dataKey="total" name="הוצאות" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Category Pie */}
      {pieData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-700 mb-4 text-sm">הוצאות לפי קטגוריה</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ percent }) => percent !== undefined && percent > 0.03 ? `${(percent * 100).toFixed(0)}%` : ''}
                labelLine={false}
              >
                {pieData.map((entry) => (
                  <Cell key={entry.cat} fill={CATEGORY_COLORS[entry.cat as TransactionCategory]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [formatCurrency(typeof value === 'number' ? value : 0)]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2">
            {pieData.map(entry => (
              <div key={entry.cat} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: CATEGORY_COLORS[entry.cat as TransactionCategory] }} />
                <span className="text-xs text-gray-600 flex-1 truncate">{entry.name}</span>
                <span className="text-xs font-medium text-gray-800">{formatCurrency(entry.value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly category breakdown */}
      {monthlyStats.length >= 1 && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-700 mb-4 text-sm">השוואה חודשית</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-right py-1 pr-2 font-medium text-gray-500 min-w-[120px]">קטגוריה</th>
                  {monthlyStats.slice(-4).map(m => (
                    <th key={m.label} className="text-right py-1 px-2 font-medium text-gray-500 min-w-[72px]">{m.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(Object.keys(CATEGORY_LABELS) as TransactionCategory[]).map(cat => {
                  const vals = monthlyStats.slice(-4).map(m => m.byCategory[cat] ?? 0);
                  if (vals.every(v => v === 0)) return null;
                  return (
                    <tr key={cat} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-1.5 pr-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat] }} />
                          {CATEGORY_LABELS[cat]}
                        </div>
                      </td>
                      {vals.map((v, i) => (
                        <td key={i} className="py-1.5 px-2 text-gray-700">{v > 0 ? formatCurrency(v) : '—'}</td>
                      ))}
                    </tr>
                  );
                })}
                <tr className="border-t-2 border-gray-200 font-semibold bg-gray-50">
                  <td className="py-1.5 pr-2">הוצאות</td>
                  {monthlyStats.slice(-4).map(m => (
                    <td key={m.label} className="py-1.5 px-2 text-red-700">{formatCurrency(m.total)}</td>
                  ))}
                </tr>
                {monthlyStats.some(m => m.income > 0) && (
                  <tr className="font-semibold bg-green-50">
                    <td className="py-1.5 pr-2 text-green-700">הכנסות</td>
                    {monthlyStats.slice(-4).map(m => (
                      <td key={m.label} className="py-1.5 px-2 text-green-700">{m.income > 0 ? formatCurrency(m.income) : '—'}</td>
                    ))}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Notice about bank-only data */}
      {expenses.filter(t => t.source === 'mercantile').length > 0 && expenses.filter(t => t.source === 'cal').length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
          <p className="font-medium mb-1">טיפ: ייבא גם קובץ כאל</p>
          <p>כרגע רואים רק את תנועות הבנק. ייבוא קובץ כאל יוסיף פירוט מלא לפי עסק ויזהה כפילויות דיירקט אוטומטית.</p>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ title, value, icon, color, sub }: {
  title: string; value: string; icon: React.ReactNode;
  color: 'blue' | 'green' | 'red' | 'purple' | 'gray';
  sub?: string;
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    gray: 'bg-gray-50 text-gray-600 border-gray-100',
  };
  return (
    <div className={`rounded-xl border p-3 ${colors[color]}`}>
      <div className="flex items-center gap-1.5 mb-1 opacity-70">{icon}<span className="text-xs">{title}</span></div>
      <p className="font-bold text-base leading-tight">{value}</p>
      {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
    </div>
  );
}
