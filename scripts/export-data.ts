/**
 * Build-time data export script
 *
 * Reads all data from the SQLite database via Prisma and writes
 * static JSON files into the data/ directory. These JSON files are
 * then read by the API routes at runtime on Vercel (where SQLite
 * is not reliably available).
 *
 * Run: npx tsx scripts/export-data.ts
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

const DATA_DIR = path.join(process.cwd(), 'data')
const PARCELS_DIR = path.join(DATA_DIR, 'parcels')

function ensureDirs() {
  fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.mkdirSync(PARCELS_DIR, { recursive: true })
}

function writeJson(filePath: string, data: unknown) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

async function exportParcels() {
  console.log('Exporting parcels...')

  const parcels = await prisma.parcel.findMany({
    include: {
      fitScore: true,
      listings: {
        select: {
          sourceId: true,
          price: true,
          pricePerAcre: true,
          status: true,
        },
      },
      deal: {
        select: {
          stage: true,
          priority: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const mapped = parcels.map((p) => ({
    id: p.id,
    apn: p.apn,
    address: p.address,
    county: p.county,
    state: p.state,
    acreage: p.acreage,
    lat: p.lat,
    lon: p.lon,
    zoning: p.zoning,
    createdAt: p.createdAt.toISOString(),
    fitScore: p.fitScore
      ? { overallScore: p.fitScore.overallScore, topReasons: p.fitScore.topReasons }
      : null,
    listings: p.listings,
    deal: p.deal ? { stage: p.deal.stage, priority: p.deal.priority } : null,
  }))

  writeJson(path.join(DATA_DIR, 'parcels.json'), mapped)
  console.log(`  Wrote ${mapped.length} parcels to parcels.json`)
  return mapped
}

async function exportParcelDetails() {
  console.log('Exporting individual parcel details...')

  const parcels = await prisma.parcel.findMany({
    include: {
      listings: true,
      features: true,
      fitScore: true,
      deal: {
        include: {
          activities: { orderBy: { createdAt: 'desc' } },
        },
      },
      ownership: true,
    },
  })

  for (const parcel of parcels) {
    writeJson(path.join(PARCELS_DIR, `${parcel.id}.json`), parcel)
  }

  console.log(`  Wrote ${parcels.length} individual parcel files`)
}

async function exportDeals() {
  console.log('Exporting deals...')

  const deals = await prisma.deal.findMany({
    include: {
      parcel: {
        include: {
          fitScore: true,
          listings: { take: 1 },
        },
      },
      activities: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  writeJson(path.join(DATA_DIR, 'deals.json'), deals)
  console.log(`  Wrote ${deals.length} deals to deals.json`)
}

async function exportStats() {
  console.log('Exporting stats...')

  const [
    totalParcels,
    totalListings,
    totalDeals,
    fitScores,
    parcelsWithState,
    listingsBySrc,
  ] = await Promise.all([
    prisma.parcel.count(),
    prisma.listing.count(),
    prisma.deal.count(),
    prisma.fitScore.findMany({
      select: { overallScore: true },
    }),
    prisma.parcel.groupBy({
      by: ['state'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    }),
    prisma.listing.groupBy({
      by: ['sourceId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    }),
  ])

  const scores = fitScores.map((f) => f.overallScore)
  const avgFitScore =
    scores.length > 0
      ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
      : 0
  const highFitCount = scores.filter((s) => s >= 80).length
  const medFitCount = scores.filter((s) => s >= 50 && s < 80).length
  const lowFitCount = scores.filter((s) => s < 50).length

  const byState: Record<string, number> = {}
  for (const row of parcelsWithState) {
    byState[row.state] = row._count.id
  }

  const bySources = listingsBySrc.map((row) => ({
    sourceId: row.sourceId,
    count: row._count.id,
  }))

  const stats = {
    totalParcels,
    totalListings,
    totalDeals,
    avgFitScore,
    highFitCount,
    medFitCount,
    lowFitCount,
    byState,
    bySources,
  }

  writeJson(path.join(DATA_DIR, 'stats.json'), stats)
  console.log('  Wrote stats.json')
}

async function exportHealth() {
  console.log('Exporting health data...')

  const [lastScan, parcelsCount, listingsCount, dealsCount, sourcesCount, sources] =
    await Promise.all([
      prisma.scanRun.findFirst({
        orderBy: { startedAt: 'desc' },
        select: {
          id: true,
          status: true,
          startedAt: true,
          totalListings: true,
          newParcels: true,
        },
      }),
      prisma.parcel.count(),
      prisma.listing.count(),
      prisma.deal.count(),
      prisma.source.count(),
      prisma.source.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          enabled: true,
          lastCrawl: true,
        },
        orderBy: { name: 'asc' },
      }),
    ])

  const health = {
    lastScan,
    counts: {
      parcels: parcelsCount,
      listings: listingsCount,
      deals: dealsCount,
      sources: sourcesCount,
    },
    sources,
  }

  writeJson(path.join(DATA_DIR, 'health.json'), health)
  console.log('  Wrote health.json')
}

async function main() {
  console.log('=== LandScout Data Export ===')
  console.log(`Output directory: ${DATA_DIR}`)
  console.log('')

  ensureDirs()

  await exportParcels()
  await exportParcelDetails()
  await exportDeals()
  await exportStats()
  await exportHealth()

  console.log('')
  console.log('=== Export complete ===')
}

main()
  .catch((e) => {
    console.error('Export failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
