import { Link } from 'react-router-dom'

export default function AgentFinderSection() {
  return (
    <section className="py-16 md:py-24 bg-navy-100 border-t border-navy-200" aria-label="Agent finder">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1">
            <div className="bg-white rounded-2xl p-8 border border-navy-200 shadow-card">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center text-primary-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-navy-900">Connect with Agents</h3>
                  <p className="text-sm text-navy-500">Experienced professionals ready to help</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-sm text-navy-700">Browse agent profiles and property portfolios</p>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-sm text-navy-700">Send search requests and get matched with suitable agents</p>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-sm text-navy-700">Schedule appointments and communicate securely</p>
                </div>
              </div>
              <Link
                to="/register"
                className="mt-8 inline-flex items-center gap-2 text-primary-600 text-sm font-semibold hover:gap-3 transition-all"
              >
                Get Started
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          <div className="order-1 md:order-2">
            <span className="text-xs font-semibold text-primary-600 uppercase tracking-widest mb-3 block">Agent Finder</span>
            <h2 className="text-2xl md:text-4xl font-bold text-navy-900 mb-4 tracking-tight">
              Find the Right Agent for You
            </h2>
            <p className="text-base text-navy-500 leading-relaxed mb-6">
              Our platform connects you with real estate professionals across Tunisia. Whether you are buying, renting, or listing a property, our agents have the local expertise to guide you through the process.
            </p>
            <p className="text-sm text-navy-400 leading-relaxed">
              Create an account to start sending search requests and matching with agents who have the right properties for you.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
