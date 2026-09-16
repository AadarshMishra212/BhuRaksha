import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  CloudRain,
  Zap,
} from 'lucide-react'
import { Panel } from '../components/ui'
import { useStore } from '../store/useStore'

export function WeatherPage() {
  const { weather } = useStore()
  const data = weather.map((w) => ({
    name: w.district.slice(0, 12),
    rain: Number(w.rainfallMm.toFixed(0)),
  }))

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <p className="font-label-caps text-primary text-[10.5px] font-bold">IMD Doppler Radar Linkage</p>
        </div>
        <h1 className="font-display-2xl text-2xl sm:text-3xl text-on-surface font-extrabold tracking-tight">
          Weather-Linked Landslide Hazard Precipitation
        </h1>
        <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
          District micro-cells inherit live rainfall from IMD Doppler radar nowcasts and GPM IMERG satellite precipitation.
        </p>
      </div>

      {/* 24h Rainfall Chart */}
      <Panel title="24-Hour Accumulated Rainfall by Hill District (mm)" icon={CloudRain}>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <defs>
                <linearGradient id="weatherBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f95716" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#ff7844" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(100, 116, 139, 0.15)" strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                fontSize={11}
                interval={0}
                angle={-25}
                textAnchor="end"
                height={60}
              />
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
              <Bar dataKey="rain" fill="url(#weatherBarGrad)" name="24h Rain mm" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      {/* Weather Micro-Station Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {weather.map((w) => (
          <article
            key={`${w.state}-${w.district}`}
            className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-5 shadow-xs transition-all duration-300 hover:shadow-lg hover:border-primary/40 hover:-translate-y-0.5 group"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-label-caps text-[9.5px] text-outline font-bold">{w.state}</span>
                <h2 className="font-headline-lg text-base font-bold text-on-surface mt-0.5 group-hover:text-primary transition-colors">
                  {w.district}
                </h2>
              </div>
              <div className="w-8 h-8 rounded-xl bg-primary-fixed/60 text-primary flex items-center justify-center">
                <CloudRain size={16} />
              </div>
            </div>

            <p className="mt-2 text-xs font-bold text-secondary flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
              <span>{w.condition}</span>
            </p>

            <div className="mt-3 grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-surface-container-low border border-surface-container-high/60 text-center">
              <div>
                <span className="text-[9.5px] text-outline font-caption block">Rainfall</span>
                <span className="font-mono text-xs font-bold text-primary">{w.rainfallMm.toFixed(0)} mm</span>
              </div>
              <div>
                <span className="text-[9.5px] text-outline font-caption block">Humidity</span>
                <span className="font-mono text-xs font-bold text-on-surface">{w.humidity.toFixed(0)}%</span>
              </div>
              <div>
                <span className="text-[9.5px] text-outline font-caption block">Wind Speed</span>
                <span className="font-mono text-xs font-bold text-on-surface">{w.windKph.toFixed(0)} km/h</span>
              </div>
            </div>

            <div className="mt-3 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
              <Zap size={13} className="shrink-0 text-amber-600 dark:text-amber-400" />
              <span className="truncate">{w.warning}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
