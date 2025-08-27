import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    // Check database connection and table existence
    const checks = await Promise.allSettled([
      prisma.adminConfig.count(),
      prisma.scanRun.count(),
      prisma.parcel.count(),
      prisma.listing.count(),
      prisma.source.count()
    ])
    
    const results = {
      database: 'connected',
      tables: {
        adminConfig: checks[0].status === 'fulfilled' ? 'exists' : 'missing',
        scanRun: checks[1].status === 'fulfilled' ? 'exists' : 'missing',
        parcel: checks[2].status === 'fulfilled' ? 'exists' : 'missing',
        listing: checks[3].status === 'fulfilled' ? 'exists' : 'missing',
        source: checks[4].status === 'fulfilled' ? 'exists' : 'missing'
      },
      counts: {
        adminConfig: checks[0].status === 'fulfilled' ? (checks[0] as any).value : 0,
        scanRun: checks[1].status === 'fulfilled' ? (checks[1] as any).value : 0,
        parcel: checks[2].status === 'fulfilled' ? (checks[2] as any).value : 0,
        listing: checks[3].status === 'fulfilled' ? (checks[3] as any).value : 0,
        source: checks[4].status === 'fulfilled' ? (checks[4] as any).value : 0
      },
      errors: checks.map((check, index) => 
        check.status === 'rejected' ? 
        { table: ['adminConfig', 'scanRun', 'parcel', 'listing', 'source'][index], error: check.reason.message } : null
      ).filter(Boolean)
    }
    
    return NextResponse.json(results)
    
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json(
      { 
        database: 'disconnected',
        error: (error as Error).message 
      },
      { status: 500 }
    )
  }
}