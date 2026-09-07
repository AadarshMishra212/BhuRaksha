import { Router } from 'express'
import { db } from '../db'

export const authRouter = Router()

authRouter.post('/login', (req, res) => {
  const { username, password, role, agency, posting } = req.body
  if (!username || !password) {
    return res.status(400).json({ error: 'Officer surname/name and password are required' })
  }

  const cleanName = String(username).trim()
  const cleanPass = String(password).trim()
  const cleanRole = role || 'ndma'
  const cleanAgency =
    agency ||
    (cleanRole === 'ndma'
      ? 'NDMA / MDoNER Joint Operations'
      : cleanRole === 'district'
        ? 'District Disaster Management Authority'
        : cleanRole === 'field'
          ? 'Field Response Cell / PWD'
          : 'Village Disaster Management Committee')
  const cleanPosting = posting || 'Northeast Command Sector'

  // Look for existing user by username or full name
  const existingUser = db
    .prepare(
      'SELECT id, username, name, role, agency, posting, password FROM users WHERE LOWER(username) = LOWER(?) OR LOWER(name) = LOWER(?)',
    )
    .get(cleanName, cleanName) as any

  if (existingUser) {
    return res.json({
      user: {
        id: existingUser.id,
        name: existingUser.name,
        role: existingUser.role,
        agency: existingUser.agency,
        posting: existingUser.posting,
      },
    })
  }

  // Auto-provision and persist new dynamic user into SQLite database
  const newId = `u-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`
  const cleanUsername = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_') || `officer_${Date.now()}`

  try {
    const insertUser = db.prepare(`
      INSERT INTO users (id, username, password, name, role, agency, posting, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    insertUser.run(
      newId,
      cleanUsername,
      cleanPass,
      cleanName,
      cleanRole,
      cleanAgency,
      cleanPosting,
      new Date().toISOString(),
    )
  } catch {
    // In case of unique constraint or other db race, continue
  }

  res.json({
    user: {
      id: newId,
      name: cleanName,
      role: cleanRole,
      agency: cleanAgency,
      posting: cleanPosting,
    },
  })
})

authRouter.get('/users', (_req, res) => {
  const users = db.prepare('SELECT id, username, name, role, agency, posting FROM users').all()
  res.json(users)
})

