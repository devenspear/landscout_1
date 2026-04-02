import { prisma } from '@/lib/prisma'
import { formatCurrency, formatNumber, formatAcres, scoreBgColor } from '@/lib/utils'
import { SOURCES } from '@/lib/types'
import {
  MapPin,
  Target,
  Handshake,
  List,
  Clock,
  TrendingUp,
  Globe,
  Database,
} from 'lucide-react'

// ─── Data fetching ──────────────────────────────────────────────────

async function getDashboardData() {
  const [totalParcels, totalListings, totalDeals, scores, byState, bySrc, recentParcels, lastScan] =
    await Promise.all([
      prisma.parcel.count(),
      prisma.listing.count(),
      prisma.deal.count(),
      prisma.fitScore.findMany({ select: { overallScore: true } }),
      prisma.parcel.groupBy({ by: ['state'], _count: true, orderBy: { _count: { state: 'desc' } } }),
      prisma.listing.groupBy({ by: ['sourceId'], _count: true, orderBy: { _count: { sourceId: 'desc' } } }),
      prisma.parcel.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { fitScore: true, listings: { take: 1 } },
      }),
      prisma.scanRun.findFirst({ orderBy: { startedAt: 'desc' } }),
    ])

  const avgScore =
    scores.length > 0
      ? Math.round(scores.reduce((s, r) => s + r.overallScore, 0) / scores.length)
      : 0
  const highCount = scores.filter((s) => s.overallScore >= 80).length
  const medCount = scores.filter((s) => s.overallScore >= 60 && s.overallScore < 80).length
  const lowCount = scores.filter((s) => s.overallScore < 60).length

  return {
    totalParcels,
    totalListings,
    totalDeals,
    avgScore,
    highCount,
    medCount,
    lowCount,
    byState,
    bySrc,
    recentParcels,
    lastScan,
  }
}

// ─── Helpers ────────────────────────────────────────────────────────

function sourceLabel(sourceId: string): string {
  return SOURCES.find((s) => s.id === sourceId)?.name ?? sourceId
}

function scoreBadgeClasses(score: number): string {
  if (score >= 80) return 'bg-emerald-900/40 text-emerald-400 ring-emerald-500/30'
  if (score >= 60) return 'bg-amber-900/40 text-amber-400 ring-amber-500/30'
  return 'bg-red-900/40 text-red-400 ring-red-500/30'
}

