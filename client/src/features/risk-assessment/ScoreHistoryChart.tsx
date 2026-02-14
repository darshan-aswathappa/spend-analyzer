import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useTheme } from '@/contexts/ThemeContext';
import type { RiskScore } from '@/types';

interface ScoreHistoryChartProps {
  data: RiskScore[];
}

export function ScoreHistoryChart({ data }: ScoreHistoryChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  if (data.length < 2) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 dark:bg-gray-900 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 dark:text-gray-100">Score History</h3>
        <div className="h-[200px] flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
          Score history will appear here after multiple months of tracking
        </div>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    month: d.calculated_for_month,
    score: d.overall_score,
    rating: d.rating,
  }));

  const gridColor = isDark ? '#1f2937' : '#f3f4f6';
  const tickColor = isDark ? '#9ca3af' : '#9ca3af';
  const axisColor = isDark ? '#374151' : '#e5e7eb';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 dark:bg-gray-900 dark:border-gray-700">
      <h3 className="text-sm font-semibold text-gray-900 mb-4 dark:text-gray-100">Score History</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: tickColor }}
            tickLine={false}
            axisLine={{ stroke: axisColor }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 12, fill: tickColor }}
            tickLine={false}
            axisLine={{ stroke: axisColor }}
          />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
              backgroundColor: isDark ? '#111827' : '#ffffff',
              color: isDark ? '#e5e7eb' : '#111827',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
            formatter={((value: number) => [`${value} / 100`, 'Risk Score']) as never}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: '#3b82f6', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
