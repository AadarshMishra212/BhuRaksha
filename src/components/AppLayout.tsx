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
} from 'lucide-react'
import { fmtClock, roleLabel } from '../lib/format'
import { useStore } from '../store/AppStore'
import { AppFooter } from './AppFooter'
import { AiChatbot } from './AiChatbot'

const NAV = [
  { to: '/', label: 'Command Center', icon: Home },
  { to: '/gis', label: 'GIS Operations', icon: Map },
  { to: '/ai', label: 'AI Engine', icon: BrainCircuit },
  { to: '/alerts', label: 'Early Warning', icon: Siren },
  { to: '/sensors', label: 'Sensors & Feeds', icon: Satellite },
  { to: '/weather', label: 'IMD Weather', icon: CloudRain },
  { to: '/field', label: 'Field Intelligence', icon: Radio },
  { to: '/response', label: 'Response Desk', icon: Shield },
  { to: '/communities', label: 'Villages & Roads', icon: Users },
]

export function AppLayout() {
  const { user, logout, live, toggleLive, alerts, language, setLanguage } = useStore()
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
      <header className="no-print sticky top-0 z-40 w-full border-b border-lime/20 bg-[#071411]/95 shadow-xl backdrop-blur-md">
        {/* Tier 1: System Identification & Operational Desks */}
        <div className="flex items-center justify-between gap-3 border-b border-lime/10 px-4 py-2.5 lg:px-6">
          {/* Logo & Emblem Brand Area */}
          <div className="flex items-center gap-3">
            <img
              src="/logo.jpg"
              alt="BHURAKSHA Emblem"
              className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-lime/50 shadow-md shadow-lime/10"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-[0.2em] text-lime sm:text-lg">BHURAKSHA</span>
                <span className="hidden rounded bg-lime/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-lime sm:inline-block border border-lime/30">
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
            <div className="flex items-center gap-2 rounded-full border border-lime/20 bg-panel px-3 py-1 text-xs">
              <span className={`h-2 w-2 rounded-full ${live ? 'pulse-dot bg-alert' : 'bg-muted'}`} />
              <span className="font-mono text-muted">{clock} IST</span>
              <span className="text-lime/60">|</span>
              <span className="font-medium text-ink/90">MDoNER &bull; NDMA Cell</span>
            </div>
          </div>

          {/* Right: Controls & User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            <select
              aria-label="Alert language"
              className="rounded-lg border border-lime/20 bg-command px-2.5 py-1 text-xs font-medium text-ink outline-none transition focus:border-lime"
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'en' | 'hi' | 'as')}
            >
              <option value="en">EN (English)</option>
              <option value="hi">HI (हिन्दी)</option>
              <option value="as">AS (অসমীয়া)</option>
            </select>

            <button
              type="button"
              onClick={toggleLive}
              className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
                live
                  ? 'border-alert/40 bg-alert/10 text-alert hover:bg-alert/20'
                  : 'border-lime/40 bg-lime/10 text-lime hover:bg-lime/20'
              }`}
              title="Toggle live automated telemetry updates"
            >
              {live ? 'Pause Stream' : 'Resume Stream'}
            </button>

            <div className="hidden text-right xl:block border-l border-lime/15 pl-3">
              <p className="text-xs font-semibold text-ink">{user.name}</p>
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
              className="rounded-lg border border-lime/20 p-1.5 text-ink hover:bg-white/5 lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Tier 2: Top Horizontal Control Panel / Navigation Tabs */}
        <div className="hidden overflow-x-auto no-scrollbar border-t border-lime/10 bg-[#081713]/90 px-4 py-1 lg:block">
          <nav className="flex items-center gap-1">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-2 whitespace-nowrap rounded-md px-3.5 py-2 text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-lime/20 text-lime font-semibold border-b-2 border-lime shadow-[0_2px_12px_rgba(156,204,101,0.2)]'
                      : 'text-ink/80 hover:bg-white/5 hover:text-lime'
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
          <div className="border-t border-lime/15 bg-[#081713] p-3 lg:hidden">
            <nav className="grid grid-cols-1 gap-1 sm:grid-cols-2">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
                      isActive ? 'bg-lime/20 text-lime font-semibold' : 'text-ink/80 hover:bg-white/5'
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
      <div className="no-print fixed bottom-0 left-0 right-0 z-50 border-t border-alert/30 bg-[#05110e]/95 backdrop-blur-md shadow-2xl">
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
    </div>
  )
}
