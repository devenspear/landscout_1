import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
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

    // Calculate score stats from fetched fit scores
    const scores = fitScores.map((f) => f.overallScore)
    const avgFitScore =
      scores.length > 0
        ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
        : 0
    const highFitCount = scores.filter((s) => s >= 80).length
    const medFitCount = scores.filter((s) => s >= 50 && s < 80).length
    const lowFitCount = scores.filter((s) => s < 50).length

    // Build byState as Record<string, number>
    const byState: Record<string, number> = {}
    for (const row of parcelsWithState) {
      byState[row.state] = row._count.id
    }

    // Build bySources array
    const bySources = listingsBySrc.map((row) => ({
      sourceId: row.sourceId,
      count: row._count.id,
    }))

    return NextResponse.json({
      totalParcels,
      totalListings,
      totalDeals,
      avgFitScore,
      highFitCount,
      medFitCount,
      lowFitCount,
      byState,
      bySources,
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
