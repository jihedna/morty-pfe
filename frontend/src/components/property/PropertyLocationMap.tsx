import { useEffect, useRef, useState } from 'react'
import { TUNISIA_BOUNDS } from '../../lib/tunisiaMap'

interface PropertyLocationMapProps {
  latitude: number
  longitude: number
  title: string
}

export function PropertyLocationMap({ latitude, longitude, title }: PropertyLocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapError, setMapError] = useState(false)

  useEffect(() => {
    if (!mapRef.current || mapError || typeof window === 'undefined') return

    let mapInstance: import('leaflet').Map | null = null
    let marker: import('leaflet').Marker | null = null
    let mounted = true

    const initMap = async () => {
      try {
        const L = (await import('leaflet')).default
        const mapContainer = mapRef.current
        if (!mapContainer || !mounted || typeof window === 'undefined') return

        mapInstance = L.map(mapContainer, {
          maxBounds: TUNISIA_BOUNDS,
          maxBoundsViscosity: 1.0,
          minZoom: 6,
          maxZoom: 19,
        }).setView([latitude, longitude], 15)

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(mapInstance)

        marker = L.marker([latitude, longitude]).addTo(mapInstance)
        marker.bindPopup(title).openPopup()
      } catch (error) {
        if (mounted && typeof window !== 'undefined') {
          setMapError(true)
        }
      }
    }

    initMap()

    return () => {
      mounted = false
      if (mapInstance) {
        mapInstance.remove()
      }
    }
  }, [latitude, longitude, title, mapError])

  if (mapError) {
    return (
      <div className="h-64 rounded-2xl bg-surface-muted border border-slate-200 flex items-center justify-center text-navy-500">
        Unable to load map.
      </div>
    )
  }

  return (
    <div
      ref={mapRef}
      className="h-64 md:h-80 rounded-2xl border border-slate-200 bg-surface-muted"
      aria-label={`Map location for ${title}`}
      role="img"
    />
  )
}
