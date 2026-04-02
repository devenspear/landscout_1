import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Deterministic pseudo-random number generator (mulberry32)
function makeRng(seed: number) {
  let s = seed
  return function () {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rng = makeRng(20260402)

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)]
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => rng() - 0.5)
  return shuffled.slice(0, n)
}

function randInt(min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min
}

function randFloat(min: number, max: number, decimals = 2): number {
  return parseFloat((rng() * (max - min) + min).toFixed(decimals))
}

// ─── Source Data ───────────────────────────────────────────────

const SOURCES = [
  { name: 'LandWatch', slug: 'landwatch', baseUrl: 'https://www.landwatch.com', type: 'portal' },
  { name: 'Hall & Hall', slug: 'hall-and-hall', baseUrl: 'https://www.hallhall.com', type: 'broker' },
  { name: 'Land And Farm', slug: 'land-and-farm', baseUrl: 'https://www.landandfarm.com', type: 'portal' },
  { name: 'Lands of America', slug: 'lands-of-america', baseUrl: 'https://www.landsofamerica.com', type: 'portal' },
  { name: 'Whitetail Properties', slug: 'whitetail-properties', baseUrl: 'https://www.whitetailproperties.com', type: 'broker' },
  { name: 'United Country', slug: 'united-country', baseUrl: 'https://www.unitedcountry.com', type: 'broker' },
  { name: 'LandLeader', slug: 'landleader', baseUrl: 'https://www.landleader.com', type: 'portal' },
  { name: 'Mason & Morse Ranch', slug: 'mason-morse-ranch', baseUrl: 'https://www.ranchland.com', type: 'broker' },
  { name: 'AFM Real Estate', slug: 'afm-real-estate', baseUrl: 'https://www.afmrealestate.com', type: 'broker' },
  { name: 'Peoples Company', slug: 'peoples-company', baseUrl: 'https://www.peoplescompany.com', type: 'broker' },
  { name: 'NAI Land', slug: 'nai-land', baseUrl: 'https://www.nailand.com', type: 'broker' },
  { name: 'Crexi', slug: 'crexi', baseUrl: 'https://www.crexi.com', type: 'portal' },
  { name: 'LoopNet', slug: 'loopnet', baseUrl: 'https://www.loopnet.com', type: 'portal' },
]

// ─── Geographic Data ──────────────────────────────────────────

interface CountyData {
  county: string
  state: string
  lat: number
  lon: number
  nearestMetro: string
  metroDistBase: number
}

