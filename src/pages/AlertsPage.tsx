import { useState } from 'react'
import { Panel, Pill } from '../components/ui'
import { fmtTime } from '../lib/format'
import { useStore } from '../store/useStore'
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
    <div className="space-y-space-lg">
      {/* Top Header */}
      <div className="flex flex-wrap items-end justify-between gap-space-md">
        <div>
          <p className="font-label-caps text-primary">Multi-Channel Early Warning Grid</p>
          <h1 className="font-display-2xl text-on-surface">Early Warning &amp; Bhoomi AI Broadcast</h1>
          <p className="font-body-base text-on-surface-variant text-xs sm:text-sm mt-0.5">
            Automated alerts dispatched to registered Gmail IDs, SMS, IVRS, and SEOC incident logs.
          </p>
        </div>
        <div className="flex items-center gap-space-sm">
          <button
            type="button"
            onClick={handleSendTestEmail}
            className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary-fixed px-3.5 py-2 font-label-caps text-[11px] font-bold text-on-primary-fixed hover:bg-primary-fixed-dim transition cursor-pointer"
          >
            <Mail size={14} className="text-primary" />
            <span>{testSentFeedback ? 'Email Dispatched!' : 'Test Send to Email'}</span>
          </button>
          <button
            type="button"
            disabled={!zone}
            onClick={() => zone && broadcast(zone.id)}
            className="rounded-lg bg-error px-4 py-2 font-label-caps text-[11px] font-semibold text-on-error hover:bg-error/90 transition cursor-pointer shadow-sm disabled:opacity-50"
          >
            Broadcast Selected Zone
          </button>
        </div>
      </div>

      {/* BHOOMI Gmail Dispatch Integration Card */}
      <div className="rounded-xl border border-surface-container-high bg-surface-container-lowest p-space-lg shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-md">
            <div className="rounded-lg bg-primary-fixed p-2.5 text-on-primary-fixed">
              <Mail size={22} className="text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-headline-lg text-sm font-bold text-on-surface">BHOOMI AI Landslide Warning Email Dispatch Gateway</h3>
                <span className="flex items-center gap-1 rounded bg-secondary-container px-2 py-0.5 font-mono text-[10px] font-bold text-on-secondary-container">
                  <span className="h-1.5 w-1.5 rounded-full bg-secondary animate-ping" />
                  GATEWAY ONLINE
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Connected Recipient Email:{' '}
                <strong className="text-primary font-mono">{user?.email || 'officer.ner@gmail.com'}</strong> &bull;{' '}
                {bhoomiEmailAlerts.length} Automated Bhoomi Warnings Dispatched
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-md border border-surface-container-high bg-surface-container-low px-3 py-1.5 text-on-surface-variant">
              Auto-Alerts on: <strong className="text-on-surface font-semibold">Critical &amp; High Risk</strong>
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-space-lg lg:grid-cols-3">
        {/* Left Column: Compose & Bhoomi Sent Emails */}
        <div className="space-y-space-md lg:col-span-1">
          {/* Target Zone Panel */}
          <Panel title="Compose Target Zone">
            <label className="font-label-caps text-[11px] text-outline block mb-1">
              Zone Selection
              <select
                className="mt-1 w-full rounded-lg border border-surface-container-high bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none focus:border-primary shadow-xs"
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
              <div className="mt-4 space-y-2 text-sm text-on-surface">
                <div className="flex items-center justify-between">
                  <Pill severity={zone.severity} />
                  <span className="text-xs font-mono font-semibold text-outline">Score: {zone.riskScore.toFixed(0)}/100</span>
                </div>
                <p className="text-xs">
                  Recipients (est.):{' '}
                  <strong className="text-on-surface font-bold">{zone.populationAtRisk.toLocaleString('en-IN')}</strong>
                </p>
                <p className="text-xs text-on-surface-variant">Corridor: {zone.corridor}</p>
                <div className="rounded-lg border border-surface-container-high bg-surface-container-low p-3 text-xs leading-relaxed space-y-1.5">
                  <span className="font-label-caps text-[10px] text-primary block">
                    Bhoomi Dispatch Payload Preview
                  </span>
                  <p className="text-on-surface">
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
          <Panel title="Bhoomi Email Dispatch Ledger">
            <div className="flex items-center justify-between text-[11px] text-outline mb-2">
              <span>Dispatched to {user?.email || 'registered email'}</span>
              <span className="font-mono font-bold text-primary">{bhoomiEmailAlerts.length} Sent</span>
            </div>
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {bhoomiEmailAlerts.length === 0 ? (
                <p className="text-xs text-outline p-3 text-center">No email alerts dispatched yet in this session.</p>
              ) : (
                bhoomiEmailAlerts.map((em) => (
                  <div
                    key={em.id}
                    onClick={() => setSelectedEmailAlert(em)}
                    className="cursor-pointer rounded-lg border border-surface-container-high bg-surface-container-low p-2.5 hover:border-primary hover:bg-surface-container-lowest transition"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-bold text-primary truncate max-w-[170px]">{em.district}</span>
                      <span className="text-[10px] text-outline font-mono">{fmtTime(em.timestamp)}</span>
                    </div>
                    <p className="mt-1 text-xs font-semibold text-on-surface truncate">{em.subject}</p>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-on-surface-variant">
                      <span className="text-primary font-semibold">Rain: {em.rainfallMm}mm</span>
                      <span className="text-secondary font-medium flex items-center gap-0.5">
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
              <li key={a.id} className="rounded-xl border border-surface-container-high bg-surface-container-low p-3.5 hover:border-primary/40 hover:bg-surface-container-lowest transition shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Pill severity={a.severity} />
                    <p className="text-sm font-bold text-on-surface">{a.title}</p>
                  </div>
                  <p className="font-mono text-[11px] text-outline">{fmtTime(a.time)}</p>
                </div>
                <p className="mt-2 text-sm text-on-surface-variant leading-relaxed font-normal">{a.message[language]}</p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-surface-container-high pt-2 text-[11px] text-on-surface-variant">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-on-surface font-semibold">{a.source}</span>
                    <span>&bull;</span>
                    <span className="text-primary font-mono font-medium">{a.channels.join(' / ')}</span>
                    <span>&bull;</span>
                    <span>{a.recipients.toLocaleString('en-IN')} recipients</span>
                  </div>
                  {!a.acknowledged ? (
                    <button
                      type="button"
                      onClick={() => ackAlert(a.id)}
                      className="rounded border border-primary/30 bg-primary-fixed px-3 py-1 font-label-caps text-[10px] font-semibold text-on-primary-fixed hover:bg-primary-fixed-dim transition cursor-pointer"
                    >
                      Acknowledge in SEOC
                    </button>
                  ) : (
                    <span className="text-[10px] text-outline font-mono">Acknowledged</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* Selected Email Detail Modal */}
      {selectedEmailAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl border border-surface-container-high bg-surface-container-lowest p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-surface-container-high pb-3">
              <div className="flex items-center gap-2 text-primary font-bold">
                <Mail size={18} />
                <span>Bhoomi AI Email Payload Log</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEmailAlert(null)}
                className="text-outline hover:text-on-surface text-xs px-2 py-1 rounded hover:bg-surface-container-high cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="space-y-2 text-xs text-on-surface">
              <p><strong className="text-outline">Recipient:</strong> <span className="font-mono font-bold text-primary">{selectedEmailAlert.recipientEmail}</span></p>
              <p><strong className="text-outline">Subject:</strong> <span className="font-bold text-on-surface">{selectedEmailAlert.subject}</span></p>
              <p><strong className="text-outline">Time:</strong> <span className="font-mono text-on-surface-variant">{new Date(selectedEmailAlert.timestamp).toLocaleString()} IST</span></p>
              <div className="rounded-lg bg-surface-container-low p-3 border border-surface-container-high text-on-surface leading-relaxed font-medium">
                {selectedEmailAlert.message}
              </div>
              <p><strong className="text-outline">Evacuation Route:</strong> <span className="text-on-surface font-medium">{selectedEmailAlert.evacuationRoute}</span></p>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedEmailAlert(null)}
                className="rounded-lg bg-primary px-4 py-1.5 font-label-caps text-xs font-bold text-on-primary hover:bg-primary-container cursor-pointer shadow-sm"
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
