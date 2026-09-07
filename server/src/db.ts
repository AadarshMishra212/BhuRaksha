import { DatabaseSync } from 'node:sqlite'
import fs from 'node:fs'
import path from 'node:path'
import { DEMO_USERS, ROADS, VILLAGES, ZONE_SEEDS, buildSensors } from '../../src/data/catalog'
import { hydrateZone } from '../../src/engine/riskModel'

// Ensure server data directory exists
const dataDir = path.resolve(process.cwd(), 'server', 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, 'bhuraksha.db')
export const db = new DatabaseSync(dbPath)

// Enable WAL mode for performance
db.exec('PRAGMA journal_mode = WAL;')
db.exec('PRAGMA foreign_keys = ON;')

export function initDatabase() {
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      agency TEXT NOT NULL,
      posting TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS risk_zones (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      state TEXT NOT NULL,
      district TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      slope_deg REAL NOT NULL,
      lithology TEXT NOT NULL,
      land_use TEXT NOT NULL,
      historical_events INTEGER NOT NULL,
      population_at_risk INTEGER NOT NULL,
      corridor TEXT NOT NULL,
      villages_json TEXT NOT NULL,
      rainfall_24h REAL NOT NULL,
      rainfall_intensity REAL NOT NULL,
      soil_moisture REAL NOT NULL,
      displacement_mm REAL NOT NULL,
      ndvi_stress REAL NOT NULL,
      risk_score REAL NOT NULL,
      severity TEXT NOT NULL,
      forecast_6h_json TEXT NOT NULL,
      explain_json TEXT NOT NULL,
      last_updated TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sensor_nodes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      zone_id TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      value REAL NOT NULL,
      unit TEXT NOT NULL,
      status TEXT NOT NULL,
      battery REAL NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (zone_id) REFERENCES risk_zones(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS road_segments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      state TEXT NOT NULL,
      path_json TEXT NOT NULL,
      status TEXT NOT NULL,
      zone_ids_json TEXT NOT NULL,
      diversion TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS villages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      state TEXT NOT NULL,
      district TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      households INTEGER NOT NULL,
      connectivity TEXT NOT NULL,
      shelter TEXT NOT NULL,
      language TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      time TEXT NOT NULL,
      zone_id TEXT NOT NULL,
      zone_name TEXT NOT NULL,
      severity TEXT NOT NULL,
      title TEXT NOT NULL,
      message_en TEXT NOT NULL,
      message_hi TEXT NOT NULL,
      message_as TEXT NOT NULL,
      channels_json TEXT NOT NULL,
      recipients INTEGER NOT NULL,
      acknowledged INTEGER NOT NULL DEFAULT 0,
      source TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS field_reports (
      id TEXT PRIMARY KEY,
      time TEXT NOT NULL,
      reporter TEXT NOT NULL,
      role TEXT NOT NULL,
      zone_id TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      category TEXT NOT NULL,
      note TEXT NOT NULL,
      photo_name TEXT NOT NULL,
      photo_data TEXT,
      status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS incident_actions (
      id TEXT PRIMARY KEY,
      zone_id TEXT NOT NULL,
      priority INTEGER NOT NULL,
      eta_min INTEGER NOT NULL,
      unit TEXT NOT NULL,
      action TEXT NOT NULL,
      status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS weather_cells (
      id TEXT PRIMARY KEY,
      state TEXT NOT NULL,
      district TEXT NOT NULL,
      condition TEXT NOT NULL,
      rainfall_mm REAL NOT NULL,
      humidity REAL NOT NULL,
      wind_kph REAL NOT NULL,
      warning TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sitreps (
      id TEXT PRIMARY KEY,
      generated_at TEXT NOT NULL,
      author TEXT NOT NULL,
      title TEXT NOT NULL,
      content_json TEXT NOT NULL
    );
  `)

  // Seed data if database is new
  seedInitialData()
}

function seedInitialData() {
  const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }
  if (userCount.c > 0) return

  console.log('⚡ Seeding initial Bhuraksha relational data into SQLite database...')

  const now = new Date()
  const nowIso = now.toISOString()

  // 1. Seed users
  const insertUser = db.prepare(`
    INSERT INTO users (id, username, password, name, role, agency, posting, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)
  for (const u of DEMO_USERS) {
    insertUser.run(u.id, u.username, u.password, u.name, u.role, u.agency, u.posting, nowIso)
  }

  // 2. Seed risk zones
  const insertZone = db.prepare(`
    INSERT INTO risk_zones (
      id, name, state, district, lat, lng, slope_deg, lithology, land_use,
      historical_events, population_at_risk, corridor, villages_json, rainfall_24h,
      rainfall_intensity, soil_moisture, displacement_mm, ndvi_stress, risk_score,
      severity, forecast_6h_json, explain_json, last_updated
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const hydratedZones = ZONE_SEEDS.map((s) => hydrateZone(s, now))
  for (const z of hydratedZones) {
    insertZone.run(
      z.id,
      z.name,
      z.state,
      z.district,
      z.lat,
      z.lng,
      z.slopeDeg,
      z.lithology,
      z.landUse,
      z.historicalEvents,
      z.populationAtRisk,
      z.corridor,
      JSON.stringify(z.villages),
      z.rainfall24h,
      z.rainfallIntensity,
      z.soilMoisture,
      z.displacementMm,
      z.ndviStress,
      z.riskScore,
      z.severity,
      JSON.stringify(z.forecast6h),
      JSON.stringify(z.explain),
      z.lastUpdated,
    )
  }

  // 3. Seed sensor nodes
  const insertSensor = db.prepare(`
    INSERT INTO sensor_nodes (id, name, type, zone_id, lat, lng, value, unit, status, battery, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const sensors = buildSensors()
  for (const s of sensors) {
    insertSensor.run(s.id, s.name, s.type, s.zoneId, s.lat, s.lng, s.value, s.unit, s.status, s.battery, nowIso)
  }

  // 4. Seed road segments
  const insertRoad = db.prepare(`
    INSERT INTO road_segments (id, name, state, path_json, status, zone_ids_json, diversion, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)
  for (const r of ROADS) {
    insertRoad.run(r.id, r.name, r.state, JSON.stringify(r.path), r.status, JSON.stringify(r.zoneIds), r.diversion, nowIso)
  }

  // 5. Seed villages
  const insertVillage = db.prepare(`
    INSERT INTO villages (id, name, state, district, lat, lng, households, connectivity, shelter, language)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  for (const v of VILLAGES) {
    insertVillage.run(v.id, v.name, v.state, v.district, v.lat, v.lng, v.households, v.connectivity, v.shelter, v.language)
  }

  // 6. Seed alerts
  const insertAlert = db.prepare(`
    INSERT INTO alerts (id, time, zone_id, zone_name, severity, title, message_en, message_hi, message_as, channels_json, recipients, acknowledged, source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const topZones = hydratedZones.slice(0, 4)
  topZones.forEach((z, i) => {
    insertAlert.run(
      `AL-SEED-${z.id}`,
      new Date(Date.now() - (i + 1) * 14 * 60000).toISOString(),
      z.id,
      z.name,
      z.severity,
      `${z.severity} watch — ${z.district}`,
      `Model flags ${z.name} at ${z.riskScore.toFixed(0)}. Corridor ${z.corridor}.`,
      `${z.name} पर जोखिम अंक ${z.riskScore.toFixed(0)}।`,
      `${z.name}ত বিপদ সূচক ${z.riskScore.toFixed(0)}।`,
      JSON.stringify(['App', 'SMS', 'Control Room']),
      Math.round(z.populationAtRisk * 0.4),
      i > 1 ? 1 : 0,
      'AI nowcast',
    )
  })

  // 7. Seed field reports
  const insertReport = db.prepare(`
    INSERT INTO field_reports (id, time, reporter, role, zone_id, lat, lng, category, note, photo_name, photo_data, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  insertReport.run(
    'FR-1042',
    new Date(Date.now() - 36 * 60000).toISOString(),
    'Rinzin Bhutia',
    'Field officer',
    'Z-SK-01',
    27.349,
    88.62,
    'Slope crack',
    'Fresh tension crack 18 m above NH-10 km 8.2, opening ~4 cm since 05:40 IST. Drain blocked with colluvium.',
    'nh10-crack-0802.jpg',
    null,
    'Verified',
  )
  insertReport.run(
    'FR-1043',
    new Date(Date.now() - 18 * 60000).toISOString(),
    'Merenla Ao',
    'VDMC volunteer',
    'Z-NL-01',
    25.678,
    94.1,
    'Debris on road',
    'Boulder fall near Zubza km 18.4. One lane passable with spotting.',
    'zubza-debris.jpg',
    null,
    'Synced',
  )

  // 8. Seed actions
  const insertAction = db.prepare(`
    INSERT INTO incident_actions (id, zone_id, priority, eta_min, unit, action, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  insertAction.run(
    'ACT-Z-SK-01',
    'Z-SK-01',
    1,
    25,
    'NDRF Team 12',
    'Evacuate downslope dwellings; close corridor; stage heavy plant',
    'Dispatched',
  )
  insertAction.run(
    'ACT-Z-ML-02',
    'Z-ML-02',
    2,
    37,
    'State SDRF column',
    'Traffic hold, inspect weep holes, pre-position JCB',
    'Queued',
  )

  // 9. Seed weather
  const insertWeather = db.prepare(`
    INSERT OR REPLACE INTO weather_cells (id, state, district, condition, rainfall_mm, humidity, wind_kph, warning)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)
  hydratedZones.forEach((z) => {
    insertWeather.run(
      `W-${z.id}`,
      z.state,
      z.district,
      z.rainfallIntensity > 12 ? 'Heavy rain' : z.rainfall24h > 40 ? 'Persistent rain' : 'Cloudy with showers',
      z.rainfall24h,
      Math.min(98, 68 + z.soilMoisture * 0.25),
      8 + z.rainfallIntensity * 0.7,
      z.severity === 'Critical'
        ? 'Orange/Red nowcast — slope failure likely in 3–6 h'
        : z.severity === 'High'
          ? 'Yellow — avoid night travel on cut slopes'
          : 'Watch — localised showers',
    )
  })

  console.log('✅ SQLite Database successfully initialized and seeded with 16 risk zones, sensors, roads, and alerts.')
}
