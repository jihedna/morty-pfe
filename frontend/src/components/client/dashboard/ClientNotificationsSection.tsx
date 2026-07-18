import { Link } from 'react-router-dom'
import { NotificationResponse } from '../../../lib/notificationsApi'
import { EmptyState } from '../../ui/shared'
import { ClientNotificationItem } from './ClientNotificationItem'

interface ClientNotificationsSectionProps {
  notifications: NotificationResponse[]
  onNotificationClick: (notification: NotificationResponse) => void
}

export function ClientNotificationsSection({ notifications, onNotificationClick }: ClientNotificationsSectionProps) {
  return (
    <section className="bg-white/80 backdrop-blur-sm border border-slate-200/80 rounded-xl p-6 shadow-sm" aria-labelledby="notifications-heading">
      <div className="flex items-center justify-between mb-4"><h2 id="notifications-heading" className="text-lg font-semibold text-navy-900">Notifications</h2><Link to="/client/notifications" className="text-sm font-medium text-primary-600 hover:text-primary-700">View All</Link></div>
      {notifications.length === 0 ? <EmptyState title="No notifications" description="You are all caught up." /> : <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">{notifications.map((notification) => <ClientNotificationItem key={notification.id} notification={notification} onClick={onNotificationClick} />)}</div>}
    </section>
  )
}
