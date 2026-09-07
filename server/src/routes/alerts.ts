import { Router } from 'express'
import { db } from '../db'
import type { AlertRecord } from '../../src/types'

export const alertsRouter = Router()

function formatAlert(row: any): AlertRecord {
  return {
    id: row.id,
    time: row.time,
    zoneId: row.zone_id,
    zoneName: row.zone_name,
    severity: row.severity,
    title: row.title,
    message: {
      en: row.message_en,
      hi: row.message_hi,
      as: row.message_as,
    },
    channels: JSON.parse(row.channels_json || '[]'),
    recipients: row.recipients,
    acknowledged: Boolean(row.acknowledged),
    source: row.source,
  }
}

alertsRouter.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM alerts ORDER BY time DESC LIMIT 100').all()
  res.json(rows.map(formatAlert))
})

alertsRouter.patch('/:id/ack', (req, res) => {
  db.prepare('UPDATE alerts SET acknowledged = 1 WHERE id = ?').run(req.params.id)
  const updated = db.prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id)
  if (!updated) return res.status(404).json({ error: 'Alert not found' })
  res.json(formatAlert(updated))
})

alertsRouter.post('/broadcast', (req, res) => {
  const { alert }: { alert: AlertRecord } = req.body
  if (!alert || !alert.id) {
    return res.status(400).json({ error: 'Valid alert payload required' })
  }

  const insert = db.prepare(`
    INSERT INTO alerts (
      id, time, zone_id, zone_name, severity, title, message_en, message_hi, message_as, channels_json, recipients, acknowledged, source
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  insert.run(
    alert.id,
    alert.time,
    alert.zoneId,
    alert.zoneName,
    alert.severity,
    alert.title,
    alert.message.en,
    alert.message.hi,
    alert.message.as,
    JSON.stringify(alert.channels),
    alert.recipients,
    alert.acknowledged ? 1 : 0,
    alert.source,
  )

  const created = db.prepare('SELECT * FROM alerts WHERE id = ?').get(alert.id)
  res.status(201).json(formatAlert(created))
})
