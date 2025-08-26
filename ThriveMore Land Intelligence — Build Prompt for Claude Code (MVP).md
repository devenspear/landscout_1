# ThriveMore Land Intelligence — **Build Prompt for Claude Code (MVP)**

> Paste this entire file into **Claude Code** (or Cursor) as your primary build prompt. It instructs the agent to generate a production-ready MVP using **Next.js (App Router) + Postgres/PostGIS + Prisma + Clerk + Vercel** with an **Admin Configuration** that **includes Data Sources and Default Values**.

------

## **Mission**

Build an internal web app that continuously discovers **100–1,000 acre** land opportunities across **VA, NC, SC, GA, FL, AL**, deduplicates records, computes a “**Bundoran-like Fit Score**,” and presents results in a sortable grid with a lightweight pipeline (Kanban). **Admin** can configure geographies, filters, **data sources**, and **default values**.

------

## **Scope (MVP)**

- **Auth**: Clerk (email/OTP; roles: **Admin**, **Superuser**).
- **Core views**: Results **Table**, **Parcel/Deal Profile**, **Saved Searches**, **Pipeline Kanban**, **Admin**.
- **Jobs**: Weekly scheduled sweep + **On-Demand** scan with completion notification.
- **Data ingestion**: 8–12 listing/broker sources (adapters); 5–10 Tier-1 counties (starter intake).
- **Fit Score**: Deterministic (0–100) using rule weights; visible “reasons.”
- **Dedup**: APN/geometry/acreage + fuzzy clustering of multi-parcel ranches.
- **Observability**: Admin health page with last run stats and errors.

------

## **Non-Goals (MVP)**

- Map drawing tools, document locker, collaboration comments, email/calendar logging, partner APIs, PDF exports (defer to later phases).

------

## **Architecture & Platform**

- **Frontend**: Next.js (App Router, RSC), TypeScript, Tailwind.
- **Auth**: Clerk.
- **DB**: **Postgres + PostGIS** (Supabase or Neon). Use **Prisma** ORM.
- **Index**: Use Postgres first; leave **Typesense** optional behind a feature flag.
- **Storage**: Supabase Storage (or S3-compatible).
- **Jobs**: Vercel Cron for weekly runs; On-Demand scan via API route; implement long-running worker fallback (Railway/Fly) if needed.
- **Maps**: Defer to Phase 1.1 (Mapbox GL). MVP uses table & profile views.
- **Hosting**: Vercel.

------

## **Deliverables**

1. **Working Next.js app** with the views, endpoints, DB schema, and jobs described here.
2. **Admin Configuration system** that **integrates Data Sources and Default Values**.
3. **Seed script** to populate initial Admin Config (including default data sources).
4. **Crawler adapters** (stubs + at least 2 functional adapters) with normalized output.
5. **Dedup + Fit Score** computation pipeline.
6. **Admin health page** for scan telemetry.
7. **README** with setup and environment details.

------

## **Admin Configuration — Variables, Data Sources, Defaults**

Claude: implement a strongly-typed **AdminConfig** model stored in Postgres (single row per org). Expose it in **Admin > Configuration** with form controls (dropdowns, sliders, toggles). Persist to DB; publish a config snapshot to the job runner at scan time.

### **A) Core Filters & Geography**

- `allowedStates: string[]` — default: `["VA","NC","SC","GA","FL","AL"]`
- `countyTiers: { fips: string; tier: "T1"|"T2"|"T3" }[]` — empty by default
- `metros: { name: string; lat: number; lon: number; useAirport: boolean }[]` — seed with user list later
- `metroRadiusMiles: number` — **default 30**
- `acreage: { min: number; max: number }` — **default { min: 100, max: 1000 }`
- `zoningBuckets: { ag: boolean; timber: boolean; ruralRes: boolean; mixedUse: boolean; conservation: boolean }` — **all true**
- `dealStatus: { listed: boolean; offMarket: boolean; distressed: boolean }` — **all true**
- `legalPosture: { honorRobotsTos: boolean; publicRecordsWherePermitted: boolean }` — **default { true, true }`

