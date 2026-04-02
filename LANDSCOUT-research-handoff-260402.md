# LandScout 2.0 — Research Handoff for CoWork

**Date:** 2026-04-02
**From:** Claude Code (Mac Studio)
**To:** CoWork (MacBook Air M5) — autonomous research session
**Project:** LandScout — Automated Land Discovery Platform
**Context:** Rebuilding as v2.0 on Next.js 16. Need third-party data source research to inform adapter development and API integration.

---

## Instructions for CoWork

This document contains **13 research areas** that need investigation. For each area, answer the specific questions listed. Use web search, official documentation, and API explorers. Organize your findings in a structured format so they can be directly incorporated into development.

**Output format:** For each research area, create a section with:
1. **Summary** — 2-3 sentence overview
2. **API Details** — endpoint URLs, auth method, rate limits, data format
3. **Implementation Notes** — gotchas, limitations, recommended approach
4. **Cost** — free tier limits, paid pricing if applicable
5. **Links** — official docs, API reference, example responses

Save your complete research to: `LANDSCOUT-research-results-260402.md` in the same directory as this file.

---

## AREA 1: LandWatch Scraping Stability

**What we have:** A working Cheerio-based adapter that scrapes landwatch.com
**Research needed:**
- Does LandWatch have an official API or data feed? (Check for partner/affiliate programs)
- What anti-bot protections does LandWatch currently use? (Cloudflare, reCAPTCHA, etc.)
- Does LandWatch offer RSS feeds for new listings?
- What is their robots.txt policy? (Check https://www.landwatch.com/robots.txt)
- Are there any LandWatch data aggregation services that provide cleaner access?

---

## AREA 2: Land And Farm / Lands of America API Access

**Context:** These are major land listing portals. Land And Farm and Lands of America are both owned by CoStar Group (same parent as LoopNet).
**Research needed:**
- Do these sites offer official APIs for listing data?
- What is their relationship to each other? (shared listings? same database?)
- What anti-scraping measures do they employ?
- Check robots.txt for both sites
- Are there data partnerships or syndication feeds available?
- What is CoStar Group's stance on third-party data access?

---

## AREA 3: Broker Site Adapter Feasibility

**Sites to research (check each for):**
1. **Whitetail Properties** (whitetailproperties.com) — hunting/recreational land broker
2. **United Country** (unitedcountry.com) — rural real estate network
3. **LandLeader** (landleader.com) — broker network
4. **Mason & Morse Ranch** (ranchland.com) — ranch/agricultural broker
5. **AFM Real Estate** (afmrealestate.com) — agricultural/farm broker
6. **Peoples Company** (peoplescompany.com) — farmland broker
7. **NAI Global** (nai-global.com) — commercial/land broker

**For each site, determine:**
- Does the site have a public API or data feed?
- What is the site's technology stack? (React SPA? Server-rendered? Static?)
- Does the site use client-side rendering that requires JavaScript execution (i.e., need Playwright vs. Cheerio)?
- What pagination method is used? (page numbers, infinite scroll, load-more button?)
- What anti-bot protections are in place?
- What is the URL structure for search results? (can we construct search URLs with parameters?)
- What listing data is available on the search results page vs. requiring a detail page visit?
- Check robots.txt for each site

---

## AREA 4: Crexi and LoopNet Land Listings

**Context:** Crexi and LoopNet are primarily commercial real estate platforms but have land categories.
**Research needed:**
- Does Crexi have a public API? (They may have one for commercial partners)
- Does LoopNet / CoStar offer any data access programs?
- How do you filter for land-only listings on each platform?
- What listing data fields are available (acreage, price, location, zoning)?
- What are the scraping challenges for each? (Both are known to be aggressive with anti-bot)
- Are there Crexi or LoopNet data aggregators that resell listing data?

---

## AREA 5: NRCS Web Soil Survey API

**Context:** Need to enrich parcels with soil quality data for the Fit Score algorithm.
**Research needed:**
- Document the NRCS Soil Data Access API (https://sdmdataaccess.nrcs.usda.gov/)
- What is the exact endpoint for querying soil data by coordinates or polygon?
- What soil quality metrics are available? (soil rating for different uses, drainage class, etc.)
- What is the response format? (JSON, XML, SOAP?)
- Are there rate limits?
- How do you convert a lat/lon point to the relevant soil map unit?
- Is there a simpler REST API wrapper, or must we use the SOAP-based SDM API?
- Example query: "Get soil quality rating for a 500-acre parcel at lat 35.5, lon -80.3"

---

## AREA 6: USGS National Hydrography Dataset (NHD)

**Context:** Need water presence and proximity data for Fit Score.
**Research needed:**
- What is the API endpoint for querying water features near a coordinate?
- Can we query by bounding box for all water features within a parcel?
- What feature types are available? (streams, rivers, lakes, ponds, springs, wetlands)
- What is the response format and typical response size?
- Rate limits and authentication requirements?
- Is there a better alternative (e.g., NHDPlus HR, WBD, or a consolidated service)?
- Example query: "Find all water features within 1 mile of lat 35.5, lon -80.3"

---

## AREA 7: FEMA Flood Map Data (NFHL)

**Context:** Need flood zone data for Fit Score auto-fail condition (floodway = score 0).
**Research needed:**
- What is the FEMA NFHL API endpoint?
- Can we query flood zone by coordinates?
- What flood zone designations are returned? (Zone A, AE, V, X, floodway, etc.)
- Is this the same as the FEMA Map Service Center API?
- What is the response format?
- Rate limits?
- Is there an ArcGIS REST service that's easier to query?
- Example query: "Is lat 35.5, lon -80.3 in a flood zone? If so, which zone?"

---

## AREA 8: USGS 3DEP Elevation / Slope Data

**Context:** Need slope/topography data for Fit Score.
**Research needed:**
- What is the USGS Elevation Point Query Service endpoint?
- Can we query elevation for multiple points (to calculate slope across a parcel)?
- Is there a slope calculation service, or do we need to compute slope from elevation points?
- What resolution is available? (1/3 arc-second = ~10m?)
- Rate limits?
- Alternative: Is there a pre-computed slope layer we can query?
- Example query: "Get elevation and slope statistics for a bounding box around a 500-acre parcel"

---

## AREA 9: National Land Cover Database (NLCD)

**Context:** Need land cover classification for the land cover diversity score (Shannon diversity index).
**Research needed:**
- How do we query NLCD data for a specific area?
- Is there a REST API, or do we need to use WMS/WCS?
- What land cover classes are available? (forest, pasture, cropland, developed, water, wetland, etc.)
- Can we get a breakdown of land cover percentages for a polygon?
- What is the data resolution? (30m?)
- What year is the latest available data?
- Is there a simpler service that returns land cover summary statistics?

---

## AREA 10: Mapping Libraries Comparison

**Context:** Need an interactive map for parcel visualization with pins, polygons, and satellite imagery.
**Research needed:**
- **Mapbox GL JS**: Current pricing model (free tier limits), React wrapper options, satellite imagery quality
- **MapLibre GL**: Is it a viable free alternative to Mapbox? Feature parity? Tile source options?
- **Google Maps Platform**: Pricing for Maps JavaScript API, satellite imagery, any advantages for parcel data?
- **Leaflet**: Still viable? Performance with 1000+ markers?
- For each, answer: Can it render GeoJSON parcel boundaries? Satellite view? Terrain view? Custom color-coded markers?
- What's the best option for a Next.js 16 project that needs to display ~1000 parcels with boundaries?
- Are there pre-built React map components (e.g., react-map-gl, @vis.gl/react-google-maps)?

---

## AREA 11: County GIS / Assessor Data Access

**Context:** County assessor data provides ownership, tax assessment, parcel boundaries, and APN — but every county has a different system.
**Research needed:**
- For the target states (VA, NC, SC, GA, FL, AL), what are the most common GIS platforms used by county assessors?
- Are there any **aggregated** county data providers? (e.g., services that normalize county assessor data)
  - Check: Regrid (formerly Loveland), CoreLogic, ATTOM Data, LightBox
- What does Regrid offer? Pricing? API access? Coverage?
- What does ATTOM Data offer for parcel/ownership data?
- Is there a free/open-source county parcel boundary dataset?
- For the largest counties in target states, can we get sample ArcGIS REST endpoints?

---

## AREA 12: Proxy and Anti-Bot Services

**Context:** Web scraping 13 sites at scale requires IP rotation and potentially CAPTCHA solving.
**Research needed:**
- **Residential proxy providers**: Compare Bright Data, Oxylabs, SmartProxy, IPRoyal
  - Pricing per GB, residential vs. datacenter, geo-targeting options
- **Scraping APIs** (alternative to raw proxies): Compare ScraperAPI, Zyte (formerly Scrapy Cloud), Apify
  - Do any of these have pre-built real estate listing scrapers?
- **CAPTCHA solving**: Compare AntiCaptcha, 2Captcha, CapSolver
  - Pricing per solve, supported CAPTCHA types, average solve time
- **Playwright cloud services**: Compare Browserless, Playwright-as-a-Service options
  - For sites that require full JS rendering
- What's the most cost-effective stack for scraping ~13 sites weekly at 100-500 listings per source?

---

## AREA 13: Real Estate Data APIs (Alternatives to Scraping)

**Context:** If official APIs or data feeds exist, they're preferable to scraping.
**Research needed:**
- **RealtyMole / RealtyAPI**: Do they cover rural/land listings? Pricing?
- **Zillow API (Bridge Interactive)**: Does it cover land? Access requirements?
- **Realtor.com API**: Land listing coverage?
- **SimplyRETS**: Coverage and pricing?
- **RESO (Real Estate Standards Organization)**: What is RESO Web API? Do any land listing sites implement it?
- **MLS Integration**: Is there a way to access land listings via MLS feeds? What are the requirements?
- **DataTree (by First American)**: Parcel and ownership data API — pricing and coverage?
- Are there any specialized **land-only** data APIs that aggregate multiple listing sources?

---

## Priority Order

If time is limited, research in this order:

1. **Area 10** (Mapping) — needed for tonight's showcase build
2. **Area 5** (NRCS Soils) — highest-value enrichment
3. **Area 7** (FEMA Flood) — powers auto-fail condition
4. **Area 13** (Real Estate APIs) — could replace scraping entirely
5. **Area 11** (County GIS) — parcel boundaries
6. **Area 6** (USGS Water) — enrichment
7. **Area 8** (Elevation/Slope) — enrichment
8. **Area 9** (Land Cover) — enrichment
9. **Area 3** (Broker Sites) — adapter development
10. **Area 12** (Proxy Services) — scraping infrastructure
11. **Area 1** (LandWatch) — existing adapter stability
12. **Area 2** (Land And Farm) — CoStar ecosystem
13. **Area 4** (Crexi/LoopNet) — commercial platforms, hardest to scrape

---

## Delivery

Save completed research to:
```
/Users/devenspear/VibeCodingProjects/landscout_1/LANDSCOUT-research-results-260402.md
```

If any area requires hands-on API testing (e.g., making test requests), document the exact curl commands so Claude Code can execute them during the build phase.
