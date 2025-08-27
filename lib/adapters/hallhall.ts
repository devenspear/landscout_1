import axios from 'axios'
import * as cheerio from 'cheerio'
import { CrawlerAdapter, ListingCandidate, SearchParams } from './types'
import { DebugLogger } from '../debug-logger'

export class HallAndHallAdapter implements CrawlerAdapter {
  name = 'Hall and Hall'
  sourceId = 'hallhall'
  private baseUrl = 'https://hallhall.com'
  private logger: DebugLogger
  
  constructor() {
    this.logger = new DebugLogger('HallHallAdapter')
  }
  
  async search(params: SearchParams): Promise<ListingCandidate[]> {
    const listings: ListingCandidate[] = []
    this.logger.info('Starting Hall & Hall search', params)
    const searchTimer = this.logger.startTimer('search')
    
    try {
      // First test basic connectivity
      this.logger.info('Testing basic connectivity to Hall & Hall')
      const connectTimer = this.logger.startTimer('connectivity')
      
      const testResponse = await axios.get(this.baseUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        timeout: 10000
      })
      
      connectTimer()
      this.logger.info(`Connectivity test successful: ${testResponse.status}`, { 
        contentLength: testResponse.data?.length,
        title: testResponse.data?.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]
      })
      
      // Now try the search
      const searchUrl = `${this.baseUrl}/ranches-for-sale`
      this.logger.info(`Attempting search request to: ${searchUrl}`)
      const requestTimer = this.logger.startTimer('search-request')
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Connection': 'keep-alive'
        },
        params: {
          'min_acres': params.minAcreage,
          'max_acres': params.maxAcreage,
          'states': params.states.join(','),
          'page': params.page || 1
        },
        timeout: 15000
      })
      
      requestTimer()
      this.logger.info(`Search request successful: ${response.status}`, { 
        contentLength: response.data?.length 
      })
      
      const $ = cheerio.load(response.data)
      
      // Parse listings - try multiple selector patterns
      let propertyElements = $('.ranch-listing, .property-item')
      if (propertyElements.length === 0) {
        propertyElements = $('.listing-card, .property-card, .ranch-card, [data-listing], .result')
      }
      if (propertyElements.length === 0) {
        propertyElements = $('div[class*="listing"], div[class*="property"], div[class*="ranch"], article')
      }
      
      this.logger.info(`Found ${propertyElements.length} property elements`)
      
      // Log page analysis if no elements found
      if (propertyElements.length === 0) {
        this.logger.warn('No property elements found. Page analysis:', {
          title: $('title').text(),
          bodyLength: $('body').text().length,
          hasRanchText: $('body').text().toLowerCase().includes('ranch'),
          hasAcresText: $('body').text().toLowerCase().includes('acres'),
          commonElements: {
            divs: $('div').length,
            articles: $('article').length,
            cards: $('.card').length,
            listings: $('[class*="listing"]').length
          }
        })
      }
      
      propertyElements.each((i, element) => {
        const $el = $(element)
        
        const listing: ListingCandidate = {
          sourceId: this.sourceId,
          externalId: $el.attr('data-listing-id') || undefined,
          url: this.baseUrl + ($el.find('a.listing-link').attr('href') || $el.find('a').first().attr('href') || ''),
          title: ($el.find('.listing-title, h2, h3, .title').first().text() || $el.find('a').first().text()).trim(),
          description: ($el.find('.listing-description, .summary, .description').first().text()).trim(),
          acreage: this.parseAcreage($el.find('.acres, .size, .acreage').text() || $el.text()),
          county: this.extractCounty($el.find('.location, .address').text() || $el.text()),
          state: this.extractState($el.find('.location, .address').text() || $el.text()),
          price: this.parsePrice($el.find('.price, .cost').text() || $el.text()),
          status: 'listed',
          photos: this.extractPhotos($el)
        }
        
        // Calculate price per acre
        if (listing.price && listing.acreage) {
          listing.pricePerAcre = listing.price / listing.acreage
        }
        
        // Only add if we have minimum required data and meets acreage requirements
        if (listing.title && listing.acreage > 0 && listing.url) {
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
      this.logger.error('Hall & Hall search error:', error)
      throw new Error(`Failed to search Hall & Hall: ${error}`)
    }
    
    searchTimer()
    this.logger.info(`Search completed successfully`, { count: listings.length })
    return listings
  }
  
  async getDetails(url: string): Promise<ListingCandidate> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 30000
      })
      
      const $ = cheerio.load(response.data)
      
      const listing: ListingCandidate = {
        sourceId: this.sourceId,
        externalId: this.extractListingId($),
        url: url,
        title: $('h1.property-name, .listing-title').text().trim(),
        description: $('.property-description, .overview').text().trim(),
        acreage: this.parseAcreage($('.property-acres, .acreage').text()),
        county: this.extractCounty($('.property-location').text()),
        state: this.extractState($('.property-location').text()),
        price: this.parsePrice($('.property-price, .listing-price').text()),
        status: 'listed',
        photos: this.extractDetailPhotos($),
        address: $('.property-address').text().trim() || undefined
      }
      
      // Extract coordinates if available
      const mapScript = $('script:contains("lat")').html()
      if (mapScript) {
        const latMatch = mapScript.match(/lat['":\s]+(-?\d+\.?\d*)/)
        const lngMatch = mapScript.match(/lng['":\s]+(-?\d+\.?\d*)/)
        if (latMatch && lngMatch) {
          listing.lat = parseFloat(latMatch[1])
          listing.lon = parseFloat(lngMatch[1])
        }
      }
      
      if (listing.price && listing.acreage) {
        listing.pricePerAcre = listing.price / listing.acreage
      }
      
      return listing
      
    } catch (error) {
      console.error('Hall and Hall details error:', error)
      throw new Error(`Failed to get Hall and Hall details: ${error}`)
    }
  }
  
  private parseAcreage(text: string): number {
    const match = text.match(/(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:acres?|ac|±)/i)
    return match ? parseFloat(match[1].replace(/,/g, '')) : 0
  }
  
  private parsePrice(text: string): number | undefined {
    // Handle "Price upon request" or "Contact for price"
    if (/request|contact/i.test(text)) {
      return undefined
    }
    const match = text.match(/\$(\d+(?:,\d{3})*(?:\.\d+)?)/i)
    return match ? parseFloat(match[1].replace(/,/g, '')) : undefined
  }
  
  private extractCounty(location: string): string {
    // Hall and Hall might use different location formats
    const parts = location.split(/[,\-]/)
    for (const part of parts) {
      if (/county/i.test(part)) {
        return part.replace(/county/i, '').trim()
      }
    }
    return parts[0]?.trim() || 'Unknown'
  }
  
  private extractState(location: string): string {
    // Extract two-letter state code
    const stateMatch = location.match(/\b([A-Z]{2})\b/)
    if (stateMatch) return stateMatch[1]
    
    // Or extract from end of location string
    const parts = location.split(',')
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
    
    $('.photo-gallery img, .slideshow img, .property-photos img').each((i, img) => {
      const src = $(img).attr('src') || $(img).attr('data-src')
      if (src && !src.includes('placeholder') && !src.includes('logo')) {
        photos.push(src)
      }
    })
    
    return photos
  }
  
  private extractListingId($: cheerio.CheerioAPI): string | undefined {
    return $('[data-listing-id]').attr('data-listing-id') ||
           $('.listing-id, .property-id').text().replace(/[^0-9]/g, '') ||
           undefined
  }
}