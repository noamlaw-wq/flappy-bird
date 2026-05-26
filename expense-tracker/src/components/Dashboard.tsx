import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import { useTransactions } from '../store/useTransactions';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../utils/categories';
import type { TransactionCategory } from '../types';
import { TrendingUp, TrendingDown, Minus, CreditCard, Building2 } from 'lucide-react';

function formatCurrency(n: number) {
  return n.toLocaleString('he-IL', { maximumFractionDigits: 0 }) + ' ₪';
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ value?: number }>;
  label?: string;
}

function CurrencyTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow p-2 text-xs" dir="rtl">
      <p className="font-medium text-gray-700">{label}</p>
      <p className="text-blue-600 font-bold">{formatCurrency(payload[0].value ?? 0)}</p>
    </div>
  );
}

export function Dashboard() {
  const { getMonthlyStats, getVisible } = useTransactions();
  const monthlyStats = getMonthlyStats();
  const visible = getVisible();

  if (visible.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400" dir="rtl">
        <TrendingUp size={40} className="mx-auto mb-3 opacity-50" />
        <p className="font-medium">ייבא נתונים כדי לראות גרפים</p>
      </div>
    );
  }

  const latestMonth = monthlyStats[monthlyStats.length - 1];
  const prevMonth = monthlyStats[monthlyStats.length - 2];
  const monthChange = prevMonth ? ((latestMonth.total - prevMonth.total) / prevMonth.total) * 100 : 0;

  const categoryTotals: Partial<Record<TransactionCategory, number>> = {};
  for (const tx of visible) {
    categoryTotals[tx.category] = (categoryTotals[tx.category] ?? 0) + Math.abs(tx.amount);
  }
  const pieData = Object.entries(categoryTotals)
    .map(([cat, total]) => ({ name: CATEGORY_LABELS[cat as TransactionCategory], value: total as number, cat }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const calTotal = visible.filter(t => t.source === 'cal').reduce((s, t) => s + Math.abs(t.amount), 0);
  const bankTotal = visible.filter(t => t.source === 'mercantile').reduce((s, t) => s + Math.abs(t.amount), 0);
  const grandTotal = calTotal + bankTotal;

  return (
    <div dir="rtl" className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard
          title="סה״כ כל הזמן"
          value={formatCurrency(grandTotal)}
          icon={<TrendingUp size={16} />}
          color="blue"
        />
        <SummaryCard
          title={latestMonth?.label ?? 'חודש אחרון'}
          value={latestMonth ? formatCurrency(latestMonth.total) : '—'}
          icon={monthChange > 5 ? <TrendingUp size={16} /> : monthChange < -5 ? <TrendingDown size={16} /> : <Minus size={16} />}
          color={monthChange > 5 ? 'red' : monthChange < -5 ? 'green' : 'gray'}
          sub={prevMonth ? `${monthChange > 0 ? '+' : ''}${monthChange.toFixed(1)}% מהחודש הקודם` : undefined}
        />
        <SummaryCard
          title="כאל"
          value={formatCurrency(calTotal)}
          icon={<CreditCard size={16} />}
          color="purple"
          sub={grandTotal > 0 ? `${((calTotal / grandTotal) * 100).toFixed(0)}% מסה״כ` : undefined}
        />
        <SummaryCard
          title="מרכנתיל"
          value={formatCurrency(bankTotal)}
          icon={<Building2 size={16} />}
          color="blue"
          sub={grandTotal > 0 ? `${((bankTotal / grandTotal) * 100).toFixed(0)}% מסה״כ` : undefined}
        />
      </div>

      {/* Monthly Bar Chart */}
      {monthlyStats.length >= 2 && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-700 mb-4 text-sm">הוצאות חודשיות</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyStats} margin={{ top: 5, right: 5, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${((v as number) / 1000).toFixed(0)}k`} />
              <Tooltip content={<CurrencyTooltip />} />
              <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Month over month line */}
      {monthlyStats.length >= 3 && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-700 mb-4 text-sm">מגמת הוצאות</h3>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={monthlyStats} margin={{ top: 5, right: 5, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${((v as number) / 1000).toFixed(0)}k`} />
              <Tooltip content={<CurrencyTooltip />} />
              <Line type="monotone" dataKey="total" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Category Pie */}
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
              label={({ percent }) => percent !== undefined ? `${(percent * 100).toFixed(0)}%` : ''}
              labelLine={false}
            >
              {pieData.map((entry) => (
                <Cell key={entry.cat} fill={CATEGORY_COLORS[entry.cat as TransactionCategory]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [
                typeof value === 'number' ? formatCurrency(value) : String(value)
              ]}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-3">
          {pieData.map(entry => (
            <div key={entry.cat} className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: CATEGORY_COLORS[entry.cat as TransactionCategory] }}
              />
              <span className="text-xs text-gray-600 flex-1 truncate">{entry.name}</span>
              <span className="text-xs font-medium text-gray-800">{formatCurrency(entry.value)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly category breakdown */}
      {monthlyStats.length >= 1 && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-700 mb-4 text-sm">השוואה חודשית לפי קטגוריה</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-right py-1 pr-2 font-medium text-gray-500 min-w-[120px]">קטגוריה</th>
                  {monthlyStats.slice(-4).map(m => (
                    <th key={m.label} className="text-right py-1 px-2 font-medium text-gray-500 min-w-[80px]">{m.label}</th>
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
                        <td key={i} className="py-1.5 px-2 text-gray-700">
                          {v > 0 ? formatCurrency(v) : '—'}
                        </td>
                      ))}
                    </tr>
                  );
                })}
                <tr className="border-t-2 border-gray-200 font-semibold bg-gray-50">
                  <td className="py-1.5 pr-2">סה״כ</td>
                  {monthlyStats.slice(-4).map(m => (
                    <td key={m.label} className="py-1.5 px-2">{formatCurrency(m.total)}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
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
