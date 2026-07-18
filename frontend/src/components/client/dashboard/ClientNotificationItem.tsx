import { NotificationResponse } from '../../../lib/notificationsApi'
import { formatRelativeTime } from '../../../utils/format'

interface ClientNotificationItemProps {
  notification: NotificationResponse
  onClick: (notification: NotificationResponse) => void
}

export function ClientNotificationItem({ notification, onClick }: ClientNotificationItemProps) {
  return (
    <button type="button" onClick={() => onClick(notification)} className={`w-full flex items-start gap-3 pb-4 text-left border-b border-slate-200/70 last:border-0 last:pb-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded ${notification.is_read ? 'opacity-75' : ''}`} aria-label={`${notification.is_read ? 'Read' : 'Unread'} notification: ${notification.title}`}>
      <span className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${notification.is_read ? 'bg-navy-100 text-navy-500' : 'bg-primary-100 text-primary-700'}`} aria-hidden="true">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2"><span className="text-sm font-bold text-navy-900 truncate">{notification.title}</span>{!notification.is_read && <span className="w-2 h-2 rounded-full bg-primary-600 flex-shrink-0" aria-label="Unread" />}</span>
        <span className="block text-sm text-navy-500 line-clamp-2">{notification.message}</span>
        <span className="block text-xs text-navy-400 mt-1">{formatRelativeTime(notification.created_at)}</span>
      </span>
    </button>
  )
}
