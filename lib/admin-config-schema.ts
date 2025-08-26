import { z } from 'zod'

const ListingSourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  baseUrl: z.string().url(),
  type: z.enum(['portal', 'broker']),
  adapter: z.enum([
    'landwatch', 'hallhall', 'landandfarm', 'landsofamerica', 
    'whitetail', 'unitedcountry', 'landleader', 'masonmorse',
    'afm', 'peoples', 'nai', 'crexi', 'loopnet', 'custom'
  ]),
  enabled: z.boolean(),
  crawlFrequency: z.enum(['daily', 'weekly', 'manual']),
  rateLimitPerMin: z.number().min(1).max(60)
})

const CountyGisSourceSchema = z.object({
  fips: z.string(),
  name: z.string(),
  arcgisUrl: z.string().url(),
  enabled: z.boolean(),
  crawlFrequency: z.enum(['weekly', 'biweekly', 'monthly'])
})

const EnrichmentSourcesSchema = z.object({
  soils: z.object({
    provider: z.enum(['NRCS', 'None']),
    enabled: z.boolean(),
    apiKey: z.string().optional()
  }),
  hydrography: z.object({
    provider: z.enum(['USGS', 'None']),
    enabled: z.boolean()
  }),
  fema: z.object({
    provider: z.enum(['NFHL', 'None']),
    enabled: z.boolean()
  })
})

const DistressSourceSchema = z.object({
  state: z.string().length(2),
  kind: z.enum(['taxDelinquency', 'foreclosure', 'sheriffSale']),
  url: z.string().url().optional(),
  enabled: z.boolean()
})

export const AdminConfigSchema = z.object({
  // A) Core Filters & Geography
  allowedStates: z.array(z.string().length(2)),
  countyTiers: z.array(z.object({
    fips: z.string(),
    tier: z.enum(['T1', 'T2', 'T3'])
  })),
  metros: z.array(z.object({
    name: z.string(),
    lat: z.number(),
    lon: z.number(),
    useAirport: z.boolean()
  })),
  metroRadiusMiles: z.number().min(10).max(100),
  acreage: z.object({
    min: z.number().min(0),
    max: z.number().min(0)
  }),
  zoningBuckets: z.object({
    ag: z.boolean(),
    timber: z.boolean(),
    ruralRes: z.boolean(),
    mixedUse: z.boolean(),
    conservation: z.boolean()
  }),
  dealStatus: z.object({
    listed: z.boolean(),
    offMarket: z.boolean(),
    distressed: z.boolean()
  }),
  legalPosture: z.object({
    honorRobotsTos: z.boolean(),
    publicRecordsWherePermitted: z.boolean()
  }),

  // B) Hard Filters
  filters: z.object({
    slopeMaxPct: z.number().optional(),
    wetlandsMaxPct: z.number().optional(),
    floodwayExcluded: z.boolean(),
    utilities: z.object({
      powerMaxMiles: z.number().optional(),
      fiberMaxMiles: z.number().optional(),
      waterMaxMiles: z.number().optional(),
      sewerMaxMiles: z.number().optional()
    })
  }),

  // C) Fit Score
  fitScore: z.object({
    weights: z.object({
      acreage: z.number(),
      landCoverMix: z.number(),
      waterPresence: z.number(),
      metroProximity: z.number(),
      slope: z.number(),
      soils: z.number(),
      roadAccess: z.number(),
      easementPenalty: z.number(),
      utilities: z.number()
    }),
    thresholds: z.object({
      high: z.number(),
      medium: z.number()
    }),
    autoFail: z.object({
      floodway: z.boolean(),
      wetlandsOverPct: z.number().optional()
    })
  }),

  // D) Scheduling & Alerts
  schedules: z.object({
    weeklyScan: z.object({
      enabled: z.boolean(),
      dayOfWeekUTC: z.number().min(0).max(6),
      hourUTC: z.number().min(0).max(23)
    }),
    onDemandScan: z.object({
      enabled: z.boolean()
    })
  }),
  notifications: z.object({
    onScanComplete: z.object({
      emailList: z.array(z.string().email())
    })
  }),

  // E) Data Sources
  listingSources: z.array(ListingSourceSchema),
  countyGisSources: z.array(CountyGisSourceSchema),
  enrichmentSources: EnrichmentSourcesSchema,
  distressSources: z.array(DistressSourceSchema),

  // F) ETL & Compliance
  crawlPolicy: z.object({
    proxyPoolEnabled: z.boolean(),
    captchaProvider: z.enum(['None', 'AntiCaptcha', '2Captcha']).optional(),
    maxConcurrentPerSource: z.number().min(1).max(10),
    retries: z.number().min(0).max(5)
  }),

  // G) Performance & Ops
  performanceTargets: z.object({
    mapLoadMs: z.number(),
    searchMs: z.number(),
    uptimePct: z.number().min(0).max(100)
  }),
  kpis: z.object({
    discoveryPerWeekTarget: z.number(),
    highFitRetentionPct: z.number().min(0).max(100),
    medianDaysNewToQualified: z.number()
  })
})

export type AdminConfig = z.infer<typeof AdminConfigSchema>

