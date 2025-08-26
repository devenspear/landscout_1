import axios from 'axios'
import * as cheerio from 'cheerio'
import { CrawlerAdapter, ListingCandidate, SearchParams } from './types'

export class LandWatchAdapter implements CrawlerAdapter {
  name = 'LandWatch'
  sourceId = 'landwatch'
  private baseUrl = 'https://www.landwatch.com'
  
  async search(params: SearchParams): Promise<ListingCandidate[]> {
    const listings: ListingCandidate[] = []
    
    try {
      // Build search URL
      const stateQuery = params.states.map(s => s.toLowerCase()).join(',')
      const searchUrl = `${this.baseUrl}/${stateQuery}/land`
      
      // Add filters
      const urlParams = new URLSearchParams({
        minacres: params.minAcreage.toString(),
        maxacres: params.maxAcreage.toString(),
        page: (params.page || 1).toString()
      })
      
      const response = await axios.get(`${searchUrl}?${urlParams}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 30000
      })
      
      const $ = cheerio.load(response.data)
      
      // Parse listings from search results
      $('.property-card').each((i, element) => {
        const $el = $(element)
        
        const listing: ListingCandidate = {
          sourceId: this.sourceId,
          externalId: $el.attr('data-property-id') || undefined,
          url: this.baseUrl + $el.find('a.property-title').attr('href'),
          title: $el.find('.property-title').text().trim(),
          description: $el.find('.property-description').text().trim(),
          acreage: this.parseAcreage($el.find('.property-acres').text()),
          county: this.extractCounty($el.find('.property-location').text()),
          state: this.extractState($el.find('.property-location').text()),
          price: this.parsePrice($el.find('.property-price').text()),
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
        
        listings.push(listing)
      })
      
    } catch (error) {
      console.error('LandWatch search error:', error)
      throw new Error(`Failed to search LandWatch: ${error}`)
    }
    
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
      
      return listing
      
    } catch (error) {
      console.error('LandWatch details error:', error)
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
      const mainImg = $el.find('img.property-image').attr('src')
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