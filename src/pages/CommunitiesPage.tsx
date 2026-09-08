import { Panel } from '../components/ui'
import { useStore } from '../store/AppStore'

export function CommunitiesPage() {
  const { villages, roads } = useStore()
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] tracking-[0.22em] text-emerald-700 uppercase font-semibold">Last-mile picture</p>
        <h1 className="text-2xl font-bold text-gray-900">Villages, shelters and corridor status</h1>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Village disaster committees">
          <ul className="space-y-3">
            {villages.map((v) => (
              <li key={v.id} className="rounded-lg border border-gray-200 bg-gray-50/70 p-3.5 text-sm shadow-xs">
                <div className="flex justify-between gap-2">
                  <p className="font-bold text-gray-900">{v.name}</p>
                  <span
                    className={`font-bold text-xs px-2 py-0.5 rounded uppercase ${
                      v.connectivity === 'Blocked'
                        ? 'bg-rose-100 text-rose-800'
                        : v.connectivity === 'Restricted'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {v.connectivity}
                  </span>
                </div>
                <p className="text-xs text-muted mt-0.5">
                  {v.district}, {v.state} · {v.households} households · {v.language}
                </p>
                <p className="mt-1.5 text-xs text-gray-800 font-medium">Relief shelter: <span className="text-emerald-800 font-semibold">{v.shelter}</span></p>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Strategic roads">
          <ul className="space-y-3">
            {roads.map((r) => (
              <li key={r.id} className="rounded-lg border border-gray-200 bg-gray-50/70 p-3.5 text-sm shadow-xs">
                <div className="flex justify-between gap-2">
                  <p className="font-bold text-gray-900">{r.name}</p>
                  <span className={`font-semibold ${r.status === 'Blocked' ? 'text-alert' : r.status === 'Restricted' ? 'text-amber-700' : 'text-emerald-700'}`}>{r.status}</span>
                </div>
                <p className="text-xs text-muted mt-0.5">{r.state}</p>
                <p className="mt-1.5 text-xs text-gray-800">{r.diversion}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  )
}
