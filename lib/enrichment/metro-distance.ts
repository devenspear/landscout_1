// ─── Metro Distance Calculator ──────────────────────────────────
// Pure math — no API calls. Uses Haversine formula.

interface Metro {
  name: string;
  lat: number;
  lon: number;
}

const SE_US_METROS: Metro[] = [
  { name: "Charlotte, NC", lat: 35.2271, lon: -80.8431 },
  { name: "Atlanta, GA", lat: 33.749, lon: -84.388 },
  { name: "Raleigh, NC", lat: 35.7796, lon: -78.6382 },
  { name: "Nashville, TN", lat: 36.1627, lon: -86.7816 },
  { name: "Richmond, VA", lat: 37.5407, lon: -77.436 },
  { name: "Jacksonville, FL", lat: 30.3322, lon: -81.6557 },
  { name: "Charleston, SC", lat: 32.7765, lon: -79.9311 },
  { name: "Birmingham, AL", lat: 33.5207, lon: -86.8025 },
  { name: "Savannah, GA", lat: 32.0809, lon: -81.0912 },
  { name: "Greenville, SC", lat: 34.8526, lon: -82.394 },
  { name: "Knoxville, TN", lat: 35.9606, lon: -83.9207 },
  { name: "Tampa, FL", lat: 27.9506, lon: -82.4572 },
];

export interface MetroDistanceResult {
  metroDistance: number;
  nearestMetro: string;
}

export function getMetroDistance(
  lat: number,
  lon: number
): MetroDistanceResult {
  let nearest: Metro = SE_US_METROS[0];
  let minDist = Infinity;

  for (const metro of SE_US_METROS) {
    const dist = haversineDistance(lat, lon, metro.lat, metro.lon);
    if (dist < minDist) {
      minDist = dist;
      nearest = metro;
    }
  }

  return {
    metroDistance: Math.round(minDist * 10) / 10,
    nearestMetro: nearest.name,
  };
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
