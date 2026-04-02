import type { Parcel, Features } from "@prisma/client";
import type { AdminConfig, FitScoreConfig, AcreageRange } from "./admin-config";
import { DEFAULT_ADMIN_CONFIG } from "./admin-config";

// ─── Result Type ──────────────────────────────────────────────────

export interface FitScoreResult {
  overallScore: number;
  scoreBreakdown: Record<string, number>;
  topReasons: string[];
  autoFailed: boolean;
  autoFailReason?: string;
}

// ─── Default Fit Score Config (re-exported for convenience) ───────

export const DEFAULT_FIT_SCORE_CONFIG: FitScoreConfig =
  DEFAULT_ADMIN_CONFIG.fitScore;

// ─── Helpers ──────────────────────────────────────────────────────

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Safe JSON parse — returns null on failure instead of throwing.
 */
function safeJsonParse<T>(raw: string | null | undefined): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

// ─── Dimension Scorers (each returns 0-100) ──────────────────────

/**
 * Acreage: optimal range matching with graduated penalties for outliers.
 * Perfect score when acreage falls within [min, max].
 * Linear decay for parcels within 2x of the range boundary.
 * Hard floor at 10 for extreme outliers.
 */
function scoreAcreage(acreage: number, range: AcreageRange): number {
  const { min, max } = range;
  if (acreage >= min && acreage <= max) return 100;

  if (acreage < min) {
    const ratio = acreage / min;
    // Below half the minimum → floor score
    if (ratio < 0.5) return 10;
    // Linear interpolation from 10 at 0.5 to 100 at 1.0
    return clamp(10 + (ratio - 0.5) * 2 * 90);
  }

  // acreage > max
  const ratio = max / acreage;
  if (ratio < 0.5) return 10;
  return clamp(10 + (ratio - 0.5) * 2 * 90);
}

/**
 * Land Cover Mix: Shannon diversity index on cover type percentages.
 * Higher diversity → higher score.
 * Expects JSON string: Record<string, number> where values are percentages summing to ~100.
 */
function scoreLandCoverMix(landCoverMixRaw: string | null): number {
  const coverMap = safeJsonParse<Record<string, number>>(landCoverMixRaw);
  if (!coverMap) return 50; // neutral score when data unavailable

  const entries = Object.values(coverMap).filter((v) => v > 0);
  if (entries.length === 0) return 0;
  if (entries.length === 1) return 20; // monoculture penalty

  const total = entries.reduce((s, v) => s + v, 0);
  if (total === 0) return 0;

  // Shannon diversity: H = -sum(p * ln(p))
  let shannon = 0;
  for (const val of entries) {
    const p = val / total;
    if (p > 0) {
      shannon -= p * Math.log(p);
    }
  }

  // Max possible Shannon for n types = ln(n)
  const maxShannon = Math.log(entries.length);
  // Evenness (0-1) measures how uniform the distribution is
  const evenness = maxShannon > 0 ? shannon / maxShannon : 0;

  // Combine species count bonus with evenness
  // 2 types can get up to 60, 3+ types can reach 100
  const countBonus = Math.min(entries.length / 5, 1) * 40;
  const evennessScore = evenness * 60;

  return clamp(Math.round(countBonus + evennessScore));
}

/**
 * Water Presence: binary bonus for any water features.
 * 100 if water present, 30 if absent (not zero — lack of water isn't fatal).
 */
function scoreWaterPresence(waterPresence: boolean): number {
  return waterPresence ? 100 : 30;
}

/**
 * Metro Proximity: linear score within radius, exponential decay outside.
 */
function scoreMetroProximity(
  metroDistance: number | null,
  radiusMiles: number
): number {
  if (metroDistance == null) return 50; // unknown → neutral

  if (metroDistance <= radiusMiles) {
    // Linear: 100 at 0 miles, ~60 at the radius boundary
    return clamp(Math.round(100 - (metroDistance / radiusMiles) * 40));
  }

  // Exponential decay beyond radius
  const overshoot = (metroDistance - radiusMiles) / radiusMiles;
  const score = 60 * Math.exp(-1.5 * overshoot);
  return clamp(Math.round(score));
}

/**
 * Slope: penalties for steep terrain.
 * Expects JSON string: { avgSlope: number; maxSlope: number; pctOver15: number }
 */
