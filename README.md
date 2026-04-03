# LandScout 2.0 — Land Intelligence Platform

Automated land discovery, scoring, and deal pipeline management for rural land investors targeting 100–1,000 acre parcels across the Southeast US (VA, NC, SC, GA, FL, AL).

**Live:** [landscout.app](https://landscout.app)
**Version:** 2.0.1

---

## Features

### Dashboard
Real-time stats overview with parcel counts, average fit scores, score distribution, state breakdown, top sources chart, and recent discoveries table. All data from live database queries.

### Results Table
Full-featured search and filter interface. Filter by state, acreage range, minimum score, and source. Sortable columns (score, acreage, price, price/acre). Paginated results (25/page). Click any row to open the property detail modal.

### Property Detail Modal
Centered floating modal with two-column layout. Displays fit score ring, key metrics (acreage, price, water, road access), score breakdown bars for all 9 dimensions, top scoring reasons, deal pipeline status, embedded MapLibre mini-map, listing sources with prices, and land features grid (elevation, soils, metro distance, flood zone, wetlands).

### Interactive Map
Full-screen MapLibre GL map with color-coded parcel pins (green = 80+ high, amber = 60-79 medium, red = <60 low). State and score filters. Click any pin for a popup with parcel details. Dark-matter tile style from CartoDB.

### Deal Pipeline
Kanban board with 6 stages (New, Qualified, Pursuit, Under Contract, Closed, Passed). Drag-and-drop cards between stages. Each card shows county/state, acreage, price, fit score badge, priority indicator, and last activity date.

### Admin Panel
Two-tab interface: System Health (last scan status, source stats, scan history) and Configuration (target states, acreage range, fit score weights, data sources, scheduling). Configuration is read-only in the current release.

### Authentication
Password-protected login gate using HMAC-signed session cookies. Middleware protects all dashboard routes. 24-hour session expiry.

---

## Enrichment Engine

LandScout enriches every parcel with real data from 6 free government APIs:

| API | Data Provided | Score Weight |
|-----|--------------|-------------|
| **NRCS Soil Data Access** | Drainage class, capability class, soil quality (0-10) | 10% |
| **FEMA NFHL** | Flood zone code, floodway detection | Auto-fail gate |
| **USGS NHD** | Water feature presence, type, distance | 10% |
| **USGS EPQS / 3DEP** | Elevation (ft), slope sampling (% grade) | 10% |
| **NLCD** | Land cover classification (forest, pasture, cropland, etc.) | 20% |
| **Metro Distance** | Haversine distance to 12 SE US metros | 10% |

All APIs are free, no authentication required. Enrichment runs via `scripts/enrich-parcels.ts`.

### Fit Score Algorithm

9-dimension weighted scoring (0-100):

| Dimension | Weight | Method |
|-----------|--------|--------|
| Acreage | 20% | Optimal range matching (100-1000 acres) |
| Land Cover Mix | 20% | Shannon diversity index |
| Water Presence | 10% | Binary + feature type bonus |
| Metro Proximity | 10% | Linear within 30mi, exponential decay beyond |
| Slope/Terrain | 10% | Penalties for steep grade |
| Soils Quality | 10% | NRCS drainage class mapping |
| Road Access | 10% | Paved > gravel > dirt > none |
| Easement Penalty | 5% | Per-easement deduction |
| Utilities | 5% | Distance-based for power, water, sewer, fiber, gas |

**Auto-fail conditions:** In floodway OR wetlands > 50% = Score 0.

---

## Data Sources

### Broker Adapters (Built)

| Source | Type | Method | Status |
|--------|------|--------|--------|
| Mason & Morse Ranch | Broker | HTML scraping | Adapter built, needs live testing |
| United Country | Broker | HTML scraping | Adapter built, needs live testing |
| Whitetail Properties | Broker | HTML scraping | Adapter built, needs live testing |

### Not Recommended for Scraping (Legal Risk)

Per CoWork research (see `LANDSCOUT-research-results-260402.md`): LandWatch, Land And Farm, Lands of America, LoopNet, and Crexi are all owned by CoStar Group or use aggressive anti-bot protections. Their TOS explicitly prohibit programmatic access.

### Recommended Alternative Data Sources

| Source | Cost | Type |
|--------|------|------|
| County GIS REST APIs | Free | Parcel data, boundaries |
| Land Portal | $99-199/mo | Nationwide vacant land data |
| RESO Web API (via MLS) | $100-500/mo | MLS listing feeds |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15.5 (App Router, React 19, Turbopack) |
| Language | TypeScript 5.8 |
| Database | Prisma 6 + SQLite (local) |
| Styling | Tailwind CSS 3.4 |
| Maps | MapLibre GL JS 5.x (free, no API key) |
| Icons | Lucide React |
| Validation | Zod |
| Auth | Custom HMAC session cookies |
| Hosting | Vercel |
| Data Export | Static JSON for Vercel serverless compatibility |

---

## Project Structure

```
app/
├── (dashboard)/              # Auth-protected dashboard routes
│   ├── layout.tsx            # Sidebar navigation + mobile nav
│   ├── dashboard/page.tsx    # Stats overview (server component)
│   ├── results/page.tsx      # Search & filter table (client)
│   ├── map/page.tsx          # Interactive map (client)
│   ├── pipeline/page.tsx     # Kanban deal board (client)
│   └── admin/page.tsx        # System health & config (server)
├── api/
│   ├── search/route.ts       # POST — property search with filters
│   ├── parcels/[id]/route.ts # GET — full parcel detail
│   ├── deals/route.ts        # GET — all deals for pipeline
│   ├── deals/[id]/route.ts   # PUT/POST — update deal, add activity
│   ├── stats/route.ts        # GET — dashboard statistics
│   ├── admin/health/route.ts # GET — system health
│   └── admin/scan/route.ts   # POST — trigger scan, GET — scan status
├── login/page.tsx            # Login form
└── layout.tsx                # Root layout (Inter font, dark mode)

components/
├── property-detail.tsx       # Floating modal with mini-map
└── admin-tabs.tsx            # Health + config tab switcher

lib/
├── adapters/                 # Web scraping adapters
│   ├── types.ts              # CrawlerAdapter interface
│   ├── index.ts              # Adapter registry
│   ├── html-utils.ts         # Regex-based HTML parser
│   ├── mason-morse.ts        # Mason & Morse Ranch adapter
│   ├── united-country.ts     # United Country adapter
│   └── whitetail.ts          # Whitetail Properties adapter
├── enrichment/               # Government API integrations
│   ├── index.ts              # Orchestrator (runs all APIs in parallel)
│   ├── nrcs-soils.ts         # NRCS Soil Data Access
│   ├── fema-flood.ts         # FEMA NFHL flood zones
│   ├── usgs-water.ts         # USGS NHD water features
│   ├── usgs-elevation.ts     # USGS EPQS elevation + slope
│   ├── nlcd-landcover.ts     # NLCD land cover classification
│   └── metro-distance.ts     # Haversine metro distance calculator
├── scanner.ts                # Scan orchestrator (crawl + enrich + score)
├── fit-score.ts              # 9-dimension scoring algorithm
├── admin-config.ts           # Zod schema + defaults for all config
├── auth.ts                   # HMAC session auth
├── types.ts                  # Shared TypeScript types
├── prisma.ts                 # Database client singleton
└── utils.ts                  # Formatting helpers

prisma/
├── schema.prisma             # 11 models (Parcel, Listing, Features, FitScore, Deal, Activity, Ownership, Source, ScanRun, ScanRunSource, SavedSearch)
└── seed.ts                   # 75 parcels, 106 listings, 25 deals across 6 states

scripts/
├── enrich-parcels.ts         # Batch enrich all parcels with real API data
├── export-data.ts            # Export DB to static JSON for Vercel
└── test-enrichment.ts        # Test all 6 enrichment APIs

data/                         # Static JSON (generated at build time)
├── parcels.json              # All parcels with scores and listings
├── deals.json                # All deals with parcel relations
├── stats.json                # Pre-computed dashboard stats
├── health.json               # System health snapshot
└── parcels/                  # Individual parcel detail files
```

---

## Quick Start

### Prerequisites
- Node.js 22+ / pnpm
- No external services required (SQLite + free APIs)

### Setup

```bash
git clone https://github.com/devenspear/landscout_1.git
cd landscout_1
pnpm install
cp .env.example .env
pnpm exec prisma db push
pnpm db:seed
pnpm dev
```

Visit http://localhost:3000

### Enrich with Real Government Data

```bash
npx tsx scripts/enrich-parcels.ts    # ~2 min for 75 parcels
npx tsx scripts/export-data.ts       # Rebuild static JSON
```

### Deploy to Vercel

```bash
# Set env vars on Vercel (use printf, not echo, to avoid trailing newlines)
printf 'Admin' | vercel env add AUTH_USERNAME production
printf 'YourPassword' | vercel env add AUTH_PASSWORD production
printf "$(openssl rand -hex 32)" | vercel env add AUTH_SECRET production
printf 'file:./prisma/dev.db' | vercel env add DATABASE_URL production

# Build locally and deploy (remote builds have pnpm compatibility issues)
AUTH_SECRET=<secret> AUTH_USERNAME=Admin AUTH_PASSWORD=<pass> vercel build --prod
vercel deploy --prebuilt --prod
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | `file:./dev.db` for SQLite |
| `AUTH_USERNAME` | Yes | Login username |
| `AUTH_PASSWORD` | Yes | Login password |
| `AUTH_SECRET` | Yes | 64-char hex string for HMAC signing |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | No | Mapbox token for satellite tiles |

---

## Documentation

| Document | Purpose |
|----------|---------|
| `LANDSCOUT-assessment-260402.md` | Technical assessment of v1 codebase |
| `LANDSCOUT-prd-260402.md` | Product Requirements Document |
| `LANDSCOUT-research-handoff-260402.md` | 13 research areas assigned to CoWork |
| `LANDSCOUT-research-results-260402.md` | CoWork's completed research (APIs, legal, costs) |
| `LANDSCOUT-operational-plan-260402.md` | Full operational plan — every element needed for production |

---

## License

Internal project — All rights reserved.
Life Kitchen Studios
