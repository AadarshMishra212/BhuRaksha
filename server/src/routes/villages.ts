import { Router } from 'express'
import { db } from '../db'
import type { Village } from '../../src/types'

export const villagesRouter = Router()

function formatVillage(row: any): Village {
  return {
    id: row.id,
    name: row.name,
    state: row.state,
    district: row.district,
    lat: row.lat,
    lng: row.lng,
    households: row.households,
    connectivity: row.connectivity,
    shelter: row.shelter,
    language: row.language,
  }
}

villagesRouter.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM villages').all()
  res.json(rows.map(formatVillage))
})
