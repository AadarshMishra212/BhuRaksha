import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  ShieldCheck,
  User as UserIcon,
  Lock,
  Building2,
  MapPin,
  Radio,
  Users,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  Mail,
  BellRing,
  CheckCircle2,
  Zap,
  Info,
  Send,
} from 'lucide-react'
import { useStore } from '../store/AppStore'
import { AppFooter } from '../components/AppFooter'
import type { Role } from '../types'

const ROLE_OPTIONS: {
  id: Role
  title: string
  subtitle: string
  agency: string
  posting: string
  icon: typeof ShieldCheck
}[] = [
  {
    id: 'ndma',
    title: 'NDMA Central Command',
    subtitle: 'National Apex Situation & Early Warning',
    agency: 'NDMA / MDoNER Joint Operations',
    posting: 'NE SEOC, Guwahati',
    icon: ShieldCheck,
  },
  {
    id: 'district',
    title: 'District SEOC / DEOC',
    subtitle: 'District Administration & Incident Dispatch',
    agency: 'District Disaster Management Authority',
    posting: 'East Khasi Hills, Meghalaya',
    icon: Building2,
  },
  {
    id: 'field',
    title: 'Field Response & Geotech',
    subtitle: 'Slope Inspection & SDRF Column',
    agency: 'BRO / State PWD Slope Cell',
    posting: 'NH-10, North Sikkim',
    icon: Radio,
  },
  {
    id: 'citizen',
    title: 'Citizen & Village Watch',
    subtitle: 'Community Reporting & Local Alerts',
    agency: 'Village Disaster Management Committee',
    posting: 'Kohima Rural, Nagaland',
    icon: Users,
  },
]

const POPULAR_DOMAINS = ['@gmail.com', '@outlook.com', '@yahoo.com', '@hotmail.com', '@icloud.com']

