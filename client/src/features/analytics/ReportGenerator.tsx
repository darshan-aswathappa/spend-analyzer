import { useState, useRef, useCallback } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import type { MonthlyReportData } from '@/types';
import { MonthlyReport } from './MonthlyReport';

export function ReportGenerator() {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [reportData, setReportData] = useState<MonthlyReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const generatePDF = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch report data
      const { data } = await apiClient.get<MonthlyReportData>('/reports/monthly', {
        params: { month },
      });

      if (data.transactionCount === 0) {
        setError('No transactions found for this month.');
        setLoading(false);
        return;
      }

      setReportData(data);

      // Wait for render
      await new Promise((resolve) => setTimeout(resolve, 200));

      if (!reportRef.current) {
        setError('Failed to render report.');
        setLoading(false);
        return;
      }

      // Dynamic imports for PDF generation
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
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`spending-report-${month}.pdf`);

      setReportData(null);
    } catch (err) {
      setError('Failed to generate report. Please try again.');
      console.error('PDF generation error:', err);
    } finally {
      setLoading(false);
    }
  }, [month]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
        Download Report
      </h3>

      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label htmlFor="report-month" className="block text-sm text-gray-600 mb-1.5">
            Select Month
          </label>
          <input
            id="report-month"
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={generatePDF}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {loading ? 'Generating...' : 'Download PDF'}
        </button>
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600 flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5" />
          {error}
        </p>
      )}

      {/* Off-screen report for PDF capture */}
      {reportData && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <MonthlyReport ref={reportRef} data={reportData} />
        </div>
      )}
    </div>
  );
}
