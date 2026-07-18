import { useMemo, useState } from 'react'

export interface ChartPoint {
  period: string
  label: string
  leads: number
  conversion: number
}

interface ComposedChartProps {
  data: ChartPoint[]
  loading?: boolean
  error?: string | null
  emptyTitle?: string
  emptyDescription?: string
}

const VIEW_WIDTH = 800
const VIEW_HEIGHT = 320
const MARGIN = { top: 24, right: 48, bottom: 56, left: 48 }

const PRIMARY = '#B5000B'
const PRIMARY_20 = 'rgba(181, 0, 11, 0.2)'
const TERTIARY = '#0055B7'
const GRID = '#e2e8f0'
const TEXT = '#64748b'

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toLocaleString()
}

export default function ComposedChart({
  data,
  loading,
  error,
  emptyTitle = 'No chart data',
  emptyDescription = 'Adjust filters to see lead volume and conversion trends.',
}: ComposedChartProps) {
  const [hovered, setHovered] = useState<number | null>(null)

  const innerWidth = VIEW_WIDTH - MARGIN.left - MARGIN.right
  const innerHeight = VIEW_HEIGHT - MARGIN.top - MARGIN.bottom

  const maxLeads = useMemo(() => {
    if (data.length === 0) return 1
    return Math.max(...data.map((d) => d.leads), 1)
  }, [data])

  const barSlot = data.length > 0 ? innerWidth / data.length : 0
  const barWidth = Math.max(8, barSlot * 0.5)

  const xFor = (i: number) => MARGIN.left + (i + 0.5) * barSlot
  const yFor = (value: number, max: number) =>
    MARGIN.top + innerHeight - (value / max) * innerHeight
  const yForConversion = (value: number) =>
    MARGIN.top + innerHeight - (value / 100) * innerHeight

  const linePoints = data.map((d, i) => ({
    x: xFor(i),
    y: yForConversion(d.conversion),
    value: d.conversion,
  }))

  const linePath = useMemo(() => {
    if (linePoints.length === 0) return ''
    return linePoints
      .map((p, i) => {
        if (i === 0) return `M ${p.x} ${p.y}`
        const prev = linePoints[i - 1]
        const cp1x = prev.x + (p.x - prev.x) / 3
        const cp1y = prev.y
        const cp2x = p.x - (p.x - prev.x) / 3
        const cp2y = p.y
        return `C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p.x} ${p.y}`
      })
      .join(' ')
  }, [linePoints])

  const yTicks = 5
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) =>
    Math.round((maxLeads / yTicks) * i)
  )
  const conversionTicks = Array.from({ length: yTicks + 1 }, (_, i) => i * 20)

  if (loading) {
    return (
      <div className="h-80 w-full rounded-2xl border border-slate-200/80 bg-surface-muted/50 flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading chart…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-80 w-full rounded-2xl border border-slate-200/80 bg-surface-muted/50 flex items-center justify-center px-6 text-center">
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="h-80 w-full rounded-2xl border border-slate-200/80 bg-surface-muted/50 flex flex-col items-center justify-center px-6 text-center">
        <p className="text-sm font-medium text-gray-900">{emptyTitle}</p>
        <p className="text-sm text-gray-500 mt-1">{emptyDescription}</p>
      </div>
    )
  }

  return (
    <div className="h-80 w-full">
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className="w-full h-full"
        role="img"
        aria-label="Lead volume and conversion rate chart"
      >
        {/* Grid lines */}
        {yTickValues.map((tick, i) => {
          const y = yFor(tick, maxLeads)
          return (
            <line
              key={`grid-${i}`}
              x1={MARGIN.left}
              y1={y}
              x2={MARGIN.left + innerWidth}
              y2={y}
              stroke={GRID}
              strokeDasharray="4 4"
            />
          )
        })}

        {/* Left Y-axis labels */}
        {yTickValues.map((tick, i) => (
          <text
            key={`left-label-${i}`}
            x={MARGIN.left - 8}
            y={yFor(tick, maxLeads) + 4}
            textAnchor="end"
            fontSize="10"
            fill={TEXT}
          >
            {formatNumber(tick)}
          </text>
        ))}

        {/* Right Y-axis labels */}
        {conversionTicks.map((tick, i) => (
          <text
            key={`right-label-${i}`}
            x={MARGIN.left + innerWidth + 8}
            y={yForConversion(tick) + 4}
            textAnchor="start"
            fontSize="10"
            fill={TEXT}
          >
            {tick}%
          </text>
        ))}

        {/* X-axis labels */}
        {data.map((d, i) => (
          <text
            key={`x-label-${i}`}
            x={xFor(i)}
            y={VIEW_HEIGHT - 16}
            textAnchor="middle"
            fontSize="10"
            fill={TEXT}
            transform={`rotate(-30, ${xFor(i)}, ${VIEW_HEIGHT - 16})`}
          >
            {d.label}
          </text>
        ))}

        {/* Bars */}
        {data.map((d, i) => {
          const h = (d.leads / maxLeads) * innerHeight
          const x = xFor(i) - barWidth / 2
          const y = yFor(d.leads, maxLeads)
          return (
            <g
              key={`bar-${i}`}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer"
            >
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={h}
                rx={3}
                fill={PRIMARY_20}
                stroke={PRIMARY}
                strokeWidth={1}
              />
              {hovered === i && (
                <g>
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={h}
                    rx={3}
                    fill={PRIMARY}
                    opacity={0.15}
                  />
                </g>
              )}
            </g>
          )
        })}

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={TERTIARY}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Line points */}
        {linePoints.map((p, i) => (
          <g
            key={`point-${i}`}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            className="cursor-pointer"
          >
            <circle
              cx={p.x}
              cy={p.y}
              r={hovered === i ? 6 : 4}
              fill={TERTIARY}
              stroke="white"
              strokeWidth={2}
            />
          </g>
        ))}

        {/* Tooltip */}
        {hovered !== null && data[hovered] && (
          <g>
            <rect
              x={xFor(hovered) - 70}
              y={MARGIN.top - 12}
              width={140}
              height={56}
              rx={6}
              fill="white"
              stroke={GRID}
              strokeWidth={1}
              opacity={0.95}
            />
            <text
              x={xFor(hovered)}
              y={MARGIN.top + 8}
              textAnchor="middle"
              fontSize="10"
              fill="#1f2937"
              fontWeight={600}
            >
              {data[hovered].label}
            </text>
            <text
              x={xFor(hovered)}
              y={MARGIN.top + 26}
              textAnchor="middle"
              fontSize="10"
              fill={PRIMARY}
            >
              {formatNumber(data[hovered].leads)} leads
            </text>
            <text
              x={xFor(hovered)}
              y={MARGIN.top + 42}
              textAnchor="middle"
              fontSize="10"
              fill={TERTIARY}
            >
              {data[hovered].conversion.toFixed(1)}% conversion
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}
