'use client'

import { useState, useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import {
  X,
  MapPin,
  Ruler,
  DollarSign,
  Droplets,
  Route,
  Mountain,
  Loader2,
  ExternalLink,
  Zap,
} from 'lucide-react'
import { formatCurrency, formatAcres } from '@/lib/utils'
import { SOURCES } from '@/lib/types'
import type { ParcelWithRelations } from '@/lib/types'

interface PropertyDetailProps {
  parcelId: string
  onClose: () => void
}

interface FullParcel extends ParcelWithRelations {
  ownership?: {
    ownerName: string | null
    ownerType: string | null
    taxAssessment: number | null
  } | null
}

interface ScoreBreakdownItem {
  label: string
  score: number
  weight: number
}

function miniMapMarkerColor(score: number): string {
  if (score >= 80) return '#22c55e'
  if (score >= 60) return '#f59e0b'
  return '#ef4444'
}

export default function PropertyDetail({ parcelId, onClose }: PropertyDetailProps) {
  const [parcel, setParcel] = useState<FullParcel | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const miniMapRef = useRef<HTMLDivElement>(null)
  const miniMapInstanceRef = useRef<maplibregl.Map | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/parcels/${parcelId}`)
        if (!res.ok) throw new Error(`Failed to load parcel (${res.status})`)
        const data = await res.json()
        if (!cancelled) setParcel(data)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Load failed')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [parcelId])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Mini-map initialization
  useEffect(() => {
    if (!parcel || parcel.lat == null || parcel.lon == null) return
    if (!miniMapRef.current) return

    // Tear down previous instance if parcel changed
    if (miniMapInstanceRef.current) {
      miniMapInstanceRef.current.remove()
      miniMapInstanceRef.current = null
    }

    const map = new maplibregl.Map({
      container: miniMapRef.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [parcel.lon, parcel.lat],
      zoom: 12,
      interactive: false,
      attributionControl: false,
    })

    const score = parcel.fitScore?.overallScore ?? 0
    const color = miniMapMarkerColor(score)

    const markerEl = document.createElement('div')
    markerEl.style.width = '14px'
    markerEl.style.height = '14px'
    markerEl.style.borderRadius = '50%'
    markerEl.style.backgroundColor = color
    markerEl.style.border = '2px solid rgba(255,255,255,0.6)'
    markerEl.style.boxShadow = `0 0 6px ${color}`

    new maplibregl.Marker({ element: markerEl })
      .setLngLat([parcel.lon, parcel.lat])
      .addTo(map)

    miniMapInstanceRef.current = map

    return () => {
      map.remove()
      miniMapInstanceRef.current = null
    }
  }, [parcel])

  function parseBreakdown(raw: string | undefined): ScoreBreakdownItem[] {
    if (!raw) return []
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed

      // Seed stores breakdown as flat Record<string, number> where values are
      // weighted contributions (acreage: 0-20, soils: 0-15, etc.).
      // Scale each to 0-100 for bar display.
      const maxWeights: Record<string, number> = {
        acreage: 20, soils: 15, location: 15, access: 15,
        water: 10, terrain: 10, utilities: 10, risk: 12, elevation: 5,
      }
      const labelMap: Record<string, string> = {
        acreage: 'Acreage', soils: 'Soils', location: 'Location',
        access: 'Access', water: 'Water', terrain: 'Terrain',
        utilities: 'Utilities', risk: 'Risk', elevation: 'Elevation',
      }

      if (typeof parsed === 'object') {
        return Object.entries(parsed).map(([key, val]) => {
          if (typeof val === 'number') {
            const maxW = maxWeights[key] ?? 20
            const scaled = Math.round((val / maxW) * 100)
            return { label: labelMap[key] ?? key, score: scaled, weight: maxW }
          }
          const v = val as Record<string, unknown>
          return { label: (v.label as string) ?? key, score: (v.score as number) ?? 0, weight: (v.weight as number) ?? 1 }
        })
      }
    } catch { /* ignore */ }
    return []
  }

  function parseReasons(raw: string | undefined): string[] {
    if (!raw) return []
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.map(String)
    } catch { /* ignore */ }
    return raw.split('\n').filter(Boolean)
  }

  function sourceLabel(listing: { sourceId: string; sourceName?: string }): string {
    if (listing.sourceName) return listing.sourceName
    return SOURCES.find((s) => s.id === listing.sourceId)?.name ?? listing.sourceId
  }

  function scoreRingColor(score: number): string {
    if (score >= 80) return 'stroke-emerald-500'
    if (score >= 60) return 'stroke-amber-500'
    return 'stroke-red-500'
  }

  function scoreTextColor(score: number): string {
    if (score >= 80) return 'text-emerald-400'
    if (score >= 60) return 'text-amber-400'
    return 'text-red-400'
  }

  function barColor(score: number): string {
    if (score >= 80) return 'bg-emerald-500'
    if (score >= 60) return 'bg-amber-500'
    return 'bg-red-500'
  }

  function stageBadge(stage: string): string {
    const map: Record<string, string> = {
      new: 'bg-blue-900/40 text-blue-400',
      qualified: 'bg-purple-900/40 text-purple-400',
      pursuit: 'bg-amber-900/40 text-amber-400',
      'under-contract': 'bg-emerald-900/40 text-emerald-400',
      closed: 'bg-green-900/40 text-green-400',
      passed: 'bg-gray-800 text-gray-500',
    }
    return map[stage] ?? 'bg-gray-800 text-gray-500'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop — click to close */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-gray-700 bg-gray-950 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-20 rounded-lg border border-gray-700 bg-gray-900 p-1.5 text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200"
        >
          <X className="h-4 w-4" />
        </button>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        ) : error ? (
          <div className="flex h-64 items-center justify-center">
            <p className="text-red-400">{error}</p>
          </div>
        ) : parcel ? (
          <div className="overflow-y-auto p-6">
            {/* Header + Metrics row */}
            <div className="mb-5 flex items-start justify-between gap-6 pr-8">
              <div className="flex items-start gap-3">
                <MapPin className="mt-1 h-5 w-5 flex-shrink-0 text-emerald-400" />
                <div>
                  <h2 className="text-xl font-bold text-gray-100">
                    {parcel.county}, {parcel.state}
                  </h2>
                  {parcel.address && <p className="text-sm text-gray-400">{parcel.address}</p>}
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-500">
                    {parcel.apn && <span>APN: {parcel.apn}</span>}
                    {parcel.zoning && <span>Zoning: {parcel.zoning}</span>}
                  </div>
                </div>
              </div>
              {/* Score ring */}
              {parcel.fitScore && (
                <div className="flex flex-col items-center">
                  <div className="relative h-14 w-14">
                    <svg className="h-14 w-14 -rotate-90" viewBox="0 0 64 64">
                      <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" className="text-gray-800" />
                      <circle cx="32" cy="32" r="28" fill="none" strokeWidth="4" strokeLinecap="round"
                        className={scoreRingColor(parcel.fitScore.overallScore)}
                        strokeDasharray={`${(parcel.fitScore.overallScore / 100) * 175.9} 175.9`}
                      />
                    </svg>
                    <span className={`absolute inset-0 flex items-center justify-center text-lg font-bold ${scoreTextColor(parcel.fitScore.overallScore)}`}>
                      {parcel.fitScore.overallScore}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[10px] text-gray-500">Fit Score</p>
                </div>
              )}
            </div>

            {/* Key metrics */}
            <div className="mb-5 grid grid-cols-4 gap-3">
              <MetricCard icon={Ruler} label="Acreage" value={formatAcres(parcel.acreage)} color="text-blue-400" />
              <MetricCard
                icon={DollarSign}
                label={parcel.listings[0]?.pricePerAcre ? `${formatCurrency(parcel.listings[0].pricePerAcre)}/ac` : 'Price'}
                value={parcel.listings[0]?.price ? formatCurrency(parcel.listings[0].price) : '--'}
                color="text-amber-400"
              />
              <MetricCard
                icon={Droplets}
                label="Water"
                value={parcel.features?.waterPresence ? 'Present' : 'None'}
                color={parcel.features?.waterPresence ? 'text-cyan-400' : 'text-gray-600'}
              />
              <MetricCard
                icon={Route}
                label="Road"
                value={parcel.features?.roadAccess ?? 'Unknown'}
                color="text-purple-400"
              />
            </div>

            {/* Two-column layout: Score Breakdown + Details */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Left: Score breakdown + reasons */}
              <div className="space-y-4">
                {parcel.fitScore && (() => {
                  const breakdown = parseBreakdown(parcel.fitScore.scoreBreakdown)
                  const reasons = parseReasons(parcel.fitScore.topReasons)
                  return (
                    <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
                      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Score Breakdown</h3>
                      {breakdown.length > 0 && (
                        <div className="space-y-1.5">
                          {breakdown.map((item, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="w-20 truncate text-right text-[11px] text-gray-400">{item.label}</span>
                              <div className="flex-1">
                                <div className="h-1.5 overflow-hidden rounded-full bg-gray-800">
                                  <div className={`h-full rounded-full ${barColor(item.score)}`} style={{ width: `${item.score}%` }} />
                                </div>
                              </div>
                              <span className="w-6 text-right text-[11px] tabular-nums text-gray-500">{item.score}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {reasons.length > 0 && (
                        <div className="mt-3 border-t border-gray-800 pt-3">
                          <h4 className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-gray-600">Top Reasons</h4>
                          <ul className="space-y-1">
                            {reasons.map((r, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-xs text-gray-300">
                                <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-emerald-500" />
                                {r}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {parcel.fitScore.autoFailed && (
                        <div className="mt-2 rounded-lg border border-red-900/40 bg-red-950/30 px-2 py-1.5 text-xs text-red-400">
                          Auto-failed: {parcel.fitScore.autoFailReason ?? 'Unknown'}
                        </div>
                      )}
                    </div>
                  )
                })()}

                {/* Deal status */}
                {parcel.deal && (
                  <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Deal Pipeline</h3>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${stageBadge(parcel.deal.stage)}`}>
                        {parcel.deal.stage.charAt(0).toUpperCase() + parcel.deal.stage.slice(1).replace('-', ' ')}
                      </span>
                      <span className="text-xs text-gray-500">
                        Priority: <span className="font-medium text-gray-300">{parcel.deal.priority}</span>
                      </span>
                    </div>
                    {parcel.deal.notes && <p className="mt-1.5 text-xs text-gray-400">{parcel.deal.notes}</p>}
                  </div>
                )}
              </div>

              {/* Right: Location, Sources, Features */}
              <div className="space-y-4">
                {/* Location */}
                <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Location</h3>
                  {parcel.lat != null && parcel.lon != null ? (
                    <div className="relative h-48 overflow-hidden rounded-lg">
                      <div ref={miniMapRef} className="h-full w-full" />
                      <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[10px] tabular-nums text-gray-400">
                        {parcel.lat.toFixed(5)}, {parcel.lon.toFixed(5)}
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-gray-700 bg-gray-800/40">
                      <p className="text-sm text-gray-500">No coordinates available</p>
                    </div>
                  )}
                </div>

                {/* Sources */}
                {parcel.listings.length > 0 && (
                  <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Sources ({parcel.listings.length})
                    </h3>
                    <div className="space-y-1.5">
                      {parcel.listings.map((listing) => (
                        <div key={listing.id} className="flex items-center justify-between text-xs">
                          <span className="text-gray-300">{sourceLabel(listing)}</span>
                          <div className="flex items-center gap-3">
                            <span className="tabular-nums text-gray-400">{listing.price ? formatCurrency(listing.price) : '--'}</span>
                            <span className="rounded-full bg-gray-800 px-1.5 py-0.5 text-[10px] text-gray-500">{listing.status}</span>
                            {listing.url && (
                              <a href={listing.url} target="_blank" rel="noopener noreferrer"
                                className="text-emerald-400 hover:text-emerald-300" onClick={(e) => e.stopPropagation()}>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Features grid */}
                {parcel.features && (
                  <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Features</h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                      {parcel.features.elevation != null && (
                        <FeatureRow icon={Mountain} label="Elevation" value={`${Math.round(parcel.features.elevation)} ft`} />
                      )}
                      {parcel.features.powerDistance != null && (
                        <FeatureRow icon={Zap} label="Power" value={`${parcel.features.powerDistance.toFixed(1)} mi`} />
                      )}
                      {parcel.features.soilsQuality != null && (
                        <FeatureRow label="Soils" value={`${parcel.features.soilsQuality.toFixed(1)}/10`} />
                      )}
                      {parcel.features.nearestMetro && (
                        <FeatureRow label="Metro" value={`${parcel.features.nearestMetro} (${parcel.features.metroDistance?.toFixed(0)} mi)`} />
                      )}
                      {parcel.features.floodZone && (
                        <FeatureRow label="Flood" value={parcel.features.inFloodway ? 'In Floodway' : parcel.features.floodZone} warn={parcel.features.inFloodway} />
                      )}
                      {parcel.features.wetlandsPercent != null && (
                        <FeatureRow label="Wetlands" value={`${parcel.features.wetlandsPercent.toFixed(1)}%`} warn={parcel.features.wetlandsPercent > 50} />
                      )}
                      {(() => {
                        // Bug 3 fix: parse waterFeatures JSON string
                        if (!parcel.features?.waterFeatures) return null
                        let text: string
                        try {
                          const arr = JSON.parse(parcel.features.waterFeatures)
                          text = Array.isArray(arr) ? arr.join(', ') : parcel.features.waterFeatures
                        } catch {
                          text = parcel.features.waterFeatures
                        }
                        return <FeatureRow icon={Droplets} label="Water" value={text} />
                      })()}
                      {(() => {
                        // Bug 5 fix: parse landCoverMix JSON string
                        if (!parcel.features?.landCoverMix) return null
                        let text: string
                        try {
                          const mix = JSON.parse(parcel.features.landCoverMix)
                          text = Object.entries(mix).map(([k, v]) => `${k} ${v}%`).join(', ')
                        } catch {
                          text = parcel.features.landCoverMix
                        }
                        return <FeatureRow label="Land Cover" value={text} />
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function MetricCard({ icon: Icon, label, value, color }: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  color: string
}) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/60 px-3 py-2.5 text-center">
      <Icon className={`mx-auto h-4 w-4 ${color}`} />
      <p className="mt-1 text-sm font-bold text-gray-100">{value}</p>
      <p className="text-[10px] text-gray-500">{label}</p>
    </div>
  )
}

function FeatureRow({ icon: Icon, label, value, warn }: {
  icon?: React.ComponentType<{ className?: string }>
  label: string
  value: string
  warn?: boolean
}) {
  return (
    <div className="flex items-center gap-1.5">
      {Icon && <Icon className="h-3 w-3 text-gray-600" />}
      <span className="text-gray-500">{label}:</span>
      <span className={`font-medium ${warn ? 'text-red-400' : 'text-gray-300'}`}>{value}</span>
    </div>
  )
}
