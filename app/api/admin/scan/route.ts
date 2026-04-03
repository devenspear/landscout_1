// ─── POST /api/admin/scan ───────────────────────────────────────────
// Triggers a full scan across all enabled sources.
// Returns immediately with the scan run ID; scan runs in background.

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { runScan } from '@/lib/scanner'

export async function POST() {
  try {
    // Start the scan in the background — don't await
    const scanPromise = runScan(prisma)

    // Log completion asynchronously
    scanPromise
      .then((result) => {
        console.log(
          `[scan] Completed: ${result.totalListings} listings, ` +
          `${result.newParcels} new, ${result.updatedParcels} updated, ` +
          `${result.errors} errors (run: ${result.scanRunId})`
        )
      })
      .catch((err) => {
        console.error('[scan] Fatal error:', err)
      })

    return NextResponse.json({
      status: 'started',
      message: 'Scan initiated. Check /api/admin/scan/status for progress.',
    })
  } catch (err) {
    console.error('[scan] Failed to start scan:', err)
    return NextResponse.json(
      { status: 'error', message: 'Failed to start scan' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Return the most recent scan run with source-level detail
    const latestRun = await prisma.scanRun.findFirst({
      orderBy: { startedAt: 'desc' },
      include: {
        sources: {
          include: {
            source: { select: { name: true, slug: true } },
          },
        },
      },
    })

    if (!latestRun) {
      return NextResponse.json({ status: 'none', message: 'No scan runs found' })
    }

    return NextResponse.json({
      id: latestRun.id,
      status: latestRun.status,
      totalListings: latestRun.totalListings,
      newParcels: latestRun.newParcels,
      updatedParcels: latestRun.updatedParcels,
      errors: latestRun.errors,
      startedAt: latestRun.startedAt,
      completedAt: latestRun.completedAt,
      sources: latestRun.sources.map((s) => ({
        name: s.source.name,
        slug: s.source.slug,
        status: s.status,
        listings: s.listings,
        errors: s.errors,
        errorLog: s.errorLog ? JSON.parse(s.errorLog) : null,
      })),
    })
  } catch (err) {
    console.error('[scan] Failed to fetch status:', err)
    return NextResponse.json(
      { status: 'error', message: 'Failed to fetch scan status' },
      { status: 500 }
    )
  }
}
