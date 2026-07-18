import { PropertyFeature } from '../../types/property'
import { getFeatureLabel } from '../../utils/format'

interface PropertyFeaturesProps {
  features: PropertyFeature[]
}

export function PropertyFeatures({ features }: PropertyFeaturesProps) {
  if (!features || features.length === 0) {
    return (
      <div className="text-navy-500 italic">
        No specific features listed for this property.
      </div>
    )
  }

  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {features.map((feature) => (
        <li key={feature.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-slate-100">
          <div className="w-8 h-8 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="text-navy-800 font-medium text-sm">{getFeatureLabel(feature.feature)}</span>
        </li>
      ))}
    </ul>
  )
}
