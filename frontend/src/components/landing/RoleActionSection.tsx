import { Link } from 'react-router-dom'

const ROLE_CARDS = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'List Your Property',
    desc: 'Publish your listings and reach qualified buyers across Tunisia.',
    actionLabel: 'Start Listing',
    to: '/register',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    title: 'Start Searching',
    desc: 'Use our search tools to find properties that match your lifestyle and budget.',
    actionLabel: 'Explore Properties',
    to: '/properties',
  },
]

export default function RoleActionSection() {
  return (
    <section className="bg-slate-50 py-16 md:py-20" aria-label="Role actions">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ROLE_CARDS.map(card => (
            <div
              key={card.title}
              className="relative overflow-hidden bg-white p-8 rounded-2xl border border-slate-200 shadow-card hover:-translate-y-1 hover:border-primary-200 hover:shadow-card-lg transition-all duration-300 group"
            >
              <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mb-6 text-primary-600 group-hover:scale-110 transition-transform">
                {card.icon}
              </div>
              <h3 className="text-xl font-semibold text-navy-900 mb-2">{card.title}</h3>
              <p className="text-sm text-navy-500 mb-6 leading-relaxed">{card.desc}</p>
              <Link
                to={card.to}
                className="text-primary-600 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
              >
                {card.actionLabel}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
