import { Features, Parcel } from '@prisma/client'
import { AdminConfig } from './admin-config-schema'

export interface FitScoreResult {
  overallScore: number
  scoreBreakdown: Record<string, number>
  topReasons: string[]
  autoFailed: boolean
  autoFailReason?: string
}

export function calculateFitScore(
  parcel: Parcel,
  features: Features | null,
  config: AdminConfig
): FitScoreResult {
  const weights = config.fitScore.weights
  const autoFail = config.fitScore.autoFail
  
  // Check auto-fail conditions
  if (features) {
    if (autoFail.floodway && features.inFloodway) {
      return {
        overallScore: 0,
        scoreBreakdown: {},
        topReasons: ['Property is in a floodway'],
        autoFailed: true,
        autoFailReason: 'In floodway'
      }
    }
    
    if (autoFail.wetlandsOverPct && features.wetlandsPercent && 
        features.wetlandsPercent > autoFail.wetlandsOverPct) {
      return {
        overallScore: 0,
        scoreBreakdown: {},
        topReasons: [`Wetlands exceed ${autoFail.wetlandsOverPct}%`],
        autoFailed: true,
        autoFailReason: `Wetlands ${features.wetlandsPercent}%`
      }
    }
  }
  
  // Calculate component scores
  const scores: Record<string, number> = {}
  const reasons: { score: number; reason: string }[] = []
  
  // 1. Acreage Score (0-100 based on how well it fits the range)
  const acreageScore = calculateAcreageScore(parcel.acreage, config.acreage)
  scores.acreage = (acreageScore * weights.acreage) / 100
  if (acreageScore >= 80) {
    reasons.push({ score: scores.acreage, reason: `Excellent acreage (${parcel.acreage} acres) in target range` })
  }
  
  // 2. Land Cover Mix Score (if features available)
  if (features?.landCoverMix) {
    const landCoverScore = calculateLandCoverScore(features.landCoverMix as any)
    scores.landCoverMix = (landCoverScore * weights.landCoverMix) / 100
    if (landCoverScore >= 70) {
      reasons.push({ score: scores.landCoverMix, reason: 'Good land cover diversity' })
    }
  } else {
    scores.landCoverMix = weights.landCoverMix * 0.5 // Default middle score
  }
  
  // 3. Water Presence Score
  if (features) {
    const waterScore = features.waterPresence ? 100 : 30
    scores.waterPresence = (waterScore * weights.waterPresence) / 100
    if (features.waterPresence && features.waterFeatures && features.waterFeatures.length > 0) {
      const waterFeaturesList = typeof features.waterFeatures === 'string' 
        ? JSON.parse(features.waterFeatures) 
        : features.waterFeatures
      reasons.push({ 
        score: scores.waterPresence, 
        reason: `Water features: ${waterFeaturesList.join(', ')}` 
      })
    }
  } else {
    scores.waterPresence = weights.waterPresence * 0.3
  }
  
  // 4. Metro Proximity Score
  if (features?.metroDistance) {
    const metroScore = calculateMetroScore(features.metroDistance, config.metroRadiusMiles)
    scores.metroProximity = (metroScore * weights.metroProximity) / 100
    if (metroScore >= 70) {
      reasons.push({ 
        score: scores.metroProximity, 
        reason: `${features.metroDistance.toFixed(0)} miles from ${features.nearestMetro || 'metro'}` 
      })
    }
  } else {
    scores.metroProximity = weights.metroProximity * 0.5
  }
  
  // 5. Slope Score
  if (features?.slopeStats) {
    const slopeData = features.slopeStats as any
    const slopeScore = calculateSlopeScore(slopeData, config.filters.slopeMaxPct)
    scores.slope = (slopeScore * weights.slope) / 100
    if (slopeScore >= 80) {
      reasons.push({ score: scores.slope, reason: 'Favorable topography' })
    }
  } else {
    scores.slope = weights.slope * 0.6
  }
  
  // 6. Soils Score
  if (features?.soilsQuality) {
    const soilScore = (features.soilsQuality / 10) * 100
    scores.soils = (soilScore * weights.soils) / 100
    if (soilScore >= 70) {
      reasons.push({ score: scores.soils, reason: 'Good soil quality' })
    }
  } else {
    scores.soils = weights.soils * 0.5
  }
  
  // 7. Road Access Score
  if (features?.roadAccess) {
    const roadScore = calculateRoadScore(features.roadAccess)
    scores.roadAccess = (roadScore * weights.roadAccess) / 100
    if (roadScore >= 80) {
      reasons.push({ score: scores.roadAccess, reason: `${features.roadAccess} road access` })
    }
  } else {
    scores.roadAccess = weights.roadAccess * 0.5
  }
  
  // 8. Easement Penalty
  if (features?.easements && features.easements.length > 0) {
    const easementsList = typeof features.easements === 'string' 
      ? JSON.parse(features.easements) 
      : features.easements
    const easementScore = Math.max(0, 100 - (easementsList.length * 20))
    scores.easementPenalty = (easementScore * weights.easementPenalty) / 100
    if (easementScore < 50) {
      reasons.push({ 
        score: -scores.easementPenalty, 
        reason: `Easements: ${easementsList.join(', ')}` 
      })
    }
  } else {
    scores.easementPenalty = weights.easementPenalty
  }
  
  // 9. Utilities Score
  if (features) {
    const utilityScore = calculateUtilityScore(features, config.filters.utilities)
    scores.utilities = (utilityScore * weights.utilities) / 100
    if (utilityScore >= 70) {
      reasons.push({ score: scores.utilities, reason: 'Good utility access' })
    }
  } else {
    scores.utilities = weights.utilities * 0.4
  }
  
  // Calculate total score
  const overallScore = Math.min(100, Math.max(0, Object.values(scores).reduce((a, b) => a + b, 0)))
  
  // Sort reasons by score contribution and take top 5
  reasons.sort((a, b) => Math.abs(b.score) - Math.abs(a.score))
  const topReasons = reasons.slice(0, 5).map(r => r.reason)
  
  return {
    overallScore: Math.round(overallScore),
    scoreBreakdown: scores,
    topReasons,
    autoFailed: false
  }
}

