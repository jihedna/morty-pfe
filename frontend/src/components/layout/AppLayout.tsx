import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

interface NavItem {
  path: string
  label: string
}

interface AppLayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const getNavItems = (): NavItem[] => {
    if (!user) return []

    switch (user.role) {
      case 'client':
        return [
          { path: '/client/dashboard', label: 'Dashboard' },
          { path: '/properties', label: 'Properties' },
          { path: '/client/search-requests', label: 'Search Requests' },
          { path: '/client/matches', label: 'Matches' },
          { path: '/client/favorites', label: 'Favorites' },
          { path: '/client/saved-searches', label: 'Saved Searches' },
          { path: '/client/conversations', label: 'Messages' },
          { path: '/client/appointments', label: 'Appointments' },
          { path: '/client/notifications', label: 'Notifications' },
        ]
      case 'agent':
        return [
          { path: '/agent/dashboard', label: 'Dashboard' },
          { path: '/agent/profile', label: 'My Profile' },
          { path: '/agent/properties', label: 'Properties' },
          { path: '/agent/conversations', label: 'Messages' },
          { path: '/agent/appointments', label: 'Appointments' },
          { path: '/agent/notifications', label: 'Notifications' },
        ]
      case 'manager':
        return [
          { path: '/admin/dashboard', label: 'Dashboard' },
          { path: '/admin/analytics', label: 'Analytics' },
          { path: '/admin/users', label: 'Users' },
          { path: '/admin/agents', label: 'Agents' },
          { path: '/admin/properties', label: 'Properties' },
          { path: '/admin/appointments', label: 'Appointments' },
          { path: '/admin/conversations', label: 'Conversations' },
        ]
      default:
        return []
    }
  }

  const navItems = getNavItems()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#003366',
        color: 'white',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '1.5rem',
              cursor: 'pointer',
            }}
          >
            ☰
          </button>
          <h1 style={{ margin: 0, fontSize: '1.25rem' }}>RE/MAX Smile AI</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.875rem' }}>
            {user?.first_name} {user?.last_name}
          </span>
          <button
            onClick={logout}
            style={{
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <aside style={{
          width: isSidebarOpen ? '250px' : '0',
          backgroundColor: '#f5f5f5',
          borderRight: '1px solid #ddd',
          transition: 'width 0.3s',
          overflow: 'hidden',
          position: 'fixed',
          height: 'calc(100vh - 60px)',
          top: '60px',
          left: 0,
          zIndex: 1000,
        }}>
          <nav style={{ padding: '1rem' }}>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {navItems.map((item) => (
                <li key={item.path} style={{ marginBottom: '0.5rem' }}>
                  <Link
                    to={item.path}
                    style={{
                      display: 'block',
                      padding: '0.75rem 1rem',
                      textDecoration: 'none',
                      color: location.pathname === item.path ? '#003366' : '#333',
                      backgroundColor: location.pathname === item.path ? '#e0e0e0' : 'transparent',
                      borderRadius: '4px',
                      fontWeight: location.pathname === item.path ? 'bold' : 'normal',
                    }}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main content */}
        <main style={{
          flex: 1,
          padding: '2rem',
          marginLeft: isSidebarOpen ? '250px' : '0',
          transition: 'margin-left 0.3s',
        }}>
          {children}
        </main>
      </div>
    </div>
  )
}
