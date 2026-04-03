// ─── Scanner Job System for LandScout 2.0 ──────────────────────────
// Orchestrates crawling all enabled sources, deduplicating results,
// and storing new/updated parcels in the database.

import { PrismaClient } from '@prisma/client'
import { adapters } from './adapters'
import type { ListingCandidate } from './adapters/types'
import { enrichParcel } from './enrichment'
import { calculateFitScore } from './fit-score'
import { DEFAULT_ADMIN_CONFIG } from './admin-config'

export interface ScanResult {
  scanRunId: string
  totalListings: number
  newParcels: number
  updatedParcels: number
  errors: number
}

/**
 * Acreage proximity check — returns true if two acreage values
 * are within the given tolerance (default 10%).
 */
function acreageMatch(a: number, b: number, tolerance = 0.1): boolean {
  const diff = Math.abs(a - b)
  const avg = (a + b) / 2
  return avg > 0 ? diff / avg <= tolerance : false
}

/**
 * Process a single listing candidate: find or create parcel, upsert listing.
 * Returns 'new' | 'updated' | 'skipped' for accounting.
 */
async function processListing(
  prisma: PrismaClient,
  listing: ListingCandidate,
  sourceDbId: string,
): Promise<'new' | 'updated' | 'skipped'> {
  // ── Find existing parcel by state + county + acreage proximity ──
  const candidates = await prisma.parcel.findMany({
    where: {
      state: listing.state,
      county: listing.county,
    },
    select: { id: true, acreage: true },
  })

  const matchingParcel = candidates.find((p) =>
    acreageMatch(p.acreage, listing.acreage)
  )

  if (matchingParcel) {
    // ── Update existing listing or create new listing on existing parcel ──
    const existingListing = await prisma.listing.findFirst({
      where: {
        sourceId: sourceDbId,
        parcelId: matchingParcel.id,
      },
    })

    if (existingListing) {
      // Update: refresh lastSeen and price if changed
      await prisma.listing.update({
        where: { id: existingListing.id },
        data: {
          lastSeen: new Date(),
          price: listing.price ?? existingListing.price,
          pricePerAcre: listing.pricePerAcre ?? existingListing.pricePerAcre,
          status: listing.status,
          photos: listing.photos ? JSON.stringify(listing.photos) : existingListing.photos,
        },
      })
      return 'updated'
    } else {
      // New listing on an existing parcel (same property on a different source)
      await prisma.listing.create({
        data: {
          parcelId: matchingParcel.id,
          sourceId: sourceDbId,
          externalId: listing.externalId,
          url: listing.url,
          title: listing.title,
          price: listing.price ?? null,
          pricePerAcre: listing.pricePerAcre ?? null,
          status: listing.status,
          photos: listing.photos ? JSON.stringify(listing.photos) : null,
          metadata: listing.metadata ? JSON.stringify(listing.metadata) : null,
        },
      })
      return 'updated'
    }
  }

  // ── No match — create new Parcel + Listing ────────────────────────
  const parcel = await prisma.parcel.create({
    data: {
      county: listing.county,
      state: listing.state,
      acreage: listing.acreage,
      address: listing.address ?? null,
      lat: listing.lat ?? null,
      lon: listing.lon ?? null,
      zoning: listing.zoning ?? null,
      description: listing.description ?? null,
      listings: {
        create: {
          sourceId: sourceDbId,
          externalId: listing.externalId,
          url: listing.url,
          title: listing.title,
          price: listing.price ?? null,
          pricePerAcre: listing.pricePerAcre ?? null,
          status: listing.status,
          photos: listing.photos ? JSON.stringify(listing.photos) : null,
          metadata: listing.metadata ? JSON.stringify(listing.metadata) : null,
        },
      },
    },
  })

  // ── Run enrichment + fit score for new parcels (if coordinates available) ──
  if (listing.lat && listing.lon) {
    try {
      const enrichment = await enrichParcel(listing.lat, listing.lon, listing.acreage)

      const features = await prisma.features.create({
        data: {
          parcelId: parcel.id,
          landCoverMix: enrichment.landCoverMix ? JSON.stringify(enrichment.landCoverMix) : null,
          waterPresence: enrichment.waterPresence,
          waterFeatures: enrichment.waterFeatures.length > 0
            ? JSON.stringify(enrichment.waterFeatures)
            : null,
          waterDistance: enrichment.waterDistance,
          metroDistance: enrichment.metroDistance,
          nearestMetro: enrichment.nearestMetro,
          slopeStats: enrichment.slopeStats ? JSON.stringify(enrichment.slopeStats) : null,
          soilsQuality: enrichment.soilsQuality,
          inFloodway: enrichment.inFloodway,
          floodZone: enrichment.floodZone,
          elevation: enrichment.elevation,
        },
      })

      // Calculate fit score
      const fitResult = calculateFitScore(
        { acreage: listing.acreage },
        features,
        {
          fitScore: DEFAULT_ADMIN_CONFIG.fitScore,
          acreage: DEFAULT_ADMIN_CONFIG.acreage,
          metroRadiusMiles: DEFAULT_ADMIN_CONFIG.metroRadiusMiles,
        }
      )

      await prisma.fitScore.create({
        data: {
          parcelId: parcel.id,
          overallScore: fitResult.overallScore,
          scoreBreakdown: JSON.stringify(fitResult.scoreBreakdown),
          topReasons: JSON.stringify(fitResult.topReasons),
          autoFailed: fitResult.autoFailed,
          autoFailReason: fitResult.autoFailReason ?? null,
        },
      })
    } catch (err) {
      console.error(`[scanner] Enrichment failed for parcel ${parcel.id}:`, err)
      // Non-fatal — parcel still created, just without enrichment data
    }
  }

  return 'new'
}

