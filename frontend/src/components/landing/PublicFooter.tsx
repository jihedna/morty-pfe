import { Link } from 'react-router-dom'

import BrandLogo from '../branding/BrandLogo'

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
    <footer className="bg-navy-900 border-t border-white/10 pt-14 pb-8" aria-label="Footer">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <BrandLogo className="h-14 w-auto" alt="RE/MAX logo" />
              <span className="font-semibold text-white text-lg tracking-tight">Smile <span className="text-primary-400">AI</span></span>
            </Link>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              A real estate platform powered by AI. Connecting properties, agents, and clients across Tunisia.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-widest">Platform</h3>
            <ul className="space-y-2">
              {FOOTER_LINKS.slice(0, 3).map(link => (
                <li key={link.label}>
                  <Link to={link.to} className="text-sm text-slate-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-widest">Account</h3>
            <ul className="space-y-2">
              {FOOTER_LINKS.slice(3).map(link => (
                <li key={link.label}>
                  <Link to={link.to} className="text-sm text-slate-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500">
            &copy; {year} RE/MAX Smile AI. Academic project demo.
          </p>
          <p className="text-sm text-slate-500">
            Built with React, Vite, TypeScript, and Tailwind CSS.
          </p>
        </div>
      </div>
    </footer>
  )
}
