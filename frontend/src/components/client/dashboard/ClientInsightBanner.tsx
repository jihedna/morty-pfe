import { Link } from 'react-router-dom'

export function ClientInsightBanner() {
  return (
    <section className="p-6 bg-navy-900 text-white rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4" aria-labelledby="dashboard-next-step-heading">
      <div className="flex items-center gap-4"><div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0" aria-hidden="true"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></div><div><h2 id="dashboard-next-step-heading" className="text-lg font-semibold">Continue your property search</h2><p className="text-sm text-white/70">Browse current listings or refine your search preferences.</p></div></div>
      <Link to="/properties" className="inline-flex items-center justify-center min-h-10 px-6 py-2 bg-white text-navy-900 rounded-lg text-sm font-bold hover:bg-navy-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900">Browse Properties</Link>
    </section>
  )
}
