import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      state,
      minAcreage,
      maxAcreage,
      minScore,
      sourceId,
      sortBy = 'createdAt',
      sortDir = 'desc',
      page = 1,
      limit = 50,
    } = body

    const where: Prisma.ParcelWhereInput = {}

    if (state) {
      where.state = state
    }

    if (minAcreage !== undefined || maxAcreage !== undefined) {
      where.acreage = {}
      if (minAcreage !== undefined) where.acreage.gte = minAcreage
      if (maxAcreage !== undefined) where.acreage.lte = maxAcreage
    }

    if (sourceId) {
      where.listings = { some: { sourceId } }
    }

    // For score filtering, we need to include fitScore and filter in JS
    // since SQLite doesn't handle nested where clauses well
    if (minScore !== undefined) {
      where.fitScore = { overallScore: { gte: minScore } }
    }

    // Build orderBy
    let orderBy: Prisma.ParcelOrderByWithRelationInput = { createdAt: sortDir }

    switch (sortBy) {
      case 'score':
        orderBy = { fitScore: { overallScore: sortDir } }
        break
      case 'acreage':
        orderBy = { acreage: sortDir }
        break
      case 'state':
        orderBy = { state: sortDir }
        break
      case 'createdAt':
        orderBy = { createdAt: sortDir }
        break
      // 'price' handled post-query since it's on a relation
    }

    const skip = (page - 1) * limit

    const [parcels, total] = await Promise.all([
      prisma.parcel.findMany({
        where,
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
        orderBy,
        skip,
        take: limit,
      }),
      prisma.parcel.count({ where }),
    ])

    // If sorting by price, sort in JS
    let results = parcels
    if (sortBy === 'price') {
      results = [...parcels].sort((a, b) => {
        const priceA = a.listings[0]?.price ?? (sortDir === 'asc' ? Infinity : -Infinity)
        const priceB = b.listings[0]?.price ?? (sortDir === 'asc' ? Infinity : -Infinity)
        return sortDir === 'asc' ? priceA - priceB : priceB - priceA
      })
    }

    const mapped = results.map((p) => ({
      id: p.id,
      apn: p.apn,
      address: p.address,
      county: p.county,
      state: p.state,
      acreage: p.acreage,
      lat: p.lat,
      lon: p.lon,
      zoning: p.zoning,
      fitScore: p.fitScore
        ? { overallScore: p.fitScore.overallScore, topReasons: p.fitScore.topReasons }
        : null,
      listings: p.listings,
      deal: p.deal ? { stage: p.deal.stage, priority: p.deal.priority } : null,
    }))

    return NextResponse.json({ parcels: mapped, total, page, limit })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Failed to search parcels' },
      { status: 500 }
    )
  }
}
