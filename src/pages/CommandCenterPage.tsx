import { Link } from 'react-router-dom'
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
import { Kpi, Panel, Pill } from '../components/ui'
import { severityColor } from '../engine/riskModel'
import { fmtTime } from '../lib/format'
import { useStore } from '../store/useStore'

export function CommandCenterPage() {
  const { zones, alerts, roads, sensors, villages, actions, tick, live } = useStore()
  const critical = zones.filter((z) => z.severity === 'Critical').length
  const high = zones.filter((z) => z.severity === 'High').length
  const blocked = roads.filter((r) => r.status === 'Blocked').length
  const pop = zones.filter((z) => z.riskScore >= 56).reduce((s, z) => s + z.populationAtRisk, 0)
  const online = sensors.filter((s) => s.status === 'Online').length
  const chart = zones
    .slice()
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 8)
    .map((z) => ({ name: z.district.slice(0, 10), risk: Number(z.riskScore.toFixed(1)), rain: Number(z.rainfall24h.toFixed(0)) }))

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.24em] text-muted uppercase">Live common operating picture</p>
          <h1 className="text-2xl font-bold tracking-tight text-ink">NER Landslide Command Center</h1>
          <p className="text-sm text-muted/90">
            SEOC Operational Ingest #{tick} &bull; {live ? 'Telemetry Stream Active' : 'Telemetry Paused'} &bull; Fused AWS, soil moisture probes, GNSS displacement &amp; corridor intelligence
          </p>
        </div>
        <Link to="/gis" className="minim-button">
          Open Full GIS Operations
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Kpi label="Critical zones" value={String(critical)} hint={`${high} high-risk watch boxes`} tone="alert" />
        <Kpi label="People in watch" value={pop.toLocaleString('en-IN')} hint="Population inside High/Critical polygons" tone="warn" />
        <Kpi label="Corridors blocked" value={String(blocked)} hint={`${roads.length} strategic roads monitored`} tone="alert" />
        <Kpi label="Sensor health" value={`${online}/${sensors.length}`} hint="Rain, soil, GNSS, AWS, InSAR proxy" tone="info" />
        <Kpi label="Open warnings" value={String(alerts.filter((a) => !a.acknowledged).length)} hint="Unacknowledged control-room tickets" />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Risk heatmap — North Eastern Region" className="xl:col-span-2">
          <RiskMap height="h-[440px]" />
        </Panel>
        <Panel title="Priority watch list">
          <ul className="max-h-[440px] space-y-3 overflow-auto pr-1">
            {zones
              .slice()
              .sort((a, b) => b.riskScore - a.riskScore)
              .slice(0, 8)
              .map((z) => (
                <li key={z.id} className="rounded-lg border border-gray-200 bg-gray-50/70 p-3 shadow-xs hover:border-gray-300 transition">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{z.name}</p>
                      <p className="text-[11px] text-muted">
                        {z.district}, {z.state}
                      </p>
                    </div>
                    <Pill severity={z.severity} />
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded bg-gray-200">
                    <div className="h-full" style={{ width: `${z.riskScore}%`, background: severityColor(z.severity) }} />
                  </div>
                  <p className="mt-2 font-mono text-[11px] text-muted">
                    {z.riskScore.toFixed(1)} · {z.rainfall24h.toFixed(0)} mm · {z.soilMoisture.toFixed(0)}% soil
                  </p>
                </li>
              ))}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="District risk vs 24h rainfall">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#0f172a', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                <Area type="monotone" dataKey="risk" stroke="#e11d48" fill="#e11d4822" name="Risk score" />
                <Area type="monotone" dataKey="rain" stroke="#0284c7" fill="#0284c722" name="Rain mm" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Response queue">
          <ul className="space-y-2">
            {actions.slice(0, 5).map((a) => {
              const z = zones.find((x) => x.id === a.zoneId)
              return (
                <li key={a.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50/70 px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium text-gray-900">P{a.priority} · {z?.district}</p>
                    <p className="text-xs text-muted">{a.unit} · ETA {a.etaMin} min</p>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700">{a.status}</span>
                </li>
              )
            })}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Latest warnings">
          <ul className="space-y-2">
            {alerts.slice(0, 5).map((a) => (
              <li key={a.id} className="text-sm">
                <span className="font-mono text-[11px] text-muted">{fmtTime(a.time)}</span>
                <p>
                  {a.title} — {a.zoneName}
                </p>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Village connectivity snapshot">
          <ul className="space-y-2 text-sm">
            {villages.map((v) => (
              <li key={v.id} className="flex justify-between gap-2">
                <span>
                  {v.name}, {v.state}
                </span>
                <span className={v.connectivity === 'Blocked' ? 'text-alert' : v.connectivity === 'Restricted' ? 'text-warn' : 'text-lime'}>
                  {v.connectivity}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  )
}
