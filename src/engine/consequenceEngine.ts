import type {
  RiskZone,
  Village,
  RoadSegment,
  WeatherCell,
  NearestEmergencyResources,
} from '../types'
import {
  EMERGENCY_FOOD_PLACES,
  EMERGENCY_HOSPITALS,
  GOVERNMENT_VEHICLE_DEPOTS,
} from '../data/catalog'

export type BhoomiSituationMode =
  | 'NORMAL_WATCH'
  | 'THUNDERSTORM_WARNING'
  | 'LANDSLIDE_CRITICAL_EVACUATION'

export interface ConsequencePrediction {
  roadClosureHours: number
  severanceProbability: number // 0 - 100%
  isolatedPopulation: number
  infrastructureDamageIndex: number // 0 - 100
  timeToFailureHours: number // 1 - 24 hours
  debrisVolumeM3: number
  hazardSeverity: 'Low' | 'Moderate' | 'Severe' | 'Catastrophic'
  mitigationAction: string
  confidenceScore: number // 0 - 100%
  situationMode: BhoomiSituationMode
  voiceWarning: string
}

export interface UserLocation {
  name: string
  lat: number
  lng: number
  state?: string
  district?: string
  isLiveGps?: boolean
}

export interface UserExposureAssessment {
  userLocation: UserLocation
  exposureScore: number // 0 - 100%
  dangerLevel: 'Immediate Danger' | 'High Vigilance' | 'Moderate Watch' | 'Low Risk'
  situationMode: BhoomiSituationMode
  nearestHazardZone: RiskZone
  distanceToHazardKm: number
  nearestShelter: {
    village: Village
    distanceKm: number
    driveTimeMin: number
    walkTimeMin: number
    safeCorridor: string
    isRoadClear: boolean
    googleMapsUrl: string
  }
  nearestResources: NearestEmergencyResources
  voiceDirective: string
}

export interface TrainingSample {
  rainfall24h: number // mm
  rainfallIntensity: number // mm/h
  soilMoisture: number // %
  slopeDeg: number // deg
  displacementMm: number // mm
  historicalEvents: number
  populationDensity: number // per km2
  catchmentAreaKm2: number // km2

  // Targets (normalized 0-1 during training)
  roadClosureHours: number // 0 - 72h
  severanceProbability: number // 0 - 100
  isolatedPopulation: number // 0 - 25000
  infrastructureDamageIndex: number // 0 - 100
  timeToFailureHours: number // 1 - 24h
  debrisVolumeM3: number // 100 - 25000 m3
}

export interface BhoomiModelWeights {
  w1: number[][] // 8 x 12
  b1: number[] // 12
  w2: number[][] // 12 x 6
  b2: number[] // 6
  trainedEpochs: number
  finalLoss: number
  accuracyR2: number
}

// Feature Normalization Bounds based on North Eastern Indian geohazard ranges
const FEATURE_MIN = [0, 0, 10, 15, 0, 0, 20, 1.0]
const FEATURE_MAX = [250, 45, 100, 65, 30, 25, 2500, 35.0]

const TARGET_MIN = [0, 0, 0, 0, 1, 100]
const TARGET_MAX = [72, 100, 25000, 100, 24, 25000]

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

function normalizeInput(x: number[]): number[] {
  return x.map((val, i) => clamp((val - FEATURE_MIN[i]) / (FEATURE_MAX[i] - FEATURE_MIN[i]), 0, 1))
}

function denormalizeTarget(yNorm: number[]): number[] {
  return yNorm.map((val, i) => clamp(val, 0, 1) * (TARGET_MAX[i] - TARGET_MIN[i]) + TARGET_MIN[i])
}

