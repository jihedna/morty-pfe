import React from 'react'
import { formatArea } from '../../utils/format'

interface PropertyStatsProps {
  areaSqm: number
  bedrooms: number
  bathrooms: number
  rooms: number
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-surface rounded-2xl border border-slate-100 shadow-sm">
      <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-lg font-semibold text-navy-900">{value}</p>
        <p className="text-sm text-navy-500">{label}</p>
      </div>
    </div>
  )
}

export function PropertyStats({ areaSqm, bedrooms, bathrooms, rooms }: PropertyStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        }
        value={`${formatArea(areaSqm)} m²`}
        label="Living Area"
      />
      <StatCard
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2h-5l-5 5v5H5v-5a2 2 0 012-2h10" />
          </svg>
        }
        value={bedrooms}
        label={bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}
      />
      <StatCard
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H3m4-4h10a2 2 0 012 2v10H5V8a2 2 0 012-2z" />
          </svg>
        }
        value={bathrooms}
        label={bathrooms === 1 ? 'Bathroom' : 'Bathrooms'}
      />
      <StatCard
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        }
        value={rooms}
        label={rooms === 1 ? 'Room' : 'Rooms'}
      />
    </div>
  )
}