### **B) Hard Filters (enable/thresholds)**

- `filters: { slopeMaxPct?: number; wetlandsMaxPct?: number; floodwayExcluded: boolean; utilities: { powerMaxMiles?: number; fiberMaxMiles?: number; waterMaxMiles?: number; sewerMaxMiles?: number } }`
- Defaults:
  - `slopeMaxPct: 40` (soft warning at 20; not auto-fail)
  - `wetlandsMaxPct: 50`
  - `floodwayExcluded: true`
  - `utilities.*MaxMiles: undefined` (not enforced in MVP)

### **C) Fit Score (weights + auto-fails)**

- `fitScore: { weights: { acreage: number; landCoverMix: number; waterPresence: number; metroProximity: number; slope: number; soils: number; roadAccess: number; easementPenalty: number; utilities: number }; thresholds: { high: number; medium: number }; autoFail: { floodway: boolean; wetlandsOverPct?: number } }`
- **Default Values** (from strategy):
  - `weights`: `{ acreage:20, landCoverMix:20, waterPresence:10, metroProximity:10, slope:10, soils:10, roadAccess:10, easementPenalty:5, utilities:5 }`
  - `thresholds`: `{ high: 80, medium: 60 }`
  - `autoFail`: `{ floodway:true, wetlandsOverPct:50 }`

### **D) Scheduling & Alerts**

- `schedules: { weeklyScan: { enabled: boolean; dayOfWeekUTC: number; hourUTC: number }; onDemandScan: { enabled: boolean } }`
  - **Defaults**: weekly enabled, Sunday 02:00 UTC; on-demand enabled.
- `notifications: { onScanComplete: { emailList: string[] } }` — default empty

### **E) Data Sources (INTEGRATED)**

> Implement modular **Source Adapters**. Each source entry shares a common shape. Adapters normalize to a **Listing** schema.

- `listingSources: { id: string; name: string; baseUrl: string; type: "portal"|"broker"; adapter: "landwatch"|"hallhall"|"landandfarm"|"landsofamerica"|"whitetail"|"unitedcountry"|"landleader"|"masonmorse"|"afm"|"peoples"|"nai"|"crexi"|"loopnet"|"custom"; enabled: boolean; crawlFrequency: "daily"|"weekly"|"manual"; rateLimitPerMin: number }[]`

  **Seed Defaults (enabled=true, frequency=weekly, rateLimitPerMin=6):**

  - LandWatch, Hall and Hall, Land And Farm, Lands of America, Whitetail Properties, United Country, LandLeader, Mason & Morse Ranch, AFM Real Estate, Peoples Company, NAI (land), Crexi (land), LoopNet (land).

- `countyGisSources: { fips: string; name: string; arcgisUrl: string; enabled: boolean; crawlFrequency: "weekly"|"biweekly"|"monthly" }[]`

  - **Default**: empty; Admin can add T1 counties.

- `enrichmentSources: { soils: { provider: "NRCS"|"None"; enabled: boolean; apiKey?: string }; hydrography: { provider: "USGS"|"None"; enabled: boolean }; fema: { provider: "NFHL"|"None"; enabled: boolean } }`

  - **Default**: all providers set but `enabled=false` (Phase 2 switch-on).

- `distressSources: { state: string; kind: "taxDelinquency"|"foreclosure"|"sheriffSale"; url?: string; enabled: boolean }[]`

  - **Default**: empty; Admin can add per state.

### **F) ETL & Compliance**

- `crawlPolicy: { proxyPoolEnabled: boolean; captchaProvider?: "None"|"AntiCaptcha"|"2Captcha"; maxConcurrentPerSource: number; retries: number }`
  - Defaults: `{ proxyPoolEnabled: true, captchaProvider: "None", maxConcurrentPerSource: 2, retries: 3 }`

### **G) Performance & Ops**

- `performanceTargets: { mapLoadMs: number; searchMs: number; uptimePct: number }`
  - Defaults: `{ mapLoadMs: 2000, searchMs: 1000, uptimePct: 99.0 }`
