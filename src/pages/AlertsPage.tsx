import { Panel, Pill } from '../components/ui'
import { fmtTime } from '../lib/format'
import { useStore } from '../store/AppStore'

export function AlertsPage() {
  const { alerts, ackAlert, broadcast, selectedZone, language, zones, selectZone } = useStore()
  const zone = selectedZone ?? zones[0]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] tracking-[0.22em] text-lime uppercase">Multi-channel warning desk</p>
          <h1 className="text-2xl font-semibold">Early warning &amp; community broadcast</h1>
          <p className="text-sm text-muted">App push, SMS, IVRS and control-room tickets. Messages render in the language selected on the header.</p>
        </div>
        <button
          type="button"
          disabled={!zone}
          onClick={() => zone && broadcast(zone.id)}
          className="rounded-lg bg-alert px-4 py-2 text-sm font-semibold text-white hover:bg-[#c45c26]"
        >
          Broadcast selected zone
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Compose target" className="lg:col-span-1">
          <label className="text-xs text-muted">
            Zone
            <select
              className="mt-1 w-full rounded border border-lime/20 bg-command px-2 py-2 text-sm"
              value={zone?.id}
              onChange={(e) => selectZone(e.target.value)}
            >
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </label>
          {zone ? (
            <div className="mt-4 space-y-2 text-sm">
              <Pill severity={zone.severity} />
              <p>Recipients (est.): {zone.populationAtRisk.toLocaleString('en-IN')}</p>
              <p className="text-muted">{zone.corridor}</p>
              <p className="rounded-lg border border-lime/15 bg-command p-3 text-xs leading-relaxed">
                {language === 'hi'
                  ? `${zone.district} में भूस्खलन जोखिम। ढलान कटान से दूर रहें, रात्रि यात्रा न करें।`
                  : language === 'as'
                    ? `${zone.district}ত ভূমিস্খলনৰ আশংকা। ঢালৰ পৰা আতৰত থাকক।`
                    : `Landslide risk in ${zone.district}. Stay clear of cut slopes. Halt night traffic on ${zone.corridor}.`}
              </p>
            </div>
          ) : null}
        </Panel>
        <Panel title="Alert ledger" className="lg:col-span-2">
          <ul className="space-y-3">
            {alerts.map((a) => (
              <li key={a.id} className="rounded-xl border border-white/5 bg-command/50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Pill severity={a.severity} />
                    <p className="text-sm font-medium">{a.title}</p>
                  </div>
                  <p className="font-mono text-[11px] text-muted">{fmtTime(a.time)}</p>
                </div>
                <p className="mt-2 text-sm text-ink/90">{a.message[language]}</p>
                <p className="mt-2 text-[11px] text-muted">
                  {a.source} · {a.channels.join(' / ')} · {a.recipients.toLocaleString('en-IN')} recipients · {a.acknowledged ? 'Acknowledged' : 'Open'}
                </p>
                {!a.acknowledged ? (
                  <button
                    type="button"
                    onClick={() => ackAlert(a.id)}
                    className="mt-2 rounded border border-lime/30 px-3 py-1 text-xs text-lime hover:bg-lime/10"
                  >
                    Acknowledge in SEOC
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  )
}
