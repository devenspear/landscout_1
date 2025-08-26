import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { DEFAULT_ADMIN_CONFIG } from '@/lib/admin-config-schema'

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    // Check if setup already done
    const existingConfig = await prisma.adminConfig.findUnique({
      where: { orgId: 'default' }
    })
    
    if (existingConfig) {
      return NextResponse.json({ message: 'Setup already completed' })
    }
    
    // Run seed equivalent
    console.log('Starting production setup...')

    // Seed AdminConfig
    const adminConfig = await prisma.adminConfig.create({
      data: {
        orgId: 'default',
        config: DEFAULT_ADMIN_CONFIG as any
      }
    })

    // Seed Sources
    for (const source of DEFAULT_ADMIN_CONFIG.listingSources) {
      await prisma.source.create({
        data: {
          id: source.id,
          name: source.name,
          baseUrl: source.baseUrl,
          type: source.type,
          adapter: source.adapter,
          enabled: source.enabled,
          crawlFrequency: source.crawlFrequency,
          rateLimitPerMin: source.rateLimitPerMin
        }
      })
    }

    // Create sample scan run
    const scanRun = await prisma.scanRun.create({
      data: {
        runType: 'on-demand',
        status: 'completed',
        completedAt: new Date(),
        processedCount: 0,
        newCount: 0,
        updatedCount: 0,
        duplicateCount: 0,
        errorCount: 0
      }
    })

    await prisma.$disconnect()

    return NextResponse.json({ 
      message: 'Production setup completed successfully',
      adminConfigId: adminConfig.id,
      scanRunId: scanRun.id
    })
    
  } catch (error) {
    console.error('Setup failed:', error)
    await prisma.$disconnect()
    return NextResponse.json(
      { error: 'Setup failed', details: String(error) },
      { status: 500 }
    )
  }
}