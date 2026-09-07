import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'
import { buildSensors, DEMO_USERS, ROADS, VILLAGES, ZONE_SEEDS } from '../data/catalog'
import { hydrateZone, stepZone } from '../engine/riskModel'
import { api, subscribeToTelemetry } from '../lib/api'
import type {
  AlertRecord,
  FieldReport,
  IncidentAction,
  Language,
  RiskZone,
  RoadSegment,
  RoadStatus,
  Role,
  SensorNode,
  SitrepMeta,
  User,
  Village,
  WeatherCell,
} from '../types'

interface State {
  user: User | null
  live: boolean
  tick: number
  language: Language
  zones: RiskZone[]
  sensors: SensorNode[]
  roads: RoadSegment[]
  villages: Village[]
  alerts: AlertRecord[]
  reports: FieldReport[]
  actions: IncidentAction[]
  weather: WeatherCell[]
  sitreps: SitrepMeta[]
  selectedZoneId: string | null
  backendOnline: boolean
}

type Action =
  | { type: 'LOGIN'; user: User }
  | { type: 'LOGOUT' }
  | { type: 'TICK' }
  | { type: 'TOGGLE_LIVE' }
  | { type: 'SET_LANG'; language: Language }
  | { type: 'SELECT_ZONE'; id: string | null }
  | { type: 'ACK_ALERT'; id: string }
  | { type: 'DISPATCH'; id: string }
  | { type: 'ADD_REPORT'; report: FieldReport }
  | { type: 'ADD_SITREP'; sitrep: SitrepMeta }
  | { type: 'BROADCAST'; alert: AlertRecord }
  | { type: 'SYNC_FROM_SERVER'; payload: Partial<State> }
  | { type: 'WS_TICK'; payload: { tick: number; zones: RiskZone[]; sensors: SensorNode[]; newAlerts: AlertRecord[] } }
  | { type: 'SET_BACKEND_STATUS'; online: boolean }

function iso() {
  return new Date().toISOString()
}

function roadStatusFromZones(zoneIds: string[], zones: RiskZone[]): RoadStatus {
  const scores = zoneIds.map((id) => zones.find((z) => z.id === id)?.riskScore ?? 0)
  const max = Math.max(...scores, 0)
  if (max >= 78) return 'Blocked'
  if (max >= 55) return 'Restricted'
  return 'Open'
}

function syncSensors(sensors: SensorNode[], zones: RiskZone[]): SensorNode[] {
  return sensors.map((s, i) => {
    const z = zones.find((x) => x.id === s.zoneId)
    if (!z) return s
    let value = s.value
    if (s.type === 'Rain gauge') value = z.rainfallIntensity
    if (s.type === 'Soil moisture') value = z.soilMoisture
    if (s.type === 'GNSS') value = z.displacementMm
    if (s.type === 'Piezometer') value = 18 + z.soilMoisture * 0.6
    if (s.type === 'AWS') value = z.rainfall24h
    if (s.type === 'InSAR proxy') value = z.displacementMm * 11
    const offline = (i + Math.round(z.riskScore)) % 41 > 38
    const degraded = z.rainfallIntensity > 18
    return {
      ...s,
      value,
      status: offline ? 'Offline' : degraded ? 'Degraded' : 'Online',
      battery: Math.max(12, s.battery - (offline ? 0.4 : 0.02)),
    }
  })
}

function weatherFromZones(zones: RiskZone[]): WeatherCell[] {
  const byDistrict = new Map<string, RiskZone>()
  zones.forEach((z) => byDistrict.set(`${z.state}|${z.district}`, z))
  return [...byDistrict.values()].map((z) => ({
    state: z.state,
    district: z.district,
    condition: z.rainfallIntensity > 12 ? 'Heavy rain' : z.rainfall24h > 40 ? 'Persistent rain' : 'Cloudy with showers',
    rainfallMm: z.rainfall24h,
    humidity: Math.min(98, 68 + z.soilMoisture * 0.25),
    windKph: 8 + z.rainfallIntensity * 0.7,
    warning:
      z.severity === 'Critical'
        ? 'Orange/Red nowcast — slope failure likely in 3–6 h'
        : z.severity === 'High'
          ? 'Yellow — avoid night travel on cut slopes'
          : 'Watch — localised showers',
  }))
}

