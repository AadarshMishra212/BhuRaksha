import { Pill } from '../components/ui'
import { useStore } from '../store/useStore'

export function ResponsePage() {
  const { actions, zones, dispatchAction } = useStore()

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] tracking-[0.22em] text-lime uppercase">Emergency prioritisation</p>
        <h1 className="text-2xl font-semibold">NDRF / SDRF tasking board</h1>
        <p className="text-sm text-muted">
          Ranked by live model score, population and corridor criticality. Advance each card from queued → dispatched → on site → contained.
        </p>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {actions.map((a) => {
          const z = zones.find((x) => x.id === a.zoneId)
          if (!z) return null
          return (
            <article key={a.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs hover:border-gray-300 transition">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-muted font-semibold uppercase">Priority {a.priority}</p>
                  <h2 className="text-lg font-bold text-gray-900 mt-0.5">{z.name}</h2>
                </div>
                <Pill severity={z.severity} />
              </div>
              <p className="mt-2 text-sm text-gray-800 font-medium">{a.action}</p>
              <p className="mt-2 text-xs text-muted">
                {a.unit} · ETA {a.etaMin} min · {z.populationAtRisk.toLocaleString('en-IN')} people · {z.corridor}
              </p>
              <div className="mt-3 flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="font-mono text-xs font-bold text-emerald-700">{a.status}</span>
                <button
                  type="button"
                  onClick={() => dispatchAction(a.id)}
                  className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-100 hover:border-gray-300 transition cursor-pointer"
                >
                  Advance status
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
