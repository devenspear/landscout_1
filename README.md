# ThriveMore Land Intelligence — MVP

A comprehensive land discovery and analysis platform that continuously discovers 100–1,000 acre land opportunities across VA, NC, SC, GA, FL, AL, computes Bundoran-like Fit Scores, and manages a deal pipeline.

## 🎯 Features

- **Automated Land Discovery**: Crawls 13+ listing/broker sources for land opportunities
- **Smart Deduplication**: Identifies duplicate parcels across multiple sources
- **Fit Score Analysis**: Computes 0-100 Bundoran-style scores with detailed reasoning
- **Deal Pipeline**: Kanban-style pipeline management (New → Qualified → Pursuit → Closed)
- **Admin Configuration**: Comprehensive config system for sources, filters, and scoring weights
- **Real-time Health Monitoring**: Track scan runs, errors, and system performance

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Radix UI
- **Authentication**: Clerk (email/OTP with Admin/Superuser roles)
- **Database**: PostgreSQL + PostGIS with Prisma ORM
- **Jobs**: Vercel Cron for weekly scans + on-demand API triggers
- **Hosting**: Vercel
- **Storage**: Supabase Storage compatible

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL with PostGIS extension
- Clerk account (for authentication)

### 1. Environment Setup

Copy the environment template:

```bash
cp .env.local.example .env.local
```

Configure your environment variables:

```env
# Database (PostgreSQL with PostGIS)
DATABASE_URL="postgresql://user:password@localhost:5432/thrive_land_intelligence"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Optional: Crawler Services
PROXY_POOL_URL=http://proxy-service-url
ANTICAPTCHA_API_KEY=your-api-key
```

### 2. Database Setup

Install dependencies and set up the database:

```bash
npm install
npx prisma generate
npx prisma db push
npx prisma db seed
```

### 3. Development

Start the development server:

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 📊 Database Schema

### Core Models

- **AdminConfig**: Centralized configuration for all system settings
- **Source**: Data source definitions (LandWatch, Hall & Hall, etc.)
- **ScanRun**: Job execution tracking with stats and errors
- **Parcel**: Land parcels with geometry and basic info
- **Listing**: Source listings mapped to parcels
- **Features**: Computed parcel features (land cover, slope, utilities)
- **FitScore**: Bundoran-style scores with reasoning
- **Deal**: Pipeline deals with stages and activities
- **SavedSearch**: User-defined searches with scheduling

### PostGIS Integration

The schema includes PostGIS extensions for:
- Geospatial queries and proximity calculations
- Geometry storage for parcel boundaries
- Centroid calculations for mapping

## 🔧 Admin Configuration

The system includes a comprehensive admin configuration covering:

### A) Core Filters & Geography
- Allowed states (default: VA, NC, SC, GA, FL, AL)
- County tiers (T1/T2/T3) with different scan frequencies
- Metro areas with distance calculations
- Acreage ranges (100-1,000 acres)
- Zoning categories (ag, timber, rural residential, etc.)

### B) Data Sources (13 Default Sources)
- **Portals**: LandWatch, Land And Farm, Lands of America, Crexi, LoopNet
- **Brokers**: Hall & Hall, Whitetail Properties, United Country, AFM Real Estate
- Each source configurable with rate limits and crawl frequency

### C) Fit Score Weights
- Acreage: 20% (optimal range matching)
- Land Cover Mix: 20% (diversity scoring)
- Water Presence: 10% (creeks, ponds, lakes)
- Metro Proximity: 10% (distance scoring)
- Slope/Topography: 10%
- Soils Quality: 10%
- Road Access: 10% (paved > gravel > dirt)
- Easement Penalty: 5%
- Utilities: 5%

## 🤖 Crawler Adapters

### Working Adapters
1. **LandWatch**: Full implementation with search and detail scraping
2. **Hall & Hall**: Complete broker adapter with geographic filtering

### Stub Adapters
- 11 additional sources (Land And Farm, Whitetail Properties, etc.)
- Structured for easy implementation following the adapter interface

### Adapter Interface
```typescript
interface CrawlerAdapter {
  name: string
  sourceId: string
  search(params: SearchParams): Promise<ListingCandidate[]>
  getDetails(url: string): Promise<ListingCandidate>
}
```

## 📈 Fit Score Algorithm

The fit score uses a weighted algorithm that evaluates:

1. **Acreage Scoring**: Optimal range matching with penalties for outliers
2. **Land Cover Diversity**: Shannon diversity index for forest/pasture/crop mix
3. **Water Features**: Bonus for creeks, ponds, lakes, wetland considerations
4. **Metro Proximity**: Linear scoring within target radius, exponential decay outside
5. **Topography**: Slope analysis with configurable thresholds
6. **Infrastructure**: Road quality, utility distances, easement impacts

