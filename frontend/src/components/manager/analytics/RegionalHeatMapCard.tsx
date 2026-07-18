import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, Popup, Polygon } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { Card, SectionHeader, LoadingState, EmptyState } from '../../ui/shared'
import { TUNISIA_CENTER, TUNISIA_BOUNDS } from '../../../lib/tunisiaMap'
import { TUNISIA_POLYGON } from '../../../lib/tunisiaPolygon'
import type { HeatMapPoint } from '../../../lib/adminAnalyticsApi'

const DEMAND_COLORS: Record<string, string> = {
  low: '#93c5fd',
  medium: '#fbbf24',
  high: '#f97316',
  very_high: '#ef4444',
}

const DEMAND_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  very_high: 'Very high',
}

interface RegionalHeatMapCardProps {
  points: HeatMapPoint[]
  cityFilter: string
  districtFilter: string
  loading?: boolean
  error?: string | null
}

export default function RegionalHeatMapCard({
  points,
  cityFilter,
  districtFilter,
  loading,
  error,
}: RegionalHeatMapCardProps) {
  const filteredPoints = useMemo(() => {
    return points.filter((p) => {
      if (cityFilter && p.city !== cityFilter) return false
      if (districtFilter && p.district !== districtFilter) return false
      return p.latitude && p.longitude
    })
  }, [points, cityFilter, districtFilter])

  const mapCenter = useMemo(() => {
    if (filteredPoints.length === 0) return TUNISIA_CENTER
    const lats = filteredPoints.map((p) => Number(p.latitude))
    const lngs = filteredPoints.map((p) => Number(p.longitude))
    return [
      (Math.min(...lats) + Math.max(...lats)) / 2,
      (Math.min(...lngs) + Math.max(...lngs)) / 2,
    ] as [number, number]
  }, [filteredPoints])

  const mapZoom = filteredPoints.length > 0 ? 10 : 8

  if (loading) {
    return (
      <Card className="h-[400px]">
        <SectionHeader title="Regional Heat Map" />
        <LoadingState message="Loading heat map…" />
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="h-[400px]">
        <SectionHeader title="Regional Heat Map" />
        <p className="text-sm text-gray-500">{error}</p>
      </Card>
    )
  }

  return (
    <Card className="h-[480px]">
      <div className="flex items-center justify-between mb-4">
        <SectionHeader title="Regional Heat Map" />
        <Link
          to="/admin/analytics/heat-map"
          className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
        >
          Expand full market view
        </Link>
      </div>

      <div className="h-[360px] rounded-2xl overflow-hidden border border-slate-200/80">
        {filteredPoints.length === 0 ? (
          <div className="h-full flex items-center justify-center bg-surface-muted/50">
            <EmptyState title="No heat map data" description="Adjust filters to load market areas." />
          </div>
        ) : (
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            maxBounds={TUNISIA_BOUNDS}
            maxBoundsViscosity={1.0}
            minZoom={7}
            maxZoom={17}
            className="h-full w-full"
            attributionControl={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <Polygon
              positions={[
                [
                  [-90, -180],
                  [90, -180],
                  [90, 180],
                  [-90, 180],
                  [-90, -180],
                ],
                TUNISIA_POLYGON,
              ]}
              pathOptions={{
                color: 'transparent',
                weight: 0,
                fillColor: '#a5d8ff',
                fillOpacity: 0.85,
              }}
            />
            {filteredPoints.map((point) => {
              const color = DEMAND_COLORS[point.demand_level] ?? '#6b7280'
              const radius = 12 + (point.normalized_demand || 0) * 18
              return (
                <CircleMarker
                  key={point.id}
                  center={[Number(point.latitude), Number(point.longitude)]}
                  radius={radius}
                  pathOptions={{
                    fillColor: color,
                    color: 'white',
                    weight: 1.5,
                    fillOpacity: 0.75,
                  }}
                >
                  <Popup>
                    <div className="space-y-1 text-sm">
                      <p className="font-semibold">
                        {point.district}, {point.city}
                      </p>
                      <p>Demand: {DEMAND_LABELS[point.demand_level] ?? point.demand_level}</p>
                      <p>
                        Avg price/m²:{' '}
                        {point.average_price_per_sqm
                          ? `${Number(point.average_price_per_sqm).toLocaleString()} TND`
                          : '—'}
                      </p>
                      <p>Transactions: {point.transaction_count}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              )
            })}
          </MapContainer>
        )}
      </div>
    </Card>
  )
}
