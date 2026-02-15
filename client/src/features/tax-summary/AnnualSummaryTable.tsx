import { useState } from 'react';
import { ChevronDown, ChevronRight, Receipt } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { TaxSummaryData, TaxCategoryValue } from '@/types';
import { TAX_CATEGORIES, TAX_CATEGORY_LABELS } from './constants';
import { TaxCategoryTag } from './TaxCategoryTag';

interface Props {
  data: TaxSummaryData;
  tagging: Record<string, boolean>;
  onTag: (transactionId: string, value: TaxCategoryValue | null) => void;
}

export function AnnualSummaryTable({ data, tagging, onTag }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    business: true,
    medical: true,
    charity: true,
  });

  const toggle = (key: string) => setExpanded((v) => ({ ...v, [key]: !v[key] }));

  const hasTags = data.transactionCount > 0;

  if (!hasTags) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex items-center justify-center w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
          <Receipt className="h-7 w-7 text-gray-400" />
        </div>
        <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">
          No tagged transactions
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
          Tag individual transactions as Business, Medical, or Charity using the dropdown in each row. They'll appear here grouped by tax category.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {TAX_CATEGORIES.map((cat) => {
          const group = data.tagged[cat.value];
          return (
            <div
              key={cat.value}
              className="rounded-xl border p-4"
              style={{ borderColor: cat.borderColor, backgroundColor: cat.bg }}
            >
              <p className="text-xs font-semibold mb-1" style={{ color: cat.color }}>
                {cat.label}
              </p>
              <p className="text-lg font-bold" style={{ color: cat.color }}>
                {formatCurrency(group.total)}
              </p>
              <p className="text-xs mt-0.5" style={{ color: cat.color, opacity: 0.7 }}>
                {group.count} transaction{group.count !== 1 ? 's' : ''}
              </p>
            </div>
          );
        })}
        {/* Grand total */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Grand Total</p>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {formatCurrency(data.grandTotal)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {data.transactionCount} transaction{data.transactionCount !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Category sections */}
      {TAX_CATEGORIES.map((cat) => {
        const group = data.tagged[cat.value];
        if (group.count === 0) return null;
        const isOpen = expanded[cat.value];

        return (
          <div
            key={cat.value}
            className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* Section header */}
            <button
              onClick={() => toggle(cat.value)}
              className="w-full flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
            >
              {isOpen ? (
                <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
              )}
              <span
                className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span className="font-medium text-sm text-gray-800 dark:text-gray-200">
                {TAX_CATEGORY_LABELS[cat.value]}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                ({group.count})
              </span>
              <span className="ml-auto text-sm font-semibold" style={{ color: cat.color }}>
                {formatCurrency(group.total)}
              </span>
            </button>

            {/* Transaction rows */}
            {isOpen && (
              <div className="border-t border-gray-100 dark:border-gray-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/50">
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Date</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Description</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden md:table-cell">Category</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tag</th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {group.transactions.map((tx) => (
                      <tr key={tx.id} className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {formatDate(tx.date)}
                        </td>
                        <td className="px-4 py-3 text-gray-800 dark:text-gray-200 max-w-[200px] truncate">
                          {tx.description}
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden md:table-cell">
                          {tx.category}
                        </td>
                        <td className="px-4 py-3">
                          <TaxCategoryTag
                            transactionId={tx.id}
                            currentValue={tx.tax_category}
                            onTag={onTag}
                            loading={tagging[tx.id]}
                          />
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">
                          {formatCurrency(tx.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
