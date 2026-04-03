// ─── NRCS Soil Data Access REST API ──────────────────────────────
// Free, no auth required
// Docs: https://sdmdataaccess.nrcs.usda.gov/

const NRCS_ENDPOINT = "https://sdmdataaccess.nrcs.usda.gov/tabular/post.rest";

const DRAINAGE_SCORES: Record<string, number> = {
  "well drained": 9,
  "moderately well drained": 7,
  "somewhat excessively drained": 8,
  "excessively drained": 6,
  "somewhat poorly drained": 5,
  "poorly drained": 3,
  "very poorly drained": 1,
};

export interface SoilResult {
  quality: number | null;
  drainageClass: string | null;
  capabilityClass: string | null;
}

export async function getSoilData(
  lat: number,
  lon: number
): Promise<SoilResult> {
  const query = `
    SELECT TOP 1 musym, muname, drainagecl, nirrcapcl, hydgrp
    FROM mapunit mu
    INNER JOIN component co ON mu.mukey = co.mukey
    WHERE mu.mukey IN (
      SELECT * FROM SDA_Get_Mukey_from_intersection_with_WktWgs84('POINT(${lon} ${lat})')
    )
  `.trim();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(NRCS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, format: "JSON" }),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.error(`[nrcs-soils] HTTP ${res.status}: ${res.statusText}`);
      return { quality: null, drainageClass: null, capabilityClass: null };
    }

    const data = await res.json();

    // Response shape: { Table: [ [col1, col2, ...], ... ] }
    const table = data?.Table;
    if (!table || table.length === 0) {
      return { quality: null, drainageClass: null, capabilityClass: null };
    }

    // First row: musym, muname, drainagecl, nirrcapcl, hydgrp
    const row = table[0];
    const drainageRaw: string | null = row[2] ?? null;
    const capabilityClass: string | null = row[3] ?? null;

    let quality: number | null = null;
    if (drainageRaw) {
      const key = drainageRaw.toLowerCase().trim();
      quality = DRAINAGE_SCORES[key] ?? null;
    }

    return {
      quality,
      drainageClass: drainageRaw,
      capabilityClass,
    };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      console.error("[nrcs-soils] Request timed out (5s)");
    } else {
      console.error("[nrcs-soils] Error:", err);
    }
    return { quality: null, drainageClass: null, capabilityClass: null };
  } finally {
    clearTimeout(timeout);
  }
}
