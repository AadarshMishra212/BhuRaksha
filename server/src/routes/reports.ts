import { Router } from 'express'
import { db } from '../db'
import type { FieldReport } from '../../src/types'

export const reportsRouter = Router()

function formatReport(row: any): FieldReport {
  return {
    id: row.id,
    time: row.time,
    reporter: row.reporter,
    role: row.role,
    zoneId: row.zone_id,
    lat: row.lat,
    lng: row.lng,
    category: row.category,
    note: row.note,
    photoName: row.photo_name,
    photoData: row.photo_data,
    status: row.status,
  }
}

reportsRouter.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM field_reports ORDER BY time DESC').all()
  res.json(rows.map(formatReport))
})

reportsRouter.post('/', (req, res) => {
  const report: FieldReport = req.body
  if (!report || !report.id || !report.note) {
    return res.status(400).json({ error: 'Valid field report payload required' })
  }

  const insert = db.prepare(`
    INSERT INTO field_reports (
      id, time, reporter, role, zone_id, lat, lng, category, note, photo_name, photo_data, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  insert.run(
    report.id,
    report.time,
    report.reporter,
    report.role,
    report.zoneId,
    report.lat,
    report.lng,
    report.category,
    report.note,
    report.photoName,
    report.photoData ?? null,
    report.status,
  )

  const created = db.prepare('SELECT * FROM field_reports WHERE id = ?').get(report.id)
  res.status(201).json(formatReport(created))
})
