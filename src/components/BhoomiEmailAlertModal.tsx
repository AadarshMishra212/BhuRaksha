import { useState } from 'react'
import {
  Mail,
  AlertTriangle,
  X,
  ExternalLink,
  CheckCircle2,
  Clock,
  MapPin,
  CloudRain,
  Activity,
  Download,
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { fmtTime } from '../lib/format'
import type { BhoomiEmailAlert } from '../types'

export function BhoomiEmailNotificationToast() {
  const { activeEmailToast, dismissEmailToast, user } = useStore()
  const [selectedAlertForModal, setSelectedAlertForModal] = useState<BhoomiEmailAlert | null>(null)

  if (!activeEmailToast && !selectedAlertForModal) return null

  return (
    <>
      {/* Floating Interactive Bhoomi Gmail Toast Notification */}
      {activeEmailToast && (
        <div className="fixed top-16 right-4 z-50 max-w-md animate-bounce-short rounded-xl border border-secondary/40 bg-surface-container-lowest p-4 shadow-2xl backdrop-blur-md text-on-surface ring-1 ring-secondary/20">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-secondary-container p-2.5 text-on-secondary-container ring-1 ring-secondary/30 shrink-0">
              <Mail size={22} className="animate-pulse" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="rounded bg-secondary-container px-2 py-0.5 text-[10px] font-mono font-bold text-on-secondary-container border border-secondary/30 uppercase">
                  BHOOMI GMAIL DISPATCHED
                </span>
                <span className="text-[10px] text-outline font-mono">{fmtTime(activeEmailToast.timestamp)}</span>
              </div>

              <h4 className="mt-1 text-xs font-bold text-on-surface truncate">{activeEmailToast.subject}</h4>

              <p className="mt-1 text-[11px] text-on-surface-variant leading-relaxed line-clamp-2">
                Sent to <strong className="text-secondary">{activeEmailToast.recipientEmail}</strong>: {activeEmailToast.message}
              </p>

              <div className="mt-2.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedAlertForModal(activeEmailToast)}
                  className="inline-flex items-center gap-1 rounded bg-secondary px-2.5 py-1 text-xs font-bold text-on-secondary hover:bg-secondary/90 transition cursor-pointer shadow-xs"
                >
                  <ExternalLink size={12} />
                  <span>Preview Gmail Alert</span>
                </button>
                <button
                  type="button"
                  onClick={dismissEmailToast}
                  className="rounded border border-surface-container-high px-2 py-1 text-xs text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={dismissEmailToast}
              className="text-outline hover:text-on-surface p-1 rounded transition cursor-pointer"
              aria-label="Close notification"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Full Simulated Gmail Email Modal */}
      {selectedAlertForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-surface-container-high bg-surface-container-lowest text-on-surface shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-surface-container-high bg-surface-container-low px-5 py-3.5">
              <div className="flex items-center gap-2.5">
                <div className="rounded bg-secondary-container p-1.5 text-on-secondary-container">
                  <Mail size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-on-surface">BHOOMI AI Landslide Alert Delivery</h3>
                  <p className="text-[11px] text-outline">
                    Official automated emergency dispatch received on Gmail
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAlertForModal(null)}
                className="rounded-lg p-1.5 text-outline hover:bg-surface-container-high hover:text-on-surface transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Simulated Email Client Container */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Email Headers Meta */}
              <div className="rounded-xl border border-surface-container-high bg-surface-container-low p-4 space-y-2 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-1 pb-2 border-b border-surface-container-high">
                  <span className="font-semibold text-outline">From:</span>
                  <span className="font-mono text-secondary font-semibold">BHOOMI AI Early Warning &lt;alerts@bhuraksha.gov.in&gt;</span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-1 pb-2 border-b border-surface-container-high">
                  <span className="font-semibold text-outline">To:</span>
                  <span className="font-mono text-on-surface font-bold">{selectedAlertForModal.recipientEmail || user?.email}</span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-1 pb-2 border-b border-surface-container-high">
                  <span className="font-semibold text-outline">Date:</span>
                  <span className="text-on-surface-variant font-mono">{new Date(selectedAlertForModal.timestamp).toLocaleString()} IST</span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <span className="font-semibold text-outline">Subject:</span>
                  <span className="font-bold text-error font-mono">{selectedAlertForModal.subject}</span>
                </div>
              </div>

              {/* Official Email Body */}
              <div className="rounded-xl border border-error/30 bg-error-container/20 p-5 space-y-4">
                {/* Government & BHOOMI Header Banner */}
                <div className="flex items-center justify-between border-b border-error/20 pb-3">
                  <div className="flex items-center gap-3">
                    <img src="/logo.jpg" alt="Logo" className="h-10 w-10 rounded-full object-cover ring-2 ring-secondary/40" />
                    <div>
                      <h4 className="text-xs font-bold tracking-wider text-secondary uppercase">
                        BHURAKSHA &bull; BHOOMI AI EARLY WARNING
                      </h4>
                      <p className="text-[10px] text-outline font-medium">
                        Ministry of DoNER &bull; NDMA Joint Landslide Situation Desk
                      </p>
                    </div>
                  </div>
                  <span className="rounded bg-error-container px-2.5 py-1 text-xs font-bold text-on-error-container border border-error/30 uppercase">
                    {selectedAlertForModal.severity} ALERT
                  </span>
                </div>

                {/* Main Advisory Notice */}
                <div className="space-y-2">
                  <h5 className="text-base font-bold text-on-surface flex items-center gap-2">
                    <AlertTriangle size={18} className="text-error" />
                    <span>Landslide Threat Nowcast for {selectedAlertForModal.zoneName}</span>
                  </h5>
                  <p className="text-xs sm:text-sm text-on-surface leading-relaxed bg-surface-container-lowest p-3 rounded-lg border border-surface-container-high font-medium shadow-xs">
                    {selectedAlertForModal.message}
                  </p>
                </div>

                {/* Telemetry Metrics Grid */}
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 text-xs">
                  <div className="rounded-lg border border-surface-container-high bg-surface-container-lowest p-2.5 shadow-xs">
                    <div className="flex items-center gap-1.5 text-outline text-[11px]">
                      <MapPin size={13} className="text-secondary" />
                      <span>Location</span>
                    </div>
                    <p className="mt-1 font-bold text-on-surface truncate">{selectedAlertForModal.district}, {selectedAlertForModal.state}</p>
                  </div>
                  <div className="rounded-lg border border-surface-container-high bg-surface-container-lowest p-2.5 shadow-xs">
                    <div className="flex items-center gap-1.5 text-outline text-[11px]">
                      <CloudRain size={13} className="text-primary" />
                      <span>24h Rainfall</span>
                    </div>
                    <p className="mt-1 font-bold text-primary font-mono">{selectedAlertForModal.rainfallMm} mm</p>
                  </div>
                  <div className="rounded-lg border border-surface-container-high bg-surface-container-lowest p-2.5 col-span-2 sm:col-span-1 shadow-xs">
                    <div className="flex items-center gap-1.5 text-outline text-[11px]">
                      <Activity size={13} className="text-tertiary" />
                      <span>Soil Moisture</span>
                    </div>
                    <p className="mt-1 font-bold text-tertiary font-mono">{selectedAlertForModal.soilSaturation}% (Saturated)</p>
                  </div>
                </div>

                {/* Evacuation & Corridor Directive */}
                {selectedAlertForModal.evacuationRoute && (
                  <div className="rounded-lg border border-secondary/30 bg-secondary-container/30 p-3 text-xs">
                    <span className="font-bold text-secondary uppercase tracking-wider block mb-1">
                      Designated Safe Corridor / Action:
                    </span>
                    <p className="text-on-surface font-medium">{selectedAlertForModal.evacuationRoute}</p>
                  </div>
                )}

                {/* Footer Assurance */}
                <div className="border-t border-error/20 pt-3 flex flex-wrap items-center justify-between text-[11px] text-outline">
                  <div className="flex items-center gap-1.5 text-secondary font-semibold">
                    <CheckCircle2 size={13} />
                    <span>Delivered via BHOOMI AI Automated Telemetry Gateway</span>
                  </div>
                  <span className="font-mono text-outline">Ref: {selectedAlertForModal.id}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="flex items-center justify-between border-t border-surface-container-high bg-surface-container-low px-5 py-3">
              <div className="flex items-center gap-1.5 text-xs text-outline">
                <Clock size={13} className="text-secondary" />
                <span>24x7 Continuous InSAR &amp; Sensor Vigil</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1 rounded-lg border border-surface-container-high bg-surface-container-lowest px-3 py-1.5 text-xs font-semibold text-on-surface hover:bg-surface-container-high transition cursor-pointer shadow-xs"
                >
                  <Download size={13} />
                  <span>Print Sitrep</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedAlertForModal(null)}
                  className="rounded-lg bg-secondary px-4 py-1.5 text-xs font-bold text-on-secondary hover:bg-secondary/90 transition cursor-pointer shadow-xs"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
