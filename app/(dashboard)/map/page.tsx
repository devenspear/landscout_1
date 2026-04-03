'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { SlidersHorizontal } from 'lucide-react'
import type { ParcelWithRelations } from '@/lib/types'

const TILE_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
const DEFAULT_CENTER: [number, number] = [-82, 34]
const DEFAULT_ZOOM = 5.5
const STATES = ['All', 'VA', 'NC', 'SC', 'GA', 'FL', 'AL']

function markerColor(score: number): string {
  if (score >= 80) return '#22c55e'
  if (score >= 60) return '#f59e0b'
  return '#ef4444'
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(n)
}

export default function MapPage() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const popupRef = useRef<maplibregl.Popup | null>(null)
  const sourceReady = useRef(false)

  const [parcels, setParcels] = useState<ParcelWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [stateFilter, setStateFilter] = useState('All')
  const [minScore, setMinScore] = useState(0)

  useEffect(() => {
    async function fetchParcels() {
      try {
        const res = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ limit: 500 }),
        })
        if (res.ok) {
          const data = await res.json()
          setParcels(data.parcels ?? [])
        }
      } catch { /* expected during SSR */ }
      finally { setLoading(false) }
    }
    fetchParcels()
  }, [])

  const filtered = parcels.filter((p) => {
    const score = p.fitScore?.overallScore ?? 0
    if (score < minScore) return false
    if (stateFilter !== 'All' && p.state !== stateFilter) return false
    return true
  })

  const buildGeoJSON = useCallback(
    (data: ParcelWithRelations[]): GeoJSON.FeatureCollection => ({
      type: 'FeatureCollection',
      features: data
        .filter((p) => p.lat != null && p.lon != null)
        .map((p) => {
          const score = p.fitScore?.overallScore ?? 0
          const price = p.listings?.[0]?.price ?? null
          return {
            type: 'Feature' as const,
            geometry: { type: 'Point' as const, coordinates: [p.lon!, p.lat!] },
            properties: {
              id: p.id,
              name: p.address || `${p.county}, ${p.state}`,
              county: p.county,
              state: p.state,
              acreage: p.acreage,
              score,
              price,
              color: markerColor(score),
            },
          }
        }),
    }),
    []
  )

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: TILE_STYLE,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: false,
    })

    map.addControl(new maplibregl.NavigationControl(), 'top-right')
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left')

    map.on('load', () => {
      map.addSource('parcels', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })

      map.addLayer({
        id: 'parcel-circles',
        type: 'circle',
        source: 'parcels',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, 5, 8, 8, 12, 13],
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.85,
          'circle-stroke-width': 1.5,
          'circle-stroke-color': 'rgba(255,255,255,0.3)',
        },
      })

      map.on('click', 'parcel-circles', (e) => {
        const feature = e.features?.[0]
        if (!feature || feature.geometry.type !== 'Point') return
        const props = feature.properties
        const coords = feature.geometry.coordinates.slice() as [number, number]
        const priceStr = props.price ? formatCurrency(props.price) : 'No price listed'

        if (popupRef.current) popupRef.current.remove()
        popupRef.current = new maplibregl.Popup({ closeButton: true, maxWidth: '280px' })
          .setLngLat(coords)
          .setHTML(
            `<div style="font-family:system-ui,sans-serif;color:#e5e7eb;">
              <div style="font-weight:600;font-size:14px;margin-bottom:6px;color:#f9fafb;">${props.name}</div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 12px;font-size:12px;">
                <span style="color:#9ca3af;">Score</span>
                <span style="font-weight:600;color:${props.color};">${props.score}</span>
                <span style="color:#9ca3af;">Acreage</span>
                <span>${Math.round(props.acreage).toLocaleString()} ac</span>
                <span style="color:#9ca3af;">Price</span>
                <span>${priceStr}</span>
                <span style="color:#9ca3af;">State</span>
                <span>${props.state}</span>
              </div>
            </div>`
          )
          .addTo(map)
      })

      map.on('mouseenter', 'parcel-circles', () => { map.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', 'parcel-circles', () => { map.getCanvas().style.cursor = '' })

      sourceReady.current = true
    })

    mapRef.current = map
    return () => {
      if (popupRef.current) popupRef.current.remove()
      map.remove()
      mapRef.current = null
      sourceReady.current = false
    }
  }, [])

  // Update data when parcels or filters change
  useEffect(() => {
    const map = mapRef.current
    if (!map || !sourceReady.current) return

    const source = map.getSource('parcels') as maplibregl.GeoJSONSource | undefined
    if (source) {
      source.setData(buildGeoJSON(filtered))
    }
  }, [filtered, buildGeoJSON])

  return (
    <div className="relative h-[calc(100vh-4rem)] -mx-4 -mt-6 sm:-mx-6 lg:-mx-8">
      {/* Filter Controls */}
      <div className="absolute left-4 top-4 z-10 flex items-center gap-3 rounded-xl bg-gray-900/90 px-4 py-3 shadow-xl backdrop-blur-sm border border-gray-700/50">
        <SlidersHorizontal className="h-4 w-4 text-gray-400 flex-shrink-0" />
        <select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          className="rounded-lg bg-gray-800 px-3 py-1.5 text-sm text-gray-200 border border-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
        >
          {STATES.map((s) => (
            <option key={s} value={s}>{s === 'All' ? 'All States' : s}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 whitespace-nowrap">Min Score</span>
          <input type="range" min={0} max={100} value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="w-24 accent-emerald-500" />
          <span className="text-xs font-medium text-gray-200 w-7 text-right tabular-nums">{minScore}</span>
        </div>
        <div className="border-l border-gray-700 pl-3">
          <span className="text-xs text-gray-400">
            {loading ? '...' : `${filtered.filter((p) => p.lat && p.lon).length} parcels`}
          </span>
        </div>
      </div>

      <div ref={mapContainer} className="h-full w-full" />

      {/* Legend */}
      <div className="absolute bottom-6 right-4 z-10 rounded-xl bg-gray-900/90 px-4 py-3 shadow-xl backdrop-blur-sm border border-gray-700/50">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Fit Score</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-full bg-emerald-500" /><span className="text-xs text-gray-300">80+ High</span></div>
          <div className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-full bg-amber-500" /><span className="text-xs text-gray-300">60-79 Medium</span></div>
          <div className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-full bg-red-500" /><span className="text-xs text-gray-300">&lt;60 Low</span></div>
        </div>
      </div>

      <style jsx global>{`
        .maplibregl-popup-content {
          background: #1f2937 !important;
          border: 1px solid rgba(75, 85, 99, 0.5) !important;
          border-radius: 12px !important;
          padding: 12px 14px !important;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5) !important;
        }
        .maplibregl-popup-close-button { color: #9ca3af !important; font-size: 18px !important; padding: 2px 6px !important; }
        .maplibregl-popup-close-button:hover { color: #f9fafb !important; background: transparent !important; }
        .maplibregl-popup-tip { border-top-color: #1f2937 !important; border-bottom-color: #1f2937 !important; }
      `}</style>
    </div>
  )
}
