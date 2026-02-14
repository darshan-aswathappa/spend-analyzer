import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, FileText, MessageSquare, TrendingUp, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/statements', icon: FileText, label: 'Statements' },
  { to: '/analytics', icon: TrendingUp, label: 'Analytics' },
  { to: '/chat', icon: MessageSquare, label: 'Ask AI' },
];

export function Sidebar() {
  async function handleLogout() {
    await supabase.auth.signOut();
  }

  return (
    <aside className="w-56 flex flex-col h-screen bg-white border-r border-gray-200 shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-gray-100">
        <div className="flex items-center justify-center w-7 h-7 bg-blue-600 rounded-lg">
          <span className="text-white font-bold text-xs">SA</span>
        </div>
        <span className="font-semibold text-gray-900 text-sm">SpendAnalyzer</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )
            }
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
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-900 w-full transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
