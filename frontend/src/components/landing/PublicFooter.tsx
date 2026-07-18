import { Link } from 'react-router-dom'

const FOOTER_LINKS = [
  { label: 'Buy', to: '/properties?listing_type=sale' },
  { label: 'Rent', to: '/properties?listing_type=rent' },
  { label: 'Commercial', to: '/properties?property_type=commercial' },
  { label: 'Agent Dashboard', to: '/agent/dashboard' },
  { label: 'Client Dashboard', to: '/client/dashboard' },
  { label: 'Sign In', to: '/login' },
  { label: 'Register', to: '/register' },
]

export default function PublicFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-navy-100 border-t border-navy-200 pt-12 pb-8" aria-label="Footer">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 bg-primary-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="text-white font-black text-base">R</span>
              </div>
              <span className="font-semibold text-navy-900 text-lg tracking-tight">RE/MAX Smile <span className="text-primary-500">AI</span></span>
            </Link>
            <p className="text-sm text-navy-500 max-w-sm leading-relaxed">
              A real estate platform powered by AI. Connecting properties, agents, and clients across Tunisia.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-navy-900 mb-4 uppercase tracking-widest">Platform</h3>
            <ul className="space-y-2">
              {FOOTER_LINKS.slice(0, 3).map(link => (
                <li key={link.label}>
                  <Link to={link.to} className="text-sm text-navy-500 hover:text-primary-600 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-navy-900 mb-4 uppercase tracking-widest">Account</h3>
            <ul className="space-y-2">
              {FOOTER_LINKS.slice(3).map(link => (
                <li key={link.label}>
                  <Link to={link.to} className="text-sm text-navy-500 hover:text-primary-600 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-navy-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-navy-400">
            &copy; {year} RE/MAX Smile AI. Academic project demo.
          </p>
          <p className="text-sm text-navy-400">
            Built with React, Vite, TypeScript, and Tailwind CSS.
          </p>
        </div>
      </div>
    </footer>
  )
}