interface SlopeStats {
  avgSlope?: number;
  maxSlope?: number;
  pctOver15?: number;
}

function scoreSlope(slopeStatsRaw: string | null): number {
  const stats = safeJsonParse<SlopeStats>(slopeStatsRaw);
  if (!stats) return 70; // no data → slightly optimistic default

  const avg = stats.avgSlope ?? 5;
  const pctSteep = stats.pctOver15 ?? 0;

  // Ideal: avg < 5%, no steep areas
  let score = 100;

  // Penalize average slope: -5 points per degree above 5
  if (avg > 5) {
    score -= (avg - 5) * 5;
  }

  // Penalize percentage of steep (>15%) terrain
  score -= pctSteep * 0.5;

  return clamp(Math.round(score));
}

/**
 * Soils Quality: direct 0-10 scale mapped to 0-100.
 */
function scoreSoils(soilsQuality: number | null): number {
  if (soilsQuality == null) return 50;
  return clamp(Math.round(soilsQuality * 10));
}

/**
 * Road Access: tiered scoring by road type.
 */
function scoreRoadAccess(roadAccess: string | null): number {
  if (!roadAccess) return 30;
  const access = roadAccess.toLowerCase().trim();

  if (access.includes("paved") || access.includes("highway")) return 100;
  if (access.includes("gravel") || access.includes("improved")) return 75;
  if (access.includes("dirt") || access.includes("unimproved")) return 45;
  if (access === "none" || access.includes("no access")) return 10;

  return 50; // unknown type → neutral
}

/**
 * Easement Penalty: deductions per easement.
 * Expects JSON string: Array<{ type: string; description?: string }>
 */
function scoreEasementPenalty(easementsRaw: string | null): number {
  const easements = safeJsonParse<Array<{ type?: string }>>(easementsRaw);
  if (!easements || easements.length === 0) return 100; // no easements → perfect

  // -15 points per easement, floor at 10
  const penalty = easements.length * 15;
  return clamp(100 - penalty, 10);
}

/**
 * Utilities: distance-based scoring for 5 utility types.
 * Closer is better. Each utility contributes 20% of the utilities dimension.
 */
function scoreUtilities(features: Features): number {
  const utilities: { distance: number | null; maxGood: number }[] = [
    { distance: features.powerDistance, maxGood: 0.5 }, // miles
    { distance: features.waterDistance, maxGood: 1.0 },
    { distance: features.sewerDistance, maxGood: 2.0 },
    { distance: features.fiberDistance, maxGood: 2.0 },
    { distance: features.gasDistance, maxGood: 3.0 },
  ];

  let totalScore = 0;
  let counted = 0;

  for (const { distance, maxGood } of utilities) {
    if (distance == null) {
      totalScore += 40; // unknown → below average
      counted++;
      continue;
    }

    if (distance <= maxGood) {
      totalScore += 100;
    } else {
      // Linear decay: score drops to 0 at 5x the maxGood distance
      const ratio = (distance - maxGood) / (maxGood * 4);
      totalScore += clamp(Math.round(100 * (1 - ratio)));
    }
    counted++;
  }

  return counted > 0 ? clamp(Math.round(totalScore / counted)) : 50;
}

// ─── Top Reasons Generator ───────────────────────────────────────

