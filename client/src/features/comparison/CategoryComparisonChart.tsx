import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

export interface MergedCategory {
  category: string;
  baselineTotal: number;
  compareTotal: number;
  deltaAmount: number;
  deltaPct: number | null;
  presentInBoth: boolean;
}

const BASELINE_COLOR = '#3b82f6';
const COMPARE_COLOR = '#f97316';

interface Props {
  data: MergedCategory[];
  baselineLabel: string;
  compareLabel: string;
  loading: boolean;
}

export function CategoryComparisonChart({ data, baselineLabel, compareLabel, loading }: Props) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const gridColor = isDark ? '#1f2937' : '#f1f5f9';
  const tickColor = isDark ? '#9ca3af' : '#94a3b8';

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 h-[380px] animate-pulse">
        <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
        <div className="h-[300px] bg-gray-100 dark:bg-gray-800 rounded" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4 dark:text-gray-400">
        Category Spend Comparison
      </h3>
      {data.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-12">
          No category data available
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} barGap={2} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="category"
              tick={{ fontSize: 11, fill: tickColor }}
              axisLine={false}
              tickLine={false}
              interval={0}
              angle={-35}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 12, fill: tickColor }}
              axisLine={false}
              tickLine={false}
              width={50}
            />
            <Tooltip
              formatter={((value: number, name: string) => [formatCurrency(value), name]) as never}
              contentStyle={{
                borderRadius: '8px',
                border: `1px solid ${isDark ? '#374151' : '#e2e8f0'}`,
                backgroundColor: isDark ? '#111827' : '#ffffff',
                color: isDark ? '#e5e7eb' : '#111827',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
              }}
            />
            <Legend
              wrapperStyle={{
                fontSize: '12px',
                paddingTop: '8px',
                color: isDark ? '#d1d5db' : undefined,
              }}
            />
            <Bar
              dataKey="baselineTotal"
              fill={BASELINE_COLOR}
              name={baselineLabel}
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="compareTotal"
              fill={COMPARE_COLOR}
              name={compareLabel}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
