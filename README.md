# LandScout 2.0 — Land Intelligence Platform

Automated land discovery, scoring, and deal pipeline management for rural land investors targeting 100–1,000 acre parcels across the Southeast US.

## Features

- **Automated Discovery** — Crawls 13+ listing portals and broker sites
- **Fit Score Engine** — Weighted 0-100 scoring across 9 dimensions (acreage, land cover, water, metro proximity, slope, soils, roads, easements, utilities)
- **Interactive Map** — MapLibre GL with color-coded parcel pins
- **Deal Pipeline** — Kanban board with drag-and-drop stage management
- **Admin Dashboard** — System health, scan history, configuration viewer

## Tech Stack

- **Framework:** Next.js 15 (App Router, React 19)
- **Database:** Prisma 6 + SQLite (local) / PostgreSQL (production)
- **Styling:** Tailwind CSS 3.4
- **Maps:** MapLibre GL JS (free, no API key required)
- **Hosting:** Vercel

## Quick Start

```bash
pnpm install
cp .env.example .env
pnpm exec prisma db push
pnpm db:seed
pnpm dev
```

Visit http://localhost:3000

## Project Structure

```
app/
├── (dashboard)/          # Protected dashboard routes
│   ├── dashboard/        # Stats overview
│   ├── results/          # Property search & table
│   ├── map/              # Interactive map view
│   ├── pipeline/         # Deal pipeline (Kanban)
│   └── admin/            # System health & config
├── api/                  # REST API endpoints
│   ├── search/           # Property search with filters
│   ├── parcels/[id]/     # Parcel details
│   ├── deals/            # Deal management
│   ├── admin/health/     # System health
│   └── stats/            # Dashboard statistics
lib/
├── fit-score.ts          # Scoring algorithm (9 dimensions)
├── admin-config.ts       # Zod-validated configuration
├── types.ts              # Shared TypeScript types
├── prisma.ts             # Database client
└── utils.ts              # Utilities
```

## Data Sources (13 Configured)

| Source | Type | Status |
|--------|------|--------|
| LandWatch | Portal | Adapter ready |
| Hall & Hall | Broker | Adapter ready |
| Land And Farm | Portal | Planned |
| Lands of America | Portal | Planned |
| Whitetail Properties | Broker | Planned |
| United Country | Broker | Planned |
| LandLeader | Portal | Planned |
| Mason & Morse Ranch | Broker | Planned |
| AFM Real Estate | Broker | Planned |
| Peoples Company | Broker | Planned |
| NAI Land | Broker | Planned |
| Crexi | Portal | Planned |
| LoopNet | Portal | Planned |

## License

Internal project — All rights reserved.
Life Kitchen Studios
