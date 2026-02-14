import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/app/store';
import apiClient from '@/lib/apiClient';
import {
  setTrends,
  setProjections,
  setLoading,
  setProjectionsLoading,
  setError,
} from './analyticsSlice';
import { MonthlySpendingChart } from './MonthlySpendingChart';
import { CategoryPieChart } from './CategoryPieChart';
import { IncomeVsExpensesChart } from './IncomeVsExpensesChart';
import { ProjectionCard } from './ProjectionCard';
import { ReportGenerator } from './ReportGenerator';
import type { TrendsData, ProjectionsData } from '@/types';

export function AnalyticsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { trends, projections, loading, projectionsLoading, error } = useSelector(
    (state: RootState) => state.analytics
  );

  useEffect(() => {
    async function fetchTrends() {
      dispatch(setLoading(true));
      dispatch(setError(null));
      try {
        const { data } = await apiClient.get<TrendsData>('/transactions/trends', {
          params: { months: 12 },
        });
        dispatch(setTrends(data));
      } catch (err) {
        dispatch(setError('Failed to load analytics data'));
        console.error('Trends fetch error:', err);
      } finally {
        dispatch(setLoading(false));
      }
    }

    async function fetchProjections() {
      dispatch(setProjectionsLoading(true));
      try {
        const { data } = await apiClient.get<ProjectionsData>('/transactions/projections');
        dispatch(setProjections(data));
      } catch (err) {
        console.error('Projections fetch error:', err);
      } finally {
        dispatch(setProjectionsLoading(false));
      }
    }

    if (!trends) {
      fetchTrends();
    }
    if (!projections) {
      fetchProjections();
    }
  }, [dispatch, trends, projections]);

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Analytics</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 h-[340px] animate-pulse">
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
              <div className="h-[280px] bg-gray-100 dark:bg-gray-800 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Analytics</h1>
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Analytics</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Charts */}
        <MonthlySpendingChart data={trends?.monthly || []} />
        <CategoryPieChart data={trends?.byCategory || []} />
        <IncomeVsExpensesChart data={trends?.monthly || []} />

        {/* Projections */}
        <ProjectionCard data={projections} loading={projectionsLoading} />

        {/* Report Download */}
        <ReportGenerator />
      </div>
    </div>
  );
}
