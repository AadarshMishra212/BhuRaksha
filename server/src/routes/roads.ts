import { Router } from 'express'
import { db } from '../db'
import type { RoadSegment } from '../../src/types'

export const roadsRouter = Router()

function formatRoad(row: any): RoadSegment {
  return {
    id: row.id,
    name: row.name,
    state: row.state,
    path: JSON.parse(row.path_json || '[]'),
    status: row.status,
    zoneIds: JSON.parse(row.zone_ids_json || '[]'),
    diversion: row.diversion,
  }
}

roadsRouter.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM road_segments').all()
  res.json(rows.map(formatRoad))
})

roadsRouter.patch('/:id', (req, res) => {
  const { status, diversion } = req.body
  const now = new Date().toISOString()
  db.prepare(`
    UPDATE road_segments SET
      status = COALESCE(?, status),
      diversion = COALESCE(?, diversion),
      updated_at = ?
    WHERE id = ?
  `).run(status ?? null, diversion ?? null, now, req.params.id)

  const updated = db.prepare('SELECT * FROM road_segments WHERE id = ?').get(req.params.id)
  if (!updated) return res.status(404).json({ error: 'Road segment not found' })
  res.json(formatRoad(updated))
})
