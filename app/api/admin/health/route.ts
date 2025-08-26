import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get latest scan run
    const latestScan = await prisma.scanRun.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        sources: {
          include: {
            source: true
          }
        }
      }
    })
    
    // Get source statistics
    const sources = await prisma.source.findMany({
      select: {
        id: true,
        name: true,
        enabled: true,
        lastCrawledAt: true,
        _count: {
          select: {
            listings: true
          }
        }
      }
    })
    
    // Get overall statistics
    const stats = await prisma.$transaction([
      prisma.parcel.count(),
      prisma.listing.count(),
      prisma.deal.count(),
      prisma.fitScore.count({ where: { overallScore: { gte: 80 } } }),
      prisma.fitScore.count({ where: { overallScore: { gte: 60, lt: 80 } } }),
    ])
    
    return NextResponse.json({
      latestScan,
      sources,
      statistics: {
        totalParcels: stats[0],
        totalListings: stats[1],
        totalDeals: stats[2],
        highFitCount: stats[3],
        mediumFitCount: stats[4]
      }
    })
    
  } catch (error) {
    console.error('Health API error:', error)
    return NextResponse.json(
      { error: 'Failed to get health status' },
      { status: 500 }
    )
  }
}