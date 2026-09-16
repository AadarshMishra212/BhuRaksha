import { useState } from 'react'
import {
  Battery,
  CheckCircle2,
  Radio,
  RefreshCw,
  Satellite,
  Search,
  ShieldAlert,
  Zap,
} from 'lucide-react'
import { ChipToggle, Panel, SkeletonTable } from '../components/ui'
import { useStore } from '../store/useStore'

export function SensorsPage() {
  const { sensors, zones } = useStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('All')
  const [selectedStatus, setSelectedStatus] = useState<string>('All')
  const [isLoadingSim, setIsLoadingSim] = useState(false)

  const online = sensors.filter((s) => s.status === 'Online').length
  const degraded = sensors.filter((s) => s.status === 'Degraded').length
  const offline = sensors.filter((s) => s.status === 'Offline').length

  const sensorTypes = ['All', ...Array.from(new Set(sensors.map((s) => s.type)))]

  const filteredSensors = sensors.filter((s) => {
    const z = zones.find((x) => x.id === s.zoneId)
    const matchesSearch =
      !searchQuery.trim() ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (z && z.district.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesType = selectedType === 'All' || s.type === selectedType
    const matchesStatus = selectedStatus === 'All' || s.status === selectedStatus

    return matchesSearch && matchesType && matchesStatus
  })

  function handleSimulateRefresh() {
    setIsLoadingSim(true)
    setTimeout(() => setIsLoadingSim(false), 750)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <p className="font-label-caps text-primary text-[10.5px] font-bold">IoT + Satellite Telemetry</p>
          </div>
          <h1 className="font-display-2xl text-2xl sm:text-3xl text-on-surface font-extrabold tracking-tight">
            Sensor Mesh &amp; Earth-Observation Proxies
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
            Real-time piezoelectric pore-water gauges, AWS rainfall grids, LoRa tiltmeters &amp; Sentinel-1 InSAR LOS proxies.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSimulateRefresh}
          className="flex items-center gap-1.5 self-start sm:self-auto px-3.5 py-2 rounded-xl border border-surface-container-high bg-surface-container-lowest text-xs font-semibold text-on-surface hover:bg-surface-container-high transition-all shadow-2xs cursor-pointer"
        >
          <RefreshCw size={13} className={`text-primary ${isLoadingSim ? 'animate-spin' : ''}`} />
          <span>Ping Sensor Mesh</span>
        </button>
      </div>

      {/* Top Status Badges / Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-surface-container-lowest border border-surface-container-high/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-label-caps text-outline font-bold">Online &amp; Broadcasting</span>
            <p className="font-mono-telemetry text-2xl font-extrabold text-secondary mt-0.5">{online}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-secondary-container/60 text-secondary flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface-container-lowest border border-surface-container-high/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-label-caps text-outline font-bold">Degraded (Monsoon Attenuation)</span>
            <p className="font-mono-telemetry text-2xl font-extrabold text-tertiary mt-0.5">{degraded}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-tertiary-container/60 text-tertiary flex items-center justify-center">
            <Radio size={20} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface-container-lowest border border-surface-container-high/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-label-caps text-outline font-bold">Offline / Maintenance</span>
            <p className="font-mono-telemetry text-2xl font-extrabold text-error mt-0.5">{offline}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-error-container/60 text-error flex items-center justify-center">
            <ShieldAlert size={20} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 p-3.5 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container-high/60 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <Search size={15} className="text-outline shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sensor asset name, type, district..."
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

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-label-caps text-outline mr-1">Status:</span>
            <ChipToggle
              label="All"
              active={selectedStatus === 'All'}
              onClick={() => setSelectedStatus('All')}
            />
            <ChipToggle
              label="Online"
              active={selectedStatus === 'Online'}
              onClick={() => setSelectedStatus('Online')}
              count={online}
              icon={<CheckCircle2 size={13} className="text-secondary" />}
            />
            <ChipToggle
              label="Degraded"
              active={selectedStatus === 'Degraded'}
              onClick={() => setSelectedStatus('Degraded')}
              count={degraded}
              icon={<Radio size={13} className="text-tertiary" />}
            />
            <ChipToggle
              label="Offline"
              active={selectedStatus === 'Offline'}
              onClick={() => setSelectedStatus('Offline')}
              count={offline}
              icon={<ShieldAlert size={13} className="text-error" />}
            />
          </div>
        </div>

        {/* Sensor Modality / Type Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-surface-container-high/60">
          <span className="text-[10.5px] font-label-caps text-outline mr-1">Modality:</span>
          {sensorTypes.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setSelectedType(t)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedType === t
                  ? 'bg-primary-fixed text-on-primary-fixed border border-primary/30 shadow-2xs font-bold'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high border border-transparent'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Main Sensor Data Table */}
      {isLoadingSim ? (
        <SkeletonTable rows={6} cols={6} />
      ) : (
        <div className="overflow-auto rounded-2xl border border-surface-container-high/80 bg-surface-container-lowest shadow-sm">
          <table className="min-w-full text-left text-xs sm:text-sm">
            <thead className="bg-surface-container-low font-label-caps text-[10px] text-outline border-b border-surface-container-high">
              <tr>
                <th className="px-4 py-3.5 font-bold">Asset ID / Node</th>
                <th className="px-3 py-3.5 font-bold">Modality / Type</th>
                <th className="px-3 py-3.5 font-bold">Watchbox Zone</th>
                <th className="px-3 py-3.5 font-bold">Live Reading</th>
                <th className="px-3 py-3.5 font-bold">Health Status</th>
                <th className="px-4 py-3.5 text-right font-bold">Battery %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high/60 font-body-base text-on-surface">
              {filteredSensors.map((s) => {
                const z = zones.find((x) => x.id === s.zoneId)
                return (
                  <tr key={s.id} className="hover:bg-surface-container-low/70 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-on-surface flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      <span>{s.name}</span>
                    </td>
                    <td className="px-3 py-3.5 text-on-surface-variant font-medium text-xs">
                      <span className="px-2 py-1 rounded-md bg-surface-container-high font-mono text-[11px]">
                        {s.type}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-outline text-xs">{z?.district || 'Regional Grid'}</td>
                    <td className="px-3 py-3.5 font-mono text-xs font-bold text-primary">
                      {s.value.toFixed(1)} {s.unit}
                    </td>
                    <td className="px-3 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-label-caps text-[9.5px] font-bold border shadow-2xs ${
                          s.status === 'Offline'
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                            : s.status === 'Degraded'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                              : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            s.status === 'Offline'
                              ? 'bg-rose-500'
                              : s.status === 'Degraded'
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                          }`}
                        />
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-xs font-bold text-on-surface-variant">
                      <div className="flex items-center justify-end gap-1.5">
                        <Battery size={14} className={s.battery > 50 ? 'text-secondary' : 'text-primary'} />
                        <span>{s.battery.toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Telemetry Architecture Cards */}
      <Panel title="Telemetry Ingestion Architecture & Earth-Observation Feeds" icon={Satellite}>
        <ul className="grid gap-4 text-xs sm:text-sm md:grid-cols-3">
          <li className="rounded-2xl border border-surface-container-high bg-surface-container-low/60 p-4 shadow-2xs">
            <p className="font-headline-lg text-xs font-bold text-primary flex items-center gap-1.5">
              <Zap size={14} /> IMD Doppler AWS &amp; GPM Grids
            </p>
            <p className="text-on-surface-variant text-xs mt-1.5 leading-relaxed">
              15-minute rainfall grids downscaled to hill watchboxes with antecedent 72h precipitation accumulation.
            </p>
          </li>
          <li className="rounded-2xl border border-surface-container-high bg-surface-container-low/60 p-4 shadow-2xs">
            <p className="font-headline-lg text-xs font-bold text-secondary flex items-center gap-1.5">
              <Radio size={14} /> Soil Moisture &amp; Piezometer Mesh
            </p>
            <p className="text-on-surface-variant text-xs mt-1.5 leading-relaxed">
              LoRa / VSAT mountain backhaul with store-and-forward edge cache for rugged terrain &amp; 2G pockets.
            </p>
          </li>
          <li className="rounded-2xl border border-surface-container-high bg-surface-container-low/60 p-4 shadow-2xs">
            <p className="font-headline-lg text-xs font-bold text-tertiary flex items-center gap-1.5">
              <Satellite size={14} /> Sentinel-1 InSAR Surface Velocity
            </p>
            <p className="text-on-surface-variant text-xs mt-1.5 leading-relaxed">
              12-day Line-of-Sight deformation velocity calibrated against infinite slope shear stress models.
            </p>
          </li>
        </ul>
      </Panel>
    </div>
  )
}
