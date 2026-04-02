'use client'

import { useEffect, useState, useCallback } from 'react'
import { GripVertical, MapPin, DollarSign, Clock } from 'lucide-react'
import { DEAL_STAGES } from '@/lib/types'
import type { DealStage, Priority } from '@/lib/types'
import { formatCurrency, formatAcres, cn } from '@/lib/utils'

// ─── Types ─────────────────────────────────────────────────────────

interface DealParcel {
  id: string
  county: string
  state: string
  acreage: number
  listings: { price: number | null }[]
  fitScore: { overallScore: number } | null
}

interface DealActivity {
  id: string
  type: string
  content: string
  createdAt: string
}

interface Deal {
  id: string
  parcelId: string
  stage: DealStage
  priority: Priority
  notes: string | null
  nextAction: string | null
  nextDate: string | null
  createdAt: string
  updatedAt: string
  parcel: DealParcel
  activities: DealActivity[]
}

// ─── Stage styling ─────────────────────────────────────────────────

const STAGE_STYLES: Record<string, { border: string; header: string; bg: string }> = {
  new: {
    border: 'border-blue-500/30',
    header: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  qualified: {
    border: 'border-purple-500/30',
    header: 'text-purple-400',
    bg: 'bg-purple-500/10',
  },
  pursuit: {
    border: 'border-amber-500/30',
    header: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  'under-contract': {
    border: 'border-emerald-500/30',
    header: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  closed: {
    border: 'border-green-500/30',
    header: 'text-green-400',
    bg: 'bg-green-500/10',
  },
  passed: {
    border: 'border-gray-500/30',
    header: 'text-gray-400',
    bg: 'bg-gray-500/10',
  },
}

const PRIORITY_DOT: Record<Priority, string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-500',
  low: 'bg-green-500',
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
  if (score >= 60) return 'text-amber-400 bg-amber-500/15 border-amber-500/30'
  return 'text-red-400 bg-red-500/15 border-red-500/30'
}

function relativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return `${Math.floor(diffDays / 30)}mo ago`
}

// ─── Deal Card ─────────────────────────────────────────────────────

function DealCard({
  deal,
  onDragStart,
}: {
  deal: Deal
  onDragStart: (e: React.DragEvent, dealId: string) => void
}) {
  const score = deal.parcel.fitScore?.overallScore ?? 0
  const price = deal.parcel.listings?.[0]?.price ?? null
  const lastActivity = deal.activities?.[0]?.createdAt ?? deal.updatedAt

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, deal.id)}
      className="group cursor-grab rounded-lg bg-gray-800 p-3.5 shadow-sm border border-gray-700/50 transition-all duration-150 hover:border-gray-600 hover:shadow-md hover:bg-gray-800/80 active:cursor-grabbing active:scale-[0.98]"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <GripVertical className="h-3.5 w-3.5 text-gray-600 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3 text-gray-500 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-200 truncate">
                {deal.parcel.county}, {deal.parcel.state}
              </span>
            </div>
          </div>
        </div>
        {/* Priority dot */}
        <span
          className={cn(
            'h-2 w-2 rounded-full flex-shrink-0 mt-1.5',
            PRIORITY_DOT[deal.priority]
          )}
          title={`${deal.priority} priority`}
        />
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 text-xs text-gray-400 mb-2.5">
        <span>{formatAcres(deal.parcel.acreage)}</span>
        {price && (
          <span className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            {formatCurrency(price)}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        {/* Fit Score badge */}
        <span
          className={cn(
            'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold tabular-nums',
            scoreColor(score)
          )}
        >
          {score}
        </span>
        {/* Last activity */}
        <span className="flex items-center gap-1 text-[11px] text-gray-500">
          <Clock className="h-3 w-3" />
          {relativeDate(lastActivity)}
        </span>
      </div>
    </div>
  )
}

// ─── Pipeline Page ─────────────────────────────────────────────────

