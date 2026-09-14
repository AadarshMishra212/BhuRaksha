import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
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
  Play,
} from 'lucide-react'
import { fmtClock, roleLabel } from '../lib/format'
import { useStore } from '../store/useStore'
import { AppFooter } from './AppFooter'
import { AiChatbot } from './AiChatbot'
import { BhoomiEmailNotificationToast } from './BhoomiEmailAlertModal'

const NAV_ITEMS = [
  { to: '/', label: 'Command Center', iconName: 'dashboard', lucideIcon: Home },
  { to: '/gis', label: 'Geospatial Map', iconName: 'map', lucideIcon: Map },
  { to: '/ai', label: 'BHOOMI Consequence', iconName: 'psychology', lucideIcon: BrainCircuit },
  { to: '/alerts', label: 'Early Warning Grid', iconName: 'emergency', lucideIcon: Siren },
  { to: '/sensors', label: 'Sensors & Feeds', iconName: 'satellite_alt', lucideIcon: Satellite },
  { to: '/weather', label: 'IMD Doppler Weather', iconName: 'cloud', lucideIcon: CloudRain },
  { to: '/field', label: 'Field Intelligence', iconName: 'cell_tower', lucideIcon: Radio },
  { to: '/response', label: 'Response Desk', iconName: 'verified', lucideIcon: Shield },
  { to: '/communities', label: 'Villages & Corridors', iconName: 'groups', lucideIcon: Users },
]

