import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Panel, Pill } from '../components/ui'
import { useStore } from '../store/AppStore'

export function AiPage() {
  const { zones, selectedZone, selectZone } = useStore()
  const zone = selectedZone ?? zones[0]
  if (!zone) return null
  const explain = zone.explain.map((e) => ({
    feature: e.feature.replace(' (IMD / AWS)', ''),
    contribution: Number((e.contribution * 100).toFixed(1)),
  }))
  const forecast = zone.forecast6h.map((v, i) => ({ hour: `+${i + 1}h`, score: Number(v.toFixed(1)) }))

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] tracking-[0.22em] text-lime uppercase">Explainable nowcast</p>
        <h1 className="text-2xl font-semibold">Gradient-boosted slope failure engine</h1>
        <p className="max-w-3xl text-sm text-muted">
          Operational multi-parameter landslide risk engine fusing high-resolution IMD rainfall grids, AWS intensity, GPM precipitation, antecedent soil moisture, digital elevation slope gradients, Sentinel-1 InSAR surface displacement, and historical landslide inventory. Contributions below reflect SHAP explainability shares for verifiable command decisions.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {zones
          .slice()
          .sort((a, b) => b.riskScore - a.riskScore)
          .map((z) => (
            <button
              key={z.id}
              type="button"
              onClick={() => selectZone(z.id)}
              className={`rounded-full border px-3 py-1 text-xs ${z.id === zone.id ? 'border-lime bg-lime/15 text-lime' : 'border-white/10 text-muted'}`}
            >
              {z.district}
            </button>
          ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Model output" className="lg:col-span-1">
          <p className="font-mono text-5xl font-semibold text-lime">{zone.riskScore.toFixed(1)}</p>
          <div className="mt-2">
            <Pill severity={zone.severity} />
          </div>
          <p className="mt-3 text-sm">{zone.name}</p>
          <p className="text-xs text-muted">{zone.lithology}</p>
          <p className="mt-4 text-xs leading-relaxed text-muted">
            If 6-hour nowcast stays above 76, recommend corridor closure and downslope evacuation. Model is conservative on cut slopes with soil moisture &gt; 70%.
          </p>
        </Panel>
        <Panel title="Feature contributions" className="lg:col-span-2">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={explain} layout="vertical" margin={{ left: 110 }}>
                <CartesianGrid stroke="rgba(156,204,101,0.12)" />
                <XAxis type="number" stroke="#9bb3a6" fontSize={11} />
                <YAxis type="category" dataKey="feature" stroke="#9bb3a6" fontSize={11} width={100} />
                <Tooltip contentStyle={{ background: '#0c1f1a', border: '1px solid #2a5a4c' }} />
                <Bar dataKey="contribution" fill="#9ccc65" name="Contribution" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="6-hour risk nowcast">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecast}>
                <CartesianGrid stroke="rgba(156,204,101,0.12)" />
                <XAxis dataKey="hour" stroke="#9bb3a6" />
                <YAxis domain={[0, 100]} stroke="#9bb3a6" />
                <Tooltip contentStyle={{ background: '#0c1f1a', border: '1px solid #2a5a4c' }} />
                <Line type="monotone" dataKey="score" stroke="#e07040" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Evidence table">
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] uppercase text-muted">
              <tr>
                <th className="pb-2">Feature</th>
                <th>Reading</th>
                <th>Weight</th>
              </tr>
            </thead>
            <tbody>
              {zone.explain.map((e) => (
                <tr key={e.feature} className="border-t border-white/5">
                  <td className="py-2 pr-2">{e.feature}</td>
                  <td className="font-mono text-xs">{e.value}</td>
                  <td className="font-mono text-xs">{(e.weight * 100).toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      {/* Interactive AI Copilot Banner */}
      <div className="rounded-2xl border border-lime/30 bg-gradient-to-r from-[#0a241c] via-[#0b1f1a] to-[#071713] p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-lime pulse-dot" />
              <p className="text-xs font-bold tracking-widest text-lime uppercase">
                Interactive SEOC Copilot Active
              </p>
            </div>
            <h2 className="text-lg font-bold text-ink">
              Ask Shru AI about {zone.name} or your current location
            </h2>
            <p className="text-xs text-muted max-w-2xl">
              Query SHAP feature contributions, simulate slope saturation thresholds, request route diversions, or check nearest evacuation shelters. Click the floating Shru AI button at the bottom right anytime.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                const el = document.querySelector('button[aria-label="Open Shru AI Assistant"]') as HTMLButtonElement
                if (el) el.click()
              }}
              className="flex items-center gap-2 rounded-xl border border-lime/50 bg-lime px-4 py-2 text-xs font-bold text-command hover:bg-lime/90 transition shadow-lg shadow-lime/20"
            >
              <span>Ask Shru AI</span>
              <span>&rarr;</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
