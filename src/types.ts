export type Role = 'ndma' | 'district' | 'field' | 'citizen'
export type Severity = 'Low' | 'Moderate' | 'High' | 'Critical'
export type RoadStatus = 'Open' | 'Restricted' | 'Blocked'
export type AlertChannel = 'App' | 'SMS' | 'IVRS' | 'Control Room' | 'Gmail'
export type Language = 'en' | 'hi' | 'as'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  agency: string
  posting: string
  emailAlertsEnabled?: boolean
}

export interface BhoomiEmailAlert {
  id: string
  alertId: string
  recipientEmail: string
  timestamp: string
  subject: string
  severity: Severity
  zoneName: string
  district: string
  state: string
  corridor: string
  message: string
  rainfallMm: number
  soilSaturation: number
  evacuationRoute?: string
  status: 'Delivered' | 'Sending'
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
  accuracyMeters?: number
  altitudeM?: number
  locationName?: string
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

export interface EmergencyFoodPlace {
  id: string
  name: string
  type: 'Community Relief Kitchen' | 'Ration Distribution Depot' | 'Red Cross Food Camp' | 'DDMA Food Bank'
  district: string
  state: string
  lat: number
  lng: number
  dailyMealCapacity: number
  rationStockStatus: 'Abundant' | 'Moderate' | 'Critical'
  operatingHours: string
  contactNumber: string
  inCharge: string
}

export interface EmergencyHospital {
  id: string
  name: string
  type: 'Multispeciality Trauma Hospital' | 'Civil District Hospital' | 'Primary Health Centre (PHC)' | 'Community Health Centre (CHC)'
  district: string
  state: string
  lat: number
  lng: number
  emergencyBeds: number
  icuAvailable: boolean
  oxygenCapacity: '100% Full' | 'Adequate' | 'Limited'
  ambulancesOnStandby: number
  traumaSurgeonsOnDuty: number
  emergencyHelpline: string
  bloodBankAvailable: boolean
}

export interface GovernmentVehicleDepot {
  id: string
  name: string
  agency: 'Border Roads Organisation (BRO)' | 'State PWD Heavy Machinery' | 'SDRF / NDRF Logistics Fleet' | 'DDMA Disaster Quick Response Fleet'
  district: string
  state: string
  lat: number
  lng: number
  heavyExcavators: number
  jcbBulldozers: number
  fourByFourAmbulanceTrucks: number
  recoveryCranes: number
  readinessStatus: 'Immediate Standby (24/7)' | 'Dispatched / Active' | 'Standby'
  dispatchHotline: string
  commandingOfficer: string
}

export interface NearestResourceItem<T> {
  data: T
  distanceKm: number
  driveTimeMin: number
  walkTimeMin: number
  safeRoute: string
  isRoutePassable: boolean
  googleMapsUrl: string
}

export interface NearestEmergencyResources {
  foodPlace: NearestResourceItem<EmergencyFoodPlace>
  hospital: NearestResourceItem<EmergencyHospital>
  vehicleDepot: NearestResourceItem<GovernmentVehicleDepot>
}

