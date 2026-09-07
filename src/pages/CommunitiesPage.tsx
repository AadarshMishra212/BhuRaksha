import { Panel } from '../components/ui'
import { roadClass } from '../lib/format'
import { useStore } from '../store/AppStore'

export function CommunitiesPage() {
  const { villages, roads } = useStore()
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] tracking-[0.22em] text-lime uppercase">Last-mile picture</p>
        <h1 className="text-2xl font-semibold">Villages, shelters and corridor status</h1>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Village disaster committees">
          <ul className="space-y-3">
            {villages.map((v) => (
              <li key={v.id} className="rounded-lg border border-white/5 p-3 text-sm">
                <div className="flex justify-between gap-2">
                  <p className="font-semibold">{v.name}</p>
                  <span className={roadClass(v.connectivity)}>{v.connectivity}</span>
                </div>
                <p className="text-xs text-muted">
                  {v.district}, {v.state} · {v.households} households · {v.language}
                </p>
                <p className="mt-1">Relief shelter: {v.shelter}</p>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Strategic roads">
          <ul className="space-y-3">
            {roads.map((r) => (
              <li key={r.id} className="rounded-lg border border-white/5 p-3 text-sm">
                <div className="flex justify-between gap-2">
                  <p className="font-semibold">{r.name}</p>
                  <span className={roadClass(r.status)}>{r.status}</span>
                </div>
                <p className="text-xs text-muted">{r.state}</p>
                <p className="mt-1">{r.diversion}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  )
}
