import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Store, AlertTriangle, ShieldAlert, Layers, RefreshCw } from 'lucide-react';
import type { AppDispatch, RootState } from '@/app/store';
import { fetchMerchantFlags } from './riskInsightsSlice';
import { cn } from '@/lib/utils';

const RISK_TYPE_META: Record<string, { label: string; icon: typeof AlertTriangle; color: string; bg: string; border: string }> = {
  payday_lender: {
    label: 'Payday Lender',
    icon: AlertTriangle,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/30',
    border: 'border-red-200 dark:border-red-700',
  },
  gambling: {
    label: 'Gambling',
    icon: Layers,
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    border: 'border-orange-200 dark:border-orange-700',
  },
  predatory: {
    label: 'Predatory Service',
    icon: ShieldAlert,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    border: 'border-amber-200 dark:border-amber-700',
  },
};

const RISK_TYPES_INFO = [
  {
    title: 'Payday Lenders',
    description: 'High-interest short-term loan services. Repeated use signals cash-flow stress and can trap users in debt cycles.',
    icon: AlertTriangle,
    accent: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-700',
    iconBg: 'bg-red-100 dark:bg-red-900/30',
  },
  {
    title: 'Gambling Platforms',
    description: 'Online casinos, sports betting apps, and lottery services. Flagged regardless of amount.',
    icon: Layers,
    accent: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-200 dark:border-orange-700',
    iconBg: 'bg-orange-100 dark:bg-orange-900/30',
  },
  {
    title: 'Predatory Services',
    description: 'Subscription traps, rent-to-own dark patterns, and services with known consumer complaints.',
    icon: ShieldAlert,
    accent: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-700',
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
  },
];

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export function MerchantRiskPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { data, loading, error } = useSelector((s: RootState) => s.riskInsights.merchants);

  useEffect(() => {
    dispatch(fetchMerchantFlags());
  }, [dispatch]);

  if (loading) {
    return (
      <div>
        <PageHeader />
        <div className="flex flex-col items-center py-16">
          <RefreshCw className="h-8 w-8 text-red-500 animate-spin mb-4" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Scanning merchant descriptions...</p>
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

  return (
    <div>
      <PageHeader />

      <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Risk Categories</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        {RISK_TYPES_INFO.map(({ title, description, icon: Icon, accent, bg, border, iconBg }) => (
          <div key={title} className={cn('rounded-xl border p-4', bg, border)}>
            <div className={cn('inline-flex items-center justify-center w-8 h-8 rounded-lg mb-3', iconBg)}>
              <Icon className={cn('h-4 w-4', accent)} />
            </div>
            <h3 className={cn('text-sm font-semibold mb-1.5', accent)}>{title}</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Flagged Merchants</h2>
          <span className={cn(
            'text-xs font-medium px-2 py-0.5 rounded-full',
            data && data.total_flagged > 0
              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          )}>
            {data ? `${data.total_flagged} flagged` : '—'}
          </span>
        </div>

        {data && data.total_flagged > 0 ? (
          <>
            <div className="px-4 py-2.5 bg-red-50 dark:bg-red-900/10 border-b border-red-100 dark:border-red-900/30">
              <p className="text-xs text-red-700 dark:text-red-400">
                Total at-risk spending: <span className="font-semibold">{formatCurrency(data.total_risk_amount)}</span>
              </p>
            </div>

            <div className="hidden sm:grid grid-cols-5 gap-3 px-4 py-2 bg-gray-50 dark:bg-gray-800/50 text-xs font-medium text-gray-500 dark:text-gray-400">
              <span className="col-span-2">Merchant</span>
              <span>Risk Type</span>
              <span>Transactions</span>
              <span>Total Spent</span>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {data.flagged.map((f, i) => {
                const meta = RISK_TYPE_META[f.risk_type] || RISK_TYPE_META.predatory;
                const MetaIcon = meta.icon;
                return (
                  <div key={i} className="px-4 py-3 flex flex-col sm:grid sm:grid-cols-5 sm:gap-3 sm:items-center gap-1">
                    <div className="sm:col-span-2 min-w-0">
                      <p className="text-sm text-gray-800 dark:text-gray-200 truncate font-medium">{f.sample_description}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">Last seen: {f.latest_date}</p>
                    </div>
                    <div>
                      <span className={cn('inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border', meta.bg, meta.color, meta.border)}>
                        <MetaIcon className="h-3 w-3" />
                        {meta.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{f.transaction_count} txn{f.transaction_count !== 1 ? 's' : ''}</p>
                    <p className="text-sm font-medium text-red-600 dark:text-red-400">{formatCurrency(f.total_amount)}</p>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center py-10 text-center">
            <ShieldAlert className="h-8 w-8 text-green-400 dark:text-green-600 mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">No flagged merchants detected</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {data
                ? 'Your transactions appear clean of high-risk merchants'
                : 'Upload a bank statement to scan for risky merchants'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function PageHeader() {
  return (
    <div className="flex items-start gap-4 mb-6">
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 shrink-0">
        <Store className="h-5 w-5 text-red-600 dark:text-red-400" />
      </div>
      <div>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Merchant Risk Flags</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Flag high-risk merchants: payday lenders, gambling sites, predatory services
        </p>
      </div>
    </div>
  );
}
