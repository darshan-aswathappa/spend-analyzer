import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FileCheck, ShieldCheck, AlertCircle, Bell } from 'lucide-react';
import type { RootState, AppDispatch } from '@/app/store';
import { markAllRead, setPanelOpen } from './notificationsSlice';
import type { NotificationItem } from './notificationsSlice';

function getNotificationMeta(type: NotificationItem['type']) {
  switch (type) {
    case 'statement_processed':
      return {
        Icon: FileCheck,
        color: 'text-green-500',
        bg: 'bg-green-100 dark:bg-green-900/30',
        title: 'Statement Processed',
      };
    case 'risk_score_updated':
      return {
        Icon: ShieldCheck,
        color: 'text-blue-500',
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        title: 'Risk Score Updated',
      };
    case 'statement_failed':
      return {
        Icon: AlertCircle,
        color: 'text-red-500',
        bg: 'bg-red-100 dark:bg-red-900/30',
        title: 'Statement Failed',
      };
  }
}

function getNotificationDescription(item: NotificationItem): string {
  const p = item.payload;
  switch (item.type) {
    case 'statement_processed':
      return `${p.transactionCount ?? ''} transactions extracted from ${p.filename ?? 'your statement'}.`;
    case 'risk_score_updated':
      return `Score recalculated: ${p.overall_score ?? '--'}/100 (${p.rating ?? ''}).`;
    case 'statement_failed':
      return String(p.error ?? 'An unknown error occurred.');
  }
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function NotificationsPanel() {
  const dispatch = useDispatch<AppDispatch>();
  const { items, unreadCount, panelOpen } = useSelector((state: RootState) => state.notifications);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!panelOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        dispatch(setPanelOpen(false));
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [panelOpen, dispatch]);

  if (!panelOpen) return null;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notifications</span>
          {unreadCount > 0 && (
            <span className="text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-1.5 py-0.5 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => dispatch(markAllRead())}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Notification list */}
      <div className="max-h-96 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-400 dark:text-gray-600">
            <Bell className="h-8 w-8" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          <ul>
            {items.map((item) => {
              const meta = getNotificationMeta(item.type);
              return (
                <li
                  key={item.id}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0 ${
                    !item.read ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                  }`}
                >
                  <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${meta.bg}`}>
                    <meta.Icon className={`h-4 w-4 ${meta.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{meta.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                      {getNotificationDescription(item)}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-600 shrink-0 mt-0.5">
                    {formatRelativeTime(item.created_at)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
