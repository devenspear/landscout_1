import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    console.log('Starting database setup...')
    
    // Test basic connection
    await prisma.$connect()
    console.log('Database connected successfully')
    
    // The tables should be created automatically by Prisma
    // Let's just verify they exist by doing simple operations
    const results = {
      setup: 'completed',
      timestamp: new Date().toISOString(),
      checks: {}
    }
    
    try {
      // Check AdminConfig
      const adminCount = await prisma.adminConfig.count()
      results.checks = { ...results.checks, adminConfig: { exists: true, count: adminCount } }
    } catch (error) {
      results.checks = { ...results.checks, adminConfig: { exists: false, error: (error as Error).message } }
    }
    
    try {
      // Check Source
      const sourceCount = await prisma.source.count()
      results.checks = { ...results.checks, source: { exists: true, count: sourceCount } }
    } catch (error) {
      results.checks = { ...results.checks, source: { exists: false, error: (error as Error).message } }
    }
    
    try {
      // Check ScanRun
      const scanCount = await prisma.scanRun.count()
      results.checks = { ...results.checks, scanRun: { exists: true, count: scanCount } }
    } catch (error) {
      results.checks = { ...results.checks, scanRun: { exists: false, error: (error as Error).message } }
    }
    
    try {
      // Check Parcel
      const parcelCount = await prisma.parcel.count()
      results.checks = { ...results.checks, parcel: { exists: true, count: parcelCount } }
    } catch (error) {
      results.checks = { ...results.checks, parcel: { exists: false, error: (error as Error).message } }
    }
    
    try {
      // Check Listing
      const listingCount = await prisma.listing.count()
      results.checks = { ...results.checks, listing: { exists: true, count: listingCount } }
    } catch (error) {
      results.checks = { ...results.checks, listing: { exists: false, error: (error as Error).message } }
    }
    
    await prisma.$disconnect()
    console.log('Database setup completed:', results)
    
    return NextResponse.json(results)
    
  } catch (error) {
    console.error('Database setup error:', error)
    return NextResponse.json(
      { 
        setup: 'failed',
        error: (error as Error).message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}