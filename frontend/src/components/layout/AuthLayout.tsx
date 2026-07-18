import { Link, useLocation } from 'react-router-dom'

interface AuthLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  testId?: string
}

export default function AuthLayout({ children, title, subtitle, testId }: AuthLayoutProps) {
  const location = useLocation()
  const isLogin = location.pathname === '/login'

  const activeTabClasses =
    'flex-1 py-2 text-sm font-semibold rounded-md transition-all duration-200 bg-white shadow-sm text-primary-600 font-bold'
  const inactiveTabClasses =
    'flex-1 py-2 text-sm font-semibold rounded-md transition-all duration-200 text-navy-500 hover:text-navy-900'

  return (
    <div
      className="min-h-screen bg-page flex items-center justify-center relative overflow-hidden"
      data-testid={testId}
    >
      {/* Dotted background pattern */}
      <div
        className="absolute inset-0 z-0 opacity-10 pointer-events-none auth-dotted-bg"
        aria-hidden="true"
      />

      {/* Red glow — upper right */}
      <div
        className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-600 opacity-[0.03] blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none"
        aria-hidden="true"
      />

      {/* Blue glow — lower left */}
      <div
        className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-navy-300 opacity-[0.03] blur-[150px] rounded-full -translate-x-1/2 translate-y-1/2 pointer-events-none"
        aria-hidden="true"
      />

      <main className="relative z-10 w-full max-w-md px-4 md:px-0 py-8">
        {/* Brand area */}
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="flex items-center gap-2 mb-2">
            <svg
              className="w-8 h-8 text-primary-600"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" />
            </svg>
            <h1 className="text-3xl font-bold text-primary-600">
              RE/MAX <span className="font-normal text-navy-900">Smile AI</span>
            </h1>
          </Link>
          <p className="text-sm text-navy-500">The intelligence behind every perfect move.</p>
        </div>

        {/* Auth card */}
        <div className="glass-panel border border-border/30 shadow-xl rounded-xl p-8 transition-all duration-500 ease-out">
          {/* Login / Join segmented tabs */}
          <div
            className="flex p-1 bg-surface-muted rounded-lg mb-8"
            role="tablist"
            aria-label="Authentication"
          >
            <Link
              to="/login"
              className={isLogin ? activeTabClasses : inactiveTabClasses}
              role="tab"
              aria-selected={isLogin}
            >
              Login
            </Link>
            <Link
              to="/register"
              className={!isLogin ? activeTabClasses : inactiveTabClasses}
              role="tab"
              aria-selected={!isLogin}
            >
              Join
            </Link>
          </div>

          {/* Page content */}
          {title && (
            <h2 className="text-2xl font-semibold text-navy-900 mb-1">{title}</h2>
          )}
          {subtitle && <p className="text-sm text-navy-500 mb-6">{subtitle}</p>}
          {children}

          {/* Legal text */}
          <p className="mt-8 text-center text-xs text-navy-500 leading-relaxed">
            By continuing, you agree to the platform terms and privacy notice.
          </p>
        </div>

        {/* Info cards — desktop only */}
        <div className="hidden md:grid grid-cols-2 gap-4 mt-8">
          <div className="bg-navy-200/40 p-4 rounded-lg border border-border/10 flex items-start gap-3">
            <svg
              className="w-5 h-5 text-primary-600 flex-shrink-0"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6L12 2z" />
            </svg>
            <div>
              <h4 className="text-xs font-semibold text-navy-900">AI Valuations</h4>
              <p className="text-[11px] text-navy-500">Instant market precision data.</p>
            </div>
          </div>
          <div className="bg-navy-200/40 p-4 rounded-lg border border-border/10 flex items-start gap-3">
            <svg
              className="w-5 h-5 text-navy-500 flex-shrink-0"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
            </svg>
            <div>
              <h4 className="text-xs font-semibold text-navy-900">Secure Portal</h4>
              <p className="text-[11px] text-navy-500">Enterprise grade encryption.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
