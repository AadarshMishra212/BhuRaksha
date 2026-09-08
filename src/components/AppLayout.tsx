import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  BrainCircuit,
  ChevronRight,
  CloudRain,
  Home,
  LogOut,
  Map,
  Menu,
  Radio,
  Satellite,
  Shield,
  Siren,
  Users,
  X,
  Mail,
} from 'lucide-react'
import { fmtClock, roleLabel } from '../lib/format'
import { useStore } from '../store/AppStore'
import { AppFooter } from './AppFooter'
import { AiChatbot } from './AiChatbot'
import { BhoomiEmailNotificationToast } from './BhoomiEmailAlertModal'

const NAV = [
  { to: '/', label: 'Command Center', icon: Home },
  { to: '/gis', label: 'GIS Operations', icon: Map },
  { to: '/ai', label: 'BHOOMI', icon: BrainCircuit },
  { to: '/alerts', label: 'Early Warning', icon: Siren },
  { to: '/sensors', label: 'Sensors & Feeds', icon: Satellite },
  { to: '/weather', label: 'IMD Weather', icon: CloudRain },
  { to: '/field', label: 'Field Intelligence', icon: Radio },
  { to: '/response', label: 'Response Desk', icon: Shield },
  { to: '/communities', label: 'Villages & Roads', icon: Users },
]