- `kpis: { discoveryPerWeekTarget: number; highFitRetentionPct: number; medianDaysNewToQualified: number }`
  - Defaults: `{ discoveryPerWeekTarget: 25, highFitRetentionPct: 70, medianDaysNewToQualified: 7 }`

------

## **Seed Admin Config (JSON Example)**

> Claude: generate this in a seed script and insert on first run. Use a typed validator (zod) server-side and client forms with same schema.

```json
{
  "allowedStates": ["VA","NC","SC","GA","FL","AL"],
  "countyTiers": [],
  "metros": [],
  "metroRadiusMiles": 30,
  "acreage": { "min": 100, "max": 1000 },
  "zoningBuckets": { "ag": true, "timber": true, "ruralRes": true, "mixedUse": true, "conservation": true },
  "dealStatus": { "listed": true, "offMarket": true, "distressed": true },
  "legalPosture": { "honorRobotsTos": true, "publicRecordsWherePermitted": true },
  "filters": {
    "slopeMaxPct": 40,
    "wetlandsMaxPct": 50,
    "floodwayExcluded": true,
    "utilities": {}
  },
  "fitScore": {
    "weights": { "acreage":20, "landCoverMix":20, "waterPresence":10, "metroProximity":10, "slope":10, "soils":10, "roadAccess":10, "easementPenalty":5, "utilities":5 },
    "thresholds": { "high":80, "medium":60 },
    "autoFail": { "floodway": true, "wetlandsOverPct": 50 }
  },
  "schedules": { "weeklyScan": { "enabled": true, "dayOfWeekUTC": 0, "hourUTC": 2 }, "onDemandScan": { "enabled": true } },
  "notifications": { "onScanComplete": { "emailList": [] } },
  "listingSources": [
    { "id":"landwatch","name":"LandWatch","baseUrl":"https://www.landwatch.com","type":"portal","adapter":"landwatch","enabled":true,"crawlFrequency":"weekly","rateLimitPerMin":6 },
    { "id":"hallhall","name":"Hall and Hall","baseUrl":"https://hallhall.com","type":"broker","adapter":"hallhall","enabled":true,"crawlFrequency":"weekly","rateLimitPerMin":6 },
    { "id":"landandfarm","name":"Land And Farm","baseUrl":"https://www.landandfarm.com","type":"portal","adapter":"landandfarm","enabled":true,"crawlFrequency":"weekly","rateLimitPerMin":6 },
    { "id":"landsofamerica","name":"Lands of America","baseUrl":"https://www.landsofamerica.com","type":"portal","adapter":"landsofamerica","enabled":true,"crawlFrequency":"weekly","rateLimitPerMin":6 },
    { "id":"whitetail","name":"Whitetail Properties","baseUrl":"https://www.whitetailproperties.com","type":"broker","adapter":"whitetail","enabled":true,"crawlFrequency":"weekly","rateLimitPerMin":6 },
    { "id":"unitedcountry","name":"United Country","baseUrl":"https://www.unitedcountry.com","type":"broker","adapter":"unitedcountry","enabled":true,"crawlFrequency":"weekly","rateLimitPerMin":6 },
    { "id":"landleader","name":"LandLeader","baseUrl":"https://www.landleader.com","type":"portal","adapter":"landleader","enabled":true,"crawlFrequency":"weekly","rateLimitPerMin":6 },
    { "id":"masonmorse","name":"Mason & Morse Ranch","baseUrl":"https://www.ranchland.com","type":"broker","adapter":"masonmorse","enabled":true,"crawlFrequency":"weekly","rateLimitPerMin":6 },
    { "id":"afm","name":"AFM Real Estate","baseUrl":"https://www.afmrealestate.com","type":"broker","adapter":"afm","enabled":true,"crawlFrequency":"weekly","rateLimitPerMin":6 },
    { "id":"peoples","name":"Peoples Company","baseUrl":"https://peoplescompany.com","type":"broker","adapter":"peoples","enabled":true,"crawlFrequency":"weekly","rateLimitPerMin":6 },
    { "id":"nai","name":"NAI Land","baseUrl":"https://www.nai-global.com","type":"broker","adapter":"nai","enabled":true,"crawlFrequency":"weekly","rateLimitPerMin":6 },
    { "id":"crexi","name":"Crexi (Land)","baseUrl":"https://www.crexi.com","type":"portal","adapter":"crexi","enabled":true,"crawlFrequency":"weekly","rateLimitPerMin":6 },
    { "id":"loopnet","name":"LoopNet (Land)","baseUrl":"https://www.loopnet.com","type":"portal","adapter":"loopnet","enabled":true,"crawlFrequency":"weekly","rateLimitPerMin":6 }
  ],
  "countyGisSources": [],
  "enrichmentSources": {
    "soils": { "provider": "NRCS", "enabled": false },
    "hydrography": { "provider": "USGS", "enabled": false },
    "fema": { "provider": "NFHL", "enabled": false }
  },
  "distressSources": [],
  "crawlPolicy": { "proxyPoolEnabled": true, "captchaProvider": "None", "maxConcurrentPerSource": 2, "retries": 3 },
  "performanceTargets": { "mapLoadMs": 2000, "searchMs": 1000, "uptimePct": 99.0 },
  "kpis": { "discoveryPerWeekTarget": 25, "highFitRetentionPct": 70, "medianDaysNewToQualified": 7 }
}
```

