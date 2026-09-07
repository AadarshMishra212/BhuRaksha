import { useMemo, useState } from 'react'
import { RiskMap } from '../components/RiskMap'
import { Panel, Pill } from '../components/ui'
import { useStore } from '../store/AppStore'

export function GisPage() {
  const { zones, roads, selectedZone, selectZone } = useStore()
  const [stateFilter, setStateFilter] = useState('All')
  const states = ['All', ...Array.from(new Set(zones.map((z) => z.state)))]
  const filtered = useMemo(
    () => zones.filter((z) => stateFilter === 'All' || z.state === stateFilter),
    [zones, stateFilter],
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] tracking-[0.22em] text-lime uppercase">Interactive GIS</p>
          <h1 className="text-2xl font-semibold">Operations map — vulnerable slopes, roads, villages</h1>
        </div>
        <label className="text-xs text-muted">
          State
          <select
            className="ml-2 rounded border border-lime/20 bg-panel px-2 py-1 text-sm text-ink"
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
          >
            {states.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Leaflet dark basemap · CARTO" className="xl:col-span-2">
          <RiskMap height="h-[640px]" />
        </Panel>
        <div className="space-y-4">
          <Panel title="Inspect zone">
            {selectedZone ? (
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{selectedZone.name}</p>
                  <Pill severity={selectedZone.severity} />
                </div>
                <p className="text-muted">
                  {selectedZone.district}, {selectedZone.state}
                </p>
                <p className="font-mono text-xs">
                  {selectedZone.lat.toFixed(3)} N, {selectedZone.lng.toFixed(3)} E
                </p>
                <p>Corridor: {selectedZone.corridor}</p>
                <p>Lithology: {selectedZone.lithology}</p>
                <p>Land use: {selectedZone.landUse}</p>
                <p>Slope: {selectedZone.slopeDeg}° · History: {selectedZone.historicalEvents} slides</p>
                <p>Population at risk: {selectedZone.populationAtRisk.toLocaleString('en-IN')}</p>
                <p>Villages: {selectedZone.villages.join(', ')}</p>
              </div>
            ) : (
              <p className="text-sm text-muted">Select a zone marker on the map.</p>
            )}
          </Panel>
          <Panel title="Filtered watch boxes">
            <ul className="max-h-72 space-y-2 overflow-auto">
              {filtered.map((z) => (
                <li key={z.id}>
                  <button
                    type="button"
                    onClick={() => selectZone(z.id)}
                    className="w-full rounded-lg border border-white/5 px-3 py-2 text-left text-sm hover:border-lime/40"
                  >
                    <span className="font-medium">{z.name}</span>
                    <span className="ml-2 font-mono text-[11px] text-muted">{z.riskScore.toFixed(0)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Road status">
            <ul className="space-y-2 text-sm">
              {roads.map((r) => (
                <li key={r.id}>
                  <p className="font-medium">{r.name}</p>
                  <p className="text-xs text-muted">
                    {r.status} — {r.diversion}
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
