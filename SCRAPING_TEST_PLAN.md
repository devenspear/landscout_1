# LandScout Website Scraping Test Plan

## Overview
This document outlines a comprehensive test plan for the website scraping functionality of LandScout.

## Current Architecture
- **Primary Scanner**: `LandScanner` class (`/lib/jobs/scanner.ts`)
- **Adapters**: Individual website adapters in `/lib/adapters/`
  - LandWatch (partially implemented)
  - HallAndHall (partially implemented)
  - Others (stub implementations)

## Test Objectives
1. Verify connectivity to target websites
2. Test data extraction accuracy
3. Validate rate limiting compliance
4. Ensure error handling and recovery
5. Monitor performance and success rates

## Phase 1: Adapter Testing (Individual)

### 1.1 LandWatch Adapter
- [ ] Test base URL connectivity
- [ ] Verify search URL patterns
- [ ] Test property listing extraction
- [ ] Validate data parsing (price, acreage, location)
- [ ] Check image URL extraction
- [ ] Test pagination handling

### 1.2 HallAndHall Adapter  
- [ ] Test base URL connectivity
- [ ] Verify search functionality
- [ ] Test property data extraction
- [ ] Validate high-value property handling

### 1.3 Stub Adapters
- [ ] Identify which need implementation
- [ ] Prioritize based on data availability

## Phase 2: Integration Testing

### 2.1 Scanner Pipeline
- [ ] Test config initialization
- [ ] Verify source activation
- [ ] Test concurrent adapter execution
- [ ] Validate rate limiting
- [ ] Check database persistence

### 2.2 Error Scenarios
- [ ] Network timeouts
- [ ] Invalid HTML responses
- [ ] Rate limit violations
- [ ] Database connection issues
- [ ] Malformed data handling

## Phase 3: Performance Testing

### 3.1 Metrics to Monitor
- Response times per adapter
- Success/failure rates
- Data quality scores
- Memory usage
- Database write performance

### 3.2 Load Testing
- Concurrent adapter execution
- Database transaction handling
- Memory leak detection

## Test Data Requirements

### Search Parameters
```json
{
  "states": ["GA", "VA", "NC", "SC", "FL", "AL"],
  "minAcreage": 100,
  "maxAcreage": 1000,
  "priceRange": "any"
}
```

### Expected Results
- Minimum 5-10 properties per source
- Complete property data (price, acreage, location)
- Valid image URLs
- Accurate geographic coordinates (when available)

## Debugging Tools Needed

1. **Request Logger**: Track all HTTP requests/responses
2. **Data Validator**: Verify extracted data quality
3. **Performance Monitor**: Track timing and resource usage
4. **Error Reporter**: Detailed error logging with context
5. **Test Dashboard**: Visual monitoring interface

## Success Criteria

### Adapter Level
- 80%+ success rate for HTTP requests
- 90%+ data extraction accuracy
- <5 second average response time
- Proper rate limit compliance

### System Level
- Successful scan completion
- Data persisted to database
- No memory leaks
- Graceful error recovery

## Implementation Priority

1. **Immediate**
   - Fix LandWatch adapter issues
   - Add comprehensive logging
   - Create test endpoint

2. **Short-term**
   - Implement HallAndHall fully
   - Add performance monitoring
   - Create diagnostic dashboard

3. **Long-term**
   - Implement remaining adapters
   - Add proxy support
   - Implement CAPTCHA handling

## Risk Mitigation

### Anti-Bot Protection
- Use proper User-Agent headers
- Implement request delays
- Rotate IP addresses (future)
- Handle CAPTCHA challenges

### Data Quality
- Validate all extracted fields
- Implement data normalization
- Add duplicate detection
- Handle missing data gracefully

## Testing Schedule

### Daily Tests
- Basic connectivity check
- Single property extraction
- Error rate monitoring

### Weekly Tests  
- Full scan simulation
- Performance benchmarking
- Data quality audit

### Monthly Tests
- Adapter coverage review
- Rate limit validation
- Database optimization check