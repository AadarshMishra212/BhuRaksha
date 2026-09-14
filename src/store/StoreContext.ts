import { createContext } from 'react'
import type {
  AlertRecord,
  BhoomiEmailAlert,
  FieldReport,
  IncidentAction,
  Language,
  RiskZone,
  RoadSegment,
  Role,
  SensorNode,
  SitrepMeta,
  User,
  Village,
  WeatherCell,
} from '../types'

export type ThemeMode = 'light' | 'dark'

interface State {
  user: User | null
  live: boolean
  tick: number
  language: Language
  theme: ThemeMode
  zones: RiskZone[]
  sensors: SensorNode[]
  roads: RoadSegment[]
  villages: Village[]
  alerts: AlertRecord[]
  bhoomiEmailAlerts: BhoomiEmailAlert[]
  activeEmailToast: BhoomiEmailAlert | null
  reports: FieldReport[]
  actions: IncidentAction[]
  weather: WeatherCell[]
  sitreps: SitrepMeta[]
  selectedZoneId: string | null
}

export interface StoreValue extends State {
  login: (
    username: string,
    password: string,
    email?: string,
    role?: Role,
    agency?: string,
    posting?: string,
    emailAlertsEnabled?: boolean,
  ) => Promise<string | null>
  logout: () => void
  toggleLive: () => void
  setLanguage: (language: Language) => void
  toggleTheme: () => void
  setTheme: (theme: ThemeMode) => void
  selectZone: (id: string | null) => void
  ackAlert: (id: string) => void
  dispatchAction: (id: string) => void
  addReport: (report: FieldReport) => void
  addSitrep: (sitrep: SitrepMeta) => void
  broadcast: (zoneId: string) => void
  dismissEmailToast: () => void
  clearEmailAlerts: () => void
  sendTestBhoomiEmail: (zoneId?: string) => void
  selectedZone: RiskZone | null
}

export const StoreContext = createContext<StoreValue | null>(null)
