import { useEffect, useState } from 'react'
import { mlApi, type ModelStatus } from '../../lib/mlApi'
import Card from '../../components/ui/Card'
import { LoadingState, ErrorState, PageContainer } from '../../components/ui/shared'

const STATUS_COLORS: Record<string, string> = {
  ready: 'bg-green-100 text-green-700',
  not_trained: 'bg-slate-100 text-slate-600',
  insufficient_training_data: 'bg-amber-100 text-amber-700',
  failed: 'bg-red-100 text-red-700',
  disabled: 'bg-slate-100 text-slate-500',
}

export default function ManagerMLModels() {
  const [models, setModels] = useState<ModelStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoading(true)
        const res = await mlApi.listModels()
        setModels(res.models)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load models')
      } finally {
        setLoading(false)
      }
    }
    fetchModels()
  }, [])

  if (loading) return <LoadingState message="Loading ML models..." />
  if (error) return <ErrorState message={error} />

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">ML Models Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Monitor the status and performance of machine learning models.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {models.map((model) => (
          <Card key={model.model_name} className="p-5">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">{model.display_name}</h3>
                <p className="text-xs text-slate-500">{model.purpose}</p>
              </div>
              <span
                className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_COLORS[model.status] || 'bg-slate-100 text-slate-600'}`}
              >
                {model.status.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Type:</span>
                <span className="font-medium">{model.model_type}</span>
              </div>
              {model.version && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Version:</span>
                  <span className="font-medium">{model.version}</span>
                </div>
              )}
              {model.trained_at && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Trained:</span>
                  <span className="font-medium">{new Date(model.trained_at).toLocaleDateString()}</span>
                </div>
              )}
              {model.training_rows !== null && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Training rows:</span>
                  <span className="font-medium">{model.training_rows}</span>
                </div>
              )}
              {model.validation_rows !== null && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Validation rows:</span>
                  <span className="font-medium">{model.validation_rows}</span>
                </div>
              )}
              {model.target_definition && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Target:</span>
                  <span className="font-medium text-right text-xs">{model.target_definition}</span>
                </div>
              )}
            </div>

            <div className="mt-3 rounded-md bg-blue-50 p-2 text-xs text-blue-700">
              {model.status === 'ready'
                ? 'Model is active and serving predictions.'
                : model.status === 'insufficient_training_data'
                  ? 'Not enough data to train. Using fallback heuristics.'
                  : model.status === 'not_trained'
                    ? 'Model has not been trained yet. Using fallback heuristics.'
                    : 'Model is not currently active.'}
            </div>
          </Card>
        ))}
      </div>
    </PageContainer>
  )
}
