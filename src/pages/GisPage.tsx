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
          <p className="text-[11px] tracking-[0.22em] text-emerald-700 uppercase font-semibold">Interactive GIS</p>
          <h1 className="text-2xl font-bold text-gray-900">Operations map — vulnerable slopes, roads, villages</h1>
        </div>
        <label className="text-xs font-semibold text-gray-700 flex items-center gap-2">
          <span>Filter State:</span>
          <select
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-900 shadow-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
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
        <Panel title="Leaflet Geohazard Basemap · CARTO" className="xl:col-span-2">
          <RiskMap height="h-[640px]" />
        </Panel>
        <div className="space-y-4">
          <Panel title="Inspect zone">
            {selectedZone ? (
              <div className="space-y-2 text-sm text-gray-800">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <p className="font-bold text-base text-gray-900">{selectedZone.name}</p>
                  <Pill severity={selectedZone.severity} />
                </div>
                <p className="text-gray-600 font-medium">
                  {selectedZone.district}, {selectedZone.state}
                </p>
                <p className="font-mono text-xs text-gray-700 bg-gray-50 p-1.5 rounded border border-gray-200 inline-block">
                  📍 {selectedZone.lat.toFixed(3)}° N, {selectedZone.lng.toFixed(3)}° E
                </p>
                <p><strong className="text-gray-900">Corridor:</strong> {selectedZone.corridor}</p>
                <p><strong className="text-gray-900">Lithology:</strong> {selectedZone.lithology}</p>
                <p><strong className="text-gray-900">Land use:</strong> {selectedZone.landUse}</p>
                <p><strong className="text-gray-900">Slope:</strong> {selectedZone.slopeDeg}° · <strong className="text-gray-900">History:</strong> {selectedZone.historicalEvents} slides</p>
                <p><strong className="text-gray-900">Population at risk:</strong> {selectedZone.populationAtRisk.toLocaleString('en-IN')}</p>
                <p className="text-xs leading-relaxed text-gray-600"><strong className="text-gray-900">Villages:</strong> {selectedZone.villages.join(', ')}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500 py-4 text-center">Select a zone marker on the map to inspect details.</p>
            )}
          </Panel>
          <Panel title="Filtered watch boxes">
            <ul className="max-h-72 space-y-2 overflow-auto pr-1">
              {filtered.map((z) => (
                <li key={z.id}>
                  <button
                    type="button"
                    onClick={() => selectZone(z.id)}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition cursor-pointer flex items-center justify-between ${
                      selectedZone?.id === z.id
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold shadow-sm'
                        : 'border-gray-200 bg-gray-50/70 text-gray-900 hover:border-emerald-400 hover:bg-emerald-50/40'
                    }`}
                  >
                    <span className="font-medium">{z.name}</span>
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-white border border-gray-200 text-gray-700">
                      Score {z.riskScore.toFixed(0)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Road status">
            <ul className="space-y-2 text-sm divide-y divide-gray-100">
              {roads.map((r) => (
                <li key={r.id} className="pt-2 first:pt-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-900">{r.name}</p>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        r.status === 'Open'
                          ? 'bg-emerald-100 text-emerald-800'
                          : r.status === 'Restricted'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">
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
