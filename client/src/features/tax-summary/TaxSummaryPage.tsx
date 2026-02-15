import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MapPin, Edit2, Loader2, AlertCircle } from 'lucide-react';
import type { AppDispatch, RootState } from '@/app/store';
import { loadTaxLocale, fetchAnnualSummary, tagTransaction } from './taxSummarySlice';
import { LocaleSetupDialog } from './LocaleSetupDialog';
import { AnnualSummaryTable } from './AnnualSummaryTable';
import { TaxReportGenerator } from './TaxReportGenerator';
import type { TaxCategoryValue } from '@/types';
import { COUNTRIES } from './constants';

// --- also need to allow tagging untagged transactions from a full transaction list ---
// This page shows tagged transactions grouped by category (AnnualSummaryTable)
// plus the untagged transactions from this year so users can tag them inline.
import apiClient from '@/lib/apiClient';
import type { Transaction } from '@/types';
import { TaxCategoryTag } from './TaxCategoryTag';
import { formatCurrency, formatDate } from '@/lib/utils';

function getCountryLabel(code: string) {
  return COUNTRIES.find((c) => c.value === code)?.label ?? code;
}

export function TaxSummaryPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { locale, localeChecked, summary, summaryLoading, tagging, error } = useSelector(
    (state: RootState) => state.taxSummary
  );

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [showLocaleDialog, setShowLocaleDialog] = useState(false);
  const [localeDialogMode, setLocaleDialogMode] = useState<'setup' | 'edit'>('setup');

  // Untagged transactions for this year
  const [untagged, setUntagged] = useState<Transaction[]>([]);
  const [untaggedLoading, setUntaggedLoading] = useState(false);

  // Load locale on mount
  useEffect(() => {
    if (!localeChecked) {
      dispatch(loadTaxLocale());
    }
  }, [localeChecked, dispatch]);

  // Show locale dialog if not set after checking
  useEffect(() => {
    if (localeChecked && !locale) {
      setLocaleDialogMode('setup');
      setShowLocaleDialog(true);
    }
  }, [localeChecked, locale]);

  // Fetch summary when locale is available and year changes
  useEffect(() => {
    if (locale) {
      dispatch(fetchAnnualSummary(selectedYear));
    }
  }, [selectedYear, locale, dispatch]);

  // Fetch untagged transactions for the year
  const loadUntagged = useCallback(async () => {
    if (!locale) return;
    setUntaggedLoading(true);
    try {
      const from = `${selectedYear}-01-01`;
      const to = `${selectedYear}-12-31`;
      const res = await apiClient.get<{ transactions: Transaction[]; total: number }>('/transactions', {
        params: { from, to, type: 'debit', limit: 200 },
      });
      // Filter client-side: only those without a tax tag
      setUntagged((res.data.transactions ?? []).filter((t) => !t.tax_category));
    } catch {
      // silent
    } finally {
      setUntaggedLoading(false);
    }
  }, [locale, selectedYear]);

  useEffect(() => {
    loadUntagged();
  }, [loadUntagged]);

  const handleTag = useCallback(
    async (transactionId: string, value: TaxCategoryValue | null) => {
      await dispatch(tagTransaction({ transactionId, value }));
      // Refresh untagged list after tagging
      loadUntagged();
    },
    [dispatch, loadUntagged]
  );

  const yearOptions = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];

  const locationLabel = locale
    ? [getCountryLabel(locale.country), locale.state].filter(Boolean).join(' · ')
    : '';

  // Setup mode — show only the locale dialog with a loading backdrop
  if (localeChecked && !locale) {
    return (
      <LocaleSetupDialog
        open={true}
        mode="setup"
        onClose={() => setShowLocaleDialog(false)}
      />
    );
  }

  // Still loading locale from server/storage
  if (!localeChecked) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Locale edit dialog */}
      <LocaleSetupDialog
        open={showLocaleDialog && localeDialogMode === 'edit'}
        mode="edit"
        onClose={() => setShowLocaleDialog(false)}
      />

      {/* Page controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Year selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {/* Location chip */}
          {locale && (
            <button
              onClick={() => {
                setLocaleDialogMode('edit');
                setShowLocaleDialog(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              title="Change location"
            >
              <MapPin className="h-3.5 w-3.5 text-blue-500" />
              {locationLabel}
              <Edit2 className="h-3 w-3 text-gray-400 ml-0.5" />
            </button>
          )}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Tagged transactions summary */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
          Tagged Deductions — {selectedYear}
        </h2>
        {summaryLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : summary ? (
          <AnnualSummaryTable data={summary} tagging={tagging} onTag={handleTag} />
        ) : null}
      </div>

      {/* Untagged transactions */}
      {untagged.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            Untagged Expenses — {selectedYear}
            <span className="ml-2 text-xs font-normal normal-case text-gray-400">
              Tag any transaction to include it in your deductions
            </span>
          </h2>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {untaggedLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
              </div>
            ) : (
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
                  {untagged.map((tx) => (
                    <tr
                      key={tx.id}
                      className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                    >
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
                          onTag={handleTag}
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
            )}
          </div>
        </div>
      )}

      {/* PDF export */}
      <TaxReportGenerator />
    </div>
  );
}
