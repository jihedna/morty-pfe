import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import Button from '../ui/Button'
import { notificationsApi, NotificationResponse } from '../../lib/notificationsApi'
import BrandLogo from '../branding/BrandLogo'

interface NavItem {
  path: string
  label: string
  icon: React.ReactNode
}

interface AppLayoutProps {
  children: React.ReactNode
}

const icons = {
  dashboard: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  properties: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  search: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  matches: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  leads: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  favorites: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>,
  saved: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>,
  messages: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
  appointments: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  notifications: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
  profile: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  analytics: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  map: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>,
  heatmap: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" /></svg>,
  investment: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
  contracts: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  knowledge: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
  users: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  agents: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const getNavItems = (): NavItem[] => {
    if (!user) return []
    switch (user.role) {
      case 'client':
        return [
          { path: '/client/dashboard', label: 'Dashboard', icon: icons.dashboard },
          { path: '/properties', label: 'Properties', icon: icons.properties },
          { path: '/map', label: 'Map', icon: icons.map },
          { path: '/market-map', label: 'Market Map', icon: icons.heatmap },
          { path: '/client/search-requests', label: 'Search Requests', icon: icons.search },
          { path: '/client/matches', label: 'Matches', icon: icons.matches },
          { path: '/client/favorites', label: 'Favorites', icon: icons.favorites },
          { path: '/client/saved-searches', label: 'Saved Searches', icon: icons.saved },
          { path: '/client/investment-score', label: 'Investment Score', icon: icons.investment },
          { path: '/client/conversations', label: 'Messages', icon: icons.messages },
          { path: '/client/appointments', label: 'Appointments', icon: icons.appointments },
          { path: '/client/deals', label: 'My Deals', icon: icons.contracts },
          { path: '/client/notifications', label: 'Notifications', icon: icons.notifications },
        ]
      case 'agent':
        return [
          { path: '/agent/dashboard', label: 'Dashboard', icon: icons.dashboard },
          { path: '/agent/profile', label: 'My Profile', icon: icons.profile },
          { path: '/agent/properties', label: 'Properties', icon: icons.properties },
          { path: '/agent/leads', label: 'Leads', icon: icons.leads },
          { path: '/agent/conversations', label: 'Messages', icon: icons.messages },
          { path: '/agent/appointments', label: 'Appointments', icon: icons.appointments },
          { path: '/agent/notifications', label: 'Notifications', icon: icons.notifications },
        ]
      case 'manager':
        return [
          { path: '/admin/dashboard', label: 'Dashboard', icon: icons.dashboard },
          { path: '/admin/analytics', label: 'Analytics', icon: icons.analytics },
          { path: '/admin/analytics/heat-map', label: 'Heat Map', icon: icons.heatmap },
          { path: '/admin/users', label: 'Users', icon: icons.users },
          { path: '/admin/agents', label: 'Agents', icon: icons.agents },
          { path: '/admin/properties', label: 'Properties', icon: icons.properties },
          { path: '/admin/appointments', label: 'Appointments', icon: icons.appointments },
          { path: '/admin/conversations', label: 'Conversations', icon: icons.messages },
          { path: '/admin/contracts', label: 'Contracts', icon: icons.contracts },
          { path: '/admin/knowledge-base', label: 'Knowledge Base', icon: icons.knowledge },
        ]
      default:
        return []
    }
  }

  const navItems = getNavItems()
  const roleLabel = user?.role === 'manager' ? 'Manager' : user?.role === 'agent' ? 'Agent' : 'Client'
  const brandPath = user?.role === 'client'
    ? '/'
    : user?.role === 'agent'
      ? '/agent/dashboard'
      : '/admin/dashboard'
  const [unreadCount, setUnreadCount] = useState(0)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [recentNotifications, setRecentNotifications] = useState<NotificationResponse[]>([])
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const notificationMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) return
    const fetchUnread = async () => {
      try {
        const data = await notificationsApi?.getUnreadCount?.()
        if (typeof data?.unread_count === 'number') {
          setUnreadCount(data.unread_count)
        }
      } catch {
        // silently ignore polling errors
      }
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 60000)
    return () => clearInterval(interval)
  }, [user])

  useEffect(() => {
    if (!notificationOpen) return
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target as Node)) {
        setNotificationOpen(false)
      }
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [notificationOpen])

  const toggleNotifications = async () => {
    const willOpen = !notificationOpen
    setNotificationOpen(willOpen)
    if (!willOpen) return
    setNotificationsLoading(true)
    try {
      const data = await notificationsApi.getMyNotifications({ skip: 0, limit: 5 })
      setRecentNotifications(data.notifications)
    } catch {
      setRecentNotifications([])
    } finally {
      setNotificationsLoading(false)
    }
  }

  const markPreviewRead = async (notification: NotificationResponse) => {
    if (notification.is_read) return
    try {
      await notificationsApi.markNotificationAsRead(notification.id)
      setRecentNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, is_read: true } : item))
      setUnreadCount((count) => Math.max(0, count - 1))
    } catch {
      // Keep the preview open if marking as read fails.
    }
  }

  const notificationPath = user?.role === 'client' ? '/client/notifications' : user?.role === 'agent' ? '/agent/notifications' : undefined

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <Link
        to={brandPath}
        onClick={() => setMobileSidebarOpen(false)}
        className="flex items-center gap-3 px-6 py-5 border-b border-white/10 hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-400"
        aria-label="Go to RE/MAX Smile AI home page"
      >
        <div className="h-11 w-10 rounded-md bg-white p-1 flex items-center justify-center flex-shrink-0 shadow-sm">
          <BrandLogo className="h-full w-full" alt="RE/MAX logo" />
        </div>
        <div>
          <div className="text-white font-semibold text-sm leading-tight">RE/MAX Smile AI</div>
          <div className="text-primary-200 text-xs">{roleLabel} Portal</div>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto" aria-label="Main navigation">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-white/10 text-white ring-1 ring-white/10'
                      : 'text-navy-200 hover:bg-white/10 hover:text-white'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.icon}
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User footer */}
      <div className="border-t border-primary-700 px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.first_name} {user?.last_name}</p>
            <p className="text-primary-200 text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <Button
          onClick={logout}
          variant="ghost"
          className="w-full justify-start gap-2 px-3 py-2 text-sm text-primary-200 hover:text-white hover:bg-primary-800 rounded-lg border border-transparent"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </Button>
      </div>
    </div>
  )

  return (
    <div className={`fixed inset-0 flex overflow-hidden ${user?.role === 'client' || user?.role === 'agent' ? 'bg-slate-50' : 'bg-page'}`}>
      {/* Desktop Sidebar */}
      <aside className="hidden min-h-0 flex-shrink-0 bg-navy-900 lg:flex lg:w-64 lg:flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-navy-900 flex flex-col transform transition-transform duration-300 lg:hidden ${ 
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-end p-2 lg:hidden">
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="p-2 rounded-lg text-primary-100 hover:bg-primary-700 transition-colors"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <SidebarContent />
      </aside>

      {/* Main area */}
      <div className="flex min-h-0 flex-1 min-w-0 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="relative z-40 flex h-16 flex-shrink-0 items-center gap-4 border-b border-slate-200 bg-white/95 px-4 shadow-[0_1px_8px_rgba(15,23,42,0.03)] backdrop-blur lg:px-6">
          <button
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Open menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex-1">
            {user?.role === 'client' && (
              <div className="hidden sm:block">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">Client workspace</p>
                <p className="text-sm font-semibold text-navy-900">Your property journey</p>
              </div>
            )}
            {user?.role === 'agent' && (
              <div className="hidden sm:block">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">Agent workspace</p>
                <p className="text-sm font-semibold text-navy-900">Listings, leads and client relationships</p>
              </div>
            )}
          </div>
          {notificationPath && (
            <div className="relative" ref={notificationMenuRef}>
              <button
                type="button"
                onClick={toggleNotifications}
                className={`relative rounded-xl p-2.5 text-gray-500 transition-colors hover:bg-gray-100 ${notificationOpen ? 'bg-gray-100 text-navy-900' : ''}`}
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                aria-expanded={notificationOpen}
                aria-haspopup="dialog"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">{unreadCount > 9 ? '9+' : unreadCount}</span>}
              </button>
              {notificationOpen && (
                <div role="dialog" aria-label="Recent notifications" className="absolute right-0 top-12 z-[100] w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <div><p className="font-semibold text-navy-900">Notifications</p><p className="text-xs text-slate-500">{unreadCount ? `${unreadCount} unread` : 'You are all caught up'}</p></div>
                    <span className="rounded-full bg-primary-50 px-2 py-1 text-xs font-semibold text-primary-700">Recent</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notificationsLoading ? (
                      <p className="px-4 py-8 text-center text-sm text-slate-500">Loading notifications…</p>
                    ) : recentNotifications.length === 0 ? (
                      <p className="px-4 py-8 text-center text-sm text-slate-500">No notifications yet</p>
                    ) : recentNotifications.map((notification) => (
                      <button key={notification.id} type="button" onClick={() => markPreviewRead(notification)} className={`block w-full border-b border-slate-100 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${notification.is_read ? 'bg-white' : 'bg-primary-50/50'}`}>
                        <div className="flex gap-3"><span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${notification.is_read ? 'bg-slate-300' : 'bg-primary-500'}`} /><div className="min-w-0"><p className="truncate text-sm font-semibold text-navy-900">{notification.title}</p><p className="mt-0.5 line-clamp-2 text-xs leading-5 text-slate-500">{notification.message}</p><p className="mt-1 text-[11px] text-slate-400">{new Date(notification.created_at).toLocaleString()}</p></div></div>
                      </button>
                    ))}
                  </div>
                  <Link to={notificationPath} onClick={() => setNotificationOpen(false)} className="block border-t border-slate-100 px-4 py-3 text-center text-sm font-semibold text-primary-700 hover:bg-primary-50">View all notifications</Link>
                </div>
              )}
            </div>
          )}
          <span className="text-sm text-gray-600 hidden sm:block">
            {user?.first_name} {user?.last_name}
          </span>
          <span className={`hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            user?.role === 'manager' ? 'bg-accent-100 text-accent-700' :
            user?.role === 'agent' ? 'bg-primary-100 text-primary-700' :
            'bg-success-100 text-success-700'
          }`}>
            {roleLabel}
          </span>
        </header>

        {/* Page content */}
        <main id="main-content" className={`min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 ${user?.role === 'client' ? 'bg-gradient-to-br from-slate-50 via-white to-navy-50/40' : user?.role === 'agent' ? 'bg-[radial-gradient(circle_at_top_right,rgba(220,38,38,0.06),transparent_30%),linear-gradient(135deg,#f8fafc_0%,#ffffff_52%,#f1f5f9_100%)]' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  )
}
