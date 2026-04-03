// ─── Adapter Registry for LandScout 2.0 ────────────────────────────

import type { CrawlerAdapter } from './types'
import { MasonMorseAdapter } from './mason-morse'
import { UnitedCountryAdapter } from './united-country'
import { WhitetailAdapter } from './whitetail'

export const adapters: Record<string, CrawlerAdapter> = {
  'masonmorse': new MasonMorseAdapter(),
  'unitedcountry': new UnitedCountryAdapter(),
  'whitetail': new WhitetailAdapter(),
}

export function getAdapter(slug: string): CrawlerAdapter | null {
  return adapters[slug] || null
}

export { type CrawlerAdapter, type ListingCandidate, type SearchParams } from './types'
