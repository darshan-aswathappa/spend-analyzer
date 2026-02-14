import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import apiClient from '@/lib/apiClient';
import type { AppDispatch } from '@/app/store';
import { setStatements } from '@/features/statements/statementsSlice';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/transactions': 'Transactions',
  '/statements': 'Statements',
  '/chat': 'Ask AI',
};

export function AppShell() {
  const { pathname } = useLocation();
  const title = PAGE_TITLES[pathname] || 'SpendAnalyzer';
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    async function loadStatements() {
      try {
        const res = await apiClient.get('/statements');
        dispatch(setStatements(res.data));
      } catch {
        // silent
      }
    }
    loadStatements();
  }, [dispatch]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
