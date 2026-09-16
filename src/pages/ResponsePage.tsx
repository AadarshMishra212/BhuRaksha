import { useState } from 'react'
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Truck,
  Users,
} from 'lucide-react'
import { ChipToggle, Pill } from '../components/ui'
import { useStore } from '../store/useStore'

export function ResponsePage() {
  const { actions, zones, dispatchAction } = useStore()
  const [selectedStatus, setSelectedStatus] = useState<string>('All')

  const filteredActions = actions.filter((a) => {
    return selectedStatus === 'All' || a.status.toLowerCase() === selectedStatus.toLowerCase()
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <p className="font-label-caps text-primary text-[10.5px] font-bold">Emergency Prioritisation</p>
          </div>
          <h1 className="font-display-2xl text-2xl sm:text-3xl text-on-surface font-extrabold tracking-tight">
            NDRF / SDRF Tasking &amp; Incident Dispatch Board
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
            Ranked by live PINN failure scores, isolated population headcount, and corridor criticality.
          </p>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-xs">
        <span className="text-[11px] font-label-caps text-outline ml-1 mr-1">Dispatch Pipeline:</span>
        <ChipToggle
          label="All Tasks"
          active={selectedStatus === 'All'}
          onClick={() => setSelectedStatus('All')}
          count={actions.length}
        />
        <ChipToggle
          label="Queued"
          active={selectedStatus === 'Queued'}
          onClick={() => setSelectedStatus('Queued')}
          count={actions.filter((a) => a.status === 'Queued').length}
          icon={<Clock size={13} className="text-tertiary" />}
        />
        <ChipToggle
          label="Dispatched"
          active={selectedStatus === 'Dispatched'}
          onClick={() => setSelectedStatus('Dispatched')}
          count={actions.filter((a) => a.status === 'Dispatched').length}
          icon={<Truck size={13} className="text-primary" />}
        />
        <ChipToggle
          label="On Site"
          active={selectedStatus === 'On site'}
          onClick={() => setSelectedStatus('On site')}
          count={actions.filter((a) => a.status === 'On site').length}
          icon={<Activity size={13} className="text-secondary" />}
        />
        <ChipToggle
          label="Contained"
          active={selectedStatus === 'Contained'}
          onClick={() => setSelectedStatus('Contained')}
          count={actions.filter((a) => a.status === 'Contained').length}
          icon={<CheckCircle2 size={13} className="text-secondary" />}
        />
      </div>

      {/* Action Cards Grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {filteredActions.map((a) => {
          const z = zones.find((x) => x.id === a.zoneId)
          if (!z) return null

          const statusBadgeClass =
            a.status === 'Contained'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : a.status === 'On site'
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                : a.status === 'Dispatched'
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                  : 'bg-surface-container-high text-on-surface-variant border-surface-container-highest'

          return (
            <article
              key={a.id}
              className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-5 shadow-xs transition-all duration-300 hover:shadow-lg hover:border-primary/40 hover:-translate-y-0.5 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-surface-container-high text-outline">
                      PRIORITY #{a.priority}
                    </span>
                    <h2 className="font-headline-lg text-base font-bold text-on-surface mt-1.5 group-hover:text-primary transition-colors">
                      {z.name}
                    </h2>
                    <p className="text-xs text-outline">{z.district}, {z.state}</p>
                  </div>
                  <Pill severity={z.severity} />
                </div>

                <div className="mt-3 p-3 rounded-xl bg-surface-container-low border border-surface-container-high/60">
                  <p className="text-xs sm:text-sm font-semibold text-on-surface flex items-center gap-2">
                    <ShieldAlert size={15} className="text-primary shrink-0" />
                    <span>{a.action}</span>
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-on-surface-variant">
                  <span className="flex items-center gap-1 text-on-surface font-semibold">
                    <Truck size={13} className="text-primary" /> {a.unit}
                  </span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1 font-mono font-bold text-primary">
                    <Clock size={13} /> ETA {a.etaMin} min
                  </span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1 text-outline">
                    <Users size={13} /> {z.populationAtRisk.toLocaleString('en-IN')} citizens
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between pt-3.5 border-t border-surface-container-high/70">
                <span className={`px-2.5 py-1 rounded-full font-label-caps text-[10px] font-bold border ${statusBadgeClass}`}>
                  {a.status}
                </span>

                <button
                  type="button"
                  onClick={() => dispatchAction(a.id)}
                  className="flex items-center gap-1.5 rounded-xl border border-surface-container-high bg-surface-container-low px-3.5 py-1.5 font-label-caps text-[10.5px] font-bold text-on-surface hover:bg-primary hover:text-on-primary hover:border-primary transition-all shadow-2xs cursor-pointer active:scale-95"
                >
                  <span>Advance Status</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
