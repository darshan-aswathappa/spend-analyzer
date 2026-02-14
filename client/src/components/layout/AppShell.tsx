import { useEffect, useState } from 'react';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

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
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
