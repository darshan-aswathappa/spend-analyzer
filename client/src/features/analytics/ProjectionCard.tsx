import { TrendingUp, TrendingDown, Brain, AlertCircle } from 'lucide-react';
import { formatCurrency, CATEGORY_HEX_COLORS } from '@/lib/utils';
import type { ProjectionsData } from '@/types';

interface Props {
  data: ProjectionsData | null;
  loading: boolean;
}

const confidenceConfig = {
  high: { label: 'High Confidence', color: 'bg-green-100 text-green-700' },
  medium: { label: 'Medium Confidence', color: 'bg-yellow-100 text-yellow-700' },
  low: { label: 'Low Confidence', color: 'bg-red-100 text-red-700' },
};

function formatProjectedMonth(month: string) {
  const [year, mon] = month.split('-');
  const date = new Date(Number(year), Number(mon) - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function ProjectionCard({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
          AI Projections
        </h3>
        <div className="flex items-center gap-3 py-8 justify-center text-sm text-gray-400 dark:text-gray-500">
          <Brain className="h-5 w-5 animate-pulse" />
          Analyzing spending patterns...
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
          AI Projections
        </h3>
        <div className="flex items-center gap-2 py-8 justify-center text-sm text-gray-400 dark:text-gray-500">
          <AlertCircle className="h-4 w-4" />
          Upload statements to see projections
        </div>
      </div>
    );
  }

  const conf = confidenceConfig[data.confidence];
  const sortedCategories = Object.entries(data.projectedSpending)
    .sort(([, a], [, b]) => b - a);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Projected: {formatProjectedMonth(data.projectedMonth)}
        </h3>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${conf.color}`}>
          {conf.label}
        </span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-gray-50 dark:bg-gray-950 rounded-lg p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Projected Income</p>
          <p className="text-base font-semibold text-green-600 flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5" />
            {formatCurrency(data.projectedIncome)}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-950 rounded-lg p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Projected Expenses</p>
          <p className="text-base font-semibold text-red-600 flex items-center gap-1">
            <TrendingDown className="h-3.5 w-3.5" />
            {formatCurrency(data.projectedExpenses)}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-950 rounded-lg p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Projected Net Worth</p>
          <p className={`text-base font-semibold ${data.projectedNetWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(data.projectedNetWorth)}
          </p>
        </div>
      </div>

      {/* Category breakdown */}
      {sortedCategories.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">Projected Spending by Category</p>
          <div className="space-y-2">
            {sortedCategories.slice(0, 5).map(([category, amount]) => (
              <div key={category} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: CATEGORY_HEX_COLORS[category] || '#64748b' }}
                  />
                  <span className="text-gray-700 dark:text-gray-300">{category}</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI reasoning */}
      <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 flex gap-2">
        <Brain className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">{data.reasoning}</p>
      </div>
    </div>
  );
}
