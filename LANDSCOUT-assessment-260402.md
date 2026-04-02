# LandScout 1.0 — Current State Assessment

**Date:** 2026-04-02
**Repo:** github.com/devenspear/landscout_1
**Vercel:** landscout-1.vercel.app
**Version:** 0.1.0 (August 2025 — ~8 months dormant)
**Original Client:** ThriveMore

---

## What Is LandScout?

LandScout is an **automated land discovery and deal pipeline platform** targeting rural/recreational land investors. It was built as an MVP for ThriveMore to:

1. **Crawl** 13+ land listing portals and broker sites for 100–1,000 acre parcels in the Southeast US (VA, NC, SC, GA, FL, AL)
2. **Deduplicate** parcels across sources using APN + fuzzy geographic clustering
3. **Score** each parcel with a weighted "Fit Score" algorithm (0–100, inspired by Bundoran Farm's methodology)
4. **Manage deals** through a Kanban pipeline (New → Qualified → Pursuit → Closed)
5. **Enrich** parcels with soils, hydrology, flood, and utility data from government APIs

The vision: **a Bloomberg Terminal for rural land acquisition** — scan the entire SE market, surface the best-fit parcels, and manage the deal lifecycle in one place.

---

## Architecture Quality: SOLID

The architecture is well-designed for an MVP:

| Layer | Implementation | Quality |
|-------|---------------|---------|
| **Data Model** | Prisma ORM, 15 models, PostGIS-ready | Excellent — comprehensive schema covering parcels, listings, ownership, features, deals, activities, saved searches |
| **Adapter Pattern** | `CrawlerAdapter` interface with registry | Excellent — clean plugin architecture, easy to add sources |
| **Scoring Engine** | Weighted algorithm with auto-fail conditions | Excellent — sophisticated fit score with 9 dimensions, Shannon diversity index, exponential decay functions |
| **Admin Config** | Zod schema with 7 config sections, typed defaults | Excellent — one of the most thorough config systems I've seen in an MVP |
| **UI Components** | Radix UI + Tailwind + iOS-inspired custom controls | Good — polished, dark mode, responsive |
| **API Layer** | Next.js App Router API routes | Good — RESTful, properly structured |
| **Job System** | Scanner class with per-source orchestration | Good — rate limiting, error tracking, Vercel Cron integration |

**Verdict:** The *design* is production-quality. The *implementation* is ~30% complete.

---

## What Works

| Feature | Status | Details |
|---------|--------|---------|
| LandWatch adapter | ✅ Fully implemented | Axios + Cheerio scraping |
| Hall & Hall adapter | ✅ Fully implemented | Two variants (Cheerio + Playwright) |
| Fit Score engine | ✅ Fully implemented | All 9 scoring dimensions coded |
| Admin config schema | ✅ Fully implemented | Complete Zod validation + defaults |
| Prisma schema | ✅ Fully implemented | 15 models, ready for PostgreSQL + PostGIS |
| Scanner job system | ✅ Fully implemented | Orchestrates multi-source scans |
| Dashboard page | ✅ Connected to DB | Real stats from Prisma queries |
| Auth setup (Clerk) | ✅ Configured | Sign-in/sign-up pages, middleware present |
| Dark/light theme | ✅ Working | Theme provider + toggle |
| Navigation | ✅ Working | Desktop sidebar + mobile nav |

## What Doesn't Work

| Feature | Status | Details |
|---------|--------|---------|
| 11 data source adapters | ❌ Stubs only | Return empty arrays with "TODO" log |
| Results page | ❌ Sample data only | Hardcoded mock data, not connected to DB |
| Pipeline page | ❌ Sample data only | Hardcoded mock data, not connected to DB |
| Map visualization | ❌ Not started | Placeholder in property modal, no Mapbox |
| Enrichment APIs | ❌ Not connected | Schema supports NRCS/USGS/FEMA but no integration |
| County GIS | ❌ Not connected | Config schema exists, no implementation |
| Email notifications | ❌ Not implemented | Schema supports it, no email service |
| Auth enforcement | ⚠️ Bypassed | Middleware exists but allows all routes |
| Property detail modal | ⚠️ Partial | Left panel works, right panel (map/photos) is placeholder |
| Saved searches | ⚠️ UI only | Form exists but not connected to backend |

---

## Technology Stack Age

| Package | Current in Repo | Latest Available | Gap |
|---------|----------------|-----------------|-----|
| Next.js | 14.2.5 | 16.x | **2 major versions behind** |
| React | 18.3.1 | 19.x | 1 major version behind |
| Prisma | 5.18.0 | 6.x | 1 major version behind |
| Clerk | 5.3.0 | 7.x+ | Multiple versions behind |
| Tailwind CSS | 3.4.7 | 4.x | 1 major version behind |
| TypeScript | 5.5.4 | 5.8+ | Minor version behind |
| Node.js target | 18+ | 24 LTS | Outdated |

---

## Rebuild vs. Update Decision

### Recommendation: **REBUILD** (fresh Next.js 16 project, port business logic)

**Why not just update?**

1. **Next.js 14 → 16 is a significant migration** — App Router patterns have evolved, middleware → proxy.ts, new caching model (Cache Components), React 19 Server Components changes
2. **Every major dependency needs upgrading** — Clerk, Prisma, Tailwind, React all have breaking changes
3. **UI pages aren't connected anyway** — Results and Pipeline pages use sample data, so there's nothing to preserve in the view layer
4. **The things worth keeping are portable:**
   - `fit-score.ts` — pure function, framework-agnostic
   - `admin-config-schema.ts` — Zod schema, framework-agnostic
   - `prisma/schema.prisma` — database model, framework-agnostic
   - `lib/adapters/` — adapter pattern + 2 working adapters
   - `lib/jobs/scanner.ts` — orchestration logic

**Estimated effort:** Starting fresh with modern Next.js 16 + porting the business logic will be faster than debugging upgrade migrations across 6+ major dependency bumps on code that's mostly non-functional anyway.

**For tomorrow's showcase:** A fresh build with a polished demo flow (dashboard → results → property detail → pipeline) using real-looking seeded data and the working LandWatch adapter will be far more impressive than a patched-up v0.1.

---

## Key Business Logic to Preserve

1. **Fit Score Algorithm** (`lib/fit-score.ts`) — 276 lines of sophisticated scoring
2. **Admin Config Schema** (`lib/admin-config-schema.ts`) — 394 lines of Zod validation + defaults
3. **Prisma Data Model** (`prisma/schema.prisma`) — 15 models, well-designed
4. **Adapter Interface** (`lib/adapters/types.ts`) — clean plugin pattern
5. **LandWatch Adapter** (`lib/adapters/landwatch.ts`) — working scraper
6. **Hall & Hall Adapter** (`lib/adapters/hallhall.ts`) — working scraper
7. **Scanner Job** (`lib/jobs/scanner.ts`) — orchestration engine
