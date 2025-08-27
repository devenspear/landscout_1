import { prisma } from '@/lib/prisma'
import { getAdapter } from '@/lib/adapters'
import { ListingCandidate } from '@/lib/adapters/types'
import { calculateFitScore } from '@/lib/fit-score'
import { AdminConfig } from '@/lib/admin-config-schema'

export class LandScanner {
  private config: AdminConfig
  private scanRunId: string | null = null
  
  constructor(config: AdminConfig) {
    this.config = config
  }
  
  async runScan(runType: 'weekly' | 'on-demand' = 'on-demand') {
    console.log(`Starting ${runType} scan...`)
    
    // Create scan run record
    const scanRun = await prisma.scanRun.create({
      data: {
        runType,
        status: 'running'
      }
    })
    this.scanRunId = scanRun.id
    
    try {
      let totalProcessed = 0
      let totalNew = 0
      let totalUpdated = 0
      let totalDuplicates = 0
      let totalErrors = 0
      const errors: any[] = []
      
      // Process each enabled source
      for (const sourceConfig of this.config.listingSources) {
        if (!sourceConfig.enabled) continue
        
        const sourceRun = await prisma.scanRunSource.create({
          data: {
            scanRunId: scanRun.id,
            sourceId: sourceConfig.id,
            status: 'running'
          }
        })
        
        try {
          const adapter = getAdapter(sourceConfig.adapter)
          if (!adapter) {
            console.warn(`No adapter found for ${sourceConfig.name}`)
            continue
          }
          
          // Search for listings
          const candidates = await adapter.search({
            states: this.config.allowedStates,
            minAcreage: this.config.acreage.min,
            maxAcreage: this.config.acreage.max
          })
          
          console.log(`Found ${candidates.length} listings from ${sourceConfig.name}`)
          
          // Process each candidate
          for (const candidate of candidates) {
            totalProcessed++
            
            try {
              const result = await this.processListing(candidate, sourceConfig.id)
              if (result.isNew) totalNew++
              else if (result.isUpdated) totalUpdated++
              else if (result.isDuplicate) totalDuplicates++
            } catch (error) {
              totalErrors++
              errors.push({ source: sourceConfig.name, error: String(error) })
              console.error(`Error processing listing:`, error)
            }
          }
          
          // Update source run status
          await prisma.scanRunSource.update({
            where: { id: sourceRun.id },
            data: {
              status: 'completed',
              processed: candidates.length
            }
          })
          
        } catch (error) {
          console.error(`Error processing source ${sourceConfig.name}:`, error)
          errors.push({ source: sourceConfig.name, error: String(error) })
          
          await prisma.scanRunSource.update({
            where: { id: sourceRun.id },
            data: {
              status: 'failed',
              errors: String(error)
            }
          })
        }
        
        // Rate limiting
        await this.sleep(60000 / sourceConfig.rateLimitPerMin)
      }
      
      // Update scan run with results
      await prisma.scanRun.update({
        where: { id: scanRun.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          processedCount: totalProcessed,
          newCount: totalNew,
          updatedCount: totalUpdated,
          duplicateCount: totalDuplicates,
          errorCount: totalErrors,
          errors: errors.length > 0 ? JSON.stringify(errors) : null
        }
      })
      
      console.log(`Scan completed: ${totalProcessed} processed, ${totalNew} new, ${totalUpdated} updated`)
      
    } catch (error) {
      console.error('Scan failed:', error)
      
      await prisma.scanRun.update({
        where: { id: scanRun.id },
        data: {
          status: 'failed',
          completedAt: new Date(),
          errors: String(error)
        }
      })
      
      throw error
    }
  }
  
