import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  BrainCircuit,
  Building,
  CheckCircle2,
  Compass,
  Layers,
  MapPin,
  Radio,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  Sparkles,
  Zap,
} from 'lucide-react'
import { RiskMap } from '../components/RiskMap'
import { ChipToggle, Pill, SkeletonCard, SkeletonTable } from '../components/ui'
import { severityColor } from '../engine/riskModel'
import { useStore } from '../store/useStore'

export function CommandCenterPage() {
  const { zones, roads, sensors, tick, live, selectZone } = useStore()
  const navigate = useNavigate()
  const [selectedSector, setSelectedSector] = useState(zones[0]?.name || 'NH-10 Teesta Corridor')
  const [filterSeverity, setFilterSeverity] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoadingSim, setIsLoadingSim] = useState(false)

  const critical = zones.filter((z) => z.severity === 'Critical').length
  const high = zones.filter((z) => z.severity === 'High').length
  const blocked = roads.filter((r) => r.status === 'Blocked').length
  const pop = zones.filter((z) => z.riskScore >= 56).reduce((s, z) => s + z.populationAtRisk, 0)
  const online = sensors.filter((s) => s.status === 'Online').length

  const chart = zones
    .slice()
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 8)
    .map((z) => ({
      name: z.district.slice(0, 10),
      risk: Number(z.riskScore.toFixed(1)),
      rain: Number(z.rainfall24h.toFixed(0)),
    }))

  const recentTransactions = [
    {
      id: 'PRC-9948-AX',
      type: 'Slope Stabilization Order',
      time: 'Today, 14:22 IST',
      status: 'Verified',
      statusClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
      zoneId: zones[0]?.id,
    },
    {
      id: 'PRC-8821-B2',
      type: 'InSAR Polygon Settlement Sync',
      time: 'Today, 11:05 IST',
      status: 'Pending Review',
      statusClass: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800',
      zoneId: zones[1]?.id,
    },
    {
      id: 'PRC-3310-C9',
      type: 'Critical Pore-Pressure Spike',
      time: 'Yesterday, 18:40 IST',
      status: 'Flagged',
      statusClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
      zoneId: zones[2]?.id,
    },
    {
      id: 'PRC-1102-ZF',
      type: 'Safe Evacuation Clearance',
      time: 'Yesterday, 09:15 IST',
      status: 'Verified',
      statusClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
      zoneId: zones[3]?.id,
    },
  ]

  // Filtered zones based on search and chip toggles
  const filteredZones = zones.filter((z) => {
    const matchesSearch =
      !searchQuery.trim() ||
      z.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      z.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      z.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
      z.corridor.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesSeverity =
      filterSeverity === 'All' || z.severity.toLowerCase() === filterSeverity.toLowerCase()

    return matchesSearch && matchesSeverity
  })

  function handleSimulateRefresh() {
    setIsLoadingSim(true)
    setTimeout(() => setIsLoadingSim(false), 900)
  }

  return (
    <div className="flex flex-col w-full space-y-6 animate-fade-in">
      
      {/* Dynamic Hero Section with Gradient Mesh Background & Interactive Filter Bar */}
      <section className="relative overflow-hidden rounded-3xl border border-surface-container-high/80 bg-gradient-to-br from-surface-container-lowest via-surface-container-low to-surface-container-lowest p-6 sm:p-8 shadow-sm transition-all">
        {/* Subtle Ambient Glow Blobs */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-tertiary/10 blur-3xl" />
        
        <div className="relative z-10 flex flex-col gap-6">
          {/* Top Pill / Badge row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-fixed text-on-primary-fixed border border-primary/20 shadow-2xs">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                State Emergency Operations Center (SEOC-NER)
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-xs text-outline font-mono">
                <Radio size={13} className="text-secondary" />
                Telemetry Stream #{tick}
              </span>
            </div>

            {/* Quick Action Link Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSimulateRefresh}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-surface-container-high bg-surface-container-lowest text-xs font-semibold text-on-surface hover:bg-surface-container-high transition-all shadow-2xs cursor-pointer"
                title="Refresh and simulate loading data"
              >
                <RefreshCw size={13} className={`text-primary ${isLoadingSim ? 'animate-spin' : ''}`} />
                <span>Simulate Shimmer</span>
              </button>
              <Link
                to="/ai"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-surface-container-lowest border border-surface-container-high text-on-surface text-xs font-semibold hover:bg-surface-container-high transition-all shadow-2xs"
              >
                <BrainCircuit size={14} className="text-primary" />
                <span>BHOOMI Engine</span>
              </Link>
              <Link
                to="/gis"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-all shadow-sm"
              >
                <Compass size={14} />
                <span>Geospatial Map</span>
              </Link>
            </div>
          </div>

          {/* Main Hero Header Title */}
          <div>
            <h1 className="font-display-2xl text-2xl sm:text-3xl lg:text-4xl text-on-surface font-extrabold tracking-tight">
              AI-Powered Landslide Early Warning &amp; Decision Command
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-on-surface-variant max-w-3xl leading-relaxed">
              Fused InSAR ground displacement, Doppler radar bulletins, piezometric pore-water pressures, and automated village relief routing for all 8 North Eastern states.
            </p>
          </div>

          {/* Front-and-Center Search and Interactive Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-2.5 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-xs">
            {/* Search Input Box */}
            <div className="relative flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container-high/60 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <Search size={16} className="text-outline shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search watchboxes, highways, districts (e.g., Gangtok, NH-10, Aizawl)..."
                className="w-full bg-transparent text-xs sm:text-sm text-on-surface outline-none placeholder:text-outline"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-outline hover:text-on-surface p-0.5 rounded-md hover:bg-surface-container-high"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              )}
            </div>

            {/* Filter Pill / Chip Toggles with Icons */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-label-caps text-outline hidden lg:inline mr-1">
                Filter Severity:
              </span>
              <ChipToggle
                label="All Zones"
                active={filterSeverity === 'All'}
                onClick={() => setFilterSeverity('All')}
                count={zones.length}
              />
              <ChipToggle
                label="Critical"
                active={filterSeverity === 'Critical'}
                onClick={() => setFilterSeverity('Critical')}
                count={critical}
                icon={<AlertCircle size={13} className="text-error" />}
              />
              <ChipToggle
                label="High"
                active={filterSeverity === 'High'}
                onClick={() => setFilterSeverity('High')}
                count={high}
                icon={<AlertTriangle size={13} className="text-primary" />}
              />
              <ChipToggle
                label="Moderate"
                active={filterSeverity === 'Moderate'}
                onClick={() => setFilterSeverity('Moderate')}
                count={zones.filter((z) => z.severity === 'Moderate').length}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Top Telemetry KPI Cards with Soft Multi-Layer Shadows & Hover Lift */}
      {isLoadingSim ? (
        <SkeletonCard count={4} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Protected Terrain */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-surface-container-high/80 flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-surface-container-highest group">
            <div className="flex items-center justify-between mb-3">
              <span className="font-label-caps text-[10px] text-outline tracking-wider font-semibold">
                Protected Terrain
              </span>
              <div className="w-8 h-8 rounded-xl bg-primary-fixed/60 text-primary flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-2xs">
                <Shield size={16} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono-telemetry text-2xl font-extrabold text-on-surface">12,450</span>
              <span className="font-body-medium text-xs text-outline">Sq Km</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-secondary font-medium">
              <CheckCircle2 size={13} />
              <span>+2.4% slope reinforcement vs last year</span>
            </div>
          </div>

          {/* KPI 2: Critical Watchboxes */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-surface-container-high/80 flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-surface-container-highest group">
            <div className="flex items-center justify-between mb-3">
              <span className="font-label-caps text-[10px] text-outline tracking-wider font-semibold">
                Critical Watchboxes
              </span>
              <div className="w-8 h-8 rounded-xl bg-error-container/60 text-error flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-2xs">
                <AlertTriangle size={16} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono-telemetry text-2xl font-extrabold text-error">{critical || 14}</span>
              <span className="font-body-medium text-xs text-error">Critical Slippage</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-outline font-medium">
              <Activity size={13} className="text-primary" />
              <span>{high} high-risk sectors under active radar</span>
            </div>
          </div>

          {/* KPI 3: Arterial Corridors */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-surface-container-high/80 flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-surface-container-highest group">
            <div className="flex items-center justify-between mb-3">
              <span className="font-label-caps text-[10px] text-outline tracking-wider font-semibold">
                Corridor Severance
              </span>
              <div className="w-8 h-8 rounded-xl bg-tertiary-container/60 text-tertiary flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-2xs">
                <Layers size={16} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono-telemetry text-2xl font-extrabold text-tertiary">{blocked}</span>
              <span className="font-body-medium text-xs text-tertiary">Blocked Arterials</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-outline font-medium">
              <Building size={13} className="text-tertiary" />
              <span>{pop.toLocaleString('en-IN')} citizens in watch envelope</span>
            </div>
          </div>

          {/* KPI 4: Telemetry Mesh Health */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-surface-container-high/80 flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-surface-container-highest group">
            <div className="flex items-center justify-between mb-3">
              <span className="font-label-caps text-[10px] text-outline tracking-wider font-semibold">
                Sensor Network Health
              </span>
              <div className="w-8 h-8 rounded-xl bg-secondary-container/60 text-secondary flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-2xs">
                <Zap size={16} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono-telemetry text-2xl font-extrabold text-secondary">{online}/{sensors.length}</span>
              <span className="font-body-medium text-xs text-secondary">Optimal Ingest</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-secondary font-medium">
              <CheckCircle2 size={13} />
              <span>InSAR &amp; Rain gauges fully synced</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Interactive Map & Command Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Map Overview */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container-high/80 overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 bg-surface-container-low/80 border-b border-surface-container-high/60 backdrop-blur-xs">
            <div className="flex items-center gap-2">
              <MapPin size={17} className="text-primary" />
              <span className="font-headline-lg text-sm font-bold text-on-surface">
                Geospatial Hazard Map &amp; Corridor Overlay
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-outline bg-surface-container px-2.5 py-1 rounded-lg border border-surface-container-high/50">
                LAT: 26.2006° N | LON: 92.9376° E
              </span>
            </div>
          </div>

          {/* Map Display Container */}
          <div className="relative w-full h-[450px]">
            <RiskMap height="h-[450px]" />

            {/* Floating HUD Status Overlay */}
            <div className="pointer-events-none absolute top-4 left-4 bg-inverse-surface/90 backdrop-blur-md text-inverse-on-surface px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs z-10 shadow-lg border border-white/10">
              <span className={`w-2 h-2 rounded-full ${live ? 'bg-emerald-400 animate-pulse' : 'bg-outline'}`} />
              <span className="font-label-caps text-[9.5px] font-bold tracking-wider">
                LIVE TELEMETRY: {live ? 'ACTIVE INGEST' : 'PAUSED'}
              </span>
            </div>

            <div className="absolute bottom-4 right-4 bg-surface-container-lowest/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-surface-container-high flex flex-wrap items-center gap-3 z-10">
              <div className="flex flex-col">
                <span className="font-label-caps text-[9px] text-outline font-bold">Selected Sector</span>
                <span className="font-headline-lg text-xs font-bold text-on-surface">{selectedSector}</span>
              </div>
              <button
                type="button"
                onClick={() => navigate('/gis')}
                className="px-3 py-1.5 bg-primary text-on-primary font-label-caps text-[10px] font-bold rounded-xl hover:bg-primary-container transition-all shadow-xs cursor-pointer"
              >
                Inspect Sector
              </button>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Command Desk Quick Actions */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container-high/80 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={17} className="text-primary" />
              <span className="font-headline-lg text-sm font-bold text-on-surface">Command Desk Operations</span>
            </div>
            <p className="text-xs text-on-surface-variant mb-4 leading-relaxed">
              Execute rapid administrative actions, trigger satellite boundary validation, or dispatch automated relief teams.
            </p>

            {/* Action Cards */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => navigate('/ai')}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-low hover:bg-surface-container-high/80 transition-all text-on-surface group border border-surface-container-high/60 cursor-pointer shadow-2xs hover:shadow-sm hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-on-primary transition-all">
                    <BrainCircuit size={17} />
                  </div>
                  <div className="text-left">
                    <div className="font-headline-lg text-xs font-bold">BHOOMI PINN Simulation</div>
                    <div className="text-[11px] text-outline">Compute corridor closure hours</div>
                  </div>
                </div>
                <ArrowUpRight size={15} className="text-outline group-hover:text-primary transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/gis')}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-low hover:bg-surface-container-high/80 transition-all text-on-surface group border border-surface-container-high/60 cursor-pointer shadow-2xs hover:shadow-sm hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center group-hover:bg-secondary group-hover:text-on-secondary transition-all">
                    <Compass size={17} />
                  </div>
                  <div className="text-left">
                    <div className="font-headline-lg text-xs font-bold">Safe Evacuation Route</div>
                    <div className="text-[11px] text-outline">Geodesic GPS routing to shelters</div>
                  </div>
                </div>
                <ArrowUpRight size={15} className="text-outline group-hover:text-secondary transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/response')}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-low hover:bg-surface-container-high/80 transition-all text-on-surface group border border-surface-container-high/60 cursor-pointer shadow-2xs hover:shadow-sm hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-tertiary/10 text-tertiary flex items-center justify-center group-hover:bg-tertiary group-hover:text-on-tertiary transition-all">
                    <ShieldAlert size={17} />
                  </div>
                  <div className="text-left">
                    <div className="font-headline-lg text-xs font-bold">Dispatch SDRF Mobile Column</div>
                    <div className="text-[11px] text-outline">Heavy earthmovers &amp; relief kits</div>
                  </div>
                </div>
                <ArrowUpRight size={15} className="text-outline group-hover:text-tertiary transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3.5 border-t border-surface-container-high/70 flex items-center justify-between text-xs">
            <span className="text-outline">Secure Gateway: 256-Bit SSL</span>
            <span className="flex items-center gap-1.5 text-secondary font-label-caps text-[10px] font-bold">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              ONLINE
            </span>
          </div>
        </div>
      </div>

      {/* Transaction Logs & Priority Watch Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction Logs (2 Cols) */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container-high/80 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity size={17} className="text-primary" />
              <span className="font-headline-lg text-sm font-bold text-on-surface">
                Recent Landslide Audit &amp; Protocol Transactions
              </span>
            </div>
            <Link to="/alerts" className="text-primary font-label-caps text-[10.5px] font-bold hover:underline">
              View All Logs
            </Link>
          </div>

          {isLoadingSim ? (
            <SkeletonTable rows={4} cols={4} />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-surface-container-high/60">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-surface-container-low border-b border-surface-container-high text-outline font-label-caps text-[10px]">
                    <th className="px-4 py-3 font-semibold">Incident / Watch ID</th>
                    <th className="px-4 py-3 font-semibold">Action Type</th>
                    <th className="px-4 py-3 font-semibold">Timestamp</th>
                    <th className="px-4 py-3 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high/60 text-on-surface">
                  {recentTransactions.map((tx) => (
                    <tr
                      key={tx.id}
                      onClick={() => {
                        if (tx.zoneId) {
                          selectZone(tx.zoneId)
                          setSelectedSector(zones.find((z) => z.id === tx.zoneId)?.name || tx.id)
                        }
                      }}
                      className="hover:bg-surface-container-low/70 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 font-mono font-bold text-primary">{tx.id}</td>
                      <td className="px-4 py-3 font-semibold text-on-surface">{tx.type}</td>
                      <td className="px-4 py-3 text-outline">{tx.time}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`px-2.5 py-0.5 rounded-full font-label-caps text-[9.5px] font-bold ${tx.statusClass}`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Priority Watch List (1 Col) */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container-high/80 p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={17} className="text-primary" />
              <span className="font-headline-lg text-sm font-bold text-on-surface">
                Filtered Hazard Watchboxes ({filteredZones.length})
              </span>
            </div>
          </div>

          <ul className="space-y-2.5 overflow-y-auto max-h-72 pr-1">
            {filteredZones.slice(0, 6).map((z) => (
              <li
                key={z.id}
                onClick={() => {
                  selectZone(z.id)
                  setSelectedSector(z.name)
                }}
                className="rounded-2xl border border-surface-container-high/70 bg-surface-container-low/60 p-3 transition-all hover:border-primary hover:shadow-sm hover:-translate-y-0.5 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-on-surface">{z.name}</p>
                    <p className="text-[10.5px] text-outline">
                      {z.district}, {z.state}
                    </p>
                  </div>
                  <Pill severity={z.severity} />
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-container-high">
                  <div className="h-full rounded-full" style={{ width: `${z.riskScore}%`, background: severityColor(z.severity) }} />
                </div>
                <div className="mt-1.5 flex items-center justify-between font-mono text-[10px] text-outline">
                  <span>Score {z.riskScore.toFixed(1)}</span>
                  <span>{z.rainfall24h.toFixed(0)} mm rain</span>
                  <span>{z.soilMoisture.toFixed(0)}% soil</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Analytics & Radar Profile Section */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container-high/80 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Activity size={17} className="text-primary" />
            <span className="font-headline-lg text-sm font-bold text-on-surface">
              District Risk Index vs 24h Cumulative Precipitation (mm)
            </span>
          </div>
          <span className="font-label-caps text-[10px] text-outline font-bold bg-surface-container px-2.5 py-1 rounded-lg">
            Physics-Informed SHAP Model
          </span>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chart}>
              <defs>
                <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f95716" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#f95716" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="rainGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(100, 116, 139, 0.15)" strokeDasharray="3 3" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: 'var(--theme-surface-container-lowest)',
                  borderColor: 'var(--theme-surface-container-high)',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
                  fontSize: '12px',
                }}
              />
              <Area type="monotone" dataKey="risk" stroke="#f95716" strokeWidth={2} fill="url(#riskGrad)" name="Risk Score (0-100)" />
              <Area type="monotone" dataKey="rain" stroke="#4f46e5" strokeWidth={2} fill="url(#rainGrad)" name="24h Rain (mm)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  )
}
