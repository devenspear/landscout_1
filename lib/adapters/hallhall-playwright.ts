import { chromium, Page, Browser } from 'playwright'
import * as cheerio from 'cheerio'
import { CrawlerAdapter, ListingCandidate, SearchParams } from './types'
import { DebugLogger } from '../debug-logger'

export class HallAndHallPlaywrightAdapter implements CrawlerAdapter {
  name = 'Hall and Hall (Playwright)'
  sourceId = 'hallhall-pw'
  private baseUrl = 'https://hallhall.com'
  private logger: DebugLogger
  private browser: Browser | null = null
  
  constructor() {
    this.logger = new DebugLogger('HallHallPlaywrightAdapter')
  }
  
  private async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.logger.info('Starting Chromium browser')
      this.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      })
    }
    return this.browser
  }
  
  async search(params: SearchParams): Promise<ListingCandidate[]> {
    const listings: ListingCandidate[] = []
    this.logger.info('Starting Hall & Hall search with Playwright', params)
    const searchTimer = this.logger.startTimer('search')
    
    let page: Page | null = null
    
    try {
      // Get browser and create page
      const browser = await this.getBrowser()
      page = await browser.newPage()
      
      // Set realistic user agent and viewport
      await page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      })
      await page.setViewportSize({ width: 1920, height: 1080 })
      
      // Navigate to search page
      const searchUrl = `${this.baseUrl}/ranches-for-sale`
      this.logger.info(`Navigating to: ${searchUrl}`)
      const navTimer = this.logger.startTimer('navigation')
      
      await page.goto(searchUrl, { 
        waitUntil: 'networkidle', 
        timeout: 30000 
      })
      
      navTimer()
      this.logger.info('Page loaded successfully')
      
      // Wait for content to load (important for JS-rendered content)
      this.logger.info('Waiting for property listings to load')
      const waitTimer = this.logger.startTimer('content-wait')
      
      try {
        // Wait for common property listing elements
        await page.waitForSelector('div[class*="property"], div[class*="listing"], div[class*="ranch"], .card, article', { timeout: 10000 })
        waitTimer()
        this.logger.info('Property elements detected')
      } catch (waitError) {
        waitTimer()
        this.logger.warn('No property elements found within timeout, proceeding with page analysis')
      }
      
      // Get page content and parse with Cheerio
      const content = await page.content()
      const $ = cheerio.load(content)
      
      this.logger.info('Analyzing page content', { 
        contentLength: content.length,
        title: await page.title()
      })
      
      // Try multiple selector patterns for property listings
      const selectors = [
        // Look for actual content containers, not just class names
        'div:contains("acres"), div:contains("$")',
        'article',
        '.card:contains("acres"), .card:contains("$")',
        '[data-property], [data-listing]',
        'div[class*="listing"]:contains("$")',
        'div[class*="ranch"]:contains("acres")',
        // Fallback to broader selectors
        'div[class*="property"]:not([class*="menu"]):not([class*="nav"]):not([class*="footer"])'
      ]
      
      let propertyElements: cheerio.Cheerio<any> = $()
      let usedSelector = ''
      
      for (const selector of selectors) {
        try {
          const elements = $(selector)
          if (elements.length > 0) {
            // Apply more sophisticated filtering
            const filtered = elements.filter((i, el) => {
              const $el = $(el)
              const text = $el.text().toLowerCase()
              const classes = $el.attr('class') || ''
              const id = $el.attr('id') || ''
              
              // Skip navigation/footer/menu elements
              if (classes.includes('nav') || classes.includes('footer') || 
                  classes.includes('menu') || classes.includes('header') ||
                  id.includes('nav') || id.includes('menu') || id.includes('footer')) {
                return false
              }
              
              // Must have substantial content (not just a few words)
              if (text.length < 50) {
                return false
              }
              
              // Must have property indicators
              const hasAcres = /\d+\s*(?:acres?|ac\b)/i.test(text)
              const hasPrice = /\$[\d,]+/i.test(text)
              const hasRanchTerm = /ranch|property|land|farm/i.test(text)
              
              // Include if it has acreage AND (price OR ranch terms)
              return hasAcres && (hasPrice || hasRanchTerm)
            })
            
            this.logger.info(`Selector "${selector}" found ${elements.length} total, ${filtered.length} after filtering`)
            
            if (filtered.length > 0) {
              propertyElements = filtered
              usedSelector = selector
              break
            }
          } else {
            this.logger.debug(`Selector "${selector}" found 0 elements`)
          }
        } catch (selectorError) {
          this.logger.warn(`Selector "${selector}" failed:`, selectorError)
          continue
        }
      }
      
      this.logger.info(`Found ${propertyElements.length} property elements using selector: ${usedSelector || 'none'}`)
      
      // If no elements found, log page analysis
      if (propertyElements.length === 0) {
        const bodyText = $('body').text()
        this.logger.warn('No property elements found. Page analysis:', {
          title: $('title').text(),
          bodyLength: bodyText.length,
          hasRanchText: bodyText.toLowerCase().includes('ranch'),
          hasAcresText: bodyText.toLowerCase().includes('acres'),
          hasPriceText: bodyText.toLowerCase().includes('$'),
          commonElementCounts: {
            divs: $('div').length,
            articles: $('article').length,
            cards: $('.card').length,
            spans: $('span').length
          },
          potentialContainers: {
            dataAttributes: $('[data-*]').length,
            classWithProperty: $('[class*="property"]').length,
            classWithListing: $('[class*="listing"]').length,
            classWithRanch: $('[class*="ranch"]').length
          }
        })
        
        // Log sample of div elements that might contain listings
        $('div').each((i, div) => {
          if (i < 5) { // Only check first 5
            const $div = $(div)
            const text = $div.text().toLowerCase()
            if (text.includes('acres') && text.includes('$') && text.length < 500) {
              this.logger.info(`Potential listing div ${i}:`, {
                classes: $div.attr('class'),
                textSample: text.substring(0, 200)
              })
            }
          }
        })
      }
      
      // Parse each property element
      propertyElements.each((i, element) => {
        const $el = $(element)
        
        // Extract property information using multiple selector patterns
        const elementText = $el.text()
        const listing: ListingCandidate = {
          sourceId: this.sourceId,
          externalId: $el.attr('data-property-id') || $el.attr('data-listing-id') || $el.attr('id') || undefined,
          url: this.resolveUrl($el.find('a').first().attr('href') || $el.parent().find('a').first().attr('href')),
          title: this.extractTitle($el),
          description: this.extractText($el, ['.description', '.summary', '.excerpt', '.overview']),
          acreage: this.parseAcreage(elementText),
          county: this.extractCounty(elementText),
          state: this.extractState(elementText),
          price: this.parsePrice(elementText),
          status: 'listed',
          photos: this.extractPhotos($el)
        }
        
        this.logger.debug(`Processing element with title: "${listing.title}", acreage: ${listing.acreage}, price: ${listing.price}`)
        
        // Calculate price per acre
        if (listing.price && listing.acreage && listing.acreage > 0) {
          listing.pricePerAcre = listing.price / listing.acreage
        }
        
        // Only add if we have minimum required data and meets criteria
        if (listing.title && listing.acreage > 0) {
          if (listing.acreage >= params.minAcreage && listing.acreage <= params.maxAcreage) {
            listings.push(listing)
            this.logger.debug(`Added listing: ${listing.title} - ${listing.acreage} acres`)
          } else {
            this.logger.debug(`Skipping listing outside acreage range: ${listing.title} - ${listing.acreage} acres`)
          }
        } else {
          this.logger.debug(`Skipping incomplete listing: ${listing.title || 'No title'} - ${listing.acreage} acres`)
        }
      })
      
    } catch (error) {
      searchTimer()
      this.logger.error('Hall & Hall Playwright search error:', error)
      throw new Error(`Failed to search Hall & Hall with Playwright: ${error}`)
    } finally {
      // Clean up page
      if (page) {
        await page.close()
      }
    }
    
    searchTimer()
    this.logger.info(`Search completed successfully`, { count: listings.length })
    return listings
  }
  
  async getDetails(url: string): Promise<ListingCandidate> {
    this.logger.info('Getting property details with Playwright', { url })
    const detailTimer = this.logger.startTimer('getDetails')
    
    let page: Page | null = null
    
    try {
      const browser = await this.getBrowser()
      page = await browser.newPage()
      
      await page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      })
      
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
      
      const content = await page.content()
      const $ = cheerio.load(content)
      
      const listing: ListingCandidate = {
        sourceId: this.sourceId,
        externalId: this.extractPropertyId($),
        url: url,
        title: $('h1').first().text().trim() || $('.property-title, .listing-title').first().text().trim(),
        description: $('.description, .overview, .summary').first().text().trim(),
        acreage: this.parseAcreage($('.acreage, .acres, .size').text() || $('body').text()),
        county: this.extractCounty($('.location, .address').text() || $('body').text()),
        state: this.extractState($('.location, .address').text() || $('body').text()),
        price: this.parsePrice($('.price, .cost').text() || $('body').text()),
        status: 'listed',
        photos: this.extractDetailPhotos($),
        address: $('.address, .location').first().text().trim() || undefined
      }
      
      if (listing.price && listing.acreage) {
        listing.pricePerAcre = listing.price / listing.acreage
      }
      
      detailTimer()
      this.logger.info('Property details retrieved successfully')
      return listing
      
    } catch (error) {
      detailTimer()
      this.logger.error('Hall & Hall details error:', error)
      throw new Error(`Failed to get Hall & Hall details: ${error}`)
    } finally {
      if (page) {
        await page.close()
      }
    }
  }
  
  // Utility methods
  private resolveUrl(href: string | undefined): string {
    if (!href) return ''
    if (href.startsWith('http')) return href
    if (href.startsWith('/')) return this.baseUrl + href
    return this.baseUrl + '/' + href
  }
  
  private extractText($el: cheerio.Cheerio<any>, selectors: string[]): string {
    for (const selector of selectors) {
      const text = $el.find(selector).first().text().trim()
      if (text) return text
    }
    return ''
  }
  
  private extractTitle($el: cheerio.Cheerio<any>): string {
    // Try multiple title extraction strategies
    const titleSelectors = [
      'h1', 'h2', 'h3', 'h4',
      '.title', '.property-title', '.listing-title', '.property-name', '.ranch-name',
      'a[href*="ranch"], a[href*="property"], a[href*="listing"]'
    ]
    
    for (const selector of titleSelectors) {
      const titleText = $el.find(selector).first().text().trim()
      if (titleText && titleText.length > 5 && !titleText.toLowerCase().includes('menu')) {
        return titleText
      }
    }
    
    // Fallback: look for text that looks like a title (capitalized words)
    const allText = $el.text()
    const sentences = allText.split(/[.\n]/)
    
    for (const sentence of sentences) {
      const trimmed = sentence.trim()
      if (trimmed.length > 10 && trimmed.length < 100) {
        // Check if it looks like a title (has capitalized words, includes property terms)
        if (/^[A-Z]/.test(trimmed) && /ranch|property|land|farm|acres/i.test(trimmed)) {
          return trimmed
        }
      }
    }
    
    return ''
  }
  
  private parseAcreage(text: string): number {
    const match = text.match(/(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:acres?|ac|±)/i)
    return match ? parseFloat(match[1].replace(/,/g, '')) : 0
  }
  
  private parsePrice(text: string): number | undefined {
    if (/request|contact/i.test(text)) return undefined
    const match = text.match(/\$(\d+(?:,\d{3})*(?:\.\d+)?)/i)
    return match ? parseFloat(match[1].replace(/,/g, '')) : undefined
  }
  
  private extractCounty(text: string): string {
    const parts = text.split(/[,\-]/)
    for (const part of parts) {
      if (/county/i.test(part)) {
        return part.replace(/county/i, '').trim()
      }
    }
    return parts[0]?.trim() || 'Unknown'
  }
  
  private extractState(text: string): string {
    const stateMatch = text.match(/\b([A-Z]{2})\b/)
    if (stateMatch) return stateMatch[1]
    
    const parts = text.split(',')
    return parts[parts.length - 1]?.trim() || 'Unknown'
  }
  
  private extractPhotos($el: cheerio.Cheerio<any>): string[] {
    const photos: string[] = []
    $el.find('img').each((i, img) => {
      const src = $el.find(img).attr('src') || $el.find(img).attr('data-src')
      if (src && !src.includes('logo') && !src.includes('icon')) {
        photos.push(src)
      }
    })
    return photos
  }
  
  private extractDetailPhotos($: cheerio.CheerioAPI): string[] {
    const photos: string[] = []
    $('.photo, .gallery img, .slideshow img, .property-photos img, img').each((i, img) => {
      const src = $(img).attr('src') || $(img).attr('data-src')
      if (src && !src.includes('placeholder') && !src.includes('logo')) {
        photos.push(src)
      }
    })
    return photos
  }
  
  private extractPropertyId($: cheerio.CheerioAPI): string | undefined {
    return $('[data-property-id]').attr('data-property-id') ||
           $('[data-listing-id]').attr('data-listing-id') ||
           $('.listing-id, .property-id').text().replace(/[^0-9]/g, '') ||
           undefined
  }
  
  async cleanup() {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
      this.logger.info('Browser closed')
    }
  }
}