export function AppLayout() {
  const {
    user,
    logout,
    live,
    toggleLive,
    alerts,
    zones,
    selectZone,
    theme,
    toggleTheme,
    actions,
    reports,
  } = useStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('bhuraksha_sidebar_collapsed') === 'true'
    } catch {
      return false
    }
  })
  const [clock, setClock] = useState(fmtClock())
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<typeof zones>([])
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    const id = window.setInterval(() => setClock(fmtClock()), 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setProfileOpen(false)
      }
    }
    if (profileOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [profileOpen])

  useEffect(() => {
    setMobileMenuOpen(false)
    setProfileOpen(false)
  }, [location.pathname])

  if (!user) return null

  const liveAlerts = alerts.filter((a) => !a.acknowledged)
  const ticker = [...alerts, ...alerts].slice(0, 24)

  function handleToggleSidebar() {
    setSidebarCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('bhuraksha_sidebar_collapsed', String(next))
      } catch {
        // ignore
      }
      return next
    })
  }

  function handleSearch(q: string) {
    setSearchQuery(q)
    if (!q.trim()) {
      setSearchResults([])
      setSearchOpen(false)
      return
    }
    const filtered = zones.filter(
      (z) =>
        z.name.toLowerCase().includes(q.toLowerCase()) ||
        z.district.toLowerCase().includes(q.toLowerCase()) ||
        z.state.toLowerCase().includes(q.toLowerCase()) ||
        z.corridor.toLowerCase().includes(q.toLowerCase()),
    )
    setSearchResults(filtered.slice(0, 5))
    setSearchOpen(true)
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body-base flex">
      {/* Sidebar Navigation - Desktop (Collapsible between full w-64 and icon-rail w-16) */}
      <aside
        className={`fixed left-0 top-0 bottom-0 z-50 hidden flex-col justify-between border-r border-surface-container-high/80 bg-surface-container-low pt-space-md pb-space-md lg:flex transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className={`flex flex-col flex-1 overflow-y-auto ${sidebarCollapsed ? 'px-1.5 items-center' : 'px-space-sm'}`}>
          {/* Header Brand Section */}
          {!sidebarCollapsed ? (
            /* Expanded Brand Header */
            <div className="mb-space-md flex items-center justify-between gap-space-xs px-space-xs w-full">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  onClick={handleToggleSidebar}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-on-primary shadow-xs shrink-0 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                  title="Collapse to Icon Bar"
                  aria-label="Collapse Sidebar"
                >
                  <span className="material-symbols-outlined text-[18px]">shield</span>
                </button>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-headline-lg font-bold text-primary tracking-tight text-base truncate">BhuRaksha</span>
                    <span className="rounded bg-surface-container-highest px-1.5 py-0.2 font-label-caps text-[8.5px] font-bold text-primary shrink-0">
                      SEOC-NER
                    </span>
                  </div>
                  <p className="text-[10.5px] text-on-surface-variant font-caption truncate">
                    Landslide Early Warning System
                  </p>
                </div>
              </div>

              {/* Collapse to Icon Rail Button */}
              <button
                type="button"
                onClick={handleToggleSidebar}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-outline hover:bg-surface-container-high hover:text-on-surface transition-colors cursor-pointer shrink-0"
                title="Collapse to Icon Bar"
                aria-label="Collapse to Icon Bar"
              >
                <span className="material-symbols-outlined text-[17px]">left_panel_close</span>
              </button>
            </div>
          ) : (
            /* Collapsed Icon-Rail Header - Blue Shield Icon button only (Opens/Closes sidebar) */
            <div className="mb-space-md flex items-center justify-center w-full">
              <button
                type="button"
                onClick={handleToggleSidebar}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-on-primary shadow-xs transition-all hover:scale-105 active:scale-95 hover:shadow-md cursor-pointer group"
                title="Expand Sidebar (Click to Open)"
                aria-label="Expand Sidebar"
              >
                <span className="material-symbols-outlined text-[19px] transition-transform group-hover:scale-110">shield</span>
              </button>
            </div>
          )}

          {/* Navigation Items List (Icons always visible) */}
          <nav className={`flex-1 space-y-1 w-full ${sidebarCollapsed ? 'flex flex-col items-center' : ''}`}>
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                title={sidebarCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center rounded-lg transition-all ${
                    sidebarCollapsed
                      ? `h-9 w-9 justify-center ${
                          isActive
                            ? 'bg-primary-container text-on-primary-container font-semibold shadow-2xs ring-1 ring-primary/30'
                            : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                        }`
                      : `gap-2 px-2.5 py-1.5 text-xs font-medium ${
                          isActive
                            ? 'bg-primary-container text-on-primary-container font-semibold shadow-2xs'
                            : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                        }`
                  }`
                }
              >
                <span className="material-symbols-outlined text-[18px] shrink-0">{item.iconName}</span>
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* User Profile & Logout Section (Bottom) */}
        {!sidebarCollapsed ? (
          /* Expanded Footer Profile */
          <div className="mt-space-sm border-t border-surface-container-high/80 pt-space-sm px-space-md w-full">
            <div className="flex items-center justify-between gap-space-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-on-primary-fixed font-bold text-[11px]">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-on-surface">{user.name}</p>
                  <p className="truncate text-[9.5px] text-outline font-caption">{roleLabel(user.role)}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  logout()
                  navigate('/login')
                }}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-outline hover:bg-error-container hover:text-on-error-container transition-colors cursor-pointer"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        ) : (
          /* Collapsed Icon-Rail Footer Profile */
          <div className="mt-space-sm border-t border-surface-container-high/80 pt-space-sm flex flex-col items-center gap-1.5 w-full">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-fixed text-on-primary-fixed font-bold text-[11px] shadow-2xs"
              title={`${user.name} (${roleLabel(user.role)})`}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <button
              type="button"
              onClick={() => {
                logout()
                navigate('/login')
              }}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-outline hover:bg-error-container hover:text-on-error-container transition-colors cursor-pointer"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer Sidebar */}
      {mobileMenuOpen && (
        <aside className="fixed left-0 top-0 bottom-0 z-50 flex w-72 flex-col justify-between border-r border-surface-container-high bg-surface-container-low p-space-lg lg:hidden shadow-2xl animate-in slide-in-from-left duration-200">
          <div className="flex flex-col flex-1 overflow-y-auto">
            <div className="mb-space-lg flex items-center justify-between">
              <div className="flex items-center gap-space-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-on-primary">
                  <span className="material-symbols-outlined text-[18px]">shield</span>
                </div>
                <span className="font-headline-lg font-bold text-primary tracking-tight">BhuRaksha</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-lg text-outline hover:bg-surface-container-high"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 space-y-1">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-space-sm px-space-md py-space-sm text-sm font-body-medium rounded-lg transition-all ${
                      isActive
                        ? 'bg-primary-container text-on-primary-container font-semibold'
                        : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                    }`
                  }
                >
                  <span className="material-symbols-outlined text-[20px]">{item.iconName}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="border-t border-surface-container-high pt-space-md">
            <button
              type="button"
              onClick={() => {
                logout()
                navigate('/login')
              }}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-error-container px-3 py-2 text-xs font-semibold text-on-error-container"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>
      )}

      {/* Main Container (dynamically adjusts margin when sidebar is expanded vs collapsed into icon rail) */}
      <div
        className={`flex min-w-0 flex-1 flex-col transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'
        }`}
      >
        {/* Top Header */}
        <header
          className={`fixed top-0 right-0 z-40 flex h-14 items-center justify-between border-b border-surface-container-high/80 bg-surface/90 px-space-sm sm:px-space-md backdrop-blur-xl shadow-[0_1px_6px_rgba(0,0,0,0.03)] transition-all duration-300 ease-in-out ${
            sidebarCollapsed ? 'left-0 lg:left-16 lg:px-space-lg' : 'left-0 lg:left-64 lg:px-space-lg'
          }`}
        >
          {/* Left: Mobile Toggle & Desktop Sidebar Toggle & Search Bar */}
          <div className="flex items-center gap-space-xs sm:gap-space-sm flex-1 max-w-xl">
            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-container-high text-on-surface-variant hover:bg-surface-container-high lg:hidden cursor-pointer"
              aria-label="Open Navigation Menu"
            >
              <Menu size={18} />
            </button>

            {/* Desktop Quick Toggle Sidebar Button */}
            <button
              type="button"
              onClick={handleToggleSidebar}
              className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg border border-surface-container-high bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all cursor-pointer shadow-2xs shrink-0"
              title={sidebarCollapsed ? 'Expand Sidebar Menu' : 'Collapse to Icon Bar'}
              aria-label="Toggle Sidebar"
            >
              <span className="material-symbols-outlined text-[17px] text-primary">
                {sidebarCollapsed ? 'left_panel_open' : 'left_panel_close'}
              </span>
            </button>

            {/* Search Input Bar */}
            <div className="relative w-full max-w-md">
              <div className="flex items-center gap-2 rounded-lg bg-surface-container-low px-2.5 py-1 border border-surface-container-high/60 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                <span className="material-symbols-outlined text-[15px] text-outline">search</span>
                <input
                  type="text"
                  placeholder="Search slopes, corridors, watch boxes..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => searchQuery && setSearchOpen(true)}
                  className="w-full bg-transparent text-xs text-on-surface outline-none placeholder:text-outline"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('')
                      setSearchResults([])
                      setSearchOpen(false)
                    }}
                    className="text-outline hover:text-on-surface"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Search Dropdown Results */}
              {searchOpen && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-surface-container-high bg-surface-container-lowest p-2 shadow-xl z-50">
                  <p className="px-2 py-1 font-label-caps text-[9.5px] text-outline">Matching Hazard Zones</p>
                  <ul className="space-y-1">
                    {searchResults.map((z) => (
                      <li key={z.id}>
                        <button
                          type="button"
                          onClick={() => {
                            selectZone(z.id)
                            setSearchOpen(false)
                            navigate('/gis')
                          }}
                          className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-surface-container-low transition"
                        >
                          <div>
                            <p className="font-semibold text-on-surface">{z.name}</p>
                            <p className="text-[10px] text-outline">
                              {z.district}, {z.state} &bull; {z.corridor}
                            </p>
                          </div>
                          <span
                            className={`rounded px-1.5 py-0.5 font-mono text-[9.5px] font-bold ${
                              z.severity === 'Critical'
                                ? 'bg-error-container text-on-error-container'
                                : z.severity === 'High'
                                  ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant'
                                  : 'bg-secondary-container text-on-secondary-container'
                            }`}
                          >
                            {z.severity}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Right: Live Telemetry Switch, Clock, Notifications & Theme Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Live Stream Toggle Button */}
            <button
              type="button"
              onClick={toggleLive}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition shadow-2xs cursor-pointer ${
                live
                  ? 'bg-error-container text-on-error-container hover:bg-error-container/80'
                  : 'bg-secondary-container text-on-secondary-container hover:bg-secondary-container/80'
              }`}
              title="Toggle Live IoT & Sensor Telemetry Feed"
            >
              {live ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-error animate-pulse" />
                  <span className="hidden sm:inline text-[11px]">Stream Live</span>
                </>
              ) : (
                <>
                  <Play size={11} className="text-secondary" />
                  <span className="hidden sm:inline text-[11px]">Stream Paused</span>
                </>
              )}
            </button>

            {/* Clock Pill */}
            <div className="hidden items-center gap-1 rounded-lg border border-surface-container-high bg-surface-container-low px-2 py-0.5 text-[11px] text-outline font-caption sm:flex">
              <span className="material-symbols-outlined text-[13px]">schedule</span>
              <span className="font-mono text-on-surface-variant">{clock}</span>
            </div>

            {/* Alert Notifications Icon */}
            <NavLink
              to="/alerts"
              className="relative flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
              title="View Open Early Warnings"
            >
              <span className="material-symbols-outlined text-[18px]">notifications</span>
              {liveAlerts.length > 0 && (
                <span className="absolute top-1 right-1 flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-error opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-error" />
                </span>
              )}
            </NavLink>

            {/* Theme Toggle Button (Light / Dark Theme) */}
            <button
              type="button"
              onClick={toggleTheme}
              className="relative flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all cursor-pointer border border-surface-container-high/70 bg-surface-container-low shadow-2xs"
              title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              aria-label="Toggle Light / Dark Theme"
            >
              {theme === 'dark' ? (
                <span className="material-symbols-outlined text-[17px] text-amber-300 transition-transform duration-300 hover:rotate-45">
                  light_mode
                </span>
              ) : (
                <span className="material-symbols-outlined text-[17px] text-primary transition-transform duration-300 hover:-rotate-45">
                  dark_mode
                </span>
              )}
            </button>

            {/* Officer Profile & Mini-Dashboard Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => {
                  setProfileOpen((prev) => !prev)
                  setSearchOpen(false)
                }}
                className={`group relative flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 cursor-pointer shadow-2xs focus:outline-hidden ${
                  profileOpen
                    ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface-container-lowest bg-primary text-on-primary scale-105 shadow-xs'
                    : 'bg-primary text-on-primary hover:scale-105 hover:shadow-xs'
                }`}
                title={`Officer Profile & Dashboard: ${user.name} (${roleLabel(user.role)})`}
                aria-label="Toggle Officer Profile and Dashboard Menu"
                aria-expanded={profileOpen}
              >
                {/* Officer Initial */}
                <span className="text-[11px] font-bold font-headline uppercase">
                  {user.name ? user.name.charAt(0) : 'O'}
                </span>

                {/* Live Active Duty Status Pulse Dot */}
                <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-surface-container-lowest" />
                </span>
              </button>

              {/* Dropdown Menu & Officer Personal Dashboard Card */}
              {profileOpen && (
                <div
                  className="absolute right-0 top-10 mt-1 w-80 sm:w-92 rounded-2xl border border-surface-container-high bg-surface-container-lowest shadow-2xl backdrop-blur-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                  role="menu"
                  aria-orientation="vertical"
                >
                  {/* Top Officer Identity Header */}
                  <div className="relative bg-gradient-to-br from-primary/15 via-primary-container/10 to-surface-container-high/30 p-3.5 border-b border-surface-container-high/80">
                    <div className="flex items-start gap-2.5">
                      <div className="relative shrink-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-on-primary text-base font-bold shadow-xs ring-2 ring-primary/30">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span
                          className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-surface-container-lowest shadow-xs"
                          title="Officer Duty Status: Online & Monitoring"
                        >
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="font-bold text-xs text-on-surface truncate font-headline">
                            {user.name}
                          </h4>
                          <span className="inline-flex shrink-0 items-center rounded bg-primary-fixed px-1.5 py-0.2 text-[8.5px] font-bold text-on-primary-fixed uppercase tracking-wider">
                            {roleLabel(user.role)}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-on-surface-variant font-medium line-clamp-1 mt-0.5">
                          {user.agency}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9.5px] text-outline font-caption">
                          <span className="flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[12px] text-primary">location_on</span>
                            <span className="truncate max-w-[130px]">{user.posting}</span>
                          </span>
                          <span className="flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[12px] text-secondary">verified</span>
                            <span className="truncate max-w-[130px]">{user.email}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Officer Command Stats & Telemetry Dashboard */}
                  <div className="p-2.5 bg-surface-container-low/50 border-b border-surface-container-high/60">
                    <div className="mb-1.5 flex items-center justify-between px-1">
                      <span className="text-[9px] font-bold font-label-caps tracking-wider text-outline uppercase">
                        Officer Operations Telemetry
                      </span>
                      <span className="flex items-center gap-1 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live Duty Active
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="rounded-lg border border-surface-container-high bg-surface-container-lowest p-2 shadow-2xs">
                        <div className="flex items-center justify-between text-outline">
                          <span className="text-[9.5px] font-medium font-caption">Command Queue</span>
                          <span className="material-symbols-outlined text-[14px] text-primary">military_tech</span>
                        </div>
                        <p className="mt-0.5 font-mono text-sm font-bold text-on-surface">
                          {actions.length} <span className="text-[9px] font-normal text-outline">Units</span>
                        </p>
                        <p className="text-[8.5px] text-outline truncate">Active Responders Tasked</p>
                      </div>

                      <div className="rounded-lg border border-surface-container-high bg-surface-container-lowest p-2 shadow-2xs">
                        <div className="flex items-center justify-between text-outline">
                          <span className="text-[9.5px] font-medium font-caption">Hazard Grid</span>
                          <span className="material-symbols-outlined text-[14px] text-error">emergency</span>
                        </div>
                        <p className="mt-0.5 font-mono text-sm font-bold text-error">
                          {liveAlerts.length} <span className="text-[9px] font-normal text-outline">Alerts</span>
                        </p>
                        <p className="text-[8.5px] text-outline truncate">
                          {alerts.filter((a) => a.severity === 'Critical').length} Critical Unresolved
                        </p>
                      </div>

                      <div className="rounded-lg border border-surface-container-high bg-surface-container-lowest p-2 shadow-2xs">
                        <div className="flex items-center justify-between text-outline">
                          <span className="text-[9.5px] font-medium font-caption">Ground Intel</span>
                          <span className="material-symbols-outlined text-[14px] text-secondary">cell_tower</span>
                        </div>
                        <p className="mt-0.5 font-mono text-sm font-bold text-on-surface">
                          {reports.length} <span className="text-[9px] font-normal text-outline">Sitreps</span>
                        </p>
                        <p className="text-[8.5px] text-outline truncate">Field Reports Filed</p>
                      </div>

                      <div className="rounded-lg border border-surface-container-high bg-surface-container-lowest p-2 shadow-2xs">
                        <div className="flex items-center justify-between text-outline">
                          <span className="text-[9.5px] font-medium font-caption">Monitored Zones</span>
                          <span className="material-symbols-outlined text-[14px] text-tertiary">terrain</span>
                        </div>
                        <p className="mt-0.5 font-mono text-sm font-bold text-on-surface">
                          {zones.length} <span className="text-[9px] font-normal text-outline">Sectors</span>
                        </p>
                        <p className="text-[8.5px] text-outline truncate">Active Landslide Slopes</p>
                      </div>
                    </div>
                  </div>

                  {/* Quick Command Navigation */}
                  <div className="p-1.5 border-b border-surface-container-high/60">
                    <p className="px-2 py-0.5 text-[9px] font-bold font-label-caps tracking-wider text-outline uppercase">
                      Command Console Shortcuts
                    </p>
                    <div className="space-y-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileOpen(false)
                          navigate('/response')
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-on-surface hover:bg-surface-container-high/70 transition cursor-pointer"
                      >
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                          <span className="material-symbols-outlined text-[14px]">verified</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11.5px] font-semibold text-on-surface">My Response Desk</p>
                          <p className="text-[9.5px] text-outline truncate">Coordinate SDRF / NDRF evacuation orders</p>
                        </div>
                        <ChevronRight size={12} className="text-outline shrink-0" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setProfileOpen(false)
                          navigate('/alerts')
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-on-surface hover:bg-surface-container-high/70 transition cursor-pointer"
                      >
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-error-container text-on-error-container">
                          <span className="material-symbols-outlined text-[14px]">emergency</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-[11.5px] font-semibold text-on-surface">Early Warning Dispatch</p>
                            {liveAlerts.length > 0 && (
                              <span className="rounded bg-error px-1 py-0.1 font-mono text-[8.5px] font-bold text-on-error">
                                {liveAlerts.length}
                              </span>
                            )}
                          </div>
                          <p className="text-[9.5px] text-outline truncate">Real-time alerts, sirens & CAP broadcast</p>
                        </div>
                        <ChevronRight size={12} className="text-outline shrink-0" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setProfileOpen(false)
                          navigate('/gis')
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-on-surface hover:bg-surface-container-high/70 transition cursor-pointer"
                      >
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-secondary-container text-on-secondary-container">
                          <span className="material-symbols-outlined text-[14px]">map</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11.5px] font-semibold text-on-surface">Geospatial Operations Map</p>
                          <p className="text-[9.5px] text-outline truncate">Interactive satellite, slope & corridor GIS</p>
                        </div>
                        <ChevronRight size={12} className="text-outline shrink-0" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setProfileOpen(false)
                          navigate('/field')
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-on-surface hover:bg-surface-container-high/70 transition cursor-pointer"
                      >
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-tertiary-fixed text-on-tertiary-fixed-variant">
                          <span className="material-symbols-outlined text-[14px]">cell_tower</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11.5px] font-semibold text-on-surface">Field Intelligence</p>
                          <p className="text-[9.5px] text-outline truncate">Ground observations, sensor checks & sitreps</p>
                        </div>
                        <ChevronRight size={12} className="text-outline shrink-0" />
                      </button>
                    </div>
                  </div>

                  {/* System & Telemetry Quick Toggles */}
                  <div className="p-2 bg-surface-container-low/40 border-b border-surface-container-high/60 flex items-center justify-between gap-1.5">
                    <button
                      type="button"
                      onClick={toggleTheme}
                      className="flex-1 flex items-center justify-center gap-1 rounded-md border border-surface-container-high bg-surface-container-lowest px-2 py-1 text-[10.5px] font-medium text-on-surface-variant hover:bg-surface-container-high/80 transition cursor-pointer shadow-2xs"
                    >
                      <span className="material-symbols-outlined text-[13px] text-primary">
                        {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                      </span>
                      <span>{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={toggleLive}
                      className={`flex-1 flex items-center justify-center gap-1 rounded-md border px-2 py-1 text-[10.5px] font-medium transition cursor-pointer shadow-2xs ${
                        live
                          ? 'border-error/30 bg-error-container/40 text-on-error-container'
                          : 'border-secondary/30 bg-secondary-container/40 text-on-secondary-container'
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-error animate-pulse' : 'bg-secondary'}`} />
                      <span>{live ? 'Stream ON' : 'Stream OFF'}</span>
                    </button>
                  </div>

                  {/* Dropdown Footer: Sign Out */}
                  <div className="p-2 bg-surface-container-lowest">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false)
                        logout()
                        navigate('/login')
                      }}
                      className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-error/20 bg-error-container/20 px-2.5 py-1.5 text-[11px] font-semibold text-error hover:bg-error-container hover:text-on-error-container transition-colors cursor-pointer"
                    >
                      <LogOut size={13} />
                      <span>End Shift & Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="scan-grid flex-1 pt-14 pb-20 min-h-screen">
          <div className="p-3 sm:p-5 max-w-[1920px] mx-auto w-full">
            <Outlet />
          </div>
        </main>

        {/* Authoritative SEOC Footer */}
        <div className="pb-12">
          <AppFooter />
        </div>

        {/* Bottom Early Warning & Alerts Stream Dock */}
        <div
          className={`no-print fixed bottom-0 right-0 z-40 border-t border-surface-container-high bg-surface-container-lowest/95 px-space-sm py-1 backdrop-blur-xl shadow-2xl transition-all duration-300 ease-in-out ${
            sidebarCollapsed ? 'left-0 lg:left-16' : 'left-0 lg:left-64'
          }`}
        >
          <div className="flex items-center gap-2">
            {/* Alert Status Pill */}
            <div className="flex shrink-0 items-center gap-1 rounded-md border border-error/30 bg-error-container/60 px-2 py-0.5">
              <span className="material-symbols-outlined text-error text-[13px] pulse-dot">emergency</span>
              <span className="font-label-caps text-[9px] font-bold text-error">
                EARLY WARNING
              </span>
              <span className="rounded bg-error px-1 py-0.1 font-mono text-[9px] font-bold text-on-error">
                {liveAlerts.length}
              </span>
            </div>

            {/* Marquee Ticker */}
            <div className="overflow-hidden whitespace-nowrap flex-1">
              <div className="ticker inline-flex gap-6 text-[11px] font-mono text-on-surface cursor-pointer">
                {ticker.map((a, i) => (
                  <span
                    key={`${a.id}-${i}`}
                    className="inline-flex items-center gap-1.5 rounded bg-surface-container-low px-2 py-0.5 border border-surface-container-high hover:border-primary transition-colors"
                  >
                    <span
                      className={`inline-block h-1.5 w-1.5 rounded-full ${
                        a.severity === 'Critical'
                          ? 'bg-error'
                          : a.severity === 'High'
                            ? 'bg-tertiary'
                            : 'bg-primary'
                      }`}
                    />
                    <span className="font-semibold text-primary">{a.zoneName}:</span>
                    <span className="text-on-surface">{a.title}</span>
                    <span className="text-outline text-[9px]">[{a.severity.toUpperCase()}]</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Quick Action to Alerts Page */}
            <NavLink
              to="/alerts"
              className="hidden sm:flex shrink-0 items-center gap-1 rounded-md border border-primary/30 bg-primary-fixed px-2 py-0.5 font-label-caps text-[9px] text-on-primary-fixed font-bold hover:bg-primary-fixed-dim transition"
            >
              <span>Alert Desk</span>
              <ChevronRight size={11} />
            </NavLink>
          </div>
        </div>

        {/* Omnipresent AI Assistant Widget */}
        <AiChatbot />

        {/* Bhoomi AI Alert Notification Toast */}
        <BhoomiEmailNotificationToast />
      </div>
    </div>
  )
}
