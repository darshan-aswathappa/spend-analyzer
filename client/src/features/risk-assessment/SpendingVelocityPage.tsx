import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Zap, ShieldAlert, TrendingUp, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import type { AppDispatch, RootState } from '@/app/store';
import { fetchVelocityAlerts } from './riskInsightsSlice';
import { cn } from '@/lib/utils';

const ALERT_STYLES = {
  normal:   { label: 'Normal',   banner: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',  text: 'text-green-700 dark:text-green-400',  icon: CheckCircle  },
  warning:  { label: 'Warning',  banner: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',  text: 'text-amber-700 dark:text-amber-400',  icon: AlertTriangle },
  critical: { label: 'Critical', banner: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',          text: 'text-red-700 dark:text-red-400',      icon: ShieldAlert   },
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function shortMonth(ym: string) {
  const [y, m] = ym.split('-');
  return new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

export function SpendingVelocityPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { data, loading, error } = useSelector((s: RootState) => s.riskInsights.velocity);

  useEffect(() => {
    dispatch(fetchVelocityAlerts());
  }, [dispatch]);

  if (loading) {
    return (
      <div>
        <PageHeader />
        <div className="flex flex-col items-center py-16">
          <RefreshCw className="h-8 w-8 text-yellow-500 animate-spin mb-4" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Calculating spending velocity...</p>
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
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-8 flex flex-col items-center text-center">
          <Zap className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">No transaction data yet</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Upload a bank statement to see spending velocity analysis</p>
        </div>
      </div>
    );
  }

  const alertStyle = ALERT_STYLES[data.alert_level];
  const AlertIcon = alertStyle.icon;
  const maxBar = Math.max(...data.monthly_history.map((m) => m.total), 1);

  return (
    <div>
      <PageHeader />

      {/* Alert banner */}
      <div className={cn('flex items-start gap-3 rounded-xl border p-4 mb-5', alertStyle.banner)}>
        <AlertIcon className={cn('h-5 w-5 shrink-0 mt-0.5', alertStyle.text)} />
        <div>
          <p className={cn('text-sm font-semibold', alertStyle.text)}>
            Velocity Status: {alertStyle.label}
          </p>
          <p className={cn('text-xs mt-0.5', alertStyle.text)}>
            {data.alert_level === 'normal'
              ? 'Spending pace is within normal range.'
              : data.alert_level === 'warning'
              ? `You're on pace to spend ${Math.round((data.velocity_ratio - 1) * 100)}% more than your 3-month average this month.`
              : `High alert: projected spending is ${Math.round((data.velocity_ratio - 1) * 100)}% above your 3-month average.`}
          </p>
        </div>
      </div>

      {/* Stats strip */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 divide-x divide-gray-100 dark:divide-gray-800">
          {[
            { label: 'This Month (so far)', value: formatCurrency(data.current_month_total) },
            { label: `Projected (${data.days_elapsed}/${data.days_in_month} days)`, value: formatCurrency(data.projected_monthly) },
            { label: '3-Month Average', value: data.three_month_avg > 0 ? formatCurrency(data.three_month_avg) : '—' },
            { label: 'Velocity Ratio', value: data.three_month_avg > 0 ? `${data.velocity_ratio}×` : '—' },
          ].map(({ label, value }, i) => (
            <div key={i} className={cn('text-center', i > 0 ? 'pl-4' : '')}>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Alert type cards */}
      <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Alert Types</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
        {[
          {
            icon: ShieldAlert,
            title: 'Fraud Indicator',
            description: 'Rapid sequential purchases at unusual merchants — multiple transactions within minutes, or spending pace 50%+ above normal baseline.',
            accent: 'text-red-600 dark:text-red-400',
            bg: 'bg-red-50 dark:bg-red-900/20',
            border: 'border-red-300 dark:border-red-700',
            iconBg: 'bg-red-100 dark:bg-red-900/30',
          },
          {
            icon: TrendingUp,
            title: 'Stress Spending',
            description: 'Spending spikes correlated with income deposits. Pattern: large discretionary outflows within 24–72 hours of salary credit.',
            accent: 'text-orange-600 dark:text-orange-400',
            bg: 'bg-orange-50 dark:bg-orange-900/20',
            border: 'border-orange-300 dark:border-orange-700',
            iconBg: 'bg-orange-100 dark:bg-orange-900/30',
          },
        ].map(({ icon: Icon, title, description, accent, bg, border, iconBg }) => (
          <div key={title} className={cn('rounded-xl border-2 p-4', bg, border)}>
            <div className={cn('inline-flex items-center justify-center w-8 h-8 rounded-lg mb-3', iconBg)}>
              <Icon className={cn('h-4 w-4', accent)} />
            </div>
            <h3 className={cn('text-sm font-semibold mb-1.5', accent)}>{title}</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
          </div>
        ))}
      </div>

      {/* Monthly history bar chart */}
      {data.monthly_history.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-5">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Monthly Spending History</h2>
          <div className="flex items-end gap-2 h-32">
            {data.monthly_history.map(({ month, total }) => {
              const heightPct = total > 0 ? (total / maxBar) * 100 : 2;
              const isCurrent = month === new Date().toISOString().substring(0, 7);
              return (
                <div key={month} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate w-full text-center">
                    {formatCurrency(total)}
                  </span>
                  <div
                    className={cn(
                      'w-full rounded-t',
                      isCurrent
                        ? data.alert_level === 'critical' ? 'bg-red-400' : data.alert_level === 'warning' ? 'bg-amber-400' : 'bg-blue-400'
                        : 'bg-blue-200 dark:bg-blue-800'
                    )}
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate w-full text-center">{shortMonth(month)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Burst days */}
      {data.burst_days.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <Zap className="h-4 w-4 text-yellow-500" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">High-Velocity Days This Month</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.burst_days.map(({ date, amount }) => (
              <div key={date} className="flex items-center justify-between px-4 py-2.5">
                <p className="text-sm text-gray-700 dark:text-gray-300">{date}</p>
                <span className="text-sm font-medium text-red-600 dark:text-red-400">{formatCurrency(amount)}</span>
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
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 shrink-0">
        <Zap className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
      </div>
      <div>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Spending Velocity Alerts</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Real-time detection of unusual spending speed (fraud indicator or stress spending)
        </p>
      </div>
    </div>
  );
}
