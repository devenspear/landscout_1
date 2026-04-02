import { NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'

interface ParcelData {
  id: string
  apn: string | null
  address: string | null
  county: string
  state: string
  acreage: number
  lat: number | null
  lon: number | null
  zoning: string | null
  createdAt: string
  fitScore: { overallScore: number; topReasons: string } | null
  listings: { sourceId: string; price: number | null; pricePerAcre: number | null; status: string }[]
  deal: { stage: string; priority: string } | null
}

function loadParcels(): ParcelData[] {
  const filePath = path.join(process.cwd(), 'data', 'parcels.json')
  if (!fs.existsSync(filePath)) {
    throw new Error('parcels.json not found. Run the data export script during build.')
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
}

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

    let parcels = loadParcels()

    // Apply filters
    if (state) {
      parcels = parcels.filter((p) => p.state === state)
    }

    if (minAcreage !== undefined) {
      parcels = parcels.filter((p) => p.acreage >= minAcreage)
    }
    if (maxAcreage !== undefined) {
      parcels = parcels.filter((p) => p.acreage <= maxAcreage)
    }

    if (sourceId) {
      parcels = parcels.filter((p) => p.listings.some((l) => l.sourceId === sourceId))
    }

    if (minScore !== undefined) {
      parcels = parcels.filter((p) => p.fitScore && p.fitScore.overallScore >= minScore)
    }

    const total = parcels.length

    // Apply sorting
    parcels.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1

      switch (sortBy) {
        case 'score': {
          const scoreA = a.fitScore?.overallScore ?? (sortDir === 'asc' ? Infinity : -Infinity)
          const scoreB = b.fitScore?.overallScore ?? (sortDir === 'asc' ? Infinity : -Infinity)
          return (scoreA - scoreB) * dir
        }
        case 'acreage':
          return (a.acreage - b.acreage) * dir
        case 'state':
          return a.state.localeCompare(b.state) * dir
        case 'price': {
          const priceA = a.listings[0]?.price ?? (sortDir === 'asc' ? Infinity : -Infinity)
          const priceB = b.listings[0]?.price ?? (sortDir === 'asc' ? Infinity : -Infinity)
          return (priceA - priceB) * dir
        }
        case 'createdAt':
        default:
          return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir
      }
    })

    // Apply pagination
    const skip = (page - 1) * limit
    const results = parcels.slice(skip, skip + limit)

    return NextResponse.json({ parcels: results, total, page, limit })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Failed to search parcels. Data files may not have been generated during build.' },
      { status: 500 }
    )
  }
}
