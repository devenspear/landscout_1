import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await req.json()
    const {
      states,
      minAcreage,
      maxAcreage,
      minFitScore,
      status,
      sortBy = 'fitScore',
      sortOrder = 'desc',
      page = 1,
      limit = 50
    } = body
    
    // Build where clause
    const where: any = {}
    
    if (states && states.length > 0) {
      where.state = { in: states }
    }
    
    if (minAcreage || maxAcreage) {
      where.acreage = {}
      if (minAcreage) where.acreage.gte = minAcreage
      if (maxAcreage) where.acreage.lte = maxAcreage
    }
    
    if (minFitScore) {
      where.fitScore = {
        overallScore: { gte: minFitScore }
      }
    }
    
    // Build orderBy
    const orderBy: any = {}
    if (sortBy === 'fitScore') {
      orderBy.fitScore = { overallScore: sortOrder }
    } else if (sortBy === 'acreage') {
      orderBy.acreage = sortOrder
    } else if (sortBy === 'price') {
      orderBy.listings = { _min: { price: sortOrder } }
    }
    
    // Query parcels with related data
    const parcels = await prisma.parcel.findMany({
      where,
      include: {
        fitScore: true,
        features: true,
        listings: {
          where: status ? { status } : undefined,
          orderBy: { lastSeenAt: 'desc' },
          take: 1
        },
        deals: {
          orderBy: { updatedAt: 'desc' },
          take: 1
        }
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit
    })
    
    // Get total count for pagination
    const totalCount = await prisma.parcel.count({ where })
    
    return NextResponse.json({
      parcels,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    })
    
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: 'Failed to search parcels' },
      { status: 500 }
    )
  }
}