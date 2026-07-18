import { useState } from 'react'

interface PropertyDescriptionProps {
  description: string | null | undefined
}

export function PropertyDescription({ description }: PropertyDescriptionProps) {
  const [expanded, setExpanded] = useState(false)
  const text = description?.trim() || ''
  const shouldClamp = text.length > 300

  if (!text) {
    return (
      <div className="text-navy-500 italic">
        No description available for this property.
      </div>
    )
  }

  return (
    <div>
      <p className={`text-navy-700 leading-relaxed ${expanded ? '' : 'line-clamp-4'}`}>{text}</p>
      {shouldClamp && (
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="mt-3 text-sm font-medium text-primary-600 hover:text-primary-700 focus:outline-none focus-visible:underline"
          aria-expanded={expanded}
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  )
}