export const DEFAULT_ADMIN_CONFIG: AdminConfig = {
  allowedStates: ['VA', 'NC', 'SC', 'GA', 'FL', 'AL'],
  countyTiers: [],
  metros: [],
  metroRadiusMiles: 30,
  acreage: { min: 100, max: 1000 },
  zoningBuckets: {
    ag: true,
    timber: true,
    ruralRes: true,
    mixedUse: true,
    conservation: true
  },
  dealStatus: {
    listed: true,
    offMarket: true,
    distressed: true
  },
  legalPosture: {
    honorRobotsTos: true,
    publicRecordsWherePermitted: true
  },
  filters: {
    slopeMaxPct: 40,
    wetlandsMaxPct: 50,
    floodwayExcluded: true,
    utilities: {}
  },
  fitScore: {
    weights: {
      acreage: 20,
      landCoverMix: 20,
      waterPresence: 10,
      metroProximity: 10,
      slope: 10,
      soils: 10,
      roadAccess: 10,
      easementPenalty: 5,
      utilities: 5
    },
    thresholds: {
      high: 80,
      medium: 60
    },
    autoFail: {
      floodway: true,
      wetlandsOverPct: 50
    }
  },
  schedules: {
    weeklyScan: {
      enabled: true,
      dayOfWeekUTC: 0,
      hourUTC: 2
    },
    onDemandScan: {
      enabled: true
    }
  },
  notifications: {
    onScanComplete: {
      emailList: []
    }
  },
  listingSources: [
    {
      id: 'landwatch',
      name: 'LandWatch',
      baseUrl: 'https://www.landwatch.com',
      type: 'portal',
      adapter: 'landwatch',
      enabled: true,
      crawlFrequency: 'weekly',
      rateLimitPerMin: 6
    },
    {
      id: 'hallhall',
      name: 'Hall and Hall',
      baseUrl: 'https://hallhall.com',
      type: 'broker',
      adapter: 'hallhall',
      enabled: true,
      crawlFrequency: 'weekly',
      rateLimitPerMin: 6
    },
    {
      id: 'landandfarm',
      name: 'Land And Farm',
      baseUrl: 'https://www.landandfarm.com',
      type: 'portal',
      adapter: 'landandfarm',
      enabled: true,
      crawlFrequency: 'weekly',
      rateLimitPerMin: 6
    },
    {
      id: 'landsofamerica',
      name: 'Lands of America',
      baseUrl: 'https://www.landsofamerica.com',
      type: 'portal',
      adapter: 'landsofamerica',
      enabled: true,
      crawlFrequency: 'weekly',
      rateLimitPerMin: 6
    },
    {
      id: 'whitetail',
      name: 'Whitetail Properties',
      baseUrl: 'https://www.whitetailproperties.com',
      type: 'broker',
      adapter: 'whitetail',
      enabled: true,
      crawlFrequency: 'weekly',
      rateLimitPerMin: 6
    },
    {
      id: 'unitedcountry',
      name: 'United Country',
      baseUrl: 'https://www.unitedcountry.com',
      type: 'broker',
      adapter: 'unitedcountry',
      enabled: true,
      crawlFrequency: 'weekly',
      rateLimitPerMin: 6
    },
    {
      id: 'landleader',
      name: 'LandLeader',
      baseUrl: 'https://www.landleader.com',
      type: 'portal',
      adapter: 'landleader',
      enabled: true,
      crawlFrequency: 'weekly',
      rateLimitPerMin: 6
    },
    {
      id: 'masonmorse',
      name: 'Mason & Morse Ranch',
      baseUrl: 'https://www.ranchland.com',
      type: 'broker',
      adapter: 'masonmorse',
      enabled: true,
      crawlFrequency: 'weekly',
      rateLimitPerMin: 6
    },
    {
      id: 'afm',
      name: 'AFM Real Estate',
      baseUrl: 'https://www.afmrealestate.com',
      type: 'broker',
      adapter: 'afm',
      enabled: true,
      crawlFrequency: 'weekly',
      rateLimitPerMin: 6
    },
    {
      id: 'peoples',
      name: 'Peoples Company',
      baseUrl: 'https://peoplescompany.com',
      type: 'broker',
      adapter: 'peoples',
      enabled: true,
      crawlFrequency: 'weekly',
      rateLimitPerMin: 6
    },
    {
      id: 'nai',
      name: 'NAI Land',
      baseUrl: 'https://www.nai-global.com',
      type: 'broker',
      adapter: 'nai',
      enabled: true,
      crawlFrequency: 'weekly',
      rateLimitPerMin: 6
    },
    {
      id: 'crexi',
      name: 'Crexi (Land)',
      baseUrl: 'https://www.crexi.com',
      type: 'portal',
      adapter: 'crexi',
      enabled: true,
      crawlFrequency: 'weekly',
      rateLimitPerMin: 6
    },
    {
      id: 'loopnet',
      name: 'LoopNet (Land)',
      baseUrl: 'https://www.loopnet.com',
      type: 'portal',
      adapter: 'loopnet',
      enabled: true,
      crawlFrequency: 'weekly',
      rateLimitPerMin: 6
    }
  ],
  countyGisSources: [],
  enrichmentSources: {
    soils: {
      provider: 'NRCS',
      enabled: false
    },
    hydrography: {
      provider: 'USGS',
      enabled: false
    },
    fema: {
      provider: 'NFHL',
      enabled: false
    }
  },
  distressSources: [],
  crawlPolicy: {
    proxyPoolEnabled: true,
    captchaProvider: 'None',
    maxConcurrentPerSource: 2,
    retries: 3
  },
  performanceTargets: {
    mapLoadMs: 2000,
    searchMs: 1000,
    uptimePct: 99.0
  },
  kpis: {
    discoveryPerWeekTarget: 25,
    highFitRetentionPct: 70,
    medianDaysNewToQualified: 7
  }
}