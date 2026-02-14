import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import apiClient from '@/lib/apiClient';
import type { AppDispatch, RootState } from '@/app/store';
import { setTransactions, setSummary, setLoading } from '@/features/transactions/transactionsSlice';
import { BalanceSummary } from './BalanceSummary';
import { RecentTransactions } from './RecentTransactions';
import { Button } from '@/components/ui/button';
import { Upload, ArrowRight } from 'lucide-react';

export function DashboardPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { items, summary, loading } = useSelector((state: RootState) => state.transactions);

  useEffect(() => {
    async function load() {
      dispatch(setLoading(true));
      try {
        const [txRes, sumRes] = await Promise.all([
          apiClient.get('/transactions?limit=5'),
          apiClient.get('/transactions/summary'),
        ]);
        dispatch(setTransactions(txRes.data));
        dispatch(setSummary(sumRes.data));
      } catch {
        dispatch(setLoading(false));
      }
    }
    load();
  }, [dispatch]);

  const hasData = items.length > 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {hasData || loading ? (
        <>
          <BalanceSummary summary={summary} loading={loading} />
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">Recent transactions</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/transactions" className="flex items-center gap-1 text-blue-600 text-xs">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>
            <RecentTransactions transactions={items} loading={loading} />
          </div>
        </>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
        <Upload className="h-5 w-5 text-blue-600" />
      </div>
      <h2 className="text-base font-semibold text-gray-900 mb-1">No data yet</h2>
      <p className="text-sm text-gray-500 mb-5 max-w-xs">
        Upload a bank statement to see your balance and spending breakdown.
      </p>
      <Button asChild>
        <Link to="/statements">Upload statement</Link>
      </Button>
    </div>
  );
}
