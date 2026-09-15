import { useState, useEffect, useCallback, type FormEvent } from 'react'
import { Panel } from '../components/ui'
import { fmtTime } from '../lib/format'
import { useStore } from '../store/useStore'
import {
  MapPin,
  Navigation,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Camera,
  WifiOff,
  Send,
  Crosshair,
} from 'lucide-react'
import type { FieldReport, RiskZone } from '../types'

const CATEGORIES: FieldReport['category'][] = [
  'Slope crack',
  'Debris on road',
  'Blocked drain',
  'Building tilt',
  'River cut',
]

const NER_PRESETS: { name: string; state: string; lat: number; lng: number; altitude: number; zoneId: string }[] = [
  { name: 'NH-10 Km 8.2 (Gangtok)', state: 'Sikkim', lat: 27.349, lng: 88.62, altitude: 1650, zoneId: 'Z-SK-01' },
  { name: 'Shillong Bypass (East Khasi)', state: 'Meghalaya', lat: 25.578, lng: 91.893, altitude: 1496, zoneId: 'Z-MEG-01' },
  { name: 'Zubza Corridor (Kohima)', state: 'Nagaland', lat: 25.678, lng: 94.1, altitude: 1444, zoneId: 'Z-NL-01' },
  { name: 'Guwahati SEOC Base (Kamrup)', state: 'Assam', lat: 26.143, lng: 91.789, altitude: 55, zoneId: 'Z-ASM-01' },
  { name: 'Doimukh Slope (Papum Pare)', state: 'Arunachal', lat: 27.142, lng: 93.75, altitude: 420, zoneId: 'Z-AR-01' },
  { name: 'Champhai Hill Road', state: 'Mizoram', lat: 23.475, lng: 93.329, altitude: 1380, zoneId: 'Z-MZ-01' },
]

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371 // Earth radius km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function FieldPage() {
  const { reports, addReport, zones, user } = useStore()

  // Form State
  const [zoneId, setZoneId] = useState(zones[0]?.id ?? '')
  const [category, setCategory] = useState<FieldReport['category']>('Slope crack')
  const [note, setNote] = useState('Fresh tension crack above the highway bench; weep holes discharging muddy water.')
  const [photoName, setPhotoName] = useState('field-capture.jpg')
  const [photoData, setPhotoData] = useState<string | undefined>()
  const [offline, setOffline] = useState(false)
  const [saved, setSaved] = useState<string | null>(null)

  // Automatic Location Fetching State
  const [lat, setLat] = useState<number>(zones[0]?.lat ?? 26.14)
  const [lng, setLng] = useState<number>(zones[0]?.lng ?? 91.78)
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const [altitude, setAltitude] = useState<number | null>(null)
  const [locationStatus, setLocationStatus] = useState<'idle' | 'fetching' | 'locked' | 'fallback'>('idle')
  const [locationError, setLocationError] = useState<string | null>(null)
  const [nearestZoneInfo, setNearestZoneInfo] = useState<{ zone: RiskZone; distanceKm: number } | null>(null)
  const [lastFetchedTime, setLastFetchedTime] = useState<string | null>(null)

  // Helper to find closest monitoring zone
  const updateNearestZone = useCallback(
    (currentLat: number, currentLng: number) => {
      if (!zones || zones.length === 0) return
      let closest: RiskZone = zones[0]
      let minDistance = calculateDistanceKm(currentLat, currentLng, zones[0].lat, zones[0].lng)

      for (let i = 1; i < zones.length; i++) {
        const d = calculateDistanceKm(currentLat, currentLng, zones[i].lat, zones[i].lng)
        if (d < minDistance) {
          minDistance = d
          closest = zones[i]
        }
      }

      setNearestZoneInfo({ zone: closest, distanceKm: minDistance })
      setZoneId(closest.id)
    },
    [zones],
  )

  // Core Automatic Geolocation Fetcher
  const fetchLiveGPSLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus('fallback')
      setLocationError('Geolocation API is not supported by this browser environment.')
      return
    }

    setLocationStatus('fetching')
    setLocationError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy: acc, altitude: alt } = position.coords
        setLat(latitude)
        setLng(longitude)
        setAccuracy(acc ? Math.round(acc) : null)
        setAltitude(alt ? Math.round(alt) : null)
        setLocationStatus('locked')
        setLastFetchedTime(new Date().toLocaleTimeString())
        updateNearestZone(latitude, longitude)
      },
      (error) => {
        console.warn('Geolocation fetch error:', error.message)
        setLocationStatus('fallback')
        setLocationError(`GPS Lock unavailable (${error.message}). Using calibrated NER Field Station coordinates.`)
        // Fallback to initial zone
        const defaultZone = zones[0]
        if (defaultZone) {
          setLat(defaultZone.lat)
          setLng(defaultZone.lng)
          updateNearestZone(defaultZone.lat, defaultZone.lng)
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    )
  }, [zones, updateNearestZone])

  // Automatically trigger location fetching on component mount
  const hasMounted = useCallback(() => {
    fetchLiveGPSLocation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally empty: fire once on mount only
  useEffect(() => { hasMounted() }, [hasMounted])

  function handleSelectPreset(preset: (typeof NER_PRESETS)[0]) {
    setLat(preset.lat)
    setLng(preset.lng)
    setAltitude(preset.altitude)
    setAccuracy(3)
    setLocationStatus('locked')
    setLastFetchedTime(new Date().toLocaleTimeString())
    setLocationError(null)
    updateNearestZone(preset.lat, preset.lng)
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const z = zones.find((x) => x.id === zoneId) || zones[0]
    if (!z || !user) return

    const report: FieldReport = {
      id: `FR-${Date.now()}`,
      time: new Date().toISOString(),
      reporter: user.name,
      role: user.role,
      zoneId: z.id,
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      accuracyMeters: accuracy ?? undefined,
      altitudeM: altitude ?? undefined,
      locationName: nearestZoneInfo ? `${nearestZoneInfo.zone.name} (${nearestZoneInfo.zone.district})` : z.name,
      category,
      note,
      photoName,
      photoData,
      status: offline ? 'Queued' : 'Synced',
    }

    addReport(report)
    setSaved(
      offline
        ? 'Stored locally in offline buffer — will sync when satellite/cellular uplink reconnects.'
        : `Synced to SEOC Central Command with live GPS coordinates (${lat.toFixed(4)}°, ${lng.toFixed(4)}°).`,
    )
    setTimeout(() => setSaved(null), 5000)
  }

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-secondary-container px-2 py-0.5 text-[10px] font-mono font-bold text-on-secondary-container border border-secondary/30 uppercase">
              GPS TELEMETRY ACTIVE
            </span>
            <span className="text-xs text-on-surface-variant">&bull; Automatic Location Fetching Enabled</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-on-surface">Field Intelligence &amp; GPS Ground Truth</h1>
          <p className="text-sm text-on-surface-variant">
            Auto-fetch real-time officer device coordinates, slope cracks, road debris, and blocked weep holes.
          </p>
        </div>

        {/* Live GPS Status Button */}
        <button
          type="button"
          onClick={fetchLiveGPSLocation}
          className="flex items-center gap-2 rounded-lg border border-secondary bg-secondary px-3.5 py-2 text-xs font-bold text-on-secondary hover:bg-secondary/90 transition cursor-pointer shadow-sm shadow-secondary/20"
        >
          <RefreshCw size={14} className={locationStatus === 'fetching' ? 'animate-spin' : ''} />
          <span>{locationStatus === 'fetching' ? 'Acquiring Satellite Fix...' : 'Refresh Live GPS Fix'}</span>
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        {/* Left Column: GPS Telemetry & Observation Filing (7 Cols) */}
        <div className="space-y-4 lg:col-span-7">
          {/* Automatic Location Fetching Telemetry Card */}
          <div className="rounded-xl border border-surface-container-high bg-surface-container-lowest p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-container-high pb-3">
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-secondary-container p-2 text-on-secondary-container ring-1 ring-secondary/30">
                  <Navigation size={18} className={locationStatus === 'fetching' ? 'animate-pulse' : ''} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                    <span>Automatic GPS Device Location</span>
                    {locationStatus === 'locked' && (
                      <span className="flex items-center gap-1 rounded bg-secondary-container px-2 py-0.5 text-[10px] font-mono font-bold text-on-secondary-container border border-secondary/30">
                        <span className="h-1.5 w-1.5 rounded-full bg-secondary animate-ping" />
                        GPS LOCKED
                      </span>
                    )}
                    {locationStatus === 'fetching' && (
                      <span className="rounded bg-tertiary-fixed px-2 py-0.5 text-[10px] font-mono font-bold text-on-tertiary-fixed-variant border border-tertiary/30">
                        SEARCHING SATELLITES...
                      </span>
                    )}
                    {locationStatus === 'fallback' && (
                      <span className="rounded bg-surface-container-high px-2 py-0.5 text-[10px] font-mono font-bold text-on-surface-variant border border-surface-container-highest">
                        CALIBRATED PRESET
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-outline">
                    {lastFetchedTime ? `Last acquired at ${lastFetchedTime} IST` : 'Auto-polling device sensor coordinates'}
                  </p>
                </div>
              </div>

              <a
                href={`https://maps.google.com/?q=${lat},${lng}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 rounded border border-surface-container-high bg-surface-container-low px-2.5 py-1 text-xs font-semibold text-secondary hover:bg-secondary-container hover:text-on-secondary-container transition"
              >
                <ExternalLink size={12} />
                <span>Open in Satellite Map</span>
              </a>
            </div>

            {/* Coordinates Grid */}
            <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4 text-xs">
              <div className="rounded-lg border border-surface-container-high bg-surface-container-low p-2.5">
                <span className="text-[10px] font-bold text-outline uppercase">Latitude</span>
                <p className="mt-0.5 font-mono text-sm font-bold text-secondary">{lat.toFixed(5)}° N</p>
              </div>
              <div className="rounded-lg border border-surface-container-high bg-surface-container-low p-2.5">
                <span className="text-[10px] font-bold text-outline uppercase">Longitude</span>
                <p className="mt-0.5 font-mono text-sm font-bold text-secondary">{lng.toFixed(5)}° E</p>
              </div>
              <div className="rounded-lg border border-surface-container-high bg-surface-container-low p-2.5">
                <span className="text-[10px] font-bold text-outline uppercase">Accuracy</span>
                <p className="mt-0.5 font-mono text-sm font-semibold text-on-surface">
                  {accuracy ? `± ${accuracy} meters` : 'High Precision'}
                </p>
              </div>
              <div className="rounded-lg border border-surface-container-high bg-surface-container-low p-2.5">
                <span className="text-[10px] font-bold text-outline uppercase">Altitude MSL</span>
                <p className="mt-0.5 font-mono text-sm font-semibold text-primary">
                  {altitude ? `${altitude} m` : '1,420 m'}
                </p>
              </div>
            </div>

            {/* Nearest Monitored Corridor Match */}
            {nearestZoneInfo && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-secondary/30 bg-secondary-container/30 p-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <Crosshair size={15} className="text-secondary shrink-0" />
                  <span className="text-on-surface">
                    Closest Monitored Zone:{' '}
                    <strong className="text-on-surface font-bold">{nearestZoneInfo.zone.name}</strong> ({nearestZoneInfo.zone.corridor})
                  </span>
                </div>
                <span className="font-mono font-bold text-secondary">
                  {nearestZoneInfo.distanceKm.toFixed(1)} km away
                </span>
              </div>
            )}

            {locationError && (
              <div className="mt-2.5 flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-500">
                <AlertCircle size={14} className="shrink-0" />
                <span>{locationError}</span>
              </div>
            )}

            {/* Fast Field Station Switcher (For simulated tests or offline hill travel) */}
            <div className="mt-3 pt-2.5 border-t border-surface-container-high">
              <span className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1.5">
                Quick Calibrate to Field Post:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {NER_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className="rounded border border-surface-container-high bg-surface-container-low px-2 py-1 text-[11px] font-medium text-on-surface hover:border-secondary hover:bg-secondary-container hover:text-on-secondary-container transition cursor-pointer"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* New Observation Filing Form */}
          <Panel title="File Geotagged Ground Truth Report">
            <form className="space-y-3.5" onSubmit={onSubmit}>
              {/* Linked Watch Box */}
              <div>
                <label className="block text-xs font-semibold text-outline uppercase">
                  Associated Hazard Zone / Corridor
                </label>
                <select
                  className="mt-1 w-full rounded-lg border border-surface-container-high bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:border-secondary shadow-sm"
                  value={zoneId}
                  onChange={(e) => setZoneId(e.target.value)}
                >
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name} ({z.district}, {z.state}) &bull; {z.corridor}
                    </option>
                  ))}
                </select>
              </div>

              {/* Hazard Category */}
              <div>
                <label className="block text-xs font-semibold text-outline uppercase">Observation Category</label>
                <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {CATEGORIES.map((c) => {
                    const isSelected = category === c
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCategory(c)}
                        className={`rounded-lg border p-2 text-xs font-medium text-left transition cursor-pointer ${
                          isSelected
                            ? 'border-secondary bg-secondary-container text-on-secondary-container font-bold ring-1 ring-secondary'
                            : 'border-surface-container-high bg-surface-container-low text-on-surface hover:bg-surface-container-high'
                        }`}
                      >
                        {c}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Geotagged Coordinates Confirmation Field */}
              <div className="rounded-lg border border-secondary/30 bg-secondary-container/20 p-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-secondary" />
                  <span className="text-on-surface-variant">Auto-Geotagged Coords:</span>
                  <span className="font-mono font-bold text-on-surface">
                    {lat.toFixed(5)}° N, {lng.toFixed(5)}° E
                  </span>
                </div>
                <span className="text-[10px] font-mono text-on-secondary-container font-bold bg-secondary-container px-2 py-0.5 rounded border border-secondary/30">READY TO ATTACH</span>
              </div>

              {/* Narrative Note */}
              <div>
                <label className="block text-xs font-semibold text-outline uppercase">
                  Field Narrative &amp; Slope Symptoms
                </label>
                <textarea
                  required
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-surface-container-high bg-surface-container-low p-3 text-sm text-on-surface outline-none focus:border-secondary placeholder:text-outline shadow-sm"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Describe crack length, depth, water discharge color, mud accumulation, or road subsidence..."
                />
              </div>

              {/* Geotagged Photo Upload */}
              <div>
                <label className="block text-xs font-semibold text-outline uppercase mb-1">
                  Attach Ground Photo (Auto-Geotagged)
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 rounded-lg border border-secondary/40 bg-secondary-container px-3 py-2 text-xs font-semibold text-on-secondary-container hover:bg-secondary-container/80 cursor-pointer transition">
                    <Camera size={15} />
                    <span>Choose Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        setPhotoName(file.name)
                        const reader = new FileReader()
                        reader.onload = () => setPhotoData(String(reader.result))
                        reader.readAsDataURL(file)
                      }}
                    />
                  </label>
                  <span className="text-xs text-outline truncate max-w-[200px]">{photoName}</span>
                </div>
                {photoData && (
                  <div className="mt-2.5 relative">
                    <img
                      src={photoData}
                      alt="Field capture preview"
                      className="max-h-48 w-full rounded-lg object-cover border border-surface-container-high shadow-sm"
                    />
                    <span className="absolute bottom-2 left-2 rounded bg-surface-container-lowest/90 px-2 py-0.5 font-mono text-[10px] text-on-surface backdrop-blur-sm border border-surface-container-high">
                      GPS: {lat.toFixed(4)}°, {lng.toFixed(4)}° &bull; {new Date().toLocaleTimeString()} IST
                    </span>
                  </div>
                )}
              </div>

              {/* Low Network Toggle & Submit */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-surface-container-high">
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={offline}
                    onChange={(e) => setOffline(e.target.checked)}
                    className="h-4 w-4 rounded border-surface-container-high text-secondary accent-secondary"
                  />
                  <span className="text-on-surface-variant flex items-center gap-1">
                    <WifiOff size={13} />
                    <span>Low-network / buffer in offline queue</span>
                  </span>
                </label>

                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-lg bg-secondary px-5 py-2.5 text-sm font-bold text-on-secondary hover:bg-secondary/90 transition cursor-pointer shadow-md shadow-secondary/20"
                >
                  <Send size={15} />
                  <span>Transmit Report to SEOC</span>
                </button>
              </div>

              {saved && (
                <div className="rounded-lg border border-secondary/40 bg-secondary-container p-3 text-xs font-semibold text-on-secondary-container flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-secondary" />
                  <span>{saved}</span>
                </div>
              )}
            </form>
          </Panel>
        </div>

        {/* Right Column: Live Incident Log Stream (5 Cols) */}
        <div className="space-y-4 lg:col-span-5">
          <Panel title="SEOC Field Intelligence Ledger">
            <div className="flex items-center justify-between text-xs text-outline mb-3">
              <span>Verified Ground Reports</span>
              <span className="font-mono font-bold text-secondary">{reports.length} Reports Logged</span>
            </div>

            <ul className="max-h-[750px] space-y-3 overflow-y-auto pr-1">
              {reports.map((r) => (
                <li
                  key={r.id}
                  className="rounded-xl border border-surface-container-high bg-surface-container-low p-3.5 hover:border-secondary/40 hover:bg-surface-container-lowest transition space-y-2 shadow-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded bg-secondary-container px-2 py-0.5 text-xs font-bold text-on-secondary-container border border-secondary/30">
                      {r.category}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        r.status === 'Verified'
                          ? 'bg-secondary-container text-on-secondary-container'
                          : r.status === 'Synced'
                            ? 'bg-primary-fixed text-on-primary-fixed'
                            : 'bg-tertiary-fixed text-on-tertiary-fixed-variant'
                      }`}
                    >
                      {r.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-[11px] text-on-surface-variant">
                    <span>
                      Officer: <strong className="text-on-surface font-semibold">{r.reporter}</strong> ({r.role})
                    </span>
                    <span className="font-mono text-outline">{fmtTime(r.time)}</span>
                  </div>

                  {/* Geotagged Location Pill */}
                  <div className="flex items-center justify-between rounded-lg bg-surface-container-lowest px-2.5 py-1.5 text-xs border border-surface-container-high">
                    <div className="flex items-center gap-1.5 text-secondary font-mono font-semibold">
                      <MapPin size={12} className="text-secondary" />
                      <span>
                        {r.lat.toFixed(4)}° N, {r.lng.toFixed(4)}° E
                      </span>
                    </div>
                    {r.altitudeM && (
                      <span className="text-[10px] text-outline font-mono">{r.altitudeM}m MSL</span>
                    )}
                    <a
                      href={`https://maps.google.com/?q=${r.lat},${r.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-outline hover:text-secondary transition flex items-center gap-0.5 font-medium"
                    >
                      <span>Map</span>
                      <ExternalLink size={10} />
                    </a>
                  </div>

                  <p className="text-xs text-on-surface leading-relaxed font-normal">{r.note}</p>

                  {r.photoData && (
                    <div className="pt-1">
                      <img
                        src={r.photoData}
                        alt={r.photoName}
                        className="max-h-36 w-full rounded-lg object-cover border border-surface-container-high"
                      />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  )
}
