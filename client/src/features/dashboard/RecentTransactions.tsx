import { Card, CardContent } from '@/components/ui/card';
import type { Transaction } from '@/types';
import { formatCurrency, formatDate, CATEGORY_COLORS } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface Props {
  transactions: Transaction[];
  loading: boolean;
}

export function RecentTransactions({ transactions, loading }: Props) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-0">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
              <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse flex-1" />
              <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-gray-400 dark:text-gray-500">
          No transactions yet
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        {transactions.map((tx, idx) => (
          <div
            key={tx.id}
            className={cn(
              'flex items-center gap-4 px-5 py-3.5',
              idx < transactions.length - 1 && 'border-b border-gray-100 dark:border-gray-800'
            )}
          >
            {/* Category dot */}
            <div className="shrink-0">
              <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', CATEGORY_COLORS[tx.category] ?? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300')}>
                {tx.category}
              </span>
            </div>

            {/* Description */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 dark:text-gray-100 truncate">{tx.description}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{formatDate(tx.date)}</p>
            </div>

            {/* Amount */}
            <span
              className={cn(
                'text-sm font-semibold shrink-0',
                tx.type === 'credit' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
              )}
            >
              {tx.type === 'credit' ? '+' : '-'}
              {formatCurrency(tx.amount)}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
