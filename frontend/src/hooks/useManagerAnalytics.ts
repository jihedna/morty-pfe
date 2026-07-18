import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { adminAnalyticsApi, type TimeSeriesResponse } from '../lib/adminAnalyticsApi'
import { adminAgentsApi, type AgentPublicResponse } from '../lib/adminAgentsApi'
import type { HeatMapPoint } from '../lib/adminAnalyticsApi'

export type DateRangePreset = 'last30' | 'lastQuarter' | 'ytd' | 'custom'

export interface ManagerAnalyticsFilters {
  preset: DateRangePreset
  customDateFrom: string
  customDateTo: string
  city: string
  district: string
  agentId: string
}

export interface ManagerAnalyticsData {
  searchRequestsSeries: TimeSeriesResponse | null
  contractsSeries: TimeSeriesResponse | null
  leadAnalytics: {
    total_search_requests: number
    active_search_requests: number
    scored_leads: number
    unscored_leads: number
    total_hot_leads: number
    total_warm_leads: number
    total_cold_leads: number
    average_lead_score: number | null
    leads_by_property_type: Record<string, number>
    leads_by_city: Record<string, number>
    leads_by_urgency: Record<string, number>
  } | null
  appointmentAnalytics: {
    total_appointments: number
    requested: number
    confirmed: number
    rescheduled: number
    cancelled: number
    completed: number
    no_show: number
    completion_rate: number
    cancellation_rate: number
    no_show_rate: number
    upcoming_count: number
    appointments_by_day: Record<string, number>
    appointments_by_agent: Record<string, number>
  } | null
  agentAnalytics: {
    agents: {
      agent_id: string
      user_id: string
      first_name: string
      last_name: string
      years_experience: number
      total_listings: number
      available_listings: number
      sold_listings: number
      rented_listings: number
      appointment_count: number
      completed_appointment_count: number
      conversation_count: number
      received_favorites: number
    }[]
    total: number
    skip: number
    limit: number
  } | null
  heatMapPoints: HeatMapPoint[]
  agents: AgentPublicResponse[]
  cities: string[]
  districts: string[]
}

