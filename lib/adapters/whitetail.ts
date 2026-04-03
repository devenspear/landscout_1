// ─── Whitetail Properties Adapter (whitetailproperties.com) ────────
// Hunting/recreational land specialist. Server-rendered, Cheerio-compatible.
// Permissive robots.txt (blocks PDF only).
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
  LA: 'louisiana', IL: 'illinois', IN: 'indiana', OH: 'ohio',
  MI: 'michigan', WV: 'west-virginia', PA: 'pennsylvania',
}

/**
 * Build the search URL for whitetailproperties.com.
 * TODO: Verify URL structure. Possible patterns:
 *   /properties/{state-slug}/
 *   /search/?state=VA&min_acres=100&max_acres=1000
 *   /land-for-sale/{state-slug}/?acreage_min=100&acreage_max=1000
 */
function buildSearchUrl(state: string, minAcres: number, maxAcres: number, page: number): string {
  const stateSlug = STATE_SLUGS[state] ?? state.toLowerCase()
  // TODO: Verify this URL pattern against live site
  const baseUrl = `https://www.whitetailproperties.com/properties/${stateSlug}`
  const params = new URLSearchParams({
    acreage_min: minAcres.toString(),
    acreage_max: maxAcres.toString(),
    page: page.toString(),
  })
  return `${baseUrl}?${params.toString()}`
}

/**
 * Parse a single listing card from Whitetail Properties search results.
 * TODO: All CSS class names need verification against live HTML.
 */
function parseListingCard(cardHtml: string, defaultState: string): ListingCandidate | null {
  try {
    const links = extractLinks(cardHtml)
    const listingUrl = links.find(
      (l) => l.includes('/properties/') || l.includes('/listing/')
    )
    if (!listingUrl) return null

    const fullUrl = listingUrl.startsWith('http')
      ? listingUrl
      : `https://www.whitetailproperties.com${listingUrl}`

    // Extract ID from URL
    // TODO: Verify ID extraction — may be slug, numeric, or compound
    const idMatch = fullUrl.match(/(\d{3,})/) ?? fullUrl.match(/\/([^/?]+)\/?(?:\?|$)/)
    const externalId = idMatch ? idMatch[1] : fullUrl

    // TODO: Verify title element selector
    const titleEl = selectFirst(cardHtml, 'h3', 'property-title')
      ?? selectFirst(cardHtml, 'h2', 'property-title')
      ?? selectFirst(cardHtml, 'a', 'property-name')
      ?? selectFirst(cardHtml, 'h3', 'card-title')
    const title = titleEl ? textContent(titleEl) : textContent(cardHtml).slice(0, 100)

    // TODO: Verify price element selector
    const priceEl = selectFirst(cardHtml, 'span', 'property-price')
      ?? selectFirst(cardHtml, 'div', 'price')
      ?? selectFirst(cardHtml, 'span', 'price')
    const price = parsePrice(priceEl ? textContent(priceEl) : null)

    // TODO: Verify acreage element selector
    const acreageEl = selectFirst(cardHtml, 'span', 'property-acres')
      ?? selectFirst(cardHtml, 'span', 'acres')
      ?? selectFirst(cardHtml, 'div', 'acreage')
    const acreageText = acreageEl ? textContent(acreageEl) : ''
    const acreage = parseAcreage(acreageText)

    // Try to extract acreage from title if not found in a dedicated element
    // Whitetail often puts acreage in titles: "250 Acre Hunting Property"
    const acreageFinal = acreage ?? parseAcreage(title)

    // TODO: Verify location element selector
    const locationEl = selectFirst(cardHtml, 'span', 'property-location')
      ?? selectFirst(cardHtml, 'div', 'location')
      ?? selectFirst(cardHtml, 'p', 'location')
      ?? selectFirst(cardHtml, 'span', 'county-state')
    const locationText = locationEl ? textContent(locationEl) : ''

    // Parse "County, ST" from location text
    const locationParts = locationText.split(',').map((s) => s.trim())
    const county = locationParts[0] || 'Unknown'
    const state = extractStateCode(locationText) || defaultState

    // Description
    // TODO: Verify description element class
    const descEl = selectFirst(cardHtml, 'p', 'property-description')
      ?? selectFirst(cardHtml, 'div', 'description')
    const description = descEl ? textContent(descEl) : undefined

    // Photos
    const photos = extractImages(cardHtml).filter(
      (src) => !src.includes('logo') && !src.includes('icon') && !src.includes('placeholder')
    )

    if (!acreageFinal || acreageFinal <= 0) return null

    return {
      sourceSlug: 'whitetail',
      externalId,
      url: fullUrl,
      title: title || 'Untitled Hunting/Recreation Property',
      description,
      acreage: acreageFinal,
      county,
      state,
      price,
      pricePerAcre: price && acreageFinal ? Math.round(price / acreageFinal) : undefined,
      photos: photos.length > 0 ? photos : undefined,
      status: 'listed',
      metadata: {
        rawLocation: locationText,
        propertyType: 'hunting-recreational',
      },
    }
  } catch (err) {
    console.error('[whitetail] Failed to parse listing card:', err)
    return null
  }
}

export class WhitetailAdapter implements CrawlerAdapter {
  name = 'Whitetail Properties'
  slug = 'whitetail'

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
          console.log(`[whitetail] Fetching: ${url}`)

          const html = await fetchHtml(url)

          // TODO: Verify listing card container class against live HTML
          let cards = extractByClass(html, 'div', 'property-card')
          if (cards.length === 0) cards = extractByClass(html, 'article', 'property-card')
          if (cards.length === 0) cards = extractByClass(html, 'div', 'listing-card')
          if (cards.length === 0) cards = extractByClass(html, 'div', 'property-item')
          if (cards.length === 0) cards = extractByClass(html, 'div', 'card')
          if (cards.length === 0) {
            console.log(`[whitetail] No listing cards found for ${state} page ${page} — selector may need update`)
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

          // Check for pagination
          // TODO: Verify pagination element
          const hasNextPage = html.includes('rel="next"') ||
            html.includes('class="next"') ||
            html.includes('>Next<') ||
            html.includes('class="pagination-next"') ||
            html.includes('aria-label="Next"')

          hasMore = hasNextPage && cards.length > 0
          page++

          await sleep()
        } catch (err) {
          console.error(`[whitetail] Error fetching ${state} page ${page}:`, err)
          hasMore = false
        }
      }
    }

    console.log(`[whitetail] Found ${results.length} listings total`)
    return results.slice(0, maxResults)
  }
}
