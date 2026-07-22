import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import {
  Card,
  ErrorState,
  LoadingState,
  PageHeader,
} from '../../components/ui/shared'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import { agentLeadsApi, AgentLeadResponse } from '../../lib/agentLeadsApi'
import { agentPropertiesApi, type PropertyResponse } from '../../lib/agentPropertiesApi'
import { mlApi, type LeadConversionPrediction } from '../../lib/mlApi'
import { extractApiError } from '../../utils/format'

const criteriaLabels: Record<string, string> = {
  property_type: 'Property type',
  territory: 'Territory',
  budget: 'Budget',
  availability: 'Availability',
}

export default function AgentLeadDetail() {
  const { requestId } = useParams<{ requestId: string }>()
  const navigate = useNavigate()
  const [lead, setLead] = useState<AgentLeadResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRecalculating, setIsRecalculating] = useState(false)
  const [isStartingConversation, setIsStartingConversation] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conversionPrediction, setConversionPrediction] = useState<LeadConversionPrediction | null>(null)
  const [predictionLoading, setPredictionLoading] = useState(false)
  const [recalculationMessage, setRecalculationMessage] = useState<string | null>(null)
  const [showDealForm, setShowDealForm] = useState(false)
  const [properties, setProperties] = useState<PropertyResponse[]>([])
  const [dealPropertyId, setDealPropertyId] = useState('')
  const [dealAmount, setDealAmount] = useState('')
  const [isSubmittingDeal, setIsSubmittingDeal] = useState(false)
  const [dealMessage, setDealMessage] = useState<string | null>(null)

  const loadLead = useCallback(async () => {
    if (!requestId) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await agentLeadsApi.getLead(requestId)
      setLead(data)
    } catch (err) {
      setError(extractApiError(err) || 'Failed to load lead')
    } finally {
      setIsLoading(false)
    }
  }, [requestId])

  useEffect(() => {
    loadLead()
  }, [loadLead])

  const loadConversionPrediction = async () => {
    if (!requestId) return
    setPredictionLoading(true)
    try {
      const pred = await mlApi.getLeadConversionPrediction(requestId)
      setConversionPrediction(pred)
    } catch {
      // Non-blocking — prediction is additive
    } finally {
      setPredictionLoading(false)
    }
  }

  useEffect(() => {
    if (lead && !conversionPrediction && !predictionLoading) {
      loadConversionPrediction()
    }
  }, [lead]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRecalculate = async () => {
    if (!requestId) return
    setIsRecalculating(true)
    setError(null)
    setRecalculationMessage(null)
    try {
      const previousScore = lead?.lead_score
      const data = await agentLeadsApi.recalculateLead(requestId)
      setLead(data)
      setConversionPrediction(null)
      await loadConversionPrediction()
      setRecalculationMessage(
        previousScore === data.lead_score
          ? `Score recalculated successfully. It remains ${data.lead_score} because the lead data has not changed.`
          : `Score updated from ${previousScore ?? '—'} to ${data.lead_score}.`
      )
    } catch (err) {
      setError(extractApiError(err) || 'Failed to recalculate lead')
    } finally {
      setIsRecalculating(false)
    }
  }

  const handleStartConversation = async () => {
    if (!requestId) return
    setIsStartingConversation(true)
    setError(null)
    try {
      const conversation = await agentLeadsApi.startConversation(requestId)
      navigate(`/agent/conversations/${conversation.id}`)
    } catch (err) {
      setError(extractApiError(err) || 'Failed to start conversation')
      setIsStartingConversation(false)
    }
  }

  const openDealForm = async () => {
    setError(null)
    try {
      const data = await agentPropertiesApi.listMyProperties(undefined, 0, 100)
      setProperties(data.filter(property =>
        !['sold', 'rented', 'archived'].includes(property.status)
        && property.property_type.toLowerCase() === lead?.property_type.toLowerCase()
        && property.listing_type.toLowerCase() === lead?.listing_type.toLowerCase()
      ))
      if (lead?.property_id) {
        const requestedProperty = data.find(property => property.id === lead.property_id)
        if (requestedProperty) {
          setDealPropertyId(requestedProperty.id)
          setDealAmount(String(requestedProperty.price))
        }
      }
      setShowDealForm(true)
    } catch (err) {
      setError(extractApiError(err) || 'Failed to load your properties')
    }
  }

  const handleDealAgreed = async () => {
    if (!requestId || !dealPropertyId || Number(dealAmount) <= 0) return
    setIsSubmittingDeal(true)
    setError(null)
    try {
      await agentLeadsApi.markDealAgreed(requestId, dealPropertyId, Number(dealAmount))
      setShowDealForm(false)
      setDealMessage('Deal submitted to the manager for contract review.')
    } catch (err) {
      setError(extractApiError(err) || 'Failed to submit agreed deal')
      setShowDealForm(false)
    } finally {
      setIsSubmittingDeal(false)
    }
  }

  const qualificationBadge = (level: string) => {
    const classes = {
      hot: 'bg-accent-100 text-accent-700 border-accent-200',
      warm: 'bg-warning-100 text-warning-700 border-warning-200',
      cold: 'bg-primary-100 text-primary-700 border-primary-200',
    }[level] || 'bg-gray-100 text-gray-700 border-gray-200'

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${classes}`}>
        {level}
      </span>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Lead Details"
          subtitle={lead ? `Request ID: ${lead.request_id}` : 'Loading lead details…'}
          action={
            <Button type="button" variant="secondary" onClick={() => navigate('/agent/leads')}>
              Back to Leads
            </Button>
          }
        />

        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={loadLead} />
        ) : lead ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {lead.summary || `${lead.property_type} in ${lead.preferred_city || 'any location'}`}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {lead.preferred_district
                        ? `${lead.preferred_city}, ${lead.preferred_district}`
                        : lead.preferred_city || 'No location'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {qualificationBadge(lead.qualification_level)}
                    <span className="text-2xl font-bold text-gray-900">{lead.lead_score}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Property type</p>
                    <p className="text-sm font-medium text-gray-900 capitalize">{lead.property_type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Listing type</p>
                    <p className="text-sm font-medium text-gray-900 capitalize">{lead.listing_type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Bedrooms / Bathrooms</p>
                    <p className="text-sm font-medium text-gray-900">
                      {lead.minimum_bedrooms ?? '—'} / {lead.minimum_bathrooms ?? '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Urgency</p>
                    <p className="text-sm font-medium text-gray-900 capitalize">{lead.urgency || 'low'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Budget</p>
                    <p className="text-sm font-medium text-gray-900">
                      {lead.minimum_budget && lead.maximum_budget
                        ? `${lead.minimum_budget.toLocaleString()} - ${lead.maximum_budget.toLocaleString()} TND`
                        : lead.minimum_budget
                        ? `From ${lead.minimum_budget.toLocaleString()} TND`
                        : lead.maximum_budget
                        ? `Up to ${lead.maximum_budget.toLocaleString()} TND`
                        : 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Match</p>
                    <p className="text-sm font-medium text-gray-900">{lead.match_percentage}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Created</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Appointments</p>
                    <p className="text-sm font-medium text-gray-900">{lead.appointment_count}</p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100">
                  <p className="text-sm font-medium text-gray-900">Recommended action</p>
                  <p className="text-sm text-gray-600 mt-1">{lead.recommended_action}</p>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Button
                    type="button"
                    onClick={handleRecalculate}
                    isLoading={isRecalculating}
                    variant="secondary"
                  >
                    Recalculate Score
                  </Button>
                  {lead.conversation_id && (
                    <Button as="Link" to={`/agent/conversations/${lead.conversation_id}`} variant="outline">
                      Open Conversation
                    </Button>
                  )}
                  {!lead.conversation_id && (
                    <Button
                      type="button"
                      onClick={handleStartConversation}
                      isLoading={isStartingConversation}
                      variant="outline"
                    >
                      Start Conversation
                    </Button>
                  )}
                  <Button type="button" onClick={openDealForm} disabled={Boolean(dealMessage)}>
                    {dealMessage ? 'Deal Submitted' : 'Mark Deal as Agreed'}
                  </Button>
                </div>
                {recalculationMessage && (
                  <p className="mt-3 rounded-lg border border-success-200 bg-success-50 px-3 py-2 text-sm text-success-700" role="status" aria-live="polite">
                    {recalculationMessage}
                  </p>
                )}
                {dealMessage && (
                  <p className="mt-3 rounded-lg border border-success-200 bg-success-50 px-3 py-2 text-sm text-success-700" role="status">
                    {dealMessage}
                  </p>
                )}
              </Card>

              <Card>
                <h3 className="text-base font-semibold text-gray-900 mb-4">Score Breakdown</h3>
                <ul className="space-y-2">
                  {lead.lead_score_reasons.map((reason, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-success-500 mt-0.5">✓</span>
                      {reason}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>

            <div className="space-y-6">
              {conversionPrediction && (
                <Card>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-semibold text-gray-900">Conversion Prediction</h3>
                    <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Experimental</span>
                  </div>
                  <div className="mb-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-gray-900">
                        {Math.round(conversionPrediction.conversion_probability * 100)}%
                      </span>
                      <span className="text-sm text-gray-500">conversion probability</span>
                    </div>
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        conversionPrediction.predicted_priority === 'high'
                          ? 'bg-accent-100 text-accent-700'
                          : conversionPrediction.predicted_priority === 'medium'
                            ? 'bg-warning-100 text-warning-700'
                            : 'bg-primary-100 text-primary-700'
                      }`}>
                        {conversionPrediction.predicted_priority} priority
                      </span>
                    </div>
                  </div>
                  {conversionPrediction.top_reasons.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-500 uppercase">Key factors</p>
                      <ul className="space-y-1">
                        {conversionPrediction.top_reasons.map((reason, i) => (
                          <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                            <span className="text-gray-400 mt-0.5">•</span>
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p className="mt-3 text-xs text-gray-400">
                    {conversionPrediction.fallback
                      ? 'Based on rule-based heuristics. ML model not yet trained.'
                      : `ML model v${conversionPrediction.model_version}`}
                  </p>
                </Card>
              )}

              <Card>
                <h3 className="text-base font-semibold text-gray-900 mb-4">Match Criteria</h3>
                <div className="space-y-3">
                  {Object.entries(lead.matched_criteria).map(([key, matched]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{criteriaLabels[key] || key}</span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          matched
                            ? 'bg-success-100 text-success-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {matched ? 'Matched' : 'Not matched'}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        ) : null}
      </div>
      <Modal
        isOpen={showDealForm}
        onClose={() => setShowDealForm(false)}
        title="Mark Deal as Agreed"
        footer={(
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setShowDealForm(false)}>Cancel</Button>
            <Button
              type="button"
              onClick={handleDealAgreed}
              isLoading={isSubmittingDeal}
              disabled={!dealPropertyId || Number(dealAmount) <= 0}
            >
              Submit for Review
            </Button>
          </div>
        )}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Select the agreed property and final amount. The manager will review the pending contract.</p>
          <Select
            id="deal-property"
            label="Property"
            value={dealPropertyId}
            onChange={value => {
              setDealPropertyId(value)
              const property = properties.find(item => item.id === value)
              if (property) setDealAmount(String(property.price))
            }}
            options={[
              { value: '', label: properties.length ? 'Select a property' : 'No available properties' },
              ...properties.map(property => ({
                value: property.id,
                label: `${property.title} — ${property.price.toLocaleString()} TND`,
              })),
            ]}
          />
          <Input
            id="deal-amount"
            type="number"
            min="1"
            label="Agreed amount (TND)"
            value={dealAmount}
            onChange={setDealAmount}
          />
        </div>
      </Modal>
    </AppLayout>
  )
}