  private async processListing(candidate: ListingCandidate, sourceId: string) {
    // Check if listing already exists
    const existingListing = await prisma.listing.findUnique({
      where: {
        sourceId_externalId: {
          sourceId,
          externalId: candidate.externalId || candidate.url
        }
      },
      include: { parcel: true }
    })
    
    if (existingListing) {
      // Check if listing has changed
      const hasChanged = this.hasListingChanged(existingListing, candidate)
      if (hasChanged) {
        // Update listing
        await prisma.listing.update({
          where: { id: existingListing.id },
          data: {
            title: candidate.title,
            description: candidate.description,
            price: candidate.price,
            pricePerAcre: candidate.pricePerAcre,
            status: candidate.status,
            photos: candidate.photos ? JSON.stringify(candidate.photos) : null,
            lastSeenAt: new Date(),
            lastChangedAt: new Date()
          }
        })
        return { isNew: false, isUpdated: true, isDuplicate: false }
      }
      
      // Just update last seen
      await prisma.listing.update({
        where: { id: existingListing.id },
        data: { lastSeenAt: new Date() }
      })
      return { isNew: false, isUpdated: false, isDuplicate: false }
    }
    
    // Find or create parcel
    let parcel = await this.findOrCreateParcel(candidate)
    
    // Check for duplicate listings on same parcel
    if (parcel) {
      const duplicateListing = await prisma.listing.findFirst({
        where: { parcelId: parcel.id }
      })
      
      if (duplicateListing) {
        return { isNew: false, isUpdated: false, isDuplicate: true }
      }
    }
    
    // Create new listing
    const listing = await prisma.listing.create({
      data: {
        sourceId,
        parcelId: parcel?.id,
        externalId: candidate.externalId || candidate.url,
        url: candidate.url,
        title: candidate.title,
        description: candidate.description,
        price: candidate.price,
        pricePerAcre: candidate.pricePerAcre,
        status: candidate.status,
        photos: candidate.photos ? JSON.stringify(candidate.photos) : null,
        sourceData: candidate.metadata ? JSON.stringify(candidate.metadata) : null
      }
    })
    
    // Calculate and save fit score if we have a parcel
    if (parcel) {
      await this.calculateAndSaveFitScore(parcel.id)
    }
    
    return { isNew: true, isUpdated: false, isDuplicate: false }
  }
  
  private async findOrCreateParcel(candidate: ListingCandidate) {
    // Try to find by APN if available
    if (candidate.apn) {
      const existing = await prisma.parcel.findFirst({
        where: {
          apn: candidate.apn,
          county: candidate.county,
          state: candidate.state
        }
      })
      if (existing) return existing
    }
    
    // Try to find by location and acreage (fuzzy match)
    if (candidate.lat && candidate.lon) {
      const nearby = await prisma.parcel.findFirst({
        where: {
          centroidLat: { gte: candidate.lat - 0.002, lte: candidate.lat + 0.002 },
          centroidLon: { gte: candidate.lon - 0.002, lte: candidate.lon + 0.002 },
          acreage: { gte: candidate.acreage * 0.97, lte: candidate.acreage * 1.03 }
        }
      })
      if (nearby) return nearby
    }
    
    // Create new parcel
    return prisma.parcel.create({
      data: {
        apn: candidate.apn,
        acreage: candidate.acreage,
        centroidLat: candidate.lat,
        centroidLon: candidate.lon,
        county: candidate.county,
        state: candidate.state,
        address: candidate.address
      }
    })
  }
  
  private async calculateAndSaveFitScore(parcelId: string) {
    const parcel = await prisma.parcel.findUnique({
      where: { id: parcelId },
      include: { features: true }
    })
    
    if (!parcel) return
    
    const fitScore = calculateFitScore(parcel, parcel.features, this.config)
    
    await prisma.fitScore.upsert({
      where: { parcelId },
      update: {
        overallScore: fitScore.overallScore,
        scoreBreakdown: JSON.stringify(fitScore.scoreBreakdown),
        topReasons: JSON.stringify(fitScore.topReasons),
        autoFailed: fitScore.autoFailed,
        autoFailReason: fitScore.autoFailReason,
        computedAt: new Date()
      },
      create: {
        parcelId,
        overallScore: fitScore.overallScore,
        scoreBreakdown: JSON.stringify(fitScore.scoreBreakdown),
        topReasons: JSON.stringify(fitScore.topReasons),
        autoFailed: fitScore.autoFailed,
        autoFailReason: fitScore.autoFailReason
      }
    })
  }
  
  private hasListingChanged(existing: any, candidate: ListingCandidate): boolean {
    return existing.title !== candidate.title ||
           existing.description !== candidate.description ||
           existing.price !== candidate.price ||
           existing.status !== candidate.status
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}