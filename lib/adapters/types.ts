// ─── Crawler Adapter Types for LandScout 2.0 ──────────────────────

export interface SearchParams {
  states: string[]          // e.g. ['VA', 'NC', 'SC', 'GA', 'FL', 'AL']
  minAcreage: number        // e.g. 100
  maxAcreage: number        // e.g. 1000
  maxResults?: number       // default 100
}

export interface ListingCandidate {
  sourceSlug: string        // adapter identifier
  externalId: string        // listing ID on source site
  url: string               // full URL to listing
  title: string
  description?: string
  lat?: number
  lon?: number
  acreage: number
  county: string
  state: string             // 2-letter code
  price?: number
  pricePerAcre?: number
  photos?: string[]
  status: 'listed' | 'off-market'
  address?: string
  zoning?: string
  metadata?: Record<string, unknown>
}

export interface CrawlerAdapter {
  name: string
  slug: string
  search(params: SearchParams): Promise<ListingCandidate[]>
}
