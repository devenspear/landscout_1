/**
 * Parcel Enrichment Pipeline
 *
 * Re-enriches all parcels in the database with real government API data.
 * Calls NRCS Soils, FEMA Flood, USGS Water, USGS Elevation, NLCD Land Cover,
 * and metro distance calculator for each parcel with lat/lon coordinates.
 *
 * Run: npx tsx scripts/enrich-parcels.ts
 */

import { PrismaClient } from "@prisma/client";
import { enrichParcel } from "../lib/enrichment/index";
import { calculateFitScore } from "../lib/fit-score";
import { DEFAULT_ADMIN_CONFIG } from "../lib/admin-config";

const prisma = new PrismaClient();

// ─── Config ──────────────────────────────────────────────────────

const DELAY_MS = 1000; // 1 second between parcels (rate limiting)
const BATCH_LOG_SIZE = 10; // Print progress every N parcels

// ─── Helpers ─────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Main Pipeline ───────────────────────────────────────────────

async function main() {
  // Load all parcels that have lat/lon coordinates
  const parcels = await prisma.parcel.findMany({
    where: {
      lat: { not: null },
      lon: { not: null },
    },
    include: {
      features: true,
      fitScore: true,
    },
    orderBy: { createdAt: "asc" },
  });

  if (parcels.length === 0) {
    console.log("No parcels with coordinates found. Nothing to enrich.");
    return;
  }

  console.log(
    `\n🔬 Enriching ${parcels.length} parcels with real government API data...\n`
  );

  // ── Tracking counters ────────────────────────────────────────

  let enrichedCount = 0;
  let failedCount = 0;
  let totalApiSuccess = 0;
  let totalApiCalls = 0;
  let scoreIncreased = 0;
  let scoreDecreased = 0;
  let scoreUnchanged = 0;
  let totalScoreChange = 0;

  for (let i = 0; i < parcels.length; i++) {
    const parcel = parcels[i];
    const lat = parcel.lat!;
    const lon = parcel.lon!;
    const idx = i + 1;
    const oldScore = parcel.fitScore?.overallScore ?? 0;

    try {
      // ── Call enrichment service (all 5 API groups + metro calc) ──
      const result = await enrichParcel(lat, lon, parcel.acreage);

      // Count API successes (6 data points, metro never fails)
      const apiResults = [
        result.soilsQuality !== null,
        result.floodZone !== null,
        result.waterDistance !== null,
        result.elevation !== null,
        result.landCoverMix !== null,
      ];
      const successCount = apiResults.filter(Boolean).length + 1; // +1 for metro (always succeeds)
      const failCount = apiResults.filter((r) => !r).length;
      totalApiSuccess += successCount;
      totalApiCalls += 6; // 5 APIs + metro

      // ── Upsert Features record ───────────────────────────────

      const slopeStatsJson = result.slopeStats
        ? JSON.stringify({
            avgSlope: result.slopeStats.mean,
            maxSlope: null,
            pctOver15: result.slopeStats.percentOver15,
          })
        : null;

      const featuresData = {
        soilsQuality: result.soilsQuality,
        inFloodway: result.inFloodway,
        floodZone: result.floodZone,
        waterPresence: result.waterPresence,
        waterFeatures: result.waterFeatures
          ? JSON.stringify(result.waterFeatures)
          : null,
        waterDistance: result.waterDistance,
        elevation: result.elevation,
        slopeStats: slopeStatsJson,
        landCoverMix: result.landCoverMix
          ? JSON.stringify(result.landCoverMix)
          : null,
        metroDistance: result.metroDistance,
        nearestMetro: result.nearestMetro,
      };

      const features = await prisma.features.upsert({
        where: { parcelId: parcel.id },
        create: {
          parcelId: parcel.id,
          ...featuresData,
        },
        update: featuresData,
      });

      // ── Recalculate FitScore ─────────────────────────────────

      const scoringConfig = {
        fitScore: DEFAULT_ADMIN_CONFIG.fitScore,
        acreage: DEFAULT_ADMIN_CONFIG.acreage,
        metroRadiusMiles: DEFAULT_ADMIN_CONFIG.metroRadiusMiles,
      };

      const scoreResult = calculateFitScore(
        { acreage: parcel.acreage },
        features,
        scoringConfig
      );

      // ── Upsert FitScore record ──────────────────────────────

      const fitScoreData = {
        overallScore: scoreResult.overallScore,
        scoreBreakdown: JSON.stringify(scoreResult.scoreBreakdown),
        topReasons: JSON.stringify(scoreResult.topReasons),
        autoFailed: scoreResult.autoFailed,
        autoFailReason: scoreResult.autoFailReason ?? null,
        calculatedAt: new Date(),
      };

      await prisma.fitScore.upsert({
        where: { parcelId: parcel.id },
        create: {
          parcelId: parcel.id,
          ...fitScoreData,
        },
        update: fitScoreData,
      });

      // ── Track score changes ─────────────────────────────────

      const newScore = scoreResult.overallScore;
      const diff = newScore - oldScore;
      totalScoreChange += Math.abs(diff);

      if (diff > 0) scoreIncreased++;
      else if (diff < 0) scoreDecreased++;
      else scoreUnchanged++;

      enrichedCount++;

      // ── Log individual result ───────────────────────────────

      const apiStatus =
        failCount > 0
          ? `${successCount} APIs ✓ ${failCount} ✗`
          : `${successCount} APIs ✓`;
      const scoreStr =
        diff !== 0
          ? `score ${oldScore} → ${newScore}`
          : `score ${newScore} (unchanged)`;

      console.log(
        `  [${idx}/${parcels.length}] ${parcel.county}, ${parcel.state} (${lat.toFixed(1)}, ${lon.toFixed(1)}) — ${apiStatus}, ${scoreStr}`
      );
    } catch (err) {
      failedCount++;
      console.error(
        `  [${idx}/${parcels.length}] ${parcel.county}, ${parcel.state} — FAILED:`,
        err instanceof Error ? err.message : err
      );
    }

    // ── Batch progress ──────────────────────────────────────────

    if (idx % BATCH_LOG_SIZE === 0 && idx < parcels.length) {
      console.log(
        `\n  --- Progress: ${idx}/${parcels.length} (${Math.round((idx / parcels.length) * 100)}%) ---\n`
      );
    }

    // ── Rate limiting delay (skip after last parcel) ────────────

    if (i < parcels.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  // ─── Summary Report ────────────────────────────────────────────

  const apiSuccessRate =
    totalApiCalls > 0
      ? Math.round((totalApiSuccess / totalApiCalls) * 100)
      : 0;
  const avgScoreChange =
    enrichedCount > 0
      ? (totalScoreChange / enrichedCount).toFixed(1)
      : "0.0";

  console.log(`
🎉 Enrichment complete!
   Parcels enriched: ${enrichedCount}/${parcels.length}
   Parcels failed:   ${failedCount}
   API success rate:  ${apiSuccessRate}%
   Score changes:     ${scoreIncreased} increased, ${scoreDecreased} decreased, ${scoreUnchanged} unchanged
   Avg score change:  ±${avgScoreChange} points
`);

  // ─── Reminder to re-export data ────────────────────────────────

  console.log(
    "📦 Next step: Rebuild static data files for Vercel deployment:"
  );
  console.log("   npx tsx scripts/export-data.ts\n");
}

main()
  .catch((e) => {
    console.error("Enrichment pipeline failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
