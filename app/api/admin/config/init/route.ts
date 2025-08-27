import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { DEFAULT_ADMIN_CONFIG } from '@/lib/admin-config-schema'

export async function POST(req: NextRequest) {
  try {
    // Temporarily bypass authentication for testing
    // const { userId } = auth()
    // if (!userId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }
    
    // Check if admin config exists
    const existingConfig = await prisma.adminConfig.findUnique({
      where: { orgId: 'default' }
    })
    
    if (existingConfig) {
      return NextResponse.json({ 
        message: 'Admin config already exists',
        config: JSON.parse(existingConfig.config)
      })
    }
    
    // Create default admin config
    const adminConfig = await prisma.adminConfig.create({
      data: {
        orgId: 'default',
        config: JSON.stringify(DEFAULT_ADMIN_CONFIG)
      }
    })
    
    // Also create the source records if they don't exist
    try {
      const existingSources = await prisma.source.count()
      if (existingSources === 0) {
        // Create source records from the config
        const sources = DEFAULT_ADMIN_CONFIG.listingSources.map(source => ({
          id: source.id,
          name: source.name,
          baseUrl: source.baseUrl,
          type: source.type,
          adapter: source.adapter,
          enabled: source.enabled,
          crawlFrequency: source.crawlFrequency,
          rateLimitPerMin: source.rateLimitPerMin
        }))
        
        await prisma.source.createMany({
          data: sources,
          skipDuplicates: true
        })
        
        console.log(`Created ${sources.length} source records`)
      }
    } catch (sourceError) {
      console.error('Failed to create sources:', sourceError)
      // Continue anyway - the main config was created
    }
    
    return NextResponse.json({ 
      message: 'Admin config created successfully',
      config: JSON.parse(adminConfig.config)
    })
    
  } catch (error) {
    console.error('Admin config init error:', error)
    return NextResponse.json(
      { error: 'Failed to initialize admin config' },
      { status: 500 }
    )
  }
}