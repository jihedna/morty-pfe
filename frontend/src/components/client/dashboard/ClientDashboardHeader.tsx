import { useMemo } from 'react'
import { User } from '../../../types'

interface ClientSummaryCardProps {
  value: number
  isLoading: boolean
}

function ClientSummaryCard({ value, isLoading }: ClientSummaryCardProps) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-sm flex items-center gap-3" aria-live="polite">
      <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center text-navy-700" aria-hidden="true">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <div>
        <p className="text-xs font-semibold text-navy-500 uppercase tracking-wide">Active search requests</p>
        <p className="text-xl font-bold text-navy-900">{isLoading ? '—' : value}</p>
      </div>
    </div>
  )
}

interface ClientDashboardHeaderProps {
  user: User | null
  activeSearchRequests: number
  isLoading: boolean
}

export function ClientDashboardHeader({ user, activeSearchRequests, isLoading }: ClientDashboardHeaderProps) {
  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }, [])

  const firstName = user?.first_name || 'Client'

  return (
    <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-navy-900">
          {greeting}, {firstName}.
        </h1>
        <p className="mt-1 text-base text-navy-500">
          {isLoading
            ? 'Loading your dashboard...'
            : `You have ${activeSearchRequests} active search request${activeSearchRequests !== 1 ? 's' : ''}.`}
        </p>
      </div>
      <ClientSummaryCard value={activeSearchRequests} isLoading={isLoading} />
    </header>
  )
}
