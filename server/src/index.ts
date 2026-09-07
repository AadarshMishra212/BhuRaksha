import http from 'node:http'
import express from 'express'
import cors from 'cors'
import { WebSocketServer, WebSocket } from 'ws'
import { db, initDatabase } from './db'
import { authRouter } from './routes/auth'
import { zonesRouter } from './routes/zones'
import { sensorsRouter } from './routes/sensors'
import { roadsRouter } from './routes/roads'
import { villagesRouter } from './routes/villages'
import { alertsRouter } from './routes/alerts'
import { reportsRouter } from './routes/reports'
import { actionsRouter } from './routes/actions'
import { weatherRouter } from './routes/weather'
import { sitrepsRouter } from './routes/sitreps'
import { stepZone } from '../../src/engine/riskModel'
import type { AlertRecord, RiskZone, SensorNode } from '../../src/types'

const PORT = Number(process.env.PORT || 3001)

// 1. Initialize SQLite Database
initDatabase()

const app = express()
app.use(cors({ origin: '*' }))
app.use(express.json({ limit: '15mb' }))

// 2. Health & Statistics endpoint
app.get('/api/health', (_req, res) => {
  const zoneCount = db.prepare('SELECT COUNT(*) as c FROM risk_zones').get() as { c: number }
  const sensorCount = db.prepare('SELECT COUNT(*) as c FROM sensor_nodes').get() as { c: number }
  const alertCount = db.prepare('SELECT COUNT(*) as c FROM alerts').get() as { c: number }

  res.json({
    status: 'online',
    database: 'SQLite 3 (WAL mode)',
    uptimeSeconds: Math.floor(process.uptime()),
    stats: {
      zones: zoneCount.c,
      sensors: sensorCount.c,
      alerts: alertCount.c,
    },
    timestamp: new Date().toISOString(),
  })
})

// 3. Mount API Routers
app.use('/api/auth', authRouter)
app.use('/api/zones', zonesRouter)
app.use('/api/sensors', sensorsRouter)
app.use('/api/roads', roadsRouter)
app.use('/api/villages', villagesRouter)
app.use('/api/alerts', alertsRouter)
app.use('/api/reports', reportsRouter)
app.use('/api/actions', actionsRouter)
app.use('/api/weather', weatherRouter)
app.use('/api/sitreps', sitrepsRouter)

// 4. Create HTTP & WebSocket Server
const server = http.createServer(app)
const wss = new WebSocketServer({ server, path: '/ws' })

const clients = new Set<WebSocket>()

wss.on('connection', (ws) => {
  clients.add(ws)
  console.log(`🔌 Client connected to live SEOC WebSocket stream (Total: ${clients.size})`)

  // Send initial handshake
  ws.send(JSON.stringify({ type: 'CONNECTED', message: 'Connected to Bhuraksha Telemetry Stream' }))

  ws.on('close', () => {
    clients.delete(ws)
  })

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString())
      if (msg.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG' }))
      }
    } catch (e) {
      console.error('WS parse error', e)
    }
  })
})

function broadcast(payload: any) {
  const msg = JSON.stringify(payload)
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg)
    }
  }
}

// 5. Automated Background Telemetry & Physical Step Loop
let tickCount = 0

