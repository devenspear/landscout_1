import { NextRequest, NextResponse } from 'next/server'
import { getAdapter } from '@/lib/adapters'

export async function POST(request: NextRequest) {
  try {
    const { sourceId, testParams } = await request.json()
    
    console.log(`Testing source: ${sourceId}`)
    
    // Get the adapter
    const adapter = getAdapter(sourceId)
    if (!adapter) {
      return NextResponse.json(
        { success: false, error: `No adapter found for ${sourceId}` },
        { status: 400 }
      )
    }
    
    // Test search with minimal params
    const searchParams = {
      states: testParams?.states || ['GA'],
      minAcreage: testParams?.minAcreage || 100,
      maxAcreage: testParams?.maxAcreage || 500,
      page: 1
    }
    
    console.log('Search params:', searchParams)
    
    // Run the search with timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Search timeout after 30 seconds')), 30000)
    )
    
    const searchPromise = adapter.search(searchParams)
    
    const results = await Promise.race([searchPromise, timeoutPromise]) as any[]
    
    console.log(`Found ${results.length} results from ${adapter.name}`)
    
    // Return summary and first few results
    return NextResponse.json({
      success: true,
      source: adapter.name,
      totalFound: results.length,
      searchParams,
      sampleResults: results.slice(0, 3).map(r => ({
        title: r.title,
        acreage: r.acreage,
        price: r.price,
        county: r.county,
        state: r.state,
        url: r.url
      })),
      fullResults: results.slice(0, 5) // Send first 5 full results
    })
    
  } catch (error: any) {
    console.error('Source test error:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.stack
    }, { status: 500 })
  }
}