import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import apiClient from '@/lib/apiClient';
import type { AppDispatch, RootState } from '@/app/store';
import { setTransactions, setLoading, setFilter, setPage, clearFilters } from './transactionsSlice';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TransactionTable } from './TransactionTable';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 50;
const CATEGORIES = [
  'Food & Dining', 'Shopping', 'Transport', 'Entertainment',
  'Health', 'Utilities', 'Rent & Housing', 'Travel', 'Income', 'Transfers', 'Other',
];

export function TransactionsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { items, total, loading, filters, page } = useSelector((state: RootState) => state.transactions);
  const activeStatementId = useSelector((state: RootState) => state.statements.activeStatementId);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      dispatch(setLoading(true));
      try {
        const params = new URLSearchParams({
          limit: String(PAGE_SIZE),
          offset: String(page * PAGE_SIZE),
        });
        if (activeStatementId) params.set('statement_id', activeStatementId);
        if (filters.category) params.set('category', filters.category);
        if (filters.type) params.set('type', filters.type);
        if (filters.from) params.set('from', filters.from);
        if (filters.to) params.set('to', filters.to);

        const res = await apiClient.get(`/transactions?${params}`);
        dispatch(setTransactions(res.data));
      } catch {
        dispatch(setLoading(false));
      }
    }
    load();
  }, [dispatch, filters, activeStatementId, page]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const hasFilters = filters.category || filters.type || filters.from || filters.to;

  const filtered = search
    ? items.filter((t) => t.description.toLowerCase().includes(search.toLowerCase()))
    : items;

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="p-3 sm:p-4 flex flex-wrap items-center gap-2 sm:gap-3">
          <Input
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-sm w-full sm:w-52"
          />

          <Select
            value={filters.category || 'all'}
            onValueChange={(v) => dispatch(setFilter({ category: v === 'all' ? '' : v }))}
          >
            <SelectTrigger className="h-8 text-sm w-[calc(50%-4px)] sm:w-44">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.type || 'all'}
            onValueChange={(v) => dispatch(setFilter({ type: v === 'all' ? '' : v }))}
          >
            <SelectTrigger className="h-8 text-sm w-[calc(50%-4px)] sm:w-36">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="debit">Expenses</SelectItem>
              <SelectItem value="credit">Income</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={filters.from}
            onChange={(e) => dispatch(setFilter({ from: e.target.value }))}
            className="h-8 text-sm w-[calc(50%-12px)] sm:w-36"
          />
          <span className="text-xs text-gray-400 dark:text-gray-500">to</span>
          <Input
            type="date"
            value={filters.to}
            onChange={(e) => dispatch(setFilter({ to: e.target.value }))}
            className="h-8 text-sm w-[calc(50%-12px)] sm:w-36"
          />

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-gray-500 dark:text-gray-400"
              onClick={() => dispatch(clearFilters())}
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}

          <span className="w-full sm:w-auto sm:ml-auto text-xs text-gray-400 dark:text-gray-500 text-center sm:text-right">
            {filtered.length} of {total} transactions
          </span>
        </CardContent>
      </Card>

      <TransactionTable transactions={filtered} loading={loading} />

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            disabled={page === 0}
            onClick={() => dispatch(setPage(page - 1))}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            disabled={page >= totalPages - 1}
            onClick={() => dispatch(setPage(page + 1))}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
