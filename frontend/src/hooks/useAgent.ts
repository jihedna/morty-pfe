import { useState, useEffect, useCallback } from 'react'
import { adminAgentsApi, AgentPublicResponse } from '../lib/adminAgentsApi'

interface UseAgentResult {
  data: AgentPublicResponse | null
  isLoading: boolean
  error: string | null
}

export function useAgent(agentId: string | null | undefined): UseAgentResult {
  const [data, setData] = useState<AgentPublicResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAgent = useCallback(async () => {
    if (!agentId) {
      setData(null)
      setError(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const result = await adminAgentsApi.getAgent(agentId)
      setData(result)
    } catch (err) {
      setData(null)
      setError(err instanceof Error ? err.message : 'Failed to fetch agent')
    } finally {
      setIsLoading(false)
    }
  }, [agentId])

  useEffect(() => {
    fetchAgent()
  }, [fetchAgent])

  return { data, isLoading, error }
}
