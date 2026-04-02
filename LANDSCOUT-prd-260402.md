# LandScout 2.0 — Product Requirements Document

**Date:** 2026-04-02
**Author:** Deven Spear (vCAIO, Life Kitchen Studios)
**Status:** Draft — for development planning
**Original Concept:** ThriveMore Land Intelligence MVP (Aug 2025)

---

## 1. Vision & Purpose

**LandScout is a Bloomberg Terminal for rural land acquisition.**

Land investors currently spend 15–30 hours/week manually browsing multiple listing sites, cross-referencing county records, and evaluating parcels in spreadsheets. LandScout automates the entire discovery-to-deal pipeline:

1. **Discover** — Continuously scan 13+ listing portals and broker sites
2. **Deduplicate** — Identify the same parcel listed across multiple sources
3. **Score** — Apply a weighted Fit Score algorithm to rank parcels by investment potential
4. **Enrich** — Layer in soils, hydrology, flood, slope, and utility data from government sources
5. **Visualize** — Display parcels on an interactive map with parcel boundaries
6. **Manage** — Track deals through a Kanban pipeline from discovery to close

### Target Users

| User Type | Need |
|-----------|------|
| **Land investors / funds** | Systematic discovery of 100–1,000 acre opportunities in the Southeast |
| **Land brokers** | Market intelligence and competitive listing monitoring |
| **Family offices** | Recreational / conservation land acquisition |
| **Developers** | Pre-development site identification |

### Target Geography (Default)

Virginia, North Carolina, South Carolina, Georgia, Florida, Alabama — configurable to any US state.

---

## 2. Core Features

### 2.1 Automated Land Discovery Engine

**Priority: P0 (Must Have)**

Continuously crawl 13+ data sources for land listings matching configurable criteria.

| Source | Type | Status |
|--------|------|--------|
| LandWatch | Portal | Adapter built |
| Hall & Hall | Broker | Adapter built |
| Land And Farm | Portal | Needs adapter |
| Lands of America | Portal | Needs adapter |
| Whitetail Properties | Broker | Needs adapter |
| United Country | Broker | Needs adapter |
| LandLeader | Portal | Needs adapter |
| Mason & Morse Ranch | Broker | Needs adapter |
| AFM Real Estate | Broker | Needs adapter |
| Peoples Company | Broker | Needs adapter |
| NAI Land | Broker | Needs adapter |
| Crexi | Portal | Needs adapter |
| LoopNet | Portal | Needs adapter |

**Requirements:**
- Configurable scan frequency per source (daily/weekly/manual)
- Rate limiting per source (default 6 req/min)
- Robots.txt compliance (configurable)
- Proxy rotation support for high-volume crawling
- CAPTCHA handling integration (AntiCaptcha / 2Captcha)
- Error tracking and retry logic per scan run

### 2.2 Smart Deduplication

**Priority: P0**

Identify duplicate parcels listed across multiple sources.

**Matching strategy:**
1. **APN match** — Same Assessor's Parcel Number + County + State = definite match
2. **Geographic clustering** — Parcels within 0.1 miles with similar acreage (±10%) = probable match
3. **Fuzzy title match** — Similar listing titles + same county = possible match (needs human review)

### 2.3 Fit Score Algorithm

**Priority: P0**

Score each parcel 0–100 using a configurable weighted algorithm.

| Dimension | Weight | Data Source |
|-----------|--------|-------------|
| Acreage (target range fit) | 20% | Listing data |
| Land Cover Diversity | 20% | NLCD / satellite |
| Water Presence | 10% | USGS NHD |
| Metro Proximity | 10% | Geocoding |
| Slope / Topography | 10% | USGS elevation |
| Soils Quality | 10% | NRCS Web Soil Survey |
| Road Access | 10% | Listing data + GIS |
| Easement Penalty | 5% | Listing data + county records |
| Utilities Proximity | 5% | Utility company GIS |

**Auto-Fail Conditions:**
- In FEMA floodway → Score = 0
- Wetlands > 50% of parcel → Score = 0

**Admin controls:** All weights, thresholds, and auto-fail conditions are configurable via Admin UI.

### 2.4 Interactive Map View

**Priority: P1 (Should Have for Showcase)**

Display discovered parcels on an interactive map.

**Requirements:**
- Map provider (Mapbox GL JS or MapLibre)
- Color-coded markers by Fit Score (green = high, yellow = medium, red = low)
- Parcel boundary polygons (when available from county GIS)
- Click-to-detail: open property modal from map pin
- Filter overlay: toggle sources, score ranges, acreage ranges
- Satellite/terrain layer toggle

### 2.5 Property Detail View

**Priority: P0**

Comprehensive view of a single parcel with all available data.

**Layout:** Split panel
- **Left:** Property details, Fit Score breakdown, pricing history, ownership info
- **Right:** Map (zoomed to parcel), photo gallery, satellite view

**Data displayed:**
- Basic info: acreage, county, state, APN, address, zoning
- Pricing: listed price, price/acre, price history across sources
- Fit Score: overall score + breakdown by dimension + top 5 reasons
- Features: land cover, water, slope, soils, road access, utilities
- Ownership: owner name, acquisition date, tax status
- Source lineage: which sites list this parcel, when first/last seen
- Deal status: current pipeline stage, activity history

### 2.6 Deal Pipeline (Kanban)

**Priority: P1**

Track parcels through the acquisition pipeline.

