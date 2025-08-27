import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

export async function POST(req: NextRequest) {
  try {
    const { url = 'https://www.landwatch.com' } = await req.json()
    
    console.log(`Testing connectivity to: ${url}`)
    const startTime = Date.now()
    
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        validateStatus: function (status) {
          return status < 500 // Accept anything less than 500
        }
      })
      
      const duration = Date.now() - startTime
      
      return NextResponse.json({
        success: true,
        url,
        status: response.status,
        statusText: response.statusText,
        duration,
        headers: response.headers,
        contentLength: response.data.length,
        contentType: response.headers['content-type'],
        title: response.data.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || 'No title found',
        isBlocked: response.status === 403 || response.status === 429,
        hasContent: response.data.length > 1000,
        sampleContent: response.data.substring(0, 200)
      })
      
    } catch (error: any) {
      const duration = Date.now() - startTime
      
      return NextResponse.json({
        success: false,
        url,
        error: {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          statusText: error.response?.statusText,
          duration,
          isTimeout: error.code === 'ECONNABORTED',
          isNetworkError: error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND',
          isBlocked: error.response?.status === 403 || error.response?.status === 429
        }
      })
    }
    
  } catch (error) {
    console.error('Connectivity test error:', error)
    return NextResponse.json(
      { error: 'Test failed', message: (error as Error).message },
      { status: 500 }
    )
  }
}

export async function GET() {
  // Test multiple URLs
  const testUrls = [
    'https://www.landwatch.com',
    'https://www.landwatch.com/georgia/land',
    'https://www.landwatch.com/land/georgia',
    'https://www.land.com',
    'https://www.landandfarm.com'
  ]
  
  const results = []
  
  for (const url of testUrls) {
    try {
      const response = await axios.get(url, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        validateStatus: () => true
      })
      
      results.push({
        url,
        success: true,
        status: response.status,
        size: response.data.length,
        title: response.data.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || 'No title'
      })
    } catch (error: any) {
      results.push({
        url,
        success: false,
        error: error.message,
        code: error.code
      })
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  return NextResponse.json({ results })
}