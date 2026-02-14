import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import apiClient from '@/lib/apiClient';
import type { AppDispatch, RootState } from '@/app/store';
import { setTransactions, setLoading, setFilter, clearFilters } from './transactionsSlice';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TransactionTable } from './TransactionTable';
import { X } from 'lucide-react';

const CATEGORIES = [
  'Food & Dining', 'Shopping', 'Transport', 'Entertainment',
  'Health', 'Utilities', 'Rent & Housing', 'Travel', 'Income', 'Transfers', 'Other',
];

export function TransactionsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { items, total, loading, filters } = useSelector((state: RootState) => state.transactions);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      dispatch(setLoading(true));
      try {
        const params = new URLSearchParams({ limit: '50' });
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
  }, [dispatch, filters]);

  const hasFilters = filters.category || filters.type || filters.from || filters.to;

  const filtered = search
    ? items.filter((t) => t.description.toLowerCase().includes(search.toLowerCase()))
    : items;

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <Input
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-sm w-52"
          />

          <Select
            value={filters.category || 'all'}
            onValueChange={(v) => dispatch(setFilter({ category: v === 'all' ? '' : v }))}
          >
            <SelectTrigger className="h-8 text-sm w-44">
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
            <SelectTrigger className="h-8 text-sm w-36">
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
            className="h-8 text-sm w-36"
          />
          <span className="text-xs text-gray-400">to</span>
          <Input
            type="date"
            value={filters.to}
            onChange={(e) => dispatch(setFilter({ to: e.target.value }))}
            className="h-8 text-sm w-36"
          />

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-gray-500"
              onClick={() => dispatch(clearFilters())}
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}

          <span className="ml-auto text-xs text-gray-400">
            {filtered.length} of {total} transactions
          </span>
        </CardContent>
      </Card>

      <TransactionTable transactions={filtered} loading={loading} />
    </div>
  );
}
