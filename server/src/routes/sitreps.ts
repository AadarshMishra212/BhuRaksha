import { Router } from 'express'
import { db } from '../db'
import type { SitrepMeta } from '../../src/types'

export const sitrepsRouter = Router()

sitrepsRouter.get('/', (_req, res) => {
  const rows = db.prepare('SELECT id, generated_at, author, title FROM sitreps ORDER BY generated_at DESC').all() as any[]
  res.json(
    rows.map((r) => ({
      id: r.id,
      generatedAt: r.generated_at,
      author: r.author,
      title: r.title,
    })),
  )
})

sitrepsRouter.post('/', (req, res) => {
  const { sitrep }: { sitrep: SitrepMeta } = req.body
  if (!sitrep || !sitrep.id) {
    return res.status(400).json({ error: 'Valid SITREP payload required' })
  }

  db.prepare(`
    INSERT INTO sitreps (id, generated_at, author, title, content_json)
    VALUES (?, ?, ?, ?, ?)
  `).run(sitrep.id, sitrep.generatedAt, sitrep.author, sitrep.title, JSON.stringify(sitrep))

  res.status(201).json(sitrep)
})
