import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Brain, Moon, Calendar, HeartCrack, RefreshCw, TrendingUp } from 'lucide-react';
import type { AppDispatch, RootState } from '@/app/store';
import { fetchImpulseScore } from './riskInsightsSlice';
import { cn } from '@/lib/utils';

const RATING_STYLES = {
  Low:    { bar: 'bg-green-500',  badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',  label: 'Low Risk'    },
  Medium: { bar: 'bg-amber-500',  badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',  label: 'Medium Risk' },
  High:   { bar: 'bg-red-500',    badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',          label: 'High Risk'   },
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export function ImpulseSpendingPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { data, loading, error } = useSelector((s: RootState) => s.riskInsights.impulse);

  useEffect(() => {
    dispatch(fetchImpulseScore());
  }, [dispatch]);

  if (loading) {
    return (
      <div>
        <PageHeader />
        <div className="flex flex-col items-center py-16">
          <RefreshCw className="h-8 w-8 text-purple-500 animate-spin mb-4" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Analyzing spending patterns...</p>
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

  if (!data) {
    return (
      <div>
        <PageHeader />
        <EmptyState />
      </div>
    );
  }

  const styles = RATING_STYLES[data.rating];

  return (
    <div>
      <PageHeader />

      {/* Score card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-5">
        <div className="flex flex-col items-center py-2">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium mb-2">Impulse Risk Score</p>
          <div className="relative flex items-center justify-center w-32 h-32 mb-3">
            <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" className="text-gray-100 dark:text-gray-800" strokeWidth="10" />
              <circle
                cx="60" cy="60" r="50" fill="none"
                stroke="currentColor"
                className={cn(
                  data.rating === 'Low' ? 'text-green-500' :
                  data.rating === 'Medium' ? 'text-amber-500' : 'text-red-500'
                )}
                strokeWidth="10"
                strokeDasharray={`${(data.score / 100) * 314} 314`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-center">
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{data.score}</p>
              <p className="text-xs text-gray-400">/100</p>
            </div>
          </div>
          <span className={cn('text-xs font-semibold px-3 py-1 rounded-full', styles.badge)}>{styles.label}</span>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Based on {data.months_analyzed} month(s) of data</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Discretionary Spending</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{data.discretionary_pct}%</p>
            <p className="text-[10px] text-gray-400">of total spending</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Post-Payday Multiplier</p>
            <p className={cn('text-lg font-semibold', data.post_payday_ratio > 1.5 ? 'text-red-600 dark:text-red-400' : data.post_payday_ratio > 1.2 ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400')}>
              {data.post_payday_ratio > 0 ? `${data.post_payday_ratio}×` : '—'}
            </p>
            <p className="text-[10px] text-gray-400">vs normal 3-day window</p>
          </div>
        </div>
      </div>

      {/* Pattern cards */}
      <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Detected Patterns</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-5">
        {[
          {
            icon: Moon,
            title: 'Discretionary Ratio',
            value: `${data.discretionary_pct}%`,
            note: data.discretionary_pct > 40 ? 'Above recommended 35%' : 'Within healthy range',
            accent: data.discretionary_pct > 40 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400',
            bg: data.discretionary_pct > 40 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
          },
          {
            icon: Calendar,
            title: 'Post-Payday Splurge',
            value: data.post_payday_ratio > 0 ? `${data.post_payday_ratio}× normal` : 'No income detected',
            note: data.post_payday_ratio > 1.5 ? 'High post-income spending detected' : data.post_payday_ratio > 1.2 ? 'Mild splurge pattern detected' : 'Normal post-income behavior',
            accent: data.post_payday_ratio > 1.5 ? 'text-red-600 dark:text-red-400' : data.post_payday_ratio > 1.2 ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400',
            bg: data.post_payday_ratio > 1.5 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : data.post_payday_ratio > 1.2 ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
          },
          {
            icon: HeartCrack,
            title: 'Impulse Score',
            value: `${data.score}/100`,
            note: data.rating === 'Low' ? 'Spending patterns look healthy' : data.rating === 'Medium' ? 'Some impulsive patterns detected' : 'High impulse risk — review discretionary spending',
            accent: styles.badge.split(' ')[1],
            bg: data.rating === 'Low' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : data.rating === 'Medium' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
          },
        ].map(({ icon: Icon, title, value, note, accent, bg }) => (
          <div key={title} className={`rounded-xl border p-4 ${bg}`}>
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`h-4 w-4 shrink-0 ${accent}`} />
              <h3 className={`text-sm font-semibold ${accent}`}>{title}</h3>
            </div>
            <p className={`text-xl font-bold mb-1 ${accent}`}>{value}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">{note}</p>
          </div>
        ))}
      </div>

      {/* Top impulse transactions */}
      {data.top_transactions.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <TrendingUp className="h-4 w-4 text-purple-500" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Top Discretionary Transactions</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.top_transactions.map((t, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm text-gray-800 dark:text-gray-200 truncate">{t.description}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{t.date} · {t.category}</p>
                </div>
                <span className="text-sm font-medium text-red-600 dark:text-red-400 ml-4 shrink-0">{formatCurrency(t.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PageHeader() {
  return (
    <div className="flex items-start gap-4 mb-6">
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 shrink-0">
        <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
      </div>
      <div>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Impulse Spending Score</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          AI identifies impulsive patterns: late-night purchases, emotional spending triggers, post-payday splurges
        </p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-8 flex flex-col items-center text-center">
      <Brain className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">No transaction data yet</p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Upload a bank statement to see your impulse spending analysis</p>
    </div>
  );
}
