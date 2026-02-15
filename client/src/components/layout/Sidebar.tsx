import { useState } from 'react';
import { NavLink, useMatch } from 'react-router-dom';
import {
  LayoutDashboard, ArrowLeftRight, FileText, MessageSquare, TrendingUp,
  ShieldCheck, Landmark, LogOut, X, Settings, Receipt, GitCompare,
  ChevronDown, Brain, Flame, Store, CreditCard, Zap,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';

const topNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/statements', icon: FileText, label: 'Statements' },
  { to: '/analytics', icon: TrendingUp, label: 'Analytics' },
  { to: '/comparison', icon: GitCompare, label: 'Compare' },
  { to: '/tax-summary', icon: Receipt, label: 'Tax Summary' },
];

const riskSubItems = [
  { to: '/risk-assessment',           icon: ShieldCheck, label: 'Risk Score' },
  { to: '/risk-assessment/impulse',   icon: Brain,       label: 'Impulse Spending' },
  { to: '/risk-assessment/heatmap',   icon: Flame,       label: 'Category Heatmap' },
  { to: '/risk-assessment/merchants', icon: Store,       label: 'Merchant Flags' },
  { to: '/risk-assessment/payments',  icon: CreditCard,  label: 'Payment Behavior' },
  { to: '/risk-assessment/velocity',  icon: Zap,         label: 'Velocity Alerts' },
];

const bottomNavItems = [
  { to: '/wealth-management', icon: Landmark, label: 'Wealth Mgmt' },
  { to: '/chat', icon: MessageSquare, label: 'Ask AI' },
  { to: '/settings/profile', icon: Settings, label: 'Settings' },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const riskMatchSub = useMatch('/risk-assessment/*');
  const riskMatchExact = useMatch('/risk-assessment');
  const riskMatch = riskMatchSub || riskMatchExact;
  const [riskOpen, setRiskOpen] = useState(!!riskMatch);

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
      isActive
        ? 'bg-blue-50 text-blue-700 font-medium dark:bg-blue-900/30 dark:text-blue-400'
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'
    );

  const sidebarContent = (
    <aside className="w-56 flex flex-col h-full bg-white dark:bg-gray-900 shrink-0">
      {/* Brand */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-7 h-7 bg-blue-600 rounded-lg">
            <span className="text-white font-bold text-xs">SA</span>
          </div>
          <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">SpendAnalyzer</span>
        </div>
        {/* Close button — mobile only */}
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {/* Top nav items */}
        {topNavItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={navLinkClass}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}

        {/* Risk dropdown */}
        <div>
          <button
            onClick={() => setRiskOpen((v) => !v)}
            className={cn(
              'flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-colors',
              riskMatch
                ? 'bg-blue-50 text-blue-700 font-medium dark:bg-blue-900/30 dark:text-blue-400'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'
            )}
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              Risk
            </div>
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 shrink-0 transition-transform duration-200',
                riskOpen ? 'rotate-180' : ''
              )}
            />
          </button>

          {riskOpen && (
            <div className="mt-0.5 space-y-0.5 pl-2">
              {riskSubItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/risk-assessment'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-colors',
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-medium dark:bg-blue-900/30 dark:text-blue-400'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'
                    )
                  }
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-xs">{label}</span>
                </NavLink>
              ))}
            </div>
          )}
        </div>

        {/* Bottom nav items */}
        {bottomNavItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={navLinkClass}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200 w-full transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar — always visible */}
      <div className="hidden md:flex border-r border-gray-200 dark:border-gray-700">
        {sidebarContent}
      </div>

      {/* Mobile drawer */}
      <div
        className={cn(
          'fixed inset-0 z-40 md:hidden transition-opacity duration-200',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        {/* Drawer */}
        <div
          className={cn(
            'absolute inset-y-0 left-0 transition-transform duration-200 ease-out shadow-xl',
            open ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          {sidebarContent}
        </div>
      </div>
    </>
  );
}