**Stages:**
1. **New** — Freshly discovered, not yet reviewed
2. **Qualified** — Meets criteria, worth pursuing
3. **Pursuit** — Active outreach/negotiation
4. **Under Contract** — Deal in progress
5. **Closed** — Acquisition complete
6. **Passed** — Reviewed and declined

**Features:**
- Drag-and-drop between stages
- Activity logging (notes, calls, emails, meetings)
- Priority flags (high/medium/low)
- Next action date + reminder
- Filter by assignee, priority, score range

### 2.7 Saved Searches

**Priority: P2 (Nice to Have)**

Let users save and schedule recurring searches with custom criteria.

**Requirements:**
- Save filter combinations (state, county, acreage range, score threshold, source)
- Schedule: on-demand, daily, weekly
- Email alerts when new parcels match saved search criteria
- Search history and result counts over time

### 2.8 Admin Configuration

**Priority: P0**

Centralized configuration panel for all system settings.

**Config sections (already designed in Zod schema):**
- A) Core Filters & Geography — states, county tiers, metro areas, acreage range, zoning
- B) Hard Filters — slope, wetlands, floodway, utilities
- C) Fit Score — weights, thresholds, auto-fail conditions
- D) Scheduling & Alerts — scan schedule, notification emails
- E) Data Sources — enable/disable sources, rate limits, crawl frequency
- F) ETL & Compliance — proxy, CAPTCHA, concurrency, retries
- G) Performance & Ops — targets for map load, search speed, uptime

### 2.9 System Health Dashboard

**Priority: P1**

Monitor scanning operations and system performance.

**Displays:**
- Latest scan run: status, duration, parcels found, errors
- Per-source statistics: listings found, success rate, last crawl time
- Database counts: total parcels, listings, deals, active sources
- Error log with details

---

## 3. Data Enrichment Layer

### 3.1 Government Data Sources (P1)

| Source | Data | API |
|--------|------|-----|
| NRCS Web Soil Survey | Soil quality ratings | REST API (free) |
| USGS National Hydrography Dataset | Rivers, streams, lakes, watersheds | REST API (free) |
| FEMA NFHL | Flood zones, floodways | REST API (free) |
| USGS 3DEP | Elevation, slope | REST API (free) |
| NLCD (National Land Cover Database) | Land cover classification | WMS/WCS (free) |
| US Census / TIGER | County boundaries, roads | REST API (free) |

### 3.2 County GIS / Assessor Data (P2)

- ArcGIS-based county assessor portals
- Parcel boundaries, ownership records, tax assessments
- Highly variable by county — needs per-county adapter

### 3.3 Distress Data (P2)

- Tax delinquency lists (county-specific)
- Foreclosure filings
- Sheriff sale notices

---

## 4. Technical Architecture (v2.0)

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Server Components) |
| Language | TypeScript 5.8+ |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Database | PostgreSQL + PostGIS (Neon via Vercel Marketplace) |
| ORM | Prisma 6 |
| Auth | Clerk v7 |
| Maps | Mapbox GL JS or MapLibre GL |
| Scraping | Cheerio + Playwright (adapter pattern) |
| Jobs | Vercel Cron + Vercel Functions |
| Hosting | Vercel |
| Storage | Vercel Blob (parcel photos, documents) |

---

## 5. Showcase MVP Scope (Tomorrow Morning)

For the demo showcase, the following must be functional:

| Feature | Scope |
|---------|-------|
| Dashboard | Real stats from seeded data — total parcels, fit score distribution, source breakdown |
| Results Table | Connected to DB, sortable by fit score/acreage/price, click to detail |
| Property Detail | Full split-panel with fit score breakdown and map stub |
| Map View | Basic Mapbox/MapLibre with parcel pins, color-coded by fit score |
| Pipeline | Working Kanban with drag-and-drop, seeded deals |
| Admin | Config viewer (read-only for demo is fine) |
| Data | 50–100 seeded parcels with realistic SE US data and fit scores |

**NOT required for showcase:**
- Live scraping (use seeded data)
- Enrichment API integration
- Email notifications
- Authentication (can demo without login gate)
- Saved searches

---

## 6. Success Metrics

| Metric | Target |
|--------|--------|
| Parcels discovered per scan | 25+ per source |
| Deduplication accuracy | >95% true matches |
| Fit Score correlation with outcomes | Validated by user feedback |
| Dashboard load time | <2 seconds |
| Search response time | <1 second |
| Source adapter coverage | 13 sources by v2.1 |
| Deal pipeline adoption | Users actively tracking parcels |

---

## 7. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Web scraping blocked by source sites | Loss of discovery coverage | Proxy rotation, CAPTCHA solving, adapter diversity |
| County GIS data inconsistency | Incomplete enrichment | Graceful degradation, show "data unavailable" |
| PostGIS complexity | Development slowdown | Start with simple lat/lon, add PostGIS features incrementally |
| Stale listing data | Bad user experience | Track listing freshness, flag stale listings |
| Legal/compliance risk from scraping | TOS violations | Configurable robots.txt compliance, rate limiting |

---

## 8. Phases

| Phase | Scope | Timeline |
|-------|-------|----------|
| **2.0 Showcase** | Seeded demo with dashboard, results, map, pipeline | Tonight (2026-04-02) |
| **2.1 Live Data** | Activate 5+ source adapters, real scanning | Week 2 |
| **2.2 Enrichment** | NRCS, USGS, FEMA API integration | Week 3 |
| **2.3 Map & GIS** | Full Mapbox integration, parcel boundaries | Week 4 |
| **2.4 Production** | Auth, saved searches, email alerts, multi-user | Week 5-6 |
