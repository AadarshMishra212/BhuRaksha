export type Role = 'ndma' | 'district' | 'field' | 'citizen'
export type Severity = 'Low' | 'Moderate' | 'High' | 'Critical'
export type RoadStatus = 'Open' | 'Restricted' | 'Blocked'
export type AlertChannel = 'App' | 'SMS' | 'IVRS' | 'Control Room'
export type Language = 'en' | 'hi' | 'as'

export interface User {
  id: string
  name: string
  role: Role
  agency: string
  posting: string
}

export interface FeatureContribution {
  feature: string
  value: string
  weight: number
  contribution: number
}

export interface RiskZone {
  id: string
  name: string
  state: string
  district: string
  lat: number
  lng: number
  slopeDeg: number
  lithology: string
  landUse: string
  historicalEvents: number
  populationAtRisk: number
  corridor: string
  villages: string[]
  rainfall24h: number
  rainfallIntensity: number
  soilMoisture: number
  displacementMm: number
  ndviStress: number
  riskScore: number
  severity: Severity
  forecast6h: number[]
  explain: FeatureContribution[]
  lastUpdated: string
}

export interface SensorNode {
  id: string
  name: string
  type: 'Rain gauge' | 'Soil moisture' | 'GNSS' | 'Piezometer' | 'AWS' | 'InSAR proxy'
  zoneId: string
  lat: number
  lng: number
  value: number
  unit: string
  status: 'Online' | 'Degraded' | 'Offline'
  battery: number
}

export interface RoadSegment {
  id: string
  name: string
  state: string
  path: [number, number][]
  status: RoadStatus
  zoneIds: string[]
  diversion: string
}

export interface Village {
  id: string
  name: string
  state: string
  district: string
  lat: number
  lng: number
  households: number
  connectivity: RoadStatus
  shelter: string
  language: string
}

export interface AlertRecord {
  id: string
  time: string
  zoneId: string
  zoneName: string
  severity: Severity
  title: string
  message: Record<Language, string>
  channels: AlertChannel[]
  recipients: number
  acknowledged: boolean
  source: 'AI nowcast' | 'Sensor threshold' | 'Field report' | 'IMD bulletin'
}

export interface FieldReport {
  id: string
  time: string
  reporter: string
  role: string
  zoneId: string
  lat: number
  lng: number
  category: 'Slope crack' | 'Debris on road' | 'Blocked drain' | 'Building tilt' | 'River cut'
  note: string
  photoName: string
  photoData?: string
  status: 'Queued' | 'Synced' | 'Verified'
}

export interface IncidentAction {
  id: string
  zoneId: string
  priority: number
  etaMin: number
  unit: string
  action: string
  status: 'Queued' | 'Dispatched' | 'On site' | 'Contained'
}

export interface WeatherCell {
  state: string
  district: string
  condition: string
  rainfallMm: number
  humidity: number
  windKph: number
  warning: string
}

export interface SitrepMeta {
  id: string
  generatedAt: string
  author: string
  title: string
}
