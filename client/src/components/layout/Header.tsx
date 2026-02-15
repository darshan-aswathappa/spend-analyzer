import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSelector, useDispatch } from 'react-redux';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Menu, Bell } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { RootState, AppDispatch } from '@/app/store';
import { setPanelOpen } from '@/features/notifications/notificationsSlice';
import { NotificationsPanel } from '@/features/notifications/NotificationsPanel';

interface HeaderProps {
  title: string;
  onMenuClick?: () => void;
}

export function Header({ title, onMenuClick }: HeaderProps) {
  const { user } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const { unreadCount, panelOpen } = useSelector((state: RootState) => state.notifications);

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'U';

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;

  return (
    <header className="h-14 md:h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 md:px-6 shrink-0">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="md:hidden p-1.5 -ml-1 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden sm:inline text-sm text-gray-500 dark:text-gray-400">{user?.email}</span>
        <ThemeToggle />

        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => dispatch(setPanelOpen(!panelOpen))}
            className="relative p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-[1.1rem] flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full px-0.5">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          <NotificationsPanel />
        </div>

        <Link to="/settings/profile" title="Profile settings">
          <Avatar className="h-8 w-8 cursor-pointer ring-offset-white transition-all hover:ring-2 hover:ring-blue-500 hover:ring-offset-2 dark:ring-offset-gray-900 rounded-full">
            {avatarUrl && <AvatarImage src={avatarUrl} alt="avatar" />}
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  );
}