------

## **Data Model (entities to implement)**

> Claude: generate Prisma schema + migrations. Use PostGIS for geometry and centroid.

- **Source** (listing/broker/county/enrichment)
- **ScanRun** (per job execution; stats, errors)
- **Parcel** (apn, acreage, geometry, centroid, county/state)
- **Listing** (source_id, parcel_id?, url, title, price, status, first_seen, last_seen)
- **Ownership** (parcel_id, owner_name, mailing_address) *Phase 2 fill-in*
- **Features** (parcel_id; land use mix, slope stats, soils class, water flag, utilities distances, flood flags)
- **FitScore** (parcel_id; overall; reasons)
- **Deal** (parcel_id; stage; priority; owner_contact; last_touch; notes)
- **SavedSearch** (criteria json; schedule)
- **User** (role; org_id)

------

## **Crawler & Adapter Requirements**

- Implement **adapter interface** returning normalized `ListingCandidate`: `{ sourceId, url, title, lat, lon, acreage, county, state, price?, photos?, status, apn? }`.
- Provide at least **two working adapters** (e.g., LandWatch, Hall and Hall). Others can be stubs with TODOs.
- Respect `crawlPolicy`, `rateLimitPerMin`, retries & backoff.
- **Change detection**: identity = `(apn) || (roundedLatLon+acreage±3% + title hash)`.
- **Dedup pass**:
  - Exact match by APN → same parcel.
  - Fuzzy by centroid within 250m & acreage ±3% → cluster as Portfolio; assign canonical.
- Persist raw HTML snapshots (short-term) or key fields for lineage; store `sourceAttribution`.

------

## **Fit Score Computation**

- Compute on upsert & on weight change.
- **Signals**: acreage band, land cover mix (forest/pasture proxy by keywords/labels), water presence (keywords/photos/“creek/pond/lake”), metro proximity (haversine to chosen metro/airport), slope (DEM optional Phase 2; MVP allow placeholder), soils (Phase 2), road access (frontage/inferred distance), easement penalty (keywords: “conservation easement,” “perpetual,” etc.), utilities proximity (heuristics or null).
- Produce **breakdown** and **top 5 reasons** for UI.

------

## **Views & UX**

- **Admin > Configuration**: Full config editor with sections A–G above, plus **Data Sources** tables with add/edit/toggle & crawl frequency per source.
- **Admin > Sources**: Run On-Demand scan button; last run UI; per-source error counts.
- **Saved Searches**: Create, edit, run now, weekly subscribe.
- **Results Table**: columns (Fit, acreage, state/county, metro distance, water flag, slope, price, source(s)); quick filters; saved presets; conditional highlight for `Fit >= 80`.
- **Parcel/Deal Profile**: details + reasons; lineage; “Add to Pipeline.”
- **Pipeline Kanban**: New → Qualified → Triage → Pursuit → LOI → UC → Closed/Lost; drag-drop; quick notes.
- **Admin > Health**: last `ScanRun`, processed counts, new vs updated, duplicates, errors.

