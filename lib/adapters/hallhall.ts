import axios from 'axios'
import * as cheerio from 'cheerio'
import { CrawlerAdapter, ListingCandidate, SearchParams } from './types'

export class HallAndHallAdapter implements CrawlerAdapter {
  name = 'Hall and Hall'
  sourceId = 'hallhall'
  private baseUrl = 'https://hallhall.com'
  
  async search(params: SearchParams): Promise<ListingCandidate[]> {
    const listings: ListingCandidate[] = []
    
    try {
      // Hall and Hall uses a different URL structure
      const searchUrl = `${this.baseUrl}/ranches-for-sale`
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        params: {
          'min_acres': params.minAcreage,
          'max_acres': params.maxAcreage,
          'states': params.states.join(','),
          'page': params.page || 1
        },
        timeout: 30000
      })
      
      const $ = cheerio.load(response.data)
      
      // Parse listings - Hall and Hall has a different structure
      $('.ranch-listing, .property-item').each((i, element) => {
        const $el = $(element)
        
        const listing: ListingCandidate = {
          sourceId: this.sourceId,
          externalId: $el.attr('data-listing-id') || undefined,
          url: this.baseUrl + $el.find('a.listing-link').attr('href'),
          title: $el.find('.listing-title, h2').text().trim(),
          description: $el.find('.listing-description, .summary').text().trim(),
          acreage: this.parseAcreage($el.find('.acres, .size').text()),
          county: this.extractCounty($el.find('.location').text()),
          state: this.extractState($el.find('.location').text()),
          price: this.parsePrice($el.find('.price').text()),
          status: 'listed',
          photos: this.extractPhotos($el)
        }
        
        // Calculate price per acre
        if (listing.price && listing.acreage) {
          listing.pricePerAcre = listing.price / listing.acreage
        }
        
        listings.push(listing)
      })
      
    } catch (error) {
      console.error('Hall and Hall search error:', error)
      // Return empty array instead of throwing - graceful degradation
      return []
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