import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { GitCompare, Monitor } from 'lucide-react';
import type { AppDispatch, RootState } from '@/app/store';
import apiClient from '@/lib/apiClient';
import { setStatements } from '@/features/statements/statementsSlice';
import type { TrendsData } from '@/types';
import { StatementSelector } from './StatementSelector';
import { SummaryTotalsCard, type StatementSummary } from './SummaryTotalsCard';
import { CategoryComparisonChart, type MergedCategory } from './CategoryComparisonChart';
import { DeltaTable } from './DeltaTable';

export function ComparisonPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { items: statements } = useSelector((state: RootState) => state.statements);

  const [baselineId, setBaselineId] = useState<string | null>(null);
  const [compareId, setCompareId] = useState<string | null>(null);

  const [baselineSummary, setBaselineSummary] = useState<StatementSummary | null>(null);
  const [compareSummary, setCompareSummary] = useState<StatementSummary | null>(null);

  // Trends kept for future monthly chart extension; not used in current layout
  const [, setBaselineTrends] = useState<TrendsData | null>(null);
  const [, setCompareTrends] = useState<TrendsData | null>(null);

  const [baselineSummaryLoading, setBaselineSummaryLoading] = useState(false);
  const [compareSummaryLoading, setCompareSummaryLoading] = useState(false);
  const [baselineError, setBaselineError] = useState<string | null>(null);
  const [compareError, setCompareError] = useState<string | null>(null);

  // Bootstrap statements if not yet loaded (e.g. navigating directly to /comparison)
  useEffect(() => {
    if (statements.length === 0) {
      apiClient.get('/statements').then(({ data }) => {
        dispatch(setStatements(data));
      }).catch(() => {});
    }
  }, [statements.length, dispatch]);

  // Fetch baseline data
  useEffect(() => {
    if (!baselineId) {
      setBaselineSummary(null);
      setBaselineTrends(null);
      return;
    }
    setBaselineError(null);
    setBaselineSummaryLoading(true);

    Promise.all([
      apiClient.get<StatementSummary>('/transactions/summary', {
        params: { statement_id: baselineId },
      }),
      apiClient.get<TrendsData>('/transactions/trends', {
        params: { statement_id: baselineId, months: 24 },
      }),
    ])
      .then(([summaryRes, trendsRes]) => {
        setBaselineSummary(summaryRes.data);
        setBaselineTrends(trendsRes.data);
      })
      .catch(() => setBaselineError('Failed to load baseline data'))
      .finally(() => setBaselineSummaryLoading(false));
  }, [baselineId]);

  // Fetch compare data
  useEffect(() => {
    if (!compareId) {
      setCompareSummary(null);
      setCompareTrends(null);
      return;
    }
    setCompareError(null);
    setCompareSummaryLoading(true);

    Promise.all([
      apiClient.get<StatementSummary>('/transactions/summary', {
        params: { statement_id: compareId },
      }),
      apiClient.get<TrendsData>('/transactions/trends', {
        params: { statement_id: compareId, months: 24 },
      }),
    ])
      .then(([summaryRes, trendsRes]) => {
        setCompareSummary(summaryRes.data);
        setCompareTrends(trendsRes.data);
      })
      .catch(() => setCompareError('Failed to load comparison data'))
      .finally(() => setCompareSummaryLoading(false));
  }, [compareId]);

  // Compute per-category deltas
  const mergedCategories = useMemo<MergedCategory[]>(() => {
    if (!baselineSummary && !compareSummary) return [];

    const baseMap = new Map(Object.entries(baselineSummary?.byCategory ?? {}));
    const compMap = new Map(Object.entries(compareSummary?.byCategory ?? {}));
    const allCategories = Array.from(
      new Set([...baseMap.keys(), ...compMap.keys()])
    ).sort();

    return allCategories
      .map((cat) => {
        const base = baseMap.get(cat) ?? 0;
        const comp = compMap.get(cat) ?? 0;
        return {
          category: cat,
          baselineTotal: base,
          compareTotal: comp,
          deltaAmount: comp - base,
          deltaPct: base !== 0 ? ((comp - base) / base) * 100 : null,
          presentInBoth: baseMap.has(cat) && compMap.has(cat),
        };
      })
      .sort((a, b) => b.baselineTotal - a.baselineTotal);
  }, [baselineSummary, compareSummary]);

  const completedStatements = statements.filter(
    (s) => s.processing_status === 'completed'
  );

  const baselineStmt = statements.find((s) => s.id === baselineId);
  const compareStmt = statements.find((s) => s.id === compareId);

  function makeLabel(stmt: typeof baselineStmt, fallback: string) {
    if (!stmt) return fallback;
    const bank = stmt.bank_name ?? 'Unknown Bank';
    if (stmt.statement_period_start && stmt.statement_period_end) {
      return `${bank} (${stmt.statement_period_start.slice(0, 7)} – ${stmt.statement_period_end.slice(0, 7)})`;
    }
    return bank;
  }

  const baselineLabel = makeLabel(baselineStmt, 'Baseline');
  const compareLabel = makeLabel(compareStmt, 'Compare');

  const eitherSelected = baselineId !== null || compareId !== null;
  const bothSelected = baselineId !== null && compareId !== null;

  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
        Statement Comparison
      </h1>

      {/* Mobile blocker */}
      <div className="flex md:hidden flex-col items-center justify-center text-center py-16 px-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-8 max-w-sm">
          <Monitor className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Desktop Recommended
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Statement comparison is best experienced on a larger screen.
          </p>
        </div>
      </div>

      {/* Desktop content */}
      <div className="hidden md:block space-y-5">
        {/* Statement selectors */}
        <div className="grid grid-cols-2 gap-5">
          <StatementSelector
            label="Baseline"
            labelColor="text-blue-600 dark:text-blue-400"
            value={baselineId}
            onChange={(id) => {
              setBaselineId(id);
              setBaselineSummary(null);
            }}
            statements={completedStatements}
            disabledId={compareId}
            loading={baselineSummaryLoading}
          />
          <StatementSelector
            label="Compare"
            labelColor="text-orange-500 dark:text-orange-400"
            value={compareId}
            onChange={(id) => {
              setCompareId(id);
              setCompareSummary(null);
            }}
            statements={completedStatements}
            disabledId={baselineId}
            loading={compareSummaryLoading}
          />
        </div>

        {/* Per-slot error banners */}
        {baselineError && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-600 dark:text-red-400">
            Baseline: {baselineError}
          </div>
        )}
        {compareError && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-600 dark:text-red-400">
            Compare: {compareError}
          </div>
        )}

        {/* Empty state */}
        {!eitherSelected && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-10 max-w-sm text-center">
              <GitCompare className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Select two statements to compare
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Use the dropdowns above to pick a baseline and a comparison period
              </p>
            </div>
          </div>
        )}

        {/* Content shown once at least one statement is selected */}
        {eitherSelected && (
          <>
            <SummaryTotalsCard
              baselineSummary={baselineSummary}
              compareSummary={compareSummary}
              baselineLabel={baselineLabel}
              compareLabel={compareLabel}
              baselineLoading={baselineSummaryLoading}
              compareLoading={compareSummaryLoading}
            />

            {bothSelected && (
              <>
                <CategoryComparisonChart
                  data={mergedCategories}
                  baselineLabel={baselineLabel}
                  compareLabel={compareLabel}
                  loading={baselineSummaryLoading || compareSummaryLoading}
                />
                <DeltaTable
                  data={mergedCategories}
                  baselineLabel={baselineLabel}
                  compareLabel={compareLabel}
                  loading={baselineSummaryLoading || compareSummaryLoading}
                />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