export default function PipelinePage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [dragOverStage, setDragOverStage] = useState<string | null>(null)
  const [dragDealId, setDragDealId] = useState<string | null>(null)

  // Fetch deals
  useEffect(() => {
    async function fetchDeals() {
      try {
        const res = await fetch('/api/deals')
        if (res.ok) {
          const data = await res.json()
          setDeals(data.deals ?? data ?? [])
        }
      } catch {
        // API not available yet
      } finally {
        setLoading(false)
      }
    }
    fetchDeals()
  }, [])

  // Group by stage
  const dealsByStage: Record<string, Deal[]> = {}
  for (const stage of DEAL_STAGES) {
    dealsByStage[stage.value] = deals.filter((d) => d.stage === stage.value)
  }

  // Drag handlers
  const handleDragStart = useCallback(
    (e: React.DragEvent, dealId: string) => {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', dealId)
      setDragDealId(dealId)
    },
    []
  )

  const handleDragOver = useCallback(
    (e: React.DragEvent, stage: string) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      setDragOverStage(stage)
    },
    []
  )

  const handleDragLeave = useCallback(() => {
    setDragOverStage(null)
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent, newStage: string) => {
      e.preventDefault()
      setDragOverStage(null)
      setDragDealId(null)

      const dealId = e.dataTransfer.getData('text/plain')
      if (!dealId) return

      const deal = deals.find((d) => d.id === dealId)
      if (!deal || deal.stage === newStage) return

      // Optimistic update
      setDeals((prev) =>
        prev.map((d) =>
          d.id === dealId ? { ...d, stage: newStage as DealStage } : d
        )
      )

      // Persist
      try {
        await fetch(`/api/deals/${dealId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stage: newStage }),
        })
      } catch {
        // Revert on failure
        setDeals((prev) =>
          prev.map((d) =>
            d.id === dealId ? { ...d, stage: deal.stage } : d
          )
        )
      }
    },
    [deals]
  )

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-100">Pipeline</h1>
        <p className="mt-1 text-sm text-gray-400">
          Manage deals across stages. Drag cards to update status.
        </p>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        {DEAL_STAGES.map((stage) => {
          const stageDeals = dealsByStage[stage.value] || []
          const style = STAGE_STYLES[stage.value] || STAGE_STYLES.new
          const isOver = dragOverStage === stage.value

          return (
            <div
              key={stage.value}
              className={cn(
                'flex-shrink-0 w-72 rounded-xl border bg-gray-900/50 transition-all duration-150',
                style.border,
                isOver && 'ring-2 ring-emerald-500/40 bg-gray-900/80'
              )}
              onDragOver={(e) => handleDragOver(e, stage.value)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.value)}
            >
              {/* Column Header */}
              <div
                className={cn(
                  'flex items-center justify-between rounded-t-xl px-4 py-3',
                  style.bg
                )}
              >
                <h2 className={cn('text-sm font-semibold', style.header)}>
                  {stage.label}
                </h2>
                <span
                  className={cn(
                    'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold',
                    style.bg,
                    style.header
                  )}
                >
                  {stageDeals.length}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-2.5 p-3 min-h-[120px]">
                {loading ? (
                  <div className="space-y-2.5">
                    {[1, 2].map((i) => (
                      <div
                        key={i}
                        className="h-28 animate-pulse rounded-lg bg-gray-800/60"
                      />
                    ))}
                  </div>
                ) : stageDeals.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-xs text-gray-600">No deals</p>
                  </div>
                ) : (
                  stageDeals.map((deal) => (
                    <DealCard
                      key={deal.id}
                      deal={deal}
                      onDragStart={handleDragStart}
                    />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary bar */}
      {!loading && (
        <div className="mt-6 flex flex-wrap items-center gap-4 rounded-xl bg-gray-900/50 border border-gray-800/60 px-5 py-3.5">
          <span className="text-sm font-medium text-gray-300">
            {deals.length} total deal{deals.length !== 1 ? 's' : ''}
          </span>
          <span className="h-4 w-px bg-gray-700" />
          {DEAL_STAGES.filter((s) => s.value !== 'passed').map((stage) => {
            const count = dealsByStage[stage.value]?.length ?? 0
            if (count === 0) return null
            const style = STAGE_STYLES[stage.value]
            return (
              <span
                key={stage.value}
                className={cn('text-xs font-medium', style?.header)}
              >
                {count} {stage.label}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}
