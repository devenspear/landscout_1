'use client'

import { useState } from 'react'
import {
  Activity,
  Database,
  Settings,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Globe,
  Gauge,
  Shield,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AdminConfig } from '@/lib/admin-config'

// ─── Types ─────────────────────────────────────────────────────────

interface ScanSourceSummary {
  id: string
  sourceName: string
  status: string
  listings: number
  errors: number
}

interface LatestScan {
  id: string
  status: string
  totalListings: number
  newParcels: number
  updatedParcels: number
  errors: number
  startedAt: string
  completedAt: string | null
  sources: ScanSourceSummary[]
}

interface RecentScan {
  id: string
  status: string
  totalListings: number
  newParcels: number
  updatedParcels: number
  errors: number
  startedAt: string
  completedAt: string | null
  sourceCount: number
}

interface HealthData {
  latestScan: LatestScan | null
  recentScans: RecentScan[]
  sourceCount: number
  enabledSourceCount: number
  parcelCount: number
  listingCount: number
  dealCount: number
  fitScoreCount: number
}

// ─── Helpers ───────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    completed:
      'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    running: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    failed: 'bg-red-500/15 text-red-400 border-red-500/30',
    pending: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
  }
  const icons: Record<string, React.ReactNode> = {
    completed: <CheckCircle2 className="h-3 w-3" />,
    running: <Clock className="h-3 w-3 animate-spin" />,
    failed: <XCircle className="h-3 w-3" />,
    pending: <Clock className="h-3 w-3" />,
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium',
        styles[status] ?? styles.pending
      )}
    >
      {icons[status] ?? icons.pending}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

// ─── Stat Card ─────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = 'text-gray-400',
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  sub?: string
  color?: string
}) {
  return (
    <div className="rounded-xl bg-gray-900/50 border border-gray-800/60 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn('h-4 w-4', color)} />
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold text-gray-100 tabular-nums">{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
    </div>
  )
}

// ─── System Health Tab ─────────────────────────────────────────────

