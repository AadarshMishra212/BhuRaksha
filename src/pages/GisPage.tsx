import { useMemo, useState } from 'react'
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
    <div className="space-y-space-lg">
      <div className="flex flex-wrap items-end justify-between gap-space-md">
        <div>
          <p className="font-label-caps text-primary">Interactive Geospatial GIS</p>
          <h1 className="font-display-2xl text-on-surface">Operations Map &bull; Vulnerable Slopes &amp; Corridors</h1>
        </div>
        <label className="text-xs font-semibold text-on-surface-variant flex items-center gap-2">
          <span className="font-label-caps text-outline">Filter State:</span>
          <select
            className="rounded-lg border border-surface-container-high bg-surface-container-lowest px-3 py-1.5 text-sm font-medium text-on-surface shadow-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
          >
            {states.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-space-lg xl:grid-cols-3">
        <Panel title="Geohazard Basemap Intelligence" className="xl:col-span-2">
          <RiskMap height="h-[640px]" />
        </Panel>
        <div className="space-y-space-md">
          <Panel title="Inspect Zone Telemetry">
            {selectedZone ? (
              <div className="space-y-2 text-sm text-on-surface">
                <div className="flex items-center justify-between border-b border-surface-container-high/60 pb-2">
                  <p className="font-headline-lg font-bold text-on-surface">{selectedZone.name}</p>
                  <Pill severity={selectedZone.severity} />
                </div>
                <p className="text-on-surface-variant font-medium">
                  {selectedZone.district}, {selectedZone.state}
                </p>
                <p className="font-mono text-xs text-on-surface bg-surface-container-low p-1.5 rounded border border-surface-container-high inline-block">
                  📍 {selectedZone.lat.toFixed(3)}° N, {selectedZone.lng.toFixed(3)}° E
                </p>
                <p><strong className="text-on-surface">Corridor:</strong> {selectedZone.corridor}</p>
                <p><strong className="text-on-surface">Lithology:</strong> {selectedZone.lithology}</p>
                <p><strong className="text-on-surface">Land use:</strong> {selectedZone.landUse}</p>
                <p><strong className="text-on-surface">Slope:</strong> {selectedZone.slopeDeg}° &bull; <strong className="text-on-surface">History:</strong> {selectedZone.historicalEvents} slides</p>
                <p><strong className="text-on-surface">Population at risk:</strong> {selectedZone.populationAtRisk.toLocaleString('en-IN')}</p>
                <p className="text-xs leading-relaxed text-on-surface-variant"><strong className="text-on-surface">Villages:</strong> {selectedZone.villages.join(', ')}</p>
              </div>
            ) : (
              <p className="text-sm text-outline py-4 text-center">Select a zone marker on the map to inspect details.</p>
            )}
          </Panel>
          <Panel title="Filtered Watch Boxes">
            <ul className="max-h-72 space-y-2 overflow-auto pr-1">
              {filtered.map((z) => (
                <li key={z.id}>
                  <button
                    type="button"
                    onClick={() => selectZone(z.id)}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition cursor-pointer flex items-center justify-between ${
                      selectedZone?.id === z.id
                        ? 'border-primary bg-primary-fixed text-on-primary-fixed font-bold shadow-xs'
                        : 'border-surface-container-high bg-surface-container-low text-on-surface hover:border-primary/50'
                    }`}
                  >
                    <span className="font-medium text-xs truncate mr-2">{z.name}</span>
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-surface-container-lowest border border-surface-container-high text-on-surface shrink-0">
                      Score {z.riskScore.toFixed(0)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Corridor Arterials Status">
            <ul className="space-y-2 text-sm divide-y divide-surface-container-high/60">
              {roads.map((r) => (
                <li key={r.id} className="pt-2 first:pt-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-on-surface text-xs">{r.name}</p>
                    <span
                      className={`text-[10px] font-label-caps px-2 py-0.5 rounded ${
                        r.status === 'Open'
                          ? 'bg-secondary-container text-on-secondary-container'
                          : r.status === 'Restricted'
                            ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant'
                            : 'bg-error-container text-on-error-container'
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-0.5 font-caption">
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
