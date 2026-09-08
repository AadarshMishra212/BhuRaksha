import { useState } from 'react'
import { Panel, Pill } from '../components/ui'
import { fmtTime } from '../lib/format'
import { useStore } from '../store/AppStore'
import {
  Mail,
  CheckCircle2,
} from 'lucide-react'
import type { BhoomiEmailAlert } from '../types'

export function AlertsPage() {
  const {
    alerts,
    ackAlert,
    broadcast,
    selectedZone,
    language,
    zones,
    selectZone,
    user,
    bhoomiEmailAlerts,
    sendTestBhoomiEmail,
  } = useStore()

  const zone = selectedZone ?? zones[0]
  const [selectedEmailAlert, setSelectedEmailAlert] = useState<BhoomiEmailAlert | null>(null)
  const [testSentFeedback, setTestSentFeedback] = useState(false)

  function handleSendTestEmail() {
    sendTestBhoomiEmail(zone?.id)
    setTestSentFeedback(true)
    setTimeout(() => setTestSentFeedback(false), 3000)
  }

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] tracking-[0.22em] text-emerald-700 uppercase font-semibold">Multi-Channel Early Warning Grid</p>
          <h1 className="text-2xl font-bold text-gray-900">Early Warning &amp; Bhoomi AI Broadcast</h1>
          <p className="text-sm text-gray-600">
            Automated alerts dispatched to registered Gmail IDs, SMS, IVRS, and SEOC incident logs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSendTestEmail}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-900 hover:bg-emerald-100 transition cursor-pointer"
          >
            <Mail size={14} />
            <span>{testSentFeedback ? 'Email Dispatched!' : 'Test Send to Gmail'}</span>
          </button>
          <button
            type="button"
            disabled={!zone}
            onClick={() => zone && broadcast(zone.id)}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 transition cursor-pointer shadow-sm shadow-rose-600/20 disabled:opacity-50"
          >
            Broadcast Selected Zone
          </button>
        </div>
      </div>

      {/* BHOOMI Gmail Dispatch Integration Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-700 ring-1 ring-emerald-200">
              <Mail size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-gray-900">BHOOMI AI Landslide Warning Email Dispatch Gateway</h3>
                <span className="flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-800 border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-ping" />
                  GATEWAY ONLINE
                </span>
              </div>
              <p className="text-xs text-gray-600">
                Connected Recipient Gmail:{' '}
                <strong className="text-emerald-800 font-mono">{user?.email || 'officer.ner@gmail.com'}</strong> &bull;{' '}
                {bhoomiEmailAlerts.length} Automated Bhoomi Warnings Dispatched
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-gray-700">
              Auto-Alerts on: <strong className="text-gray-900 font-semibold">Critical &amp; High Risk</strong>
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left Column: Compose & Bhoomi Sent Emails */}
        <div className="space-y-4 lg:col-span-1">
          {/* Target Zone Panel */}
          <Panel title="Compose Target Zone">
            <label className="text-xs font-semibold text-gray-700 block">
              Zone Selection
              <select
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-emerald-500 shadow-sm"
                value={zone?.id}
                onChange={(e) => selectZone(e.target.value)}
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} ({z.district}, {z.state})
                  </option>
                ))}
              </select>
            </label>
            {zone ? (
              <div className="mt-4 space-y-2 text-sm text-gray-800">
                <div className="flex items-center justify-between">
                  <Pill severity={zone.severity} />
                  <span className="text-xs font-mono font-semibold text-gray-600">Score: {zone.riskScore.toFixed(0)}/100</span>
                </div>
                <p className="text-xs">
                  Recipients (est.):{' '}
                  <strong className="text-gray-950 font-bold">{zone.populationAtRisk.toLocaleString('en-IN')}</strong>
                </p>
                <p className="text-xs text-gray-600">Corridor: {zone.corridor}</p>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 text-xs leading-relaxed space-y-1.5">
                  <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider block">
                    Bhoomi Dispatch Payload Preview
                  </span>
                  <p className="text-gray-900">
                    {language === 'hi'
                      ? `${zone.district} में भूस्खलन जोखिम। ढलान कटान से दूर रहें, रात्रि यात्रा न करें।`
                      : language === 'as'
                        ? `${zone.district}ত ভূমিস্খলনৰ আশংকা। ঢালৰ পৰা আতৰত থাকক।`
                        : `Landslide risk in ${zone.district}. Stay clear of cut slopes. Halt night traffic on ${zone.corridor}.`}
                  </p>
                </div>
              </div>
            ) : null}
          </Panel>

          {/* Bhoomi Dispatched Emails Ledger */}
          <Panel title="Bhoomi Gmail Dispatch Ledger">
            <div className="flex items-center justify-between text-[11px] text-gray-500 mb-2">
              <span>Dispatched to {user?.email || 'registered Gmail'}</span>
              <span className="font-mono font-bold text-emerald-700">{bhoomiEmailAlerts.length} Sent</span>
            </div>
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {bhoomiEmailAlerts.length === 0 ? (
                <p className="text-xs text-gray-500 p-3 text-center">No email alerts dispatched yet in this session.</p>
              ) : (
                bhoomiEmailAlerts.map((em) => (
                  <div
                    key={em.id}
                    onClick={() => setSelectedEmailAlert(em)}
                    className="cursor-pointer rounded-lg border border-gray-200 bg-gray-50/80 p-2.5 hover:border-emerald-400 hover:bg-white transition"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-bold text-emerald-800 truncate max-w-[170px]">{em.district}</span>
                      <span className="text-[10px] text-gray-500 font-mono">{fmtTime(em.timestamp)}</span>
                    </div>
                    <p className="mt-1 text-xs font-semibold text-gray-900 truncate">{em.subject}</p>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-gray-600">
                      <span className="text-sky-800 font-semibold">Rain: {em.rainfallMm}mm</span>
                      <span className="text-emerald-700 font-medium flex items-center gap-0.5">
                        <CheckCircle2 size={10} /> Delivered
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Panel>
        </div>

        {/* Right Columns: Main Early Warning Stream Ledger */}
        <Panel title="Multi-Hazard Early Warning Ledger" className="lg:col-span-2">
          <ul className="space-y-3">
            {alerts.map((a) => (
              <li key={a.id} className="rounded-xl border border-gray-200 bg-gray-50/60 p-3.5 hover:border-emerald-300 hover:bg-white transition shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Pill severity={a.severity} />
                    <p className="text-sm font-bold text-gray-900">{a.title}</p>
                  </div>
                  <p className="font-mono text-[11px] text-gray-500">{fmtTime(a.time)}</p>
                </div>
                <p className="mt-2 text-sm text-gray-800 leading-relaxed font-normal">{a.message[language]}</p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 pt-2 text-[11px] text-gray-600">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-gray-900 font-semibold">{a.source}</span>
                    <span>&bull;</span>
                    <span className="text-emerald-800 font-mono font-medium">{a.channels.join(' / ')}</span>
                    <span>&bull;</span>
                    <span>{a.recipients.toLocaleString('en-IN')} recipients</span>
                  </div>
                  {!a.acknowledged ? (
                    <button
                      type="button"
                      onClick={() => ackAlert(a.id)}
                      className="rounded border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 transition cursor-pointer"
                    >
                      Acknowledge in SEOC
                    </button>
                  ) : (
                    <span className="text-[10px] text-gray-500 font-mono">Acknowledged</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* Selected Email Detail Modal */}
      {selectedEmailAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 text-emerald-800 font-bold">
                <Mail size={18} />
                <span>Bhoomi AI Email Payload Log</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEmailAlert(null)}
                className="text-gray-500 hover:text-gray-900 text-xs px-2 py-1 rounded hover:bg-gray-100 cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="space-y-2 text-xs text-gray-800">
              <p><strong className="text-gray-600">Recipient:</strong> <span className="font-mono font-bold text-emerald-800">{selectedEmailAlert.recipientEmail}</span></p>
              <p><strong className="text-gray-600">Subject:</strong> <span className="font-bold text-gray-900">{selectedEmailAlert.subject}</span></p>
              <p><strong className="text-gray-600">Time:</strong> <span className="font-mono text-gray-700">{new Date(selectedEmailAlert.timestamp).toLocaleString()} IST</span></p>
              <div className="rounded-lg bg-gray-50 p-3 border border-gray-200 text-gray-900 leading-relaxed font-medium">
                {selectedEmailAlert.message}
              </div>
              <p><strong className="text-gray-600">Evacuation Route:</strong> <span className="text-gray-900 font-medium">{selectedEmailAlert.evacuationRoute}</span></p>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedEmailAlert(null)}
                className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 cursor-pointer shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
