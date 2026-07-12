import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import Button from '../ui/Button'

interface PublicLayoutProps {
  children: React.ReactNode
  showNav?: boolean
}

export default function PublicLayout({ children, showNav = true }: PublicLayoutProps) {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()

  const dashboardLink = () => {
    if (!isAuthenticated) return '/login'
    if (user?.role === 'agent') return '/agent/dashboard'
    if (user?.role === 'manager') return '/admin/dashboard'
    return '/client/dashboard'
  }

  return (
    <div className="min-h-screen bg-page">
      {showNav && (
        <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded-lg">
              <div className="w-9 h-9 bg-primary-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="text-white font-black text-base">R</span>
              </div>
              <span className="font-semibold text-navy-900 text-lg tracking-tight">RE/MAX Smile <span className="text-primary-500">AI</span></span>
            </Link>
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  <Button as="Link" to={dashboardLink()} variant="primary" size="md">Dashboard</Button>
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() => { logout(); navigate('/') }}
                    ariaLabel="Sign out"
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button as="Link" to="/login" variant="ghost" size="md">Log In</Button>
                  <Button as="Link" to="/register" variant="primary" size="md">Get Started</Button>
                </>
              )}
            </div>
          </div>
        </nav>
      )}
      <main>{children}</main>
    </div>
  )
}
