// ─── Land Parcel Enrichment Orchestrator ────────────────────────
// Calls free government APIs in parallel to enrich parcel data.
// Each API has its own try/catch — one failure won't block others.

import { getSoilData } from "./nrcs-soils";
import { getFloodData } from "./fema-flood";
import { getWaterData } from "./usgs-water";
import { getElevationData } from "./usgs-elevation";
import { getMetroDistance } from "./metro-distance";
import { getLandCoverData } from "./nlcd-landcover";

export interface EnrichmentResult {
  // Soils (NRCS)
  soilsQuality: number | null;
  soilDrainageClass: string | null;
  soilCapabilityClass: string | null;

  // Flood (FEMA)
  inFloodway: boolean;
  floodZone: string | null;

  // Water (USGS NHD)
  waterPresence: boolean;
  waterFeatures: string[];
  waterDistance: number | null;

  // Elevation & Slope (USGS EPQS)
  elevation: number | null;
  slopeAvg: number | null;
  slopeStats: {
    mean: number;
    percentOver15: number;
    percentOver25: number;
  } | null;

  // Land Cover (NLCD)
  landCoverMix: Record<string, number> | null;

  // Metro Distance (calculated)
  metroDistance: number | null;
  nearestMetro: string | null;
}

/**
 * Enrich a parcel with real environmental data from government APIs.
 * All API calls run in parallel. Individual failures return null/defaults.
 *
 * @param lat  - Latitude (WGS84)
 * @param lon  - Longitude (WGS84)
 * @param acreage - Parcel size in acres (used for slope sampling radius)
 */
export async function enrichParcel(
  lat: number,
  lon: number,
  acreage: number
): Promise<EnrichmentResult> {
  const [soilResult, floodResult, waterResult, elevationResult, landCoverResult] =
    await Promise.all([
      getSoilData(lat, lon).catch((err) => {
        console.error("[enrichment] soils failed:", err);
        return { quality: null, drainageClass: null, capabilityClass: null };
      }),
      getFloodData(lat, lon).catch((err) => {
        console.error("[enrichment] flood failed:", err);
        return { inFloodway: false, floodZone: null };
      }),
      getWaterData(lat, lon).catch((err) => {
        console.error("[enrichment] water failed:", err);
        return { waterPresence: false, waterFeatures: [], waterDistance: null };
      }),
      getElevationData(lat, lon, acreage).catch((err) => {
        console.error("[enrichment] elevation failed:", err);
        return { elevation: null, slopeAvg: null, slopeStats: null };
      }),
      getLandCoverData(lat, lon, acreage).catch((err) => {
        console.error("[enrichment] landcover failed:", err);
        return { landCoverMix: null };
      }),
    ]);

  // Metro distance is pure math — no API, can't fail
  const metroResult = getMetroDistance(lat, lon);

  return {
    soilsQuality: soilResult.quality,
    soilDrainageClass: soilResult.drainageClass,
    soilCapabilityClass: soilResult.capabilityClass,

    inFloodway: floodResult.inFloodway,
    floodZone: floodResult.floodZone,

    waterPresence: waterResult.waterPresence,
    waterFeatures: waterResult.waterFeatures,
    waterDistance: waterResult.waterDistance,

    elevation: elevationResult.elevation,
    slopeAvg: elevationResult.slopeAvg,
    slopeStats: elevationResult.slopeStats,

    landCoverMix: landCoverResult.landCoverMix,

    metroDistance: metroResult.metroDistance,
    nearestMetro: metroResult.nearestMetro,
  };
}

// Re-export individual modules for direct use
export { getSoilData } from "./nrcs-soils";
export { getFloodData } from "./fema-flood";
export { getWaterData } from "./usgs-water";
export { getElevationData } from "./usgs-elevation";
export { getMetroDistance } from "./metro-distance";
export { getLandCoverData } from "./nlcd-landcover";
