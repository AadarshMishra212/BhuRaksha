import { useEffect, useState } from 'react'
import { Circle, CircleMarker, MapContainer, Polyline, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet'
import { NER_CENTER } from '../data/catalog'
import { severityColor } from '../engine/riskModel'
import { roadClass } from '../lib/format'
import { useStore } from '../store/AppStore'
import { Pill } from './ui'
import type { RiskZone } from '../types'

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

const BASEMAPS = {
  carto_dark: {
    name: 'CARTO Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO',
  },
  google_hybrid: {
    name: 'Google Satellite',
    url: `https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}${GOOGLE_API_KEY ? `&key=${GOOGLE_API_KEY}` : ''}`,
    attribution: '&copy; Google Maps',
  },
  google_terrain: {
    name: 'Google Terrain',
    url: `https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}${GOOGLE_API_KEY ? `&key=${GOOGLE_API_KEY}` : ''}`,
    attribution: '&copy; Google Maps',
  },
  google_streets: {
    name: 'Google Streets',
    url: `https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}${GOOGLE_API_KEY ? `&key=${GOOGLE_API_KEY}` : ''}`,
    attribution: '&copy; Google Maps',
  },
} as const

type BasemapKey = keyof typeof BASEMAPS

function FlyTo({ zone }: { zone: RiskZone | null }) {
  const map = useMap()
  useEffect(() => {
    if (!zone) return
    map.flyTo([zone.lat, zone.lng], 10, { duration: 0.8 })
  }, [zone, map])
  return null
}

function Invalidate() {
  const map = useMap()
  useEffect(() => {
    const t = window.setTimeout(() => map.invalidateSize(), 200)
    return () => window.clearTimeout(t)
  }, [map])
  return null
}

export function RiskMap({ height = 'h-[520px]' }: { height?: string }) {
  const { zones, sensors, roads, villages, reports, selectedZone, selectZone } = useStore()
  const [basemap, setBasemap] = useState<BasemapKey>('google_hybrid')
  const [enableScrollZoom, setEnableScrollZoom] = useState(false)

  return (
    <div className={`relative z-0 isolate overflow-hidden rounded-xl border border-lime/20 ${height}`}>
      <MapContainer
        center={NER_CENTER}
        zoom={6}
        className="h-full w-full"
        scrollWheelZoom={enableScrollZoom}
      >
        <TileLayer
          key={basemap}
          attribution={BASEMAPS[basemap].attribution}
          url={BASEMAPS[basemap].url}
        />
        <Invalidate />
        <FlyTo zone={selectedZone} />
        {zones.map((z) => (
          <Circle
            key={`heat-${z.id}`}
            center={[z.lat, z.lng]}
            radius={1800 + z.riskScore * 90}
            pathOptions={{
              color: severityColor(z.severity),
              fillColor: severityColor(z.severity),
              fillOpacity: 0.18 + z.riskScore / 400,
              weight: 1,
            }}
            eventHandlers={{ click: () => selectZone(z.id) }}
          />
        ))}
        {zones.map((z) => (
          <CircleMarker
            key={z.id}
            center={[z.lat, z.lng]}
            radius={z.id === selectedZone?.id ? 10 : 6}
            pathOptions={{
              color: '#e8f0ea',
              weight: 1,
              fillColor: severityColor(z.severity),
              fillOpacity: 0.95,
            }}
            eventHandlers={{ click: () => selectZone(z.id) }}
          >
            <Tooltip direction="top">{z.name}</Tooltip>
            <Popup>
              <div className="min-w-[200px] text-sm">
                <p className="font-semibold">{z.name}</p>
                <p className="text-xs opacity-80">
                  {z.district}, {z.state}
                </p>
                <div className="mt-2">
                  <Pill severity={z.severity} />
                </div>
                <p className="mt-2 font-mono text-xs">Risk {z.riskScore.toFixed(1)} · Rain {z.rainfall24h.toFixed(0)} mm</p>
                <p className="mt-1 text-xs">{z.corridor}</p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
        {roads.map((r) => (
          <Polyline
            key={r.id}
            positions={r.path}
            pathOptions={{
              color: r.status === 'Blocked' ? '#e07040' : r.status === 'Restricted' ? '#e0b04a' : '#9ccc65',
              weight: 4,
              opacity: 0.85,
            }}
          >
            <Popup>
              <p className="font-semibold">{r.name}</p>
              <p className={`text-xs ${roadClass(r.status)}`}>{r.status}</p>
              <p className="mt-1 text-xs">{r.diversion}</p>
            </Popup>
          </Polyline>
        ))}
        {sensors.map((s) => (
          <CircleMarker
            key={s.id}
            center={[s.lat, s.lng]}
            radius={4}
            pathOptions={{
              color: s.status === 'Offline' ? '#e07040' : s.status === 'Degraded' ? '#e0b04a' : '#5aa7b8',
              fillOpacity: 0.9,
              weight: 1,
            }}
          >
            <Popup>
              <p className="font-semibold">{s.name}</p>
              <p className="font-mono text-xs">
                {s.value.toFixed(1)} {s.unit} · {s.status}
              </p>
            </Popup>
          </CircleMarker>
        ))}
        {villages.map((v) => (
          <CircleMarker
            key={v.id}
            center={[v.lat, v.lng]}
            radius={5}
            pathOptions={{ color: '#c8e6a0', fillColor: '#1a3a34', fillOpacity: 1, weight: 2 }}
          >
            <Popup>
              <p className="font-semibold">{v.name}</p>
              <p className="text-xs">
                {v.households} households · {v.connectivity}
              </p>
              <p className="text-xs">Shelter: {v.shelter}</p>
            </Popup>
          </CircleMarker>
        ))}
        {reports.map((r) => (
          <CircleMarker
            key={r.id}
            center={[r.lat, r.lng]}
            radius={5}
            pathOptions={{ color: '#fff', fillColor: '#b08968', fillOpacity: 1, weight: 1 }}
          >
            <Popup>
              <p className="font-semibold">{r.category}</p>
              <p className="text-xs">{r.note}</p>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Layer Legend Overlay */}
      <div className="pointer-events-none absolute left-3 top-3 rounded-lg border border-lime/20 bg-command/80 px-3 py-2 text-[10px] tracking-wide text-ink backdrop-blur-sm z-10 hidden sm:block">
        <p className="font-semibold text-lime">LAYER LEGEND</p>
        <p>Heat = zone risk · Teal = sensors · Lime = villages · Soil = field reports</p>
        <p>Corridors: green open · amber restricted · orange blocked</p>
      </div>

      {/* Map Control & Basemap Switcher */}
      <div className="absolute right-3 top-3 z-10 flex flex-wrap items-center gap-1 rounded-lg border border-lime/20 bg-command/90 p-1 backdrop-blur-sm shadow-md">
        <button
          type="button"
          onClick={() => setEnableScrollZoom(!enableScrollZoom)}
          className={`rounded px-2 py-1 text-[10px] font-medium transition ${
            enableScrollZoom
              ? 'bg-alert/20 text-alert border border-alert/30 font-semibold'
              : 'text-muted hover:text-ink'
          }`}
          title={enableScrollZoom ? 'Wheel zoom is active (click to lock for page scrolling)' : 'Click to enable map wheel zoom'}
        >
          {enableScrollZoom ? '🔍 Zoom: Wheel' : '🔒 Page Scroll'}
        </button>

        <span className="h-3 w-px bg-white/10" />

        {(Object.keys(BASEMAPS) as BasemapKey[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setBasemap(key)}
            className={`rounded px-2 py-1 text-[10px] font-medium transition-colors ${
              basemap === key
                ? 'bg-lime/20 text-lime font-semibold border border-lime/40'
                : 'text-muted hover:text-ink'
            }`}
          >
            {BASEMAPS[key].name}
          </button>
        ))}
      </div>
    </div>
  )
}
