// Quick test script to check LandWatch HTML structure
import axios from 'axios';
import * as cheerio from 'cheerio';

async function testLandWatch() {
  try {
    console.log('Testing LandWatch structure...');
    
    const response = await axios.get('https://www.landwatch.com/georgia/land', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);
    
    console.log('Page title:', $('title').text());
    console.log('Total page length:', response.data.length);
    
    // Test our selectors
    const propertyCards = $('.property-card');
    console.log('Property cards found:', propertyCards.length);
    
    // Check for common listing containers
    const alternativeSelectors = [
      '.listing-card',
      '.property-item', 
      '.listing-item',
      '[data-listing-id]',
      '.search-result',
      '.result-item'
    ];
    
    alternativeSelectors.forEach(selector => {
      const count = $(selector).length;
      if (count > 0) {
        console.log(`Found ${count} elements with selector: ${selector}`);
      }
    });
    
    // Look for any repeating patterns
    const allDivs = $('div[class*="card"], div[class*="listing"], div[class*="property"], div[class*="result"]');
    console.log('Potential listing divs:', allDivs.length);
    
    // Sample first few class names to understand structure
    allDivs.slice(0, 10).each((i, el) => {
      console.log(`Element ${i+1} classes:`, $(el).attr('class'));
    });

  } catch (error) {
    console.error('Error testing LandWatch:', error.message);
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Headers:', error.response.headers);
    }
  }
}

testLandWatch();