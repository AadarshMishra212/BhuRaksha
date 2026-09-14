import { Pill } from '../components/ui'
import { useStore } from '../store/useStore'

export function ResponsePage() {
  const { actions, zones, dispatchAction } = useStore()

  return (
    <div className="space-y-space-lg">
      <div>
        <p className="font-label-caps text-primary">Emergency Prioritisation</p>
        <h1 className="font-display-2xl text-on-surface">NDRF / SDRF Tasking Board</h1>
        <p className="font-body-base text-on-surface-variant text-xs sm:text-sm mt-0.5">
          Ranked by live model score, population, and corridor criticality. Advance each card from queued &rarr; dispatched &rarr; on site &rarr; contained.
        </p>
      </div>

      <div className="grid gap-space-md lg:grid-cols-2">
        {actions.map((a) => {
          const z = zones.find((x) => x.id === a.zoneId)
          if (!z) return null
          return (
            <article key={a.id} className="rounded-xl border border-surface-container-high bg-surface-container-lowest p-space-lg shadow-sm hover:shadow-md transition">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-label-caps text-outline">Priority {a.priority}</p>
                  <h2 className="font-headline-lg text-on-surface mt-0.5">{z.name}</h2>
                </div>
                <Pill severity={z.severity} />
              </div>
              <p className="mt-2 text-sm text-on-surface font-medium">{a.action}</p>
              <p className="mt-2 text-xs text-on-surface-variant">
                {a.unit} &bull; ETA {a.etaMin} min &bull; {z.populationAtRisk.toLocaleString('en-IN')} people &bull; {z.corridor}
              </p>
              <div className="mt-3 flex items-center justify-between pt-2 border-t border-surface-container-high">
                <span className="font-mono text-xs font-bold text-secondary">{a.status}</span>
                <button
                  type="button"
                  onClick={() => dispatchAction(a.id)}
                  className="rounded-lg border border-surface-container-high bg-surface-container-low px-3 py-1.5 font-label-caps text-[10px] text-on-surface hover:bg-surface-container-high transition cursor-pointer"
                >
                  Advance Status
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
