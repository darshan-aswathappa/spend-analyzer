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
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
        Net Cash Flow Trend
      </h3>
      {data.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">No data available</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="month"
              tickFormatter={formatMonth}
              tick={{ fontSize: 12, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 12, fill: '#94a3b8' }}
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
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
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
