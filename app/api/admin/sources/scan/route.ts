import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { LandScanner } from '@/lib/jobs/scanner'

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get admin config
    const adminConfig = await prisma.adminConfig.findUnique({
      where: { orgId: 'default' }
    })
    
    if (!adminConfig) {
      return NextResponse.json({ error: 'Admin config not found' }, { status: 404 })
    }
    
    // Start scan in background (non-blocking)
    const scanner = new LandScanner(adminConfig.config as any)
    
    // Run scan asynchronously
    scanner.runScan('on-demand').catch(error => {
      console.error('Background scan failed:', error)
    })
    
    return NextResponse.json({ 
      message: 'Scan started successfully',
      status: 'running'
    })
    
  } catch (error) {
    console.error('Scan API error:', error)
    return NextResponse.json(
      { error: 'Failed to start scan' },
      { status: 500 }
    )
  }
}