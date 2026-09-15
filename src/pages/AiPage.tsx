import { useState, useMemo, useEffect, useRef } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Circle,
  CircleMarker,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
  Tooltip as LeafletTooltip,
  useMap,
} from 'react-leaflet'
import {
  Brain,
  Activity,
  ShieldAlert,
  Car,
  Users,
  Clock,
  MapPin,
  Volume2,
  VolumeX,
  BellRing,
  Navigation,
  ExternalLink,
  CloudLightning,
  AlertOctagon,
  Footprints,
  Radio,
  UtensilsCrossed,
  Hospital,
  Truck,
  PhoneCall,
  Layers,
} from 'lucide-react'
import { Panel, Pill } from '../components/ui'
import { useStore } from '../store/useStore'
import {
  predictZoneConsequences,
  assessUserLocationExposure,
  type UserLocation,
} from '../engine/consequenceEngine'
import { PRESET_LOCATIONS } from '../engine/chatbotEngine'
import {
  playEmergencyAlarm,
  stopEmergencyAlarm,
  speakBhoomiAdvisory,
  stopSpeech,
  isAlarmActive,
} from '../lib/audioAlerts'
import { severityColor } from '../engine/riskModel'

export type BhoomiBasemapKey = 'google_hybrid' | 'google_terrain' | 'google_streets' | 'carto_dark'

function getBhoomiBasemaps(apiKey: string) {
  const cleanKey = apiKey ? apiKey.trim() : ''
  return {
    google_hybrid: {
      name: 'Google Satellite',
      url: `https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}${cleanKey ? `&key=${cleanKey}` : ''}`,
      attribution: '&copy; Google Maps',
      icon: '🛰️',
    },
    google_terrain: {
      name: 'Google Topo Terrain',
      url: `https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}${cleanKey ? `&key=${cleanKey}` : ''}`,
      attribution: '&copy; Google Maps',
      icon: '⛰️',
    },
    google_streets: {
      name: 'Google Streets',
      url: `https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}${cleanKey ? `&key=${cleanKey}` : ''}`,
      attribution: '&copy; Google Maps',
      icon: '🛣️',
    },
    carto_dark: {
      name: 'CARTO Dark Tactical',
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      icon: '🌑',
    },
  } as const
}

// Map Helper: Fly to target location
function MapFlyTo({ target }: { target: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo(target, 11, { duration: 1.2 })
  }, [target, map])
  return null
}

function MapInvalidate() {
  const map = useMap()
  useEffect(() => {
    const t = window.setTimeout(() => map.invalidateSize(), 200)
    return () => window.clearTimeout(t)
  }, [map])
  return null
}