function maybeAlert(prev: AlertRecord[], zone: RiskZone, prevZone?: RiskZone): AlertRecord | null {
  const crossed =
    (zone.severity === 'Critical' && prevZone?.severity !== 'Critical') ||
    (zone.severity === 'High' && prevZone && prevZone.severity === 'Moderate' && zone.riskScore > 62)
  if (!crossed) return null
  if (prev.some((a) => a.zoneId === zone.id && Date.now() - new Date(a.time).getTime() < 120000)) return null
  const sev = zone.severity
  return {
    id: `AL-${Date.now()}-${zone.id}`,
    time: iso(),
    zoneId: zone.id,
    zoneName: zone.name,
    severity: sev,
    title: `${sev} landslide nowcast — ${zone.district}`,
    message: {
      en: `${sev} risk on ${zone.corridor}. Rain ${zone.rainfall24h.toFixed(0)} mm / 24h. Move people away from cut slopes and halt night traffic.`,
      hi: `${zone.district} में ${sev} भूस्खलन चेतावनी। 24 घंटे में ${zone.rainfall24h.toFixed(0)} मिमी वर्षा। ढलानों से दूर रहें।`,
      as: `${zone.district}ত ${sev} ভূমিস্খলন সতর্কবাণী। ২৪ ঘণ্টাত ${zone.rainfall24h.toFixed(0)} মিমি বৰষুণ।`,
    },
    channels: sev === 'Critical' ? ['App', 'SMS', 'IVRS', 'Control Room'] : ['App', 'SMS', 'Control Room'],
    recipients: Math.round(zone.populationAtRisk * (sev === 'Critical' ? 0.82 : 0.45)),
    acknowledged: false,
    source: zone.rainfallIntensity > 10 ? 'Sensor threshold' : 'AI nowcast',
  }
}

function seedActions(zones: RiskZone[]): IncidentAction[] {
  return zones
    .filter((z) => z.riskScore >= 52)
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 8)
    .map((z, i) => ({
      id: `ACT-${z.id}`,
      zoneId: z.id,
      priority: i + 1,
      etaMin: 25 + i * 12,
      unit: i % 2 === 0 ? 'NDRF Team 12' : 'State SDRF column',
      action:
        z.riskScore > 75
          ? 'Evacuate downslope dwellings; close corridor; stage heavy plant'
          : 'Traffic hold, inspect weep holes, pre-position JCB',
      status: i === 0 ? 'Dispatched' : 'Queued',
    }))
}

function seedReports(): FieldReport[] {
  return [
    {
      id: 'FR-1042',
      time: new Date(Date.now() - 36 * 60000).toISOString(),
      reporter: 'Rinzin Bhutia',
      role: 'Field officer',
      zoneId: 'Z-SK-01',
      lat: 27.349,
      lng: 88.62,
      category: 'Slope crack',
      note: 'Fresh tension crack 18 m above NH-10 km 8.2, opening ~4 cm since 05:40 IST. Drain blocked with colluvium.',
      photoName: 'nh10-crack-0802.jpg',
      status: 'Verified',
    },
    {
      id: 'FR-1043',
      time: new Date(Date.now() - 18 * 60000).toISOString(),
      reporter: 'Merenla Ao',
      role: 'VDMC volunteer',
      zoneId: 'Z-NL-01',
      lat: 25.678,
      lng: 94.1,
      category: 'Debris on road',
      note: 'Boulder fall near Zubza km 18.4. One lane passable with spotting.',
      photoName: 'zubza-debris.jpg',
      status: 'Synced',
    },
  ]
}

function seedAlerts(zones: RiskZone[]): AlertRecord[] {
  const hot = [...zones].sort((a, b) => b.riskScore - a.riskScore).slice(0, 4)
  return hot.map((z, i) => ({
    id: `AL-SEED-${z.id}`,
    time: new Date(Date.now() - (i + 1) * 14 * 60000).toISOString(),
    zoneId: z.id,
    zoneName: z.name,
    severity: z.severity,
    title: `${z.severity} watch — ${z.district}`,
    message: {
      en: `Model flags ${z.name} at ${z.riskScore.toFixed(0)}. Corridor ${z.corridor}.`,
      hi: `${z.name} पर जोखिम अंक ${z.riskScore.toFixed(0)}।`,
      as: `${z.name}ত বিপদ সূচক ${z.riskScore.toFixed(0)}।`,
    },
    channels: ['App', 'SMS', 'Control Room'],
    recipients: Math.round(z.populationAtRisk * 0.4),
    acknowledged: i > 1,
    source: 'AI nowcast',
  }))
}

