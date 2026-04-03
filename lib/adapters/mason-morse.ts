// ─── Mason & Morse Ranch Company Adapter (ranchland.com) ───────────
// Server-rendered broker site. Permissive robots.txt confirmed.
// CSS selectors are best-guess and marked with TODO where uncertain.

import type { CrawlerAdapter, SearchParams, ListingCandidate } from './types'
import {
  fetchHtml,
  sleep,
  textContent,
  extractLinks,
  extractImages,
  parsePrice,
  parseAcreage,
  extractStateCode,
  extractByClass,
  selectFirst,
} from './html-utils'

// ─── State name to abbreviation map (for URL construction) ──────────

const STATE_NAMES: Record<string, string> = {
  VA: 'virginia', NC: 'north-carolina', SC: 'south-carolina',
  GA: 'georgia', FL: 'florida', AL: 'alabama', CO: 'colorado',
  MT: 'montana', WY: 'wyoming', NM: 'new-mexico', TX: 'texas',
  OR: 'oregon', ID: 'idaho', NE: 'nebraska', KS: 'kansas',
  OK: 'oklahoma', SD: 'south-dakota', ND: 'north-dakota',
  AZ: 'arizona', UT: 'utah', NV: 'nevada', CA: 'california',
  WA: 'washington',
}

/**
 * Build the search URL for ranchland.com.
 * TODO: Verify URL structure against live site. The site may use
 * /ranches-for-sale/{state}/ or query params like ?state=CO&min_acres=100
 */
function buildSearchUrl(state: string, minAcres: number, maxAcres: number, page: number): string {
  const stateName = STATE_NAMES[state] ?? state.toLowerCase()
  // TODO: Verify this URL pattern — may need adjustment after live testing
  return `https://www.ranchland.com/ranches-for-sale/${stateName}/?min_acres=${minAcres}&max_acres=${maxAcres}&page=${page}`
}

/**
 * Parse a single listing card from the search results page.
 * TODO: All CSS class names and selectors need verification against live HTML.
 */
function parseListingCard(cardHtml: string): ListingCandidate | null {
  try {
    // TODO: Verify class name — may be 'property-card', 'listing-item', etc.
    const links = extractLinks(cardHtml)
    const listingUrl = links.find((l) => l.includes('/ranches-for-sale/') || l.includes('/property/'))
    if (!listingUrl) return null

    const fullUrl = listingUrl.startsWith('http')
      ? listingUrl
      : `https://www.ranchland.com${listingUrl}`

    // Extract listing ID from URL
    // TODO: Verify ID extraction pattern — may be numeric slug or path segment
    const idMatch = fullUrl.match(/\/(\d+)\/?$/) ?? fullUrl.match(/\/([^/]+)\/?$/)
    const externalId = idMatch ? idMatch[1] : fullUrl

    // TODO: Verify class names for title, price, acreage, location elements
    const titleEl = selectFirst(cardHtml, 'h2', 'property-title')
      ?? selectFirst(cardHtml, 'h3', 'property-title')
      ?? selectFirst(cardHtml, 'a', 'property-title')
    const title = titleEl ? textContent(titleEl) : textContent(cardHtml).slice(0, 100)

    // TODO: Verify price element selector
    const priceEl = selectFirst(cardHtml, 'span', 'price')
      ?? selectFirst(cardHtml, 'div', 'price')
      ?? selectFirst(cardHtml, 'p', 'price')
    const price = parsePrice(priceEl ? textContent(priceEl) : null)

    // TODO: Verify acreage element selector
    const acreageEl = selectFirst(cardHtml, 'span', 'acreage')
      ?? selectFirst(cardHtml, 'span', 'acres')
      ?? selectFirst(cardHtml, 'div', 'acreage')
    const acreage = parseAcreage(acreageEl ? textContent(acreageEl) : null)

    // TODO: Verify location element selector
    const locationEl = selectFirst(cardHtml, 'span', 'location')
      ?? selectFirst(cardHtml, 'div', 'location')
      ?? selectFirst(cardHtml, 'p', 'location')
    const locationText = locationEl ? textContent(locationEl) : ''

    // Parse county and state from location text like "Park County, CO"
    const locationParts = locationText.split(',').map((s) => s.trim())
    const county = locationParts[0] || 'Unknown'
    const state = extractStateCode(locationText) || ''

    // Extract photos
    const photos = extractImages(cardHtml).filter(
      (src) => !src.includes('logo') && !src.includes('icon')
    )

    if (!acreage || acreage <= 0) return null

    return {
      sourceSlug: 'masonmorse',
      externalId,
      url: fullUrl,
      title: title || 'Untitled Ranch Listing',
      acreage,
      county,
      state,
      price,
      pricePerAcre: price && acreage ? Math.round(price / acreage) : undefined,
      photos: photos.length > 0 ? photos : undefined,
      status: 'listed',
      metadata: { rawLocation: locationText },
    }
  } catch (err) {
    console.error('[mason-morse] Failed to parse listing card:', err)
    return null
  }
}

export class MasonMorseAdapter implements CrawlerAdapter {
  name = 'Mason & Morse Ranch Company'
  slug = 'masonmorse'

  async search(params: SearchParams): Promise<ListingCandidate[]> {
    const { states, minAcreage, maxAcreage, maxResults = 100 } = params
    const results: ListingCandidate[] = []

    for (const state of states) {
      if (results.length >= maxResults) break

      let page = 1
      let hasMore = true

      while (hasMore && results.length < maxResults) {
        try {
          const url = buildSearchUrl(state, minAcreage, maxAcreage, page)
          console.log(`[mason-morse] Fetching: ${url}`)

          const html = await fetchHtml(url)

          // TODO: Verify the listing card class name against live HTML
          // Try multiple possible class names for the listing container
          let cards = extractByClass(html, 'div', 'property-card')
          if (cards.length === 0) cards = extractByClass(html, 'article', 'property-card')
          if (cards.length === 0) cards = extractByClass(html, 'div', 'listing-card')
          if (cards.length === 0) cards = extractByClass(html, 'div', 'ranch-listing')
          if (cards.length === 0) {
            console.log(`[mason-morse] No listing cards found for ${state} page ${page} — selector may need update`)
            hasMore = false
            break
          }

          for (const cardHtml of cards) {
            const listing = parseListingCard(cardHtml)
            if (listing) {
              // Override state if we know it from the search params
              if (!listing.state) listing.state = state
              // Filter by acreage range (server-side filtering may be imprecise)
              if (listing.acreage >= minAcreage && listing.acreage <= maxAcreage) {
                results.push(listing)
              }
            }
            if (results.length >= maxResults) break
          }

          // Check for pagination
          // TODO: Verify pagination selector — may be 'next', 'pagination-next', etc.
          const hasNextPage = html.includes('rel="next"') ||
            html.includes('class="next"') ||
            html.includes('class="pagination-next"')

          hasMore = hasNextPage && cards.length > 0
          page++

          await sleep()
        } catch (err) {
          console.error(`[mason-morse] Error fetching ${state} page ${page}:`, err)
          hasMore = false
        }
      }
    }

    console.log(`[mason-morse] Found ${results.length} listings total`)
    return results.slice(0, maxResults)
  }
}
