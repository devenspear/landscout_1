import { z } from "zod";

// ─── Sub-schemas ──────────────────────────────────────────────────

const AcreageRangeSchema = z.object({
  min: z.number().min(0),
  max: z.number().min(1),
});

const ZoningBucketsSchema = z.object({
  ag: z.boolean(),
  timber: z.boolean(),
  ruralRes: z.boolean(),
  mixedUse: z.boolean(),
  conservation: z.boolean(),
});

const FitScoreWeightsSchema = z.object({
  acreage: z.number().min(0).max(100),
  landCoverMix: z.number().min(0).max(100),
  waterPresence: z.number().min(0).max(100),
  metroProximity: z.number().min(0).max(100),
  slope: z.number().min(0).max(100),
  soils: z.number().min(0).max(100),
  roadAccess: z.number().min(0).max(100),
  easementPenalty: z.number().min(0).max(100),
  utilities: z.number().min(0).max(100),
});

const FitScoreThresholdsSchema = z.object({
  high: z.number().min(0).max(100),
  medium: z.number().min(0).max(100),
});

const AutoFailSchema = z.object({
  floodway: z.boolean(),
  wetlandsOverPct: z.number().min(0).max(100).nullable(),
});

const FitScoreConfigSchema = z.object({
  weights: FitScoreWeightsSchema,
  thresholds: FitScoreThresholdsSchema,
  autoFail: AutoFailSchema,
});

const ListingSourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  baseUrl: z.string().url(),
  type: z.enum(["portal", "broker"]),
  enabled: z.boolean(),
  crawlFrequency: z.string(),
  rateLimitPerMin: z.number().int().min(1),
});

const WeeklyScanSchema = z.object({
  enabled: z.boolean(),
  dayOfWeekUTC: z.number().int().min(0).max(6),
  hourUTC: z.number().int().min(0).max(23),
});

const OnDemandScanSchema = z.object({
  enabled: z.boolean(),
});

const SchedulingSchema = z.object({
  weeklyScan: WeeklyScanSchema,
  onDemandScan: OnDemandScanSchema,
});

// ─── Full Admin Config Schema ─────────────────────────────────────

export const AdminConfigSchema = z.object({
  allowedStates: z.array(z.string().length(2)),
  acreage: AcreageRangeSchema,
  metroRadiusMiles: z.number().min(0),
  zoningBuckets: ZoningBucketsSchema,
  fitScore: FitScoreConfigSchema,
  dataSources: z.array(ListingSourceSchema),
  scheduling: SchedulingSchema,
});

export type AdminConfig = z.infer<typeof AdminConfigSchema>;

// Re-export useful sub-types
export type FitScoreConfig = z.infer<typeof FitScoreConfigSchema>;
export type AcreageRange = z.infer<typeof AcreageRangeSchema>;
export type ListingSource = z.infer<typeof ListingSourceSchema>;

// ─── Default Configuration ────────────────────────────────────────

export const DEFAULT_ADMIN_CONFIG: AdminConfig = {
  allowedStates: ["VA", "NC", "SC", "GA", "FL", "AL"],

  acreage: {
    min: 100,
    max: 1000,
  },

  metroRadiusMiles: 30,

  zoningBuckets: {
    ag: true,
    timber: true,
    ruralRes: true,
    mixedUse: true,
    conservation: true,
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
      utilities: 5,
    },
    thresholds: {
      high: 80,
      medium: 60,
    },
    autoFail: {
      floodway: true,
      wetlandsOverPct: 50,
    },
  },

  dataSources: [
    {
      id: "landwatch",
      name: "LandWatch",
      baseUrl: "https://www.landwatch.com",
      type: "portal",
      enabled: true,
      crawlFrequency: "weekly",
      rateLimitPerMin: 6,
    },
    {
      id: "hall-hall",
      name: "Hall & Hall",
      baseUrl: "https://www.hallhall.com",
      type: "broker",
      enabled: true,
      crawlFrequency: "weekly",
      rateLimitPerMin: 4,
    },
    {
      id: "land-and-farm",
      name: "Land And Farm",
      baseUrl: "https://www.landandfarm.com",
      type: "portal",
      enabled: true,
      crawlFrequency: "weekly",
      rateLimitPerMin: 6,
    },
    {
      id: "lands-of-america",
      name: "Lands of America",
      baseUrl: "https://www.landsofamerica.com",
      type: "portal",
      enabled: true,
      crawlFrequency: "weekly",
      rateLimitPerMin: 6,
    },
    {
      id: "whitetail",
      name: "Whitetail Properties",
      baseUrl: "https://www.whitetailproperties.com",
      type: "broker",
      enabled: true,
      crawlFrequency: "weekly",
      rateLimitPerMin: 4,
    },
    {
      id: "united-country",
      name: "United Country",
      baseUrl: "https://www.unitedcountry.com",
      type: "broker",
      enabled: true,
      crawlFrequency: "weekly",
      rateLimitPerMin: 4,
    },
    {
      id: "landleader",
      name: "LandLeader",
      baseUrl: "https://www.landleader.com",
      type: "broker",
      enabled: true,
      crawlFrequency: "weekly",
      rateLimitPerMin: 4,
    },
    {
      id: "mason-morse",
      name: "Mason & Morse Ranch",
      baseUrl: "https://www.ranchland.com",
      type: "broker",
      enabled: true,
      crawlFrequency: "weekly",
      rateLimitPerMin: 4,
    },
    {
      id: "afm",
      name: "AFM Real Estate",
      baseUrl: "https://www.afmrealestate.com",
      type: "broker",
      enabled: true,
      crawlFrequency: "weekly",
      rateLimitPerMin: 4,
    },
    {
      id: "peoples-company",
      name: "Peoples Company",
      baseUrl: "https://www.peoplescompany.com",
      type: "broker",
      enabled: true,
      crawlFrequency: "weekly",
      rateLimitPerMin: 4,
    },
    {
      id: "nai-land",
      name: "NAI Land",
      baseUrl: "https://www.nailand.com",
      type: "broker",
      enabled: true,
      crawlFrequency: "weekly",
      rateLimitPerMin: 4,
    },
    {
      id: "crexi",
      name: "Crexi",
      baseUrl: "https://www.crexi.com",
      type: "portal",
      enabled: true,
      crawlFrequency: "weekly",
      rateLimitPerMin: 6,
    },
    {
      id: "loopnet",
      name: "LoopNet",
      baseUrl: "https://www.loopnet.com",
      type: "portal",
      enabled: true,
      crawlFrequency: "weekly",
      rateLimitPerMin: 6,
    },
  ],

  scheduling: {
    weeklyScan: {
      enabled: true,
      dayOfWeekUTC: 1, // Monday
      hourUTC: 6,
    },
    onDemandScan: {
      enabled: true,
    },
  },
};
