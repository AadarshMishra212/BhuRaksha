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
import { RiskMap } from '../components/RiskMap'
import { Pill } from '../components/ui'
import { severityColor } from '../engine/riskModel'
import { useStore } from '../store/useStore'

export function CommandCenterPage() {
  const { zones, roads, sensors, tick, live, selectZone } = useStore()
  const navigate = useNavigate()
  const [selectedSector, setSelectedSector] = useState(zones[0]?.name || 'NH-10 Teesta Corridor')

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
      statusClass: 'bg-secondary-container text-on-secondary-container',
      zoneId: zones[0]?.id,
    },
    {
      id: 'PRC-8821-B2',
      type: 'InSAR Polygon Settlement Sync',
      time: 'Today, 11:05 IST',
      status: 'Pending Review',
      statusClass: 'bg-surface-container-high text-on-surface-variant',
      zoneId: zones[1]?.id,
    },
    {
      id: 'PRC-3310-C9',
      type: 'Critical Pore-Pressure Spike',
      time: 'Yesterday, 18:40 IST',
      status: 'Flagged',
      statusClass: 'bg-error-container text-on-error-container',
      zoneId: zones[2]?.id,
    },
    {
      id: 'PRC-1102-ZF',
      type: 'Safe Evacuation Clearance',
      time: 'Yesterday, 09:15 IST',
      status: 'Verified',
      statusClass: 'bg-secondary-container text-on-secondary-container',
      zoneId: zones[3]?.id,
    },
  ]

  return (
    <div className="flex flex-col w-full space-y-space-xl">
      {/* Top Header & Context Bar */}
      <div className="flex flex-wrap items-end justify-between gap-space-md">
        <div>
          <div className="flex items-center gap-space-sm mb-1">
            <span className="font-label-caps text-outline">State Emergency Operations Center</span>
            <span className="h-1 w-1 rounded-full bg-outline" />
            <span className="font-caption text-secondary font-medium">Telemetry Stream Ingest #{tick}</span>
          </div>
          <h1 className="font-display-2xl text-on-surface font-bold tracking-tight">NER Landslide Command Center</h1>
          <p className="font-body-base text-on-surface-variant mt-0.5">
            Fused InSAR telemetry, AWS precipitation gauges, Doppler radar bulletins &amp; multi-agency dispatch.
          </p>
        </div>
        <div className="flex items-center gap-space-sm">
          <Link
            to="/ai"
            className="flex items-center gap-1.5 px-space-md py-space-sm bg-surface-container-lowest border border-surface-container-high text-on-surface font-label-caps rounded-lg hover:bg-surface-container-high transition-colors shadow-xs"
          >
            <span className="material-symbols-outlined text-primary text-[18px]">psychology</span>
            <span>BHOOMI Engine</span>
          </Link>
          <Link
            to="/gis"
            className="flex items-center gap-1.5 px-space-md py-space-sm bg-primary text-on-primary font-label-caps rounded-lg hover:bg-primary-container transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">map</span>
            <span>Geospatial Operations</span>
          </Link>
        </div>
      </div>

      {/* Top Command Telemetry Strip / Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        {/* Metric Tile 1: Monitored Land */}
        <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container-high/70 flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:border-surface-container-highest">
          <div className="flex items-center justify-between mb-space-sm">
            <span className="font-label-caps text-outline">Protected Terrain</span>
            <span className="material-symbols-outlined text-primary text-[20px]">shield</span>
          </div>
          <div className="flex items-baseline gap-space-sm">
            <span className="font-mono-telemetry text-on-surface">12,450</span>
            <span className="font-body-medium text-outline">Sq Km</span>
          </div>
          <div className="mt-space-sm flex items-center gap-space-xs text-[12px] text-secondary font-medium">
            <span className="material-symbols-outlined text-[14px]">trending_up</span>
            <span>+2.4% from last monsoon</span>
          </div>
        </div>

        {/* Metric Tile 2: Active Critical Zones */}
        <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container-high/70 flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:border-surface-container-highest">
          <div className="flex items-center justify-between mb-space-sm">
            <span className="font-label-caps text-outline">Critical Watchboxes</span>
            <span className="material-symbols-outlined text-error text-[20px]">warning</span>
          </div>
          <div className="flex items-baseline gap-space-sm">
            <span className="font-mono-telemetry text-on-surface">{critical || 14}</span>
            <span className="font-body-medium text-error">Critical</span>
          </div>
          <div className="mt-space-sm flex items-center gap-space-xs text-[12px] text-outline font-medium">
            <span className="material-symbols-outlined text-[14px]">schedule</span>
            <span>{high} high-risk zones active</span>
          </div>
        </div>

        {/* Metric Tile 3: Blocked Corridors */}
        <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container-high/70 flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:border-surface-container-highest">
          <div className="flex items-center justify-between mb-space-sm">
            <span className="font-label-caps text-outline">Corridor Severance</span>
            <span className="material-symbols-outlined text-tertiary text-[20px]">pending_actions</span>
          </div>
          <div className="flex items-baseline gap-space-sm">
            <span className="font-mono-telemetry text-on-surface">{blocked}</span>
            <span className="font-body-medium text-tertiary">Blocked Arterials</span>
          </div>
          <div className="mt-space-sm flex items-center gap-space-xs text-[12px] text-outline font-medium">
            <span className="material-symbols-outlined text-[14px]">satellite</span>
            <span>{pop.toLocaleString('en-IN')} citizens in watch</span>
          </div>
        </div>

        {/* Metric Tile 4: Sensor Network Health */}
        <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container-high/70 flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:border-surface-container-highest">
          <div className="flex items-center justify-between mb-space-sm">
            <span className="font-label-caps text-outline">Telemetry Telemetry</span>
            <span className="material-symbols-outlined text-secondary text-[20px]">verified</span>
          </div>
          <div className="flex items-baseline gap-space-sm">
            <span className="font-mono-telemetry text-on-surface">{online}/{sensors.length}</span>
            <span className="font-body-medium text-secondary">Optimal</span>
          </div>
          <div className="mt-space-sm flex items-center gap-space-xs text-[12px] text-secondary font-medium">
            <span className="material-symbols-outlined text-[14px]">check_circle</span>
            <span>InSAR &amp; Rain gauges synced</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Map Section & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-lg">
        {/* Left 2 Cols: Interactive Map Overview Card */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-high/80 overflow-hidden flex flex-col">
          {/* Card Header */}
          <div className="px-space-lg py-space-md flex flex-wrap items-center justify-between gap-space-sm bg-surface-container-low border-b border-surface-container-high/60">
            <div className="flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-primary text-[20px]">map</span>
              <span className="font-headline-lg text-on-surface">Geospatial Mapping Overview</span>
            </div>
            <div className="flex items-center gap-space-sm">
              <span className="font-mono text-xs text-outline bg-surface-container px-space-sm py-1 rounded">
                LAT: 26.2006° N | LON: 92.9376° E
              </span>
            </div>
          </div>

          {/* Map Display Container */}
          <div className="relative w-full h-[450px]">
            <RiskMap height="h-[450px]" />

            {/* Floating HUD Overlays */}
            <div className="pointer-events-none absolute top-space-md left-space-md bg-inverse-surface/85 backdrop-blur-md text-inverse-on-surface p-space-sm rounded-lg flex items-center gap-space-sm text-caption z-10 shadow-md">
              <span className={`w-2 h-2 rounded-full ${live ? 'bg-secondary animate-pulse' : 'bg-outline'}`} />
              <span className="font-label-caps text-[10px] tracking-wider">
                LIVE TELEMETRY: {live ? 'ACTIVE INGEST' : 'PAUSED'}
              </span>
            </div>

            <div className="absolute bottom-space-md right-space-md bg-surface-container-lowest/95 backdrop-blur-md p-space-md rounded-lg shadow-xl border border-surface-container-high flex flex-wrap items-center gap-space-md z-10">
              <div className="flex flex-col">
                <span className="font-label-caps text-[10px] text-outline">Selected Sector</span>
                <span className="font-headline-lg text-[14px] text-on-surface">{selectedSector}</span>
              </div>
              <button
                type="button"
                onClick={() => navigate('/gis')}
                className="px-space-md py-1.5 bg-primary text-on-primary font-label-caps text-[10px] rounded-lg hover:bg-primary-container transition-colors shadow-xs"
              >
                Inspect Parcel
              </button>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Quick Actions & Cadastral Audit Triggers */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-high/80 p-space-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-space-sm mb-space-md">
              <span className="material-symbols-outlined text-primary text-[20px]">terminal</span>
              <span className="font-headline-lg text-on-surface">Command Operations</span>
            </div>
            <p className="text-body-base text-on-surface-variant mb-space-lg text-xs leading-relaxed">
              Execute rapid administrative actions, trigger instant satellite boundary validation, or dispatch automated drone reconnaissance teams.
            </p>

            {/* Action Buttons */}
            <div className="space-y-space-sm">
              <button
                type="button"
                onClick={() => navigate('/ai')}
                className="w-full flex items-center justify-between p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-all text-on-surface group border border-surface-container-high/40 cursor-pointer"
              >
                <div className="flex items-center gap-space-md">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-on-primary transition-all">
                    <span className="material-symbols-outlined text-[18px]">verified_user</span>
                  </div>
                  <div className="text-left">
                    <div className="font-headline-lg text-[14px]">Cadastral Slope Audit</div>
                    <div className="text-caption text-outline">Run automated PINN failure model</div>
                  </div>
                </div>
                <span className="material-symbols-outlined text-outline text-[16px] group-hover:translate-x-0.5 transition-transform">
                  arrow_forward_ios
                </span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/gis')}
                className="w-full flex items-center justify-between p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-all text-on-surface group border border-surface-container-high/40 cursor-pointer"
              >
                <div className="flex items-center gap-space-md">
                  <div className="w-9 h-9 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center group-hover:bg-secondary group-hover:text-on-secondary transition-all">
                    <span className="material-symbols-outlined text-[18px]">polyline</span>
                  </div>
                  <div className="text-left">
                    <div className="font-headline-lg text-[14px]">Boundary Verification</div>
                    <div className="text-caption text-outline">Compare InSAR polygon drift</div>
                  </div>
                </div>
                <span className="material-symbols-outlined text-outline text-[16px] group-hover:translate-x-0.5 transition-transform">
                  arrow_forward_ios
                </span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/response')}
                className="w-full flex items-center justify-between p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-all text-on-surface group border border-surface-container-high/40 cursor-pointer"
              >
                <div className="flex items-center gap-space-md">
                  <div className="w-9 h-9 rounded-lg bg-tertiary/10 text-tertiary flex items-center justify-center group-hover:bg-tertiary group-hover:text-on-tertiary transition-all">
                    <span className="material-symbols-outlined text-[18px]">emergency</span>
                  </div>
                  <div className="text-left">
                    <div className="font-headline-lg text-[14px]">Dispatch Inspection Squad</div>
                    <div className="text-caption text-outline">Deploy regional SDRF mobile column</div>
                  </div>
                </div>
                <span className="material-symbols-outlined text-outline text-[16px] group-hover:translate-x-0.5 transition-transform">
                  arrow_forward_ios
                </span>
              </button>
            </div>
          </div>

          {/* System Status Footer inside Card */}
          <div className="mt-space-lg pt-space-md border-t border-surface-container-high/70 flex items-center justify-between">
            <span className="text-caption text-outline">Secure Gateway: 256-Bit SSL</span>
            <span className="flex items-center gap-1.5 text-secondary font-label-caps text-[10px]">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              ONLINE
            </span>
          </div>
        </div>
      </div>

      {/* Recent Land Transaction Logs & Secure Verification Badges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-lg">
        {/* Transaction Logs (2 Cols) */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-high/80 p-space-lg">
          <div className="flex items-center justify-between mb-space-md">
            <div className="flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-primary text-[20px]">history</span>
              <span className="font-headline-lg text-on-surface">Recent Land &amp; Hazard Transaction Logs</span>
            </div>
            <Link to="/alerts" className="text-primary font-label-caps text-[10px] hover:underline">
              View All Logs
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-container-high text-outline font-label-caps text-[10px]">
                  <th className="pb-space-sm">Parcel ID</th>
                  <th className="pb-space-sm">Action Type</th>
                  <th className="pb-space-sm">Timestamp</th>
                  <th className="pb-space-sm text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container text-body-base text-on-surface">
                {recentTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    onClick={() => {
                      if (tx.zoneId) {
                        selectZone(tx.zoneId)
                        setSelectedSector(zones.find((z) => z.id === tx.zoneId)?.name || tx.id)
                      }
                    }}
                    className="hover:bg-surface-container-low transition-colors cursor-pointer"
                  >
                    <td className="py-space-md font-mono text-xs text-primary font-semibold">{tx.id}</td>
                    <td className="py-space-md font-medium text-xs text-on-surface">{tx.type}</td>
                    <td className="py-space-md text-outline text-xs">{tx.time}</td>
                    <td className="py-space-md text-right">
                      <span className={`px-space-sm py-0.5 rounded font-label-caps text-[10px] font-semibold ${tx.statusClass}`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Secure Verification Badges & System Health (1 Col) */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-high/80 p-space-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-space-sm mb-space-md">
              <span className="material-symbols-outlined text-primary text-[20px]">verified</span>
              <span className="font-headline-lg text-on-surface">Secure Verification Badges</span>
            </div>
            <p className="text-body-base text-on-surface-variant text-xs mb-space-md leading-relaxed">
              Multi-factor cryptographic proofs and blockchain-backed land ledger status indicators.
            </p>

            <div className="space-y-space-sm">
              <div className="p-space-md rounded-xl bg-surface-container-low flex items-center gap-space-md border border-surface-container-high/40">
                <div className="w-9 h-9 rounded-full bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">lock</span>
                </div>
                <div>
                  <div className="font-headline-lg text-[13px] text-on-surface">Zero-Knowledge Proof Ledger</div>
                  <div className="text-caption text-secondary font-medium text-[11px]">Cryptographically Sealed</div>
                </div>
              </div>

              <div className="p-space-md rounded-xl bg-surface-container-low flex items-center gap-space-md border border-surface-container-high/40">
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">satellite_alt</span>
                </div>
                <div>
                  <div className="font-headline-lg text-[13px] text-on-surface">InSAR Satellite Sync</div>
                  <div className="text-caption text-primary font-medium text-[11px]">Real-time Orbit Connected</div>
                </div>
              </div>

              <div className="p-space-md rounded-xl bg-surface-container-low flex items-center gap-space-md border border-surface-container-high/40">
                <div className="w-9 h-9 rounded-full bg-tertiary/10 text-tertiary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">fingerprint</span>
                </div>
                <div>
                  <div className="font-headline-lg text-[13px] text-on-surface">Biometric Inspector Signoff</div>
                  <div className="text-caption text-tertiary font-medium text-[11px]">Authorized Personnel Only</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-space-lg pt-space-md border-t border-surface-container-high/70 text-center">
            <span className="font-mono text-[10px] text-outline">BhuRaksha Defense OS v4.2.1-RELEASE</span>
          </div>
        </div>
      </div>

      {/* Analytics & Priority Watch Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-lg">
        {/* District Risk Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-high/80 p-space-lg">
          <div className="flex items-center justify-between mb-space-md">
            <div className="flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-primary text-[20px]">analytics</span>
              <span className="font-headline-lg text-on-surface">District Risk Index vs 24h Rainfall</span>
            </div>
            <span className="font-label-caps text-[10px] text-outline">SHAP Calibrated</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart}>
                <CartesianGrid stroke="#eaedff" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#707881" fontSize={11} />
                <YAxis stroke="#707881" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: '#ffffff',
                    border: '1px solid #dae2fd',
                    borderRadius: '8px',
                    color: '#131b2e',
                    boxShadow: '0 4px 12px rgba(19,27,46,0.08)',
                  }}
                />
                <Area type="monotone" dataKey="risk" stroke="#ba1a1a" fill="#ba1a1a20" name="Risk score" />
                <Area type="monotone" dataKey="rain" stroke="#006194" fill="#00619420" name="Rain mm" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Watch List (1 Col) */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-high/80 p-space-lg flex flex-col">
          <div className="flex items-center justify-between mb-space-md">
            <div className="flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-primary text-[20px]">list_alt</span>
              <span className="font-headline-lg text-on-surface">Priority Watchboxes</span>
            </div>
          </div>

          <ul className="space-y-2 overflow-y-auto max-h-64 pr-1">
            {zones
              .slice()
              .sort((a, b) => b.riskScore - a.riskScore)
              .slice(0, 5)
              .map((z) => (
                <li
                  key={z.id}
                  onClick={() => {
                    selectZone(z.id)
                    setSelectedSector(z.name)
                  }}
                  className="rounded-lg border border-surface-container-high/60 bg-surface-container-low p-2.5 transition hover:border-primary/50 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-on-surface">{z.name}</p>
                      <p className="text-[10px] text-outline font-caption">
                        {z.district}, {z.state}
                      </p>
                    </div>
                    <Pill severity={z.severity} />
                  </div>
                  <div className="mt-2 h-1 overflow-hidden rounded bg-surface-container-high">
                    <div className="h-full" style={{ width: `${z.riskScore}%`, background: severityColor(z.severity) }} />
                  </div>
                  <p className="mt-1.5 font-mono text-[10px] text-outline">
                    Score {z.riskScore.toFixed(1)} &bull; {z.rainfall24h.toFixed(0)} mm rain &bull; {z.soilMoisture.toFixed(0)}% soil
                  </p>
                </li>
              ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
