import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import Button from '../ui/Button'
import BrandLogo from '../branding/BrandLogo'

interface PublicLayoutProps {
  children: React.ReactNode
  showNav?: boolean
}

const NAV_LINKS = [
  { label: 'Buy', to: '/properties?listing_type=sale' },
  { label: 'Rent', to: '/properties?listing_type=rent' },
  { label: 'Commercial', to: '/properties?property_type=commercial' },
]

export default function PublicLayout({ children, showNav = true }: PublicLayoutProps) {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const dashboardLink = () => {
    if (!isAuthenticated) return '/login'
    if (user?.role === 'agent') return '/agent/dashboard'
    if (user?.role === 'manager') return '/admin/dashboard'
    return '/client/dashboard'
  }

  return (
    <div className="min-h-screen bg-page">
      {showNav && (
        <nav className="sticky top-0 z-50 bg-white border-b border-navy-200 shadow-sm">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded-lg">
                <BrandLogo className="h-12 w-auto" alt="RE/MAX logo" />
                <span className="font-semibold text-navy-900 text-lg tracking-tight">Smile <span className="text-primary-500">AI</span></span>
              </Link>
              <div className="hidden md:flex gap-6 items-center">
                {NAV_LINKS.map(link => (
                  <Link
                    key={link.label}
                    to={link.to}
                    className="text-sm font-medium text-navy-500 hover:text-primary-600 transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  <Button as="Link" to={dashboardLink()} variant="primary" size="md" className="hidden md:inline-flex">Dashboard</Button>
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() => { logout(); navigate('/') }}
                    ariaLabel="Sign out"
                    className="hidden md:inline-flex"
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button as="Link" to="/register" variant="ghost" size="md" className="hidden md:inline-flex">Sign In</Button>
                  <Button as="Link" to="/login" variant="primary" size="md" className="hidden md:inline-flex">Login</Button>
                </>
              )}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(prev => !prev)}
                className="md:hidden p-2 rounded-lg hover:bg-surface-muted transition-colors"
                aria-label="Toggle navigation menu"
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-nav-menu"
              >
                {mobileMenuOpen ? (
                  <svg className="w-6 h-6 text-navy-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-navy-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          {mobileMenuOpen && (
            <div id="mobile-nav-menu" data-testid="mobile-nav-menu" className="md:hidden border-t border-navy-200 bg-white px-4 py-4 space-y-3">
              {NAV_LINKS.map(link => (
                <Link
                  key={link.label}
                  to={link.to}
                  className="block text-sm font-medium text-navy-700 hover:text-primary-600 transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-3 border-t border-navy-100 space-y-2">
                {isAuthenticated ? (
                  <>
                    <Link to={dashboardLink()} className="block text-sm font-semibold text-primary-600 py-2" onClick={() => setMobileMenuOpen(false)}>
                      Dashboard
                    </Link>
                    <button
                      type="button"
                      onClick={() => { setMobileMenuOpen(false); logout(); navigate('/') }}
                      className="block text-sm font-medium text-navy-500 py-2"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link to="/login" className="block text-sm font-semibold text-primary-600 py-2" onClick={() => setMobileMenuOpen(false)}>
                    Login
                  </Link>
                )}
              </div>
            </div>
          )}
        </nav>
      )}
      <main>{children}</main>
    </div>
  )
}