export function AppLayout() {
  const { user, logout, live, toggleLive, alerts } = useStore()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [clock, setClock] = useState(fmtClock())

  useEffect(() => {
    const id = window.setInterval(() => setClock(fmtClock()), 1000)
    return () => window.clearInterval(id)
  }, [])

  if (!user) return null

  const liveAlerts = alerts.filter((a) => !a.acknowledged)
  const ticker = [...alerts, ...alerts].slice(0, 24)

  return (
    <div className="flex min-h-screen flex-col bg-command text-ink">
      {/* Top Header & Navigation Bar */}
      <header className="no-print sticky top-0 z-40 w-full border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur-md">
        {/* Tier 1: System Identification & Operational Desks */}
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-2.5 lg:px-6">
          {/* Logo & Emblem Brand Area */}
          <div className="flex items-center gap-3">
            <img
              src="/logo.jpg"
              alt="BHURAKSHA Emblem"
              className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-emerald-500/40 shadow-sm"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-[0.22em] text-gray-900 sm:text-lg">BHURAKSHA</span>
                <span className="hidden rounded bg-emerald-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-700 sm:inline-block border border-emerald-200">
                  SEOC-NER
                </span>
              </div>
              <p className="text-[10px] tracking-wider text-muted font-medium">
                National Landslide Early Warning &amp; Operations Command
              </p>
            </div>
          </div>

          {/* Center: Live Status & Clock */}
          <div className="hidden items-center gap-4 md:flex">
            <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs">
              <span className={`h-2 w-2 rounded-full ${live ? 'pulse-dot bg-alert' : 'bg-muted'}`} />
              <span className="font-mono text-muted">{clock} IST</span>
              <span className="text-gray-300">|</span>
              <span className="font-medium text-gray-800">MDoNER &bull; NDMA Cell</span>
            </div>
          </div>

          {/* Right: Controls & User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={toggleLive}
              className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
                live
                  ? 'border-alert/30 bg-alert/10 text-alert hover:bg-alert/20'
                  : 'border-emerald-500/30 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
              title="Toggle live automated telemetry updates"
            >
              {live ? 'Pause Stream' : 'Resume Stream'}
            </button>

            <div className="hidden text-right xl:block border-l border-gray-200 pl-3">
              <div className="flex items-center justify-end gap-1.5">
                <p className="text-xs font-semibold text-gray-900">{user.name}</p>
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="flex items-center justify-end gap-1 text-[10px] text-emerald-600 font-mono">
                <Mail size={11} className="text-emerald-600" />
                <span className="truncate max-w-[180px]">{user.email || 'alerts@gmail.com'}</span>
              </div>
              <p className="text-[10px] text-muted">
                {roleLabel(user.role)} &bull; {user.posting}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                logout()
                navigate('/login')
              }}
              className="flex items-center gap-1 rounded-lg border border-alert/30 bg-alert/5 p-1.5 text-alert transition hover:bg-alert/15 hover:border-alert"
              title="Sign out of SEOC floor"
              aria-label="Sign out"
            >
              <LogOut size={16} />
              <span className="hidden text-xs font-medium sm:inline">Exit</span>
            </button>

            {/* Mobile menu button */}
            <button
              className="rounded-lg border border-gray-200 p-1.5 text-gray-700 hover:bg-gray-100 lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Tier 2: Top Horizontal Control Panel / Navigation Tabs */}
        <div className="hidden overflow-x-auto no-scrollbar border-t border-gray-100 bg-gray-50/70 px-4 py-1.5 lg:block">
          <nav className="flex items-center gap-1">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-2 whitespace-nowrap rounded-md px-3.5 py-1.5 text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                      : 'text-gray-600 hover:bg-gray-200/70 hover:text-gray-900'
                  }`
                }
              >
                <item.icon size={15} className="shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Mobile Dropdown Navigation Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-gray-200 bg-white p-3 lg:hidden shadow-lg">
            <nav className="grid grid-cols-1 gap-1 sm:grid-cols-2">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
                      isActive ? 'bg-emerald-600 text-white font-semibold' : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  <item.icon size={16} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Main Command Floor Canvas */}
      <main className="scan-grid flex-1 p-4 pb-20 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[1920px]">
          <Outlet />
        </div>
      </main>

      {/* Authoritative SEOC Footer */}
      <div className="pb-16">
        <AppFooter />
      </div>

      {/* Bottom Early Warning & Alerts Stream Dock */}
      <div className="no-print fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur-md shadow-2xl">
        <div className="flex items-center gap-3 px-3 py-2 sm:px-4">
          {/* Alert Status Pill */}
          <div className="flex shrink-0 items-center gap-2 rounded-md border border-alert/40 bg-alert/15 px-2.5 py-1">
            <AlertTriangle size={15} className="text-alert pulse-dot" />
            <span className="font-mono text-[11px] font-bold tracking-wider text-alert uppercase">
              EARLY WARNING STREAM
            </span>
            <span className="rounded bg-alert/25 px-1.5 py-0.2 font-mono text-[10px] font-bold text-alert">
              {liveAlerts.length} OPEN
            </span>
          </div>

          {/* Marquee Ticker (Hover to Pause) */}
          <div className="overflow-hidden whitespace-nowrap flex-1">
            <div className="ticker inline-flex gap-8 text-xs font-mono text-ink/90 cursor-pointer">
              {ticker.map((a, i) => (
                <span
                  key={`${a.id}-${i}`}
                  className="inline-flex items-center gap-2 rounded bg-white/5 px-2.5 py-0.5 border border-white/5 hover:border-lime/40"
                >
                  <span
                    className={`inline-block h-1.5 w-1.5 rounded-full ${
                      a.severity === 'Critical'
                        ? 'bg-alert'
                        : a.severity === 'High'
                          ? 'bg-warn'
                          : 'bg-info'
                    }`}
                  />
                  <span className="font-semibold text-lime">{a.zoneName}:</span>
                  <span className="text-ink">{a.title}</span>
                  <span className="text-muted text-[10px]">[{a.severity.toUpperCase()}]</span>
                </span>
              ))}
            </div>
          </div>

          {/* Quick Action to Full Alerts Dashboard */}
          <NavLink
            to="/alerts"
            className="hidden sm:flex shrink-0 items-center gap-1 rounded border border-lime/30 bg-lime/10 px-3 py-1 font-mono text-xs font-semibold text-lime hover:bg-lime/20 transition"
          >
            <span>Alert Desk</span>
            <ChevronRight size={13} />
          </NavLink>
        </div>
      </div>

      {/* Omnipresent AI Assistant Widget */}
      <AiChatbot />

      {/* Bhoomi AI Gmail Alert Dispatch Banner & Email Modal */}
      <BhoomiEmailNotificationToast />
    </div>
  )
}
