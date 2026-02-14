import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatCurrency, CATEGORY_HEX_COLORS } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import type { CategoryBreakdown } from '@/types';

interface Props {
  data: CategoryBreakdown[];
}

export function CategoryPieChart({ data }: Props) {
  const total = data.reduce((sum, d) => sum + d.total, 0);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 dark:bg-gray-900 dark:border-gray-700">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4 dark:text-gray-400">
        Spending by Category
      </h3>
      {data.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12 dark:text-gray-500">No data available</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="category"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.category}
                  fill={CATEGORY_HEX_COLORS[entry.category] || '#64748b'}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={((value: number, name: string) => [
                `${formatCurrency(value)} (${((value / total) * 100).toFixed(1)}%)`,
                name,
              ]) as never}
              contentStyle={{
                borderRadius: '8px',
                border: `1px solid ${isDark ? '#374151' : '#e2e8f0'}`,
                backgroundColor: isDark ? '#111827' : '#ffffff',
                color: isDark ? '#e5e7eb' : '#111827',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                fontSize: '13px',
              }}
            />
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '12px', lineHeight: '22px', color: isDark ? '#d1d5db' : undefined }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