### Auto-Fail Conditions
- Properties in floodways
- Excessive wetlands (>50% configurable)

## 🔄 Job System

### Weekly Scans
- Configured via Admin UI (default: Sunday 2:00 UTC)
- Processes all enabled sources with rate limiting
- Comprehensive error handling and reporting

### On-Demand Scans
- Triggered via API: `POST /api/admin/sources/scan`
- Non-blocking with background processing
- Real-time status updates in Admin Health page

### Scan Pipeline
1. **Source Processing**: Each enabled source crawled according to rate limits
2. **Deduplication**: APN matching + fuzzy geographic clustering
3. **Feature Extraction**: Parse descriptions for water, access, improvements
4. **Fit Score Calculation**: Apply current admin config weights
5. **Telemetry**: Log counts, errors, performance metrics

## 🎨 UI Components

### Dashboard
- Executive summary with key metrics
- Recent scan activity
- Quick actions for common tasks

### Results Table
- Sortable columns (Fit Score, Acreage, Price, State/County)
- Advanced filtering with saved presets
- Conditional highlighting for high-fit properties (80+)
- Quick export to CSV

### Parcel/Deal Profile
- Detailed property information with source lineage
- Fit score breakdown with top contributing factors
- Deal stage management with activity logging
- Photo gallery from source listings

### Admin Interface
- **Configuration**: Tabbed interface for all admin settings
- **Health**: System status, scan history, error reporting
- **Sources**: Enable/disable sources, trigger scans, view statistics

## 📡 API Endpoints

- `POST /api/admin/sources/scan` - Trigger on-demand scan
- `GET /api/admin/health` - System health and scan statistics
- `POST /api/search` - Advanced property search with filters
- `GET /api/parcels/:id` - Detailed parcel information
- `PUT /api/deals/:id` - Update deal stage and notes
- `POST /api/deals/:id` - Add deal activity/notes

## 🚀 Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Set up PostgreSQL database (Neon, Supabase, or Railway recommended)
4. Deploy automatically on git push

### Database Migration

```bash
# Production database setup
npx prisma generate
npx prisma db push
npx prisma db seed
```

### Weekly Cron Jobs

Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/admin/sources/scan",
    "schedule": "0 2 * * 0"
  }]
}
```

## 🔒 Security & Compliance

- **Legal Posture**: Configurable robots.txt respect and public records permissions
- **Rate Limiting**: Per-source rate limiting to respect ToS
- **Authentication**: Clerk-based auth with role-based access (Admin/Superuser)
- **Data Privacy**: Owner PII handled carefully with opt-out mechanisms (Phase 2)

## 📝 Development Commands

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Build for production
npm run start                  # Start production server

# Database
npx prisma studio              # Database GUI
npx prisma generate            # Generate Prisma client
npx prisma db push             # Push schema changes
npx prisma db seed             # Run seed script

# Deployment
git push origin main           # Auto-deploy to Vercel
```

## 🏗 Project Structure

```
├── app/
│   ├── (dashboard)/          # Protected dashboard routes
│   ├── api/                  # API endpoints
│   ├── sign-in/              # Authentication pages
│   └── globals.css
├── components/
│   ├── layout/               # Navigation, layouts
│   └── ui/                   # Reusable UI components
├── lib/
│   ├── adapters/             # Crawler adapters
│   ├── jobs/                 # Background job processing
│   ├── admin-config-schema.ts # Zod schemas
│   ├── fit-score.ts          # Scoring algorithm
│   └── prisma.ts             # Database client
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── seed.ts               # Default data
└── README.md
```

## 🧪 Testing

The project includes sample data and comprehensive error handling. For testing:

1. Run seed script to populate sample parcels and listings
2. Use Admin Health page to monitor scan runs
3. Test On-Demand scans with rate limiting
4. Verify fit score calculations with various parcel types

## 🔮 Future Enhancements (Phase 1.1+)

- **Map View**: Mapbox GL integration with parcel visualization
- **Email Notifications**: Scan completion and new high-fit property alerts
- **County GIS Integration**: Direct access to assessor data
- **Enrichment APIs**: NRCS soils, USGS hydrography, FEMA flood data
- **Document Management**: Store deeds, surveys, environmental reports
- **Collaboration Tools**: Team comments, task assignments, calendar integration

## 📄 License

Internal ThriveMore project - All rights reserved.

---

Built with Next.js, PostgreSQL, and deployed on Vercel.
For questions or support, contact the development team.