const COUNTIES: CountyData[] = [
  // Virginia (13 parcels)
  { county: 'Augusta', state: 'VA', lat: 38.15, lon: -79.13, nearestMetro: 'Charlottesville', metroDistBase: 35 },
  { county: 'Rockbridge', state: 'VA', lat: 37.81, lon: -79.45, nearestMetro: 'Lexington', metroDistBase: 15 },
  { county: 'Bath', state: 'VA', lat: 38.07, lon: -79.73, nearestMetro: 'Staunton', metroDistBase: 45 },
  { county: 'Highland', state: 'VA', lat: 38.36, lon: -79.56, nearestMetro: 'Staunton', metroDistBase: 55 },
  { county: 'Albemarle', state: 'VA', lat: 37.98, lon: -78.69, nearestMetro: 'Charlottesville', metroDistBase: 12 },
  { county: 'Nelson', state: 'VA', lat: 37.79, lon: -78.88, nearestMetro: 'Charlottesville', metroDistBase: 28 },
  { county: 'Rappahannock', state: 'VA', lat: 38.68, lon: -78.16, nearestMetro: 'Culpeper', metroDistBase: 20 },
  { county: 'Madison', state: 'VA', lat: 38.38, lon: -78.26, nearestMetro: 'Charlottesville', metroDistBase: 30 },
  { county: 'Greene', state: 'VA', lat: 38.30, lon: -78.51, nearestMetro: 'Charlottesville', metroDistBase: 22 },
  { county: 'Fluvanna', state: 'VA', lat: 37.84, lon: -78.28, nearestMetro: 'Richmond', metroDistBase: 50 },
  { county: 'Buckingham', state: 'VA', lat: 37.55, lon: -78.55, nearestMetro: 'Lynchburg', metroDistBase: 35 },
  { county: 'Patrick', state: 'VA', lat: 36.68, lon: -80.28, nearestMetro: 'Roanoke', metroDistBase: 60 },
  { county: 'Floyd', state: 'VA', lat: 36.93, lon: -80.33, nearestMetro: 'Roanoke', metroDistBase: 40 },

  // North Carolina (14 parcels)
  { county: 'Buncombe', state: 'NC', lat: 35.60, lon: -82.55, nearestMetro: 'Asheville', metroDistBase: 10 },
  { county: 'Watauga', state: 'NC', lat: 36.23, lon: -81.69, nearestMetro: 'Boone', metroDistBase: 8 },
  { county: 'Ashe', state: 'NC', lat: 36.43, lon: -81.50, nearestMetro: 'Boone', metroDistBase: 25 },
  { county: 'Chatham', state: 'NC', lat: 35.72, lon: -79.27, nearestMetro: 'Raleigh', metroDistBase: 35 },
  { county: 'Person', state: 'NC', lat: 36.39, lon: -78.97, nearestMetro: 'Durham', metroDistBase: 30 },
  { county: 'Alamance', state: 'NC', lat: 36.04, lon: -79.40, nearestMetro: 'Burlington', metroDistBase: 12 },
  { county: 'Rowan', state: 'NC', lat: 35.64, lon: -80.52, nearestMetro: 'Charlotte', metroDistBase: 40 },
  { county: 'Iredell', state: 'NC', lat: 35.80, lon: -80.87, nearestMetro: 'Charlotte', metroDistBase: 30 },
  { county: 'Surry', state: 'NC', lat: 36.41, lon: -80.68, nearestMetro: 'Winston-Salem', metroDistBase: 35 },
  { county: 'Randolph', state: 'NC', lat: 35.71, lon: -79.81, nearestMetro: 'Greensboro', metroDistBase: 22 },
  { county: 'Davidson', state: 'NC', lat: 35.80, lon: -80.21, nearestMetro: 'Winston-Salem', metroDistBase: 20 },
  { county: 'Transylvania', state: 'NC', lat: 35.20, lon: -82.79, nearestMetro: 'Asheville', metroDistBase: 30 },
  { county: 'Macon', state: 'NC', lat: 35.15, lon: -83.42, nearestMetro: 'Asheville', metroDistBase: 60 },
  { county: 'Columbus', state: 'NC', lat: 34.26, lon: -78.65, nearestMetro: 'Wilmington', metroDistBase: 40 },

  // South Carolina (12 parcels)
  { county: 'Greenville', state: 'SC', lat: 34.85, lon: -82.40, nearestMetro: 'Greenville', metroDistBase: 15 },
  { county: 'Anderson', state: 'SC', lat: 34.52, lon: -82.64, nearestMetro: 'Greenville', metroDistBase: 30 },
  { county: 'Oconee', state: 'SC', lat: 34.74, lon: -83.06, nearestMetro: 'Greenville', metroDistBase: 40 },
  { county: 'Pickens', state: 'SC', lat: 34.88, lon: -82.73, nearestMetro: 'Greenville', metroDistBase: 25 },
  { county: 'Abbeville', state: 'SC', lat: 34.23, lon: -82.46, nearestMetro: 'Greenwood', metroDistBase: 15 },
  { county: 'Laurens', state: 'SC', lat: 34.48, lon: -81.97, nearestMetro: 'Greenville', metroDistBase: 35 },
  { county: 'Newberry', state: 'SC', lat: 34.29, lon: -81.60, nearestMetro: 'Columbia', metroDistBase: 40 },
  { county: 'Aiken', state: 'SC', lat: 33.56, lon: -81.72, nearestMetro: 'Augusta', metroDistBase: 20 },
  { county: 'Edgefield', state: 'SC', lat: 33.79, lon: -81.97, nearestMetro: 'Augusta', metroDistBase: 25 },
  { county: 'Colleton', state: 'SC', lat: 32.89, lon: -80.64, nearestMetro: 'Charleston', metroDistBase: 45 },
  { county: 'Hampton', state: 'SC', lat: 32.77, lon: -81.13, nearestMetro: 'Savannah', metroDistBase: 50 },
  { county: 'Williamsburg', state: 'SC', lat: 33.62, lon: -79.73, nearestMetro: 'Florence', metroDistBase: 35 },

  // Georgia (13 parcels)
  { county: 'Lumpkin', state: 'GA', lat: 34.57, lon: -84.00, nearestMetro: 'Dahlonega', metroDistBase: 8 },
  { county: 'White', state: 'GA', lat: 34.64, lon: -83.75, nearestMetro: 'Gainesville', metroDistBase: 25 },
  { county: 'Rabun', state: 'GA', lat: 34.88, lon: -83.40, nearestMetro: 'Gainesville', metroDistBase: 55 },
  { county: 'Greene', state: 'GA', lat: 33.58, lon: -83.17, nearestMetro: 'Athens', metroDistBase: 30 },
  { county: 'Morgan', state: 'GA', lat: 33.59, lon: -83.49, nearestMetro: 'Atlanta', metroDistBase: 55 },
  { county: 'Putnam', state: 'GA', lat: 33.32, lon: -83.37, nearestMetro: 'Milledgeville', metroDistBase: 20 },
  { county: 'Jasper', state: 'GA', lat: 33.31, lon: -83.68, nearestMetro: 'Atlanta', metroDistBase: 50 },
  { county: 'Talbot', state: 'GA', lat: 32.70, lon: -84.53, nearestMetro: 'Columbus', metroDistBase: 30 },
  { county: 'Meriwether', state: 'GA', lat: 33.03, lon: -84.68, nearestMetro: 'Atlanta', metroDistBase: 60 },
  { county: 'Burke', state: 'GA', lat: 33.07, lon: -82.00, nearestMetro: 'Augusta', metroDistBase: 30 },
  { county: 'Emanuel', state: 'GA', lat: 32.59, lon: -82.30, nearestMetro: 'Savannah', metroDistBase: 70 },
  { county: 'Appling', state: 'GA', lat: 31.75, lon: -82.29, nearestMetro: 'Savannah', metroDistBase: 80 },
  { county: 'Telfair', state: 'GA', lat: 31.98, lon: -82.87, nearestMetro: 'Macon', metroDistBase: 65 },

  // Florida (11 parcels)
  { county: 'Alachua', state: 'FL', lat: 29.67, lon: -82.36, nearestMetro: 'Gainesville', metroDistBase: 10 },
  { county: 'Marion', state: 'FL', lat: 29.21, lon: -82.07, nearestMetro: 'Ocala', metroDistBase: 12 },
  { county: 'Levy', state: 'FL', lat: 29.28, lon: -82.78, nearestMetro: 'Gainesville', metroDistBase: 35 },
  { county: 'Columbia', state: 'FL', lat: 30.22, lon: -82.62, nearestMetro: 'Lake City', metroDistBase: 10 },
  { county: 'Jefferson', state: 'FL', lat: 30.42, lon: -83.90, nearestMetro: 'Tallahassee', metroDistBase: 25 },
  { county: 'Gadsden', state: 'FL', lat: 30.58, lon: -84.62, nearestMetro: 'Tallahassee', metroDistBase: 20 },
  { county: 'Jackson', state: 'FL', lat: 30.79, lon: -85.23, nearestMetro: 'Marianna', metroDistBase: 8 },
  { county: 'Walton', state: 'FL', lat: 30.60, lon: -86.17, nearestMetro: 'Pensacola', metroDistBase: 55 },
  { county: 'Highlands', state: 'FL', lat: 27.34, lon: -81.34, nearestMetro: 'Sebring', metroDistBase: 10 },
  { county: 'Osceola', state: 'FL', lat: 28.06, lon: -81.17, nearestMetro: 'Orlando', metroDistBase: 30 },
  { county: 'Polk', state: 'FL', lat: 27.95, lon: -81.70, nearestMetro: 'Lakeland', metroDistBase: 15 },

  // Alabama (12 parcels)
  { county: 'Jackson', state: 'AL', lat: 34.77, lon: -86.05, nearestMetro: 'Huntsville', metroDistBase: 30 },
  { county: 'DeKalb', state: 'AL', lat: 34.46, lon: -85.80, nearestMetro: 'Huntsville', metroDistBase: 50 },
  { county: 'Marshall', state: 'AL', lat: 34.37, lon: -86.30, nearestMetro: 'Huntsville', metroDistBase: 30 },
  { county: 'Blount', state: 'AL', lat: 33.98, lon: -86.57, nearestMetro: 'Birmingham', metroDistBase: 30 },
  { county: 'Coosa', state: 'AL', lat: 32.94, lon: -86.25, nearestMetro: 'Birmingham', metroDistBase: 55 },
  { county: 'Clay', state: 'AL', lat: 33.27, lon: -85.86, nearestMetro: 'Anniston', metroDistBase: 25 },
  { county: 'Randolph', state: 'AL', lat: 33.29, lon: -85.46, nearestMetro: 'Anniston', metroDistBase: 35 },
  { county: 'Monroe', state: 'AL', lat: 31.57, lon: -87.37, nearestMetro: 'Mobile', metroDistBase: 70 },
  { county: 'Wilcox', state: 'AL', lat: 31.99, lon: -87.31, nearestMetro: 'Selma', metroDistBase: 30 },
  { county: 'Dallas', state: 'AL', lat: 32.33, lon: -87.10, nearestMetro: 'Selma', metroDistBase: 10 },
  { county: 'Marengo', state: 'AL', lat: 32.24, lon: -87.78, nearestMetro: 'Tuscaloosa', metroDistBase: 55 },
  { county: 'Tuscaloosa', state: 'AL', lat: 33.21, lon: -87.53, nearestMetro: 'Tuscaloosa', metroDistBase: 10 },
]

