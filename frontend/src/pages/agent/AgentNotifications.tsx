import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import { notificationsApi, NotificationResponse } from '../../lib/notificationsApi'
import { extractApiError } from '../../utils/format'

export default function AgentNotifications() {
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
      setNotifications(data.notifications)
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
      setUnreadCount(data.unread_count)
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
    
    if (data.conversation_id) {
      navigate(`/agent/conversations/${data.conversation_id}`)
    } else if (data.appointment_id) {
      navigate('/agent/appointments')
    } else if (data.property_id) {
      navigate(`/agent/properties/${data.property_id}/edit`)
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Notifications</h1>
          <button
            onClick={handleMarkAllAsRead}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Mark All as Read
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded" role="alert" aria-live="polite">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-4">
              <div>
                <label htmlFor="read-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="read-filter"
                  value={isReadFilter === undefined ? 'all' : isReadFilter ? 'read' : 'unread'}
                  onChange={(e) => handleFilterChange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All</option>
                  <option value="unread">Unread</option>
                  <option value="read">Read</option>
                </select>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              {unreadCount} unread
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12" aria-live="polite" aria-busy="true">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" aria-hidden="true"></div>
              <span className="sr-only">Loading notifications...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No notifications found
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow ${
                      notification.is_read ? 'bg-gray-50 border-gray-200' : 'bg-white border-blue-200'
                    }`}
                    role="button"
                    tabIndex={0}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleNotificationClick(notification)
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{notification.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                        <div className="mt-2">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              notification.is_read ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {notification.is_read ? 'Read' : 'Unread'}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        {!notification.is_read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleMarkAsRead(notification.id)
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                          >
                            Mark Read
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(notification.id)
                          }}
                          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={handlePreviousPage}
                  disabled={skip === 0}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Showing {skip + 1}-{Math.min(skip + limit, notifications.length + skip)}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={notifications.length < limit}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
