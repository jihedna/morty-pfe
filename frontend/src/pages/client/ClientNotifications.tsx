import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import { notificationsApi, NotificationResponse } from '../../lib/notificationsApi'
import { extractApiError } from '../../utils/format'
import { PageHeader, LoadingState, EmptyState, ErrorState } from '../../components/ui/shared'
import Button from '../../components/ui/Button'

export default function ClientNotifications() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<NotificationResponse[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isReadFilter, setIsReadFilter] = useState<boolean | undefined>(undefined)
  const [skip, setSkip] = useState(0)
  const [limit] = useState(20)

  const loadNotifications = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await notificationsApi.getMyNotifications({ skip, limit, is_read: isReadFilter })
      setNotifications(data?.notifications ?? [])
    } catch (err) {
      const errorMessage = extractApiError(err)
      setError(errorMessage || 'Failed to load notifications')
    } finally {
      setIsLoading(false)
    }
  }, [isReadFilter, skip, limit])

  const loadUnreadCount = useCallback(async () => {
    try {
      const data = await notificationsApi.getUnreadCount()
      setUnreadCount(data?.unread_count ?? 0)
    } catch (err) {
      console.error('Failed to load unread count:', err)
    }
  }, [])

  useEffect(() => {
    loadNotifications()
    loadUnreadCount()
  }, [loadNotifications, loadUnreadCount])

  const handleFilterChange = (value: string) => {
    if (value === 'all') {
      setIsReadFilter(undefined)
    } else if (value === 'unread') {
      setIsReadFilter(false)
    } else {
      setIsReadFilter(true)
    }
    setSkip(0)
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationsApi.markNotificationAsRead(notificationId)
      await loadNotifications()
      await loadUnreadCount()
    } catch (err) {
      const errorMessage = extractApiError(err)
      setError(errorMessage || 'Failed to mark notification as read')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead()
      await loadNotifications()
      await loadUnreadCount()
    } catch (err) {
      const errorMessage = extractApiError(err)
      setError(errorMessage || 'Failed to mark all notifications as read')
    }
  }

  const handleDelete = async (notificationId: string) => {
    try {
      await notificationsApi.deleteNotification(notificationId)
      await loadNotifications()
      await loadUnreadCount()
    } catch (err) {
      const errorMessage = extractApiError(err)
      setError(errorMessage || 'Failed to delete notification')
    }
  }

  const handlePreviousPage = () => {
    if (skip > 0) {
      setSkip(skip - limit)
    }
  }

  const handleNextPage = () => {
    setSkip(skip + limit)
  }

  const handleNotificationClick = async (notification: NotificationResponse) => {
    // Mark as read if unread
    if (!notification.is_read) {
      try {
        await notificationsApi.markNotificationAsRead(notification.id)
        await loadNotifications()
        await loadUnreadCount()
      } catch (err) {
        console.error('Failed to mark notification as read:', err)
      }
    }

    // Navigate based on notification data
    const data = notification.data || {}
    
    if (data.contract_id) {
      navigate('/client/deals')
    } else if (data.conversation_id) {
      navigate(`/client/conversations/${data.conversation_id}`)
    } else if (data.appointment_id) {
      navigate('/client/appointments')
    } else if (data.property_id) {
      navigate(`/properties/${data.property_id}`)
    } else if (data.match_id) {
      navigate('/client/matches')
    }
  }

  const filterValue = isReadFilter === undefined ? 'all' : isReadFilter ? 'read' : 'unread'

  const getIcon = (type: string) => {
    if (type.includes('message') || type.includes('conversation'))
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      )
    if (type.includes('appointment'))
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    if (type.includes('property') || type.includes('match'))
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    )
  }

  const getIconBg = (type: string, isRead: boolean) => {
    if (isRead) return 'bg-gray-100 text-gray-400'
    if (type.includes('message') || type.includes('conversation')) return 'bg-blue-100 text-blue-600'
    if (type.includes('appointment')) return 'bg-purple-100 text-purple-600'
    if (type.includes('property') || type.includes('match')) return 'bg-emerald-100 text-emerald-600'
    return 'bg-amber-100 text-amber-600'
  }

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 7) return `${days}d ago`
    return new Date(dateStr).toLocaleDateString()
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl mx-auto">

        <PageHeader
          title="Notifications"
          subtitle={unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
          action={
            unreadCount > 0 ? (
              <Button type="button" variant="outline" onClick={handleMarkAllAsRead} size="sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Mark all read
              </Button>
            ) : undefined
          }
        />

        {error && <ErrorState message={error} onRetry={loadNotifications} />}

        {/* Filter pills */}
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-card" role="group" aria-label="Filter notifications">
          {(['all', 'unread', 'read'] as const).map(f => (
            <Button
              key={f}
              type="button"
              variant={filterValue === f ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange(f)}
              aria-pressed={filterValue === f}
            >
              {f}
            </Button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <LoadingState />
        ) : notifications.length === 0 ? (
          <EmptyState title="No notifications" description="You're all caught up!" />
        ) : (
          <>
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleNotificationClick(notification) } }}
                  className={`group relative flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                    notification.is_read
                      ? 'bg-white border-slate-200 shadow-card'
                      : 'bg-primary-50/50 border-primary-100 shadow-card'
                  }`}
                >
                  {/* Unread dot */}
                  {!notification.is_read && (
                    <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-500" />
                  )}

                  {/* Icon */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${getIconBg(notification.notification_type, notification.is_read)}`}>
                    {getIcon(notification.notification_type)}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0 pr-16">
                    <p className={`text-sm font-semibold leading-snug ${notification.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                      {notification.title}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{notification.message}</p>
                    <p className="text-xs text-gray-400 mt-1.5">{timeAgo(notification.created_at)}</p>
                  </div>

                  {/* Actions — visible on hover/focus */}
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    {!notification.is_read && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        ariaLabel="Mark as read"
                        onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notification.id) }}
                        className="!p-1.5 text-primary-600 hover:bg-primary-50"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      ariaLabel="Delete"
                      onClick={(e) => { e.stopPropagation(); handleDelete(notification.id) }}
                      className="!p-1.5 text-accent-600 hover:bg-accent-50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <nav aria-label="Notifications pagination" className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={skip === 0}
              >
                Previous
              </Button>
              <span className="text-xs text-gray-500">
                {skip + 1}–{Math.min(skip + limit, notifications.length + skip)} of {notifications.length + skip}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={notifications.length < limit}
              >
                Next
              </Button>
            </nav>
          </>
        )}
      </div>
    </AppLayout>
  )
}