const ZONINGS = ['agricultural', 'timber', 'rural-residential', 'mixed-use', 'conservation']
const ROAD_ACCESS = ['paved', 'gravel', 'dirt']
const FLOOD_ZONES = ['X', 'A', 'AE', null]
const COVER_TYPES = ['forest', 'pasture', 'cropland', 'wetland', 'developed']
const WATER_FEATURES_OPTIONS = [
  ['creek'], ['pond'], ['creek', 'pond'], ['river frontage'], ['spring'],
  ['lake frontage'], ['creek', 'spring'], ['pond', 'wetland area'],
]

const LISTING_ADJECTIVES = [
  'Beautiful', 'Stunning', 'Prime', 'Exceptional', 'Pristine',
  'Magnificent', 'Secluded', 'Scenic', 'Rolling', 'Expansive',
  'Breathtaking', 'Trophy', 'Turnkey', 'Unrestricted', 'Private',
]

const LISTING_DESCRIPTORS: Record<string, string[]> = {
  agricultural: ['Farm', 'Agricultural Tract', 'Farmland', 'Ag Tract'],
  timber: ['Timber Tract', 'Timberland', 'Hardwood Tract', 'Managed Timber'],
  'rural-residential': ['Estate Tract', 'Country Estate', 'Rural Homesite', 'Mountain Retreat'],
  'mixed-use': ['Mixed-Use Tract', 'Development Opportunity', 'Versatile Tract'],
  conservation: ['Conservation Tract', 'Nature Preserve', 'Wildlife Sanctuary', 'Wilderness Tract'],
}

