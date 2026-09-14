import { Panel } from '../components/ui'
import { useStore } from '../store/useStore'

export function SensorsPage() {
  const { sensors, zones } = useStore()
  const online = sensors.filter((s) => s.status === 'Online').length
  const degraded = sensors.filter((s) => s.status === 'Degraded').length
  const offline = sensors.filter((s) => s.status === 'Offline').length

  return (
    <div className="space-y-space-lg">
      <div>
        <p className="font-label-caps text-primary">IoT + Satellite Telemetry</p>
        <h1 className="font-display-2xl text-on-surface">Sensor Mesh &amp; Earth-Observation Proxies</h1>
        <p className="font-body-base text-on-surface-variant text-xs sm:text-sm mt-0.5">
          {online} online &bull; {degraded} degraded (intense rain) &bull; {offline} offline. InSAR proxies stand in for Sentinel-1 LOS displacement.
        </p>
      </div>

      <div className="overflow-auto rounded-xl border border-surface-container-high bg-surface-container-lowest shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-surface-container-low font-label-caps text-[10px] text-outline border-b border-surface-container-high">
            <tr>
              <th className="px-4 py-3">Asset</th>
              <th className="px-3 py-3">Type</th>
              <th className="px-3 py-3">Zone</th>
              <th className="px-3 py-3">Reading</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3 text-right">Battery</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-high/60 font-body-base text-on-surface">
            {sensors.map((s) => {
              const z = zones.find((x) => x.id === s.zoneId)
              return (
                <tr key={s.id} className="hover:bg-surface-container-low transition">
                  <td className="px-4 py-3 font-semibold text-on-surface">{s.name}</td>
                  <td className="px-3 py-3 text-on-surface-variant text-xs">{s.type}</td>
                  <td className="px-3 py-3 text-outline text-xs">{z?.district}</td>
                  <td className="px-3 py-3 font-mono text-xs font-semibold text-primary">
                    {s.value.toFixed(1)} {s.unit}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded font-label-caps text-[10px] font-semibold ${
                        s.status === 'Offline'
                          ? 'bg-error-container text-on-error-container'
                          : s.status === 'Degraded'
                            ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant'
                            : 'bg-secondary-container text-on-secondary-container'
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-mono text-xs text-on-surface-variant text-right">{s.battery.toFixed(0)}%</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Panel title="Telemetry Ingestion & Satellite InSAR Feeds">
        <ul className="grid gap-space-md text-sm md:grid-cols-3">
          <li className="rounded-lg border border-surface-container-high bg-surface-container-low p-3.5 shadow-xs">
            <p className="font-headline-lg text-xs font-bold text-primary">IMD AWS / GPM</p>
            <p className="text-on-surface-variant text-xs mt-1 leading-relaxed">15-min rainfall grids downscaled to watch boxes.</p>
          </li>
          <li className="rounded-lg border border-surface-container-high bg-surface-container-low p-3.5 shadow-xs">
            <p className="font-headline-lg text-xs font-bold text-secondary">Soil &amp; GNSS Mesh</p>
            <p className="text-on-surface-variant text-xs mt-1 leading-relaxed">LoRa / VSAT backhaul with store-and-forward for 2G pockets.</p>
          </li>
          <li className="rounded-lg border border-surface-container-high bg-surface-container-low p-3.5 shadow-xs">
            <p className="font-headline-lg text-xs font-bold text-tertiary">Sentinel-1 InSAR</p>
            <p className="text-on-surface-variant text-xs mt-1 leading-relaxed">12-day LOS velocity as displacement proxy until COSMO-SkyMed tasking.</p>
          </li>
        </ul>
      </Panel>
    </div>
  )
}
