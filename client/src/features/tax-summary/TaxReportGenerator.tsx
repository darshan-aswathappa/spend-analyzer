import { useState, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Download, FileText, Loader2 } from 'lucide-react';
import type { AppDispatch, RootState } from '@/app/store';
import { fetchAnnualSummary } from './taxSummarySlice';
import { TaxReport } from './TaxReport';
import type { TaxSummaryData } from '@/types';

export function TaxReportGenerator() {
  const dispatch = useDispatch<AppDispatch>();
  const locale = useSelector((state: RootState) => state.taxSummary.locale);

  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [reportData, setReportData] = useState<TaxSummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const yearOptions = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];

  const generatePDF = useCallback(async () => {
    if (!locale) return;
    setLoading(true);
    setError(null);

    try {
      const result = await dispatch(fetchAnnualSummary(year)).unwrap();

      if (result.transactionCount === 0) {
        setError('No tagged transactions found for this year.');
        setLoading(false);
        return;
      }

      setReportData(result);

      // Wait for off-screen component to render
      await new Promise((resolve) => setTimeout(resolve, 200));

      if (!reportRef.current) {
        setError('Failed to render report.');
        setLoading(false);
        return;
      }

      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfPageHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      // Multi-page support
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfPageHeight;

      while (heightLeft > 0) {
        position -= pdfPageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfPageHeight;
      }

      pdf.save(`tax-summary-${year}.pdf`);
      setReportData(null);
    } catch {
      setError('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [year, locale, dispatch]);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
        Download Tax Report
      </h3>

      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label htmlFor="tax-report-year" className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5">
            Tax Year
          </label>
          <select
            id="tax-report-year"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={generatePDF}
          disabled={loading || !locale}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {loading ? 'Generating…' : 'Download PDF'}
        </button>
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400 flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5" />
          {error}
        </p>
      )}

      {/* Off-screen report for PDF capture */}
      {reportData && locale && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <TaxReport ref={reportRef} data={reportData} locale={locale} year={year} />
        </div>
      )}
    </div>
  );
}
