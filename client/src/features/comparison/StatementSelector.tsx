import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn, formatDate } from '@/lib/utils';
import type { BankStatement } from '@/types';

function formatStatementLabel(stmt: BankStatement): string {
  const bank = stmt.bank_name ?? 'Unknown Bank';
  if (stmt.statement_period_start && stmt.statement_period_end) {
    return `${bank} · ${formatDate(stmt.statement_period_start)} – ${formatDate(stmt.statement_period_end)}`;
  }
  return `${bank} · ${formatDate(stmt.uploaded_at)}`;
}

interface Props {
  label: string;
  labelColor: string;
  value: string | null;
  onChange: (id: string) => void;
  statements: BankStatement[];
  disabledId: string | null;
  loading: boolean;
}

export function StatementSelector({
  label,
  labelColor,
  value,
  onChange,
  statements,
  disabledId,
  loading,
}: Props) {
  const selectedStmt = statements.find((s) => s.id === value);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className={cn('text-xs font-semibold uppercase tracking-wide', labelColor)}>
          {label}
        </span>
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />}
      </div>

      <Select value={value ?? ''} onValueChange={onChange} disabled={loading}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a statement..." />
        </SelectTrigger>
        <SelectContent>
          {statements.length === 0 ? (
            <SelectItem value="__empty__" disabled>
              No completed statements available
            </SelectItem>
          ) : (
            <SelectGroup>
              <SelectLabel>Statements</SelectLabel>
              {statements.map((stmt) => (
                <SelectItem key={stmt.id} value={stmt.id} disabled={stmt.id === disabledId}>
                  {formatStatementLabel(stmt)}
                </SelectItem>
              ))}
            </SelectGroup>
          )}
        </SelectContent>
      </Select>

      {selectedStmt && (
        <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500 truncate">
          {selectedStmt.filename}
        </p>
      )}
    </div>
  );
}
