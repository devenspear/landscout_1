// ─── Shared Types for LandScout 2.0 ───────────────────────────────

export type DealStage =
  | "new"
  | "qualified"
  | "pursuit"
  | "under-contract"
  | "closed"
  | "passed";

export type Priority = "high" | "medium" | "low";

export type ActivityType =
  | "note"
  | "call"
  | "email"
  | "meeting"
  | "status_change";

// ─── Relation-enriched Parcel ─────────────────────────────────────

export interface ParcelListing {
  id: string;
  sourceId: string;
  sourceName?: string;
  url: string;
  title: string;
  price: number | null;
  pricePerAcre: number | null;
  status: string;
  photos: string | null;
}

export interface ParcelFeatures {
  id: string;
  parcelId: string;
  landCoverMix: string | null;
  waterPresence: boolean;
  waterFeatures: string | null;
  metroDistance: number | null;
  nearestMetro: string | null;
  slopeStats: string | null;
  soilsQuality: number | null;
  roadAccess: string | null;
  easements: string | null;
  powerDistance: number | null;
  waterDistance: number | null;
  sewerDistance: number | null;
  fiberDistance: number | null;
  gasDistance: number | null;
  inFloodway: boolean;
  floodZone: string | null;
  wetlandsPercent: number | null;
  elevation: number | null;
}

export interface ParcelFitScore {
  overallScore: number;
  scoreBreakdown: string;
  topReasons: string;
  autoFailed: boolean;
  autoFailReason: string | null;
}

export interface ParcelDeal {
  id: string;
  stage: string;
  priority: string;
  notes: string | null;
}

export interface ParcelWithRelations {
  id: string;
  apn: string | null;
  address: string | null;
  county: string;
  state: string;
  acreage: number;
  lat: number | null;
  lon: number | null;
  zoning: string | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  listings: ParcelListing[];
  features: ParcelFeatures | null;
  fitScore: ParcelFitScore | null;
  deal: ParcelDeal | null;
}

// ─── Dashboard ────────────────────────────────────────────────────

export interface DashboardStats {
  totalParcels: number;
  totalListings: number;
  totalDeals: number;
  avgFitScore: number;
  highFitCount: number;
  medFitCount: number;
  lowFitCount: number;
  stateBreakdown: Record<string, number>;
  sourceBreakdown: Record<string, number>;
  recentParcels: ParcelWithRelations[];
}

// ─── Constants ────────────────────────────────────────────────────

export const DEAL_STAGES: {
  value: DealStage;
  label: string;
  color: string;
}[] = [
  { value: "new", label: "New", color: "#6366f1" },
  { value: "qualified", label: "Qualified", color: "#3b82f6" },
  { value: "pursuit", label: "Pursuit", color: "#f59e0b" },
  { value: "under-contract", label: "Under Contract", color: "#10b981" },
  { value: "closed", label: "Closed", color: "#22c55e" },
  { value: "passed", label: "Passed", color: "#94a3b8" },
];

export const SOURCES: { id: string; name: string; type: string }[] = [
  { id: "landwatch", name: "LandWatch", type: "portal" },
  { id: "hall-hall", name: "Hall & Hall", type: "broker" },
  { id: "land-and-farm", name: "Land And Farm", type: "portal" },
  { id: "lands-of-america", name: "Lands of America", type: "portal" },
  { id: "whitetail", name: "Whitetail Properties", type: "broker" },
  { id: "united-country", name: "United Country", type: "broker" },
  { id: "landleader", name: "LandLeader", type: "broker" },
  { id: "mason-morse", name: "Mason & Morse Ranch", type: "broker" },
  { id: "afm", name: "AFM Real Estate", type: "broker" },
  { id: "peoples-company", name: "Peoples Company", type: "broker" },
  { id: "nai-land", name: "NAI Land", type: "broker" },
  { id: "crexi", name: "Crexi", type: "portal" },
  { id: "loopnet", name: "LoopNet", type: "portal" },
];