/**
 * Run a full scan across all enabled sources with matching adapters.
 */
export async function runScan(prisma: PrismaClient): Promise<ScanResult> {
  // ── Create ScanRun record ─────────────────────────────────────────
  const scanRun = await prisma.scanRun.create({
    data: { status: 'running' },
  })

  let totalListings = 0
  let newParcels = 0
  let updatedParcels = 0
  let errors = 0

  try {
    // ── Get enabled sources that have a matching adapter ────────────
    const sources = await prisma.source.findMany({
      where: { enabled: true },
    })

    // Build search params from admin config
    const searchParams = {
      states: DEFAULT_ADMIN_CONFIG.allowedStates,
      minAcreage: DEFAULT_ADMIN_CONFIG.acreage.min,
      maxAcreage: DEFAULT_ADMIN_CONFIG.acreage.max,
      maxResults: 100,
    }

    for (const source of sources) {
      const adapter = adapters[source.slug]
      if (!adapter) {
        console.log(`[scanner] No adapter for source slug "${source.slug}" — skipping`)
        continue
      }

      // Create ScanRunSource record
      const scanRunSource = await prisma.scanRunSource.create({
        data: {
          scanRunId: scanRun.id,
          sourceId: source.id,
          status: 'running',
          startedAt: new Date(),
        },
      })

      let sourceListings = 0
      let sourceErrors = 0
      const errorMessages: string[] = []

      try {
        console.log(`[scanner] Starting scan for ${source.name} (${source.slug})...`)
        const listings = await adapter.search(searchParams)

        for (const listing of listings) {
          try {
            const result = await processListing(prisma, listing, source.id)

            sourceListings++
            totalListings++

            if (result === 'new') newParcels++
            if (result === 'updated') updatedParcels++
          } catch (err) {
            sourceErrors++
            errors++
            const msg = err instanceof Error ? err.message : String(err)
            errorMessages.push(`Listing ${listing.externalId}: ${msg}`)
            console.error(`[scanner] Error processing listing ${listing.externalId}:`, err)
          }
        }

        // Update source lastCrawl timestamp
        await prisma.source.update({
          where: { id: source.id },
          data: { lastCrawl: new Date() },
        })
      } catch (err) {
        sourceErrors++
        errors++
        const msg = err instanceof Error ? err.message : String(err)
        errorMessages.push(`Adapter error: ${msg}`)
        console.error(`[scanner] Adapter error for ${source.name}:`, err)
      }

      // Update ScanRunSource with results
      await prisma.scanRunSource.update({
        where: { id: scanRunSource.id },
        data: {
          status: sourceErrors > 0 ? 'completed_with_errors' : 'completed',
          listings: sourceListings,
          errors: sourceErrors,
          errorLog: errorMessages.length > 0 ? JSON.stringify(errorMessages) : null,
          completedAt: new Date(),
        },
      })
    }

    // ── Finalize ScanRun ──────────────────────────────────────────
    await prisma.scanRun.update({
      where: { id: scanRun.id },
      data: {
        status: errors > 0 ? 'completed_with_errors' : 'completed',
        totalListings,
        newParcels,
        updatedParcels,
        errors,
        completedAt: new Date(),
      },
    })
  } catch (err) {
    // Fatal error — mark scan as failed
    console.error('[scanner] Fatal scan error:', err)
    await prisma.scanRun.update({
      where: { id: scanRun.id },
      data: {
        status: 'failed',
        totalListings,
        newParcels,
        updatedParcels,
        errors: errors + 1,
        completedAt: new Date(),
      },
    })
  }

  return {
    scanRunId: scanRun.id,
    totalListings,
    newParcels,
    updatedParcels,
    errors,
  }
}