const ROAD_NAMES = [
  'Old Mill Rd', 'Cedar Creek Rd', 'Mountain View Dr', 'Pine Ridge Rd',
  'Hollow Creek Rd', 'Church Hill Rd', 'Spring Branch Rd', 'River Bend Rd',
  'Timber Ridge Ln', 'Fox Run Rd', 'Meadow Creek Rd', 'Shady Grove Rd',
  'Possum Trot Rd', 'Long Branch Rd', 'Dry Creek Rd', 'Turkey Creek Rd',
  'Indian Trail Rd', 'Hwy 29', 'County Rd 112', 'State Rd 68',
  'Blue Ridge Pkwy', 'Hickory Flat Rd', 'Sandy Bottom Rd', 'Rocky Ford Rd',
  'Piney Woods Rd', 'Bear Hollow Rd', 'Deer Run Trail', 'White Oak Rd',
]

const DEAL_STAGES = ['new', 'qualified', 'pursuit', 'under-contract', 'closed', 'passed']
const DEAL_PRIORITIES = ['high', 'medium', 'low']

const ACTIVITY_TYPES = ['note', 'call', 'email', 'visit', 'offer', 'document']
const ACTIVITY_CONTENTS: Record<string, string[]> = {
  note: [
    'Reviewed aerial imagery — looks great, minimal encroachment from neighbors.',
    'County records show no liens or encumbrances. Title appears clean.',
    'Timber cruise estimate suggests 1.2M board feet of merchantable hardwood.',
    'Neighboring parcels recently sold at $5,200/ac — this is well-priced.',
    'Soils report shows prime farmland classification on 60% of the tract.',
  ],
  call: [
    'Spoke with listing agent — seller is motivated, recently inherited the property.',
    'Called county planning office — zoning change is feasible with site plan.',
    'Discussed with surveyor — boundary survey would take 2-3 weeks.',
    'Broker confirmed no other active offers at this time.',
    'Spoke with neighboring landowner — open to selling adjacent 50-acre tract.',
  ],
  email: [
    'Sent request for timber appraisal to Anderson Forestry Consultants.',
    'Received Phase I environmental report — no issues identified.',
    'Forwarded wetlands delineation report to attorney for review.',
    'Requested updated plat from county GIS office.',
    'Sent LOI to listing broker for client review.',
  ],
  visit: [
    'Walked the property — excellent road frontage, creek runs year-round.',
    'Site visit confirmed mountain views to the west, gentle rolling terrain.',
    'Inspected existing barn structure — needs roof repair but solid foundation.',
    'Drove all property boundaries — access from both north and south sides.',
    'Visited during rain — drainage patterns look healthy, no standing water issues.',
  ],
  offer: [
    'Submitted initial offer at $3,800/acre, 30-day due diligence.',
    'Counter-offer received at $4,200/acre — recommending acceptance.',
    'Final offer accepted at $4,000/acre — moving to contract phase.',
  ],
  document: [
    'Filed purchase and sale agreement with title company.',
    'Uploaded survey plat to deal folder.',
    'Received and reviewed title commitment — Schedule B items are standard.',
  ],
}

// ─── Helper functions ─────────────────────────────────────────

function generateAPN(): string | null {
  if (rng() > 0.7) return null // 30% chance of no APN
  const parts = [
    randInt(10, 99).toString(),
    randInt(1, 9).toString(),
    randInt(100, 999).toString(),
    randInt(10, 99).toString(),
  ]
  return parts.join('-')
}

