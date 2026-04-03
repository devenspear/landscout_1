// ─── USGS Elevation Point Query Service (EPQS) ──────────────────
// Free, no auth required
// Docs: https://epqs.nationalmap.gov/v1/

const EPQS_ENDPOINT = "https://epqs.nationalmap.gov/v1/json";

export interface ElevationResult {
  elevation: number | null;
  slopeAvg: number | null;
  slopeStats: {
    mean: number;
    percentOver15: number;
    percentOver25: number;
  } | null;
}

/**
 * Query USGS EPQS for elevation and calculate slope by sampling
 * 5 points (center + 4 compass directions at half-parcel radius).
 */
export async function getElevationData(
  lat: number,
  lon: number,
  acreage: number
): Promise<ElevationResult> {
  try {
    // Parcel radius in feet: sqrt(acreage * 43560 / π)
    const radiusFeet = Math.sqrt(acreage * 43560 / Math.PI);
    // Half-radius for sampling
    const sampleRadiusFeet = radiusFeet / 2;

    // Convert feet to approximate degrees
    // 1 degree lat ≈ 364,000 feet; 1 degree lon varies by latitude
    const feetPerDegLat = 364000;
    const feetPerDegLon = 364000 * Math.cos(toRad(lat));
    const dLat = sampleRadiusFeet / feetPerDegLat;
    const dLon = sampleRadiusFeet / feetPerDegLon;

    // 5 sample points: center, N, S, E, W
    const points: [number, number][] = [
      [lat, lon],            // center
      [lat + dLat, lon],     // north
      [lat - dLat, lon],     // south
      [lat, lon + dLon],     // east
      [lat, lon - dLon],     // west
    ];

    // Fetch all 5 elevations in parallel with tight timeout
    const elevations = await Promise.all(
      points.map(([y, x]) => fetchElevation(y, x, 5000))
    );

    const centerElev = elevations[0];
    if (centerElev === null) {
      return { elevation: null, slopeAvg: null, slopeStats: null };
    }

    // Calculate slopes from center to each edge point
    const slopes: number[] = [];
    for (let i = 1; i < elevations.length; i++) {
      const edgeElev = elevations[i];
      if (edgeElev !== null) {
        const rise = Math.abs(edgeElev - centerElev);
        // Run = distance from center to sample point in feet
        const slope = (rise / sampleRadiusFeet) * 100; // percent grade
        slopes.push(slope);
      }
    }

    if (slopes.length === 0) {
      return { elevation: centerElev, slopeAvg: null, slopeStats: null };
    }

    const mean = slopes.reduce((a, b) => a + b, 0) / slopes.length;
    const percentOver15 = (slopes.filter((s) => s > 15).length / slopes.length) * 100;
    const percentOver25 = (slopes.filter((s) => s > 25).length / slopes.length) * 100;

    return {
      elevation: Math.round(centerElev),
      slopeAvg: Math.round(mean * 10) / 10,
      slopeStats: {
        mean: Math.round(mean * 10) / 10,
        percentOver15: Math.round(percentOver15),
        percentOver25: Math.round(percentOver25),
      },
    };
  } catch (err) {
    console.error("[usgs-elevation] Error:", err);
    return { elevation: null, slopeAvg: null, slopeStats: null };
  }
}

/** Fetch a single elevation point in feet */
async function fetchElevation(
  lat: number,
  lon: number,
  timeoutMs = 5000
): Promise<number | null> {
  const params = new URLSearchParams({
    x: lon.toString(),
    y: lat.toString(),
    wkid: "4326",
    units: "Feet",
  });

  const url = `${EPQS_ENDPOINT}?${params.toString()}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;

    const data = await res.json();
    // Response: { value: 1234.56 } or { value: -1000000 } for no data
    const value = data?.value;
    if (value === undefined || value === null || value < -10000) return null;
    return Number(value);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
