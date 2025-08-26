export interface ListingCandidate {
  sourceId: string
  externalId?: string
  url: string
  title: string
  description?: string
  lat?: number
  lon?: number
  acreage: number
  county: string
  state: string
  price?: number
  pricePerAcre?: number
  photos?: string[]
  status: 'listed' | 'off-market' | 'distressed' | 'sold'
  apn?: string
  address?: string
  metadata?: Record<string, any>
}

export interface CrawlerAdapter {
  name: string
  sourceId: string
  
  search(params: SearchParams): Promise<ListingCandidate[]>
  getDetails(url: string): Promise<ListingCandidate>
}

export interface SearchParams {
  states: string[]
  minAcreage: number
  maxAcreage: number
  page?: number
  limit?: number
}

export interface CrawlerConfig {
  baseUrl: string
  rateLimitPerMin: number
  proxyUrl?: string
  userAgent?: string
}