function generateLandCover(): Record<string, number> {
  const types = pickN(COVER_TYPES, randInt(2, 4))
  const cover: Record<string, number> = {}
  let remaining = 100
  for (let i = 0; i < types.length; i++) {
    if (i === types.length - 1) {
      cover[types[i]] = remaining
    } else {
      const share = randInt(10, Math.min(60, remaining - (types.length - i - 1) * 5))
      cover[types[i]] = share
      remaining -= share
    }
  }
  return cover
}

function generateSlopeStats(): { mean: number; percentOver20: number; percentOver40: number } {
  const mean = randFloat(2, 25, 1)
  const percentOver20 = mean > 15 ? randFloat(10, 40, 1) : randFloat(0, 15, 1)
  const percentOver40 = percentOver20 > 20 ? randFloat(2, 15, 1) : randFloat(0, 5, 1)
  return { mean, percentOver20, percentOver40 }
}

function calculateFitScore(features: {
  acreage: number
  soilsQuality: number
  metroDistance: number
  roadAccess: string
  waterPresence: boolean
  inFloodway: boolean
  wetlandsPercent: number
  elevation: number
  slopeStats: { mean: number; percentOver20: number }
  powerDistance: number
}): { overallScore: number; breakdown: Record<string, number>; topReasons: string[]; autoFailed: boolean; autoFailReason: string | null } {
  // Auto-fail checks
  if (features.inFloodway) {
    return {
      overallScore: 0,
      breakdown: {},
      topReasons: [],
      autoFailed: true,
      autoFailReason: 'Parcel is located in a FEMA floodway',
    }
  }
  if (features.wetlandsPercent > 50) {
    return {
      overallScore: 0,
      breakdown: {},
      topReasons: [],
      autoFailed: true,
      autoFailReason: `Wetlands coverage exceeds 50% (${features.wetlandsPercent}%)`,
    }
  }

  const breakdown: Record<string, number> = {}
  const reasons: string[] = []

  // Acreage score (0-20): sweet spot 100-1000
  if (features.acreage >= 100 && features.acreage <= 1000) {
    breakdown.acreage = randInt(14, 20)
    reasons.push(`Ideal acreage (${features.acreage} ac) in target range`)
  } else if (features.acreage >= 50 && features.acreage < 100) {
    breakdown.acreage = randInt(4, 8)
  } else {
    breakdown.acreage = randInt(8, 12)
  }

  // Soils quality (0-15)
  breakdown.soils = Math.round((features.soilsQuality / 10) * 15)
  if (features.soilsQuality >= 7) reasons.push(`Strong soils quality (${features.soilsQuality}/10)`)

  // Metro proximity (0-15): 15-45 miles is ideal
  if (features.metroDistance >= 15 && features.metroDistance <= 45) {
    breakdown.location = randInt(12, 15)
    reasons.push(`Good metro proximity (${features.metroDistance} mi)`)
  } else if (features.metroDistance < 15) {
    breakdown.location = randInt(8, 12)
  } else {
    breakdown.location = randInt(4, 10)
  }

  // Road access (0-15)
  breakdown.access = features.roadAccess === 'paved' ? randInt(10, 15) :
    features.roadAccess === 'gravel' ? randInt(5, 9) : randInt(1, 4)
  if (features.roadAccess === 'paved') reasons.push('Paved road access')

  // Water (0-10)
  breakdown.water = features.waterPresence ? randInt(7, 10) : randInt(2, 5)
  if (features.waterPresence) reasons.push('Water features present on property')

  // Terrain/slope (0-10)
  breakdown.terrain = features.slopeStats.mean < 10 ? randInt(7, 10) :
    features.slopeStats.mean < 20 ? randInt(3, 6) : randInt(0, 3)

  // Utilities (0-10)
  breakdown.utilities = features.powerDistance < 1 ? randInt(8, 10) :
    features.powerDistance < 3 ? randInt(4, 7) : randInt(0, 4)
  if (features.powerDistance < 1) reasons.push('Utilities readily available')

  // Flood/wetlands risk (0-12)
  const wetlandsPenalty = Math.max(0, Math.round(features.wetlandsPercent / 5))
  breakdown.risk = Math.max(0, 12 - wetlandsPenalty)
  if (features.wetlandsPercent < 10) reasons.push('Low flood/wetlands risk')

  // Elevation bonus (0-5)
  breakdown.elevation = features.elevation > 1500 ? randInt(3, 5) :
    features.elevation > 800 ? randInt(1, 3) : randInt(0, 2)

  // Apply a variance factor to spread the distribution
  // Top ~20% get a bonus, bottom ~40% get a penalty
  const rawScore = Object.values(breakdown).reduce((a, b) => a + b, 0)
  const varianceDie = rng()
  let adjusted: number
  if (varianceDie < 0.25) {
    // Boost to high tier
    adjusted = Math.min(100, rawScore + randInt(10, 20))
  } else if (varianceDie < 0.60) {
    // Keep in medium
    adjusted = rawScore + randInt(-2, 5)
  } else {
    // Push toward low
    adjusted = Math.max(5, rawScore - randInt(10, 25))
  }
  const overallScore = Math.min(100, Math.max(0, adjusted))
  const topReasons = reasons.slice(0, 4)

  return { overallScore, breakdown, topReasons, autoFailed: false, autoFailReason: null }
}

