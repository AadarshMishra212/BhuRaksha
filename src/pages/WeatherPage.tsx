import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Panel } from '../components/ui'
import { useStore } from '../store/AppStore'

export function WeatherPage() {
  const { weather } = useStore()
  const data = weather.map((w) => ({
    name: w.district.slice(0, 12),
    rain: Number(w.rainfallMm.toFixed(0)),
  }))

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] tracking-[0.22em] text-lime uppercase">IMD linkage</p>
        <h1 className="text-2xl font-semibold">Weather-linked slope risk</h1>
        <p className="text-sm text-muted">
          District cells inherit live rainfall from the simulation bus — in production this binds IMD nowcast + GPM IMERG.
        </p>
      </div>
      <Panel title="24-hour accumulated rainfall by district">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={10} interval={0} angle={-25} textAnchor="end" height={70} />
              <YAxis stroke="#64748b" />
              <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#0f172a', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
              <Bar dataKey="rain" fill="#0284c7" name="Rain mm" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {weather.map((w) => (
          <article key={`${w.state}-${w.district}`} className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs hover:border-gray-300 transition">
            <p className="text-xs text-muted font-semibold uppercase">{w.state}</p>
            <h2 className="text-lg font-bold text-gray-900 mt-0.5">{w.district}</h2>
            <p className="mt-1 text-sm text-emerald-700 font-medium">{w.condition}</p>
            <p className="mt-2 font-mono text-xs text-gray-700">
              {w.rainfallMm.toFixed(0)} mm · RH {w.humidity.toFixed(0)}% · wind {w.windKph.toFixed(0)} km/h
            </p>
            <p className="mt-2 text-sm text-amber-700 font-semibold">{w.warning}</p>
          </article>
        ))}
      </div>
    </div>
  )
}