function generateTopReasons(
  breakdown: Record<string, number>,
  weights: FitScoreConfig["weights"]
): string[] {
  // Sort dimensions by weighted contribution (high to low)
  const weighted = Object.entries(breakdown).map(([key, score]) => ({
    key,
    score,
    weight: weights[key as keyof typeof weights] ?? 0,
    contribution: (score * (weights[key as keyof typeof weights] ?? 0)) / 100,
  }));

  weighted.sort((a, b) => b.contribution - a.contribution);

  const reasons: string[] = [];

  const labels: Record<string, { good: string; bad: string }> = {
    acreage: { good: "Ideal acreage for target range", bad: "Acreage outside target range" },
    landCoverMix: { good: "Diverse land cover mix", bad: "Low land cover diversity" },
    waterPresence: { good: "Water features present", bad: "No water features detected" },
    metroProximity: { good: "Good metro proximity", bad: "Far from metro areas" },
    slope: { good: "Favorable terrain", bad: "Steep or challenging terrain" },
    soils: { good: "High-quality soils", bad: "Poor soil quality" },
    roadAccess: { good: "Strong road access", bad: "Limited road access" },
    easementPenalty: { good: "Few or no easements", bad: "Multiple easements present" },
    utilities: { good: "Utilities nearby", bad: "Utilities distant or unavailable" },
  };

  // Top 3 positive contributors
  for (const dim of weighted.slice(0, 3)) {
    if (dim.score >= 70) {
      reasons.push(`+ ${labels[dim.key]?.good ?? dim.key} (${dim.score})`);
    } else if (dim.score < 50) {
      reasons.push(`- ${labels[dim.key]?.bad ?? dim.key} (${dim.score})`);
    }
  }

  // Add bottom 2 as concerns if they scored poorly
  for (const dim of weighted.slice(-2)) {
    if (dim.score < 50 && !reasons.some((r) => r.includes(dim.key))) {
      reasons.push(`- ${labels[dim.key]?.bad ?? dim.key} (${dim.score})`);
    }
  }

  // Ensure we return at least one reason
  if (reasons.length === 0) {
    const best = weighted[0];
    reasons.push(
      `+ ${labels[best.key]?.good ?? best.key} (${best.score})`
    );
  }

  return reasons.slice(0, 5);
}

// ─── Main Scoring Function ───────────────────────────────────────

interface ScoringConfig {
  fitScore: FitScoreConfig;
  acreage: AcreageRange;
  metroRadiusMiles: number;
}

export function calculateFitScore(
  parcel: Pick<Parcel, "acreage">,
  features: Features,
  config: ScoringConfig
): FitScoreResult {
  const { fitScore: fsConfig, acreage: acreageRange, metroRadiusMiles } = config;

  // ── Auto-fail checks ──────────────────────────────────────────

  if (fsConfig.autoFail.floodway && features.inFloodway) {
    return {
      overallScore: 0,
      scoreBreakdown: {},
      topReasons: ["Auto-failed: parcel is in a FEMA floodway"],
      autoFailed: true,
      autoFailReason: "Parcel is located in a FEMA-designated floodway",
    };
  }

  if (
    fsConfig.autoFail.wetlandsOverPct != null &&
    features.wetlandsPercent != null &&
    features.wetlandsPercent > fsConfig.autoFail.wetlandsOverPct
  ) {
    return {
      overallScore: 0,
      scoreBreakdown: {},
      topReasons: [
        `Auto-failed: wetlands coverage ${features.wetlandsPercent}% exceeds ${fsConfig.autoFail.wetlandsOverPct}% threshold`,
      ],
      autoFailed: true,
      autoFailReason: `Wetlands coverage (${features.wetlandsPercent}%) exceeds maximum threshold (${fsConfig.autoFail.wetlandsOverPct}%)`,
    };
  }

  // ── Score each dimension (0-100) ──────────────────────────────

  const scoreBreakdown: Record<string, number> = {
    acreage: scoreAcreage(parcel.acreage, acreageRange),
    landCoverMix: scoreLandCoverMix(features.landCoverMix),
    waterPresence: scoreWaterPresence(features.waterPresence),
    metroProximity: scoreMetroProximity(features.metroDistance, metroRadiusMiles),
    slope: scoreSlope(features.slopeStats),
    soils: scoreSoils(features.soilsQuality),
    roadAccess: scoreRoadAccess(features.roadAccess),
    easementPenalty: scoreEasementPenalty(features.easements),
    utilities: scoreUtilities(features),
  };

  // ── Weighted average ──────────────────────────────────────────

  const weights = fsConfig.weights;
  let weightedSum = 0;
  let totalWeight = 0;

  for (const [key, score] of Object.entries(scoreBreakdown)) {
    const weight = weights[key as keyof typeof weights] ?? 0;
    weightedSum += score * weight;
    totalWeight += weight;
  }

  const overallScore =
    totalWeight > 0 ? clamp(Math.round(weightedSum / totalWeight)) : 0;

  // ── Generate human-readable reasons ───────────────────────────

  const topReasons = generateTopReasons(scoreBreakdown, weights);

  return {
    overallScore,
    scoreBreakdown,
    topReasons,
    autoFailed: false,
  };
}
