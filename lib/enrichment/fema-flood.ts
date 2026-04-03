// ─── FEMA NFHL ArcGIS REST Service ──────────────────────────────
// Free, no auth required
// Docs: https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer

const FEMA_ENDPOINT =
  "https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query";

export interface FloodResult {
  inFloodway: boolean;
  floodZone: string | null;
}

export async function getFloodData(
  lat: number,
  lon: number
): Promise<FloodResult> {
  const params = new URLSearchParams({
    where: "1=1",
    geometry: `${lon},${lat}`,
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "FLD_ZONE,ZONE_SUBTY,SFHA_TF",
    returnGeometry: "false",
    f: "json",
  });

  const url = `${FEMA_ENDPOINT}?${params.toString()}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(url, { signal: controller.signal });

    if (!res.ok) {
      console.error(`[fema-flood] HTTP ${res.status}: ${res.statusText}`);
      return { inFloodway: false, floodZone: null };
    }

    const data = await res.json();
    const features = data?.features;

    if (!features || features.length === 0) {
      // No flood zone features → Zone X (minimal risk)
      return { inFloodway: false, floodZone: "X" };
    }

    const attrs = features[0].attributes;
    const floodZone: string = attrs.FLD_ZONE ?? "X";
    const zoneSubtype: string = attrs.ZONE_SUBTY ?? "";
    const inFloodway = zoneSubtype.toUpperCase().includes("FLOODWAY");

    return { inFloodway, floodZone };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      console.error("[fema-flood] Request timed out (5s)");
    } else {
      console.error("[fema-flood] Error:", err);
    }
    return { inFloodway: false, floodZone: null };
  } finally {
    clearTimeout(timeout);
  }
}
