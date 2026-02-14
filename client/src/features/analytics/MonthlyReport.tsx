import { forwardRef } from 'react';
import { formatCurrency } from '@/lib/utils';
import type { MonthlyReportData } from '@/types';

interface Props {
  data: MonthlyReportData;
}

function formatReportMonth(month: string) {
  const [year, mon] = month.split('-');
  const date = new Date(Number(year), Number(mon) - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export const MonthlyReport = forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
  return (
    <div
      ref={ref}
      style={{
        width: '800px',
        padding: '40px',
        backgroundColor: '#ffffff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#1e293b',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '32px', borderBottom: '2px solid #3b82f6', paddingBottom: '16px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: '#1e40af' }}>
          SpendAnalyzer
        </h1>
        <h2 style={{ fontSize: '18px', fontWeight: 500, margin: '8px 0 0', color: '#475569' }}>
          Monthly Report — {formatReportMonth(data.month)}
        </h2>
      </div>

      {/* Summary */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
        <div style={{ flex: 1, backgroundColor: '#f0fdf4', borderRadius: '8px', padding: '16px' }}>
          <p style={{ fontSize: '12px', color: '#16a34a', margin: '0 0 4px', fontWeight: 600 }}>Total Income</p>
          <p style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: '#15803d' }}>
            {formatCurrency(data.summary.totalCredits)}
          </p>
        </div>
        <div style={{ flex: 1, backgroundColor: '#fef2f2', borderRadius: '8px', padding: '16px' }}>
          <p style={{ fontSize: '12px', color: '#dc2626', margin: '0 0 4px', fontWeight: 600 }}>Total Expenses</p>
          <p style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: '#b91c1c' }}>
            {formatCurrency(data.summary.totalDebits)}
          </p>
        </div>
        <div style={{ flex: 1, backgroundColor: '#eff6ff', borderRadius: '8px', padding: '16px' }}>
          <p style={{ fontSize: '12px', color: '#2563eb', margin: '0 0 4px', fontWeight: 600 }}>Net Balance</p>
          <p style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: data.summary.balance >= 0 ? '#15803d' : '#b91c1c' }}>
            {formatCurrency(data.summary.balance)}
          </p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
          Spending by Category
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc' }}>
              <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600 }}>Category</th>
              <th style={{ textAlign: 'right', padding: '8px 12px', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600 }}>Amount</th>
              <th style={{ textAlign: 'right', padding: '8px 12px', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600 }}>%</th>
              <th style={{ textAlign: 'right', padding: '8px 12px', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600 }}>Txns</th>
            </tr>
          </thead>
          <tbody>
            {data.byCategory.map((cat) => (
              <tr key={cat.category}>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9' }}>{cat.category}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontWeight: 500 }}>{formatCurrency(cat.amount)}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', color: '#64748b' }}>{cat.percentage}%</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', color: '#64748b' }}>{cat.transactionCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Top Transactions */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
          Top Transactions
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc' }}>
              <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600 }}>Date</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600 }}>Description</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600 }}>Category</th>
              <th style={{ textAlign: 'right', padding: '8px 12px', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600 }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.topTransactions.map((t, i) => (
              <tr key={i}>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>
                  {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.description}
                </td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>{t.category}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontWeight: 500, color: t.type === 'credit' ? '#16a34a' : '#dc2626' }}>
                  {t.type === 'credit' ? '+' : '-'}{formatCurrency(t.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>
        Generated by SpendAnalyzer — {data.transactionCount} transactions analyzed
      </div>
    </div>
  );
});

MonthlyReport.displayName = 'MonthlyReport';