// ─── Page ───────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const data = await getDashboardData()
  const {
    totalParcels,
    totalListings,
    totalDeals,
    avgScore,
    highCount,
    medCount,
    lowCount,
    byState,
    bySrc,
    recentParcels,
    lastScan,
  } = data

  const totalScored = highCount + medCount + lowCount
  const highPct = totalScored > 0 ? (highCount / totalScored) * 100 : 0
  const medPct = totalScored > 0 ? (medCount / totalScored) * 100 : 0
  const lowPct = totalScored > 0 ? (lowCount / totalScored) * 100 : 0

  const maxStateCount = byState.length > 0 ? Math.max(...byState.map((s) => s._count)) : 1
  const maxSrcCount = bySrc.length > 0 ? Math.max(...bySrc.map((s) => s._count)) : 1

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-100">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Land intelligence overview
          </p>
        </div>
        {lastScan && (
          <div className="flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-xs text-gray-400">
            <Clock className="h-3.5 w-3.5" />
            Last scan:{' '}
            {lastScan.completedAt
              ? new Date(lastScan.completedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })
              : 'Running...'}
            <span
              className={`ml-1 inline-block h-2 w-2 rounded-full ${
                lastScan.status === 'completed'
                  ? 'bg-emerald-500'
                  : lastScan.status === 'running'
                    ? 'animate-pulse bg-amber-500'
                    : 'bg-red-500'
              }`}
            />
          </div>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={MapPin}
          label="Total Parcels"
          value={formatNumber(totalParcels)}
          subtitle={`${byState.length} states`}
          color="blue"
        />
        <StatCard
          icon={Target}
          label="Avg Fit Score"
          value={avgScore.toString()}
          subtitle={`${totalScored} scored`}
          color="emerald"
        />
        <StatCard
          icon={Handshake}
          label="Active Deals"
          value={formatNumber(totalDeals)}
          subtitle="in pipeline"
          color="purple"
        />
        <StatCard
          icon={List}
          label="Listings Tracked"
          value={formatNumber(totalListings)}
          subtitle={`${bySrc.length} sources`}
          color="amber"
        />
      </div>

      {/* Score Distribution */}
      {totalScored > 0 && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-300">Score Distribution</h2>
            <div className="flex gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
                High ({highCount})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500" />
                Medium ({medCount})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
                Low ({lowCount})
              </span>
            </div>
          </div>
          <div className="flex h-4 overflow-hidden rounded-full bg-gray-800">
            {highPct > 0 && (
              <div
                className="bg-emerald-500 transition-all"
                style={{ width: `${highPct}%` }}
              />
            )}
            {medPct > 0 && (
              <div
                className="bg-amber-500 transition-all"
                style={{ width: `${medPct}%` }}
              />
            )}
            {lowPct > 0 && (
              <div
                className="bg-red-500 transition-all"
                style={{ width: `${lowPct}%` }}
              />
            )}
          </div>
          <div className="mt-2 flex text-xs text-gray-500">
            {highPct > 0 && <span style={{ width: `${highPct}%` }}>{Math.round(highPct)}%</span>}
            {medPct > 0 && <span style={{ width: `${medPct}%` }}>{Math.round(medPct)}%</span>}
            {lowPct > 0 && <span style={{ width: `${lowPct}%` }}>{Math.round(lowPct)}%</span>}
          </div>
        </div>
      )}

      {/* Two-column: By State / Top Sources */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* By State */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-300">
            <Globe className="h-4 w-4 text-blue-400" />
            By State
          </div>
          {byState.length === 0 ? (
            <p className="text-sm text-gray-600">No parcels yet</p>
          ) : (
            <div className="space-y-3">
              {byState.map((row) => (
                <div key={row.state} className="flex items-center gap-3">
                  <span className="w-8 text-right text-xs font-medium text-gray-400">
                    {row.state}
                  </span>
                  <div className="relative flex-1">
                    <div className="h-6 overflow-hidden rounded bg-gray-800">
                      <div
                        className="h-full rounded bg-blue-500/60 transition-all"
                        style={{
                          width: `${(row._count / maxStateCount) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="w-10 text-right text-xs tabular-nums text-gray-400">
                    {row._count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Sources */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-300">
            <Database className="h-4 w-4 text-amber-400" />
            Top Sources
          </div>
          {bySrc.length === 0 ? (
            <p className="text-sm text-gray-600">No listings yet</p>
          ) : (
            <div className="space-y-3">
              {bySrc.map((row) => (
                <div key={row.sourceId} className="flex items-center gap-3">
                  <span className="w-28 truncate text-right text-xs font-medium text-gray-400">
                    {sourceLabel(row.sourceId)}
                  </span>
                  <div className="relative flex-1">
                    <div className="h-6 overflow-hidden rounded bg-gray-800">
                      <div
                        className="h-full rounded bg-amber-500/60 transition-all"
                        style={{
                          width: `${(row._count / maxSrcCount) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="w-10 text-right text-xs tabular-nums text-gray-400">
                    {row._count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Discoveries */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-300">
          <TrendingUp className="h-4 w-4 text-emerald-400" />
          Recent Discoveries
        </div>
        {recentParcels.length === 0 ? (
          <p className="text-sm text-gray-600">No parcels discovered yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-left text-xs uppercase tracking-wider text-gray-500">
                  <th className="pb-3 pr-4 font-medium">Score</th>
                  <th className="pb-3 pr-4 font-medium">Location</th>
                  <th className="pb-3 pr-4 font-medium">Acreage</th>
                  <th className="pb-3 pr-4 font-medium">Price</th>
                  <th className="pb-3 font-medium">Discovered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {recentParcels.map((parcel) => {
                  const score = parcel.fitScore?.overallScore ?? null
                  const listing = parcel.listings[0] ?? null
                  return (
                    <tr
                      key={parcel.id}
                      className="text-gray-300 transition-colors hover:bg-gray-800/40"
                    >
                      <td className="py-3 pr-4">
                        {score !== null ? (
                          <span
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold ring-1 ring-inset ${scoreBadgeClasses(score)}`}
                          >
                            {score}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-600">--</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="font-medium">{parcel.county}</div>
                        <div className="text-xs text-gray-500">{parcel.state}</div>
                      </td>
                      <td className="py-3 pr-4 tabular-nums">
                        {formatAcres(parcel.acreage)}
                      </td>
                      <td className="py-3 pr-4 tabular-nums">
                        {listing?.price ? formatCurrency(listing.price) : '--'}
                      </td>
                      <td className="py-3 text-xs text-gray-500">
                        {new Date(parcel.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Stat Card ──────────────────────────────────────────────────────

const colorMap = {
  blue: {
    iconBg: 'bg-blue-500/10',
    iconText: 'text-blue-400',
    ring: 'ring-blue-500/20',
  },
  emerald: {
    iconBg: 'bg-emerald-500/10',
    iconText: 'text-emerald-400',
    ring: 'ring-emerald-500/20',
  },
  purple: {
    iconBg: 'bg-purple-500/10',
    iconText: 'text-purple-400',
    ring: 'ring-purple-500/20',
  },
  amber: {
    iconBg: 'bg-amber-500/10',
    iconText: 'text-amber-400',
    ring: 'ring-amber-500/20',
  },
} as const

function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  subtitle: string
  color: keyof typeof colorMap
}) {
  const c = colorMap[color]
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</p>
        <div className={`rounded-lg p-2 ${c.iconBg} ring-1 ring-inset ${c.ring}`}>
          <Icon className={`h-4 w-4 ${c.iconText}`} />
        </div>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-gray-100">{value}</p>
      <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
    </div>
  )
}
