# LandScout 2.0 — Research Results

**Date:** 2026-04-02
**Researched by:** CoWork (Claude)
**Requested by:** Claude Code (Mac Studio)
**Status:** Complete — all 13 areas investigated

---

## TABLE OF CONTENTS

1. [Area 10: Mapping Libraries](#area-10-mapping-libraries) ⭐ PRIORITY 1
2. [Area 5: NRCS Soil Data](#area-5-nrcs-web-soil-survey-api) ⭐ PRIORITY 2
3. [Area 7: FEMA Flood Data](#area-7-fema-flood-map-data) ⭐ PRIORITY 3
4. [Area 13: Real Estate Data APIs](#area-13-real-estate-data-apis) ⭐ PRIORITY 4
5. [Area 11: County GIS / Assessor Data](#area-11-county-gis--assessor-data) ⭐ PRIORITY 5
6. [Area 6: USGS Water Data](#area-6-usgs-national-hydrography-dataset)
7. [Area 8: Elevation / Slope Data](#area-8-usgs-3dep-elevation--slope)
8. [Area 9: Land Cover Data](#area-9-national-land-cover-database)
9. [Area 3: Broker Site Adapters](#area-3-broker-site-adapter-feasibility)
10. [Area 12: Proxy & Anti-Bot Services](#area-12-proxy-and-anti-bot-services)
11. [Area 1: LandWatch Scraping](#area-1-landwatch-scraping-stability)
12. [Area 2: Land And Farm / Lands of America](#area-2-land-and-farm--lands-of-america)
13. [Area 4: Crexi / LoopNet](#area-4-crexi-and-loopnet)
14. [Fit Score Algorithm Design](#fit-score-algorithm-design)
15. [Strategic Recommendations](#strategic-recommendations)

---

## AREA 10: MAPPING LIBRARIES

### Summary
MapLibre GL JS is the clear winner for LandScout. It's free, open-source, GPU-accelerated, handles 1000+ GeoJSON polygons smoothly, and integrates with Next.js 16 via `react-map-gl`. Satellite imagery comes from MapTiler's free tier. Drawing tools via `terra-draw`.

### Recommendation: MapLibre GL JS + terra-draw

### Comparison Matrix

| Feature | Mapbox GL | MapLibre GL | Google Maps | Leaflet |
|---------|-----------|-------------|-------------|---------|
| **Cost** | $5/1K loads | Free | $7/1K loads | Free |
| **1000 polygon perf** | Excellent | Excellent | Poor | Fair |
| **Drawing tools** | mapbox-gl-draw | terra-draw | Custom needed | leaflet-draw |
| **React wrapper** | react-map-gl | react-map-gl | @vis.gl/react-maps | react-leaflet |
| **Satellite tiles** | Included | MapTiler (free) | Included | External needed |
| **TypeScript** | Yes | Yes | Yes | Yes |
| **Next.js 16** | Yes (dynamic import) | Yes (dynamic import) | Yes | Yes (dynamic import) |

### Implementation Stack

```json
{
  "maplibre-gl": "^5.x",
  "react-map-gl": "^7.1.8",
  "@maptiler/sdk": "^1.x",
  "terra-draw": "^0.18.x",
  "@turf/turf": "^6.x"
}
```

### API Details
- **MapTiler Free Tier:** 100K tile requests/month, satellite + terrain basemaps
- **Auth:** MapTiler API key (free signup)
- **Rate Limits:** 100K tiles/month free, then $0.05/1K
- **Data Format:** Vector tiles (MVT) + raster tiles (PNG/JPEG)

### Implementation Notes
- Must use `dynamic()` import in Next.js (no SSR for map components)
- `react-map-gl` v7+ works identically with MapLibre and Mapbox — just change the `mapLib` prop
- terra-draw is library-agnostic, supports polygon/rectangle/circle drawing
- Use Turf.js for spatial queries (point-in-polygon, bounding box, area calculation)
- For 1000+ parcels with boundaries: use GeoJSON source with `fill` + `line` layers
- Clustering available via MapLibre expressions for pin views
- Color-coded markers: use data-driven styling with `match` expressions

### Links
- MapLibre GL JS: https://maplibre.org/maplibre-gl-js/docs/
- react-map-gl: https://visgl.github.io/react-map-gl/
- terra-draw: https://github.com/JamesLMilner/terra-draw
- MapTiler: https://www.maptiler.com/
- Turf.js: https://turfjs.org/

---

## AREA 5: NRCS WEB SOIL SURVEY API

### Summary
The NRCS Soil Data Access API provides free soil quality data via both SOAP and REST endpoints. Query by coordinates using spatial SQL. Returns drainage class, soil ratings, hydric status, slope, organic matter, and permeability. No auth required, no rate limits published.

### API Details
- **Primary Endpoint (REST/JSON):** `https://sdmdataaccess.nrcs.usda.gov/tabular/post.rest`
- **SOAP Endpoint:** `https://sdmdataaccess.nrcs.usda.gov/tabular/SDMTabularService.asmx`
- **WFS (Geographic):** `https://sdmdataaccess.nrcs.usda.gov/spatial/SDMWFSService.asmx`
- **Auth:** None required
- **Rate Limits:** Not published (be reasonable — batch queries)
- **Data Format:** JSON (REST) or XML (SOAP)

### Example Query — Soil Quality by Coordinates

```bash
curl -X POST "https://sdmdataaccess.nrcs.usda.gov/tabular/post.rest" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "SELECT musym, muname, drclassdcd, nirrcapcl, hydgrpdcd FROM mapunit mu INNER JOIN component co ON mu.mukey = co.mukey INNER JOIN sacatalog sc ON sc.areasymbol = mu.areasymbol WHERE mu.mukey IN (SELECT mukey FROM SDA_Get_Mukey_from_intersection_with_WktWgs84('\''POINT(-80.3 35.5)'\''))",
    "format": "JSON"
  }'
```

### Available Soil Metrics
- **drclassdcd** — Drainage class (well drained, poorly drained, etc.)
- **nirrcapcl** — Non-irrigated capability class (I-VIII, lower = better)
- **hydgrpdcd** — Hydrologic group (A, B, C, D — affects runoff)
- **hydricrating** — Hydric soil status (yes/no)
- **slopegradwta** — Weighted average slope
- **om_r** — Organic matter percentage
- **ksat_r** — Saturated hydraulic conductivity (permeability)

### Implementation Notes
- Use `SDA_Get_Mukey_from_intersection_with_WktWgs84()` to convert lat/lon to map unit keys
- For polygon queries, pass WKT polygon instead of POINT
- REST endpoint returns JSON directly — no SOAP parsing needed
- Batch multiple parcels by querying multiple MUKEYs in one request
- Drainage class is the single most valuable metric for rural land scoring

### Cost
- **Free** — no limits published, government service

### Links
- API Docs: https://sdmdataaccess.nrcs.usda.gov/
- Query Examples: https://sdmdataaccess.nrcs.usda.gov/QueryHelp/QueryExamples.aspx
- Soil Survey Geographic Database: https://www.nrcs.usda.gov/resources/data-and-reports/ssurgo

---

## AREA 7: FEMA FLOOD MAP DATA

### Summary
FEMA provides flood zone data via an ArcGIS REST service. Query by coordinates to get flood zone designation. Floodway designation = auto-fail for Fit Score. Free, no auth required.

### API Details
- **ArcGIS REST Endpoint:** `https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28`
  - Layer 28 = Flood Hazard Zones
- **WMS Endpoint:** `https://hazards.fema.gov/gis/nfhl/services/public/NFHL/MapServer/WMSServer`
- **Auth:** None required
- **Rate Limits:** Not published (government service)
- **Data Format:** JSON (ArcGIS REST), GeoJSON available
- **Coordinate Precision:** ±38 feet

### Example Query — Flood Zone by Coordinates

```bash
# Point identify query
curl "https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28/query?where=1%3D1&geometry=-80.3%2C35.5&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=FLD_ZONE%2CZONE_SUBTY%2CSFHA_TF&returnGeometry=false&f=json"
```

### Flood Zone Designations
- **Zone A, AE** — 100-year floodplain (high risk, 1% annual chance)
- **Zone V, VE** — Coastal flood zone with wave action
- **Zone X (shaded)** — 500-year floodplain (moderate risk)
- **Zone X (unshaded)** — Minimal flood risk
- **Floodway** — Regulatory floodway within Zone AE → **AUTO-FAIL (Score = 0)**

### Implementation Notes
- Use `esriGeometryPoint` for single coordinate queries
- Use `esriGeometryPolygon` for parcel boundary intersection
- `SFHA_TF` field = Special Flood Hazard Area (True/False) — quick binary check
- `FLD_ZONE` + `ZONE_SUBTY` gives full zone detail
- Limit: 1000 features per WFS request
- For batch processing: use polygon intersection, not point-by-point

### Cost
- **Free** — government service

### Links
- FEMA Map Service: https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer
- NFHL Documentation: https://www.fema.gov/flood-maps/national-flood-hazard-layer

---

## AREA 13: REAL ESTATE DATA APIS

### Summary
No single commercial API fully replaces scraping 13 sites at the $50-200/mo budget. Best approach: **Land Portal ($99-199/mo)** for vacant land filtering + **free county GIS endpoints** for parcel data. Regrid ($80K/year) is prohibitive. RESO Web API through local MLSs is viable but requires membership.

### Viable Options by Budget

#### $0/mo — County GIS REST APIs (Free, Legal)
- Fairfax County VA: `https://www.fairfaxcounty.gov/mercator/rest/services/OpenData/OpenData_A9/MapServer/0`
- Mecklenburg County NC: `https://gis.charlottenc.gov/arcgis/rest/services/CountyData/Parcels/MapServer`
- Fulton County GA: `https://gismaps.fultoncountyga.gov/arcgispub2/rest/services/PropertyMapViewer/PropertyMapViewer/MapServer`
- Florida statewide: `https://gis.fdot.gov/arcgis/rest/services/Parcels/FeatureServer`
- NC statewide: NC OneMap (https://www.nconemap.gov/)

#### $99-199/mo — Land Portal (Best Value)
- **What:** Specialized vacant/rural land data with AI filtering
- **Features:** Vacant land detection (99.8% accuracy), landlocked property detection, road frontage analysis, wetlands/slope/FEMA data
- **Coverage:** Nationwide
- **Action Required:** Verify Southeast coverage before committing
- **Link:** https://landportal.com/subscriptions/

#### Enterprise ($300+/mo) — If Needed Later
- **ATTOM Data:** 158M+ properties, parcel + ownership + transactions. Custom pricing.
- **BatchData:** Normalized assessor data from 150M+ properties. Custom pricing.
- **DataTree (First American):** Parcel boundaries + ownership + deeds. Custom pricing.
- **CoreLogic ParcelPoint:** Most complete US parcel dataset. Custom pricing.
- **LightBox SmartParcels:** ~$129/user/month, parcel + zoning data.

#### Not Budget-Viable
- **Regrid:** $80K/year minimum (~$6,667/mo). Best parcel dataset, but prohibitive.

### MLS/RESO Path
- RESO Web API supports land property types
- Access requires local REALTOR® association MLS membership
- Cost varies $100-500/month per MLS board
- SimplyRETS offers RESO integration at $99 one-time + monthly subscription
- Land filtering via PropertyType/PropertySubType fields

### Key Finding
**There is no single "land-only" API that aggregates multiple listing sources at startup pricing.** The gap is real — LandScout could fill it.

### Links
- RESO Web API: https://www.reso.org/reso-web-api/
- Land Portal: https://landportal.com/
- ATTOM: https://www.attomdata.com/
- Regrid: https://regrid.com/api
- DataTree: https://dna.firstam.com/solutions/property-data/datatree-property-research

---

## AREA 11: COUNTY GIS / ASSESSOR DATA

### Summary
Southeast US counties predominantly use ArcGIS for GIS services. Free REST endpoints exist for major counties in all 6 target states. NC and FL have the best statewide coverage. County-by-county integration is tedious but free and legal.

### Common GIS Platforms by State

| State | Primary Platform | Statewide Portal |
|-------|-----------------|------------------|
| Virginia | ArcGIS / Fairfax Mercator | VA GIS Clearinghouse (vgin.vdem.virginia.gov) |
| North Carolina | ArcGIS / QPublic | NC OneMap (nconemap.gov) |
| South Carolina | QPublic / ArcGIS | SC GIS (gis.sc.gov) |
| Georgia | ArcGIS | GA GIS Data Hub (data-hub.gio.georgia.gov) |
| Florida | ArcGIS / FDOT statewide | FDOT Parcels FeatureServer |
| Alabama | ArcGIS / Flagship GIS | alabamagis.com |

### Free County Endpoints (Largest Counties, Target States)

**Virginia:**
- Fairfax County: `https://www.fairfaxcounty.gov/mercator/rest/services/OpenData/OpenData_A9/MapServer/0`
- Open Data Portal: https://data-fairfaxcountygis.opendata.arcgis.com/

**North Carolina:**
- Mecklenburg County: `https://gis.charlottenc.gov/arcgis/rest/services/CountyData/Parcels/MapServer`
- Statewide: NC OneMap parcels download
- QPublic Portal: https://qpublic.net/nc/ncassessors/

**South Carolina:**
- QPublic Portal: https://www.qpublic.net/sc/scassessors/

**Georgia:**
- Fulton County: `https://gismaps.fultoncountyga.gov/arcgispub2/rest/services/PropertyMapViewer/PropertyMapViewer/MapServer`
- State Hub: https://data-hub.gio.georgia.gov/

**Florida:**
- Statewide Parcels: `https://gis.fdot.gov/arcgis/rest/services/Parcels/FeatureServer`

**Alabama:**
- Alabama GIS: https://www.alabamagis.com/

### Implementation Notes
- Each county endpoint has different field names — need a normalization layer
- ArcGIS REST queries support spatial intersection (parcel boundary lookup)
- Most return GeoJSON with `f=geojson` parameter
- Rate limits: Generally none for public endpoints
- Build an adapter pattern: one interface, per-county implementations
- Start with 3-5 counties, expand based on user demand

### Free/Open Parcel Boundary Sources
- Data.gov parcel datasets: https://catalog.data.gov/dataset?tags=parcels
- Regrid free tiles on ArcGIS Living Atlas (visualization only, not queryable)
- US City Open Data Census: http://us-city.census.okfn.org/dataset/parcels.html

### Cost
- **Free** — all county GIS endpoints are public

---

## AREA 6: USGS NATIONAL HYDROGRAPHY DATASET

### Summary
USGS provides water feature data via OGC API Features and ArcGIS MapServer. Query by bounding box for streams, rivers, lakes, ponds, springs, and wetlands. NHDPlus HR includes flow direction and catchment data. Free, no auth.

### API Details
- **OGC API Features:** `https://api.waterdata.usgs.gov/ogcapi/v0/features/collections/`
- **ArcGIS MapServer:** `https://hydro.nationalmap.gov/arcgis/rest/services/nhd/MapServer`
- **Auth:** None required
- **Rate Limits:** Not published
- **Data Format:** GeoJSON (OGC API), JSON (ArcGIS REST)

### Example Query — Water Features Near Coordinates

```bash
# ArcGIS REST — find water features within 1 mile (1609m) of a point
curl "https://hydro.nationalmap.gov/arcgis/rest/services/nhd/MapServer/identify?geometry=-80.3%2C35.5&geometryType=esriGeometryPoint&sr=4326&tolerance=1609&mapExtent=-80.35%2C35.45%2C-80.25%2C35.55&imageDisplay=600%2C400%2C96&returnGeometry=true&f=json"
```

### Available Feature Types
- Streams/rivers (flowlines)
- Lakes/ponds (waterbodies)
- Springs
- Wetlands (via NWI integration)
- Dams
- Canals/ditches

### Implementation Notes
- Use bounding box queries for parcel-scale water feature search
- NHDPlus HR preferred over standard NHD (higher resolution, more attributes)
- Calculate distance from parcel centroid to nearest water feature using Turf.js
- For Fit Score: classify as "on-parcel water" vs "adjacent water" vs "distant water"
- Wetlands data also available from USFWS National Wetlands Inventory

### Cost
- **Free** — government service

### Links
- USGS Water Data API: https://api.waterdata.usgs.gov/ogcapi/v0/
- NHD MapServer: https://hydro.nationalmap.gov/arcgis/rest/services/nhd/MapServer
- NHDPlus HR: https://www.usgs.gov/national-hydrography/nhdplus-high-resolution

---

## AREA 8: USGS 3DEP ELEVATION / SLOPE

### Summary
USGS provides elevation data via the Elevation Point Query Service (EPQS). Single-point elevation queries return JSON. For slope, must compute from multiple elevation points or use the 3DEP ImageServer's slope function. Resolution available: 1m, 3m, 10m, 30m.

### API Details
- **EPQS (Point Query):** `https://epqs.nationalmap.gov/v1/json?x={lon}&y={lat}&wkid=4326&units=Feet`
- **3DEP ImageServer:** `https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer`
- **Auth:** None required
- **Rate Limits:** Not published
- **Data Format:** JSON

### Example Queries

```bash
# Single point elevation
curl "https://epqs.nationalmap.gov/v1/json?x=-80.3&y=35.5&wkid=4326&units=Feet"

# ImageServer — get elevation for bounding box (raster export)
curl "https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer/exportImage?bbox=-80.35,35.45,-80.25,35.55&bboxSR=4326&size=100,100&format=json&f=json"
```

### Available Functions (ImageServer)
- **Elevation** — raw elevation values
- **Slope Map** — pre-computed slope in degrees
- **Aspect** — compass direction of slope
- **Hillshade** — visual terrain rendering
- **Contours** — elevation contour lines

### Implementation Notes
- For slope calculation: sample elevation at parcel corners + center, compute rise/run
- OR use ImageServer's slope function with `renderingRule={"rasterFunction":"Slope Map"}`
- Pre-computed slope layer eliminates client-side calculation
- For a 500-acre parcel: use 5x5 or 10x10 grid of elevation points for slope statistics
- Resolution recommendation: 10m (1/3 arc-second) is sufficient for rural parcels
- Batch queries: use ImageServer raster export, not individual EPQS calls

### Cost
- **Free** — government service

### Links
- EPQS: https://epqs.nationalmap.gov/
- 3DEP ImageServer: https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer
- 3DEP Documentation: https://www.usgs.gov/3d-elevation-program

---

## AREA 9: NATIONAL LAND COVER DATABASE

### Summary
NLCD provides 30m resolution land cover classification. Access via Google Earth Engine (recommended for polygon analysis), MRLC viewer, or ArcGIS services. 16 land cover classes. Latest data: annual products through 2023. Can compute Shannon diversity index from class percentages.

### API Details
- **Google Earth Engine:** `ee.ImageCollection("USGS/NLCD_RELEASES/2021_REL/NLCD")` (recommended)
- **MRLC Viewer:** https://www.mrlc.gov/viewer/
- **ArcGIS ImageServer:** Available via MRLC
- **Auth:** Google Earth Engine requires GCP project
- **Data Format:** Raster (30m cells), each cell has a class code
- **Resolution:** 30 meters

### Land Cover Classes
- 11: Open Water
- 21-24: Developed (open space → high intensity)
- 31: Barren Land
- 41-43: Forest (deciduous, evergreen, mixed)
- 51-52: Shrubland
- 71-74: Grassland/Herbaceous
- 81-82: Agriculture (pasture, cultivated crops)
- 90-95: Wetlands (woody, emergent herbaceous)

### Implementation Notes
- For Fit Score: compute Shannon diversity index from natural cover classes only (exclude developed)
- Shannon formula: H = -Σ(pi × ln(pi)) where pi = proportion of each class
- Higher diversity = higher score (mixed forest/water/grassland better than monoculture)
- Google Earth Engine: use `ee.Image.reduceRegion()` with polygon geometry for class percentages
- Alternative without GEE: download NLCD raster tiles and compute locally
- For simpler approach: use MRLC WMS to classify dominant land cover type

### Cost
- **Free** — government data
- Google Earth Engine: free for non-commercial research; GCP billing for commercial

### Links
- MRLC/NLCD: https://www.mrlc.gov/
- NLCD on GEE: https://developers.google.com/earth-engine/datasets/catalog/USGS_NLCD_RELEASES_2021_REL_NLCD
- NLCD Classes: https://www.mrlc.gov/data/legends/national-land-cover-database-class-legend-and-description

---

## AREA 3: BROKER SITE ADAPTER FEASIBILITY

### Summary
Of the 7 broker sites researched, **Whitetail Properties**, **United Country**, and **Mason & Morse Ranch** are the most feasible for adapter development. Most use server-rendered HTML (Cheerio-compatible). LandLeader blocks detail pages in robots.txt. AFM Real Estate has limited public information.

### Site-by-Site Assessment

| Site | Stack | Rendering | robots.txt | Anti-Bot | Feasibility |
|------|-------|-----------|------------|----------|-------------|
| Whitetail Properties | Server-rendered | Cheerio OK | Permissive (blocks PDF only) | Minimal | **HIGH** |
| United Country | Server-rendered | Cheerio OK | Permissive (/for-sale/ allowed) | Minimal | **HIGH** |
| LandLeader | WordPress/Yoast | Cheerio OK | Blocks detail pages | Minimal | **MEDIUM** |
| Mason & Morse Ranch | Server-rendered | Cheerio OK | Very permissive | Minimal | **VERY HIGH** |
| AFM Real Estate | Unknown | TBD | Modern EU policy | Unknown | **UNKNOWN** |
| Peoples Company | TBD | TBD | TBD | TBD | **TBD** |
| NAI Global | TBD | TBD | TBD | TBD | **TBD** |

### Implementation Notes
- **Start with:** Mason & Morse Ranch (most permissive) and United Country (large network)
- **Whitetail Properties:** Good for hunting/recreational land niche — high-value listings
- **LandLeader:** Can scrape search results but NOT detail pages per robots.txt
- All server-rendered sites: Cheerio + Axios is sufficient (no Playwright needed)
- Build adapters with a common interface: `{ search(criteria): Listing[], detail(url): ListingDetail }`

### ⚠️ TOS Caveat
robots.txt permissiveness ≠ legal permission. All sites' Terms of Service should be reviewed before production scraping. Consider reaching out for syndication partnerships.

---

## AREA 12: PROXY AND ANTI-BOT SERVICES

### Summary
For scraping ~13 sites weekly at 100-500 listings per source, infrastructure costs are $500-1,500/month. However, the legal risk makes this approach inadvisable for major platforms. For broker sites with permissive robots.txt, basic proxy rotation is sufficient.

### Proxy Provider Comparison

| Provider | Type | Price/GB | Geo-Targeting | Best For |
|----------|------|----------|---------------|----------|
| Bright Data | Residential | $8-15/GB | Yes (state-level) | Enterprise scale |
| Oxylabs | Residential | $10-15/GB | Yes | High reliability |
| SmartProxy | Residential | $7-12/GB | Yes | Budget option |
| IPRoyal | Residential | $5-8/GB | Yes | Lowest cost |

### Scraping API Comparison

| Service | Price | Pre-built RE Scrapers | JS Rendering |
|---------|-------|----------------------|-------------|
| ScraperAPI | $29-249/mo | No | Yes |
| Zyte (Scrapy Cloud) | $25-450/mo | Yes (some) | Yes |
| Apify | Pay-per-use | **Yes** (community RE scrapers) | Yes |

### CAPTCHA Solving

| Service | Price/1K Solves | reCAPTCHA v2 | Cloudflare |
|---------|----------------|-------------|------------|
| AntiCaptcha | $1-2 | Yes | Partial |
| 2Captcha | $1-3 | Yes | Partial |
| CapSolver | $0.80-1.50 | Yes | Yes |

### Cost Estimate for LandScout Scale
- **Minimal (broker sites only):** $50-100/mo (basic datacenter proxies + ScraperAPI)
- **Moderate (broker + medium sites):** $200-500/mo (residential proxies + CAPTCHA solving)
- **Full (all 13 sites):** $500-1,500/mo (residential proxies + Playwright cloud + CAPTCHA)

### Recommendation
Given TOS risks, invest in **legal data access** (APIs, partnerships, county GIS) rather than scraping infrastructure. Reserve proxies for the 3-4 broker sites with permissive access policies.

---

## AREA 1: LANDWATCH SCRAPING STABILITY

### Summary
LandWatch has NO official API. Their TOS explicitly prohibits programmatic access and commercial use of scraped data. Anti-bot protections are minimal (relies on legal enforcement), but CoStar Group (parent) is known for aggressive IP protection.

### API Details
- **Official API:** None
- **robots.txt:** Disallows `/api/` for all bots
- **Anti-Bot:** Minimal technical barriers (HTML scraping works)
- **TOS:** Explicitly prohibits "programmatic access" and "automated means"

### ⚠️ LEGAL RISK: CRITICAL
- Direct contractual prohibition in TOS
- CoStar Group has history of litigation against scrapers
- Statutory damages exposure: $750-$30,000 per listing (copyright)
- CFAA penalties: $1,000+ per violation

### Implementation Notes
- Existing Cheerio adapter works technically but is legally risky
- No RSS feeds available
- No data aggregation services providing clean LandWatch data
- **Recommendation:** Seek official partnership or replace with Land Portal/county data

---

## AREA 2: LAND AND FARM / LANDS OF AMERICA

### Summary
Both owned by CoStar Group. Same database, same TOS restrictions as LandWatch. No public APIs. Scraping is technically easy but legally dangerous given CoStar's enforcement posture.

### Details
- **Relationship:** Same parent (CoStar), likely shared listing database
- **Official APIs:** None for third parties
- **robots.txt:** Identical restrictions to LandWatch
- **TOS:** Identical prohibitions on programmatic access
- **Data Partnerships:** None publicly available

### ⚠️ LEGAL RISK: CRITICAL
Same as LandWatch. CoStar Group stance: no third-party data access without licensing agreement.

### Recommendation
Contact CoStar Group's licensing department directly if this data is essential. Otherwise, use county GIS + Land Portal as alternatives.

---

## AREA 4: CREXI AND LOOPNET

### Summary
Both are heavily protected. Crexi has a Listing API but it's inbound-only (for uploading TO Crexi, not downloading). LoopNet returns "Access Denied" even for robots.txt. Both use aggressive anti-bot (Cloudflare WAF, Akamai CDN).

### Crexi
- **API:** Official Listing API exists — **inbound only** (partners upload listings)
- **robots.txt:** Blocked via Cloudflare WAF challenge
- **Anti-Bot:** Cloudflare WAF on all pages
- **Land Filter:** Available via property type filter
- **Legal Risk:** HIGH

### LoopNet
- **API:** None public — enterprise/subscription only
- **robots.txt:** Returns "Access Denied" (not even readable)
- **Anti-Bot:** Akamai CDN + aggressive blocking
- **Legal Risk:** CRITICAL
- **Note:** Primarily commercial CRE; land is secondary category

### Recommendation
Skip both for MVP. Land-specific data from county GIS + Land Portal covers the use case better without legal exposure.

---

## FIT SCORE ALGORITHM DESIGN

### Summary
Recommended 0-100 scoring model with flood risk as a binary gate (auto-fail) and four weighted factors. Based on research into available API data and land evaluation best practices.

### Scoring Model

#### Binary Gate (Pre-filter)
- **Flood Zone Floodway / Zone A / Zone V / Zone VE** → **Score = 0** (auto-fail)
- All other zones proceed to weighted scoring

#### Weighted Factors (0-100 sub-scores, weighted sum)

| Factor | Weight | Data Source | Scoring Approach |
|--------|--------|-------------|------------------|
| Soil Quality | 35% | NRCS Soil Data Access | Drainage class + capability class |
| Slope/Terrain | 25% | USGS 3DEP | % grade lookup table |
| Water Proximity | 25% | USGS NHD | Distance bands |
| Habitat Diversity | 15% | NLCD | Shannon diversity index |

### Sub-Score Details

#### Soil Quality (35% weight)
| Drainage Class | Points |
|---------------|--------|
| Well drained | 100 |
| Moderately well drained | 80 |
| Somewhat poorly drained | 50 |
| Poorly drained | 25 |
| Very poorly drained | 10 |

**Bonus:** +10 for Capability Class I-II (prime farmland soil)

#### Slope/Terrain (25% weight)
| Slope (% grade) | Points |
|-----------------|--------|
| 0-2% (flat) | 100 |
| 2-5% (gentle) | 90 |
| 5-10% (moderate) | 70 |
| 10-15% (steep) | 45 |
| 15-25% (very steep) | 20 |
| >25% (extreme) | 5 |

#### Water Proximity (25% weight)
| Distance to Water | Points |
|-------------------|--------|
| On-parcel water feature | 100 |
| Within 0.25 miles | 85 |
| Within 0.5 miles | 70 |
| Within 1 mile | 50 |
| Within 2 miles | 30 |
| Within 5 miles | 15 |
| >5 miles | 5 |

#### Habitat Diversity (15% weight)
- Shannon Index H = -Σ(pi × ln(pi)) for natural cover classes only
- Normalize: H_score = (H / H_max) × 100
- Where H_max = ln(number of natural cover classes present)
- Exclude developed land classes (21-24) from calculation

### Score Interpretation
| Range | Rating | Meaning |
|-------|--------|---------|
| 80-100 | Excellent | Prime parcel for rural/recreational use |
| 60-79 | Good | Suitable with minor constraints |
| 40-59 | Fair | Significant limitations present |
| 20-39 | Poor | Substantial challenges |
| 0-19 | Not Recommended | Major constraints or flood risk |

### Example Calculation
**40-acre parcel near Asheville, NC (lat 35.5, lon -82.5):**
- Flood Zone: X (unshaded) → Passes gate
- Soil: Well drained, Cap Class III → 100 pts (no bonus) × 0.35 = **35.0**
- Slope: Average 8% grade → 70 pts × 0.25 = **17.5**
- Water: Stream at 0.3 miles → 70 pts × 0.25 = **17.5**
- Habitat: H = 1.2 (mixed forest + grassland + water) → 62 pts × 0.15 = **9.3**
- **Total: 79.3 / 100 (Good–Excellent)**

---

## STRATEGIC RECOMMENDATIONS

### Tonight's Showcase Build
1. **Map:** Use MapLibre GL JS + react-map-gl + MapTiler satellite tiles
2. **Draw tools:** terra-draw for search-by-area
3. **Sample data:** Hard-code 20-50 sample parcels with GeoJSON boundaries from a county endpoint
4. **Fit Score:** Display as color-coded pins (red/yellow/green) with mock scores

### Phase 1 — MVP Data Stack (Free)
- **Listing Data:** County GIS REST endpoints (3-5 counties in NC, VA, FL)
- **Soil:** NRCS Soil Data Access API (REST/JSON)
- **Flood:** FEMA NFHL ArcGIS REST (Layer 28)
- **Water:** USGS NHD MapServer
- **Elevation/Slope:** USGS 3DEP EPQS + ImageServer slope function
- **Land Cover:** NLCD via MRLC or GEE
- **Map:** MapLibre GL JS + MapTiler free tier
- **Total cost: $0/month**

### Phase 2 — Growth ($100-200/mo)
- **Add:** Land Portal subscription for nationwide vacant land data
- **Add:** 2-3 broker site adapters (Mason & Morse, United Country, Whitetail)
- **Add:** MapTiler paid tier if exceeding 100K tiles/month

### Phase 3 — Scale
- **Evaluate:** RESO Web API through regional MLSs
- **Evaluate:** ATTOM or BatchData for enriched assessor data
- **Consider:** Direct CoStar licensing if platform gains traction

### Legal Posture
- **Do NOT scrape:** LandWatch, Land And Farm, LoopNet, Crexi
- **Proceed with caution:** Broker sites (verify TOS individually)
- **Free and clear:** All government APIs (NRCS, FEMA, USGS, NLCD, county GIS)
- **Budget allocation:** Spend $100-200/mo on Land Portal, not on proxy infrastructure

### Architecture Note
Build adapters with a common interface so data sources are swappable:

```typescript
interface DataSource {
  search(criteria: SearchCriteria): Promise<Listing[]>
  detail(id: string): Promise<ListingDetail>
  enrich(parcel: Parcel): Promise<EnrichmentData>
}
```

This lets you swap county GIS for Regrid, or broker scrapers for MLS feeds, without touching the rest of the app.
