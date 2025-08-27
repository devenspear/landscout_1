const axios = require('axios')
const cheerio = require('cheerio')

async function detailedAnalysis() {
  console.log('🔍 Detailed Hall & Hall analysis...')
  
  try {
    const response = await axios.get('https://hallhall.com/ranches-for-sale', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 15000
    })
    
    const $ = cheerio.load(response.data)
    
    // Look for script tags that might contain data
    console.log('📜 JavaScript analysis:')
    $('script').each((i, script) => {
      const scriptContent = $(script).html() || ''
      if (scriptContent.includes('property') || scriptContent.includes('listing') || scriptContent.includes('ranch')) {
        console.log(`   Script ${i + 1} contains property data (${scriptContent.length} chars)`)
        if (scriptContent.includes('application/json') || scriptContent.includes('"properties"') || scriptContent.includes('"listings"')) {
          console.log(`   ⭐ Script ${i + 1} might contain JSON data`)
        }
      }
    })
    
    // Look for data attributes
    console.log('\n🏷️  Data attributes:')
    $('[data-*]').each((i, el) => {
      const attrs = el.attribs
      for (const [key, value] of Object.entries(attrs)) {
        if (key.startsWith('data-') && (value.includes('property') || value.includes('ranch') || value.includes('listing'))) {
          console.log(`   ${key}: ${value}`)
        }
      }
    })
    
    // Look for specific div structures that might contain listings
    console.log('\n🏗️  Potential listing containers:')
    $('div').each((i, div) => {
      const $div = $(div)
      const text = $div.text().toLowerCase()
      if (text.includes('acres') && text.includes('$') && text.length < 500) {
        console.log(`   Potential listing div: ${$div.attr('class') || 'no-class'}`)
        console.log(`   Text: ${text.substring(0, 150)}...`)
        console.log(`   Children: ${$div.children().length}`)
        console.log('   ---')
      }
    })
    
    // Check if it's a React/Vue app
    console.log('\n⚛️  Frontend framework detection:')
    const hasReact = $('script[src*="react"]').length > 0 || $('[data-reactroot]').length > 0
    const hasVue = $('script[src*="vue"]').length > 0 || $('[data-v-]').length > 0
    const hasNext = $('script[src*="next"]').length > 0 || $('script').text().includes('__NEXT_DATA__')
    
    console.log(`   React: ${hasReact}`)
    console.log(`   Vue: ${hasVue}`)
    console.log(`   Next.js: ${hasNext}`)
    
    // Check for __NEXT_DATA__ or similar
    $('script').each((i, script) => {
      const content = $(script).html() || ''
      if (content.includes('__NEXT_DATA__') || content.includes('window.__INITIAL')) {
        console.log('   ⭐ Found client-side data script')
      }
    })
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

detailedAnalysis()