function runTelemetryCycle() {
  tickCount += 1

  // Fetch all current zones
  const zoneRows = db.prepare('SELECT * FROM risk_zones').all() as any[]
  if (zoneRows.length === 0) return

  const updatedZones: RiskZone[] = []
  const newAlerts: AlertRecord[] = []

  const updateZoneStmt = db.prepare(`
    UPDATE risk_zones SET
      rainfall_24h = ?,
      rainfall_intensity = ?,
      soil_moisture = ?,
      displacement_mm = ?,
      ndvi_stress = ?,
      risk_score = ?,
      severity = ?,
      forecast_6h_json = ?,
      explain_json = ?,
      last_updated = ?
    WHERE id = ?
  `)

  for (const row of zoneRows) {
    const currentZone: RiskZone = {
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

    const stepped = stepZone(currentZone, tickCount)
    updatedZones.push(stepped)

    updateZoneStmt.run(
      stepped.rainfall24h,
      stepped.rainfallIntensity,
      stepped.soilMoisture,
      stepped.displacementMm,
      stepped.ndviStress,
      stepped.riskScore,
      stepped.severity,
      JSON.stringify(stepped.forecast6h),
      JSON.stringify(stepped.explain),
      stepped.lastUpdated,
      stepped.id,
    )

    // Check for critical alert triggers
    if (stepped.severity === 'Critical' && currentZone.severity !== 'Critical') {
      const alertId = `AL-${Date.now()}-${stepped.id}`
      const alertObj: AlertRecord = {
        id: alertId,
        time: new Date().toISOString(),
        zoneId: stepped.id,
        zoneName: stepped.name,
        severity: 'Critical',
        title: `CRITICAL landslide alert — ${stepped.district}`,
        message: {
          en: `Critical risk on ${stepped.corridor}. Rain ${stepped.rainfall24h.toFixed(0)} mm / 24h. Move people away from cut slopes.`,
          hi: `${stepped.district} में अत्यधिक भूस्खलन चेतावनी। ढलानों से दूर रहें।`,
          as: `${stepped.district}ত বিপজ্জনক ভূমিস্খলন সতর্কবাণী।`,
        },
        channels: ['App', 'SMS', 'IVRS', 'Control Room'],
        recipients: Math.round(stepped.populationAtRisk * 0.8),
        acknowledged: false,
        source: 'Sensor threshold',
      }

      db.prepare(`
        INSERT INTO alerts (
          id, time, zone_id, zone_name, severity, title, message_en, message_hi, message_as, channels_json, recipients, acknowledged, source
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        alertObj.id,
        alertObj.time,
        alertObj.zoneId,
        alertObj.zoneName,
        alertObj.severity,
        alertObj.title,
        alertObj.message.en,
        alertObj.message.hi,
        alertObj.message.as,
        JSON.stringify(alertObj.channels),
        alertObj.recipients,
        0,
        alertObj.source,
      )

      newAlerts.push(alertObj)
    }
  }

  // Update sensors in SQLite
  const sensorRows = db.prepare('SELECT * FROM sensor_nodes').all() as any[]
  const updatedSensors: SensorNode[] = []
  const updateSensorStmt = db.prepare(`
    UPDATE sensor_nodes SET value = ?, status = ?, battery = ?, updated_at = ? WHERE id = ?
  `)

  sensorRows.forEach((s, i) => {
    const z = updatedZones.find((x) => x.id === s.zone_id)
    if (!z) return
    let value = s.value
    if (s.type === 'Rain gauge') value = z.rainfallIntensity
    if (s.type === 'Soil moisture') value = z.soilMoisture
    if (s.type === 'GNSS') value = z.displacementMm
    if (s.type === 'Piezometer') value = 18 + z.soilMoisture * 0.6
    if (s.type === 'AWS') value = z.rainfall24h
    if (s.type === 'InSAR proxy') value = z.displacementMm * 11

    const offline = (i + Math.round(z.riskScore)) % 41 > 38
    const degraded = z.rainfallIntensity > 18
    const status = offline ? 'Offline' : degraded ? 'Degraded' : 'Online'
    const battery = Math.max(12, s.battery - (offline ? 0.3 : 0.01))

    updateSensorStmt.run(value, status, battery, new Date().toISOString(), s.id)

    updatedSensors.push({
      id: s.id,
      name: s.name,
      type: s.type,
      zoneId: s.zone_id,
      lat: s.lat,
      lng: s.lng,
      value,
      unit: s.unit,
      status,
      battery,
    })
  })

  // Broadcast live payload to all connected clients
  if (clients.size > 0) {
    broadcast({
      type: 'TELEMETRY_TICK',
      tick: tickCount,
      zones: updatedZones,
      sensors: updatedSensors,
      newAlerts,
      timestamp: new Date().toISOString(),
    })
  }
}

// Start simulation loop every 2.5 seconds
setInterval(runTelemetryCycle, 2500)

// 6. Start listening
server.listen(PORT, () => {
  console.log(`\n🛡️ ===================================================`)
  console.log(`📡 BHURAKSHA SEOC Backend API & Database Live`)
  console.log(`🚀 REST API:     http://localhost:${PORT}/api`)
  console.log(`🔌 WebSocket:    ws://localhost:${PORT}/ws`)
  console.log(`🗄️ Database:     SQLite3 (server/data/bhuraksha.db)`)
  console.log(`🛡️ ===================================================\n`)
})
