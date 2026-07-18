import { useEffect, useMemo, useRef } from 'react'
import { PropertyMapItem } from '../../../types/property'
import { addTunisiaMask, TUNISIA_CENTER, TUNISIA_BOUNDS } from '../../../lib/tunisiaMap'
import { isValidCoordinates, toLeafletPosition } from '../../../lib/coordinateUtils'
import 'leaflet/dist/leaflet.css'

interface PropertySearchMapProps {
  properties: PropertyMapItem[]
  hoveredPropertyId: string | null
  selectedPropertyId: string | null
  onPropertyHover: (propertyId: string | null) => void
  onPropertySelect: (propertyId: string) => void
}

type CircleMarkerOptions = import('leaflet').CircleMarkerOptions

const NORMAL_STYLE: CircleMarkerOptions = {
  radius: 4,
  fillColor: '#1e293b',
  color: '#ffffff',
  weight: 1,
  fillOpacity: 1,
  opacity: 1,
}

const HIGHLIGHTED_STYLE: CircleMarkerOptions = {
  radius: 6,
  fillColor: '#2563eb',
  color: '#ffffff',
  weight: 2,
  fillOpacity: 1,
  opacity: 1,
}

export function PropertySearchMap({
  properties,
  hoveredPropertyId,
  selectedPropertyId,
  onPropertyHover,
  onPropertySelect,
}: PropertySearchMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<import('leaflet').Map | null>(null)
  const markersRef = useRef<Record<string, import('leaflet').CircleMarker>>({})
  const LRef = useRef<typeof import('leaflet') | null>(null)

  const validProperties = useMemo(() => {
    return properties.filter((property) => 
      isValidCoordinates({ latitude: property.latitude, longitude: property.longitude })
    )
  }, [properties])

  useEffect(() => {
    let isMounted = true

    const initMap = async () => {
      const L = (await import('leaflet')).default
      LRef.current = L
      if (!isMounted || !mapContainerRef.current) return

      const map = L.map(mapContainerRef.current, {
        maxBounds: TUNISIA_BOUNDS,
        maxBoundsViscosity: 1.0,
        minZoom: 6,
        maxZoom: 19,
        renderer: L.canvas(),
      }).setView(TUNISIA_CENTER, 7)
      mapRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)

      addTunisiaMask(L, map)
    }

    initMap()

    return () => {
      isMounted = false
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const L = LRef.current
    const map = mapRef.current
    if (!L || !map) return

    const markers = markersRef.current

    Object.values(markers).forEach((m) => map.removeLayer(m))
    markersRef.current = {}

    const bounds = L.latLngBounds([])

    validProperties.forEach((property) => {
      const position = toLeafletPosition({ latitude: property.latitude, longitude: property.longitude })
      if (!position) return

      const normalizedId = String(property.id)
      const marker = L.circleMarker(position, NORMAL_STYLE).addTo(map)

      marker.on('click', () => {
        onPropertySelect(normalizedId)
      })
      marker.on('mouseover', () => {
        onPropertyHover(normalizedId)
      })
      marker.on('mouseout', () => {
        onPropertyHover(null)
      })

      markers[normalizedId] = marker
      bounds.extend(position)
    })

    if (validProperties.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 })
    }
  }, [validProperties, onPropertyHover, onPropertySelect])

  useEffect(() => {
    const markers = markersRef.current

    Object.entries(markers).forEach(([propertyId, marker]) => {
      const isHighlighted =
        hoveredPropertyId === propertyId || selectedPropertyId === propertyId
      marker.setStyle(isHighlighted ? HIGHLIGHTED_STYLE : NORMAL_STYLE)
    })
  }, [hoveredPropertyId, selectedPropertyId])

  return (
    <div
      ref={mapContainerRef}
      className="h-full min-h-[300px] rounded-2xl bg-surface-muted border border-slate-200 relative"
      aria-label="Property map"
      role="img"
    >
      {validProperties.length === 0 && (
        <div className="absolute inset-0 rounded-2xl bg-surface-muted/90 flex items-center justify-center text-navy-500 text-sm">
          No map locations available for current results.
        </div>
      )}
    </div>
  )
}
