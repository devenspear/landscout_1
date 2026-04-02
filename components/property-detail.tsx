'use client'

import { useState, useEffect } from 'react'
import {
  X,
  MapPin,
  Ruler,
  DollarSign,
  Droplets,
  Route,
  Mountain,
  ShieldCheck,
  Loader2,
  ExternalLink,
  TreePine,
  Zap,
} from 'lucide-react'
import { formatCurrency, formatAcres, scoreBgColor } from '@/lib/utils'
import { SOURCES } from '@/lib/types'
import type { ParcelWithRelations } from '@/lib/types'

// ─── Types ──────────────────────────────────────────────────────────

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

// ─── Component ──────────────────────────────────────────────────────

export default function PropertyDetail({ parcelId, onClose }: PropertyDetailProps) {
  const [parcel, setParcel] = useState<FullParcel | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
    return () => {
      cancelled = true
    }
  }, [parcelId])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  // Parse scoreBreakdown JSON
  function parseBreakdown(raw: string | undefined): ScoreBreakdownItem[] {
    if (!raw) return []
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
      // Handle object format { key: { score, weight, label } }
      if (typeof parsed === 'object') {
        return Object.entries(parsed).map(([key, val]) => {
          const v = val as Record<string, unknown>
          return {
            label: (v.label as string) ?? key,
            score: (v.score as number) ?? 0,
            weight: (v.weight as number) ?? 1,
          }
        })
      }
    } catch {
      // not valid JSON
    }
    return []
  }

  function parseReasons(raw: string | undefined): string[] {
    if (!raw) return []
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.map(String)
    } catch {
      // not valid JSON, split by newlines
    }
    return raw.split('\n').filter(Boolean)
  }

  function sourceLabel(sourceId: string): string {
    return SOURCES.find((s) => s.id === sourceId)?.name ?? sourceId
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

  // ─── Render ─────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 flex h-full w-full flex-col overflow-y-auto border-l border-gray-800 bg-gray-950 md:w-2/3 lg:w-1/2">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-20 rounded-lg border border-gray-700 bg-gray-900 p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200"
        >
          <X className="h-4 w-4" />
        </button>

        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        ) : error ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-red-400">{error}</p>
          </div>
        ) : parcel ? (
          <div className="space-y-6 p-6 pt-14">
            {/* ─── Header ────────────────────────────── */}
            <div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-1 h-5 w-5 flex-shrink-0 text-emerald-400" />
                <div>
                  <h2 className="text-xl font-bold text-gray-100">
                    {parcel.county}, {parcel.state}
                  </h2>
                  {parcel.address && (
                    <p className="mt-0.5 text-sm text-gray-400">{parcel.address}</p>
                  )}
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-500">
                    {parcel.apn && <span>APN: {parcel.apn}</span>}
                    {parcel.zoning && <span>Zoning: {parcel.zoning}</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* ─── Key Metrics Row ────────────────────── */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
                <Ruler className="mx-auto h-5 w-5 text-blue-400" />
                <p className="mt-2 text-2xl font-bold text-gray-100">
                  {formatAcres(parcel.acreage)}
                </p>
                <p className="text-xs text-gray-500">Acreage</p>
              </div>
              <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
                <DollarSign className="mx-auto h-5 w-5 text-amber-400" />
                <p className="mt-2 text-2xl font-bold text-gray-100">
                  {parcel.listings[0]?.price
                    ? formatCurrency(parcel.listings[0].price)
                    : '--'}
                </p>
                <p className="text-xs text-gray-500">
                  {parcel.listings[0]?.pricePerAcre
                    ? `${formatCurrency(parcel.listings[0].pricePerAcre)}/ac`
                    : 'Price'}
                </p>
              </div>
              <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
                {/* Circular Score */}
                {parcel.fitScore ? (
                  <>
                    <div className="relative mx-auto h-16 w-16">
                      <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="4"
                          className="text-gray-800"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          fill="none"
                          strokeWidth="4"
                          strokeLinecap="round"
                          className={scoreRingColor(parcel.fitScore.overallScore)}
                          strokeDasharray={`${(parcel.fitScore.overallScore / 100) * 175.9} 175.9`}
                        />
                      </svg>
                      <span
                        className={`absolute inset-0 flex items-center justify-center text-lg font-bold ${scoreTextColor(parcel.fitScore.overallScore)}`}
                      >
                        {parcel.fitScore.overallScore}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Fit Score</p>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="mx-auto h-5 w-5 text-gray-600" />
                    <p className="mt-2 text-lg font-bold text-gray-500">--</p>
                    <p className="text-xs text-gray-600">Not scored</p>
                  </>
                )}
              </div>
            </div>

            {/* ─── Score Breakdown ────────────────────── */}
            {parcel.fitScore && (() => {
              const breakdown = parseBreakdown(parcel.fitScore.scoreBreakdown)
              const reasons = parseReasons(parcel.fitScore.topReasons)
              return (
                <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
                  <h3 className="mb-4 text-sm font-semibold text-gray-300">Score Breakdown</h3>
                  {breakdown.length > 0 && (
                    <div className="space-y-2.5">
                      {breakdown.map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="w-28 truncate text-right text-xs text-gray-400">
                            {item.label}
                          </span>
                          <div className="flex-1">
                            <div className="h-2.5 overflow-hidden rounded-full bg-gray-800">
                              <div
                                className={`h-full rounded-full transition-all ${barColor(item.score)}`}
                                style={{ width: `${item.score}%` }}
                              />
                            </div>
                          </div>
                          <span className="w-8 text-right text-xs tabular-nums text-gray-400">
                            {item.score}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {reasons.length > 0 && (
                    <div className="mt-4 border-t border-gray-800 pt-4">
                      <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">
                        Top Reasons
                      </h4>
                      <ul className="space-y-1">
                        {reasons.map((r, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {parcel.fitScore.autoFailed && (
                    <div className="mt-3 rounded-lg border border-red-900/40 bg-red-950/30 px-3 py-2 text-xs text-red-400">
                      Auto-failed: {parcel.fitScore.autoFailReason ?? 'Unknown reason'}
                    </div>
                  )}
                </div>
              )
            })()}

            {/* ─── Deal Status ────────────────────────── */}
            {parcel.deal && (
              <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
                <h3 className="mb-3 text-sm font-semibold text-gray-300">Deal Pipeline</h3>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${stageBadge(parcel.deal.stage)}`}
                  >
                    {parcel.deal.stage.charAt(0).toUpperCase() +
                      parcel.deal.stage.slice(1).replace('-', ' ')}
                  </span>
                  <span className="text-xs text-gray-500">
                    Priority:{' '}
                    <span className="font-medium text-gray-300">{parcel.deal.priority}</span>
                  </span>
                </div>
                {parcel.deal.notes && (
                  <p className="mt-2 text-sm text-gray-400">{parcel.deal.notes}</p>
                )}
              </div>
            )}

            {/* ─── Map Placeholder ────────────────────── */}
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
              <h3 className="mb-3 text-sm font-semibold text-gray-300">Location</h3>
              <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-gray-700 bg-gray-800/50">
                <div className="text-center">
                  <MapPin className="mx-auto h-8 w-8 text-gray-600" />
                  <p className="mt-2 text-sm text-gray-500">Map coming soon</p>
                  {parcel.lat != null && parcel.lon != null && (
                    <p className="mt-1 text-xs tabular-nums text-gray-600">
                      {parcel.lat.toFixed(5)}, {parcel.lon.toFixed(5)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ─── Listing Sources ────────────────────── */}
            {parcel.listings.length > 0 && (
              <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
                <h3 className="mb-3 text-sm font-semibold text-gray-300">
                  Listing Sources ({parcel.listings.length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-800 text-left text-xs uppercase tracking-wider text-gray-500">
                        <th className="pb-2 pr-4 font-medium">Source</th>
                        <th className="pb-2 pr-4 font-medium">Price</th>
                        <th className="pb-2 pr-4 font-medium">Status</th>
                        <th className="pb-2 font-medium">Link</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/40">
                      {parcel.listings.map((listing) => (
                        <tr key={listing.id} className="text-gray-300">
                          <td className="py-2 pr-4 font-medium">
                            {sourceLabel(listing.sourceId)}
                          </td>
                          <td className="py-2 pr-4 tabular-nums">
                            {listing.price ? formatCurrency(listing.price) : '--'}
                          </td>
                          <td className="py-2 pr-4">
                            <span className="rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-400">
                              {listing.status}
                            </span>
                          </td>
                          <td className="py-2">
                            {listing.url && (
                              <a
                                href={listing.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300"
                                onClick={(e) => e.stopPropagation()}
                              >
                                View <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ─── Features ──────────────────────────── */}
            {parcel.features && (
              <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
                <h3 className="mb-4 text-sm font-semibold text-gray-300">Land Features</h3>
                <div className="grid grid-cols-2 gap-4">
                  {/* Water */}
                  <FeatureItem
                    icon={Droplets}
                    label="Water"
                    value={
                      parcel.features.waterPresence
                        ? parcel.features.waterFeatures ?? 'Present'
                        : 'None detected'
                    }
                    highlight={parcel.features.waterPresence}
                  />
                  {/* Road Access */}
                  <FeatureItem
                    icon={Route}
                    label="Road Access"
                    value={parcel.features.roadAccess ?? 'Unknown'}
                    highlight={!!parcel.features.roadAccess}
                  />
                  {/* Elevation */}
                  <FeatureItem
                    icon={Mountain}
                    label="Elevation"
                    value={
                      parcel.features.elevation != null
                        ? `${Math.round(parcel.features.elevation)} ft`
                        : 'Unknown'
                    }
                    highlight={parcel.features.elevation != null}
                  />
                  {/* Land Cover */}
                  <FeatureItem
                    icon={TreePine}
                    label="Land Cover"
                    value={parcel.features.landCoverMix ?? 'Unknown'}
                    highlight={!!parcel.features.landCoverMix}
                  />
                  {/* Flood Zone */}
                  <FeatureItem
                    icon={Droplets}
                    label="Flood Zone"
                    value={
                      parcel.features.inFloodway
                        ? `In floodway${parcel.features.floodZone ? ` (${parcel.features.floodZone})` : ''}`
                        : parcel.features.floodZone ?? 'Not in floodway'
                    }
                    highlight={!parcel.features.inFloodway}
                    highlightColor={parcel.features.inFloodway ? 'red' : 'green'}
                  />
                  {/* Power Distance */}
                  <FeatureItem
                    icon={Zap}
                    label="Power Distance"
                    value={
                      parcel.features.powerDistance != null
                        ? `${parcel.features.powerDistance.toFixed(1)} mi`
                        : 'Unknown'
                    }
                    highlight={
                      parcel.features.powerDistance != null &&
                      parcel.features.powerDistance < 1
                    }
                  />
                </div>
                {/* Soils / Metro */}
                <div className="mt-4 grid grid-cols-2 gap-4 border-t border-gray-800 pt-4">
                  {parcel.features.soilsQuality != null && (
                    <div className="text-sm">
                      <span className="text-gray-500">Soil Quality:</span>{' '}
                      <span className="font-medium text-gray-300">
                        {parcel.features.soilsQuality.toFixed(1)}/10
                      </span>
                    </div>
                  )}
                  {parcel.features.nearestMetro && (
                    <div className="text-sm">
                      <span className="text-gray-500">Nearest Metro:</span>{' '}
                      <span className="font-medium text-gray-300">
                        {parcel.features.nearestMetro}
                        {parcel.features.metroDistance != null &&
                          ` (${parcel.features.metroDistance.toFixed(0)} mi)`}
                      </span>
                    </div>
                  )}
                  {parcel.features.wetlandsPercent != null && (
                    <div className="text-sm">
                      <span className="text-gray-500">Wetlands:</span>{' '}
                      <span className="font-medium text-gray-300">
                        {parcel.features.wetlandsPercent.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}

// ─── Feature Item ───────────────────────────────────────────────────

function FeatureItem({
  icon: Icon,
  label,
  value,
  highlight,
  highlightColor = 'green',
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  highlight: boolean
  highlightColor?: 'green' | 'red'
}) {
  const iconColor = highlight
    ? highlightColor === 'green'
      ? 'text-emerald-400'
      : 'text-red-400'
    : 'text-gray-600'

  return (
    <div className="flex items-start gap-2.5">
      <Icon className={`mt-0.5 h-4 w-4 flex-shrink-0 ${iconColor}`} />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-300">{value}</p>
      </div>
    </div>
  )
}
