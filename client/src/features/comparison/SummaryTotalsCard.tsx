import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

export interface StatementSummary {
  totalCredits: number;
  totalDebits: number;
  balance: number;
  byCategory: Record<string, number>;
}

interface Props {
  baselineSummary: StatementSummary | null;
  compareSummary: StatementSummary | null;
  baselineLabel: string;
  compareLabel: string;
  baselineLoading: boolean;
  compareLoading: boolean;
}

function DeltaCell({
  delta,
  invertColors = false,
}: {
  delta: number;
  invertColors?: boolean;
}) {
  if (delta === 0) return <span className="text-gray-400 dark:text-gray-500">—</span>;
  const isPositive = delta > 0;
  // invertColors=true for debits: positive delta means MORE spending (bad)
  const isGood = invertColors ? !isPositive : isPositive;
  return (
    <span
      className={cn(
        'flex items-center justify-end gap-1 font-medium',
        isGood ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
      )}
    >
      {isGood ? (
        <TrendingDown className="h-3.5 w-3.5" />
      ) : (
        <TrendingUp className="h-3.5 w-3.5" />
      )}
      {isPositive ? '+' : ''}
      {formatCurrency(delta)}
    </span>
  );
}

function ValueCell({ value, loading }: { value: number | null; loading: boolean }) {
  if (loading) {
    return <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ml-auto" />;
  }
  if (value === null) return <span className="text-gray-300 dark:text-gray-600">—</span>;
  return <span>{formatCurrency(value)}</span>;
}

const rows = [
  { key: 'totalDebits', label: 'Total Expenses', invertColors: true },
  { key: 'totalCredits', label: 'Total Income', invertColors: false },
  { key: 'balance', label: 'Net Balance', invertColors: false },
] as const;

export function SummaryTotalsCard({
  baselineSummary,
  compareSummary,
  baselineLabel,
  compareLabel,
  baselineLoading,
  compareLoading,
}: Props) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400">
          Summary Totals
        </h3>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800/50">
            <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide w-1/4">
              Metric
            </th>
            <th className="text-right px-5 py-2.5 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide w-1/4 max-w-[180px]">
              <span className="truncate block">{baselineLabel || 'Baseline'}</span>
            </th>
            <th className="text-right px-5 py-2.5 text-xs font-semibold text-orange-500 dark:text-orange-400 uppercase tracking-wide w-1/4 max-w-[180px]">
              <span className="truncate block">{compareLabel || 'Compare'}</span>
            </th>
            <th className="text-right px-5 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide w-1/4">
              Change
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {rows.map(({ key, label, invertColors }) => {
            const baseVal = baselineSummary ? baselineSummary[key] : null;
            const compVal = compareSummary ? compareSummary[key] : null;
            const delta =
              baseVal !== null && compVal !== null ? compVal - baseVal : null;

            return (
              <tr
                key={key}
                className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
              >
                <td className="px-5 py-3 font-medium text-gray-700 dark:text-gray-300">
                  {label}
                </td>
                <td className="px-5 py-3 text-right text-gray-600 dark:text-gray-400">
                  <ValueCell value={baseVal} loading={baselineLoading} />
                </td>
                <td className="px-5 py-3 text-right text-gray-600 dark:text-gray-400">
                  <ValueCell value={compVal} loading={compareLoading} />
                </td>
                <td className="px-5 py-3 text-right">
                  {delta !== null ? (
                    <DeltaCell delta={delta} invertColors={invertColors} />
                  ) : (
                    <span className="text-gray-300 dark:text-gray-600">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
