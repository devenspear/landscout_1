const { HallAndHallPlaywrightAdapter } = require('../lib/adapters/hallhall-playwright')

async function testPlaywright() {
  console.log('🎭 Testing basic Playwright functionality...')
  
  try {
    const adapter = new HallAndHallPlaywrightAdapter()
    
    console.log('✅ Adapter created successfully')
    console.log(`   Name: ${adapter.name}`)
    console.log(`   Source ID: ${adapter.sourceId}`)
    
    // Test search with minimal parameters
    console.log('\n🔍 Running search test...')
    const results = await adapter.search({
      states: ['GA'],
      minAcreage: 100,
      maxAcreage: 500,
      page: 1
    })
    
    console.log(`✅ Search completed`)
    console.log(`   Results: ${results.length} properties`)
    
    if (results.length > 0) {
      console.log(`   First result: ${results[0].title}`)
      console.log(`   Acreage: ${results[0].acreage}`)
      console.log(`   Price: ${results[0].price}`)
    }
    
    // Clean up
    await adapter.cleanup()
    console.log('✅ Cleanup completed')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('   Stack:', error.stack)
  }
}

testPlaywright()