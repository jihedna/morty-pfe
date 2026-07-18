import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { mlApi, type RecommendationItem } from '../../lib/mlApi'
import Card from '../../components/ui/Card'
import { LoadingState, ErrorState, EmptyState, PageContainer } from '../../components/ui/shared'

export default function ClientRecommendations() {
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fallback, setFallback] = useState(false)

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true)
        const res = await mlApi.getRecommendations({ limit: 10 })
        setRecommendations(res.recommendations)
        setFallback(res.fallback)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load recommendations')
      } finally {
        setLoading(false)
      }
    }
    fetchRecommendations()
  }, [])

  if (loading) return <LoadingState message="Finding properties you might like..." />
  if (error) return <ErrorState message={error} />
  if (recommendations.length === 0)
    return (
      <EmptyState
        title="No recommendations yet"
        description="Browse properties and save your favorites to get personalized recommendations."
        action={<Link to="/properties" className="text-sm font-medium text-blue-600 hover:text-blue-700">Browse Properties →</Link>}
      />
    )

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Recommended for You</h1>
        <p className="mt-1 text-sm text-slate-500">
          {fallback
            ? 'Popular properties — personalized recommendations will appear as you interact with more listings.'
            : 'Personalized recommendations based on your preferences and activity.'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {recommendations.map((rec) => (
          <Card key={rec.property_id} className="p-4 hover:shadow-md transition-shadow">
            <Link to={`/properties/${rec.property_id}`} className="block">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-blue-600">#{rec.rank}</span>
                <span className="text-xs text-slate-400">
                  {Math.round(rec.score * 100)}% match
                </span>
              </div>
              <h3 className="font-semibold text-slate-900">Property {rec.property_id.slice(0, 8)}</h3>
              <ul className="mt-2 space-y-1">
                {rec.reasons.map((reason, i) => (
                  <li key={i} className="text-xs text-slate-500">
                    • {reason}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm font-medium text-blue-600">View details →</p>
            </Link>
          </Card>
        ))}
      </div>
    </PageContainer>
  )
}