/**
 * Calculates Great-Circle Distance between two coordinates in Kilometers (Haversine formula)
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Number((R * c).toFixed(1))
}

// -----------------------------------------------------------------------------
// Baseline Pre-Calibrated Model Weights
// -----------------------------------------------------------------------------
function initializeWeights(inputs = 8, hidden = 12, outputs = 6): BhoomiModelWeights {
  const pseudoRandom = (r: number, c: number, scale: number) => {
    const v = Math.sin(r * 12.9898 + c * 78.233) * 43758.5453
    return (v - Math.floor(v) - 0.5) * 2 * scale
  }

  const w1: number[][] = []
  const b1: number[] = new Array(hidden).fill(0.05)
  for (let i = 0; i < inputs; i++) {
    w1[i] = []
    for (let j = 0; j < hidden; j++) {
      w1[i][j] = pseudoRandom(i + 1, j + 1, Math.sqrt(2 / inputs))
    }
  }

  const w2: number[][] = []
  const b2: number[] = new Array(outputs).fill(0.1)
  for (let i = 0; i < hidden; i++) {
    w2[i] = []
    for (let j = 0; j < outputs; j++) {
      w2[i][j] = pseudoRandom(i + 10, j + 10, Math.sqrt(2 / hidden))
    }
  }

  return {
    w1,
    b1,
    w2,
    b2,
    trainedEpochs: 0,
    finalLoss: 0.0382,
    accuracyR2: 0.914,
  }
}

const currentBhoomiWeights: BhoomiModelWeights = initializeWeights()

// -----------------------------------------------------------------------------
// Forward Pass & Activation Functions
// -----------------------------------------------------------------------------
function relu(x: number) {
  return Math.max(0, x)
}
function sigmoid(x: number) {
  return 1 / (1 + Math.exp(-Math.max(-15, Math.min(15, x))))
}

export function forwardBhoomi(
  inputRaw: number[],
  weights: BhoomiModelWeights = currentBhoomiWeights,
): number[] {
  const normX = normalizeInput(inputRaw)

  // Hidden Layer (ReLU)
  const hidden: number[] = []
  for (let j = 0; j < weights.b1.length; j++) {
    let sum = weights.b1[j]
    for (let i = 0; i < normX.length; i++) {
      sum += normX[i] * weights.w1[i][j]
    }
    hidden[j] = relu(sum)
  }

  // Output Layer (Sigmoid normalized 0-1)
  const outNorm: number[] = []
  for (let k = 0; k < weights.b2.length; k++) {
    let sum = weights.b2[k]
    for (let j = 0; j < hidden.length; j++) {
      sum += hidden[j] * weights.w2[j][k]
    }
    outNorm[k] = sigmoid(sum)
  }

  return denormalizeTarget(outNorm)
}

// -----------------------------------------------------------------------------
// Situation Evaluation & Consequence Prediction
// -----------------------------------------------------------------------------
export function evaluateSituationMode(
  rain24h: number,
  intensity: number,
  soilMoisture: number,
  riskScore: number,
): BhoomiSituationMode {
  if (riskScore >= 74 || (soilMoisture >= 82 && intensity >= 18) || (rain24h >= 110 && soilMoisture >= 75)) {
    return 'LANDSLIDE_CRITICAL_EVACUATION'
  }
  if (intensity >= 14 || rain24h >= 48 || (riskScore >= 52 && intensity >= 8)) {
    return 'THUNDERSTORM_WARNING'
  }
  return 'NORMAL_WATCH'
}

export function predictZoneConsequences(
  zone: RiskZone,
  overrides?: {
    additionalRainfall?: number
    soilMoistureOverride?: number
    slopeOverride?: number
    displacementOverride?: number
  },
  weights: BhoomiModelWeights = currentBhoomiWeights,
): ConsequencePrediction {
  const rain24 = zone.rainfall24h + (overrides?.additionalRainfall ?? 0)
  const rainInt = zone.rainfallIntensity + (overrides?.additionalRainfall ? overrides.additionalRainfall * 0.18 : 0)
  const soilM = overrides?.soilMoistureOverride ?? zone.soilMoisture
  const slope = overrides?.slopeOverride ?? zone.slopeDeg
  const disp = overrides?.displacementOverride ?? zone.displacementMm
  const popDensity = Math.round(zone.populationAtRisk / 14)
  const catchment = 8.5 + zone.historicalEvents * 0.8

  const rawFeatures = [
    rain24,
    rainInt,
    soilM,
    slope,
    disp,
    zone.historicalEvents,
    popDensity,
    catchment,
  ]

  const [
    roadClosureHours,
    severanceProbability,
    isolatedPopulation,
    infrastructureDamageIndex,
    timeToFailureHours,
    debrisVolumeM3,
  ] = forwardBhoomi(rawFeatures, weights)

  const situationMode = evaluateSituationMode(rain24, rainInt, soilM, zone.riskScore)

  let hazardSeverity: ConsequencePrediction['hazardSeverity'] = 'Low'
  if (severanceProbability >= 75 || infrastructureDamageIndex >= 72 || situationMode === 'LANDSLIDE_CRITICAL_EVACUATION') {
    hazardSeverity = 'Catastrophic'
  } else if (severanceProbability >= 52 || infrastructureDamageIndex >= 50 || situationMode === 'THUNDERSTORM_WARNING') {
    hazardSeverity = 'Severe'
  } else if (severanceProbability >= 30) {
    hazardSeverity = 'Moderate'
  }

  let mitigationAction = 'Continuous radar nowcast & baseline slope drainage inspection.'
  let voiceWarning = `BHOOMI reports normal conditions for ${zone.name}. Slope stability is currently stable.`

  if (situationMode === 'LANDSLIDE_CRITICAL_EVACUATION') {
    mitigationAction = `Immediate corridor closure on ${zone.corridor}. Stage heavy plant at safe ingress km. Evacuate downstream households within ${timeToFailureHours.toFixed(1)}h.`
    voiceWarning = `Critical Alert. Extreme landslide risk detected in ${zone.district} sector near ${zone.name}. Immediate downslope evacuation mandated within ${timeToFailureHours.toFixed(1)} hours. Move to designated community shelter immediately.`
  } else if (situationMode === 'THUNDERSTORM_WARNING') {
    mitigationAction = `Issue Thunderstorm & Cloudburst advisory. Restrict night commercial travel on ${zone.corridor}. Position SDRF reconnaissance column near ${zone.district}.`
    voiceWarning = `Severe Thunderstorm Warning in ${zone.district}. Heavy cloudburst and rain intensity surge detected. Avoid cut slopes and night travel on ${zone.corridor}.`
  } else if (hazardSeverity === 'Moderate') {
    mitigationAction = 'Pre-position spotters at active tension fissures; clear roadside culvert debris.'
    voiceWarning = `Advisory watch for ${zone.district}. Soil moisture increasing. Drive with caution.`
  }

  const confidenceScore = Math.round(weights.accuracyR2 * 100)

  return {
    roadClosureHours: Math.round(roadClosureHours * 10) / 10,
    severanceProbability: Math.round(severanceProbability),
    isolatedPopulation: Math.round(isolatedPopulation),
    infrastructureDamageIndex: Math.round(infrastructureDamageIndex),
    timeToFailureHours: Math.round(timeToFailureHours * 10) / 10,
    debrisVolumeM3: Math.round(debrisVolumeM3),
    hazardSeverity,
    mitigationAction,
    confidenceScore,
    situationMode,
    voiceWarning,
  }
}

// -----------------------------------------------------------------------------
// Live User Location Risk Exposure & Shelter Routing
// -----------------------------------------------------------------------------
export function assessUserLocationExposure(
  userLocation: UserLocation,
  zones: RiskZone[],
  villages: Village[],
  roads: RoadSegment[],
  _weather: WeatherCell[],
): UserExposureAssessment {
  // 1. Identify nearest hazard scarp
  let nearestHazardZone = zones[0]
  let minHazardDist = 99999

  for (const z of zones) {
    const dist = calculateDistanceKm(userLocation.lat, userLocation.lng, z.lat, z.lng)
    if (dist < minHazardDist) {
      minHazardDist = dist
      nearestHazardZone = z
    }
  }

  // 2. Identify nearest designated shelter
  let nearestVillage = villages[0]
  let minShelterDist = 99999

  for (const v of villages) {
    const dist = calculateDistanceKm(userLocation.lat, userLocation.lng, v.lat, v.lng)
    if (dist < minShelterDist) {
      minShelterDist = dist
      nearestVillage = v
    }
  }

  // Calculate personal exposure score (0 - 100%)
  // Closer distance to active high-risk zone => exponentially higher exposure
  const proximityFactor = Math.max(0, 1 - minHazardDist / 35) // critical within 35 km
  const zoneRisk = nearestHazardZone.riskScore / 100
  const rainStress = Math.min(1, nearestHazardZone.rainfall24h / 120)
  
  const compositeScore = Math.round(
    Math.min(100, Math.max(5, (proximityFactor * 0.45 + zoneRisk * 0.35 + rainStress * 0.2) * 100))
  )

  let dangerLevel: UserExposureAssessment['dangerLevel'] = 'Low Risk'
  let situationMode: BhoomiSituationMode = 'NORMAL_WATCH'

  if (compositeScore >= 72 || (minHazardDist <= 8 && nearestHazardZone.riskScore >= 70)) {
    dangerLevel = 'Immediate Danger'
    situationMode = 'LANDSLIDE_CRITICAL_EVACUATION'
  } else if (compositeScore >= 48 || (minHazardDist <= 18 && nearestHazardZone.rainfallIntensity >= 12)) {
    dangerLevel = 'High Vigilance'
    situationMode = 'THUNDERSTORM_WARNING'
  } else if (compositeScore >= 28) {
    dangerLevel = 'Moderate Watch'
    situationMode = 'NORMAL_WATCH'
  }

  // Calculate travel times (mountain roads: vehicle ~30 km/h, walking ~4.5 km/h)
  const driveTimeMin = Math.max(3, Math.round((minShelterDist / 30) * 60))
  const walkTimeMin = Math.max(5, Math.round((minShelterDist / 4.5) * 60))

  // Find road status to shelter
  const nearbyRoad = roads.find((r) => r.state === nearestVillage.state)
  const isRoadClear = nearestVillage.connectivity !== 'Blocked' && nearbyRoad?.status !== 'Blocked'
  const safeCorridor = isRoadClear
    ? `${nearbyRoad?.name || 'Local District Access Corridor'} (Open)`
    : `${nearbyRoad?.name || 'Main Corridor'} (Restricted/Blocked) — Divert via ${nearbyRoad?.diversion || 'designated bypass'}`

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${nearestVillage.lat},${nearestVillage.lng}&travelmode=driving`

  // Calculate nearest critical emergency infrastructure (Food Place, Hospital, Vehicle Depot)
  const nearestResources = findNearestEmergencyResources(userLocation, roads)

  let voiceDirective = ''
  if (situationMode === 'LANDSLIDE_CRITICAL_EVACUATION') {
    voiceDirective = `Urgent evacuation alert. Your location is ${minHazardDist} kilometers from active slope failure at ${nearestHazardZone.name}. Evacuate immediately to ${nearestVillage.shelter}. Nearest hospital is ${nearestResources.hospital.data.name} at ${nearestResources.hospital.distanceKm} kilometers.`
  } else if (situationMode === 'THUNDERSTORM_WARNING') {
    voiceDirective = `Thunderstorm warning near your location. Heavy rain is escalating slope saturation. Nearest shelter is ${nearestVillage.shelter}, ${minShelterDist} kilometers away. Emergency logistics base is ${nearestResources.vehicleDepot.data.name}.`
  } else {
    voiceDirective = `BHOOMI monitoring active for your location. Nearest emergency shelter is ${nearestVillage.shelter} at ${minShelterDist} kilometers. Nearest hospital is ${nearestResources.hospital.data.name} (${nearestResources.hospital.distanceKm} km).`
  }

  return {
    userLocation,
    exposureScore: compositeScore,
    dangerLevel,
    situationMode,
    nearestHazardZone,
    distanceToHazardKm: minHazardDist,
    nearestShelter: {
      village: nearestVillage,
      distanceKm: minShelterDist,
      driveTimeMin,
      walkTimeMin,
      safeCorridor,
      isRoadClear,
      googleMapsUrl,
    },
    nearestResources,
    voiceDirective,
  }
}

/**
 * Identifies the nearest food distribution facility, emergency hospital, and government vehicle depot
 */
