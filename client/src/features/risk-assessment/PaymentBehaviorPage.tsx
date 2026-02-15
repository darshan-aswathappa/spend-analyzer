import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CreditCard, CheckCircle, Clock, AlertCircle, RefreshCw, XCircle } from 'lucide-react';
import type { AppDispatch, RootState } from '@/app/store';
import { fetchPaymentBehavior } from './riskInsightsSlice';
import { cn } from '@/lib/utils';

const RATING_STYLES = {
  excellent: { bar: 'bg-green-500',  label: 'Excellent', badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  good:      { bar: 'bg-blue-500',   label: 'Good',      badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'     },
  fair:      { bar: 'bg-amber-500',  label: 'Fair',      badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'  },
  poor:      { bar: 'bg-red-500',    label: 'Poor',      badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'          },
};

const BEHAVIOR_STYLES = {
  early:    { label: 'Early',    color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
  on_time:  { label: 'On-Time', color: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-100 dark:bg-blue-900/30'   },
  late:     { label: 'Late',    color: 'text-red-600 dark:text-red-400',     bg: 'bg-red-100 dark:bg-red-900/30'     },
};

export function PaymentBehaviorPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { data, loading, error } = useSelector((s: RootState) => s.riskInsights.payments);

  useEffect(() => {
    dispatch(fetchPaymentBehavior());
  }, [dispatch]);

  if (loading) {
    return (
      <div>
        <PageHeader />
        <div className="flex flex-col items-center py-16">
          <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mb-4" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Analyzing payment patterns...</p>
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

  if (!data || data.bills.length === 0) {
    return (
      <div>
        <PageHeader />
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-8 flex flex-col items-center text-center">
          <CreditCard className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">No recurring bills detected</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-xs">
            Upload statements spanning 2+ months with Utilities or Rent transactions to see payment behavior analysis
          </p>
        </div>
      </div>
    );
  }

  const ratingStyle = data.rating ? RATING_STYLES[data.rating] : null;

  return (
    <div>
      <PageHeader />

      {/* Score card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-5">
        <div className="flex flex-col items-center py-2">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium mb-2">Payment Score</p>
          <div className="flex items-end gap-1 mb-3">
            <span className="text-5xl font-bold text-gray-900 dark:text-gray-100">
              {data.score !== null ? data.score : '—'}
            </span>
            <span className="text-lg text-gray-400 dark:text-gray-500 mb-1">/ 100</span>
          </div>
          <div className="w-full max-w-xs bg-gray-100 dark:bg-gray-800 rounded-full h-2 mb-3">
            <div
              className={cn('h-2 rounded-full transition-all', ratingStyle?.bar || 'bg-gray-300')}
              style={{ width: `${data.score ?? 0}%` }}
            />
          </div>
          {ratingStyle && (
            <span className={cn('text-xs font-semibold px-3 py-1 rounded-full', ratingStyle.badge)}>
              {ratingStyle.label}
            </span>
          )}
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{data.months_analyzed} month(s) of data · {data.bills.length} recurring bill(s) detected</p>
        </div>
      </div>

      {/* Breakdown cards */}
      <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Payment Timing Breakdown</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { icon: CheckCircle, label: 'Early',   count: data.breakdown.early,   color: 'text-green-600 dark:text-green-400', iconBg: 'bg-green-100 dark:bg-green-900/30' },
          { icon: Clock,       label: 'On-Time', count: data.breakdown.on_time, color: 'text-blue-600 dark:text-blue-400',   iconBg: 'bg-blue-100 dark:bg-blue-900/30'   },
          { icon: AlertCircle, label: 'Late',    count: data.breakdown.late,    color: 'text-red-600 dark:text-red-400',     iconBg: 'bg-red-100 dark:bg-red-900/30'     },
          { icon: XCircle,     label: 'Missed',  count: data.breakdown.missed,  color: 'text-gray-500 dark:text-gray-400',   iconBg: 'bg-gray-100 dark:bg-gray-800'      },
        ].map(({ icon: Icon, label, count, color, iconBg }) => (
          <div key={label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
            <div className={cn('inline-flex items-center justify-center w-8 h-8 rounded-lg mb-2', iconBg)}>
              <Icon className={cn('h-4 w-4', color)} />
            </div>
            <p className={cn('text-2xl font-bold', color)}>{count}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Bills table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Detected Recurring Bills</h2>
        </div>
        <div className="hidden sm:grid grid-cols-4 gap-3 px-4 py-2 bg-gray-50 dark:bg-gray-800/50 text-xs font-medium text-gray-500 dark:text-gray-400">
          <span>Bill</span>
          <span>Category</span>
          <span>Avg Payment Day</span>
          <span>Behavior</span>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {data.bills.map((bill, i) => {
            const bStyle = BEHAVIOR_STYLES[bill.behavior];
            return (
              <div key={i} className="px-4 py-3 flex flex-col sm:grid sm:grid-cols-4 sm:gap-3 sm:items-center gap-1">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 capitalize">{bill.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{bill.category}</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">Day {bill.avg_payment_day} · {bill.occurrences} payments</p>
                <span className={cn('inline-block text-xs font-semibold px-2 py-0.5 rounded-full w-fit', bStyle.bg, bStyle.color)}>
                  {bStyle.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PageHeader() {
  return (
    <div className="flex items-start gap-4 mb-6">
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 shrink-0">
        <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      </div>
      <div>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Payment Behavior Analysis</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Score based on early/on-time/late payment patterns across all bills
        </p>
      </div>
    </div>
  );
}
