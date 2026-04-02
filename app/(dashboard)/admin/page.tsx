import { prisma } from '@/lib/prisma'
import { DEFAULT_ADMIN_CONFIG } from '@/lib/admin-config'
import { AdminTabs } from '@/components/admin-tabs'

async function getHealthData() {
  const [
    latestScan,
    recentScans,
    sourceCount,
    enabledSourceCount,
    parcelCount,
    listingCount,
    dealCount,
    fitScoreCount,
  ] = await Promise.all([
    prisma.scanRun.findFirst({
      orderBy: { startedAt: 'desc' },
      include: {
        sources: {
          include: { source: true },
        },
      },
    }),
    prisma.scanRun.findMany({
      orderBy: { startedAt: 'desc' },
      take: 10,
      include: {
        sources: {
          include: { source: true },
        },
      },
    }),
    prisma.source.count(),
    prisma.source.count({ where: { enabled: true } }),
    prisma.parcel.count(),
    prisma.listing.count(),
    prisma.deal.count(),
    prisma.fitScore.count(),
  ])

  return {
    latestScan,
    recentScans,
    sourceCount,
    enabledSourceCount,
    parcelCount,
    listingCount,
    dealCount,
    fitScoreCount,
  }
}

export default async function AdminPage() {
  const health = await getHealthData()

  const healthData = {
    latestScan: health.latestScan
      ? {
          id: health.latestScan.id,
          status: health.latestScan.status,
          totalListings: health.latestScan.totalListings,
          newParcels: health.latestScan.newParcels,
          updatedParcels: health.latestScan.updatedParcels,
          errors: health.latestScan.errors,
          startedAt: health.latestScan.startedAt.toISOString(),
          completedAt: health.latestScan.completedAt?.toISOString() ?? null,
          sources: health.latestScan.sources.map((s) => ({
            id: s.id,
            sourceName: s.source.name,
            status: s.status,
            listings: s.listings,
            errors: s.errors,
          })),
        }
      : null,
    recentScans: health.recentScans.map((scan) => ({
      id: scan.id,
      status: scan.status,
      totalListings: scan.totalListings,
      newParcels: scan.newParcels,
      updatedParcels: scan.updatedParcels,
      errors: scan.errors,
      startedAt: scan.startedAt.toISOString(),
      completedAt: scan.completedAt?.toISOString() ?? null,
      sourceCount: scan.sources.length,
    })),
    sourceCount: health.sourceCount,
    enabledSourceCount: health.enabledSourceCount,
    parcelCount: health.parcelCount,
    listingCount: health.listingCount,
    dealCount: health.dealCount,
    fitScoreCount: health.fitScoreCount,
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-100">Admin</h1>
        <p className="mt-1 text-sm text-gray-400">
          System health and configuration overview
        </p>
      </div>

      <AdminTabs health={healthData} config={DEFAULT_ADMIN_CONFIG} />
    </div>
  )
}
