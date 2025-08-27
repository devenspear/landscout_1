const axios = require('axios')
const cheerio = require('cheerio')

async function analyzeHallHall() {
  console.log('🔍 Analyzing Hall & Hall website structure...')
  
  try {
    const response = await axios.get('https://hallhall.com/ranches-for-sale?min_acres=100&max_acres=500&page=1', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 15000
    })
    
    console.log(`✅ Response: ${response.status} - ${response.data.length} bytes`)
    
    const $ = cheerio.load(response.data)
    console.log(`📄 Title: ${$('title').text()}`)
    
    // Look for common property/listing patterns
    const patterns = [
      '.ranch-listing',
      '.property-item', 
      '.listing-card',
      '.property-card',
      '.ranch-card',
      '[data-listing]',
      '.result',
      'div[class*="listing"]',
      'div[class*="property"]',
      'div[class*="ranch"]',
      'article',
      '.card'
    ]
    
    console.log('🏠 Looking for property elements...')
    for (const pattern of patterns) {
      const elements = $(pattern)
      if (elements.length > 0) {
        console.log(`   ✅ Found ${elements.length} elements with selector: ${pattern}`)
        
        // Analyze first element
        const first = elements.first()
        console.log(`   📝 First element classes: ${first.attr('class') || 'none'}`)
        console.log(`   📝 First element ID: ${first.attr('id') || 'none'}`)
        console.log(`   📝 First element text snippet: ${first.text().substring(0, 200)}...`)
        
        // Look for links
        const links = first.find('a')
        console.log(`   🔗 Links in first element: ${links.length}`)
        if (links.length > 0) {
          console.log(`   🔗 First link href: ${links.first().attr('href')}`)
          console.log(`   🔗 First link text: ${links.first().text().trim()}`)
        }
        break
      } else {
        console.log(`   ❌ No elements found for: ${pattern}`)
      }
    }
    
    // Look for specific text patterns
    const bodyText = $('body').text().toLowerCase()
    console.log('📊 Page content analysis:')
    console.log(`   - Contains "ranch": ${bodyText.includes('ranch')}`)
    console.log(`   - Contains "acres": ${bodyText.includes('acres')}`) 
    console.log(`   - Contains "property": ${bodyText.includes('property')}`)
    console.log(`   - Contains "listing": ${bodyText.includes('listing')}`)
    console.log(`   - Contains "$": ${bodyText.includes('$')}`)
    
    console.log(`📈 HTML structure:`)
    console.log(`   - Total divs: ${$('div').length}`)
    console.log(`   - Total articles: ${$('article').length}`)
    console.log(`   - Total cards (.card): ${$('.card').length}`)
    console.log(`   - Elements with "listing" in class: ${$('[class*="listing"]').length}`)
    console.log(`   - Elements with "ranch" in class: ${$('[class*="ranch"]').length}`)
    console.log(`   - Elements with "property" in class: ${$('[class*="property"]').length}`)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

analyzeHallHall()