import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import type { MonthlyTrend } from '@/types';

interface Props {
  data: MonthlyTrend[];
}

function formatMonth(month: string) {
  const [year, mon] = month.split('-');
  const date = new Date(Number(year), Number(mon) - 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

export function IncomeVsExpensesChart({ data }: Props) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const gridColor = isDark ? '#1f2937' : '#f1f5f9';
  const tickColor = isDark ? '#9ca3af' : '#94a3b8';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 dark:bg-gray-900 dark:border-gray-700">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4 dark:text-gray-400">
        Net Cash Flow Trend
      </h3>
      {data.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12 dark:text-gray-500">No data available</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="month"
              tickFormatter={formatMonth}
              tick={{ fontSize: 12, fill: tickColor }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 12, fill: tickColor }}
              axisLine={false}
              tickLine={false}
              width={50}
            />
            <Tooltip
              formatter={((value: number, name: string) => [
                formatCurrency(value),
                name,
              ]) as never}
              labelFormatter={(label) => formatMonth(String(label))}
              contentStyle={{
                borderRadius: '8px',
                border: `1px solid ${isDark ? '#374151' : '#e2e8f0'}`,
                backgroundColor: isDark ? '#111827' : '#ffffff',
                color: isDark ? '#e5e7eb' : '#111827',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '8px', color: isDark ? '#d1d5db' : undefined }}
            />
            <Line
              type="monotone"
              dataKey="totalCredits"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ r: 4, fill: '#22c55e' }}
              name="Income"
            />
            <Line
              type="monotone"
              dataKey="totalDebits"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ r: 4, fill: '#ef4444' }}
              name="Expenses"
            />
            <Line
              type="monotone"
              dataKey="net"
              stroke="#3b82f6"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 4, fill: '#3b82f6' }}
              name="Net"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