function HealthTab({ health }: { health: HealthData }) {
  return (
    <div className="space-y-6">
      {/* Status cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Activity}
          label="Last Scan"
          value={
            health.latestScan
              ? formatDate(health.latestScan.startedAt)
              : 'Never'
          }
          sub={
            health.latestScan
              ? `Status: ${health.latestScan.status}`
              : 'No scans run yet'
          }
          color="text-blue-400"
        />
        <StatCard
          icon={Globe}
          label="Sources"
          value={`${health.enabledSourceCount} / ${health.sourceCount}`}
          sub="Enabled / Total"
          color="text-purple-400"
        />
        <StatCard
          icon={Database}
          label="Parcels"
          value={health.parcelCount.toLocaleString()}
          sub={`${health.fitScoreCount.toLocaleString()} scored`}
          color="text-emerald-400"
        />
        <StatCard
          icon={Gauge}
          label="Deals / Listings"
          value={health.dealCount.toLocaleString()}
          sub={`${health.listingCount.toLocaleString()} listings total`}
          color="text-amber-400"
        />
      </div>

      {/* Latest scan detail */}
      {health.latestScan && (
        <div className="rounded-xl bg-gray-900/50 border border-gray-800/60 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800/60">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-200">
                Latest Scan Detail
              </h3>
              {statusBadge(health.latestScan.status)}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Total Listings</p>
              <p className="text-lg font-semibold text-gray-200 tabular-nums">
                {health.latestScan.totalListings.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">New Parcels</p>
              <p className="text-lg font-semibold text-emerald-400 tabular-nums">
                +{health.latestScan.newParcels.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Updated</p>
              <p className="text-lg font-semibold text-blue-400 tabular-nums">
                {health.latestScan.updatedParcels.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Errors</p>
              <p
                className={cn(
                  'text-lg font-semibold tabular-nums',
                  health.latestScan.errors > 0
                    ? 'text-red-400'
                    : 'text-gray-400'
                )}
              >
                {health.latestScan.errors}
              </p>
            </div>
          </div>

          {/* Per-source breakdown */}
          {health.latestScan.sources.length > 0 && (
            <div className="border-t border-gray-800/60 px-5 py-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                Source Breakdown
              </p>
              <div className="space-y-2">
                {health.latestScan.sources.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-lg bg-gray-800/40 px-3 py-2 text-sm"
                  >
                    <span className="text-gray-300">{s.sourceName}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 tabular-nums">
                        {s.listings} listings
                      </span>
                      {s.errors > 0 && (
                        <span className="flex items-center gap-1 text-xs text-red-400">
                          <AlertTriangle className="h-3 w-3" />
                          {s.errors}
                        </span>
                      )}
                      {statusBadge(s.status)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Scan history table */}
      <div className="rounded-xl bg-gray-900/50 border border-gray-800/60 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800/60">
          <h3 className="text-sm font-semibold text-gray-200">
            Scan History
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800/60 text-left">
                <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider text-right">
                  Listings
                </th>
                <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider text-right">
                  New
                </th>
                <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider text-right">
                  Updated
                </th>
                <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider text-right">
                  Errors
                </th>
                <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider text-right">
                  Sources
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/40">
              {health.recentScans.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-8 text-center text-gray-500"
                  >
                    No scan runs recorded yet
                  </td>
                </tr>
              ) : (
                health.recentScans.map((scan) => (
                  <tr
                    key={scan.id}
                    className="hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="px-5 py-3 text-gray-300 whitespace-nowrap">
                      {formatDate(scan.startedAt)}
                    </td>
                    <td className="px-5 py-3">{statusBadge(scan.status)}</td>
                    <td className="px-5 py-3 text-right text-gray-300 tabular-nums">
                      {scan.totalListings.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right text-emerald-400 tabular-nums">
                      +{scan.newParcels}
                    </td>
                    <td className="px-5 py-3 text-right text-blue-400 tabular-nums">
                      {scan.updatedParcels}
                    </td>
                    <td
                      className={cn(
                        'px-5 py-3 text-right tabular-nums',
                        scan.errors > 0 ? 'text-red-400' : 'text-gray-500'
                      )}
                    >
                      {scan.errors}
                    </td>
                    <td className="px-5 py-3 text-right text-gray-400 tabular-nums">
                      {scan.sourceCount}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Configuration Tab ─────────────────────────────────────────────

function ConfigTab({ config }: { config: AdminConfig }) {
  const maxWeight = Math.max(...Object.values(config.fitScore.weights))

  return (
    <div className="space-y-6">
      {/* Read-only notice */}
      <div className="flex items-center gap-2 rounded-lg bg-blue-500/10 border border-blue-500/20 px-4 py-2.5">
        <Shield className="h-4 w-4 text-blue-400 flex-shrink-0" />
        <p className="text-xs text-blue-300">
          Configuration is read-only in the demo. Edit{' '}
          <code className="rounded bg-blue-500/10 px-1.5 py-0.5 font-mono text-[11px]">
            lib/admin-config.ts
          </code>{' '}
          to change settings.
        </p>
      </div>

      {/* Allowed States */}
      <div className="rounded-xl bg-gray-900/50 border border-gray-800/60 p-5">
        <h3 className="text-sm font-semibold text-gray-200 mb-3">
          Target States
        </h3>
        <div className="flex flex-wrap gap-2">
          {config.allowedStates.map((state) => (
            <span
              key={state}
              className="inline-flex items-center rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 text-sm font-semibold text-emerald-400"
            >
              {state}
            </span>
          ))}
        </div>
      </div>

      {/* Acreage & Metro */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-gray-900/50 border border-gray-800/60 p-5">
          <h3 className="text-sm font-semibold text-gray-200 mb-3">
            Acreage Range
          </h3>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">Minimum</p>
              <p className="text-xl font-bold text-gray-100 tabular-nums">
                {config.acreage.min.toLocaleString()} ac
              </p>
            </div>
            <div className="h-8 w-px bg-gray-700" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">Maximum</p>
              <p className="text-xl font-bold text-gray-100 tabular-nums">
                {config.acreage.max.toLocaleString()} ac
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-gray-900/50 border border-gray-800/60 p-5">
          <h3 className="text-sm font-semibold text-gray-200 mb-3">
            Metro Proximity
          </h3>
          <p className="text-xl font-bold text-gray-100 tabular-nums">
            {config.metroRadiusMiles} miles
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Maximum distance from nearest metro area
          </p>
        </div>
      </div>

      {/* Fit Score Weights */}
      <div className="rounded-xl bg-gray-900/50 border border-gray-800/60 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-gray-200">
            Fit Score Weights
          </h3>
          <span className="ml-auto text-xs text-gray-500">
            Total:{' '}
            {Object.values(config.fitScore.weights).reduce(
              (a, b) => a + b,
              0
            )}
            /100
          </span>
        </div>
        <div className="space-y-3">
          {Object.entries(config.fitScore.weights).map(([key, weight]) => {
            const label = key
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, (s) => s.toUpperCase())
            const pct = maxWeight > 0 ? (weight / maxWeight) * 100 : 0
            return (
              <div key={key} className="flex items-center gap-3">
                <span className="w-32 text-xs text-gray-400 truncate">
                  {label}
                </span>
                <div className="flex-1 h-2 rounded-full bg-gray-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 text-right text-xs font-semibold text-gray-300 tabular-nums">
                  {weight}
                </span>
              </div>
            )
          })}
        </div>

        {/* Thresholds */}
        <div className="mt-5 pt-4 border-t border-gray-800/60 flex gap-6">
          <div>
            <p className="text-xs text-gray-500 mb-1">High Threshold</p>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {config.fitScore.thresholds.high}+
            </span>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Medium Threshold</p>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-400">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              {config.fitScore.thresholds.medium}+
            </span>
          </div>
        </div>

        {/* Auto-fail */}
        <div className="mt-4 pt-4 border-t border-gray-800/60">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            Auto-Fail Criteria
          </p>
          <div className="flex flex-wrap gap-2">
            {config.fitScore.autoFail.floodway && (
              <span className="inline-flex items-center gap-1 rounded-md bg-red-500/15 border border-red-500/30 px-2.5 py-1 text-xs font-medium text-red-400">
                <XCircle className="h-3 w-3" />
                In Floodway
              </span>
            )}
            {config.fitScore.autoFail.wetlandsOverPct != null && (
              <span className="inline-flex items-center gap-1 rounded-md bg-red-500/15 border border-red-500/30 px-2.5 py-1 text-xs font-medium text-red-400">
                <XCircle className="h-3 w-3" />
                Wetlands &gt; {config.fitScore.autoFail.wetlandsOverPct}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Data Sources */}
      <div className="rounded-xl bg-gray-900/50 border border-gray-800/60 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800/60">
          <h3 className="text-sm font-semibold text-gray-200">
            Data Sources
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800/60 text-left">
                <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Frequency
                </th>
                <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider text-right">
                  Rate Limit
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/40">
              {config.dataSources.map((source) => (
                <tr
                  key={source.id}
                  className="hover:bg-gray-800/30 transition-colors"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Globe className="h-3.5 w-3.5 text-gray-500" />
                      <span className="font-medium text-gray-200">
                        {source.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={cn(
                        'inline-flex rounded-md border px-2 py-0.5 text-xs font-medium',
                        source.type === 'portal'
                          ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                          : 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                      )}
                    >
                      {source.type}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {source.enabled ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        Enabled
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        <XCircle className="h-3 w-3" />
                        Disabled
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-400 capitalize">
                    {source.crawlFrequency}
                  </td>
                  <td className="px-5 py-3 text-right text-gray-400 tabular-nums">
                    {source.rateLimitPerMin}/min
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scheduling */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-gray-900/50 border border-gray-800/60 p-5">
          <h3 className="text-sm font-semibold text-gray-200 mb-3">
            Weekly Scan
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Status</span>
              <span
                className={cn(
                  'font-medium',
                  config.scheduling.weeklyScan.enabled
                    ? 'text-emerald-400'
                    : 'text-gray-500'
                )}
              >
                {config.scheduling.weeklyScan.enabled
                  ? 'Enabled'
                  : 'Disabled'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Day</span>
              <span className="text-gray-200">
                {
                  ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
                    config.scheduling.weeklyScan.dayOfWeekUTC
                  ]
                }
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Time (UTC)</span>
              <span className="text-gray-200 tabular-nums">
                {String(config.scheduling.weeklyScan.hourUTC).padStart(2, '0')}
                :00
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-gray-900/50 border border-gray-800/60 p-5">
          <h3 className="text-sm font-semibold text-gray-200 mb-3">
            On-Demand Scan
          </h3>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Status</span>
            <span
              className={cn(
                'font-medium',
                config.scheduling.onDemandScan.enabled
                  ? 'text-emerald-400'
                  : 'text-gray-500'
              )}
            >
              {config.scheduling.onDemandScan.enabled
                ? 'Enabled'
                : 'Disabled'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Tab Container ─────────────────────────────────────────────────

const TABS = [
  { id: 'health', label: 'System Health', icon: Activity },
  { id: 'config', label: 'Configuration', icon: Settings },
] as const

type TabId = (typeof TABS)[number]['id']

export function AdminTabs({
  health,
  config,
}: {
  health: HealthData
  config: AdminConfig
}) {
  const [activeTab, setActiveTab] = useState<TabId>('health')

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl bg-gray-900/50 border border-gray-800/60 p-1 mb-6 w-fit">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-gray-800 text-gray-100 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'health' && <HealthTab health={health} />}
      {activeTab === 'config' && <ConfigTab config={config} />}
    </div>
  )
}