// ─── Main Seed Function ───────────────────────────────────────

async function main() {
  console.log('🌱 Seeding LandScout 2.0 database...\n')

  // Clean existing data
  console.log('  Clearing existing data...')
  await prisma.activity.deleteMany()
  await prisma.deal.deleteMany()
  await prisma.fitScore.deleteMany()
  await prisma.features.deleteMany()
  await prisma.listing.deleteMany()
  await prisma.scanRunSource.deleteMany()
  await prisma.scanRun.deleteMany()
  await prisma.savedSearch.deleteMany()
  await prisma.ownership.deleteMany()
  await prisma.parcel.deleteMany()
  await prisma.source.deleteMany()

  // ── 1. Create Sources ──
  console.log('  Creating 13 sources...')
  const createdSources = await Promise.all(
    SOURCES.map((s) =>
      prisma.source.create({
        data: {
          name: s.name,
          slug: s.slug,
          baseUrl: s.baseUrl,
          type: s.type,
          enabled: true,
          crawlFrequency: s.type === 'portal' ? 'daily' : 'weekly',
          rateLimitPerMin: s.type === 'portal' ? 10 : 6,
        },
      })
    )
  )
  console.log(`    ✅ ${createdSources.length} sources created`)

  // ── 2. Create Parcels with Features and FitScores ──
  console.log('  Creating 75 parcels with features and scores...')

  // Use first 75 counties (we have exactly 75)
  const parcelData = COUNTIES.slice(0, 75)

  interface ParcelRecord {
    id: string
    county: string
    state: string
    acreage: number
    zoning: string
    fitScore: number
    autoFailed: boolean
  }

  const parcels: ParcelRecord[] = []

  for (let i = 0; i < parcelData.length; i++) {
    const cd = parcelData[i]
    const acreage = i < 5
      ? randFloat(50, 99, 0) // Some small ones
      : i < 10
        ? randFloat(1001, 1500, 0) // Some big ones
        : randFloat(100, 1000, 0) // Most in target range

    const zoning = pick(ZONINGS)
    const apn = generateAPN()
    const roadNum = randInt(100, 9999)
    const roadName = pick(ROAD_NAMES)
    const address = `${roadNum} ${roadName}`

    // Add slight randomness to coordinates
    const lat = cd.lat + randFloat(-0.15, 0.15, 4)
    const lon = cd.lon + randFloat(-0.15, 0.15, 4)

    // Features
    const landCover = generateLandCover()
    const waterPresence = rng() < 0.4
    const waterFeats = waterPresence ? pick(WATER_FEATURES_OPTIONS) : []
    const metroDistance = cd.metroDistBase + randInt(-5, 20)
    const slopeStats = generateSlopeStats()
    const soilsQuality = randFloat(3, 9, 1)
    const roadAccess = pick(ROAD_ACCESS)
    const inFloodway = rng() < 0.05 // 5%
    const floodZone = inFloodway ? 'AE' : pick(FLOOD_ZONES)
    const wetlandsPercent = inFloodway ? randFloat(30, 80, 1) : randFloat(0, 45, 1)
    const elevation = cd.state === 'FL'
      ? randFloat(20, 300, 0)
      : cd.state === 'VA' || cd.state === 'NC'
        ? randFloat(800, 3200, 0)
        : randFloat(200, 1800, 0)
    const powerDistance = randFloat(0.1, 8, 1)
    const waterDistance = randFloat(0.1, 6, 1)
    const sewerDistance = randFloat(1, 20, 1)
    const fiberDistance = randFloat(1, 30, 1)
    const gasDistance = randFloat(2, 25, 1)

    const fitResult = calculateFitScore({
      acreage,
      soilsQuality,
      metroDistance,
      roadAccess,
      waterPresence,
      inFloodway,
      wetlandsPercent,
      elevation,
      slopeStats,
      powerDistance,
    })

    const description = `${acreage}-acre ${zoning} tract in ${cd.county} County, ${cd.state}. ` +
      `${Object.entries(landCover).map(([k, v]) => `${v}% ${k}`).join(', ')}. ` +
      `${waterPresence ? `Water features include ${waterFeats.join(', ')}. ` : ''}` +
      `${metroDistance} miles from ${cd.nearestMetro}. ` +
      `${roadAccess.charAt(0).toUpperCase() + roadAccess.slice(1)} road access. ` +
      `Elevation ${elevation} ft.`

    const parcel = await prisma.parcel.create({
      data: {
        apn,
        address,
        county: cd.county,
        state: cd.state,
        acreage,
        lat,
        lon,
        zoning,
        description,
        features: {
          create: {
            landCoverMix: JSON.stringify(landCover),
            waterPresence,
            waterFeatures: waterPresence ? JSON.stringify(waterFeats) : null,
            metroDistance,
            nearestMetro: cd.nearestMetro,
            slopeStats: JSON.stringify(slopeStats),
            soilsQuality,
            roadAccess,
            easements: rng() < 0.2 ? JSON.stringify(['utility easement', 'road easement']) : null,
            powerDistance,
            waterDistance,
            sewerDistance,
            fiberDistance,
            gasDistance,
            inFloodway,
            floodZone,
            wetlandsPercent,
            elevation,
          },
        },
        fitScore: {
          create: {
            overallScore: fitResult.overallScore,
            scoreBreakdown: JSON.stringify(fitResult.breakdown),
            topReasons: JSON.stringify(fitResult.topReasons),
            autoFailed: fitResult.autoFailed,
            autoFailReason: fitResult.autoFailReason,
          },
        },
      },
    })

    parcels.push({
      id: parcel.id,
      county: cd.county,
      state: cd.state,
      acreage,
      zoning,
      fitScore: fitResult.overallScore,
      autoFailed: fitResult.autoFailed,
    })
  }

  const highScorers = parcels.filter((p) => p.fitScore >= 80 && !p.autoFailed).length
  const midScorers = parcels.filter((p) => p.fitScore >= 60 && p.fitScore < 80 && !p.autoFailed).length
  const lowScorers = parcels.filter((p) => (p.fitScore < 60 || p.autoFailed)).length
  console.log(`    ✅ ${parcels.length} parcels created (${highScorers} high / ${midScorers} mid / ${lowScorers} low)`)

  // ── 3. Create Listings ──
  console.log('  Creating listings...')
  let listingCount = 0
  for (const parcel of parcels) {
    const numListings = rng() < 0.3 ? randInt(2, 3) : 1
    const pricePerAcre = randFloat(1000, 15000, 0)
    const totalPrice = Math.round(parcel.acreage * pricePerAcre)

    for (let j = 0; j < numListings; j++) {
      const source = pick(createdSources)
      const adj = pick(LISTING_ADJECTIVES)
      const desc = pick(LISTING_DESCRIPTORS[parcel.zoning] || ['Tract'])
      const title = `${adj} ${parcel.acreage}-Acre ${desc} in ${parcel.county} County`
      const extId = `${source.slug}-${randInt(100000, 999999)}`
      const listingPrice = j === 0 ? totalPrice : Math.round(totalPrice * randFloat(0.95, 1.05, 2))
      const status = rng() < 0.85 ? 'listed' : 'off-market'

      await prisma.listing.create({
        data: {
          parcelId: parcel.id,
          sourceId: source.id,
          externalId: extId,
          url: `${source.baseUrl}/listing/${extId}`,
          title,
          price: listingPrice,
          pricePerAcre: Math.round(listingPrice / parcel.acreage),
          status,
          photos: JSON.stringify([
            `https://images.landscout.dev/${extId}/aerial-1.jpg`,
            `https://images.landscout.dev/${extId}/ground-1.jpg`,
          ]),
          metadata: JSON.stringify({
            originalListDate: `2025-${randInt(1, 12).toString().padStart(2, '0')}-${randInt(1, 28).toString().padStart(2, '0')}`,
            daysOnMarket: randInt(5, 365),
            broker: source.type === 'broker' ? source.name : null,
          }),
        },
      })
      listingCount++
    }
  }
  console.log(`    ✅ ${listingCount} listings created`)

  // ── 4. Create Deals from top parcels ──
  console.log('  Creating 25 deals...')
  const dealCandidates = parcels
    .filter((p) => !p.autoFailed)
    .sort((a, b) => b.fitScore - a.fitScore)
    .slice(0, 25)

  // Stage distribution: 8 new, 6 qualified, 5 pursuit, 3 under-contract, 2 closed, 1 passed
  const stageDistribution = [
    ...Array(8).fill('new'),
    ...Array(6).fill('qualified'),
    ...Array(5).fill('pursuit'),
    ...Array(3).fill('under-contract'),
    ...Array(2).fill('closed'),
    ...Array(1).fill('passed'),
  ]

  const NEXT_ACTIONS: Record<string, string[]> = {
    new: ['Schedule site visit', 'Request timber appraisal', 'Pull county tax records', 'Contact listing agent'],
    qualified: ['Order soil survey', 'Conduct environmental review', 'Negotiate price', 'Request survey'],
    pursuit: ['Submit LOI', 'Finalize offer terms', 'Order Phase I ESA', 'Schedule closing'],
    'under-contract': ['Complete due diligence', 'Order title insurance', 'Schedule closing', 'Finalize financing'],
    closed: [],
    passed: [],
  }

  for (let i = 0; i < dealCandidates.length; i++) {
    const parcel = dealCandidates[i]
    const stage = stageDistribution[i]
    const priority = i < 8 ? 'high' : i < 18 ? 'medium' : 'low'
    const nextActions = NEXT_ACTIONS[stage] || []
    const nextAction = nextActions.length > 0 ? pick(nextActions) : null
    const hasNotes = rng() < 0.7

    const deal = await prisma.deal.create({
      data: {
        parcelId: parcel.id,
        stage,
        priority,
        notes: hasNotes
          ? `${parcel.acreage}-acre ${parcel.zoning} property in ${parcel.county} County, ${parcel.state}. Score: ${parcel.fitScore}/100.`
          : null,
        nextAction,
        nextDate: nextAction
          ? new Date(Date.now() + randInt(1, 30) * 24 * 60 * 60 * 1000)
          : null,
        assignee: pick(['Deven', 'Deven', 'Analyst', null]),
      },
    })

    // 2-3 activities per deal
    const numActivities = randInt(2, 3)
    for (let a = 0; a < numActivities; a++) {
      const type = pick(ACTIVITY_TYPES)
      const contents = ACTIVITY_CONTENTS[type] || ['Activity logged.']
      await prisma.activity.create({
        data: {
          dealId: deal.id,
          type,
          content: pick(contents),
          createdAt: new Date(Date.now() - randInt(1, 60) * 24 * 60 * 60 * 1000),
        },
      })
    }
  }
  console.log(`    ✅ 25 deals created with activities`)

  // ── 5. Create ScanRun ──
  console.log('  Creating scan run...')
  const scanRun = await prisma.scanRun.create({
    data: {
      status: 'completed',
      totalListings: listingCount,
      newParcels: 75,
      updatedParcels: 0,
      errors: 2,
      startedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000),
    },
  })

  // Attach 6 sources to the scan run
  const scanSources = pickN(createdSources, 6)
  for (const source of scanSources) {
    await prisma.scanRunSource.create({
      data: {
        scanRunId: scanRun.id,
        sourceId: source.id,
        status: 'completed',
        listings: randInt(8, 20),
        errors: rng() < 0.3 ? 1 : 0,
        startedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - randInt(150, 170) * 60 * 1000),
      },
    })
  }
  console.log(`    ✅ 1 scan run created with ${scanSources.length} source results`)

  // ── 6. Create SavedSearches ──
  console.log('  Creating saved searches...')
  await prisma.savedSearch.create({
    data: {
      name: 'Blue Ridge Corridor — 200-600ac Timber',
      filters: JSON.stringify({
        states: ['VA', 'NC'],
        minAcreage: 200,
        maxAcreage: 600,
        zoning: ['timber', 'agricultural'],
        minScore: 70,
        waterPresence: true,
        maxMetroDistance: 50,
      }),
      schedule: 'daily',
      resultCount: 12,
      lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
  })

  await prisma.savedSearch.create({
    data: {
      name: 'Georgia Piedmont — Large Ag Tracts',
      filters: JSON.stringify({
        states: ['GA'],
        minAcreage: 300,
        maxAcreage: 1500,
        zoning: ['agricultural', 'mixed-use'],
        minScore: 60,
        roadAccess: ['paved', 'gravel'],
        maxPricePerAcre: 8000,
      }),
      schedule: 'weekly',
      resultCount: 8,
      lastRun: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  })

  await prisma.savedSearch.create({
    data: {
      name: 'SC/AL Bargains — Under $3k/ac, 100+ acres',
      filters: JSON.stringify({
        states: ['SC', 'AL'],
        minAcreage: 100,
        maxPricePerAcre: 3000,
        minScore: 50,
        excludeFloodway: true,
        maxWetlandsPercent: 30,
      }),
      schedule: 'manual',
      resultCount: 15,
    },
  })
  console.log(`    ✅ 3 saved searches created`)

  // ── Summary ──
  console.log('\n🎉 Seed complete!')
  console.log(`   Sources:        ${createdSources.length}`)
  console.log(`   Parcels:        ${parcels.length}`)
  console.log(`   Listings:       ${listingCount}`)
  console.log(`   Deals:          25`)
  console.log(`   Scan Runs:      1`)
  console.log(`   Saved Searches: 3`)
  console.log(`\n   Score Distribution:`)
  console.log(`     High (80+):  ${highScorers}`)
  console.log(`     Medium (60-79): ${midScorers}`)
  console.log(`     Low (<60):   ${lowScorers}`)
  console.log(`\n   States: VA (${parcels.filter((p) => p.state === 'VA').length}), NC (${parcels.filter((p) => p.state === 'NC').length}), SC (${parcels.filter((p) => p.state === 'SC').length}), GA (${parcels.filter((p) => p.state === 'GA').length}), FL (${parcels.filter((p) => p.state === 'FL').length}), AL (${parcels.filter((p) => p.state === 'AL').length})`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
