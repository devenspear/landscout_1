import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
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

    return NextResponse.json({
      lastScan,
      counts: {
        parcels: parcelsCount,
        listings: listingsCount,
        deals: dealsCount,
        sources: sourcesCount,
      },
      sources,
    })
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch health data' },
      { status: 500 }
    )
  }
}