function calculateAcreageScore(acreage: number, range: { min: number; max: number }): number {
  if (acreage < range.min || acreage > range.max) {
    // Outside range - calculate penalty based on distance
    const distance = acreage < range.min ? 
      (range.min - acreage) / range.min :
      (acreage - range.max) / range.max
    return Math.max(0, 100 - (distance * 100))
  }
  
  // Inside range - score based on position in range
  const midpoint = (range.min + range.max) / 2
  const deviation = Math.abs(acreage - midpoint) / (range.max - range.min)
  return 100 - (deviation * 20) // Max 20% penalty for being at edges
}

function calculateLandCoverScore(landCoverMix: Record<string, number>): number {
  // Reward diversity - Shannon diversity index
  const total = Object.values(landCoverMix).reduce((a, b) => a + b, 0)
  if (total === 0) return 50
  
  let diversity = 0
  for (const value of Object.values(landCoverMix)) {
    if (value > 0) {
      const proportion = value / total
      diversity -= proportion * Math.log(proportion)
    }
  }
  
  // Normalize to 0-100 scale
  const maxDiversity = Math.log(Object.keys(landCoverMix).length)
  return Math.min(100, (diversity / maxDiversity) * 100)
}

function calculateMetroScore(distance: number, maxRadius: number): number {
  if (distance <= maxRadius) {
    // Within target radius - linear score
    return 100 - ((distance / maxRadius) * 30) // Max 30% penalty at edge
  }
  
  // Outside radius - exponential decay
  const excess = distance - maxRadius
  return Math.max(0, 70 - (excess * 2)) // -2 points per mile over
}

function calculateSlopeScore(slopeStats: any, maxSlope?: number): number {
  const meanSlope = slopeStats.mean || 0
  const over20 = slopeStats.percentOver20 || 0
  const over40 = slopeStats.percentOver40 || 0
  
  let score = 100
  
  // Penalty for steep areas
  score -= over40 * 2 // -2 points per percent over 40
  score -= over20 * 0.5 // -0.5 points per percent over 20
  
  // Penalty if mean exceeds threshold
  if (maxSlope && meanSlope > maxSlope) {
    score -= (meanSlope - maxSlope) * 2
  }
  
  return Math.max(0, score)
}

function calculateRoadScore(roadAccess: string): number {
  const scores: Record<string, number> = {
    'paved': 100,
    'gravel': 70,
    'dirt': 40,
    'none': 10
  }
  return scores[roadAccess.toLowerCase()] || 50
}

function calculateUtilityScore(features: Features, utilityConfig: any): number {
  let score = 100
  let count = 0
  
  const utilities = [
    { distance: features.powerDistance, max: utilityConfig.powerMaxMiles, weight: 30 },
    { distance: features.waterDistance, max: utilityConfig.waterMaxMiles, weight: 25 },
    { distance: features.sewerDistance, max: utilityConfig.sewerMaxMiles, weight: 20 },
    { distance: features.fiberDistance, max: utilityConfig.fiberMaxMiles, weight: 15 },
    { distance: features.gasDistance, max: utilityConfig.gasMaxMiles, weight: 10 }
  ]
  
  for (const util of utilities) {
    if (util.distance !== null && util.distance !== undefined) {
      count++
      if (util.max && util.distance > util.max) {
        // Exceeds max - apply penalty
        score -= util.weight * ((util.distance - util.max) / util.max)
      } else if (util.distance <= 1) {
        // Very close - bonus
        score += util.weight * 0.2
      }
    }
  }
  
  // If no utility data, return neutral score
  if (count === 0) return 50
  
  return Math.max(0, Math.min(100, score))
}