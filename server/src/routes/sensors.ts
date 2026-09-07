import { Router } from 'express'
import { db } from '../db'
import type { SensorNode } from '../../src/types'

export const sensorsRouter = Router()

function formatSensor(row: any): SensorNode {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    zoneId: row.zone_id,
    lat: row.lat,
    lng: row.lng,
    value: row.value,
    unit: row.unit,
    status: row.status,
    battery: row.battery,
  }
}

sensorsRouter.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM sensor_nodes').all()
  res.json(rows.map(formatSensor))
})

sensorsRouter.post('/telemetry', (req, res) => {
  const updates: Array<{ id: string; value: number; status?: string; battery?: number }> = req.body
  if (!Array.isArray(updates)) {
    return res.status(400).json({ error: 'Expected an array of telemetry updates' })
  }

  const now = new Date().toISOString()
  const updateStmt = db.prepare(`
    UPDATE sensor_nodes SET
      value = ?,
      status = COALESCE(?, status),
      battery = COALESCE(?, battery),
      updated_at = ?
    WHERE id = ?
  `)

  for (const u of updates) {
    updateStmt.run(u.value, u.status ?? null, u.battery ?? null, now, u.id)
  }

  res.json({ success: true, count: updates.length })
})
