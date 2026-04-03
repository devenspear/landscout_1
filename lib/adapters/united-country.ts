// ─── United Country Adapter (unitedcountry.com) ────────────────────
// Server-rendered broker site. Permissive robots.txt for /for-sale/.
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

// ─── State name to URL slug map ─────────────────────────────────────

const STATE_SLUGS: Record<string, string> = {
  VA: 'virginia', NC: 'north-carolina', SC: 'south-carolina',
  GA: 'georgia', FL: 'florida', AL: 'alabama', CO: 'colorado',
  MT: 'montana', WY: 'wyoming', NM: 'new-mexico', TX: 'texas',
  OR: 'oregon', ID: 'idaho', NE: 'nebraska', KS: 'kansas',
  OK: 'oklahoma', SD: 'south-dakota', ND: 'north-dakota',
  TN: 'tennessee', KY: 'kentucky', AR: 'arkansas', MS: 'mississippi',
  MO: 'missouri', WI: 'wisconsin', MN: 'minnesota', IA: 'iowa',
  LA: 'louisiana', WV: 'west-virginia', AZ: 'arizona',
}

/**
 * Build the search URL for unitedcountry.com.
 * TODO: Verify URL structure. Likely patterns:
 *   /for-sale/land/{state}/
 *   /for-sale/land/?state=VA&min_acres=100&max_acres=1000
 *   /for-sale/farms-ranches-land/{state-slug}/
 */
function buildSearchUrl(state: string, minAcres: number, maxAcres: number, page: number): string {
  const stateSlug = STATE_SLUGS[state] ?? state.toLowerCase()
  // TODO: Verify this URL pattern against live site
  const baseUrl = `https://www.unitedcountry.com/for-sale/land/${stateSlug}/`
  const params = new URLSearchParams({
    min_acres: minAcres.toString(),
    max_acres: maxAcres.toString(),
    page: page.toString(),
  })
  return `${baseUrl}?${params.toString()}`
}

/**
 * Parse a single listing card from United Country search results.
 * TODO: All CSS class names need verification against live HTML.
 */
function parseListingCard(cardHtml: string, defaultState: string): ListingCandidate | null {
  try {
    const links = extractLinks(cardHtml)
    const listingUrl = links.find(
      (l) => l.includes('/for-sale/') || l.includes('/listing/') || l.includes('/property/')
    )
    if (!listingUrl) return null

    const fullUrl = listingUrl.startsWith('http')
      ? listingUrl
      : `https://www.unitedcountry.com${listingUrl}`

    // Extract ID from URL — may be numeric or slug-based
    // TODO: Verify ID pattern — e.g. /listing/12345/ or /for-sale/property-name-12345/
    const idMatch = fullUrl.match(/(\d{4,})/) ?? fullUrl.match(/\/([^/]+)\/?$/)
    const externalId = idMatch ? idMatch[1] : fullUrl

    // TODO: Verify title element class
    const titleEl = selectFirst(cardHtml, 'h3', 'listing-title')
      ?? selectFirst(cardHtml, 'h2', 'listing-title')
      ?? selectFirst(cardHtml, 'a', 'listing-title')
      ?? selectFirst(cardHtml, 'h3', 'property-name')
    const title = titleEl ? textContent(titleEl) : textContent(cardHtml).slice(0, 100)

    // TODO: Verify price element class
    const priceEl = selectFirst(cardHtml, 'span', 'listing-price')
      ?? selectFirst(cardHtml, 'div', 'price')
      ?? selectFirst(cardHtml, 'span', 'price')
    const price = parsePrice(priceEl ? textContent(priceEl) : null)

    // TODO: Verify acreage element class
    const acreageEl = selectFirst(cardHtml, 'span', 'listing-acreage')
      ?? selectFirst(cardHtml, 'span', 'acres')
      ?? selectFirst(cardHtml, 'li', 'acreage')
    const acreageText = acreageEl ? textContent(acreageEl) : ''
    const acreage = parseAcreage(acreageText)

    // TODO: Verify location element class
    const locationEl = selectFirst(cardHtml, 'span', 'listing-location')
      ?? selectFirst(cardHtml, 'div', 'location')
      ?? selectFirst(cardHtml, 'p', 'location')
    const locationText = locationEl ? textContent(locationEl) : ''

    // Parse "County, ST" from location
    const locationParts = locationText.split(',').map((s) => s.trim())
    const county = locationParts[0] || 'Unknown'
    const state = extractStateCode(locationText) || defaultState

    // Description snippet
    // TODO: Verify description element class
    const descEl = selectFirst(cardHtml, 'p', 'listing-description')
      ?? selectFirst(cardHtml, 'div', 'description')
    const description = descEl ? textContent(descEl) : undefined

    // Photos
    const photos = extractImages(cardHtml).filter(
      (src) => !src.includes('logo') && !src.includes('icon') && !src.includes('placeholder')
    )

    if (!acreage || acreage <= 0) return null

    return {
      sourceSlug: 'unitedcountry',
      externalId,
      url: fullUrl,
      title: title || 'Untitled Land Listing',
      description,
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
    console.error('[united-country] Failed to parse listing card:', err)
    return null
  }
}

export class UnitedCountryAdapter implements CrawlerAdapter {
  name = 'United Country Real Estate'
  slug = 'unitedcountry'

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
          console.log(`[united-country] Fetching: ${url}`)

          const html = await fetchHtml(url)

          // TODO: Verify listing card container class against live HTML
          let cards = extractByClass(html, 'div', 'listing-card')
          if (cards.length === 0) cards = extractByClass(html, 'div', 'property-card')
          if (cards.length === 0) cards = extractByClass(html, 'article', 'listing-item')
          if (cards.length === 0) cards = extractByClass(html, 'div', 'search-result')
          if (cards.length === 0) {
            console.log(`[united-country] No listing cards found for ${state} page ${page} — selector may need update`)
            hasMore = false
            break
          }

          for (const cardHtml of cards) {
            const listing = parseListingCard(cardHtml, state)
            if (listing) {
              if (listing.acreage >= minAcreage && listing.acreage <= maxAcreage) {
                results.push(listing)
              }
            }
            if (results.length >= maxResults) break
          }

          // Check for next page
          // TODO: Verify pagination element
          const hasNextPage = html.includes('rel="next"') ||
            html.includes('class="next"') ||
            html.includes('>Next<') ||
            html.includes('class="pagination-next"')

          hasMore = hasNextPage && cards.length > 0
          page++

          await sleep()
        } catch (err) {
          console.error(`[united-country] Error fetching ${state} page ${page}:`, err)
          hasMore = false
        }
      }
    }

    console.log(`[united-country] Found ${results.length} listings total`)
    return results.slice(0, maxResults)
  }
}
