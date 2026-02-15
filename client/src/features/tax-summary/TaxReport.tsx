import { forwardRef } from 'react';
import { formatCurrency } from '@/lib/utils';
import type { TaxSummaryData, TaxLocale } from '@/types';
import { TAX_CATEGORIES, TAX_CATEGORY_LABELS, COUNTRIES } from './constants';

interface Props {
  data: TaxSummaryData;
  locale: TaxLocale;
  year: number;
}

function formatReportDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getCountryLabel(code: string) {
  return COUNTRIES.find((c) => c.value === code)?.label ?? code;
}

export const TaxReport = forwardRef<HTMLDivElement, Props>(({ data, locale, year }, ref) => {
  const generatedDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const locationLabel = [getCountryLabel(locale.country), locale.state]
    .filter(Boolean)
    .join(' · ');

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
        <h2 style={{ fontSize: '18px', fontWeight: 500, margin: '8px 0 4px', color: '#475569' }}>
          Tax Summary Report — {year}
        </h2>
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
          {locationLabel} &nbsp;·&nbsp; Generated {generatedDate}
        </p>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        {TAX_CATEGORIES.map((cat) => {
          const group = data.tagged[cat.value];
          return (
            <div
              key={cat.value}
              style={{
                flex: 1,
                backgroundColor: cat.bg,
                border: `1px solid ${cat.borderColor}`,
                borderRadius: '8px',
                padding: '14px',
              }}
            >
              <p style={{ fontSize: '11px', fontWeight: 600, color: cat.color, margin: '0 0 4px' }}>
                {cat.label}
              </p>
              <p style={{ fontSize: '18px', fontWeight: 700, color: cat.color, margin: 0 }}>
                {formatCurrency(group.total)}
              </p>
              <p style={{ fontSize: '11px', color: cat.color, opacity: 0.7, margin: '2px 0 0' }}>
                {group.count} transaction{group.count !== 1 ? 's' : ''}
              </p>
            </div>
          );
        })}
      </div>

      {/* Grand total */}
      <div
        style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '14px',
          marginBottom: '28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <p style={{ fontSize: '13px', fontWeight: 600, color: '#475569', margin: 0 }}>
          Total Potential Deductions
        </p>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b', margin: 0 }}>
            {formatCurrency(data.grandTotal)}
          </p>
          <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0' }}>
            {data.transactionCount} transaction{data.transactionCount !== 1 ? 's' : ''} tagged
          </p>
        </div>
      </div>

      {/* Disclaimer */}
      <div
        style={{
          backgroundColor: '#fefce8',
          border: '1px solid #fde68a',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '28px',
        }}
      >
        <p style={{ fontSize: '11px', color: '#92400e', margin: 0, fontStyle: 'italic' }}>
          ⚠ This report is for informational purposes only and does not constitute tax advice.
          Deductibility depends on your jurisdiction and individual circumstances.
          Please consult a qualified tax professional before filing.
        </p>
      </div>

      {/* Category transaction tables */}
      {TAX_CATEGORIES.map((cat) => {
        const group = data.tagged[cat.value];
        if (group.count === 0) return null;

        return (
          <div key={cat.value} style={{ marginBottom: '28px' }}>
            <h3
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: cat.color,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: cat.color,
                }}
              />
              {TAX_CATEGORY_LABELS[cat.value]}
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
                {group.transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap', color: '#64748b' }}>
                      {formatReportDate(tx.date)}
                    </td>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {tx.description}
                    </td>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>
                      {tx.category}
                    </td>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontWeight: 500 }}>
                      {formatCurrency(tx.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: cat.bg }}>
                  <td colSpan={3} style={{ padding: '8px 12px', fontWeight: 600, color: cat.color }}>
                    Subtotal
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: cat.color }}>
                    {formatCurrency(group.total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        );
      })}

      {/* Footer */}
      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>
        Generated by SpendAnalyzer — {data.transactionCount} transaction{data.transactionCount !== 1 ? 's' : ''} tagged for tax year {year}
      </div>
    </div>
  );
});

TaxReport.displayName = 'TaxReport';