export function AiPage() {
  const { zones, selectedZone, selectZone, villages, roads, weather } = useStore()
  const zone = selectedZone ?? zones[0]

  const [activeTab, setActiveTab] = useState<'bhoomi' | 'nowcast'>('bhoomi')

  // User Location State (Default to Gangtok or first preset)
  const [userLocation, setUserLocation] = useState<UserLocation>(() => ({
    name: 'Gangtok, Sikkim',
    lat: 27.3389,
    lng: 88.6065,
    state: 'Sikkim',
    district: 'Gangtok',
    isLiveGps: false,
  }))
  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsError, setGpsError] = useState<string | null>(null)

  // Google Maps Basemap Selection State for BHOOMI
  const mapsApiKey = useMemo(() => {
    try {
      const saved = localStorage.getItem('bhuraksha_maps_api_key')
      if (saved) return saved
    } catch {
      // ignore
    }
    return import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  }, [])
  const [selectedBasemap, setSelectedBasemap] = useState<BhoomiBasemapKey>('google_hybrid')

  const basemapLayers = useMemo(() => getBhoomiBasemaps(mapsApiKey), [mapsApiKey])

  // Audio / Voice Alert States
  const [isPlayingVoice, setIsPlayingVoice] = useState(false)
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false)
  const [autoSirenEnabled, setAutoSirenEnabled] = useState(true)

  const lastAlertKeyRef = useRef<string>('')

  // Calculate BHOOMI consequence prediction for active zone
  const assessment = useMemo(() => {
    if (!zone) return null
    return predictZoneConsequences(zone)
  }, [zone])

  // Calculate User Location Exposure & Nearest Shelter
  const userExposure = useMemo(() => {
    return assessUserLocationExposure(userLocation, zones, villages, roads, weather)
  }, [userLocation, zones, villages, roads, weather])

  // Automatically synchronize active sector forecast to user location's nearest hazard zone
  useEffect(() => {
    if (userExposure.nearestHazardZone) {
      selectZone(userExposure.nearestHazardZone.id)
    }
  }, [userLocation.name, userExposure.nearestHazardZone, selectZone])

  // ---------------------------------------------------------------------------
  // AUTOMATIC SIREN & VOICE BROADCAST TRIGGER
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!autoSirenEnabled) return

    const situationKey = `${userLocation.name}-${userExposure.situationMode}-${userExposure.dangerLevel}`

    // Trigger auto alarm when entering severe/critical situation
    if (
      (userExposure.situationMode === 'LANDSLIDE_CRITICAL_EVACUATION' ||
        userExposure.situationMode === 'THUNDERSTORM_WARNING') &&
      lastAlertKeyRef.current !== situationKey
    ) {
      lastAlertKeyRef.current = situationKey

      // Play emergency siren & speak voice advisory automatically
      const alarmType =
        userExposure.situationMode === 'LANDSLIDE_CRITICAL_EVACUATION'
          ? 'landslide_evacuation'
          : 'thunderstorm'

      playEmergencyAlarm(alarmType)
      setIsAlarmPlaying(true)

      // Stop siren after 4 seconds and speak voice directive
      const timer = window.setTimeout(() => {
        stopEmergencyAlarm()
        setIsAlarmPlaying(false)
        setIsPlayingVoice(true)
        speakBhoomiAdvisory(userExposure.voiceDirective, () => {
          setIsPlayingVoice(false)
        })
      }, 3500)

      return () => {
        clearTimeout(timer)
      }
    }
  }, [userLocation.name, userExposure.situationMode, userExposure.dangerLevel, userExposure.voiceDirective, autoSirenEnabled])

  // Handle GPS location detection
  const handleDetectGpsLocation = () => {
    if (!('geolocation' in navigator)) {
      setGpsError('Geolocation is not supported by your browser.')
      return
    }

    setGpsLoading(true)
    setGpsError(null)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false)
        setUserLocation({
          name: 'My Current GPS Location',
          lat: Number(pos.coords.latitude.toFixed(4)),
          lng: Number(pos.coords.longitude.toFixed(4)),
          isLiveGps: true,
        })
      },
      (err) => {
        setGpsLoading(false)
        setGpsError(err.message || 'Unable to retrieve location. Please select a sector from the list.')
      },
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }

  // Handle Manual Emergency Voice Speech
  const handlePlayVoiceAlert = () => {
    if (isPlayingVoice) {
      stopSpeech()
      setIsPlayingVoice(false)
      return
    }

    const message =
      userExposure.situationMode === 'LANDSLIDE_CRITICAL_EVACUATION'
        ? userExposure.voiceDirective
        : assessment?.voiceWarning || userExposure.voiceDirective

    setIsPlayingVoice(true)
    speakBhoomiAdvisory(message, () => {
      setIsPlayingVoice(false)
    })
  }

  // Handle Manual Emergency Siren Toggle
  const handleToggleAlarm = () => {
    if (isAlarmActive() || isAlarmPlaying) {
      stopEmergencyAlarm()
      setIsAlarmPlaying(false)
    } else {
      const type =
        userExposure.situationMode === 'LANDSLIDE_CRITICAL_EVACUATION'
          ? 'landslide_evacuation'
          : 'thunderstorm'
      playEmergencyAlarm(type)
      setIsAlarmPlaying(true)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopEmergencyAlarm()
      stopSpeech()
    }
  }, [])

  if (!zone) return null

  // Explainability and forecast for Nowcast tab
  const explain = zone.explain.map((e) => ({
    feature: e.feature.replace(' (IMD / AWS)', ''),
    contribution: Number((e.contribution * 100).toFixed(1)),
  }))
  const forecast = zone.forecast6h.map((v, i) => ({ hour: `+${i + 1}h`, score: Number(v.toFixed(1)) }))

  // Coordinates for the automated evacuation route line
  const evacuationRoutePath: [number, number][] = [
    [userLocation.lat, userLocation.lng],
    [userExposure.nearestShelter.village.lat, userExposure.nearestShelter.village.lng],
  ]

  return (
    <div className="space-y-5">
      {/* Top Header & Tab Switcher */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-surface-container-high pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-secondary pulse-dot" />
            <p className="text-[11px] tracking-[0.22em] text-secondary uppercase font-bold">
              Automated Situation-Adaptive Intelligence
            </p>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-on-surface mt-1">
            BHOOMI Intelligence
          </h1>
          <p className="max-w-2xl text-xs text-on-surface-variant mt-1">
            Automated thunderstorm sirens, real-time user risk exposure mapping, and live evacuation shelter routing for North Eastern India.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 rounded-xl border border-surface-container-high bg-surface-container-low p-1.5 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab('bhoomi')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
              activeTab === 'bhoomi'
                ? 'bg-secondary text-on-secondary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest'
            }`}
          >
            <Brain className="h-3.5 w-3.5" />
            <span>BHOOMI</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('nowcast')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition cursor-pointer ${
              activeTab === 'nowcast'
                ? 'bg-secondary text-on-secondary shadow-sm font-semibold'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>Nowcast &amp; Explainability</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB: BHOOMI (AUTOMATED SIREN, RISK EXPOSURE & LIVE HAZARD MAPPING)        */}
      {/* ========================================================================= */}
      {activeTab === 'bhoomi' && (
        <div className="space-y-5">
          {/* 1. Dynamic Automated Siren & Alert Banner */}
          <div
            className={`rounded-2xl border p-5 shadow-2xl transition-all duration-300 relative overflow-hidden ${
              userExposure.situationMode === 'LANDSLIDE_CRITICAL_EVACUATION'
                ? 'border-alert/70 bg-gradient-to-r from-alert/25 via-[#230d0a] to-[#120705] ring-2 ring-alert/40'
                : userExposure.situationMode === 'THUNDERSTORM_WARNING'
                  ? 'border-amber-500/70 bg-gradient-to-r from-amber-500/20 via-[#1e1509] to-[#0f0b04] ring-2 ring-amber-500/30'
                  : 'border-lime/30 bg-gradient-to-r from-[#0c241b] via-[#081a14] to-[#040e0b]'
            }`}
          >
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2">
                  {userExposure.situationMode === 'LANDSLIDE_CRITICAL_EVACUATION' ? (
                    <>
                      <span className="flex h-3 w-3 rounded-full bg-alert animate-ping" />
                      <span className="text-xs font-black uppercase tracking-widest text-alert flex items-center gap-1.5">
                        <AlertOctagon className="h-4 w-4" />
                        <span>Critical Mass Movement &amp; Evacuation Siren Active</span>
                      </span>
                    </>
                  ) : userExposure.situationMode === 'THUNDERSTORM_WARNING' ? (
                    <>
                      <span className="flex h-3 w-3 rounded-full bg-amber-400 animate-pulse" />
                      <span className="text-xs font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                        <CloudLightning className="h-4 w-4" />
                        <span>Thunderstorm &amp; Cloudburst Auto-Alarm Triggered</span>
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="flex h-2.5 w-2.5 rounded-full bg-lime pulse-dot" />
                      <span className="text-xs font-bold uppercase tracking-widest text-lime flex items-center gap-1.5">
                        <Radio className="h-4 w-4" />
                        <span>Automated Weather &amp; Geohazard Monitoring Active</span>
                      </span>
                    </>
                  )}
                </div>

                <h2 className="text-lg font-bold text-white leading-tight">
                  {userExposure.situationMode === 'LANDSLIDE_CRITICAL_EVACUATION'
                    ? `Immediate Evacuation Mandate: High Risk Zone Near ${userLocation.name}`
                    : userExposure.situationMode === 'THUNDERSTORM_WARNING'
                      ? `Severe Thunderstorm & Flash Slope Saturation Warning`
                      : `Normal Vigilance: Mountain Road Passable`}
                </h2>

                <p className="text-xs text-muted leading-relaxed">
                  {userExposure.voiceDirective}
                </p>
              </div>

              {/* Audio Controls & Auto-Alarm Indicator */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setAutoSirenEnabled((prev) => !prev)}
                  title="Toggle automatic siren on severe hazard detection"
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition cursor-pointer ${
                    autoSirenEnabled
                      ? 'border-lime/40 bg-lime/15 text-lime'
                      : 'border-white/10 bg-black/40 text-muted'
                  }`}
                >
                  <BellRing className="h-3.5 w-3.5" />
                  <span>Auto-Siren: {autoSirenEnabled ? 'ON' : 'OFF'}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePlayVoiceAlert}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition shadow-lg cursor-pointer ${
                    isPlayingVoice
                      ? 'bg-alert text-white shadow-alert/30 animate-pulse'
                      : 'bg-lime text-command hover:bg-lime/90 shadow-lime/20'
                  }`}
                >
                  {isPlayingVoice ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  <span>{isPlayingVoice ? 'Stop Voice' : '🔊 Voice Alert'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleAlarm}
                  className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition shadow-lg cursor-pointer ${
                    isAlarmPlaying
                      ? 'border-alert bg-alert/30 text-alert animate-bounce shadow-alert/40'
                      : 'border-white/15 bg-white/5 text-muted hover:text-white hover:bg-white/10'
                  }`}
                >
                  <BellRing className={`h-4 w-4 ${isAlarmPlaying ? 'text-alert' : ''}`} />
                  <span>{isAlarmPlaying ? 'Stop Siren' : '🚨 Siren'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. AUTOMATED GIS RISK MAP & SHELTER EVACUATION ROUTER */}
          <Panel title="Automated High-Risk Zone & Evacuation Route Mapping">
            <div className="space-y-3">
              {/* Map Layer Basemap Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-surface-container-high bg-surface-container-low p-2.5 text-xs shadow-xs">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  <span className="text-[11px] font-semibold text-on-surface-variant uppercase flex items-center gap-1 mr-1">
                    <Layers className="h-3.5 w-3.5 text-secondary" />
                    <span>Basemap:</span>
                  </span>
                  {(['google_hybrid', 'google_terrain', 'google_streets', 'carto_dark'] as BhoomiBasemapKey[]).map((bmKey) => {
                    const bm = basemapLayers[bmKey]
                    const isSelected = selectedBasemap === bmKey
                    return (
                      <button
                        key={bmKey}
                        type="button"
                        onClick={() => setSelectedBasemap(bmKey)}
                        className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs transition cursor-pointer ${
                          isSelected
                            ? 'border border-secondary bg-secondary-container font-bold text-on-secondary-container shadow-xs'
                            : 'border border-surface-container-high bg-surface-container-lowest text-on-surface-variant hover:border-secondary hover:text-on-surface'
                        }`}
                      >
                        <span>{bm.icon}</span>
                        <span>{bm.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-on-surface-variant">
                <div className="flex flex-wrap items-center gap-3.5">
                  <span className="flex items-center gap-1.5 text-on-surface font-medium">
                    <span className="h-3 w-3 rounded-full bg-cyan-500 border border-surface-container-high" />
                    <span>Your Location ({userLocation.name.split(',')[0]})</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-on-surface font-medium">
                    <span className="h-3 w-3 rounded-full bg-emerald-500 border border-surface-container-high" />
                    <span>Nearest Shelter</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-on-surface font-medium">
                    <span className="h-3 w-3 rounded-full bg-amber-500 border border-surface-container-high" />
                    <span>Food Camp</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-on-surface font-medium">
                    <span className="h-3 w-3 rounded-full bg-rose-500 border border-surface-container-high" />
                    <span>Hospital</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-on-surface font-medium">
                    <span className="h-3 w-3 rounded-full bg-blue-500 border border-surface-container-high" />
                    <span>Vehicle Depot</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-on-surface font-medium">
                    <span className="h-3 w-3 rounded-full bg-alert border border-surface-container-high" />
                    <span>Critical Zone</span>
                  </span>
                </div>
                <span className="font-mono text-secondary font-bold">
                  Evacuation ETA: ~{userExposure.nearestShelter.driveTimeMin} min drive / ~{userExposure.nearestShelter.walkTimeMin} min walk
                </span>
              </div>

              {/* Leaflet Map */}
              <div className="relative h-[400px] w-full rounded-xl overflow-hidden border border-lime/30 shadow-2xl bg-black">
                <MapContainer
                  center={[userLocation.lat, userLocation.lng]}
                  zoom={10}
                  className="h-full w-full"
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    key={`${selectedBasemap}-${mapsApiKey}`}
                    url={basemapLayers[selectedBasemap].url}
                    attribution={basemapLayers[selectedBasemap].attribution}
                  />
                  <MapInvalidate />
                  <MapFlyTo target={[userLocation.lat, userLocation.lng]} />

                  {/* 1. Draw High & Critical Risk Zone Hazard Polygons/Circles */}
                  {zones.map((z) => (
                    <Circle
                      key={`zone-circle-${z.id}`}
                      center={[z.lat, z.lng]}
                      radius={1800 + z.riskScore * 80}
                      pathOptions={{
                        color: severityColor(z.severity),
                        fillColor: severityColor(z.severity),
                        fillOpacity: z.riskScore >= 70 ? 0.35 : 0.2,
                        weight: z.riskScore >= 70 ? 2 : 1,
                      }}
                      eventHandlers={{ click: () => selectZone(z.id) }}
                    >
                      <LeafletTooltip direction="top" offset={[0, -10]}>
                        <div className="font-sans text-xs">
                          <p className="font-bold text-ink">{z.name}</p>
                          <p className="text-muted">Risk Score: {z.riskScore.toFixed(0)} ({z.severity})</p>
                          <p className="text-muted">Pop. at Risk: {z.populationAtRisk.toLocaleString()}</p>
                        </div>
                      </LeafletTooltip>
                    </Circle>
                  ))}

                  {/* 2. Road Network Segments */}
                  {roads.map((r) => (
                    <Polyline
                      key={`road-${r.id}`}
                      positions={r.path}
                      pathOptions={{
                        color: r.status === 'Blocked' ? '#ef4444' : r.status === 'Restricted' ? '#f59e0b' : '#10b981',
                        weight: r.status === 'Blocked' ? 3.5 : 2.5,
                        dashArray: r.status === 'Blocked' ? '6 6' : undefined,
                      }}
                    >
                      <Popup>
                        <div className="text-xs">
                          <p className="font-bold">{r.name}</p>
                          <p>Status: <span className="font-bold">{r.status}</span></p>
                          {r.diversion && <p className="text-muted mt-1">{r.diversion}</p>}
                        </div>
                      </Popup>
                    </Polyline>
                  ))}

                  {/* 3. Direct Evacuation Line (User -> Nearest Shelter) */}
                  <Polyline
                    positions={evacuationRoutePath}
                    pathOptions={{
                      color: '#9ccc65',
                      weight: 3.5,
                      dashArray: '8 8',
                    }}
                  />

                  {/* 4. User Location Marker */}
                  <CircleMarker
                    center={[userLocation.lat, userLocation.lng]}
                    radius={10}
                    pathOptions={{
                      color: '#ffffff',
                      weight: 3,
                      fillColor: '#06b6d4',
                      fillOpacity: 1,
                    }}
                  >
                    <Popup>
                      <div className="text-xs font-sans">
                        <p className="font-bold text-cyan-700">📍 Your Current Position</p>
                        <p>{userLocation.name}</p>
                        <p className="font-bold mt-1">Risk Exposure: {userExposure.exposureScore}% ({userExposure.dangerLevel})</p>
                      </div>
                    </Popup>
                  </CircleMarker>

                  {/* 5. Nearest Shelter Marker */}
                  <CircleMarker
                    center={[userExposure.nearestShelter.village.lat, userExposure.nearestShelter.village.lng]}
                    radius={11}
                    pathOptions={{
                      color: '#ffffff',
                      weight: 3,
                      fillColor: '#10b981',
                      fillOpacity: 1,
                    }}
                  >
                    <Popup>
                      <div className="text-xs font-sans">
                        <p className="font-bold text-primary">🏛️ Nearest Evacuation Shelter</p>
                        <p className="font-semibold text-on-surface">{userExposure.nearestShelter.village.shelter}</p>
                        <p className="text-on-surface-variant">Distance: {userExposure.nearestShelter.distanceKm} km</p>
                        <p className="font-bold mt-1 text-on-surface">ETA: ~{userExposure.nearestShelter.driveTimeMin} min vehicle</p>
                      </div>
                    </Popup>
                  </CircleMarker>

                  {/* 6. Nearest Relief Food Place */}
                  {userExposure.nearestResources?.foodPlace && (
                    <CircleMarker
                      center={[
                        userExposure.nearestResources.foodPlace.data.lat,
                        userExposure.nearestResources.foodPlace.data.lng,
                      ]}
                      radius={10}
                      pathOptions={{
                        color: '#ffffff',
                        weight: 2.5,
                        fillColor: '#fc6c26',
                        fillOpacity: 1,
                      }}
                    >
                      <Popup>
                        <div className="text-xs font-sans">
                          <p className="font-bold text-primary">🍲 Relief Food / Ration Hub</p>
                          <p className="font-semibold text-on-surface">{userExposure.nearestResources.foodPlace.data.name}</p>
                          <p className="text-on-surface-variant">{userExposure.nearestResources.foodPlace.data.type}</p>
                          <p className="text-on-surface-variant">
                            Distance: {userExposure.nearestResources.foodPlace.distanceKm} km (~{userExposure.nearestResources.foodPlace.driveTimeMin}m drive)
                          </p>
                          <p className="font-bold mt-1 text-on-surface">
                            Capacity: {userExposure.nearestResources.foodPlace.data.dailyMealCapacity.toLocaleString()} meals/day
                          </p>
                        </div>
                      </Popup>
                    </CircleMarker>
                  )}

                  {/* 7. Nearest Hospital & Trauma Centre */}
                  {userExposure.nearestResources?.hospital && (
                    <CircleMarker
                      center={[
                        userExposure.nearestResources.hospital.data.lat,
                        userExposure.nearestResources.hospital.data.lng,
                      ]}
                      radius={10}
                      pathOptions={{
                        color: '#ffffff',
                        weight: 2.5,
                        fillColor: '#f43f5e',
                        fillOpacity: 1,
                      }}
                    >
                      <Popup>
                        <div className="text-xs font-sans">
                          <p className="font-bold text-rose-500">🏥 Emergency Hospital &amp; Trauma Centre</p>
                          <p className="font-semibold text-on-surface">{userExposure.nearestResources.hospital.data.name}</p>
                          <p className="text-on-surface-variant">{userExposure.nearestResources.hospital.data.type}</p>
                          <p className="text-on-surface-variant">
                            Distance: {userExposure.nearestResources.hospital.distanceKm} km (~{userExposure.nearestResources.hospital.driveTimeMin}m drive)
                          </p>
                          <p className="font-bold mt-1 text-on-surface">
                            Emergency Beds: {userExposure.nearestResources.hospital.data.emergencyBeds} | ICU: {userExposure.nearestResources.hospital.data.icuAvailable ? 'Active' : 'Limited'}
                          </p>
                        </div>
                      </Popup>
                    </CircleMarker>
                  )}

                  {/* 8. Nearest Government Vehicle Depot */}
                  {userExposure.nearestResources?.vehicleDepot && (
                    <CircleMarker
                      center={[
                        userExposure.nearestResources.vehicleDepot.data.lat,
                        userExposure.nearestResources.vehicleDepot.data.lng,
                      ]}
                      radius={10}
                      pathOptions={{
                        color: '#ffffff',
                        weight: 2.5,
                        fillColor: '#3b82f6',
                        fillOpacity: 1,
                      }}
                    >
                      <Popup>
                        <div className="text-xs font-sans">
                          <p className="font-bold text-blue-500">🚜 Government Machinery &amp; Vehicle Depot</p>
                          <p className="font-semibold text-on-surface">{userExposure.nearestResources.vehicleDepot.data.name}</p>
                          <p className="text-on-surface-variant">{userExposure.nearestResources.vehicleDepot.data.agency}</p>
                          <p className="text-on-surface-variant">
                            Distance: {userExposure.nearestResources.vehicleDepot.distanceKm} km (~{userExposure.nearestResources.vehicleDepot.driveTimeMin}m drive)
                          </p>
                          <p className="font-bold mt-1 text-on-surface">
                            Excavators: {userExposure.nearestResources.vehicleDepot.data.heavyExcavators} | JCBs: {userExposure.nearestResources.vehicleDepot.data.jcbBulldozers}
                          </p>
                        </div>
                      </Popup>
                    </CircleMarker>
                  )}
                </MapContainer>
              </div>
            </div>
          </Panel>

          {/* 3. Live Location Risk Exposure & Nearest Shelter Navigator */}
          <div className="grid gap-5 lg:grid-cols-12">
            {/* Left Card: Location & Risk Exposure Index */}
            <Panel title="Personal Risk Exposure & Location Access" className="lg:col-span-5 flex flex-col justify-between">
              <div className="space-y-4">
                {/* Location Detection Buttons & Dropdown */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-[11px] uppercase tracking-wider text-muted font-semibold">
                      Your Sector / Position:
                    </label>
                    <button
                      type="button"
                      onClick={handleDetectGpsLocation}
                      disabled={gpsLoading}
                      className="flex items-center gap-1.5 text-xs text-primary font-bold hover:underline cursor-pointer"
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{gpsLoading ? 'Accessing GPS...' : 'Detect Live GPS'}</span>
                    </button>
                  </div>

                  <select
                    value={userLocation.name}
                    onChange={(e) => {
                      const found = PRESET_LOCATIONS.find((p) => p.name === e.target.value)
                      if (found) {
                        setUserLocation({ ...found, isLiveGps: false })
                      }
                    }}
                    className="w-full rounded-xl border border-surface-container-high bg-surface-container-lowest px-3.5 py-2 text-xs text-on-surface focus:border-secondary focus:outline-none shadow-xs"
                  >
                    {userLocation.isLiveGps && (
                      <option value={userLocation.name}>📍 Live GPS Position ({userLocation.lat}, {userLocation.lng})</option>
                    )}
                    {PRESET_LOCATIONS.map((loc) => (
                      <option key={loc.name} value={loc.name}>
                        {loc.name}
                      </option>
                    ))}
                  </select>

                  {gpsError && (
                    <p className="text-[10px] text-amber-500 font-medium">{gpsError}</p>
                  )}
                </div>

                {/* Exposure Index Gauge */}
                <div className="rounded-xl border border-surface-container-high bg-surface-container-low p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] uppercase text-outline font-semibold">Personal Risk Exposure</p>
                      <p className="text-3xl font-mono font-bold text-on-surface mt-0.5">
                        {userExposure.exposureScore}
                        <span className="text-base text-outline font-normal"> / 100</span>
                      </p>
                    </div>
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
                        userExposure.dangerLevel === 'Immediate Danger'
                          ? 'border-alert/50 bg-alert/20 text-alert'
                          : userExposure.dangerLevel === 'High Vigilance'
                            ? 'border-amber-500/50 bg-amber-500/20 text-amber-500'
                            : 'border-secondary/50 bg-secondary-container text-on-secondary-container'
                      }`}
                    >
                      {userExposure.dangerLevel}
                    </span>
                  </div>

                  <div className="h-2 w-full rounded-full bg-surface-container-high overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        userExposure.exposureScore >= 70
                          ? 'bg-alert'
                          : userExposure.exposureScore >= 45
                            ? 'bg-amber-500'
                            : 'bg-secondary'
                      }`}
                      style={{ width: `${userExposure.exposureScore}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-surface-container-high text-xs">
                    <div>
                      <span className="text-outline text-[10px] uppercase font-semibold">Closest Hazard Scarp:</span>
                      <p className="font-semibold text-on-surface mt-0.5 truncate">
                        {userExposure.nearestHazardZone.name.split('–')[0]}
                      </p>
                    </div>
                    <div>
                      <span className="text-outline text-[10px] uppercase font-semibold">Distance to Scarp:</span>
                      <p className="font-mono font-bold text-secondary mt-0.5">
                        {userExposure.distanceToHazardKm} km
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-surface-container-high flex items-center justify-between text-[11px] text-outline">
                <span>Coordinates: {userLocation.lat}&deg;N, {userLocation.lng}&deg;E</span>
                <span className="text-secondary font-semibold">BHOOMI Geodesic Mesh</span>
              </div>
            </Panel>

            {/* Right Card: Nearest Shelter & Fastest Evacuation Route */}
            <Panel title="Nearest Designated Shelter & Fastest Evacuation Route" className="lg:col-span-7 flex flex-col justify-between">
              <div className="space-y-4">
                {/* Shelter Header */}
                <div className="rounded-xl border border-secondary/30 bg-secondary-container/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-secondary-container text-on-secondary-container border border-secondary/30 mt-0.5">
                      <Navigation className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-secondary tracking-wider">
                          Primary Designated Shelter
                        </span>
                        <span className="text-[10px] rounded bg-surface-container-lowest px-1.5 py-0.2 text-outline border border-surface-container-high font-medium">
                          Official DDMA Camp
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-on-surface mt-0.5">
                        {userExposure.nearestShelter.village.shelter}
                      </h4>
                      <p className="text-xs text-outline">
                        Sector: {userExposure.nearestShelter.village.name} &bull; {userExposure.nearestShelter.village.district},{' '}
                        {userExposure.nearestShelter.village.state}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs text-outline uppercase tracking-wider font-semibold">Distance</p>
                    <p className="text-2xl font-mono font-bold text-secondary">
                      {userExposure.nearestShelter.distanceKm} <span className="text-xs font-normal text-outline">km</span>
                    </p>
                  </div>
                </div>

                {/* Fastest Travel Times (Drive vs Walk) */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-surface-container-high bg-surface-container-low p-3.5 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed-variant border border-tertiary/30">
                      <Car className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-outline font-semibold">Fastest Vehicle ETA</p>
                      <p className="text-lg font-mono font-bold text-on-surface">
                        ~{userExposure.nearestShelter.driveTimeMin} <span className="text-xs font-normal text-outline">mins</span>
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-surface-container-high bg-surface-container-low p-3.5 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary-fixed text-on-primary-fixed-variant border border-primary/30">
                      <Footprints className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-outline font-semibold">On-Foot Evacuation</p>
                      <p className="text-lg font-mono font-bold text-on-surface">
                        ~{userExposure.nearestShelter.walkTimeMin} <span className="text-xs font-normal text-outline">mins</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Safe Evacuation Corridor Turn-by-Turn Guidance */}
                <div className="rounded-xl border border-surface-container-high bg-surface-container-low p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-on-surface flex items-center gap-1.5">
                      <ShieldAlert className="h-3.5 w-3.5 text-secondary" />
                      <span>Recommended Evacuation Corridor:</span>
                    </span>
                    <span
                      className={`font-mono text-[11px] font-bold ${
                        userExposure.nearestShelter.isRoadClear ? 'text-secondary' : 'text-tertiary'
                      }`}
                    >
                      {userExposure.nearestShelter.isRoadClear ? 'Route Passable' : 'Caution / Divert'}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {userExposure.nearestShelter.safeCorridor}
                  </p>
                </div>
              </div>

              {/* Direct GPS Navigation */}
              <div className="mt-4 pt-3 border-t border-surface-container-high flex flex-wrap items-center justify-between gap-2.5">
                <div className="text-xs text-outline">
                  <span>Routing: </span>
                  <span className="text-on-surface font-semibold">{userLocation.name.split(',')[0]}</span>
                  <span> &rarr; </span>
                  <span className="text-secondary font-semibold">{userExposure.nearestShelter.village.shelter}</span>
                </div>
                <a
                  href={userExposure.nearestShelter.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-xl bg-lime px-4 py-2 text-xs font-bold text-command hover:bg-lime/90 transition shadow-md shadow-lime/20"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Start Live GPS Route Navigation</span>
                </a>
              </div>
            </Panel>
          </div>

          {/* 3.5. NEAREST CRITICAL EMERGENCY LIFELINES & GOVERNMENT ASSETS (Dynamic on Fetched User Location) */}
          {userExposure.nearestResources && (
            <div className="space-y-4 pt-1">
              {/* Section Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-surface-container-high pt-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-secondary flex items-center gap-1.5">
                      <Layers className="h-4 w-4" />
                      <span>Critical Lifeline Infrastructure Grid</span>
                    </span>
                    <span className="rounded-full bg-secondary-container border border-secondary/30 px-2.5 py-0.5 text-[10px] font-bold text-on-secondary-container">
                      Auto-Synced to {userLocation.isLiveGps ? '📍 Live GPS' : userLocation.name.split(',')[0]}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-on-surface mt-1">
                    Nearest Food Distribution, Trauma Hospital &amp; Government Fleet Depot
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    Proximity analysis, fleet readiness, and direct GPS routing to essential emergency support services for{' '}
                    <span className="text-on-surface font-bold">{userLocation.name}</span>.
                  </p>
                </div>

                <div className="text-right shrink-0 hidden md:block">
                  <span className="text-[10px] uppercase text-outline font-semibold tracking-wider">Sector Coordinates</span>
                  <p className="font-mono text-xs font-bold text-secondary mt-0.5">
                    {userLocation.lat}&deg;N, {userLocation.lng}&deg;E
                  </p>
                </div>
              </div>

              {/* 3 Infrastructure Cards Grid */}
              <div className="grid gap-4.5 md:grid-cols-3">
                {/* CARD 1: Nearest Relief Food Place / Kitchen */}
                <div className="rounded-2xl border border-amber-500/30 bg-surface-container-low p-4.5 flex flex-col justify-between space-y-4 shadow-xl hover:border-amber-500/50 transition">
                  <div className="space-y-3.5">
                    {/* Card Top: Icon & Type */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          <UtensilsCrossed className="h-5 w-5" />
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">
                            Nearest Food Facility
                          </span>
                          <span className="text-[10px] rounded bg-surface-container-high px-1.5 py-0.5 text-on-surface-variant font-medium">
                            {userExposure.nearestResources.foodPlace.data.type}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] uppercase text-on-surface-variant font-semibold">Distance</span>
                        <p className="text-xl font-mono font-bold text-amber-400">
                          {userExposure.nearestResources.foodPlace.distanceKm}{' '}
                          <span className="text-xs font-normal text-on-surface-variant">km</span>
                        </p>
                      </div>
                    </div>

                    {/* Facility Name & Location */}
                    <div>
                      <h4 className="text-base font-bold text-on-surface leading-snug">
                        {userExposure.nearestResources.foodPlace.data.name}
                      </h4>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        Sector: {userExposure.nearestResources.foodPlace.data.district},{' '}
                        {userExposure.nearestResources.foodPlace.data.state}
                      </p>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">
                        In-Charge: {userExposure.nearestResources.foodPlace.data.inCharge}
                      </p>
                    </div>

                    {/* Travel Time ETAs */}
                    <div className="grid grid-cols-2 gap-2 rounded-xl border border-surface-container-high bg-surface-container-high/40 p-2.5 text-xs">
                      <div>
                        <span className="text-[10px] uppercase text-on-surface-variant">Vehicle ETA:</span>
                        <p className="font-mono font-bold text-on-surface">
                          ~{userExposure.nearestResources.foodPlace.driveTimeMin} mins
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-on-surface-variant">Walking ETA:</span>
                        <p className="font-mono font-bold text-on-surface">
                          ~{userExposure.nearestResources.foodPlace.walkTimeMin} mins
                        </p>
                      </div>
                    </div>

                    {/* Capacity & Operating Stats */}
                    <div className="space-y-2 text-xs border-t border-surface-container-high pt-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-on-surface-variant">Meal Capacity:</span>
                        <span className="font-mono font-bold text-on-surface">
                          {userExposure.nearestResources.foodPlace.data.dailyMealCapacity.toLocaleString()} meals/day
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-on-surface-variant">Ration Stock:</span>
                        <span
                          className={`font-semibold px-2 py-0.2 rounded text-[10px] ${
                            userExposure.nearestResources.foodPlace.data.rationStockStatus === 'Abundant'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {userExposure.nearestResources.foodPlace.data.rationStockStatus} Stock
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-on-surface-variant">Hours:</span>
                        <span className="text-on-surface font-medium">
                          {userExposure.nearestResources.foodPlace.data.operatingHours}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <span className="text-on-surface-variant">Corridor:</span>
                        <span
                          className={`font-medium truncate max-w-[170px] ${
                            userExposure.nearestResources.foodPlace.isRoutePassable
                              ? 'text-lime'
                              : 'text-amber-400'
                          }`}
                          title={userExposure.nearestResources.foodPlace.safeRoute}
                        >
                          {userExposure.nearestResources.foodPlace.safeRoute.split('—')[0]}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Call & Map Navigation */}
                  <div className="pt-3 border-t border-surface-container-high space-y-2">
                    <div className="flex items-center justify-between text-xs text-on-surface-variant">
                      <span className="flex items-center gap-1.5 text-on-surface">
                        <PhoneCall className="h-3.5 w-3.5 text-amber-400" />
                        <span>{userExposure.nearestResources.foodPlace.data.contactNumber}</span>
                      </span>
                      <a
                        href={`tel:${userExposure.nearestResources.foodPlace.data.contactNumber.replace(/[^0-9+]/g, '')}`}
                        className="text-[11px] font-bold text-amber-400 hover:underline"
                      >
                        Call Kitchen
                      </a>
                    </div>
                    <a
                      href={userExposure.nearestResources.foodPlace.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full rounded-xl bg-amber-500/20 border border-amber-500/40 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/30 transition shadow-sm"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>GPS Route to Food Depot</span>
                    </a>
                  </div>
                </div>

                {/* CARD 2: Nearest Emergency Hospital & Trauma Centre */}
                <div className="rounded-2xl border border-rose-500/30 bg-surface-container-low p-4.5 flex flex-col justify-between space-y-4 shadow-xl hover:border-rose-500/50 transition">
                  <div className="space-y-3.5">
                    {/* Card Top: Icon & Type */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          <Hospital className="h-5 w-5" />
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider block">
                            Nearest Hospital / Trauma
                          </span>
                          <span className="text-[10px] rounded bg-surface-container-high px-1.5 py-0.5 text-on-surface-variant font-medium">
                            {userExposure.nearestResources.hospital.data.type}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] uppercase text-on-surface-variant font-semibold">Distance</span>
                        <p className="text-xl font-mono font-bold text-rose-400">
                          {userExposure.nearestResources.hospital.distanceKm}{' '}
                          <span className="text-xs font-normal text-on-surface-variant">km</span>
                        </p>
                      </div>
                    </div>

                    {/* Facility Name & Location */}
                    <div>
                      <h4 className="text-base font-bold text-on-surface leading-snug">
                        {userExposure.nearestResources.hospital.data.name}
                      </h4>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        Sector: {userExposure.nearestResources.hospital.data.district},{' '}
                        {userExposure.nearestResources.hospital.data.state}
                      </p>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">
                        Surgeons on Duty: {userExposure.nearestResources.hospital.data.traumaSurgeonsOnDuty} Specialists
                      </p>
                    </div>

                    {/* Travel Time ETAs */}
                    <div className="grid grid-cols-2 gap-2 rounded-xl border border-surface-container-high bg-surface-container-high/40 p-2.5 text-xs">
                      <div>
                        <span className="text-[10px] uppercase text-on-surface-variant">Ambulance ETA:</span>
                        <p className="font-mono font-bold text-on-surface">
                          ~{userExposure.nearestResources.hospital.driveTimeMin} mins
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-on-surface-variant">Walking ETA:</span>
                        <p className="font-mono font-bold text-on-surface">
                          ~{userExposure.nearestResources.hospital.walkTimeMin} mins
                        </p>
                      </div>
                    </div>

                    {/* Capacity & Medical Stats */}
                    <div className="space-y-2 text-xs border-t border-surface-container-high pt-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-on-surface-variant">Emergency Beds:</span>
                        <span className="font-mono font-bold text-on-surface">
                          {userExposure.nearestResources.hospital.data.emergencyBeds} Beds (
                          {userExposure.nearestResources.hospital.data.icuAvailable ? 'ICU Active' : 'Basic ICU'})
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-on-surface-variant">Ambulance Fleet:</span>
                        <span className="font-mono font-bold text-emerald-400">
                          {userExposure.nearestResources.hospital.data.ambulancesOnStandby} Units on Standby
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-on-surface-variant">Oxygen Supply:</span>
                        <span className="text-on-surface font-medium">
                          {userExposure.nearestResources.hospital.data.oxygenCapacity}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <span className="text-on-surface-variant">Corridor:</span>
                        <span
                          className={`font-medium truncate max-w-[170px] ${
                            userExposure.nearestResources.hospital.isRoutePassable
                              ? 'text-lime'
                              : 'text-amber-400'
                          }`}
                          title={userExposure.nearestResources.hospital.safeRoute}
                        >
                          {userExposure.nearestResources.hospital.safeRoute.split('—')[0]}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Call & Map Navigation */}
                  <div className="pt-3 border-t border-surface-container-high space-y-2">
                    <div className="flex items-center justify-between text-xs text-on-surface-variant">
                      <span className="flex items-center gap-1.5 text-on-surface">
                        <PhoneCall className="h-3.5 w-3.5 text-rose-400" />
                        <span>{userExposure.nearestResources.hospital.data.emergencyHelpline}</span>
                      </span>
                      <a
                        href={`tel:${userExposure.nearestResources.hospital.data.emergencyHelpline.split('/')[0].trim().replace(/[^0-9+]/g, '')}`}
                        className="text-[11px] font-bold text-rose-400 hover:underline"
                      >
                        Call Hospital
                      </a>
                    </div>
                    <a
                      href={userExposure.nearestResources.hospital.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full rounded-xl bg-rose-500/20 border border-rose-500/40 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/30 transition shadow-sm"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>GPS Route to Hospital</span>
                    </a>
                  </div>
                </div>

                {/* CARD 3: Nearest Government Vehicle & Heavy Machinery Depot */}
                <div className="rounded-2xl border border-blue-500/30 bg-surface-container-low p-4.5 flex flex-col justify-between space-y-4 shadow-xl hover:border-blue-500/50 transition">
                  <div className="space-y-3.5">
                    {/* Card Top: Icon & Type */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          <Truck className="h-5 w-5" />
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider block">
                            Govt Vehicle / Machinery Depot
                          </span>
                          <span className="text-[10px] rounded bg-surface-container-high px-1.5 py-0.5 text-on-surface-variant font-medium">
                            {userExposure.nearestResources.vehicleDepot.data.agency.split('(')[0]}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] uppercase text-on-surface-variant font-semibold">Distance</span>
                        <p className="text-xl font-mono font-bold text-blue-400">
                          {userExposure.nearestResources.vehicleDepot.distanceKm}{' '}
                          <span className="text-xs font-normal text-on-surface-variant">km</span>
                        </p>
                      </div>
                    </div>

                    {/* Facility Name & Location */}
                    <div>
                      <h4 className="text-base font-bold text-on-surface leading-snug">
                        {userExposure.nearestResources.vehicleDepot.data.name}
                      </h4>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        Sector: {userExposure.nearestResources.vehicleDepot.data.district},{' '}
                        {userExposure.nearestResources.vehicleDepot.data.state}
                      </p>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">
                        In-Charge: {userExposure.nearestResources.vehicleDepot.data.commandingOfficer}
                      </p>
                    </div>

                    {/* Travel Time ETAs */}
                    <div className="grid grid-cols-2 gap-2 rounded-xl border border-surface-container-high bg-surface-container-high/40 p-2.5 text-xs">
                      <div>
                        <span className="text-[10px] uppercase text-on-surface-variant">Vehicle ETA:</span>
                        <p className="font-mono font-bold text-on-surface">
                          ~{userExposure.nearestResources.vehicleDepot.driveTimeMin} mins
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-on-surface-variant">Heavy Fleet ETA:</span>
                        <p className="font-mono font-bold text-on-surface">
                          ~{Math.round(userExposure.nearestResources.vehicleDepot.driveTimeMin * 1.35)} mins
                        </p>
                      </div>
                    </div>

                    {/* Heavy Machinery & Readiness Stats */}
                    <div className="space-y-2 text-xs border-t border-surface-container-high pt-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-on-surface-variant">Heavy Excavators:</span>
                        <span className="font-mono font-bold text-on-surface">
                          {userExposure.nearestResources.vehicleDepot.data.heavyExcavators} Tracked Excavators
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-on-surface-variant">JCB / Earthmovers:</span>
                        <span className="font-mono font-bold text-on-surface">
                          {userExposure.nearestResources.vehicleDepot.data.jcbBulldozers} Bulldozers
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-on-surface-variant">4x4 Rescue Vehicles:</span>
                        <span className="font-mono font-bold text-cyan-400">
                          {userExposure.nearestResources.vehicleDepot.data.fourByFourAmbulanceTrucks} All-Terrain Units
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <span className="text-on-surface-variant">Readiness:</span>
                        <span className="font-semibold text-emerald-400 flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-emerald-400 pulse-dot" />
                          <span>{userExposure.nearestResources.vehicleDepot.data.readinessStatus}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Call & Map Navigation */}
                  <div className="pt-3 border-t border-surface-container-high space-y-2">
                    <div className="flex items-center justify-between text-xs text-on-surface-variant">
                      <span className="flex items-center gap-1.5 text-on-surface truncate max-w-[200px]">
                        <PhoneCall className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                        <span className="truncate">{userExposure.nearestResources.vehicleDepot.data.dispatchHotline}</span>
                      </span>
                      <a
                        href={`tel:${userExposure.nearestResources.vehicleDepot.data.dispatchHotline.split('/')[0].trim().replace(/[^0-9+]/g, '')}`}
                        className="text-[11px] font-bold text-blue-400 hover:underline shrink-0"
                      >
                        Call Depot
                      </a>
                    </div>
                    <a
                      href={userExposure.nearestResources.vehicleDepot.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full rounded-xl bg-blue-500/20 border border-blue-500/40 py-2 text-xs font-bold text-blue-300 hover:bg-blue-500/30 transition shadow-sm"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>GPS Route to Depot</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. Automated Sector Consequence Forecast Dashboard */}
          {assessment && (
            <div className="space-y-4 pt-2">
              {/* Sector Selector Pills & Auto-Sync Indicator */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 overflow-x-auto pb-1 border-t border-surface-container-high pt-4">
                <div className="flex items-center gap-2 overflow-x-auto">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant shrink-0 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-secondary" />
                    <span>Sector Forecast:</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {zones
                      .slice()
                      .sort((a, b) => b.riskScore - a.riskScore)
                      .map((z) => (
                        <button
                          key={z.id}
                          type="button"
                          onClick={() => selectZone(z.id)}
                          className={`rounded-full border px-3 py-1 text-xs transition cursor-pointer ${
                            z.id === zone.id
                              ? 'border-secondary bg-secondary-container text-on-secondary-container font-semibold shadow-xs ring-1 ring-secondary/40'
                              : 'border-surface-container-high bg-surface-container-lowest text-on-surface-variant hover:border-surface-container-highest hover:text-on-surface'
                          }`}
                        >
                          {z.id === userExposure.nearestHazardZone.id && '📍 '}
                          {z.district} — {z.name.split('–')[0]}
                        </button>
                      ))}
                  </div>
                </div>

                {/* Auto-Sync status badge */}
                <button
                  type="button"
                  onClick={() => selectZone(userExposure.nearestHazardZone.id)}
                  title="Auto-sync sector forecast to your location's nearest hazard scarp"
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold shrink-0 transition cursor-pointer ${
                    zone.id === userExposure.nearestHazardZone.id
                      ? 'border-secondary/40 bg-secondary-container text-on-secondary-container'
                      : 'border-surface-container-high bg-surface-container-lowest text-on-surface-variant hover:text-on-surface hover:border-surface-container-highest'
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-secondary pulse-dot" />
                  <span>
                    {zone.id === userExposure.nearestHazardZone.id
                      ? `Auto-Synced: ${userLocation.name.split(',')[0]} (${userExposure.distanceToHazardKm} km)`
                      : `Snap to My Location (${userLocation.name.split(',')[0]})`}
                  </span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                    <span>Automated Impact Forecast: {zone.name}</span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                        assessment.hazardSeverity === 'Catastrophic'
                          ? 'border-alert/50 bg-alert/20 text-alert'
                          : assessment.hazardSeverity === 'Severe'
                            ? 'border-amber-500/50 bg-amber-500/20 text-amber-500'
                            : 'border-secondary/50 bg-secondary-container text-on-secondary-container'
                      }`}
                    >
                      {assessment.hazardSeverity} Risk
                    </span>
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    {zone.corridor} &bull; Sector: {zone.state} &bull; Distance from Position: {userExposure.distanceToHazardKm} km &bull; Model Confidence: {assessment.confidenceScore}%
                  </p>
                </div>
              </div>

              {/* 4 Impact Metric Cards */}
              <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                {/* 1. Road Closure */}
                <div className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-4 space-y-3 shadow-xs hover:border-surface-container-highest transition">
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed-variant border border-tertiary/30">
                      <Car className="h-5 w-5" />
                    </span>
                    <span className="font-mono text-xs text-tertiary font-bold">
                      {assessment.severanceProbability}% Severance Prob
                    </span>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-outline font-semibold">Corridor Blockage</p>
                    <p className="text-2xl font-mono font-bold text-on-surface mt-0.5">
                      {assessment.roadClosureHours} <span className="text-sm font-normal text-outline">hours</span>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="h-1.5 w-full rounded-full bg-surface-container-high overflow-hidden">
                      <div
                        className="h-full bg-tertiary"
                        style={{ width: `${assessment.severanceProbability}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-outline">
                      Estimated clearance window for heavy traffic.
                    </p>
                  </div>
                </div>

                {/* 2. Isolated Population */}
                <div className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-4 space-y-3 shadow-xs hover:border-surface-container-highest transition">
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-xl bg-primary-fixed text-on-primary-fixed-variant border border-primary/30">
                      <Users className="h-5 w-5" />
                    </span>
                    <span className="font-mono text-xs text-primary font-bold">
                      {zone.villages.length} Downslope Villages
                    </span>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-outline font-semibold">Isolated Citizens</p>
                    <p className="text-2xl font-mono font-bold text-on-surface mt-0.5">
                      {assessment.isolatedPopulation.toLocaleString()}{' '}
                      <span className="text-sm font-normal text-outline">people</span>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="h-1.5 w-full rounded-full bg-surface-container-high overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${Math.min(100, (assessment.isolatedPopulation / 10000) * 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-outline">
                      Population cut off from primary supply routes.
                    </p>
                  </div>
                </div>

                {/* 3. Infrastructure Damage */}
                <div className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-4 space-y-3 shadow-xs hover:border-surface-container-highest transition">
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-xl bg-error-container text-on-error-container border border-error/30">
                      <ShieldAlert className="h-5 w-5" />
                    </span>
                    <span className="font-mono text-xs text-error font-bold">
                      Asset Index
                    </span>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-outline font-semibold">Infrastructure Damage</p>
                    <p className="text-2xl font-mono font-bold text-on-surface mt-0.5">
                      {assessment.infrastructureDamageIndex} <span className="text-sm font-normal text-outline">/ 100</span>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="h-1.5 w-full rounded-full bg-surface-container-high overflow-hidden">
                      <div
                        className="h-full bg-error"
                        style={{ width: `${assessment.infrastructureDamageIndex}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-outline">
                      Probability of retaining wall shear &amp; culvert scouring.
                    </p>
                  </div>
                </div>

                {/* 4. Time-to-Failure Window */}
                <div className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-4 space-y-3 shadow-xs hover:border-surface-container-highest transition">
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-xl bg-secondary-container text-on-secondary-container border border-secondary/30">
                      <Clock className="h-5 w-5" />
                    </span>
                    <span className="font-mono text-xs text-secondary font-bold">
                      {assessment.debrisVolumeM3.toLocaleString()} m³ Debris
                    </span>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-outline font-semibold">Time-to-Failure (TTF)</p>
                    <p className="text-2xl font-mono font-bold text-on-surface mt-0.5">
                      {assessment.timeToFailureHours} <span className="text-sm font-normal text-outline">hours</span>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="h-1.5 w-full rounded-full bg-surface-container-high overflow-hidden">
                      <div
                        className="h-full bg-secondary"
                        style={{ width: `${Math.max(10, 100 - (assessment.timeToFailureHours / 24) * 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-outline">
                      Estimated window before primary shear failure.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: NOWCAST & EXPLAINABILITY                                             */}
      {/* ========================================================================= */}
      {activeTab === 'nowcast' && (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Panel title="Model output" className="lg:col-span-1">
              <p className="font-mono text-5xl font-semibold text-secondary">{zone.riskScore.toFixed(1)}</p>
              <div className="mt-2">
                <Pill severity={zone.severity} />
              </div>
              <p className="mt-3 text-sm font-bold text-on-surface">{zone.name}</p>
              <p className="text-xs text-outline">{zone.lithology}</p>
              <p className="mt-4 text-xs leading-relaxed text-on-surface-variant">
                If 6-hour nowcast stays above 76, recommend corridor closure and downslope evacuation. Model is conservative on cut slopes with soil moisture &gt; 70%.
              </p>
            </Panel>
            <Panel title="Feature contributions (SHAP Explanations)" className="lg:col-span-2">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={explain} layout="vertical" margin={{ left: 120 }}>
                    <CartesianGrid stroke="var(--theme-surface-container-high)" strokeDasharray="3 3" />
                    <XAxis type="number" stroke="var(--theme-outline)" fontSize={11} />
                    <YAxis type="category" dataKey="feature" stroke="var(--theme-outline)" fontSize={11} width={115} />
                    <Tooltip contentStyle={{ background: 'var(--theme-surface-container-lowest)', border: '1px solid var(--theme-surface-container-high)', borderRadius: '8px', color: 'var(--theme-on-surface)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} />
                    <Bar dataKey="contribution" fill="#006c4a" name="Contribution %" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="6-hour risk nowcast trajectory">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={forecast}>
                    <CartesianGrid stroke="var(--theme-surface-container-high)" strokeDasharray="3 3" />
                    <XAxis dataKey="hour" stroke="var(--theme-outline)" />
                    <YAxis domain={[0, 100]} stroke="var(--theme-outline)" />
                    <Tooltip contentStyle={{ background: 'var(--theme-surface-container-lowest)', border: '1px solid var(--theme-surface-container-high)', borderRadius: '8px', color: 'var(--theme-on-surface)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} />
                    <Line type="monotone" dataKey="score" stroke="#ba1a1a" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Panel>
            <Panel title="Geotechnical Evidence Matrix">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-[11px] uppercase tracking-wider text-outline font-semibold border-b border-surface-container-high">
                    <tr>
                      <th className="pb-2">Factor / Sensor Feature</th>
                      <th className="pb-2">Live Reading</th>
                      <th className="pb-2">Model Weight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {zone.explain.map((e) => (
                      <tr key={e.feature} className="border-t border-surface-container-high hover:bg-surface-container-low">
                        <td className="py-2.5 pr-2 font-medium text-on-surface">{e.feature}</td>
                        <td className="font-mono text-xs text-secondary font-semibold">{e.value}</td>
                        <td className="font-mono text-xs text-outline">{(e.weight * 100).toFixed(0)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>
        </div>
      )}

      {/* SEOC Tactical Operations Console Banner (Burnt Orange & Vanilla Theme) */}
      <div className="rounded-2xl border border-[#fc6c26]/40 bg-gradient-to-r from-[#1c1008] via-[#24150d] to-[#160b05] p-5 shadow-xl text-[#fff4d6]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-[#fc6c26] pulse-dot" />
              <p className="text-xs font-bold tracking-widest text-[#fc6c26] uppercase">
                SEOC Tactical Operations Desk Active
              </p>
            </div>
            <h2 className="text-lg font-bold text-[#fff4d6]">
              Query Geotechnical Telemetry &amp; Shelters for {zone.name}
            </h2>
            <p className="text-xs text-[#e8dcbe] max-w-2xl">
              Inspect physical parameter contributions, simulate slope saturation thresholds, request road corridor diversions, or check designated evacuation shelters. Open the SEOC Tactical Console at the bottom right.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                const el = document.querySelector('button[aria-label="Open SEOC Duty Desk"]') as HTMLButtonElement
                if (el) el.click()
              }}
              className="flex items-center gap-2 rounded-xl bg-[#fc6c26] px-4 py-2 text-xs font-bold text-[#1a0800] hover:bg-[#ff7e3d] transition shadow-lg shadow-[#fc6c26]/30 cursor-pointer"
            >
              <Radio className="h-4 w-4" />
              <span>SEOC Tactical Console</span>
              <span>&rarr;</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
