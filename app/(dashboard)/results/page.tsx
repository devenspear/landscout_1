'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Search,
  ChevronUp,
  ChevronDown,
  Filter,
  Loader2,
  ExternalLink,
} from 'lucide-react'
import { formatCurrency, formatNumber, formatAcres } from '@/lib/utils'
import { SOURCES } from '@/lib/types'
import PropertyDetail from '@/components/property-detail'

// ─── Types ──────────────────────────────────────────────────────────

interface ResultParcel {
  id: string
  apn: string | null
  county: string
  state: string
  acreage: number
  fitScore: { overallScore: number } | null
  deal: { stage: string } | null
  listings: {
    id: string
    sourceId: string
    price: number | null
    pricePerAcre: number | null
    status: string
  }[]
  _count?: { listings: number }
}

interface SearchResponse {
  parcels: ResultParcel[]
  total: number
}

type SortField = 'score' | 'acreage' | 'price' | 'pricePerAcre' | 'county'
type SortDir = 'asc' | 'desc'

const STATES = ['All', 'VA', 'NC', 'SC', 'GA', 'FL', 'AL'] as const

// ─── Page ───────────────────────────────────────────────────────────

export default function ResultsPage() {
  // Filters
  const [state, setState] = useState<string>('All')
  const [minAcreage, setMinAcreage] = useState<string>('')
  const [maxAcreage, setMaxAcreage] = useState<string>('')
  const [minScore, setMinScore] = useState<number>(0)
  const [sourceFilter, setSourceFilter] = useState<string>('All')

  // Sort
  const [sortBy, setSortBy] = useState<SortField>('score')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  // Pagination
  const [page, setPage] = useState(1)
  const limit = 25

  // Data
  const [parcels, setParcels] = useState<ResultParcel[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Detail panel
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null)

  const fetchResults = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const body: Record<string, unknown> = {
        sortBy,
        sortDir,
        page,
        limit,
      }
      if (state !== 'All') body.state = state
      if (minAcreage) body.minAcreage = parseFloat(minAcreage)
      if (maxAcreage) body.maxAcreage = parseFloat(maxAcreage)
      if (minScore > 0) body.minScore = minScore
      if (sourceFilter !== 'All') body.sourceId = sourceFilter

      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error(`Search failed (${res.status})`)

      const data: SearchResponse = await res.json()
      setParcels(data.parcels)
      setTotal(data.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fetch failed')
    } finally {
      setLoading(false)
    }
  }, [state, minAcreage, maxAcreage, minScore, sourceFilter, sortBy, sortDir, page, limit])

  // Auto-fetch on sort/page change
  useEffect(() => {
    fetchResults()
  }, [fetchResults])

  const handleApply = () => {
    setPage(1)
    fetchResults()
  }

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(field)
      setSortDir(field === 'score' ? 'desc' : 'asc')
    }
    setPage(1)
  }

  const totalPages = Math.ceil(total / limit)

  // Helpers
  function getPrice(p: ResultParcel): number | null {
    return p.listings[0]?.price ?? null
  }

  function getPricePerAcre(p: ResultParcel): number | null {
    return p.listings[0]?.pricePerAcre ?? null
  }

  function listingCount(p: ResultParcel): number {
    return p._count?.listings ?? p.listings.length
  }

  function stageLabel(stage: string | undefined): string {
    if (!stage) return '--'
    return stage.charAt(0).toUpperCase() + stage.slice(1).replace('-', ' ')
  }

  function stageBadge(stage: string | undefined): string {
    if (!stage) return 'bg-gray-800 text-gray-500'
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

  function scoreBadge(score: number | null | undefined): string {
    if (score == null) return 'bg-gray-800 text-gray-500'
    if (score >= 80) return 'bg-emerald-900/40 text-emerald-400 ring-1 ring-inset ring-emerald-500/30'
    if (score >= 60) return 'bg-amber-900/40 text-amber-400 ring-1 ring-inset ring-amber-500/30'
    return 'bg-red-900/40 text-red-400 ring-1 ring-inset ring-red-500/30'
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortBy !== field)
      return <ChevronDown className="h-3 w-3 text-gray-600" />
    return sortDir === 'asc' ? (
      <ChevronUp className="h-3 w-3 text-emerald-400" />
    ) : (
      <ChevronDown className="h-3 w-3 text-emerald-400" />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-100">Results</h1>
        <p className="mt-1 text-sm text-gray-500">Search and filter discovered parcels</p>
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-gray-500">
          <Filter className="h-3.5 w-3.5" />
          Filters
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {/* State */}
          <div>
            <label className="mb-1 block text-xs text-gray-500">State</label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
            >
              {STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Min Acreage */}
          <div>
            <label className="mb-1 block text-xs text-gray-500">Min Acres</label>
            <input
              type="number"
              value={minAcreage}
              onChange={(e) => setMinAcreage(e.target.value)}
              placeholder="0"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 outline-none placeholder:text-gray-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
            />
          </div>

          {/* Max Acreage */}
          <div>
            <label className="mb-1 block text-xs text-gray-500">Max Acres</label>
            <input
              type="number"
              value={maxAcreage}
              onChange={(e) => setMaxAcreage(e.target.value)}
              placeholder="Any"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 outline-none placeholder:text-gray-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
            />
          </div>

          {/* Min Fit Score */}
          <div>
            <label className="mb-1 block text-xs text-gray-500">
              Min Score: <span className="font-semibold text-gray-300">{minScore}</span>
            </label>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={minScore}
              onChange={(e) => setMinScore(parseInt(e.target.value))}
              className="mt-1 w-full accent-emerald-500"
            />
          </div>

          {/* Source */}
          <div>
            <label className="mb-1 block text-xs text-gray-500">Source</label>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
            >
              <option value="All">All Sources</option>
              {SOURCES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Apply */}
          <div className="flex items-end">
            <button
              onClick={handleApply}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
            >
              <Search className="h-4 w-4" />
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between text-sm text-gray-400">
        <span>
          Showing{' '}
          <span className="font-medium text-gray-200">
            {total === 0 ? 0 : (page - 1) * limit + 1}
          </span>
          {' - '}
          <span className="font-medium text-gray-200">
            {Math.min(page * limit, total)}
          </span>
          {' of '}
          <span className="font-medium text-gray-200">{formatNumber(total)}</span>{' '}
          parcels
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-400 transition-colors hover:bg-gray-800 disabled:opacity-40"
            >
              Prev
            </button>
            <span className="text-xs text-gray-500">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-400 transition-colors hover:bg-gray-800 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-800 bg-gray-900">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-gray-900">
            <tr className="border-b border-gray-800 text-left text-xs uppercase tracking-wider text-gray-500">
              <th
                className="cursor-pointer px-4 py-3 font-medium hover:text-gray-300"
                onClick={() => handleSort('score')}
              >
                <span className="flex items-center gap-1">
                  Score <SortIcon field="score" />
                </span>
              </th>
              <th
                className="cursor-pointer px-4 py-3 font-medium hover:text-gray-300"
                onClick={() => handleSort('county')}
              >
                <span className="flex items-center gap-1">
                  Parcel <SortIcon field="county" />
                </span>
              </th>
              <th
                className="cursor-pointer px-4 py-3 font-medium hover:text-gray-300"
                onClick={() => handleSort('acreage')}
              >
                <span className="flex items-center gap-1">
                  Acreage <SortIcon field="acreage" />
                </span>
              </th>
              <th
                className="cursor-pointer px-4 py-3 font-medium hover:text-gray-300"
                onClick={() => handleSort('price')}
              >
                <span className="flex items-center gap-1">
                  Price <SortIcon field="price" />
                </span>
              </th>
              <th
                className="cursor-pointer px-4 py-3 font-medium hover:text-gray-300"
                onClick={() => handleSort('pricePerAcre')}
              >
                <span className="flex items-center gap-1">
                  $/Acre <SortIcon field="pricePerAcre" />
                </span>
              </th>
              <th className="px-4 py-3 font-medium">Sources</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/40">
            {loading ? (
              // Skeleton rows
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 animate-pulse rounded bg-gray-800" />
                    </td>
                  ))}
                </tr>
              ))
            ) : error ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-red-400">
                  {error}
                </td>
              </tr>
            ) : parcels.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                  No parcels match your filters
                </td>
              </tr>
            ) : (
              parcels.map((parcel) => {
                const score = parcel.fitScore?.overallScore ?? null
                const price = getPrice(parcel)
                const ppa = getPricePerAcre(parcel)
                const sources = listingCount(parcel)
                const dealStage = parcel.deal?.stage

                return (
                  <tr
                    key={parcel.id}
                    onClick={() => setSelectedParcelId(parcel.id)}
                    className="cursor-pointer bg-gray-900/50 text-gray-300 transition-colors hover:bg-gray-800/50"
                  >
                    <td className="px-4 py-3">
                      {score !== null ? (
                        <span
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold ${scoreBadge(score)}`}
                        >
                          {score}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-600">--</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{parcel.county}</div>
                      <div className="text-xs text-gray-500">
                        {parcel.state}
                        {parcel.apn && (
                          <span className="ml-2 text-gray-600">APN: {parcel.apn}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {formatAcres(parcel.acreage)}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {price ? formatCurrency(price) : '--'}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {ppa ? formatCurrency(ppa) : '--'}
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums text-gray-400">
                      {sources}
                    </td>
                    <td className="px-4 py-3">
                      {dealStage ? (
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${stageBadge(dealStage)}`}
                        >
                          {stageLabel(dealStage)}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-600">--</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedParcelId(parcel.id)
                        }}
                        className="flex items-center gap-1 rounded-md border border-gray-700 px-2.5 py-1 text-xs text-gray-400 transition-colors hover:border-emerald-600 hover:text-emerald-400"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pb-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-400 transition-colors hover:bg-gray-800 disabled:opacity-40"
          >
            Previous
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const start = Math.max(1, Math.min(page - 2, totalPages - 4))
            const p = start + i
            if (p > totalPages) return null
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                  p === page
                    ? 'border-emerald-600 bg-emerald-600/20 text-emerald-400'
                    : 'border-gray-700 text-gray-400 hover:bg-gray-800'
                }`}
              >
                {p}
              </button>
            )
          })}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-400 transition-colors hover:bg-gray-800 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {/* Property Detail Panel */}
      {selectedParcelId && (
        <PropertyDetail
          parcelId={selectedParcelId}
          onClose={() => setSelectedParcelId(null)}
        />
      )}
    </div>
  )
}
