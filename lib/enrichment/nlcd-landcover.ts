// ─── NLCD Land Cover ────────────────────────────────────────────
// The full NLCD raster service requires complex WMS/raster processing
// that's impractical in Node.js without heavy deps (GDAL, etc.).
//
// This module queries the MRLC NLCD MapServer which provides
// land cover classification at a point via ArcGIS REST identify.
//
// If the API is unavailable, returns null gracefully.

const NLCD_ENDPOINT =
  "https://www.mrlc.gov/geoserver/mrlc_display/NLCD_2021_Land_Cover_L48/ows";

// NLCD classification codes → human-readable labels
const NLCD_CLASSES: Record<string, string> = {
  "11": "open water",
  "12": "ice/snow",
  "21": "developed-open",
  "22": "developed-low",
  "23": "developed-medium",
  "24": "developed-high",
  "31": "barren",
  "41": "deciduous forest",
  "42": "evergreen forest",
  "43": "mixed forest",
  "51": "dwarf scrub",
  "52": "shrub/scrub",
  "71": "grassland",
  "72": "sedge/herbaceous",
  "73": "lichens",
  "74": "moss",
  "81": "pasture/hay",
  "82": "cultivated crops",
  "90": "woody wetlands",
  "95": "herbaceous wetlands",
};

// Simplified grouping for the land cover mix output
const NLCD_GROUPS: Record<string, string> = {
  "11": "water",
  "12": "other",
  "21": "developed",
  "22": "developed",
  "23": "developed",
  "24": "developed",
  "31": "barren",
  "41": "forest",
  "42": "forest",
  "43": "forest",
  "51": "shrub",
  "52": "shrub",
  "71": "grassland",
  "72": "grassland",
  "73": "other",
  "74": "other",
  "81": "pasture",
  "82": "cropland",
  "90": "wetlands",
  "95": "wetlands",
};

export interface LandCoverResult {
  landCoverMix: Record<string, number> | null;
}

/**
 * Query NLCD for land cover at a point.
 * Returns a single-class result (the dominant class at the point).
 * For a true mix, you'd need raster sampling across the parcel — a future enhancement.
 */
export async function getLandCoverData(
  lat: number,
  lon: number,
  _acreage: number
): Promise<LandCoverResult> {
  // Use WMS GetFeatureInfo for a point query
  // This is a simplified approach — gets the class at the exact point
  const params = new URLSearchParams({
    service: "WMS",
    version: "1.1.1",
    request: "GetFeatureInfo",
    layers: "NLCD_2021_Land_Cover_L48",
    query_layers: "NLCD_2021_Land_Cover_L48",
    info_format: "application/json",
    srs: "EPSG:4326",
    width: "1",
    height: "1",
    x: "0",
    y: "0",
    bbox: `${lon - 0.0001},${lat - 0.0001},${lon + 0.0001},${lat + 0.0001}`,
  });

  const url = `${NLCD_ENDPOINT}?${params.toString()}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(url, { signal: controller.signal });

    if (!res.ok) {
      console.error(`[nlcd-landcover] HTTP ${res.status}: ${res.statusText}`);
      return { landCoverMix: null };
    }

    const data = await res.json();
    const features = data?.features;

    if (!features || features.length === 0) {
      // TODO: Fall back to USGS LCMAP or other source
      return { landCoverMix: null };
    }

    // Extract the NLCD class value
    const props = features[0].properties ?? {};
    // The property name varies by server version — check known patterns
    const rawValue =
      props.NLCD_Land_Cover_Class ??
      props.PALETTE_INDEX ??
      props.pixel_value ??
      props.GRAY_INDEX ??
      props.Band1 ??
      null;

    if (rawValue === null || rawValue === undefined) {
      return { landCoverMix: null };
    }

    const classValue = String(rawValue);

    const group = NLCD_GROUPS[classValue];
    const label = NLCD_CLASSES[classValue];

    if (!group) {
      return { landCoverMix: null };
    }

    // Single-point query → 100% one class
    // Future: sample a grid across the parcel for a real mix
    return {
      landCoverMix: { [group]: 100 },
    };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      console.error("[nlcd-landcover] Request timed out (5s)");
    } else {
      console.error("[nlcd-landcover] Error:", err);
    }
    // Land cover is lowest priority — graceful null
    return { landCoverMix: null };
  } finally {
    clearTimeout(timeout);
  }
}
