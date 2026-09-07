import type { FeatureContribution, RiskZone, Severity } from '../types'
import type { ZoneSeed } from '../data/catalog'

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export function severityOf(score: number): Severity {
  if (score >= 76) return 'Critical'
  if (score >= 56) return 'High'
  if (score >= 36) return 'Moderate'
  return 'Low'
}

export function severityColor(s: Severity) {
  if (s === 'Critical') return '#e07040'
  if (s === 'High') return '#e0b04a'
  if (s === 'Moderate') return '#5aa7b8'
  return '#9ccc65'
}

function nRain(mm: number) {
  return clamp(mm / 140, 0, 1)
}
function nIntensity(mmh: number) {
  return clamp(mmh / 28, 0, 1)
}
function nSoil(pct: number) {
  return clamp((pct - 18) / 62, 0, 1)
}
function nSlope(deg: number) {
  return clamp((deg - 18) / 40, 0, 1)
}
function nDisp(mm: number) {
  return clamp(mm / 18, 0, 1)
}
function nHist(n: number) {
  return clamp(n / 18, 0, 1)
}

export function scoreZone(input: {
  rainfall24h: number
  rainfallIntensity: number
  soilMoisture: number
  slopeDeg: number
  displacementMm: number
  ndviStress: number
  historicalEvents: number
}): { score: number; explain: FeatureContribution[] } {
  const parts: FeatureContribution[] = [
    {
      feature: '24h rainfall (IMD / AWS)',
      value: `${input.rainfall24h.toFixed(1)} mm`,
      weight: 0.28,
      contribution: 0.28 * nRain(input.rainfall24h),
    },
    {
      feature: 'Short-burst intensity',
      value: `${input.rainfallIntensity.toFixed(1)} mm/h`,
      weight: 0.12,
      contribution: 0.12 * nIntensity(input.rainfallIntensity),
    },
    {
      feature: 'Soil moisture',
      value: `${input.soilMoisture.toFixed(0)}%`,
      weight: 0.18,
      contribution: 0.18 * nSoil(input.soilMoisture),
    },
    {
      feature: 'Slope angle',
      value: `${input.slopeDeg.toFixed(0)}°`,
      weight: 0.14,
      contribution: 0.14 * nSlope(input.slopeDeg),
    },
    {
      feature: 'GNSS / InSAR displacement',
      value: `${input.displacementMm.toFixed(1)} mm`,
      weight: 0.1,
      contribution: 0.1 * nDisp(input.displacementMm),
    },
    {
      feature: 'Vegetation / NDVI stress',
      value: input.ndviStress.toFixed(2),
      weight: 0.08,
      contribution: 0.08 * clamp(input.ndviStress, 0, 1),
    },
    {
      feature: 'Historical landslide density',
      value: `${input.historicalEvents} events`,
      weight: 0.1,
      contribution: 0.1 * nHist(input.historicalEvents),
    },
  ]
  const raw = parts.reduce((s, p) => s + p.contribution, 0)
  return { score: clamp(raw * 100, 4, 98), explain: parts }
}

export function hydrateZone(seed: ZoneSeed, now: Date): RiskZone {
  const rainfall24h = seed.baseRain
  const rainfallIntensity = seed.baseRain / 18
  const soilMoisture = 38 + seed.baseRain / 4
  const displacementMm = seed.historicalEvents * 0.35
  const ndviStress = clamp(seed.slopeDeg / 80 + seed.baseRain / 400, 0, 1)
  const { score, explain } = scoreZone({
    rainfall24h,
    rainfallIntensity,
    soilMoisture,
    slopeDeg: seed.slopeDeg,
    displacementMm,
    ndviStress,
    historicalEvents: seed.historicalEvents,
  })
  const forecast6h = Array.from({ length: 6 }, (_, i) =>
    clamp(score + (i + 1) * (seed.baseRain > 45 ? 3.2 : 1.1) - 2, 5, 99),
  )
  return {
    ...seed,
    rainfall24h,
    rainfallIntensity,
    soilMoisture,
    displacementMm,
    ndviStress,
    riskScore: score,
    severity: severityOf(score),
    forecast6h,
    explain,
    lastUpdated: now.toISOString(),
  }
}

export function stepZone(zone: RiskZone, t: number): RiskZone {
  const wave = Math.sin(t / 7 + zone.lat) * 4.5
  const burst = Math.sin(t / 3 + zone.lng) > 0.82 ? 6.5 : 0
  const rainfall24h = clamp(zone.rainfall24h + wave * 0.35 + burst * 0.2 - 0.15, 8, 160)
  const rainfallIntensity = clamp(zone.rainfallIntensity + burst * 0.35 + wave * 0.08 - 0.05, 0.4, 32)
  const soilMoisture = clamp(zone.soilMoisture + rainfallIntensity * 0.12 - 0.35, 20, 92)
  const displacementMm = clamp(zone.displacementMm + (soilMoisture > 70 ? 0.08 : 0.01), 0.2, 22)
  const ndviStress = clamp(zone.ndviStress + (rainfall24h > 80 ? 0.004 : -0.001), 0.05, 0.95)
  const { score, explain } = scoreZone({
    rainfall24h,
    rainfallIntensity,
    soilMoisture,
    slopeDeg: zone.slopeDeg,
    displacementMm,
    ndviStress,
    historicalEvents: zone.historicalEvents,
  })
  const forecast6h = Array.from({ length: 6 }, (_, i) =>
    clamp(score + (i + 1) * (rainfallIntensity > 8 ? 2.8 : 0.9) + wave, 5, 99),
  )
  return {
    ...zone,
    rainfall24h,
    rainfallIntensity,
    soilMoisture,
    displacementMm,
    ndviStress,
    riskScore: score,
    severity: severityOf(score),
    forecast6h,
    explain,
    lastUpdated: new Date().toISOString(),
  }
}
