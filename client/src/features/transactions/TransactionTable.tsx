import type { Transaction } from '@/types';
import { formatCurrency, formatDate, CATEGORY_COLORS } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
  transactions: Transaction[];
  loading: boolean;
}

export function TransactionTable({ transactions, loading }: Props) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-0">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 sm:px-5 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-24" />
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded animate-pulse flex-1" />
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="py-14 text-center text-sm text-gray-400 dark:text-gray-500">
          No transactions found
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {/* Table header — hidden on mobile */}
      <div className="hidden sm:grid grid-cols-[1fr_2fr_1fr_1fr] gap-4 px-5 py-2.5 bg-gray-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-700 rounded-t-xl">
        {['Date', 'Description', 'Category', 'Amount'].map((h) => (
          <span key={h} className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {h}
          </span>
        ))}
      </div>
      <CardContent className="p-0">
        {transactions.map((tx, idx) => (
          <div
            key={tx.id}
            className={cn(
              idx < transactions.length - 1 && 'border-b border-gray-100 dark:border-gray-800',
              'hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors'
            )}
          >
            {/* Desktop row */}
            <div className="hidden sm:grid grid-cols-[1fr_2fr_1fr_1fr] gap-4 px-5 py-3 items-center">
              <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(tx.date)}</span>
              <span className="text-sm text-gray-900 dark:text-gray-100 truncate" title={tx.description}>
                {tx.description}
              </span>
              <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium w-fit', CATEGORY_COLORS[tx.category] ?? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300')}>
                {tx.category}
              </span>
              <span
                className={cn(
                  'text-sm font-semibold text-right',
                  tx.type === 'credit' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                )}
              >
                {tx.type === 'credit' ? '+' : '-'}
                {formatCurrency(tx.amount)}
              </span>
            </div>

            {/* Mobile row */}
            <div className="sm:hidden px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm text-gray-900 dark:text-gray-100 truncate flex-1" title={tx.description}>
                  {tx.description}
                </span>
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
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(tx.date)}</span>
                <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium', CATEGORY_COLORS[tx.category] ?? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300')}>
                  {tx.category}
                </span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
