import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency, CATEGORY_HEX_COLORS, cn } from '@/lib/utils';
import type { MergedCategory } from './CategoryComparisonChart';

interface Props {
  data: MergedCategory[];
  baselineLabel: string;
  compareLabel: string;
  loading: boolean;
}

function DeltaPctCell({ row }: { row: MergedCategory }) {
  if (row.compareTotal === 0 && row.baselineTotal > 0) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
        Gone
      </span>
    );
  }
  if (row.baselineTotal === 0 && row.compareTotal > 0) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
        New
      </span>
    );
  }
  if (row.deltaPct === null) return <span className="text-gray-400 dark:text-gray-500">—</span>;

  const isIncrease = row.deltaPct > 0;
  return (
    <span
      className={cn(
        'font-medium',
        isIncrease ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400'
      )}
    >
      {isIncrease ? '+' : ''}
      {row.deltaPct.toFixed(1)}%
    </span>
  );
}

export function DeltaTable({ data, baselineLabel, compareLabel, loading }: Props) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse">
        <div className="h-10 bg-gray-50 dark:bg-gray-800/50" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 border-t border-gray-100 dark:border-gray-800 px-5 flex items-center gap-4">
            <div className="h-3.5 w-3 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="h-3.5 w-28 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const baselineTotal = data.reduce((s, r) => s + r.baselineTotal, 0);
  const compareTotal = data.reduce((s, r) => s + r.compareTotal, 0);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400">
          Category Delta
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/50">
              <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Category
              </th>
              <th className="text-right px-5 py-2.5 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide max-w-[160px]">
                <span className="truncate block">Baseline</span>
              </th>
              <th className="text-right px-5 py-2.5 text-xs font-semibold text-orange-500 dark:text-orange-400 uppercase tracking-wide max-w-[160px]">
                <span className="truncate block">Compare</span>
              </th>
              <th className="text-right px-5 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Change ($)
              </th>
              <th className="text-right px-5 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Change (%)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.map((row) => (
              <tr
                key={row.category}
                className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{
                        backgroundColor:
                          CATEGORY_HEX_COLORS[row.category] ?? '#64748b',
                      }}
                    />
                    <span className="text-gray-800 dark:text-gray-200">{row.category}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-right text-gray-600 dark:text-gray-400">
                  {formatCurrency(row.baselineTotal)}
                </td>
                <td className="px-5 py-3 text-right text-gray-600 dark:text-gray-400">
                  {formatCurrency(row.compareTotal)}
                </td>
                <td className="px-5 py-3 text-right">
                  <span
                    className={cn(
                      'flex items-center justify-end gap-1 font-medium',
                      row.deltaAmount > 0
                        ? 'text-red-500 dark:text-red-400'
                        : row.deltaAmount < 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-gray-400 dark:text-gray-500'
                    )}
                  >
                    {row.deltaAmount > 0 && <TrendingUp className="h-3.5 w-3.5" />}
                    {row.deltaAmount < 0 && <TrendingDown className="h-3.5 w-3.5" />}
                    {row.deltaAmount > 0 ? '+' : ''}
                    {formatCurrency(row.deltaAmount)}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <DeltaPctCell row={row} />
                </td>
              </tr>
            ))}
          </tbody>
          {data.length > 0 && (
            <tfoot>
              <tr className="bg-gray-50 dark:bg-gray-800/50 font-semibold border-t border-gray-200 dark:border-gray-700">
                <td className="px-5 py-3 text-gray-900 dark:text-gray-100">Total</td>
                <td className="px-5 py-3 text-right text-gray-900 dark:text-gray-100">
                  {formatCurrency(baselineTotal)}
                </td>
                <td className="px-5 py-3 text-right text-gray-900 dark:text-gray-100">
                  {formatCurrency(compareTotal)}
                </td>
                <td className="px-5 py-3 text-right" colSpan={2} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
