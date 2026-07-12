import { Link } from 'react-router-dom'
import Card from '../ui/Card'

interface AuthLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  testId?: string
}

export default function AuthLayout({ children, title, subtitle, testId }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-page flex" data-testid={testId}>
      <div className="hidden lg:flex lg:w-1/2 bg-navy-900 flex-col justify-between p-12 xl:p-16">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent-500 rounded-xl flex items-center justify-center shadow-sm">
            <span className="text-white font-black text-lg">R</span>
          </div>
          <span className="text-white font-bold text-xl">RE/MAX Smile AI</span>
        </div>
        <div>
          <h2 className="text-4xl xl:text-5xl font-semibold text-white leading-tight mb-4 tracking-tight">
            Your Smart Real Estate Platform
          </h2>
          <p className="text-navy-200 text-lg leading-8">
            Find your perfect property in Tunisia with AI-powered matching and expert agents.
          </p>
        </div>
        <p className="text-primary-200 text-sm">© {new Date().getFullYear()} RE/MAX Smile AI. All rights reserved.</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-md">
          <Card padding="lg" className="w-full border-slate-200/80 shadow-card-lg">
            <div className="flex items-center gap-2 mb-8 lg:hidden">
              <div className="w-8 h-8 bg-accent-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-sm">R</span>
              </div>
              <Link to="/" className="text-primary-600 font-bold text-lg">RE/MAX Smile AI</Link>
            </div>
            {title && <h1 className="text-2xl font-bold text-gray-900 mb-1">{title}</h1>}
            {subtitle && <p className="text-gray-500 mb-8">{subtitle}</p>}
            {children}
          </Card>
        </div>
      </div>
    </div>
  )
}
