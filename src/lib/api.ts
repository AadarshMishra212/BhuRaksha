import type {
  AlertRecord,
  FieldReport,
  IncidentAction,
  RiskZone,
  RoadSegment,
  Role,
  SensorNode,
  SitrepMeta,
  User,
  Village,
  WeatherCell,
} from '../types'

const API_BASE = 'http://localhost:3001/api'
const WS_BASE = 'ws://localhost:3001/ws'

export const api = {
  // Auth
  async login(
    username: string,
    password: string,
    role?: Role,
    agency?: string,
    posting?: string,
  ): Promise<{ user: User } | { error: string }> {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role, agency, posting }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        return { error: err.error || 'Authentication failed' }
      }
      return await res.json()
    } catch (e: any) {
      return { error: e.message || 'Server connection error' }
    }
  },

  // Health
  async health(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/health`)
      return res.ok ? await res.json() : null
    } catch {
      return null
    }
  },

  // Zones
  async getZones(): Promise<RiskZone[]> {
    const res = await fetch(`${API_BASE}/zones`)
    if (!res.ok) throw new Error('Failed to fetch risk zones')
    return res.json()
  },

  // Sensors
  async getSensors(): Promise<SensorNode[]> {
    const res = await fetch(`${API_BASE}/sensors`)
    if (!res.ok) throw new Error('Failed to fetch sensors')
    return res.json()
  },

  // Roads
  async getRoads(): Promise<RoadSegment[]> {
    const res = await fetch(`${API_BASE}/roads`)
    if (!res.ok) throw new Error('Failed to fetch roads')
    return res.json()
  },

  // Villages
  async getVillages(): Promise<Village[]> {
    const res = await fetch(`${API_BASE}/villages`)
    if (!res.ok) throw new Error('Failed to fetch villages')
    return res.json()
  },

  // Alerts
  async getAlerts(): Promise<AlertRecord[]> {
    const res = await fetch(`${API_BASE}/alerts`)
    if (!res.ok) throw new Error('Failed to fetch alerts')
    return res.json()
  },

  async ackAlert(id: string): Promise<AlertRecord> {
    const res = await fetch(`${API_BASE}/alerts/${id}/ack`, { method: 'PATCH' })
    if (!res.ok) throw new Error('Failed to acknowledge alert')
    return res.json()
  },

  async broadcastAlert(alert: AlertRecord): Promise<AlertRecord> {
    const res = await fetch(`${API_BASE}/alerts/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alert }),
    })
    if (!res.ok) throw new Error('Failed to broadcast alert')
    return res.json()
  },

  // Field Reports
  async getReports(): Promise<FieldReport[]> {
    const res = await fetch(`${API_BASE}/reports`)
    if (!res.ok) throw new Error('Failed to fetch reports')
    return res.json()
  },

  async addReport(report: FieldReport): Promise<FieldReport> {
    const res = await fetch(`${API_BASE}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    })
    if (!res.ok) throw new Error('Failed to save field report')
    return res.json()
  },

  // Incident Actions
  async getActions(): Promise<IncidentAction[]> {
    const res = await fetch(`${API_BASE}/actions`)
    if (!res.ok) throw new Error('Failed to fetch incident actions')
    return res.json()
  },

  async updateActionStatus(id: string, status: string): Promise<IncidentAction> {
    const res = await fetch(`${API_BASE}/actions/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) throw new Error('Failed to update action status')
    return res.json()
  },

  // Weather
  async getWeather(): Promise<WeatherCell[]> {
    const res = await fetch(`${API_BASE}/weather`)
    if (!res.ok) throw new Error('Failed to fetch weather telemetry')
    return res.json()
  },

  // Sitreps
  async getSitreps(): Promise<SitrepMeta[]> {
    const res = await fetch(`${API_BASE}/sitreps`)
    if (!res.ok) throw new Error('Failed to fetch sitreps')
    return res.json()
  },

  async addSitrep(sitrep: SitrepMeta): Promise<SitrepMeta> {
    const res = await fetch(`${API_BASE}/sitreps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sitrep }),
    })
    if (!res.ok) throw new Error('Failed to create sitrep')
    return res.json()
  },
}

/**
 * Real-time WebSocket connection to the SEOC Telemetry backend
 */
export function subscribeToTelemetry(onTick: (data: any) => void): () => void {
  let ws: WebSocket | null = null
  let isClosed = false
  let reconnectTimer: any = null

  function connect() {
    if (isClosed) return

    try {
      ws = new WebSocket(WS_BASE)

      ws.onopen = () => {
        console.log('📡 Connected to live Bhuraksha WebSocket backend')
      }

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data)
          if (payload.type === 'TELEMETRY_TICK') {
            onTick(payload)
          }
        } catch {
          // ignore
        }
      }

      ws.onclose = () => {
        if (!isClosed) {
          reconnectTimer = setTimeout(connect, 3000)
        }
      }

      ws.onerror = () => {
        ws?.close()
      }
    } catch {
      if (!isClosed) {
        reconnectTimer = setTimeout(connect, 4000)
      }
    }
  }

  connect()

  return () => {
    isClosed = true
    if (reconnectTimer) clearTimeout(reconnectTimer)
    ws?.close()
  }
}
