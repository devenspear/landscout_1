#!/usr/bin/env node

/**
 * Local scraper testing script
 * Run with: node scripts/test-scrapers.js
 */

const axios = require('axios')
const cheerio = require('cheerio')

// Test configuration
const TEST_CONFIG = {
  timeout: 20000,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

// Sites to test
const SITES = [
  {
    name: 'LandWatch',
    urls: [
      'https://www.landwatch.com/',
      'https://www.landwatch.com/georgia/land',
      'https://www.landwatch.com/land/filter-state/GA',
      'https://www.landwatch.com/United-States/land'
    ]
  },
  {
    name: 'Hall and Hall',
    urls: [
      'https://hallhall.com/',
      'https://hallhall.com/ranches-for-sale/',
      'https://hallhall.com/property-search/'
    ]
  },
  {
    name: 'Land.com',
    urls: [
      'https://www.land.com/',
      'https://www.land.com/georgia/',
      'https://www.land.com/search/GA'
    ]
  },
  {
    name: 'LandAndFarm',
    urls: [
      'https://www.landandfarm.com/',
      'https://www.landandfarm.com/search/GA/',
      'https://www.landandfarm.com/search/Georgia-land-for-sale/'
    ]
  }
]

async function testUrl(url) {
  const startTime = Date.now()
  
  try {
    const response = await axios.get(url, {
      timeout: TEST_CONFIG.timeout,
      headers: {
        'User-Agent': TEST_CONFIG.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      validateStatus: function (status) {
        return status < 500 // Resolve only if the status code is less than 500
      }
    })
    
    const duration = Date.now() - startTime
    const $ = cheerio.load(response.data)
    
    // Try to find property/listing indicators
    const indicators = {
      hasProperties: false,
      propertyCount: 0,
      selectors: []
    }
    
    // Common selectors for property listings
    const propertySelectors = [
      '.property-card', '.listing-card', '.property-item', '.listing-item',
      '[class*="property"]', '[class*="listing"]', '[data-listing]',
      '.search-result', '.result-item', '.land-listing'
    ]
    
    for (const selector of propertySelectors) {
      const elements = $(selector)
      if (elements.length > 0) {
        indicators.hasProperties = true
        indicators.propertyCount += elements.length
        indicators.selectors.push(`${selector} (${elements.length})`)
      }
    }
    
    // Check for common property terms
    const bodyText = $('body').text().toLowerCase()
    const hasPropertyTerms = bodyText.includes('acres') || 
                            bodyText.includes('property') || 
                            bodyText.includes('land for sale')
    
    return {
      url,
      status: response.status,
      duration,
      size: response.data.length,
      title: $('title').text().trim(),
      hasProperties: indicators.hasProperties || hasPropertyTerms,
      propertyCount: indicators.propertyCount,
      selectors: indicators.selectors,
      headers: response.headers,
      success: true
    }
    
  } catch (error) {
    const duration = Date.now() - startTime
    
    return {
      url,
      status: error.response?.status || 'ERROR',
      duration,
      error: error.message,
      code: error.code,
      success: false
    }
  }
}

async function runTests() {
  console.log('🔍 Starting Scraper Tests\n')
  console.log('Configuration:')
  console.log(`  Timeout: ${TEST_CONFIG.timeout}ms`)
  console.log(`  User-Agent: ${TEST_CONFIG.userAgent.substring(0, 50)}...`)
  console.log('\n' + '='.repeat(80) + '\n')
  
  const results = []
  
  for (const site of SITES) {
    console.log(`\n📍 Testing ${site.name}`)
    console.log('-'.repeat(40))
    
    for (const url of site.urls) {
      process.stdout.write(`  Testing: ${url.substring(0, 60)}... `)
      const result = await testUrl(url)
      results.push({ site: site.name, ...result })
      
      if (result.success) {
        console.log(`✅ ${result.status} (${result.duration}ms)`)
        if (result.hasProperties) {
          console.log(`    └─ Found properties: ${result.propertyCount} listings`)
        } else {
          console.log(`    └─ ⚠️  No property listings detected`)
        }
      } else {
        console.log(`❌ ${result.status} - ${result.error}`)
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(80))
  console.log('\n📊 SUMMARY\n')
  
  const summary = {
    total: results.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    withProperties: results.filter(r => r.hasProperties).length,
    avgDuration: Math.round(
      results.filter(r => r.success).reduce((sum, r) => sum + r.duration, 0) / 
      results.filter(r => r.success).length
    )
  }
  
  console.log(`Total URLs tested: ${summary.total}`)
  console.log(`Successful: ${summary.successful} (${Math.round(summary.successful/summary.total*100)}%)`)
  console.log(`Failed: ${summary.failed}`)
  console.log(`With Properties: ${summary.withProperties}`)
  console.log(`Average Response Time: ${summary.avgDuration}ms`)
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS\n')
  
  const failedSites = [...new Set(results.filter(r => !r.success).map(r => r.site))]
  if (failedSites.length > 0) {
    console.log(`⚠️  Failed sites need attention: ${failedSites.join(', ')}`)
  }
  
  const slowSites = results.filter(r => r.success && r.duration > 5000)
  if (slowSites.length > 0) {
    console.log(`⚠️  Slow responses (>5s): ${[...new Set(slowSites.map(r => r.site))].join(', ')}`)
  }
  
  const noProperties = results.filter(r => r.success && !r.hasProperties)
  if (noProperties.length > 0) {
    console.log(`⚠️  URLs without detected properties: ${noProperties.length}`)
    noProperties.slice(0, 3).forEach(r => {
      console.log(`    - ${r.url}`)
    })
  }
  
  // Save results to file
  const fs = require('fs')
  const resultsFile = `scraper-test-results-${new Date().toISOString().split('T')[0]}.json`
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2))
  console.log(`\n📁 Detailed results saved to: ${resultsFile}`)
}

// Run the tests
runTests().catch(console.error)