function initState(): State {
  const now = new Date()
  const zones = ZONE_SEEDS.map((s) => hydrateZone(s, now))
  let savedUser: User | null = null
  try {
    const raw = localStorage.getItem('bhuraksha_user')
    if (raw) savedUser = JSON.parse(raw)
  } catch {
    // ignore
  }

  return {
    user: savedUser,
    live: true,
    tick: 0,
    language: 'en',
    zones,
    sensors: syncSensors(buildSensors(), zones),
    roads: ROADS.map((r) => ({ ...r, status: roadStatusFromZones(r.zoneIds, zones) })),
    villages: VILLAGES.map((v) => {
      const nearby = zones.reduce((best, z) => {
        const d = Math.hypot(z.lat - v.lat, z.lng - v.lng)
        return d < best.d ? { d, z } : best
      }, { d: 99, z: zones[0] })
      const connectivity: RoadStatus =
        nearby.z.riskScore >= 78 ? 'Blocked' : nearby.z.riskScore >= 55 ? 'Restricted' : 'Open'
      return { ...v, connectivity }
    }),
    alerts: seedAlerts(zones),
    reports: seedReports(),
    actions: seedActions(zones),
    weather: weatherFromZones(zones),
    sitreps: [],
    selectedZoneId: zones[0]?.id ?? null,
    backendOnline: false,
  }
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'LOGIN':
      try {
        localStorage.setItem('bhuraksha_user', JSON.stringify(action.user))
      } catch {
        // ignore
      }
      return { ...state, user: action.user }
    case 'LOGOUT':
      try {
        localStorage.removeItem('bhuraksha_user')
      } catch {
        // ignore
      }
      return { ...state, user: null }
    case 'TOGGLE_LIVE':
      return { ...state, live: !state.live }
    case 'SET_LANG':
      return { ...state, language: action.language }
    case 'SELECT_ZONE':
      return { ...state, selectedZoneId: action.id }
    case 'SET_BACKEND_STATUS':
      return { ...state, backendOnline: action.online }
    case 'SYNC_FROM_SERVER':
      return { ...state, ...action.payload, backendOnline: true }
    case 'WS_TICK': {
      const { tick, zones, sensors, newAlerts } = action.payload
      return {
        ...state,
        tick,
        zones,
        sensors,
        roads: state.roads.map((r) => ({ ...r, status: roadStatusFromZones(r.zoneIds, zones) })),
        weather: weatherFromZones(zones),
        alerts: newAlerts.length > 0 ? [...newAlerts, ...state.alerts].slice(0, 80) : state.alerts,
        backendOnline: true,
      }
    }
    case 'ACK_ALERT':
      return {
        ...state,
        alerts: state.alerts.map((a) => (a.id === action.id ? { ...a, acknowledged: true } : a)),
      }
    case 'DISPATCH':
      return {
        ...state,
        actions: state.actions.map((a) =>
          a.id === action.id
            ? { ...a, status: a.status === 'Queued' ? 'Dispatched' : a.status === 'Dispatched' ? 'On site' : 'Contained' }
            : a,
        ),
      }
    case 'ADD_REPORT':
      return { ...state, reports: [action.report, ...state.reports] }
    case 'ADD_SITREP':
      return { ...state, sitreps: [action.sitrep, ...state.sitreps] }
    case 'BROADCAST':
      return { ...state, alerts: [action.alert, ...state.alerts] }
    case 'TICK': {
      if (state.backendOnline) return state // Let backend handle ticks when online
      const tick = state.tick + 1
      const zones = state.zones.map((z) => stepZone(z, tick))
      const newAlerts: AlertRecord[] = []
      zones.forEach((z, i) => {
        const a = maybeAlert(state.alerts, z, state.zones[i])
        if (a) newAlerts.push(a)
      })
      return {
        ...state,
        tick,
        zones,
        sensors: syncSensors(state.sensors, zones),
        roads: state.roads.map((r) => ({ ...r, status: roadStatusFromZones(r.zoneIds, zones) })),
        villages: state.villages.map((v) => {
          const nearby = zones.reduce((best, z) => {
            const d = Math.hypot(z.lat - v.lat, z.lng - v.lng)
            return d < best.d ? { d, z } : best
          }, { d: 99, z: zones[0] })
          const connectivity: RoadStatus =
            nearby.z.riskScore >= 78 ? 'Blocked' : nearby.z.riskScore >= 55 ? 'Restricted' : 'Open'
          return { ...v, connectivity }
        }),
        weather: weatherFromZones(zones),
        alerts: [...newAlerts, ...state.alerts].slice(0, 80),
        actions: seedActions(zones).map((fresh) => {
          const old = state.actions.find((a) => a.zoneId === fresh.zoneId)
          return old ? { ...fresh, status: old.status, id: old.id } : fresh
        }),
      }
    }
    default:
      return state
  }
}

