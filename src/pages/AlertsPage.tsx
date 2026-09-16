import { useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  BellRing,
  CheckCircle2,
  Mail,
  Megaphone,
  Radio,
} from 'lucide-react'
import { ChipToggle, Panel, Pill } from '../components/ui'
import { fmtTime } from '../lib/format'
import { useStore } from '../store/useStore'
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
  const [filterSeverity, setFilterSeverity] = useState<string>('All')

  function handleSendTestEmail() {
    sendTestBhoomiEmail(zone?.id)
    setTestSentFeedback(true)
    setTimeout(() => setTestSentFeedback(false), 3000)
  }

  const filteredAlerts = alerts.filter((a) => {
    return filterSeverity === 'All' || a.severity.toLowerCase() === filterSeverity.toLowerCase()
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-error animate-pulse" />
            <p className="font-label-caps text-primary text-[10.5px] font-bold">Multi-Channel Early Warning Grid</p>
          </div>
          <h1 className="font-display-2xl text-2xl sm:text-3xl text-on-surface font-extrabold tracking-tight">
            Early Warning &amp; BHOOMI AI Broadcast
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
            Automated alerts dispatched to registered email IDs, SMS, IVRS sirens, and SEOC emergency logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSendTestEmail}
            className="flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary-fixed px-4 py-2 font-label-caps text-[11px] font-bold text-on-primary-fixed hover:bg-primary-fixed-dim transition-all shadow-2xs hover:scale-105 cursor-pointer"
          >
            <Mail size={14} className="text-primary" />
            <span>{testSentFeedback ? 'Email Dispatched!' : 'Test Send Alert Email'}</span>
          </button>
          <button
            type="button"
            disabled={!zone}
            onClick={() => zone && broadcast(zone.id)}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-error to-rose-600 px-4 py-2 font-label-caps text-[11px] font-bold text-on-error hover:brightness-105 transition-all cursor-pointer shadow-md shadow-error/25 disabled:opacity-50"
          >
            <Megaphone size={14} />
            <span>Broadcast Selected Zone</span>
          </button>
        </div>
      </div>

      {/* BHOOMI Email Dispatch Gateway Card */}
      <div className="rounded-2xl border border-surface-container-high/80 bg-gradient-to-r from-surface-container-lowest via-surface-container-low to-surface-container-lowest p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="rounded-xl bg-primary-fixed p-3 text-on-primary-fixed shadow-2xs">
              <Mail size={22} className="text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-headline-lg text-sm font-bold text-on-surface">
                  BHOOMI AI Landslide Warning Email Dispatch Gateway
                </h3>
                <span className="flex items-center gap-1.5 rounded-full bg-secondary-container px-2.5 py-0.5 font-mono text-[9.5px] font-bold text-on-secondary-container border border-secondary/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulse" />
                  GATEWAY ONLINE
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Connected Recipient Email:{' '}
                <strong className="text-primary font-mono font-semibold">{user?.email || 'officer.ner@gmail.com'}</strong> &bull;{' '}
                {bhoomiEmailAlerts.length} Automated BHOOMI Warnings Dispatched
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-xl border border-surface-container-high bg-surface-container-low px-3 py-1.5 text-on-surface-variant font-medium">
              Auto-Alerts on: <strong className="text-on-surface font-bold">Critical &amp; High Risk</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Filter Severity Chips */}
      <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-xs">
        <span className="text-[11px] font-label-caps text-outline ml-2 mr-1">Filter Early Warnings:</span>
        <ChipToggle
          label="All Alerts"
          active={filterSeverity === 'All'}
          onClick={() => setFilterSeverity('All')}
          count={alerts.length}
        />
        <ChipToggle
          label="Critical"
          active={filterSeverity === 'Critical'}
          onClick={() => setFilterSeverity('Critical')}
          count={alerts.filter((a) => a.severity === 'Critical').length}
          icon={<AlertCircle size={13} className="text-error" />}
        />
        <ChipToggle
          label="High"
          active={filterSeverity === 'High'}
          onClick={() => setFilterSeverity('High')}
          count={alerts.filter((a) => a.severity === 'High').length}
          icon={<AlertTriangle size={13} className="text-primary" />}
        />
        <ChipToggle
          label="Moderate"
          active={filterSeverity === 'Moderate'}
          onClick={() => setFilterSeverity('Moderate')}
          count={alerts.filter((a) => a.severity === 'Moderate').length}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Compose & Bhoomi Sent Emails */}
        <div className="space-y-6 lg:col-span-1">
          {/* Target Zone Panel */}
          <Panel title="Compose Target Sector" icon={Radio}>
            <label className="font-label-caps text-[10.5px] font-bold text-outline block mb-1.5">
              Watchbox Sector Selection
              <select
                className="mt-1.5 w-full rounded-xl border border-surface-container-high bg-surface-container-lowest px-3 py-2.5 text-xs sm:text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-xs cursor-pointer"
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
              <div className="mt-4 space-y-3 text-xs sm:text-sm text-on-surface">
                <div className="flex items-center justify-between">
                  <Pill severity={zone.severity} />
                  <span className="text-xs font-mono font-bold text-outline">Risk Score: {zone.riskScore.toFixed(0)}/100</span>
                </div>
                <p className="text-xs">
                  Recipients (est.):{' '}
                  <strong className="text-on-surface font-bold">{zone.populationAtRisk.toLocaleString('en-IN')}</strong>
                </p>
                <p className="text-xs text-on-surface-variant font-medium">Corridor: {zone.corridor}</p>
                
                <div className="rounded-2xl border border-surface-container-high bg-surface-container-low p-3.5 text-xs leading-relaxed space-y-1.5">
                  <span className="font-label-caps text-[10px] font-bold text-primary block">
                    BHOOMI Dispatch Payload Preview
                  </span>
                  <p className="text-on-surface font-medium">
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
          <Panel title="BHOOMI Email Dispatch Ledger" icon={Mail}>
            <div className="flex items-center justify-between text-[11px] text-outline mb-2.5">
              <span>Dispatched to {user?.email || 'registered email'}</span>
              <span className="font-mono font-bold text-primary">{bhoomiEmailAlerts.length} Sent</span>
            </div>
            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {bhoomiEmailAlerts.length === 0 ? (
                <p className="text-xs text-outline p-4 text-center">No email alerts dispatched yet in this session.</p>
              ) : (
                bhoomiEmailAlerts.map((em) => (
                  <div
                    key={em.id}
                    onClick={() => setSelectedEmailAlert(em)}
                    className="cursor-pointer rounded-2xl border border-surface-container-high bg-surface-container-low/60 p-3 hover:border-primary hover:bg-surface-container-lowest transition-all hover:-translate-y-0.5 shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-bold text-primary truncate max-w-[170px]">{em.district}</span>
                      <span className="text-[10px] text-outline font-mono">{fmtTime(em.timestamp)}</span>
                    </div>
                    <p className="mt-1 text-xs font-bold text-on-surface truncate">{em.subject}</p>
                    <div className="mt-1.5 flex items-center justify-between text-[10.5px] text-on-surface-variant">
                      <span className="text-primary font-semibold">Rain: {em.rainfallMm}mm</span>
                      <span className="text-secondary font-bold flex items-center gap-1">
                        <CheckCircle2 size={12} /> Delivered
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Panel>
        </div>

        {/* Right Columns: Main Early Warning Stream Ledger */}
        <Panel title={`Multi-Hazard Early Warning Ledger (${filteredAlerts.length})`} icon={BellRing} className="lg:col-span-2">
          <ul className="space-y-3">
            {filteredAlerts.map((a) => (
              <li
                key={a.id}
                className="rounded-2xl border border-surface-container-high bg-surface-container-low/60 p-4 hover:border-primary/40 hover:bg-surface-container-lowest transition-all shadow-xs hover:shadow-md hover:-translate-y-0.5 group"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <Pill severity={a.severity} />
                    <p className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">{a.title}</p>
                  </div>
                  <p className="font-mono text-[11px] text-outline font-medium">{fmtTime(a.time)}</p>
                </div>
                <p className="mt-2 text-xs sm:text-sm text-on-surface-variant leading-relaxed">{a.message[language]}</p>
                <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-surface-container-high/80 pt-2.5 text-xs text-on-surface-variant">
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
                      className="rounded-xl border border-primary/30 bg-primary-fixed px-3 py-1 font-label-caps text-[9.5px] font-bold text-on-primary-fixed hover:bg-primary-fixed-dim transition-all cursor-pointer shadow-2xs hover:scale-105"
                    >
                      Acknowledge in SEOC
                    </button>
                  ) : (
                    <span className="text-[10px] text-secondary font-mono font-bold flex items-center gap-1">
                      <CheckCircle2 size={12} /> Acknowledged
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* Selected Email Detail Modal */}
      {selectedEmailAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-surface-container-high bg-surface-container-lowest p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-surface-container-high pb-3">
              <div className="flex items-center gap-2 text-primary font-bold">
                <Mail size={20} />
                <span className="text-sm sm:text-base">BHOOMI AI Email Payload Log</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEmailAlert(null)}
                className="text-outline hover:text-on-surface text-xs px-2 py-1 rounded-lg hover:bg-surface-container-high cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="space-y-2.5 text-xs sm:text-sm text-on-surface">
              <p><strong className="text-outline">Recipient:</strong> <span className="font-mono font-bold text-primary">{selectedEmailAlert.recipientEmail}</span></p>
              <p><strong className="text-outline">Subject:</strong> <span className="font-bold text-on-surface">{selectedEmailAlert.subject}</span></p>
              <p><strong className="text-outline">Time:</strong> <span className="font-mono text-on-surface-variant">{new Date(selectedEmailAlert.timestamp).toLocaleString()} IST</span></p>
              <div className="rounded-xl bg-surface-container-low p-3.5 border border-surface-container-high text-on-surface leading-relaxed font-medium">
                {selectedEmailAlert.message}
              </div>
              <p><strong className="text-outline">Evacuation Corridor:</strong> <span className="text-on-surface font-semibold">{selectedEmailAlert.evacuationRoute}</span></p>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedEmailAlert(null)}
                className="rounded-xl bg-primary px-4 py-2 font-label-caps text-xs font-bold text-on-primary hover:bg-primary-container cursor-pointer shadow-sm transition-all"
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
