import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { LandScanner } from '@/lib/jobs/scanner'

export async function POST(req: NextRequest) {
  try {
    // Temporarily bypass authentication for testing
    // const { userId } = auth()
    // if (!userId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }
    
    // Get admin config
    const adminConfig = await prisma.adminConfig.findUnique({
      where: { orgId: 'default' }
    })
    
    if (!adminConfig) {
      return NextResponse.json({ error: 'Admin config not found' }, { status: 404 })
    }
    
    let parsedConfig
    try {
      parsedConfig = JSON.parse(adminConfig.config)
    } catch (error) {
      console.error('Failed to parse admin config:', error)
      return NextResponse.json({ error: 'Invalid admin config format' }, { status: 500 })
    }
    
    // Start scan in background (non-blocking)
    try {
      const scanner = new LandScanner(parsedConfig)
      
      // Run scan asynchronously
      scanner.runScan('on-demand').catch(error => {
        console.error('Background scan failed:', error)
      })
      
      return NextResponse.json({ 
        message: 'Scan started successfully',
        status: 'running'
      })
    } catch (scannerError) {
      console.error('Failed to create scanner or start scan:', scannerError)
      return NextResponse.json({ 
        error: 'Failed to initialize scanner: ' + (scannerError as Error).message 
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('Scan API error:', error)
    return NextResponse.json(
      { error: 'Failed to start scan' },
      { status: 500 }
    )
  }
}