interface StoreValue extends State {
  login: (username: string, password: string, role?: Role, agency?: string, posting?: string) => Promise<string | null>
  logout: () => void
  toggleLive: () => void
  setLanguage: (language: Language) => void
  selectZone: (id: string | null) => void
  ackAlert: (id: string) => void
  dispatchAction: (id: string) => void
  addReport: (report: FieldReport) => void
  addSitrep: (sitrep: SitrepMeta) => void
  broadcast: (zoneId: string) => void
  selectedZone: RiskZone | null
}

const StoreContext = createContext<StoreValue | null>(null)

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initState)

  // 1. Initial Sync with SQLite Backend
  useEffect(() => {
    let active = true

    async function loadBackendData() {
      try {
        const [zones, sensors, roads, villages, alerts, reports, actions, weather, sitreps] = await Promise.all([
          api.getZones().catch(() => null),
          api.getSensors().catch(() => null),
          api.getRoads().catch(() => null),
          api.getVillages().catch(() => null),
          api.getAlerts().catch(() => null),
          api.getReports().catch(() => null),
          api.getActions().catch(() => null),
          api.getWeather().catch(() => null),
          api.getSitreps().catch(() => null),
        ])

        if (!active) return

        const payload: Partial<State> = {}
        if (zones && zones.length > 0) payload.zones = zones
        if (sensors && sensors.length > 0) payload.sensors = sensors
        if (roads && roads.length > 0) payload.roads = roads
        if (villages && villages.length > 0) payload.villages = villages
        if (alerts && alerts.length > 0) payload.alerts = alerts
        if (reports && reports.length > 0) payload.reports = reports
        if (actions && actions.length > 0) payload.actions = actions
        if (weather && weather.length > 0) payload.weather = weather
        if (sitreps && sitreps.length > 0) payload.sitreps = sitreps

        if (Object.keys(payload).length > 0) {
          dispatch({ type: 'SYNC_FROM_SERVER', payload })
          console.log('✅ Synchronized state from Bhuraksha SQLite Database')
        }
      } catch {
        if (active) {
          dispatch({ type: 'SET_BACKEND_STATUS', online: false })
        }
      }
    }

    loadBackendData()

    // 2. Subscribe to WebSocket Live Telemetry
    const unsubscribe = subscribeToTelemetry((data) => {
      if (active && state.live) {
        dispatch({
          type: 'WS_TICK',
          payload: {
            tick: data.tick,
            zones: data.zones,
            sensors: data.sensors,
            newAlerts: data.newAlerts || [],
          },
        })
      }
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [state.live])

  // Fallback Local Tick if backend is offline
  useEffect(() => {
    if (!state.live || state.backendOnline) return
    const id = window.setInterval(() => dispatch({ type: 'TICK' }), 2500)
    return () => window.clearInterval(id)
  }, [state.live, state.backendOnline])

  const login = useCallback(
    async (username: string, password: string, role: Role = 'ndma', agency?: string, posting?: string) => {
      const cleanName = username.trim()
      const cleanPass = password.trim()
      if (!cleanName || !cleanPass) {
        return 'Please enter both your surname/name and password to enter the SEOC command floor.'
      }

      // Try backend authentication
      try {
        const res = await api.login(cleanName, cleanPass, role, agency, posting)
        if ('user' in res && res.user) {
          dispatch({ type: 'LOGIN', user: res.user })
          return null
        }
      } catch {
        // fallback to local user generation
      }

      const found = DEMO_USERS.find(
        (u) =>
          u.username.toLowerCase() === cleanName.toLowerCase() ||
          u.name.toLowerCase().includes(cleanName.toLowerCase()),
      )

      if (found) {
        dispatch({
          type: 'LOGIN',
          user: {
            id: found.id,
            name: found.name,
            role: found.role,
            agency: found.agency,
            posting: found.posting,
          },
        })
        return null
      }

      // Open dynamic user login
      const defaultAgency =
        agency ||
        (role === 'ndma'
          ? 'NDMA / MDoNER Joint Operations'
          : role === 'district'
            ? 'District Disaster Management Authority'
            : role === 'field'
              ? 'Field Response Cell / PWD'
              : 'Village Disaster Management Committee')
      const defaultPosting = posting || 'Northeast Command Sector'

      const dynamicUser: User = {
        id: `u-${Date.now().toString(36)}`,
        name: cleanName.includes(' ') ? cleanName : `Officer ${cleanName}`,
        role,
        agency: defaultAgency,
        posting: defaultPosting,
      }

      dispatch({
        type: 'LOGIN',
        user: dynamicUser,
      })
      return null
    },
    [],
  )

  const logout = useCallback(() => dispatch({ type: 'LOGOUT' }), [])
  const toggleLive = useCallback(() => dispatch({ type: 'TOGGLE_LIVE' }), [])
  const setLanguage = useCallback((language: Language) => dispatch({ type: 'SET_LANG', language }), [])
  const selectZone = useCallback((id: string | null) => dispatch({ type: 'SELECT_ZONE', id }), [])

  const ackAlert = useCallback(async (id: string) => {
    dispatch({ type: 'ACK_ALERT', id })
    api.ackAlert(id).catch(() => null)
  }, [])

  const dispatchAction = useCallback(async (id: string) => {
    dispatch({ type: 'DISPATCH', id })
    api.updateActionStatus(id, 'Dispatched').catch(() => null)
  }, [])

  const addReport = useCallback(async (report: FieldReport) => {
    dispatch({ type: 'ADD_REPORT', report })
    api.addReport(report).catch(() => null)
  }, [])

  const addSitrep = useCallback(async (sitrep: SitrepMeta) => {
    dispatch({ type: 'ADD_SITREP', sitrep })
    api.addSitrep(sitrep).catch(() => null)
  }, [])

  const broadcast = useCallback(
    async (zoneId: string) => {
      const z = state.zones.find((x) => x.id === zoneId)
      if (!z) return
      const alertObj: AlertRecord = {
        id: `AL-MAN-${Date.now()}`,
        time: iso(),
        zoneId: z.id,
        zoneName: z.name,
        severity: z.severity,
        title: `Manual broadcast — ${z.district}`,
        message: {
          en: `Control room broadcast for ${z.name}. Follow local SDRF instructions. Corridor ${z.corridor}.`,
          hi: `${z.name} के लिए नियंत्रण कक्ष प्रसारण। एसडीआरएफ निर्देशों का पालन करें।`,
          as: `${z.name}ৰ বাবে নিয়ন্ত্ৰণ কক্ষৰ প্ৰচাৰ।`,
        },
        channels: ['App', 'SMS', 'IVRS', 'Control Room'],
        recipients: z.populationAtRisk,
        acknowledged: false,
        source: 'IMD bulletin',
      }
      dispatch({ type: 'BROADCAST', alert: alertObj })
      api.broadcastAlert(alertObj).catch(() => null)
    },
    [state.zones],
  )

  const selectedZone = state.zones.find((z) => z.id === state.selectedZoneId) ?? null

  const value = useMemo<StoreValue>(
    () => ({
      ...state,
      login,
      logout,
      toggleLive,
      setLanguage,
      selectZone,
      ackAlert,
      dispatchAction,
      addReport,
      addSitrep,
      broadcast,
      selectedZone,
    }),
    [state, login, logout, toggleLive, setLanguage, selectZone, ackAlert, dispatchAction, addReport, addSitrep, broadcast, selectedZone],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within AppStoreProvider')
  return ctx
}
