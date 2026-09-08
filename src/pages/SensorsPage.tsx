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
      <div className="overflow-auto rounded-xl border border-gray-200 bg-white shadow-xs">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-700 font-semibold border-b border-gray-200">
            <tr>
              <th className="px-4 py-3">Asset</th>
              <th className="px-3 py-3">Type</th>
              <th className="px-3 py-3">Zone</th>
              <th className="px-3 py-3">Reading</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Battery</th>
            </tr>
          </thead>
          <tbody>
            {sensors.map((s) => {
              const z = zones.find((x) => x.id === s.zoneId)
              return (
                <tr key={s.id} className="border-t border-gray-100 hover:bg-gray-50/60 transition">
                  <td className="px-4 py-3 font-semibold text-gray-900">{s.name}</td>
                  <td className="px-3 py-3 text-gray-700">{s.type}</td>
                  <td className="px-3 py-3 text-muted">{z?.district}</td>
                  <td className="px-3 py-3 font-mono text-xs font-semibold text-gray-900">
                    {s.value.toFixed(1)} {s.unit}
                  </td>
                  <td className={`px-3 py-3 font-semibold ${s.status === 'Offline' ? 'text-alert' : s.status === 'Degraded' ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {s.status}
                  </td>
                  <td className="px-3 py-3 font-mono text-xs text-gray-700">{s.battery.toFixed(0)}%</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <Panel title="Telemetry Ingestion & Satellite InSAR Feeds">
        <ul className="grid gap-3 text-sm md:grid-cols-3">
          <li className="rounded-lg border border-gray-200 bg-gray-50/70 p-3.5 shadow-xs">
            <p className="font-bold text-emerald-800">IMD AWS / GPM</p>
            <p className="text-gray-600 mt-1">15-min rainfall grids downscaled to watch boxes.</p>
          </li>
          <li className="rounded-lg border border-gray-200 bg-gray-50/70 p-3.5 shadow-xs">
            <p className="font-bold text-emerald-800">Soil &amp; GNSS mesh</p>
            <p className="text-gray-600 mt-1">LoRa / VSAT backhaul with store-and-forward for 2G pockets.</p>
          </li>
          <li className="rounded-lg border border-gray-200 bg-gray-50/70 p-3.5 shadow-xs">
            <p className="font-bold text-emerald-800">Sentinel-1 InSAR</p>
            <p className="text-gray-600 mt-1">12-day LOS velocity as displacement proxy until COSMO-SkyMed tasking.</p>
          </li>
        </ul>
      </Panel>
    </div>
  )
}
