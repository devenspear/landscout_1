import axios from 'axios'
import * as cheerio from 'cheerio'
import { CrawlerAdapter, ListingCandidate, SearchParams } from './types'
import { DebugLogger } from '../debug-logger'

export class LandWatchAdapter implements CrawlerAdapter {
  name = 'LandWatch'
  sourceId = 'landwatch'
  private baseUrl = 'https://www.landwatch.com'
  private logger: DebugLogger
  
  constructor() {
    this.logger = new DebugLogger('LandWatchAdapter')
  }
  
  async search(params: SearchParams): Promise<ListingCandidate[]> {
    const listings: ListingCandidate[] = []
    this.logger.info('Starting LandWatch search', params)
    const searchTimer = this.logger.startTimer('search')
    
    try {
      // First, visit homepage to establish session (avoid bot detection)
      this.logger.info('Establishing session by visiting homepage first')
      const sessionTimer = this.logger.startTimer('session-setup')
      
      try {
        await axios.get(this.baseUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
          },
          timeout: 10000
        })
        sessionTimer()
        this.logger.info('Session established successfully')
        
        // Wait a bit to seem more human-like
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (sessionError) {
        sessionTimer()
        this.logger.warn('Session setup failed, proceeding anyway', sessionError)
      }
      
      // Build search URL - use correct ASP.NET format
      const state = params.states[0]?.toLowerCase() || 'ga'
      
      // LandWatch uses ASP.NET query parameters
      // Start with simpler search to avoid anti-bot protection
      const urlParams = new URLSearchParams({
        'ct': 'r',
        'type': '13', // Start with basic land type
        'state': state,
        'pg': (params.page || 1).toString()
      })
      
      const searchUrls = [
        `${this.baseUrl}/default.aspx?${urlParams}`
      ]
      
      let response: any = null
      let lastError: any = null
      
      // Try different URL patterns until one works
      for (const searchUrl of searchUrls) {
        const fullUrl = searchUrl // URL already includes params
        this.logger.info(`Attempting request to: ${fullUrl}`)
        
        // Add delay between requests to avoid rate limiting
        if (searchUrls.indexOf(searchUrl) > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
        
        const requestTimer = this.logger.startTimer(`request-${searchUrls.indexOf(searchUrl)}`)
        
        try {
          response = await axios.get(fullUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.5',
              'Accept-Encoding': 'gzip, deflate',
              'DNT': '1',
              'Connection': 'keep-alive',
              'Upgrade-Insecure-Requests': '1'
            },
            timeout: 15000
          })
          
          requestTimer()
          this.logger.info(`Success! Status: ${response.status}, Size: ${response.data.length} bytes`)
          break
        } catch (error: any) {
          requestTimer()
          this.logger.warn(`Request failed`, {
            url: searchUrl,
            status: error.response?.status,
            message: error.message,
            code: error.code
          })
          lastError = error
          continue
        }
      }
      
      if (!response) {
        throw new Error(`All URLs failed. Last error: ${lastError?.response?.status || lastError?.message}`)
      }
      
      const $ = cheerio.load(response.data)
      
      // Parse listings from search results - try multiple selectors
      let propertyElements = $('.property-card')
      if (propertyElements.length === 0) {
        propertyElements = $('.listing-card, .property-item, .listing-item, [data-listing-id], .search-result')
      }
      if (propertyElements.length === 0) {
        propertyElements = $('.result-card, .land-listing, .property-row, .listing-row, [class*="property"], [class*="listing"]')
      }
      if (propertyElements.length === 0) {
        propertyElements = $('div[id*="property"], div[id*="listing"], article, .card')
      }
      
      this.logger.info(`Found ${propertyElements.length} property elements`)
      
      // Log page content for debugging if no elements found
      if (propertyElements.length === 0) {
        this.logger.warn('No property elements found. Page analysis:', {
          title: $('title').text(),
          bodyLength: $('body').text().length,
          hasAcresText: $('body').text().toLowerCase().includes('acres'),
          hasPropertyText: $('body').text().toLowerCase().includes('property'),
          commonElements: {
            divs: $('div').length,
            articles: $('article').length,
            cards: $('.card').length,
            results: $('.result').length
          }
        })
      }
      