export function LoginPage() {
  const { user, login } = useStore()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selectedRole, setSelectedRole] = useState<Role>('ndma')
  const [showPassword, setShowPassword] = useState(false)
  const [enableEmailAlerts, setEnableEmailAlerts] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (user) return <Navigate to="/" replace />

  const currentRoleMeta = ROLE_OPTIONS.find((r) => r.id === selectedRole) || ROLE_OPTIONS[0]

  function appendDomain(domain: string) {
    if (!email) {
      setEmail(`user${domain}`)
    } else if (email.includes('@')) {
      const prefix = email.split('@')[0]
      setEmail(`${prefix}${domain}`)
    } else {
      setEmail(`${email.trim()}${domain}`)
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const trimmedName = name.trim()
    const trimmedEmail = email.trim()
    const trimmedPassword = password.trim()

    if (!trimmedName) {
      setError('Please enter your surname or officer name to proceed.')
      return
    }

    if (!trimmedEmail) {
      setError('Please provide your email address so BHOOMI can send upcoming emergency alerts.')
      return
    }

    // Accepts any standard email format (Gmail, Yahoo, Outlook, Hotmail, Proton, Work, Personal, etc.)
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(trimmedEmail)) {
      setError('Please enter a valid email address (e.g. name@gmail.com, name@yahoo.com, name@outlook.com, etc.).')
      return
    }

    if (!trimmedPassword) {
      setError('Please enter your password / security access key.')
      return
    }

    setIsSubmitting(true)
    try {
      const msg = await login(
        trimmedName,
        trimmedPassword,
        trimmedEmail,
        selectedRole,
        currentRoleMeta.agency,
        currentRoleMeta.posting,
        enableEmailAlerts,
      )
      if (msg) {
        setError(msg)
        setIsSubmitting(false)
        return
      }
      navigate('/')
    } catch {
      setError('Authentication encountered an error. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-command text-ink selection:bg-lime/30 selection:text-ink">
      <div className="scan-grid grid flex-1 lg:grid-cols-12">
        {/* Left Side: Brand & Situational Overview */}
        <div className="relative hidden overflow-hidden border-r border-lime/15 lg:col-span-6 lg:flex lg:flex-col lg:justify-between p-10 xl:p-14">
          <img
            src="/logo.jpg"
            alt="BHURAKSHA landscape emblem"
            className="absolute inset-0 h-full w-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-command via-command/85 to-command/55 backdrop-blur-[2px]" />

          {/* Top Brand Tag */}
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <img
                src="/logo.jpg"
                alt="Emblem"
                className="h-12 w-12 rounded-full object-cover ring-2 ring-lime/50 shadow-lg shadow-lime/20"
              />
              <div>
                <p className="text-[11px] font-bold tracking-[0.25em] text-lime uppercase">
                  MINISTRY OF DEVELOPMENT OF NORTH EASTERN REGION
                </p>
                <p className="text-xs text-muted">Government of India &bull; NDMA Joint Early Warning Cell</p>
              </div>
            </div>
          </div>

          {/* Center Vision & Bhoomi Alert Pipeline Card */}
          <div className="relative z-10 my-auto py-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-lime/30 bg-lime/10 px-3 py-1 text-xs font-semibold text-lime">
              <Sparkles size={14} />
              <span>Multi-Hazard 24x7 Landslide Early Warning Network</span>
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl xl:text-5xl leading-tight">
              North Eastern Region <span className="text-lime">Landslide Situation</span> &amp; Early Warning Desk
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
              Unified real-time intelligence fusing rainfall nowcasts, InSAR slope displacement models, soil saturation
              sensors, and corridor risk telemetry across all 8 Northeastern hill states.
            </p>

            {/* BHOOMI Automated Email Dispatch Box */}
            <div className="mt-6 rounded-xl border border-lime/30 bg-panel/80 p-4 shadow-xl backdrop-blur-md">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-lime/20 p-2 text-lime ring-1 ring-lime/40">
                  <Mail size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-lime flex items-center gap-1.5">
                      <span>BHOOMI AI Automated Alert Dispatch</span>
                      <span className="inline-block h-2 w-2 rounded-full bg-lime animate-ping" />
                    </h3>
                    <span className="rounded bg-lime/15 px-2 py-0.5 text-[10px] font-mono font-bold text-lime border border-lime/25">
                      ALL EMAILS SUPPORTED
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-ink/80">
                    When slope deformation or precipitation exceeds critical threshold (70%+ probability),{' '}
                    <strong>BHOOMI AI automatically dispatches emergency nowcasts, rainfall metrics, and evacuation corridors directly to your registered email ID (Gmail, Outlook, Yahoo, iCloud, or any email).</strong>
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-lime/15 text-[11px] text-muted">
                    <span className="inline-flex items-center gap-1 text-ink/90">
                      <Zap size={12} className="text-lime" /> Instant Push
                    </span>
                    <span>&bull;</span>
                    <span className="inline-flex items-center gap-1 text-ink/90">
                      <Send size={12} className="text-lime" /> Any Email Provider
                    </span>
                    <span>&bull;</span>
                    <span className="inline-flex items-center gap-1 text-ink/90">
                      <BellRing size={12} className="text-lime" /> Mobile Ready
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Strategic Stats */}
            <div className="mt-6 grid grid-cols-3 gap-3 border-t border-lime/15 pt-5">
              <div className="rounded-lg border border-lime/10 bg-panel/60 p-2.5">
                <p className="text-lg font-bold font-mono text-lime">8 States</p>
                <p className="text-[10px] text-muted">Active Monitoring</p>
              </div>
              <div className="rounded-lg border border-lime/10 bg-panel/60 p-2.5">
                <p className="text-lg font-bold font-mono text-lime">75+ Nodes</p>
                <p className="text-[10px] text-muted">IoT &amp; Rain Gauges</p>
              </div>
              <div className="rounded-lg border border-lime/10 bg-panel/60 p-2.5">
                <p className="text-lg font-bold font-mono text-lime">Direct Email</p>
                <p className="text-[10px] text-muted">Bhoomi AI Delivery</p>
              </div>
            </div>
          </div>

          {/* Bottom Security Notice */}
          <div className="relative z-10 flex items-center justify-between text-xs text-muted">
            <span>🛡️ SEOC Protocol v4.2 &bull; SSL Secured</span>
            <span className="font-mono text-lime/80">SECTOR: NER-COMMAND-HQ</span>
          </div>
        </div>

        {/* Right Side: Authentication Portal */}
        <div className="flex flex-col justify-center px-6 py-8 sm:px-12 lg:col-span-6 xl:px-16 overflow-y-auto">
          <div className="mx-auto w-full max-w-lg">
            {/* Mobile Header Logo */}
            <div className="mb-5 flex items-center gap-3 lg:hidden">
              <img
                src="/logo.jpg"
                alt="BHURAKSHA"
                className="h-11 w-11 rounded-full object-cover ring-2 ring-lime/50"
              />
              <div>
                <h2 className="text-lg font-bold tracking-wider text-lime">BHURAKSHA SEOC</h2>
                <p className="text-xs text-muted">North Eastern Region Early Warning Desk</p>
              </div>
            </div>

            {/* Title Section */}
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-lime/15 px-2 py-0.5 text-[10px] font-bold tracking-wider text-lime uppercase border border-lime/30">
                  SEOC ACCESS PORTAL
                </span>
                <span className="text-xs text-muted">&bull; 24x7 Operations</span>
              </div>
              <h2 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">Sign in to Command Floor</h2>
              <p className="mt-1 text-xs sm:text-sm text-muted">
                Enter your details and any valid <strong>email address</strong> to receive upcoming Bhoomi AI landslide warnings and emergency sitreps.
              </p>
            </div>

            {/* Main Login Form */}
            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              {/* Officer Surname / Full Name */}
              <div>
                <label className="block text-xs font-semibold tracking-wider text-muted uppercase">
                  Surname / Officer Full Name
                </label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted">
                    <UserIcon size={16} />
                  </div>
                  <input
                    type="text"
                    required
                    className="w-full rounded-lg border border-lime/25 bg-panel pl-9 pr-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/60 focus:border-lime focus:ring-1 focus:ring-lime"
                    placeholder="e.g. Sharma, Barman, Roy, Bhutia, Sangma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    autoFocus
                  />
                </div>
              </div>

              {/* Email Address Input (Accepts all email types) */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold tracking-wider text-lime uppercase flex items-center gap-1.5">
                    <Mail size={13} className="text-lime" />
                    <span>Email ID (For Bhoomi AI Alerts)</span>
                  </label>
                  <span className="text-[10px] text-muted">Gmail, Outlook, Yahoo, etc.</span>
                </div>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-lime">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    required
                    className="w-full rounded-lg border border-lime/40 bg-panel pl-9 pr-24 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/60 focus:border-lime focus:ring-1 focus:ring-lime shadow-inner"
                    placeholder="e.g. yourname@gmail.com, name@outlook.com, user@yahoo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="rounded bg-lime/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-lime border border-lime/25">
                      ALERT EMAIL
                    </span>
                  </div>
                </div>

                {/* Quick Domain Suffix Helpers */}
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-muted">Quick add:</span>
                  {POPULAR_DOMAINS.map((domain) => (
                    <button
                      key={domain}
                      type="button"
                      onClick={() => appendDomain(domain)}
                      className="rounded border border-lime/20 bg-command/80 px-1.5 py-0.5 font-mono text-[10px] text-lime hover:bg-lime/15 hover:border-lime/40 transition cursor-pointer"
                    >
                      {domain}
                    </button>
                  ))}
                </div>

                <div className="mt-1 flex items-start gap-1.5 text-[11px] text-muted">
                  <Info size={13} className="text-lime shrink-0 mt-0.5" />
                  <span>
                    BHOOMI AI will dispatch live landslide nowcasts &amp; rainfall warnings directly to this email address.
                  </span>
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-xs font-semibold tracking-wider text-muted uppercase">
                  Password / Security Key
                </label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="w-full rounded-lg border border-lime/25 bg-panel pl-9 pr-10 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/60 focus:border-lime focus:ring-1 focus:ring-lime"
                    placeholder="Enter your security password or raksha2026"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted hover:text-ink transition cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Duty Role Selector */}
              <div>
                <label className="block text-xs font-semibold tracking-wider text-muted uppercase mb-1">
                  Duty Desk / Command Tier
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {ROLE_OPTIONS.map((opt) => {
                    const Icon = opt.icon
                    const isSelected = selectedRole === opt.id
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedRole(opt.id)}
                        className={`flex flex-col items-start rounded-lg border p-2.5 text-left transition cursor-pointer ${
                          isSelected
                            ? 'border-lime bg-lime/15 shadow-sm shadow-lime/20'
                            : 'border-lime/15 bg-panel/70 hover:border-lime/40 hover:bg-panel'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Icon size={13} className={isSelected ? 'text-lime' : 'text-muted'} />
                          <span
                            className={`text-xs font-semibold ${isSelected ? 'text-lime font-bold' : 'text-ink/90'}`}
                          >
                            {opt.title}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[10px] text-muted leading-tight line-clamp-1">{opt.subtitle}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Bhoomi Email Alerts Preference Checkbox */}
              <div className="rounded-lg border border-lime/25 bg-lime/5 p-3">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableEmailAlerts}
                    onChange={(e) => setEnableEmailAlerts(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-lime/40 bg-panel text-lime accent-lime"
                  />
                  <div>
                    <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-lime" />
                      <span>Receive Live Bhoomi AI Landslide Alerts via Email</span>
                    </span>
                    <p className="text-[11px] text-muted leading-relaxed mt-0.5">
                      Automatically receive high-risk slope nowcasts, IMD rainfall warnings, and road blockage alerts to{' '}
                      <span className="text-lime font-mono">{email || 'your registered email ID'}</span>.
                    </p>
                  </div>
                </label>
              </div>

              {/* Station Info Chip */}
              <div className="flex items-center gap-2 rounded-lg border border-lime/15 bg-panel/40 px-3 py-2 text-xs text-muted">
                <MapPin size={13} className="text-lime shrink-0" />
                <span className="truncate">
                  <strong className="text-ink/90 font-medium">{currentRoleMeta.agency}</strong> &bull;{' '}
                  {currentRoleMeta.posting}
                </span>
              </div>

              {/* Error Display */}
              {error && (
                <div className="rounded-lg border border-alert/40 bg-alert/15 px-3 py-2 text-xs font-semibold text-alert">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="group flex w-full items-center justify-center gap-2 rounded-lg bg-lime px-4 py-3 text-sm font-bold text-command transition-all hover:bg-[#b6de7d] active:scale-[0.99] disabled:opacity-60 shadow-lg shadow-lime/20 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Initializing Command Floor &amp; Email Alerts...</span>
                ) : (
                  <>
                    <span>Enter Command Floor &amp; Link Email</span>
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            {/* Bottom Security Note */}
            <div className="mt-6 border-t border-lime/10 pt-4 text-center">
              <p className="text-[11px] text-muted">
                Official National Early Warning Command System &bull; NDMA Disaster Management Act protocols apply.
              </p>
            </div>
          </div>
        </div>
      </div>
      <AppFooter />
    </div>
  )
}
