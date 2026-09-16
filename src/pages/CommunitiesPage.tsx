import { useState } from 'react'
import {
  CheckCircle2,
  Home,
  MapPin,
  Navigation,
  RefreshCw,
  Route,
  Search,
  ShieldAlert,
  Users,
  AlertTriangle,
} from 'lucide-react'
import { ChipToggle, Panel, SkeletonCard } from '../components/ui'
import { useStore } from '../store/useStore'

export function CommunitiesPage() {
  const { villages, roads } = useStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedState, setSelectedState] = useState<string>('All')
  const [selectedStatus, setSelectedStatus] = useState<string>('All')
  const [isLoadingSim, setIsLoadingSim] = useState(false)

  // Unique states
  const states = ['All', ...Array.from(new Set([...villages.map((v) => v.state), ...roads.map((r) => r.state)]))]

  // Filtered villages
  const filteredVillages = villages.filter((v) => {
    const matchesSearch =
      !searchQuery.trim() ||
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.shelter.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesState = selectedState === 'All' || v.state === selectedState
    const matchesStatus = selectedStatus === 'All' || v.connectivity === selectedStatus

    return matchesSearch && matchesState && matchesStatus
  })

  // Filtered roads
  const filteredRoads = roads.filter((r) => {
    const matchesSearch =
      !searchQuery.trim() ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.diversion.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.state.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesState = selectedState === 'All' || r.state === selectedState
    const matchesStatus = selectedStatus === 'All' || r.status === selectedStatus

    return matchesSearch && matchesState && matchesStatus
  })

  function handleSimulateRefresh() {
    setIsLoadingSim(true)
    setTimeout(() => setIsLoadingSim(false), 750)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <p className="font-label-caps text-primary text-[10.5px] font-bold">Last-Mile Field Picture</p>
          </div>
          <h1 className="font-display-2xl text-2xl sm:text-3xl text-on-surface font-extrabold tracking-tight">
            Villages, Shelters &amp; Strategic Corridors
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
            Real-time evacuation relief centers, VDMC village committees, and arterial highway passability status.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSimulateRefresh}
          className="flex items-center gap-1.5 self-start sm:self-auto px-3.5 py-2 rounded-xl border border-surface-container-high bg-surface-container-lowest text-xs font-semibold text-on-surface hover:bg-surface-container-high transition-all shadow-2xs cursor-pointer"
        >
          <RefreshCw size={13} className={`text-primary ${isLoadingSim ? 'animate-spin' : ''}`} />
          <span>Refresh Feeds</span>
        </button>
      </div>

      {/* Modern Filter Chips & Search Bar */}
      <div className="flex flex-col gap-3 p-3.5 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container-high/60 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <Search size={15} className="text-outline shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search villages, relief shelters, highways, diversions..."
              className="w-full bg-transparent text-xs sm:text-sm text-on-surface outline-none placeholder:text-outline"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-outline hover:text-on-surface text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Status Chip Filter */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-label-caps text-outline hidden md:inline mr-1">Status:</span>
            <ChipToggle
              label="All"
              active={selectedStatus === 'All'}
              onClick={() => setSelectedStatus('All')}
            />
            <ChipToggle
              label="Open"
              active={selectedStatus === 'Open'}
              onClick={() => setSelectedStatus('Open')}
              icon={<CheckCircle2 size={13} className="text-secondary" />}
            />
            <ChipToggle
              label="Restricted"
              active={selectedStatus === 'Restricted'}
              onClick={() => setSelectedStatus('Restricted')}
              icon={<AlertTriangle size={13} className="text-tertiary" />}
            />
            <ChipToggle
              label="Blocked"
              active={selectedStatus === 'Blocked'}
              onClick={() => setSelectedStatus('Blocked')}
              icon={<ShieldAlert size={13} className="text-error" />}
            />
          </div>
        </div>

        {/* State Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-surface-container-high/60">
          <span className="text-[10.5px] font-label-caps text-outline mr-1">Region / State:</span>
          {states.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setSelectedState(st)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedState === st
                  ? 'bg-primary-fixed text-on-primary-fixed border border-primary/30 shadow-2xs font-bold'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high border border-transparent'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Two Column Grid: Village Disaster Committees & Strategic Corridors */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column: Villages & Shelters */}
        <Panel
          title={`Village Disaster Committees (${filteredVillages.length})`}
          icon={Users}
        >
          {isLoadingSim ? (
            <SkeletonCard count={3} />
          ) : filteredVillages.length === 0 ? (
            <div className="text-center py-10 text-outline text-xs">
              No village records match the selected filters.
            </div>
          ) : (
            <ul className="space-y-3">
              {filteredVillages.map((v) => (
                <li
                  key={v.id}
                  className="rounded-2xl border border-surface-container-high bg-surface-container-low/60 p-4 text-sm shadow-xs transition-all duration-300 hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5 group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-base text-on-surface group-hover:text-primary transition-colors">
                          {v.name}
                        </p>
                        <span className="px-2 py-0.5 rounded-md bg-surface-container-high font-mono text-[10px] text-outline font-semibold">
                          {v.state}
                        </span>
                      </div>
                      <p className="text-xs text-outline mt-0.5 flex items-center gap-1.5">
                        <MapPin size={12} className="text-primary" />
                        <span>{v.district} District &bull; {v.households} households &bull; Vernacular: {v.language}</span>
                      </p>
                    </div>

                    <span
                      className={`font-label-caps text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-2xs ${
                        v.connectivity === 'Blocked'
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                          : v.connectivity === 'Restricted'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      }`}
                    >
                      {v.connectivity}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2 p-2.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/60">
                    <div className="flex items-center gap-2 text-xs">
                      <Home size={14} className="text-secondary shrink-0" />
                      <span className="text-on-surface-variant font-medium">
                        Relief Shelter: <strong className="text-on-surface font-bold">{v.shelter}</strong>
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-secondary font-bold px-2 py-0.5 rounded bg-secondary-container/50">
                      SAFE ZONE
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Right Column: Strategic Corridors */}
        <Panel
          title={`Strategic Highway Corridors (${filteredRoads.length})`}
          icon={Route}
        >
          {isLoadingSim ? (
            <SkeletonCard count={3} />
          ) : filteredRoads.length === 0 ? (
            <div className="text-center py-10 text-outline text-xs">
              No road corridors match the selected filters.
            </div>
          ) : (
            <ul className="space-y-3">
              {filteredRoads.map((r) => (
                <li
                  key={r.id}
                  className="rounded-2xl border border-surface-container-high bg-surface-container-low/60 p-4 text-sm shadow-xs transition-all duration-300 hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5 group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-base text-on-surface group-hover:text-primary transition-colors">
                        {r.name}
                      </p>
                      <p className="text-xs text-outline mt-0.5 flex items-center gap-1.5">
                        <MapPin size={12} className="text-primary" />
                        <span>State: <strong className="text-on-surface font-semibold">{r.state}</strong></span>
                      </p>
                    </div>

                    <span
                      className={`font-label-caps text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-2xs ${
                        r.status === 'Blocked'
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                          : r.status === 'Restricted'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>

                  <div className="mt-3 flex items-start gap-2 p-2.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/60 text-xs">
                    <Navigation size={14} className="text-primary shrink-0 mt-0.5" />
                    <p className="text-on-surface-variant leading-relaxed">
                      <strong className="text-on-surface">Traffic Guidance / Diversion:</strong> {r.diversion}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  )
}