      propertyElements.each((i, element) => {
        const $el = $(element)
        
        const listing: ListingCandidate = {
          sourceId: this.sourceId,
          externalId: $el.attr('data-property-id') || $el.attr('data-listing-id') || undefined,
          url: this.baseUrl + ($el.find('a.property-title').attr('href') || $el.find('a').first().attr('href') || ''),
          title: ($el.find('.property-title').text() || $el.find('h2, h3, .title').first().text()).trim(),
          description: ($el.find('.property-description').text() || $el.find('.description').text()).trim(),
          acreage: this.parseAcreage($el.find('.property-acres, .acres').text() || $el.text()),
          county: this.extractCounty($el.find('.property-location, .location').text() || $el.text()),
          state: this.extractState($el.find('.property-location, .location').text() || $el.text()),
          price: this.parsePrice($el.find('.property-price, .price').text() || $el.text()),
          status: 'listed',
          photos: this.extractPhotos($el)
        }
        
        // Calculate price per acre if we have price
        if (listing.price && listing.acreage) {
          listing.pricePerAcre = listing.price / listing.acreage
        }
        
        // Extract coordinates if available
        const lat = $el.attr('data-lat')
        const lon = $el.attr('data-lng')
        if (lat && lon) {
          listing.lat = parseFloat(lat)
          listing.lon = parseFloat(lon)
        }
        
        // Only add if we have minimum required data and meets acreage requirements
        if (listing.title && listing.acreage > 0 && listing.url) {
          // Apply client-side filtering for acreage since server-side filtering may trigger anti-bot
          if (listing.acreage >= params.minAcreage && listing.acreage <= params.maxAcreage) {
            listings.push(listing)
          } else {
            this.logger.debug(`Skipping listing outside acreage range: ${listing.title}, ${listing.acreage} acres`)
          }
        } else {
          this.logger.debug(`Skipping incomplete listing: ${listing.title || 'No title'}, ${listing.acreage} acres`)
        }
      })
      
    } catch (error) {
      searchTimer()
      this.logger.error('LandWatch search error:', error)
      throw new Error(`Failed to search LandWatch: ${error}`)
    }
    
    searchTimer()
    this.logger.info(`Search completed successfully`, { count: listings.length })
    return listings
  }
  
  async getDetails(url: string): Promise<ListingCandidate> {
    this.logger.info('Getting property details', { url })
    const detailTimer = this.logger.startTimer('getDetails')
    
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 30000
      })
      
      const $ = cheerio.load(response.data)
      
      // Extract detailed information
      const listing: ListingCandidate = {
        sourceId: this.sourceId,
        externalId: this.extractPropertyId($),
        url: url,
        title: $('h1.property-title').text().trim(),
        description: $('.property-description-full').text().trim(),
        acreage: this.parseAcreage($('.property-detail-acres').text()),
        county: this.extractCounty($('.property-location').text()),
        state: this.extractState($('.property-location').text()),
        price: this.parsePrice($('.property-price').text()),
        status: 'listed',
        photos: this.extractDetailPhotos($),
        apn: this.extractAPN($),
        address: $('.property-address').text().trim() || undefined
      }
      
      // Extract coordinates from map data
      const mapData = $('script:contains("propertyMapData")').html()
      if (mapData) {
        const latMatch = mapData.match(/latitude['":\s]+(-?\d+\.?\d*)/)
        const lonMatch = mapData.match(/longitude['":\s]+(-?\d+\.?\d*)/)
        if (latMatch && lonMatch) {
          listing.lat = parseFloat(latMatch[1])
          listing.lon = parseFloat(lonMatch[1])
        }
      }
      
      // Calculate price per acre
      if (listing.price && listing.acreage) {
        listing.pricePerAcre = listing.price / listing.acreage
      }
      
      detailTimer()
      this.logger.info('Property details retrieved successfully')
      return listing
      
    } catch (error) {
      detailTimer()
      this.logger.error('LandWatch details error:', error)
      throw new Error(`Failed to get LandWatch details: ${error}`)
    }
  }
  
  private parseAcreage(text: string): number {
    const match = text.match(/(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:acres?|ac)/i)
    return match ? parseFloat(match[1].replace(/,/g, '')) : 0
  }
  
  private parsePrice(text: string): number | undefined {
    const match = text.match(/\$(\d+(?:,\d{3})*(?:\.\d+)?)/i)
    return match ? parseFloat(match[1].replace(/,/g, '')) : undefined
  }
  
  private extractCounty(location: string): string {
    // Format typically: "County Name, State"
    const parts = location.split(',')
    return parts[0]?.replace(/County/i, '').trim() || 'Unknown'
  }
  
  private extractState(location: string): string {
    const parts = location.split(',')
    return parts[parts.length - 1]?.trim() || 'Unknown'
  }
  
  private extractPhotos($el: cheerio.CheerioAPI | cheerio.Cheerio<any>): string[] {
    const photos: string[] = []
    const isFullPage = '$' in $el
    
    if (isFullPage) {
      // Full page - extract from gallery
      ($el as cheerio.CheerioAPI)('.property-gallery img').each((i, img) => {
        const src = ($el as cheerio.CheerioAPI)(img).attr('src') || 
                   ($el as cheerio.CheerioAPI)(img).attr('data-src')
        if (src) photos.push(src)
      })
    } else {
      // Search result card
      const mainImg = ($el as cheerio.Cheerio<any>).find('img.property-image').attr('src')
      if (mainImg) photos.push(mainImg)
    }
    
    return photos
  }
  
  private extractDetailPhotos($: cheerio.CheerioAPI): string[] {
    const photos: string[] = []
    $('.gallery-image, .property-image').each((i, img) => {
      const src = $(img).attr('src') || $(img).attr('data-src')
      if (src && !src.includes('placeholder')) {
        photos.push(src)
      }
    })
    return photos
  }
  
  private extractPropertyId($: cheerio.CheerioAPI): string | undefined {
    // Try various selectors
    return $('[data-property-id]').attr('data-property-id') ||
           $('.property-id').text().replace(/[^0-9]/g, '') ||
           undefined
  }
  
  private extractAPN($: cheerio.CheerioAPI): string | undefined {
    const apnText = $('.property-detail:contains("APN"), .property-detail:contains("Parcel")')
      .text()
    const match = apnText.match(/APN[:\s]+([A-Z0-9-]+)/i)
    return match ? match[1] : undefined
  }
}