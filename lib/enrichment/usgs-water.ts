// ─── USGS National Hydrography Dataset (NHD) MapServer ──────────
// Free, no auth required
// Docs: https://hydro.nationalmap.gov/arcgis/rest/services/nhd/MapServer

const NHD_ENDPOINT =
  "https://hydro.nationalmap.gov/arcgis/rest/services/nhd/MapServer/identify";

export interface WaterResult {
  waterPresence: boolean;
  waterFeatures: string[];
  waterDistance: number | null;
}

// Feature type codes from NHD FTYPE field
const WATER_FEATURE_NAMES: Record<string, string> = {
  "460": "stream",
  "336": "canal/ditch",
  "390": "lake/pond",
  "378": "ice mass",
  "431": "rapids",
  "484": "wash",
  "537": "estuary",
  "568": "spring/seep",
};

export async function getWaterData(
  lat: number,
  lon: number
): Promise<WaterResult> {
  // Search within ~1 mile (approx 0.015 degrees)
  const tolerance = 0.015;
  const mapExtent = `${lon - tolerance},${lat - tolerance},${lon + tolerance},${lat + tolerance}`;

  const params = new URLSearchParams({
    geometry: `${lon},${lat}`,
    geometryType: "esriGeometryPoint",
    sr: "4326",
    layers: "all",
    tolerance: "50", // pixel tolerance
    mapExtent,
    imageDisplay: "800,600,96",
    returnGeometry: "true",
    f: "json",
  });

  const url = `${NHD_ENDPOINT}?${params.toString()}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(url, { signal: controller.signal });

    if (!res.ok) {
      console.error(`[usgs-water] HTTP ${res.status}: ${res.statusText}`);
      return { waterPresence: false, waterFeatures: [], waterDistance: null };
    }

    const data = await res.json();
    const results = data?.results;

    if (!results || results.length === 0) {
      return { waterPresence: false, waterFeatures: [], waterDistance: null };
    }

    const featureSet = new Set<string>();
    let minDistance: number | null = null;

    for (const result of results) {
      const attrs = result.attributes ?? {};
      const ftype = String(attrs.FType ?? attrs.FTYPE ?? "");
      const gnis = String(attrs.GNIS_Name ?? attrs.gnis_name ?? "").toLowerCase();

      // Identify feature type
      if (WATER_FEATURE_NAMES[ftype]) {
        featureSet.add(WATER_FEATURE_NAMES[ftype]);
      } else if (gnis) {
        // Infer from name
        if (gnis.includes("creek")) featureSet.add("creek");
        else if (gnis.includes("river")) featureSet.add("river");
        else if (gnis.includes("lake")) featureSet.add("lake");
        else if (gnis.includes("pond")) featureSet.add("pond");
        else if (gnis.includes("branch")) featureSet.add("creek");
        else if (gnis.includes("fork")) featureSet.add("creek");
        else featureSet.add("water feature");
      } else {
        featureSet.add("water feature");
      }

      // Estimate distance from the returned geometry
      const geom = result.geometry;
      if (geom) {
        let featureLat: number | undefined;
        let featureLon: number | undefined;

        if (geom.y !== undefined && geom.x !== undefined) {
          featureLat = geom.y;
          featureLon = geom.x;
        } else if (geom.paths?.[0]?.[0]) {
          // Line geometry — use first vertex
          featureLon = geom.paths[0][0][0];
          featureLat = geom.paths[0][0][1];
        } else if (geom.rings?.[0]?.[0]) {
          // Polygon — use first vertex
          featureLon = geom.rings[0][0][0];
          featureLat = geom.rings[0][0][1];
        }

        if (featureLat !== undefined && featureLon !== undefined) {
          const dist = haversineDistance(lat, lon, featureLat, featureLon);
          if (minDistance === null || dist < minDistance) {
            minDistance = dist;
          }
        }
      }
    }

    const waterFeatures = Array.from(featureSet);

    return {
      waterPresence: waterFeatures.length > 0,
      waterFeatures,
      waterDistance: minDistance !== null ? Math.round(minDistance * 100) / 100 : null,
    };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      console.error("[usgs-water] Request timed out (5s)");
    } else {
      console.error("[usgs-water] Error:", err);
    }
    return { waterPresence: false, waterFeatures: [], waterDistance: null };
  } finally {
    clearTimeout(timeout);
  }
}

/** Haversine distance in miles */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
