import { Panel } from '../components/ui'
import { useStore } from '../store/AppStore'

export function SensorsPage() {
  const { sensors, zones } = useStore()
  const online = sensors.filter((s) => s.status === 'Online').length
  const degraded = sensors.filter((s) => s.status === 'Degraded').length
  const offline = sensors.filter((s) => s.status === 'Offline').length

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] tracking-[0.22em] text-lime uppercase">IoT + satellite ingest</p>
        <h1 className="text-2xl font-semibold">Sensor mesh &amp; earth-observation proxies</h1>
        <p className="text-sm text-muted">
          {online} online · {degraded} degraded (intense rain) · {offline} offline. InSAR proxies stand in for Sentinel-1 LOS displacement.
        </p>
      </div>
      <div className="overflow-auto rounded-xl border border-lime/15">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-panel text-[11px] uppercase tracking-wide text-muted">
            <tr>
              <th className="px-3 py-2">Asset</th>
              <th>Type</th>
              <th>Zone</th>
              <th>Reading</th>
              <th>Status</th>
              <th>Battery</th>
            </tr>
          </thead>
          <tbody>
            {sensors.map((s) => {
              const z = zones.find((x) => x.id === s.zoneId)
              return (
                <tr key={s.id} className="border-t border-white/5">
                  <td className="px-3 py-2 font-medium">{s.name}</td>
                  <td>{s.type}</td>
                  <td className="text-muted">{z?.district}</td>
                  <td className="font-mono text-xs">
                    {s.value.toFixed(1)} {s.unit}
                  </td>
                  <td className={s.status === 'Offline' ? 'text-alert' : s.status === 'Degraded' ? 'text-warn' : 'text-lime'}>
                    {s.status}
                  </td>
                  <td className="font-mono text-xs">{s.battery.toFixed(0)}%</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <Panel title="Telemetry Ingestion & Satellite InSAR Feeds">
        <ul className="grid gap-3 text-sm md:grid-cols-3">
          <li className="rounded-lg border border-white/5 p-3">
            <p className="font-semibold text-lime">IMD AWS / GPM</p>
            <p className="text-muted">15-min rainfall grids downscaled to watch boxes.</p>
          </li>
          <li className="rounded-lg border border-white/5 p-3">
            <p className="font-semibold text-lime">Soil &amp; GNSS mesh</p>
            <p className="text-muted">LoRa / VSAT backhaul with store-and-forward for 2G pockets.</p>
          </li>
          <li className="rounded-lg border border-white/5 p-3">
            <p className="font-semibold text-lime">Sentinel-1 InSAR</p>
            <p className="text-muted">12-day LOS velocity as displacement proxy until COSMO-SkyMed tasking.</p>
          </li>
        </ul>
      </Panel>
    </div>
  )
}