export interface ManagerAnalyticsState {
  filters: ManagerAnalyticsFilters
  dateFrom: string
  dateTo: string
  interval: 'day' | 'week' | 'month'
  data: ManagerAnalyticsData
  loading: boolean
  error: string | null
  partialError: string | null
  setFilters: (updates: Partial<ManagerAnalyticsFilters>) => void
  clearFilters: () => void
}

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const daysAgo = (days: number) => {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const yearStart = () => {
  const d = new Date()
  return `${d.getFullYear()}-01-01`
}

function dateRangeFromPreset(
  preset: DateRangePreset,
  customFrom: string,
  customTo: string,
): { from: string; to: string; interval: 'day' | 'week' | 'month' } {
  switch (preset) {
    case 'last30':
      return { from: daysAgo(30), to: today(), interval: 'day' }
    case 'lastQuarter':
      return { from: daysAgo(90), to: today(), interval: 'week' }
    case 'ytd':
      return { from: yearStart(), to: today(), interval: 'month' }
    case 'custom':
    default: {
      const from = customFrom || daysAgo(30)
      const to = customTo || today()
      const start = new Date(from)
      const end = new Date(to)
      const diff = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      let interval: 'day' | 'week' | 'month' = 'day'
      if (diff > 180) interval = 'month'
      else if (diff > 31) interval = 'week'
      return { from, to, interval }
    }
  }
}

function toDateTime(value: string, end = false): string {
  const time = end ? '23:59:59' : '00:00:00'
  return `${value}T${time}+00:00`
}

const emptyData: ManagerAnalyticsData = {
  searchRequestsSeries: null,
  contractsSeries: null,
  leadAnalytics: null,
  appointmentAnalytics: null,
  agentAnalytics: null,
  heatMapPoints: [],
  agents: [],
  cities: [],
  districts: [],
}

export function useManagerAnalytics(): ManagerAnalyticsState {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters = useMemo<ManagerAnalyticsFilters>(() => {
    const preset = (searchParams.get('preset') as DateRangePreset) || 'last30'
    return {
      preset,
      customDateFrom: searchParams.get('customDateFrom') || daysAgo(30),
      customDateTo: searchParams.get('customDateTo') || today(),
      city: searchParams.get('city') || '',
      district: searchParams.get('district') || '',
      agentId: searchParams.get('agentId') || '',
    }
  }, [searchParams])

  const { dateFrom, dateTo, interval } = useMemo(() => {
    const range = dateRangeFromPreset(filters.preset, filters.customDateFrom, filters.customDateTo)
    return {
      dateFrom: toDateTime(range.from),
      dateTo: toDateTime(range.to, true),
      interval: range.interval,
    }
  }, [filters.preset, filters.customDateFrom, filters.customDateTo])

  const [data, setData] = useState<ManagerAnalyticsData>(emptyData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [partialError, setPartialError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setPartialError(null)

    const dateFromIso = dateFrom
    const dateToIso = dateTo
    const commonParams = {
      date_from: dateFromIso,
      date_to: dateToIso,
      city: filters.city || undefined,
      district: filters.district || undefined,
    }

    const timeSeriesParams = {
      ...commonParams,
      interval,
      agent_id: filters.agentId || undefined,
    }

    const fetchAll = async () => {
      try {
        const results = await Promise.allSettled([
          adminAnalyticsApi.getTimeSeries({ metric: 'search_requests', ...timeSeriesParams }),
          adminAnalyticsApi.getTimeSeries({ metric: 'contracts', ...timeSeriesParams }),
          adminAnalyticsApi.getLeadAnalytics(commonParams),
          adminAnalyticsApi.getAppointmentAnalytics({
            ...commonParams,
            agent_id: filters.agentId || undefined,
          }),
          adminAnalyticsApi.getAgentAnalytics({
            order_by: 'completed_appointments',
            limit: 5,
          }),
          adminAnalyticsApi.getHeatMap(),
          adminAgentsApi.listAgents({ limit: 100 }),
        ])

        if (cancelled) return

        const errors: string[] = []
        const [searchRequests, contracts, leads, appointments, agents, heatMap, agentList] = results

        if (searchRequests.status === 'rejected') {
          errors.push('search request trends')
        }
        if (contracts.status === 'rejected') {
          errors.push('contract trends')
        }
        if (leads.status === 'rejected') {
          errors.push('lead analytics')
        }
        if (appointments.status === 'rejected') {
          errors.push('appointment analytics')
        }
        if (agents.status === 'rejected') {
          errors.push('agent analytics')
        }
        if (heatMap.status === 'rejected') {
          errors.push('heat map')
        }
        if (agentList.status === 'rejected') {
          errors.push('agent list')
        }

        if (errors.length > 0 && errors.length < 7) {
          setPartialError(`Some data could not be loaded: ${errors.join(', ')}`)
        }

        if (errors.length === 7) {
          setError('Failed to load analytics data.')
          setLoading(false)
          return
        }

        const allHeatMap = heatMap.status === 'fulfilled' ? heatMap.value : []
        const cities = Array.from(
          new Set(allHeatMap.map((p) => p.city).filter((c) => !!c))
        ).sort()
        const districts = Array.from(
          new Set(
            allHeatMap
              .filter((p) => (filters.city ? p.city === filters.city : true))
              .map((p) => p.district)
              .filter((d) => !!d)
          )
        ).sort()

        setData({
          searchRequestsSeries: searchRequests.status === 'fulfilled' ? searchRequests.value : null,
          contractsSeries: contracts.status === 'fulfilled' ? contracts.value : null,
          leadAnalytics: leads.status === 'fulfilled' ? leads.value : null,
          appointmentAnalytics: appointments.status === 'fulfilled' ? appointments.value : null,
          agentAnalytics: agents.status === 'fulfilled' ? agents.value : null,
          heatMapPoints: allHeatMap,
          agents: agentList.status === 'fulfilled' ? agentList.value : [],
          cities,
          districts,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics data.')
      } finally {
        setLoading(false)
      }
    }

    fetchAll()

    return () => {
      cancelled = true
    }
  }, [dateFrom, dateTo, interval, filters.city, filters.district, filters.agentId])

  const setFilters = (updates: Partial<ManagerAnalyticsFilters>) => {
    const next = { ...filters, ...updates }
    const params = new URLSearchParams()
    if (next.preset !== 'last30') params.set('preset', next.preset)
    if (next.preset === 'custom') {
      params.set('customDateFrom', next.customDateFrom)
      params.set('customDateTo', next.customDateTo)
    }
    if (next.city) params.set('city', next.city)
    if (next.district) params.set('district', next.district)
    if (next.agentId) params.set('agentId', next.agentId)
    setSearchParams(params, { replace: true })
  }

  const clearFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true })
  }

  return {
    filters,
    dateFrom,
    dateTo,
    interval,
    data,
    loading,
    error,
    partialError,
    setFilters,
    clearFilters,
  }
}
