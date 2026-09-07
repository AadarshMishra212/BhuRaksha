import { Router } from 'express'
import { db } from '../db'
import type { IncidentAction } from '../../src/types'

export const actionsRouter = Router()

function formatAction(row: any): IncidentAction {
  return {
    id: row.id,
    zoneId: row.zone_id,
    priority: row.priority,
    etaMin: row.eta_min,
    unit: row.unit,
    action: row.action,
    status: row.status,
  }
}

actionsRouter.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM incident_actions ORDER BY priority ASC').all()
  res.json(rows.map(formatAction))
})

actionsRouter.patch('/:id/status', (req, res) => {
  const { status } = req.body
  db.prepare('UPDATE incident_actions SET status = ? WHERE id = ?').run(status, req.params.id)
  const updated = db.prepare('SELECT * FROM incident_actions WHERE id = ?').get(req.params.id)
  if (!updated) return res.status(404).json({ error: 'Action not found' })
  res.json(formatAction(updated))
})
