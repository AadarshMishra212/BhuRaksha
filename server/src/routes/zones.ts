import { Router } from 'express'
import { db } from '../db'
import type { RiskZone } from '../../src/types'

export const zonesRouter = Router()

function formatZone(row: any): RiskZone {
  return {
    id: row.id,
    name: row.name,
    state: row.state,
    district: row.district,
    lat: row.lat,
    lng: row.lng,
    slopeDeg: row.slope_deg,
    lithology: row.lithology,
    landUse: row.land_use,
    historicalEvents: row.historical_events,
    populationAtRisk: row.population_at_risk,
    corridor: row.corridor,
    villages: JSON.parse(row.villages_json || '[]'),
    rainfall24h: row.rainfall_24h,
    rainfallIntensity: row.rainfall_intensity,
    soilMoisture: row.soil_moisture,
    displacementMm: row.displacement_mm,
    ndviStress: row.ndvi_stress,
    riskScore: row.risk_score,
    severity: row.severity,
    forecast6h: JSON.parse(row.forecast_6h_json || '[]'),
    explain: JSON.parse(row.explain_json || '[]'),
    lastUpdated: row.last_updated,
  }
}

zonesRouter.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM risk_zones ORDER BY risk_score DESC').all()
  res.json(rows.map(formatZone))
})

zonesRouter.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM risk_zones WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ error: 'Zone not found' })
  res.json(formatZone(row))
})

zonesRouter.patch('/:id', (req, res) => {
  const { rainfall24h, rainfallIntensity, soilMoisture, displacementMm, riskScore, severity } = req.body
  const zone = db.prepare('SELECT * FROM risk_zones WHERE id = ?').get(req.params.id) as any
  if (!zone) return res.status(404).json({ error: 'Zone not found' })

  const now = new Date().toISOString()
  db.prepare(`
    UPDATE risk_zones SET
      rainfall_24h = COALESCE(?, rainfall_24h),
      rainfall_intensity = COALESCE(?, rainfall_intensity),
      soil_moisture = COALESCE(?, soil_moisture),
      displacement_mm = COALESCE(?, displacement_mm),
      risk_score = COALESCE(?, risk_score),
      severity = COALESCE(?, severity),
      last_updated = ?
    WHERE id = ?
  `).run(rainfall24h, rainfallIntensity, soilMoisture, displacementMm, riskScore, severity, now, req.params.id)

  const updated = db.prepare('SELECT * FROM risk_zones WHERE id = ?').get(req.params.id)
  res.json(formatZone(updated))
})
