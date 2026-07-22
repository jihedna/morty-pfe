import React from 'react'
import { PropertyPublicResponse } from '../../types/property'
import { User } from '../../types/index'
import { useAgent } from '../../hooks/useAgent'
import { AgentPublicResponse } from '../../lib/adminAgentsApi'
import Card from '../ui/Card'

interface PropertyContactCardProps {
  property: PropertyPublicResponse
  user: User | null
  isFavorited: boolean
  isFavoriteLoading: boolean
  onFavoriteToggle: () => void
  onShare: () => void
  onContactClick: () => void
  onViewingClick: () => void
  onAddRequestClick: () => void
  isAddingRequest: boolean
}

function AgentAvatar({ agent, title }: { agent?: AgentPublicResponse | null; title: string }) {
  if (!agent || !agent.user) {
    return (
      <div className="w-14 h-14 rounded-full bg-navy-100 text-navy-600 flex items-center justify-center text-lg font-semibold">
        {title.charAt(0).toUpperCase()}
      </div>
    )
  }

  const initials = `${agent.user.first_name.charAt(0)}${agent.user.last_name.charAt(0)}`.toUpperCase()
  return (
    <div className="w-14 h-14 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-lg font-semibold">
      {initials}
    </div>
  )
}

export function PropertyContactCard({
  property,
  user,
  isFavorited,
  isFavoriteLoading,
  onFavoriteToggle,
  onShare,
  onContactClick,
  onViewingClick,
  onAddRequestClick,
  isAddingRequest,
}: PropertyContactCardProps) {
  const { data: agent, isLoading: agentLoading } = useAgent(property.agent_id)

  const isClient = user?.role === 'client'
  const canBook = property.status === 'available' || property.status === 'reserved'

  return (
    <Card className="p-6 space-y-5 sticky top-24">
      <div className="flex items-center gap-4">
        <AgentAvatar agent={agent} title={property.title} />
        <div className="min-w-0">
          <p className="font-semibold text-navy-900 truncate">
            {agent?.user ? `${agent.user.first_name} ${agent.user.last_name}` : 'Listing Agent'}
          </p>
          {agent?.office && (
            <p className="text-sm text-navy-500 truncate">{agent.office}</p>
          )}
          {agent?.phone && (
            <p className="text-sm text-navy-500">{agent.phone}</p>
          )}
          {!agent && !agentLoading && (
            <p className="text-sm text-navy-500">RE/MAX Smile AI</p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {isClient ? (
          <>
            <button
              type="button"
              onClick={onContactClick}
              className="w-full py-3 px-4 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 transition-colors"
            >
              Contact Agent
            </button>
            <button
              type="button"
              onClick={onAddRequestClick}
              disabled={!canBook || isAddingRequest}
              className="w-full py-3 px-4 rounded-xl border-2 border-navy-700 text-navy-800 font-medium hover:bg-navy-50 disabled:border-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
            >
              {isAddingRequest ? 'Adding Request…' : 'Add Property Request'}
            </button>
            <button
              type="button"
              onClick={onViewingClick}
              disabled={!canBook}
              className={`w-full py-3 px-4 rounded-xl font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 transition-colors ${
                canBook
                  ? 'border-2 border-primary-500 text-primary-600 hover:bg-primary-50'
                  : 'border-2 border-slate-200 text-slate-400 cursor-not-allowed'
              }`}
              aria-disabled={!canBook}
            >
              {canBook ? 'Request Viewing' : 'Not Available for Viewing'}
            </button>
          </>
        ) : (
          <>
            <h3 className="text-lg font-semibold text-navy-900">Unlock full access</h3>
            <p className="text-sm text-navy-500">
              Sign in to save properties, message agents, and schedule viewings.
            </p>
            <a
              href="/login"
              className="block w-full py-3 px-4 rounded-xl bg-primary-500 text-white text-center font-medium hover:bg-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 transition-colors"
            >
              Sign In to Contact
            </a>
            <a
              href="/register"
              className="block w-full py-3 px-4 rounded-xl border-2 border-primary-500 text-primary-600 text-center font-medium hover:bg-primary-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 transition-colors"
            >
              Create Account
            </a>
          </>
        )}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onFavoriteToggle}
          disabled={!isClient || isFavoriteLoading}
          className={`flex-1 py-2.5 px-4 rounded-xl border font-medium text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
            isClient
              ? isFavorited
                ? 'bg-red-50 border-red-200 text-red-500'
                : 'border-slate-200 text-navy-600 hover:bg-surface-muted'
              : 'border-slate-200 text-slate-400 cursor-not-allowed'
          }`}
          aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          {isFavorited ? 'Saved' : 'Save'}
        </button>

        <button
          type="button"
          onClick={onShare}
          className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-navy-600 font-medium text-sm hover:bg-surface-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          aria-label="Share property"
        >
          Share
        </button>
      </div>

      {property.reference_code && (
        <div className="pt-4 border-t border-slate-100">
          <p className="text-xs text-navy-400">Reference ID</p>
          <p className="text-sm font-medium text-navy-700 font-mono">{property.reference_code}</p>
        </div>
      )}
    </Card>
  )
}
