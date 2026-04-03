#!/usr/bin/env tsx
// ─── Enrichment API Test Script ─────────────────────────────────
// Tests all enrichment APIs with a real coordinate in NC.
// Run: npx tsx scripts/test-enrichment.ts

import { getSoilData } from "../lib/enrichment/nrcs-soils";
import { getFloodData } from "../lib/enrichment/fema-flood";
import { getWaterData } from "../lib/enrichment/usgs-water";
import { getElevationData } from "../lib/enrichment/usgs-elevation";
import { getMetroDistance } from "../lib/enrichment/metro-distance";
import { getLandCoverData } from "../lib/enrichment/nlcd-landcover";
import { enrichParcel } from "../lib/enrichment";

// Test point: rural NC, near Charlotte — Stanly County area
const TEST_LAT = 35.5;
const TEST_LON = -80.3;
const TEST_ACREAGE = 50;

async function testIndividualAPIs() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`  LandScout Enrichment API Tests`);
  console.log(`  Test Point: ${TEST_LAT}, ${TEST_LON} (NC)`);
  console.log(`  Acreage: ${TEST_ACREAGE}`);
  console.log("═══════════════════════════════════════════════════════════\n");

  // Test each API individually
  const tests = [
    {
      name: "NRCS Soils",
      fn: () => getSoilData(TEST_LAT, TEST_LON),
    },
    {
      name: "FEMA Flood",
      fn: () => getFloodData(TEST_LAT, TEST_LON),
    },
    {
      name: "USGS Water (NHD)",
      fn: () => getWaterData(TEST_LAT, TEST_LON),
    },
    {
      name: "USGS Elevation",
      fn: () => getElevationData(TEST_LAT, TEST_LON, TEST_ACREAGE),
    },
    {
      name: "Metro Distance",
      fn: () => Promise.resolve(getMetroDistance(TEST_LAT, TEST_LON)),
    },
    {
      name: "NLCD Land Cover",
      fn: () => getLandCoverData(TEST_LAT, TEST_LON, TEST_ACREAGE),
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const start = Date.now();
    try {
      const result = await test.fn();
      const elapsed = Date.now() - start;
      const hasData = result && Object.values(result).some((v) => v !== null && v !== false);

      if (hasData) {
        console.log(`  ✓ ${test.name} (${elapsed}ms)`);
        console.log(`    ${JSON.stringify(result, null, 2).split("\n").join("\n    ")}`);
        passed++;
      } else {
        console.log(`  ⚠ ${test.name} (${elapsed}ms) — returned empty/null`);
        console.log(`    ${JSON.stringify(result)}`);
        failed++;
      }
    } catch (err) {
      const elapsed = Date.now() - start;
      console.log(`  ✗ ${test.name} (${elapsed}ms) — EXCEPTION`);
      console.log(`    ${err}`);
      failed++;
    }
    console.log();
  }

  return { passed, failed };
}

async function testOrchestrator() {
  console.log("───────────────────────────────────────────────────────────");
  console.log("  Full Orchestrator Test (enrichParcel)");
  console.log("───────────────────────────────────────────────────────────\n");

  const start = Date.now();
  const result = await enrichParcel(TEST_LAT, TEST_LON, TEST_ACREAGE);
  const elapsed = Date.now() - start;

  console.log(`  Completed in ${elapsed}ms\n`);
  console.log(JSON.stringify(result, null, 2));

  // Count non-null fields
  const fields = Object.entries(result);
  const populated = fields.filter(([, v]) => v !== null && v !== false && !(Array.isArray(v) && v.length === 0));
  console.log(`\n  ${populated.length}/${fields.length} fields populated`);

  return result;
}

async function main() {
  const { passed, failed } = await testIndividualAPIs();
  await testOrchestrator();

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log(`  Summary: ${passed} passed, ${failed} with issues`);
  console.log("═══════════════════════════════════════════════════════════\n");

  process.exit(failed > 3 ? 1 : 0); // Only fail if most APIs are down
}

main();