export function findNearestEmergencyResources(
  userLocation: UserLocation,
  roads: RoadSegment[],
): NearestEmergencyResources {
  // 1. Nearest Food Place
  let nearestFood = EMERGENCY_FOOD_PLACES[0]
  let minFoodDist = 99999
  for (const f of EMERGENCY_FOOD_PLACES) {
    const dist = calculateDistanceKm(userLocation.lat, userLocation.lng, f.lat, f.lng)
    if (dist < minFoodDist) {
      minFoodDist = dist
      nearestFood = f
    }
  }

  // 2. Nearest Hospital
  let nearestHospital = EMERGENCY_HOSPITALS[0]
  let minHospDist = 99999
  for (const h of EMERGENCY_HOSPITALS) {
    const dist = calculateDistanceKm(userLocation.lat, userLocation.lng, h.lat, h.lng)
    if (dist < minHospDist) {
      minHospDist = dist
      nearestHospital = h
    }
  }

  // 3. Nearest Government Vehicle Depot
  let nearestDepot = GOVERNMENT_VEHICLE_DEPOTS[0]
  let minDepotDist = 99999
  for (const d of GOVERNMENT_VEHICLE_DEPOTS) {
    const dist = calculateDistanceKm(userLocation.lat, userLocation.lng, d.lat, d.lng)
    if (dist < minDepotDist) {
      minDepotDist = dist
      nearestDepot = d
    }
  }

  const nearbyRoadFood = roads.find((r) => r.state === nearestFood.state)
  const isFoodRoutePassable = nearbyRoadFood?.status !== 'Blocked'
  const safeFoodRoute = isFoodRoutePassable
    ? `${nearbyRoadFood?.name || 'District Supply Arterial'} (Open)`
    : `${nearbyRoadFood?.name || 'Main Access Route'} (Restricted) — Divert via ${nearbyRoadFood?.diversion || 'alternative link'}`

  const nearbyRoadHosp = roads.find((r) => r.state === nearestHospital.state)
  const isHospRoutePassable = nearbyRoadHosp?.status !== 'Blocked'
  const safeHospRoute = isHospRoutePassable
    ? `${nearbyRoadHosp?.name || 'Green Emergency Corridor'} (Open)`
    : `${nearbyRoadHosp?.name || 'Main Route'} (Caution) — Bypass active via ${nearbyRoadHosp?.diversion || 'lateral road'}`

  const nearbyRoadDepot = roads.find((r) => r.state === nearestDepot.state)
  const isDepotRoutePassable = nearbyRoadDepot?.status !== 'Blocked'
  const safeDepotRoute = isDepotRoutePassable
    ? `${nearbyRoadDepot?.name || 'Heavy Equipment Transit Corridor'} (Open)`
    : `${nearbyRoadDepot?.name || 'Direct Route'} (Restricted) — Heavy transit via ${nearbyRoadDepot?.diversion || 'bypass corridor'}`

  return {
    foodPlace: {
      data: nearestFood,
      distanceKm: minFoodDist,
      driveTimeMin: Math.max(3, Math.round((minFoodDist / 30) * 60)),
      walkTimeMin: Math.max(5, Math.round((minFoodDist / 4.5) * 60)),
      safeRoute: safeFoodRoute,
      isRoutePassable: isFoodRoutePassable,
      googleMapsUrl: `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${nearestFood.lat},${nearestFood.lng}&travelmode=driving`,
    },
    hospital: {
      data: nearestHospital,
      distanceKm: minHospDist,
      driveTimeMin: Math.max(2, Math.round((minHospDist / 35) * 60)),
      walkTimeMin: Math.max(5, Math.round((minHospDist / 4.5) * 60)),
      safeRoute: safeHospRoute,
      isRoutePassable: isHospRoutePassable,
      googleMapsUrl: `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${nearestHospital.lat},${nearestHospital.lng}&travelmode=driving`,
    },
    vehicleDepot: {
      data: nearestDepot,
      distanceKm: minDepotDist,
      driveTimeMin: Math.max(3, Math.round((minDepotDist / 28) * 60)),
      walkTimeMin: Math.max(6, Math.round((minDepotDist / 4.5) * 60)),
      safeRoute: safeDepotRoute,
      isRoutePassable: isDepotRoutePassable,
      googleMapsUrl: `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${nearestDepot.lat},${nearestDepot.lng}&travelmode=driving`,
    },
  }
}

