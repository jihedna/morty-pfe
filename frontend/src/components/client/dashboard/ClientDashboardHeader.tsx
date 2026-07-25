import { useMemo } from 'react'
import { User } from '../../../types'

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

  return (
    <header className='relative mb-7 overflow-hidden rounded-3xl bg-navy-900 px-6 py-7 text-white shadow-card-lg sm:px-8'>
      <div className='absolute -right-16 -top-24 h-64 w-64 rounded-full bg-primary-500/20 blur-3xl' />
      <div className='absolute bottom-0 left-1/3 h-24 w-48 rounded-full bg-blue-400/10 blur-2xl' />
      <div className='relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between'>
        <div>
          <span className='inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-slate-200'>
            <span className='h-2 w-2 rounded-full bg-success-400' /> Your personalized overview
          </span>
          <h1 className='mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl'>{greeting}, {user?.first_name || 'Client'}.</h1>
          <p className='mt-2 text-sm text-slate-300 sm:text-base'>Keep track of your searches, saved homes, agent matches, and appointments.</p>
        </div>
        <div className='flex min-w-56 items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur' aria-live='polite'>
          <div className='flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-white' aria-hidden='true'>
            <svg className='h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' /></svg>
          </div>
          <div><p className='text-xs font-semibold uppercase tracking-wide text-slate-300'>Active requests</p><p className='text-2xl font-semibold text-white'>{isLoading ? '-' : activeSearchRequests}</p></div>
        </div>
      </div>
    </header>
  )
}
