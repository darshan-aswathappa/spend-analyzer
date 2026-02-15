import { useState, useRef, useEffect } from 'react';
import { Loader2, Tag, X } from 'lucide-react';
import type { TaxCategoryValue } from '@/types';
import { TAX_CATEGORIES } from './constants';

interface Props {
  transactionId: string;
  currentValue: TaxCategoryValue | null;
  onTag: (transactionId: string, value: TaxCategoryValue | null) => void;
  loading?: boolean;
}

export function TaxCategoryTag({ transactionId, currentValue, onTag, loading }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const current = TAX_CATEGORIES.find((c) => c.value === currentValue);

  if (loading) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-400">
        <Loader2 className="h-3 w-3 animate-spin" />
        Saving…
      </span>
    );
  }

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        className="focus:outline-none"
      >
        {current ? (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity"
            style={{
              backgroundColor: current.bg,
              color: current.color,
              border: `1px solid ${current.borderColor}`,
            }}
          >
            {current.label}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-gray-400 dark:text-gray-500 border border-dashed border-gray-300 dark:border-gray-600 cursor-pointer hover:border-blue-400 hover:text-blue-500 transition-colors">
            <Tag className="h-3 w-3" />
            Tag
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-44 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1">
          {TAX_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => {
                onTag(transactionId, cat.value);
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <span
                className="inline-block w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              {cat.label}
              {currentValue === cat.value && (
                <span className="ml-auto text-blue-600 text-xs">✓</span>
              )}
            </button>
          ))}
          {currentValue && (
            <>
              <div className="border-t border-gray-100 dark:border-gray-800 my-1" />
              <button
                onClick={() => {
                  onTag(transactionId, null);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                Remove tag
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