------

## **API Endpoints (MVP)**

- `POST /api/admin/sources/scan` → trigger On-Demand scan (async)
- `GET /api/admin/health` → latest run stats
- `GET /api/search` → paginated results (criteria payload)
- `GET /api/parcels/:id` → parcel/deal details
- `POST /api/deals/:id` → stage/notes update
- `POST /api/saved-searches` / `POST /api/saved-searches/:id/run`

------

## **Environment Variables**

- `DATABASE_URL` (Postgres; PostGIS enabled)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (if used)
- `PROXY_POOL_URL` (optional)
- `ANTICAPTCHA_API_KEY` / `TWOCAPTCHA_API_KEY` (optional)
- `VERCEL` cron config for weekly scan

------

## **Security & Compliance**

- Gate **public-records scraping** behind `legalPosture.publicRecordsWherePermitted = true`.
- Store **owner PII** only in Phase 2; implement opt-outs and contact-rate limits later.
- Log per-source ToS acknowledgment in Admin.

------

## **Definition of Done (Acceptance Tests)**

- **Configuration**: Admin can edit and save all sections A–G + **Data Sources** (listing, county GIS, enrichment, distress).
- **Seeds**: Default config and 13 listing sources preloaded as **enabled weekly**.
- **Scan**: Weekly job runs; **On-Demand** completes and writes a `ScanRun` with counts & errors.
- **Ingestion**: At least 2 adapters operational; others stubbed with TODOs.
- **Dedup**: Same parcel across ≥2 sources appears once; portfolio grouping works for multi-APN ranches.
- **Fit Score**: Displays 0–100 and top reasons; changes when weights change.
- **Table**: Sort & filter < 1s for 1k rows.
- **Pipeline**: Drag-drop persists.
- **Auth**: Only Admin/Superuser can access.
- **Health**: Shows last run stats & source errors.

------

## **Build Steps (Claude — generate code & files)**

1. **Scaffold** Next.js (App Router) project with TypeScript, Tailwind, Clerk.
2. **Integrate DB** (Postgres + Prisma). Enable PostGIS and add geom types via SQL migration.
3. **Create Prisma models** for entities listed above.
4. **AdminConfig**: create zod schema shared server/client; build Admin UI with tabs:
   - **Geography & Filters**, **Fit Score**, **Schedules & Notifications**, **Data Sources**, **Compliance**, **Performance & KPIs**.
5. **Seed**: write default AdminConfig JSON and the 13 listing sources.
6. **Adapters**: create `/lib/adapters/<source>.ts` with interface + two working adapters (LandWatch, Hall & Hall).
7. **Jobs**:
   - Weekly scan via Vercel Cron → route handler triggers queue.
   - On-Demand scan API → same runner.
   - Compute features & Fit Score; upsert into Parcel/Listing/Features/FitScore; persist `ScanRun`.
8. **UI**:
   - Results Table with saved column presets & conditional highlight.
   - Parcel/Deal Profile with Fit reasons & lineage.
   - Pipeline Kanban with drag-drop.
   - Admin Health & Sources pages.
9. **Telemetry**: simple metrics (processed, new, updated, duplicates, errors) surfaced in Admin.
10. **README** with local setup, env vars, seed, running jobs, and deployment steps to Vercel.

------

## **Stretch (Fast-Follow 1.1)**

- Map view (Mapbox)
- County Tier scheduler (T1 weekly / T2 bi-weekly / T3 monthly)
- Email notification on scan finish
- CSV owner imports

------

## **Call to Action**

- Generate the project now following this prompt.
- Stop and display: **schema**, **seed config**, and **list of files** to be created before writing all code.
- Then proceed to implement with tests and seed data. 🚀