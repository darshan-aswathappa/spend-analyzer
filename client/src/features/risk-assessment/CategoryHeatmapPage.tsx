import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Flame, TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';
import type { AppDispatch, RootState } from '@/app/store';
import { fetchCategoryHeatmap } from './riskInsightsSlice';
import { cn } from '@/lib/utils';

type RiskLevel = 'Low' | 'Medium' | 'High';

const RISK_STYLES: Record<RiskLevel, { badge: string; tile: string; border: string }> = {
  High:   { badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',       tile: 'bg-red-50 dark:bg-red-900/20',       border: 'border-red-200 dark:border-red-800'    },
  Medium: { badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400', tile: 'bg-amber-50 dark:bg-amber-900/20',   border: 'border-amber-200 dark:border-amber-800' },
  Low:    { badge: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400', tile: 'bg-green-50 dark:bg-green-900/20',  border: 'border-green-200 dark:border-green-800' },
};

function TrendIcon({ dir }: { dir: 'up' | 'down' | 'flat' }) {
  if (dir === 'up')   return <TrendingUp   className="h-3.5 w-3.5 text-red-500" />;
  if (dir === 'down') return <TrendingDown className="h-3.5 w-3.5 text-green-500" />;
  return <Minus className="h-3.5 w-3.5 text-gray-400" />;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export function CategoryHeatmapPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { data, loading, error } = useSelector((s: RootState) => s.riskInsights.heatmap);

  useEffect(() => {
    dispatch(fetchCategoryHeatmap());
  }, [dispatch]);

  if (loading) {
    return (
      <div>
        <PageHeader />
        <div className="flex flex-col items-center py-16">
          <RefreshCw className="h-8 w-8 text-orange-500 animate-spin mb-4" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Computing category risk levels...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader />
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-5 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      </div>
    );
  }

  if (!data || data.categories.length === 0) {
    return (
      <div>
        <PageHeader />
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-8 flex flex-col items-center text-center">
          <Flame className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">No category data available</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Upload a bank statement to see your category risk heatmap</p>
        </div>
      </div>
    );
  }

  const highRisk = data.categories.filter((c) => c.effective_risk === 'High');
  const medRisk  = data.categories.filter((c) => c.effective_risk === 'Medium');
  const lowRisk  = data.categories.filter((c) => c.effective_risk === 'Low');

  return (
    <div>
      <PageHeader />

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'High Risk', count: highRisk.length, color: 'text-red-600 dark:text-red-400' },
          { label: 'Medium Risk', count: medRisk.length, color: 'text-amber-600 dark:text-amber-400' },
          { label: 'Low Risk', count: lowRisk.length, color: 'text-green-600 dark:text-green-400' },
        ].map(({ label, count, color }) => (
          <div key={label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-center">
            <p className={cn('text-2xl font-bold', color)}>{count}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Heatmap grid */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Category Risk Overview</h2>
          <span className="text-xs text-gray-400 dark:text-gray-500">{data.months_analyzed} month(s) analyzed</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-4">
          {data.categories.map((cat) => {
            const styles = RISK_STYLES[cat.effective_risk];
            return (
              <div key={cat.name} className={cn('rounded-lg border p-3', styles.tile, styles.border)}>
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 leading-tight">{cat.name}</p>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">{formatCurrency(cat.monthly_avg)}<span className="text-[10px] font-normal text-gray-400">/mo</span></p>
                <div className="flex items-center justify-between">
                  <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', styles.badge)}>
                    {cat.effective_risk}
                  </span>
                  <div className="flex items-center gap-0.5">
                    <TrendIcon dir={cat.trend} />
                    {cat.trend_pct !== 0 && (
                      <span className={cn('text-[10px]', cat.trend === 'up' ? 'text-red-500' : 'text-green-500')}>
                        {Math.abs(cat.trend_pct)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-gray-100 dark:border-gray-800">
          <span className="text-xs text-gray-500 dark:text-gray-400">Risk:</span>
          {(['Low', 'Medium', 'High'] as RiskLevel[]).map((level) => (
            <div key={level} className="flex items-center gap-1.5">
              <span className={cn('w-2 h-2 rounded-full', level === 'Low' ? 'bg-green-500' : level === 'Medium' ? 'bg-amber-500' : 'bg-red-500')} />
              <span className="text-xs text-gray-500 dark:text-gray-400">{level}</span>
            </div>
          ))}
          <div className="flex items-center gap-3 ml-auto">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-red-400" />
              <span className="text-xs text-gray-400">Rising</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingDown className="h-3 w-3 text-green-400" />
              <span className="text-xs text-gray-400">Falling</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PageHeader() {
  return (
    <div className="flex items-start gap-4 mb-6">
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 shrink-0">
        <Flame className="h-5 w-5 text-orange-600 dark:text-orange-400" />
      </div>
      <div>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Category Risk Heatmap</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Risk-weighted spending categories (gambling, luxury, subscription creep) with trend arrows
        </p>
      </div>
    </div>
  );
}
