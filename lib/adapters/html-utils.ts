// ─── Lightweight HTML Parsing Utilities ─────────────────────────────
// Since cheerio is not installed, these regex-based helpers provide
// basic HTML element extraction for server-rendered listing pages.
// Not a full DOM parser — designed for structured listing card markup.

const USER_AGENT = 'LandScout/2.0 (land-intelligence-platform)'
const RATE_LIMIT_MS = 2000

/**
 * Fetch HTML with rate limiting, timeout, and a polite User-Agent.
 */
export async function fetchHtml(url: string): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: controller.signal,
    })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} fetching ${url}`)
    }

    return await res.text()
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Sleep for rate limiting between requests.
 */
export function sleep(ms: number = RATE_LIMIT_MS): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Extract all elements matching a tag + class pattern.
 * Returns the full innerHTML of each match.
 *
 * Example: extractByClass(html, 'div', 'listing-card') returns
 * the inner content of each <div class="...listing-card...">...</div>
 */
export function extractByClass(html: string, tag: string, className: string): string[] {
  const results: string[] = []
  // Match opening tag with the class, then capture content until the matching closing tag.
  // This uses a simple depth-tracking approach for the specific tag.
  const openPattern = new RegExp(
    `<${tag}[^>]*\\bclass="[^"]*\\b${escapeRegex(className)}\\b[^"]*"[^>]*>`,
    'gi'
  )

  let match: RegExpExecArray | null
  while ((match = openPattern.exec(html)) !== null) {
    const startIdx = match.index + match[0].length
    const content = extractClosingContent(html, tag, startIdx)
    if (content !== null) {
      results.push(content)
    }
  }

  return results
}

/**
 * Extract content from a position until the matching closing tag,
 * respecting nesting depth.
 */
function extractClosingContent(html: string, tag: string, startIdx: number): string | null {
  let depth = 1
  const openRe = new RegExp(`<${tag}[\\s>]`, 'gi')
  const closeRe = new RegExp(`</${tag}>`, 'gi')

  openRe.lastIndex = startIdx
  closeRe.lastIndex = startIdx

  // Walk forward finding open/close tags
  let pos = startIdx
  while (depth > 0 && pos < html.length) {
    openRe.lastIndex = pos
    closeRe.lastIndex = pos

    const nextOpen = openRe.exec(html)
    const nextClose = closeRe.exec(html)

    if (!nextClose) return null // malformed HTML

    if (nextOpen && nextOpen.index < nextClose.index) {
      depth++
      pos = nextOpen.index + nextOpen[0].length
    } else {
      depth--
      if (depth === 0) {
        return html.slice(startIdx, nextClose.index)
      }
      pos = nextClose.index + nextClose[0].length
    }
  }

  return null
}

/**
 * Extract text content from an HTML string (strip all tags).
 */
export function textContent(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Extract an attribute value from an HTML element string.
 */
export function getAttribute(elementHtml: string, attr: string): string | null {
  const re = new RegExp(`${escapeRegex(attr)}="([^"]*)"`, 'i')
  const match = re.exec(elementHtml)
  return match ? match[1] : null
}

/**
 * Extract the first element matching tag + class, return its innerHTML.
 */
export function selectFirst(html: string, tag: string, className: string): string | null {
  const results = extractByClass(html, tag, className)
  return results[0] ?? null
}

/**
 * Extract all href values from <a> tags within an HTML snippet.
 */
export function extractLinks(html: string): string[] {
  const links: string[] = []
  const re = /<a[^>]+href="([^"]+)"[^>]*>/gi
  let match: RegExpExecArray | null
  while ((match = re.exec(html)) !== null) {
    links.push(match[1])
  }
  return links
}

/**
 * Extract all img src values from an HTML snippet.
 */
export function extractImages(html: string): string[] {
  const srcs: string[] = []
  const re = /<img[^>]+src="([^"]+)"[^>]*>/gi
  let match: RegExpExecArray | null
  while ((match = re.exec(html)) !== null) {
    srcs.push(match[1])
  }
  return srcs
}

/**
 * Parse a price string like "$1,250,000" or "$2.5M" into a number.
 */
export function parsePrice(raw: string | null): number | undefined {
  if (!raw) return undefined
  const cleaned = raw.replace(/[^0-9.MmKk]/g, '')
  if (!cleaned) return undefined

  let num = parseFloat(cleaned)
  if (isNaN(num)) return undefined

  if (/[Mm]/.test(raw)) num *= 1_000_000
  if (/[Kk]/.test(raw)) num *= 1_000

  return Math.round(num)
}

/**
 * Parse an acreage string like "250 acres" or "1,200± ac" into a number.
 */
export function parseAcreage(raw: string | null): number | undefined {
  if (!raw) return undefined
  const cleaned = raw.replace(/[^0-9.]/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? undefined : num
}

/**
 * Extract a 2-letter state code from a location string.
 */
export function extractStateCode(location: string): string | null {
  // Try to find a 2-letter state abbreviation
  const stateMatch = location.match(/\b([A-Z]{2})\b/)
  return stateMatch ? stateMatch[1] : null
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export { USER_AGENT, RATE_LIMIT_MS }
