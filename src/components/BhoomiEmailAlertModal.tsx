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
        <div className="fixed top-16 right-4 z-50 max-w-md animate-bounce-short rounded-xl border border-emerald-500/40 bg-white p-4 shadow-2xl backdrop-blur-md text-gray-900 ring-1 ring-emerald-500/20">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-700 ring-1 ring-emerald-200 shrink-0">
              <Mail size={22} className="animate-pulse" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-900 border border-emerald-200 uppercase">
                  BHOOMI GMAIL DISPATCHED
                </span>
                <span className="text-[10px] text-gray-500 font-mono">{fmtTime(activeEmailToast.timestamp)}</span>
              </div>

              <h4 className="mt-1 text-xs font-bold text-gray-900 truncate">{activeEmailToast.subject}</h4>

              <p className="mt-1 text-[11px] text-gray-600 leading-relaxed line-clamp-2">
                Sent to <strong className="text-emerald-800">{activeEmailToast.recipientEmail}</strong>: {activeEmailToast.message}
              </p>

              <div className="mt-2.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedAlertForModal(activeEmailToast)}
                  className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-700 transition cursor-pointer shadow-xs"
                >
                  <ExternalLink size={12} />
                  <span>Preview Gmail Alert</span>
                </button>
                <button
                  type="button"
                  onClick={dismissEmailToast}
                  className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={dismissEmailToast}
              className="text-gray-400 hover:text-gray-700 p-1 rounded transition cursor-pointer"
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
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-gray-200 bg-white text-gray-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 px-5 py-3.5">
              <div className="flex items-center gap-2.5">
                <div className="rounded bg-emerald-100 p-1.5 text-emerald-800">
                  <Mail size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">BHOOMI AI Landslide Alert Delivery</h3>
                  <p className="text-[11px] text-gray-500">
                    Official automated emergency dispatch received on Gmail
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAlertForModal(null)}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Simulated Email Client Container */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Email Headers Meta */}
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-2 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-1 pb-2 border-b border-gray-200">
                  <span className="font-semibold text-gray-600">From:</span>
                  <span className="font-mono text-emerald-800 font-semibold">BHOOMI AI Early Warning &lt;alerts@bhuraksha.gov.in&gt;</span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-1 pb-2 border-b border-gray-200">
                  <span className="font-semibold text-gray-600">To:</span>
                  <span className="font-mono text-gray-900 font-bold">{selectedAlertForModal.recipientEmail || user?.email}</span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-1 pb-2 border-b border-gray-200">
                  <span className="font-semibold text-gray-600">Date:</span>
                  <span className="text-gray-700 font-mono">{new Date(selectedAlertForModal.timestamp).toLocaleString()} IST</span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <span className="font-semibold text-gray-600">Subject:</span>
                  <span className="font-bold text-rose-700 font-mono">{selectedAlertForModal.subject}</span>
                </div>
              </div>

              {/* Official Email Body */}
              <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-5 space-y-4">
                {/* Government & BHOOMI Header Banner */}
                <div className="flex items-center justify-between border-b border-rose-200/60 pb-3">
                  <div className="flex items-center gap-3">
                    <img src="/logo.jpg" alt="Logo" className="h-10 w-10 rounded-full object-cover ring-2 ring-emerald-500/40" />
                    <div>
                      <h4 className="text-xs font-bold tracking-wider text-emerald-900 uppercase">
                        BHURAKSHA &bull; BHOOMI AI EARLY WARNING
                      </h4>
                      <p className="text-[10px] text-gray-600 font-medium">
                        Ministry of DoNER &bull; NDMA Joint Landslide Situation Desk
                      </p>
                    </div>
                  </div>
                  <span className="rounded bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-800 border border-rose-300 uppercase">
                    {selectedAlertForModal.severity} ALERT
                  </span>
                </div>

                {/* Main Advisory Notice */}
                <div className="space-y-2">
                  <h5 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <AlertTriangle size={18} className="text-rose-600" />
                    <span>Landslide Threat Nowcast for {selectedAlertForModal.zoneName}</span>
                  </h5>
                  <p className="text-xs sm:text-sm text-gray-900 leading-relaxed bg-white p-3 rounded-lg border border-gray-200 font-medium shadow-xs">
                    {selectedAlertForModal.message}
                  </p>
                </div>

                {/* Telemetry Metrics Grid */}
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 text-xs">
                  <div className="rounded-lg border border-gray-200 bg-white p-2.5 shadow-xs">
                    <div className="flex items-center gap-1.5 text-gray-600 text-[11px]">
                      <MapPin size={13} className="text-emerald-700" />
                      <span>Location</span>
                    </div>
                    <p className="mt-1 font-bold text-gray-900 truncate">{selectedAlertForModal.district}, {selectedAlertForModal.state}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-2.5 shadow-xs">
                    <div className="flex items-center gap-1.5 text-gray-600 text-[11px]">
                      <CloudRain size={13} className="text-sky-700" />
                      <span>24h Rainfall</span>
                    </div>
                    <p className="mt-1 font-bold text-sky-900 font-mono">{selectedAlertForModal.rainfallMm} mm</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-2.5 col-span-2 sm:col-span-1 shadow-xs">
                    <div className="flex items-center gap-1.5 text-gray-600 text-[11px]">
                      <Activity size={13} className="text-amber-700" />
                      <span>Soil Moisture</span>
                    </div>
                    <p className="mt-1 font-bold text-amber-900 font-mono">{selectedAlertForModal.soilSaturation}% (Saturated)</p>
                  </div>
                </div>

                {/* Evacuation & Corridor Directive */}
                {selectedAlertForModal.evacuationRoute && (
                  <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-xs">
                    <span className="font-bold text-emerald-900 uppercase tracking-wider block mb-1">
                      Designated Safe Corridor / Action:
                    </span>
                    <p className="text-gray-900 font-medium">{selectedAlertForModal.evacuationRoute}</p>
                  </div>
                )}

                {/* Footer Assurance */}
                <div className="border-t border-rose-200/60 pt-3 flex flex-wrap items-center justify-between text-[11px] text-gray-600">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                    <CheckCircle2 size={13} />
                    <span>Delivered via BHOOMI AI Automated Telemetry Gateway</span>
                  </div>
                  <span className="font-mono text-gray-500">Ref: {selectedAlertForModal.id}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/80 px-5 py-3">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Clock size={13} className="text-emerald-700" />
                <span>24x7 Continuous InSAR &amp; Sensor Vigil</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-100 transition cursor-pointer shadow-xs"
                >
                  <Download size={13} />
                  <span>Print Sitrep</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedAlertForModal(null)}
                  className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition cursor-pointer shadow-xs"
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
