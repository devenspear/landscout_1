import { NextRequest, NextResponse } from 'next/server'
import { getAdapter } from '@/lib/adapters'
import { DebugLogger } from '@/lib/debug-logger'

export async function POST(req: NextRequest) {
  const logger = new DebugLogger('AdapterTest')
  
  try {
    const { adapterId, testMode = 'basic' } = await req.json()
    
    if (!adapterId) {
      return NextResponse.json({ error: 'adapterId is required' }, { status: 400 })
    }
    
    logger.info(`Testing adapter: ${adapterId}`, { testMode })
    
    // Get the adapter
    const adapter = getAdapter(adapterId)
    if (!adapter) {
      logger.error(`Adapter not found: ${adapterId}`)
      return NextResponse.json({ error: `Adapter not found: ${adapterId}` }, { status: 404 })
    }
    
    logger.info(`Adapter loaded: ${adapter.name}`)
    
    // Prepare test search parameters
    const testParams = {
      states: ['GA'], // Start with Georgia as test
      minAcreage: 100,
      maxAcreage: 500,
      page: 1
    }
    
    logger.info('Starting search with params', testParams)
    const searchTimer = logger.startTimer('adapter.search')
    
    let results: any[] = []
    let searchError: any = null
    
    try {
      // Run the search
      results = await adapter.search(testParams)
      searchTimer()
      
      logger.info(`Search completed. Found ${results.length} listings`)
      
      // Analyze results
      const analysis = {
        count: results.length,
        hasPrice: results.filter(r => r.price).length,
        hasAcreage: results.filter(r => r.acreage).length,
        hasLocation: results.filter(r => r.county || r.state).length,
        hasCoordinates: results.filter(r => r.lat && r.lon).length,
        hasPhotos: results.filter(r => r.photos && r.photos.length > 0).length,
        samples: results.slice(0, 3) // First 3 results as samples
      }
      
      logger.info('Results analysis', analysis)
      
      // Test individual property details (optional)
      if (testMode === 'detailed' && results.length > 0) {
        const detailTimer = logger.startTimer('getDetails')
        try {
          const details = await adapter.getDetails(results[0].url)
          detailTimer()
          logger.info('Detail fetch successful', {
            hasDescription: !!details.description,
            descriptionLength: details.description?.length,
            hasApn: !!details.apn,
            hasAddress: !!details.address
          })
        } catch (detailError) {
          detailTimer()
          logger.error('Detail fetch failed', detailError)
        }
      }
      
    } catch (error: any) {
      searchTimer()
      searchError = {
        message: error.message,
        code: error.code,
        response: error.response?.status
      }
      logger.error('Search failed', searchError)
    }
    
    // Get all logs
    const summary = logger.getSummary()
    
    return NextResponse.json({
      adapter: {
        id: adapterId,
        name: adapter.name,
        sourceId: adapter.sourceId
      },
      testParams,
      results: {
        success: !searchError,
        count: results.length,
        data: results.slice(0, 5), // Return first 5 for inspection
        error: searchError
      },
      logs: summary,
      recommendations: generateRecommendations(summary, results, searchError)
    })
    
  } catch (error) {
    logger.error('Test endpoint error', error)
    return NextResponse.json(
      { 
        error: 'Test failed',
        message: (error as Error).message,
        logs: logger.getSummary()
      },
      { status: 500 }
    )
  }
}

function generateRecommendations(summary: any, results: any[], error: any) {
  const recommendations = []
  
  if (error) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      recommendations.push('Increase timeout duration')
      recommendations.push('Check if website is blocking requests')
      recommendations.push('Consider using proxy service')
    }
    if (error.response === 403) {
      recommendations.push('Website is blocking requests - need better headers')
      recommendations.push('Implement request delays')
      recommendations.push('Consider rotating User-Agent strings')
    }
    if (error.response === 404) {
      recommendations.push('URL structure may have changed')
      recommendations.push('Update search URL patterns')
    }
  }
  
  if (results.length === 0 && !error) {
    recommendations.push('HTML structure may have changed')
    recommendations.push('Update CSS selectors in adapter')
    recommendations.push('Check if website requires JavaScript rendering')
  }
  
  if (results.length > 0) {
    const quality = {
      price: results.filter(r => r.price).length / results.length,
      acreage: results.filter(r => r.acreage).length / results.length,
      location: results.filter(r => r.county).length / results.length
    }
    
    if (quality.price < 0.5) {
      recommendations.push('Price extraction needs improvement')
    }
    if (quality.acreage < 0.5) {
      recommendations.push('Acreage parsing needs improvement')
    }
    if (quality.location < 0.5) {
      recommendations.push('Location extraction needs improvement')
    }
  }
  
  if (summary.hasErrors) {
    recommendations.push('Review error logs for specific issues')
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Adapter is working correctly!')
  }
  
  return recommendations
}

// GET method to list available adapters
export async function GET() {
  const adapters = [
    { id: 'landwatch', name: 'LandWatch', status: 'partial' },
    { id: 'hallhall', name: 'Hall and Hall', status: 'partial' },
    { id: 'landandfarm', name: 'Land And Farm', status: 'stub' },
    { id: 'landsofamerica', name: 'Lands of America', status: 'stub' },
    { id: 'whitetail', name: 'Whitetail Properties', status: 'stub' },
    { id: 'unitedcountry', name: 'United Country', status: 'stub' },
    { id: 'landleader', name: 'LandLeader', status: 'stub' },
    { id: 'masonmorse', name: 'Mason & Morse Ranch', status: 'stub' },
    { id: 'afm', name: 'AFM Real Estate', status: 'stub' },
    { id: 'peoples', name: 'Peoples Company', status: 'stub' },
    { id: 'nai', name: 'NAI Land', status: 'stub' },
    { id: 'crexi', name: 'Crexi', status: 'stub' },
    { id: 'loopnet', name: 'LoopNet', status: 'stub' }
  ]
  
  return NextResponse.json({ adapters })
}