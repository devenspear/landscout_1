import { PrismaClient } from '@prisma/client'
import { DEFAULT_ADMIN_CONFIG } from '../lib/admin-config-schema'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // Seed AdminConfig
  const adminConfig = await prisma.adminConfig.upsert({
    where: { orgId: 'default' },
    update: {
      config: JSON.stringify(DEFAULT_ADMIN_CONFIG)
    },
    create: {
      orgId: 'default',
      config: JSON.stringify(DEFAULT_ADMIN_CONFIG)
    }
  })
  console.log('Created/updated admin config:', adminConfig.id)

  // Seed Sources from the config
  for (const source of DEFAULT_ADMIN_CONFIG.listingSources) {
    const dbSource = await prisma.source.upsert({
      where: {
        id: source.id
      },
      update: {
        name: source.name,
        baseUrl: source.baseUrl,
        type: source.type,
        adapter: source.adapter,
        enabled: source.enabled,
        crawlFrequency: source.crawlFrequency,
        rateLimitPerMin: source.rateLimitPerMin
      },
      create: {
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
    console.log(`Created/updated source: ${dbSource.name}`)
  }

  // Create a sample scan run for testing
  const scanRun = await prisma.scanRun.create({
    data: {
      runType: 'on-demand',
      status: 'completed',
      completedAt: new Date(),
      processedCount: 150,
      newCount: 25,
      updatedCount: 10,
      duplicateCount: 5,
      errorCount: 0
    }
  })
  console.log('Created sample scan run:', scanRun.id)

  // Create some sample parcels with features and fit scores
  const sampleParcels = [
    {
      apn: 'VA-001-234-567',
      acreage: 250.5,
      county: 'Albemarle',
      countyFips: '51003',
      state: 'VA',
      centroidLat: 38.0293,
      centroidLon: -78.4767,
      zoning: 'Agricultural',
      zoningBucket: 'ag'
    },
    {
      apn: 'NC-002-345-678',
      acreage: 450.2,
      county: 'Wake',
      countyFips: '37183',
      state: 'NC',
      centroidLat: 35.7796,
      centroidLon: -78.6382,
      zoning: 'Rural Residential',
      zoningBucket: 'ruralRes'
    },
    {
      apn: 'GA-003-456-789',
      acreage: 175.8,
      county: 'Fulton',
      countyFips: '13121',
      state: 'GA',
      centroidLat: 33.7490,
      centroidLon: -84.3880,
      zoning: 'Mixed Use',
      zoningBucket: 'mixedUse'
    }
  ]

  for (const parcelData of sampleParcels) {
    const parcel = await prisma.parcel.create({
      data: parcelData
    })

    // Create features for the parcel
    await prisma.features.create({
      data: {
        parcelId: parcel.id,
        landCoverMix: JSON.stringify({
          forest: 40,
          pasture: 35,
          crop: 20,
          other: 5
        }),
        slopeStats: JSON.stringify({
          min: 0,
          max: 25,
          mean: 8,
          percentOver20: 15,
          percentOver40: 0
        }),
        waterPresence: true,
        waterFeatures: JSON.stringify(['creek', 'pond']),
        inFloodway: false,
        wetlandsPercent: 5,
        roadAccess: 'paved',
        metroDistance: Math.random() * 50 + 10,
        nearestMetro: 'Charlotte'
      }
    })

    // Create fit score
    const score = Math.floor(Math.random() * 40) + 60
    await prisma.fitScore.create({
      data: {
        parcelId: parcel.id,
        overallScore: score,
        scoreBreakdown: JSON.stringify({
          acreage: 18,
          landCoverMix: 16,
          waterPresence: 8,
          metroProximity: 7,
          slope: 8,
          soils: 7,
          roadAccess: 9,
          easementPenalty: 4,
          utilities: 3
        }),
        topReasons: JSON.stringify([
          'Excellent acreage in target range',
          'Good land cover mix',
          'Water features present',
          'Paved road access',
          'Reasonable metro proximity'
        ]),
        autoFailed: false
      }
    })

    // Create a sample listing
    await prisma.listing.create({
      data: {
        sourceId: 'landwatch',
        parcelId: parcel.id,
        externalId: `LW-${Math.random().toString(36).substring(7)}`,
        url: `https://www.landwatch.com/property/${parcel.apn}`,
        title: `${parcel.acreage} Acres in ${parcel.county} County`,
        description: 'Beautiful land with great potential for development or conservation.',
        price: Math.floor(parcel.acreage * (8000 + Math.random() * 4000)),
        pricePerAcre: 8000 + Math.random() * 4000,
        status: 'listed',
        photos: JSON.stringify([
          'https://example.com/photo1.jpg',
          'https://example.com/photo2.jpg'
        ])
      }
    })

    console.log(`Created sample parcel: ${parcel.apn}`)
  }

  console.log('Seed completed successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('Seed failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })