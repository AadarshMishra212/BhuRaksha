import { Panel } from '../components/ui'
import { useStore } from '../store/useStore'

export function CommunitiesPage() {
  const { villages, roads } = useStore()
  return (
    <div className="space-y-space-lg">
      <div>
        <p className="font-label-caps text-primary">Last-Mile Field Picture</p>
        <h1 className="font-display-2xl text-on-surface">Villages, Shelters &amp; Corridor Status</h1>
      </div>
      <div className="grid gap-space-lg lg:grid-cols-2">
        <Panel title="Village Disaster Committees">
          <ul className="space-y-3">
            {villages.map((v) => (
              <li key={v.id} className="rounded-lg border border-surface-container-high bg-surface-container-low p-3.5 text-sm shadow-xs">
                <div className="flex justify-between gap-2">
                  <p className="font-bold text-on-surface">{v.name}</p>
                  <span
                    className={`font-label-caps text-[10px] px-2 py-0.5 rounded ${
                      v.connectivity === 'Blocked'
                        ? 'bg-error-container text-on-error-container'
                        : v.connectivity === 'Restricted'
                          ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant'
                          : 'bg-secondary-container text-on-secondary-container'
                    }`}
                  >
                    {v.connectivity}
                  </span>
                </div>
                <p className="text-xs text-outline mt-0.5">
                  {v.district}, {v.state} &bull; {v.households} households &bull; {v.language}
                </p>
                <p className="mt-1.5 text-xs text-on-surface font-medium">Relief shelter: <span className="text-primary font-semibold">{v.shelter}</span></p>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Strategic Corridors &amp; Roads">
          <ul className="space-y-3">
            {roads.map((r) => (
              <li key={r.id} className="rounded-lg border border-surface-container-high bg-surface-container-low p-3.5 text-sm shadow-xs">
                <div className="flex justify-between gap-2">
                  <p className="font-bold text-on-surface">{r.name}</p>
                  <span
                    className={`font-label-caps text-[10px] px-2 py-0.5 rounded ${
                      r.status === 'Blocked'
                        ? 'bg-error-container text-on-error-container'
                        : r.status === 'Restricted'
                          ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant'
                          : 'bg-secondary-container text-on-secondary-container'
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
                <p className="text-xs text-outline mt-0.5">{r.state}</p>
                <p className="mt-1.5 text-xs text-on-surface-variant font-caption">{r.diversion}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  )
}
