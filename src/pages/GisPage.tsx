import { useMemo, useState } from 'react'
import {
  Compass,
  MapPin,
  Radio,
  Route,
} from 'lucide-react'
import { RiskMap } from '../components/RiskMap'
import { Panel, Pill } from '../components/ui'
import { useStore } from '../store/useStore'

export function GisPage() {
  const { zones, roads, selectedZone, selectZone } = useStore()
  const [stateFilter, setStateFilter] = useState('All')
  const states = ['All', ...Array.from(new Set(zones.map((z) => z.state)))]

  const filtered = useMemo(
    () => zones.filter((z) => stateFilter === 'All' || z.state === stateFilter),
    [zones, stateFilter],
  )

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <p className="font-label-caps text-primary text-[10.5px] font-bold">Interactive Geospatial GIS</p>
          </div>
          <h1 className="font-display-2xl text-2xl sm:text-3xl text-on-surface font-extrabold tracking-tight">
            Geospatial Hazard Map &bull; Slopes, Shelters &amp; Corridors
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
            Interactive GIS with InSAR hazard polygon overlays, GPS safe shelter routing, and arterial passability status.
          </p>
        </div>

        {/* State Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto p-1.5 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-xs">
          <span className="text-[10px] font-label-caps text-outline ml-1.5 mr-1 font-bold">Filter State:</span>
          {states.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStateFilter(s)}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                stateFilter === s
                  ? 'bg-primary text-on-primary shadow-xs font-bold'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Left 2 Cols: Basemap */}
        <Panel title="Geohazard Basemap Intelligence" icon={Compass} className="xl:col-span-2">
          <div className="rounded-xl overflow-hidden border border-surface-container-high/80">
            <RiskMap height="h-[640px]" />
          </div>
        </Panel>

        {/* Right 1 Col: Zone Telemetry Inspector & Watchboxes */}
        <div className="space-y-6">
          {/* Selected Zone Telemetry Card */}
          <Panel title="Sector Telemetry Inspector" icon={MapPin}>
            {selectedZone ? (
              <div className="space-y-3 text-xs sm:text-sm text-on-surface">
                <div className="flex items-center justify-between border-b border-surface-container-high pb-2.5">
                  <div>
                    <p className="font-headline-lg text-base font-bold text-on-surface">{selectedZone.name}</p>
                    <p className="text-xs text-outline font-medium">
                      {selectedZone.district}, {selectedZone.state}
                    </p>
                  </div>
                  <Pill severity={selectedZone.severity} />
                </div>

                <div className="flex items-center gap-2 font-mono text-[11px] text-primary bg-primary-fixed/40 px-2.5 py-1 rounded-lg border border-primary/20">
                  <MapPin size={12} className="text-primary" />
                  <span>{selectedZone.lat.toFixed(4)}° N, {selectedZone.lng.toFixed(4)}° E</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-surface-container-low border border-surface-container-high/60">
                    <span className="text-[10px] font-label-caps text-outline block">Corridor</span>
                    <strong className="text-on-surface truncate block">{selectedZone.corridor}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-surface-container-low border border-surface-container-high/60">
                    <span className="text-[10px] font-label-caps text-outline block">Lithology</span>
                    <strong className="text-on-surface truncate block">{selectedZone.lithology}</strong>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-surface-container-low border border-surface-container-high/60 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-outline">Slope Gradient:</span>
                    <span className="font-mono font-bold text-on-surface">{selectedZone.slopeDeg}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-outline">Historical Events:</span>
                    <span className="font-mono font-bold text-primary">{selectedZone.historicalEvents} slides</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-outline">Population at Risk:</span>
                    <span className="font-mono font-bold text-on-surface">{selectedZone.populationAtRisk.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <p className="text-xs text-on-surface-variant leading-relaxed">
                  <strong className="text-on-surface font-semibold">Tracked Villages:</strong> {selectedZone.villages.join(', ')}
                </p>
              </div>
            ) : (
              <p className="text-xs text-outline py-6 text-center">
                Click any zone marker or sector card on the map to inspect live geotechnical telemetry.
              </p>
            )}
          </Panel>

          {/* Filtered Watchboxes */}
          <Panel title={`Watchbox Sectors (${filtered.length})`} icon={Radio}>
            <ul className="max-h-64 space-y-2 overflow-auto pr-1">
              {filtered.map((z) => (
                <li key={z.id}>
                  <button
                    type="button"
                    onClick={() => selectZone(z.id)}
                    className={`w-full rounded-xl border p-2.5 text-left text-xs transition-all cursor-pointer flex items-center justify-between shadow-2xs hover:-translate-y-0.5 ${
                      selectedZone?.id === z.id
                        ? 'border-primary bg-primary-fixed text-on-primary-fixed font-bold ring-2 ring-primary/20'
                        : 'border-surface-container-high bg-surface-container-low text-on-surface hover:border-primary/50'
                    }`}
                  >
                    <span className="font-bold truncate mr-2">{z.name}</span>
                    <span className="font-mono text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-surface-container-lowest border border-surface-container-high text-primary shrink-0">
                      Score {z.riskScore.toFixed(0)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Panel>

          {/* Corridor Arterials Status */}
          <Panel title="Highway Corridors" icon={Route}>
            <ul className="space-y-2 text-xs divide-y divide-surface-container-high/60">
              {roads.map((r) => (
                <li key={r.id} className="pt-2 first:pt-0">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-on-surface">{r.name}</p>
                    <span
                      className={`text-[9.5px] font-label-caps font-bold px-2 py-0.5 rounded-full border shadow-2xs ${
                        r.status === 'Open'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : r.status === 'Restricted'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-0.5 font-caption">
                    {r.diversion}
                  </p>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  )
}
