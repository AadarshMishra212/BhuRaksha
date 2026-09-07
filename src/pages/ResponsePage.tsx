import { Pill } from '../components/ui'
import { useStore } from '../store/AppStore'

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
            <article key={a.id} className="rounded-xl border border-lime/15 bg-panel p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-muted">Priority {a.priority}</p>
                  <h2 className="text-lg font-semibold">{z.name}</h2>
                </div>
                <Pill severity={z.severity} />
              </div>
              <p className="mt-2 text-sm">{a.action}</p>
              <p className="mt-2 text-xs text-muted">
                {a.unit} · ETA {a.etaMin} min · {z.populationAtRisk.toLocaleString('en-IN')} people · {z.corridor}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span className="font-mono text-xs text-lime">{a.status}</span>
                <button
                  type="button"
                  onClick={() => dispatchAction(a.id)}
                  className="rounded border border-lime/30 px-3 py-1 text-xs text-lime hover:bg-lime/10"
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
