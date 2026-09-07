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
              <CartesianGrid stroke="rgba(156,204,101,0.12)" />
              <XAxis dataKey="name" stroke="#9bb3a6" fontSize={10} interval={0} angle={-25} textAnchor="end" height={70} />
              <YAxis stroke="#9bb3a6" />
              <Tooltip contentStyle={{ background: '#0c1f1a', border: '1px solid #2a5a4c' }} />
              <Bar dataKey="rain" fill="#5aa7b8" name="Rain mm" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {weather.map((w) => (
          <article key={`${w.state}-${w.district}`} className="rounded-xl border border-lime/15 bg-panel p-4">
            <p className="text-xs text-muted">{w.state}</p>
            <h2 className="text-lg font-semibold">{w.district}</h2>
            <p className="mt-1 text-sm text-lime">{w.condition}</p>
            <p className="mt-2 font-mono text-xs">
              {w.rainfallMm.toFixed(0)} mm · RH {w.humidity.toFixed(0)}% · wind {w.windKph.toFixed(0)} km/h
            </p>
            <p className="mt-2 text-sm text-warn">{w.warning}</p>
          </article>
        ))}
      </div>
    </div>
  )
}
