import { Card, CardContent } from '@/components/ui/card';
import type { TransactionSummary } from '@/types';
import { formatCurrency, CATEGORY_COLORS } from '@/lib/utils';
import { TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  summary: TransactionSummary | null;
  loading: boolean;
}

export function BalanceSummary({ summary, loading }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="h-4 bg-gray-100 rounded animate-pulse mb-3 w-20" />
              <div className="h-7 bg-gray-100 rounded animate-pulse w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!summary) return null;

  const statCards = [
    {
      label: 'Net balance',
      value: formatCurrency(summary.balance),
      icon: Wallet,
      color: summary.balance >= 0 ? 'text-emerald-600' : 'text-red-600',
      bg: summary.balance >= 0 ? 'bg-emerald-50' : 'bg-red-50',
    },
    {
      label: 'Total income',
      value: formatCurrency(summary.totalCredits),
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Total spent',
      value: formatCurrency(summary.totalDebits),
      icon: TrendingDown,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
  ];

  const topCategories = Object.entries(summary.byCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const maxAmount = topCategories[0]?.[1] ?? 1;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</span>
                <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', bg)}>
                  <Icon className={cn('h-3.5 w-3.5', color)} />
                </div>
              </div>
              <p className={cn('text-xl font-semibold', color)}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {topCategories.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Spending by category
            </h3>
            <div className="space-y-3">
              {topCategories.map(([category, amount]) => (
                <div key={category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', CATEGORY_COLORS[category] ?? 'bg-gray-100 text-gray-700')}>
                      {category}
                    </span>
                    <span className="text-sm font-medium text-gray-700">{formatCurrency(amount)}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${(amount / maxAmount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
