import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Panel } from '../components/ui'
import { useStore } from '../store/useStore'

export function WeatherPage() {
  const { weather } = useStore()
  const data = weather.map((w) => ({
    name: w.district.slice(0, 12),
    rain: Number(w.rainfallMm.toFixed(0)),
  }))

  return (
    <div className="space-y-space-lg">
      <div>
        <p className="font-label-caps text-primary">IMD Radar Linkage</p>
        <h1 className="font-display-2xl text-on-surface">Weather-Linked Slope Risk</h1>
        <p className="font-body-base text-on-surface-variant text-xs sm:text-sm mt-0.5">
          District cells inherit live rainfall from the simulation bus — in production this binds IMD nowcast + GPM IMERG.
        </p>
      </div>

      <Panel title="24-Hour Accumulated Rainfall by District">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid stroke="#eaedff" strokeDasharray="3 3" />
              <XAxis dataKey="name" stroke="#707881" fontSize={10} interval={0} angle={-25} textAnchor="end" height={70} />
              <YAxis stroke="#707881" />
              <Tooltip
                contentStyle={{
                  background: '#ffffff',
                  border: '1px solid #dae2fd',
                  borderRadius: '8px',
                  color: '#131b2e',
                  boxShadow: '0 4px 12px rgba(19,27,46,0.08)',
                }}
              />
              <Bar dataKey="rain" fill="#006194" name="Rain mm" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <div className="grid gap-space-md md:grid-cols-2 xl:grid-cols-3">
        {weather.map((w) => (
          <article key={`${w.state}-${w.district}`} className="rounded-xl border border-surface-container-high bg-surface-container-lowest p-space-lg shadow-sm hover:shadow-md transition">
            <p className="font-label-caps text-outline">{w.state}</p>
            <h2 className="font-headline-lg text-on-surface mt-0.5">{w.district}</h2>
            <p className="mt-1 text-sm text-secondary font-medium">{w.condition}</p>
            <p className="mt-2 font-mono text-xs text-on-surface-variant">
              {w.rainfallMm.toFixed(0)} mm &bull; RH {w.humidity.toFixed(0)}% &bull; wind {w.windKph.toFixed(0)} km/h
            </p>
            <p className="mt-2 text-xs font-semibold text-tertiary">{w.warning}</p>
          </article>
        ))}
      </div>
    </div>
  )
}
