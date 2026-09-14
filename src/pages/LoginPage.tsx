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
import { useStore } from '../store/useStore'
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

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(trimmedEmail)) {
      setError('Please enter a valid email address (e.g. name@gmail.com, name@outlook.com, name@yahoo.com, etc.).')
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
    <div className="flex min-h-screen flex-col bg-surface text-on-surface font-body-base">
      <div className="scan-grid grid flex-1 lg:grid-cols-12">
        {/* Left Side: Brand & Situational Overview */}
        <div className="relative hidden overflow-hidden border-r border-surface-container-high lg:col-span-6 lg:flex lg:flex-col lg:justify-between p-10 xl:p-14 bg-surface-container-low">
          {/* Top Brand Tag */}
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-on-primary shadow-md">
                <span className="material-symbols-outlined text-[28px]">shield</span>
              </div>
              <div>
                <p className="font-label-caps text-primary text-[11px] font-bold">
                  MINISTRY OF DEVELOPMENT OF NORTH EASTERN REGION
                </p>
                <p className="text-xs text-outline font-caption">Government of India &bull; NDMA Joint Early Warning Cell</p>
              </div>
            </div>
          </div>

          {/* Center Vision & Bhoomi Alert Pipeline Card */}
          <div className="relative z-10 my-auto py-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-fixed px-3 py-1 text-xs font-semibold text-on-primary-fixed">
              <Sparkles size={14} className="text-primary" />
              <span>Multi-Hazard 24x7 Landslide Early Warning Network</span>
            </div>
            <h1 className="mt-4 font-display-2xl text-3xl font-bold text-on-surface sm:text-4xl xl:text-5xl leading-tight">
              North Eastern Region <span className="text-primary">Landslide Situation</span> &amp; Early Warning Desk
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-on-surface-variant sm:text-base">
              Unified real-time intelligence fusing rainfall nowcasts, InSAR slope displacement models, soil saturation
              sensors, and corridor risk telemetry across all 8 Northeastern hill states.
            </p>

            {/* BHOOMI Automated Email Dispatch Box */}
            <div className="mt-6 rounded-xl border border-surface-container-high bg-surface-container-lowest p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-primary-fixed p-2.5 text-on-primary-fixed">
                  <Mail size={20} className="text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                      <span>BHOOMI AI Automated Alert Dispatch</span>
                      <span className="inline-block h-2 w-2 rounded-full bg-secondary animate-ping" />
                    </h3>
                    <span className="rounded bg-secondary-container px-2 py-0.5 font-mono text-[10px] font-bold text-on-secondary-container">
                      ALL EMAILS READY
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">
                    When slope deformation or precipitation exceeds critical threshold (70%+ probability),{' '}
                    <strong>BHOOMI AI automatically dispatches emergency nowcasts, rainfall metrics, and evacuation corridors directly to your registered email ID.</strong>
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-surface-container-high text-[11px] text-outline">
                    <span className="inline-flex items-center gap-1 text-on-surface font-medium">
                      <Zap size={12} className="text-primary" /> Instant Push
                    </span>
                    <span>&bull;</span>
                    <span className="inline-flex items-center gap-1 text-on-surface font-medium">
                      <Send size={12} className="text-secondary" /> Any Email Provider
                    </span>
                    <span>&bull;</span>
                    <span className="inline-flex items-center gap-1 text-on-surface font-medium">
                      <BellRing size={12} className="text-tertiary" /> Mobile Ready
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Strategic Stats */}
            <div className="mt-6 grid grid-cols-3 gap-3 border-t border-surface-container-high pt-5">
              <div className="rounded-lg border border-surface-container-high bg-surface-container-lowest p-3">
                <p className="font-mono-telemetry text-lg font-bold text-primary">8 States</p>
                <p className="font-label-caps text-[10px] text-outline mt-0.5">Active Monitoring</p>
              </div>
              <div className="rounded-lg border border-surface-container-high bg-surface-container-lowest p-3">
                <p className="font-mono-telemetry text-lg font-bold text-secondary">75+ Nodes</p>
                <p className="font-label-caps text-[10px] text-outline mt-0.5">IoT &amp; Rain Gauges</p>
              </div>
              <div className="rounded-lg border border-surface-container-high bg-surface-container-lowest p-3">
                <p className="font-mono-telemetry text-lg font-bold text-tertiary">Direct Email</p>
                <p className="font-label-caps text-[10px] text-outline mt-0.5">Bhoomi AI Delivery</p>
              </div>
            </div>
          </div>

          {/* Bottom Security Notice */}
          <div className="relative z-10 flex items-center justify-between text-xs text-outline">
            <span>🛡️ SEOC Protocol v4.2 &bull; 256-Bit Cryptographic SSL</span>
            <span className="font-mono text-primary font-semibold">SECTOR: NER-COMMAND-HQ</span>
          </div>
        </div>

        {/* Right Side: Authentication Portal */}
        <div className="flex flex-col justify-center px-6 py-8 sm:px-12 lg:col-span-6 xl:px-16 overflow-y-auto bg-surface">
          <div className="mx-auto w-full max-w-lg">
            {/* Mobile Header Logo */}
            <div className="mb-5 flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-on-primary">
                <span className="material-symbols-outlined text-[22px]">shield</span>
              </div>
              <div>
                <h2 className="font-headline-lg font-bold text-primary">BhuRaksha SEOC</h2>
                <p className="text-xs text-outline">North Eastern Region Early Warning Desk</p>
              </div>
            </div>

            {/* Title Section */}
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-primary-fixed px-2 py-0.5 font-label-caps text-[10px] font-bold text-on-primary-fixed">
                  SEOC ACCESS PORTAL
                </span>
                <span className="text-xs text-outline">&bull; 24x7 Operations</span>
              </div>
              <h2 className="mt-2 font-display-2xl text-2xl font-bold text-on-surface sm:text-3xl">Sign in to Command Floor</h2>
              <p className="mt-1 text-xs sm:text-sm text-on-surface-variant">
                Enter your credentials and email address to receive real-time BHOOMI AI landslide alerts.
              </p>
            </div>

            {/* Main Login Form */}
            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              {/* Officer Surname / Full Name */}
              <div>
                <label className="block font-label-caps text-outline text-[11px] mb-1">
                  Surname / Officer Full Name
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-outline">
                    <UserIcon size={16} />
                  </div>
                  <input
                    type="text"
                    required
                    className="w-full rounded-lg border border-surface-container-high bg-surface-container-lowest pl-9 pr-3 py-2.5 text-sm text-on-surface outline-none transition placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary shadow-xs"
                    placeholder="e.g. Sharma, Barman, Roy, Bhutia, Sangma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    autoFocus
                  />
                </div>
              </div>

              {/* Email Address Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-label-caps text-primary text-[11px] flex items-center gap-1.5">
                    <Mail size={13} className="text-primary" />
                    <span>Email ID (For Bhoomi AI Alerts)</span>
                  </label>
                  <span className="text-[10px] text-outline font-caption">Gmail, Outlook, Yahoo, etc.</span>
                </div>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-primary">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    required
                    className="w-full rounded-lg border border-primary/40 bg-surface-container-lowest pl-9 pr-24 py-2.5 text-sm text-on-surface outline-none transition placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary shadow-xs"
                    placeholder="e.g. yourname@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="rounded bg-primary-fixed px-1.5 py-0.5 font-mono text-[10px] font-bold text-on-primary-fixed">
                      ALERT EMAIL
                    </span>
                  </div>
                </div>

                {/* Quick Domain Suffix Helpers */}
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-outline font-caption">Quick add:</span>
                  {POPULAR_DOMAINS.map((domain) => (
                    <button
                      key={domain}
                      type="button"
                      onClick={() => appendDomain(domain)}
                      className="rounded border border-surface-container-high bg-surface-container-low px-1.5 py-0.5 font-mono text-[10px] text-primary hover:bg-surface-container-high transition cursor-pointer"
                    >
                      {domain}
                    </button>
                  ))}
                </div>

                <div className="mt-1 flex items-start gap-1.5 text-[11px] text-outline">
                  <Info size={13} className="text-primary shrink-0 mt-0.5" />
                  <span>
                    BHOOMI AI will dispatch live landslide nowcasts &amp; rainfall warnings directly to this email address.
                  </span>
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block font-label-caps text-outline text-[11px] mb-1">
                  Password / Security Key
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-outline">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="w-full rounded-lg border border-surface-container-high bg-surface-container-lowest pl-9 pr-10 py-2.5 text-sm text-on-surface outline-none transition placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary shadow-xs"
                    placeholder="Enter raksha2026"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-outline hover:text-on-surface transition cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Duty Role Selector */}
              <div>
                <label className="block font-label-caps text-outline text-[11px] mb-1.5">
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
                            ? 'border-primary bg-primary-fixed text-on-primary-fixed shadow-sm'
                            : 'border-surface-container-high bg-surface-container-lowest hover:bg-surface-container-low'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Icon size={13} className={isSelected ? 'text-primary' : 'text-outline'} />
                          <span
                            className={`text-xs font-semibold ${isSelected ? 'text-on-primary-fixed font-bold' : 'text-on-surface'}`}
                          >
                            {opt.title}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[10px] text-outline leading-tight line-clamp-1">{opt.subtitle}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Bhoomi Email Alerts Preference Checkbox */}
              <div className="rounded-lg border border-surface-container-high bg-surface-container-low p-3">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableEmailAlerts}
                    onChange={(e) => setEnableEmailAlerts(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-surface-container-high bg-surface-container-lowest text-primary accent-primary"
                  />
                  <div>
                    <span className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-secondary" />
                      <span>Receive Live Bhoomi AI Landslide Alerts via Email</span>
                    </span>
                    <p className="text-[11px] text-outline leading-relaxed mt-0.5 font-caption">
                      Automatically receive high-risk slope nowcasts, IMD rainfall warnings, and road blockage alerts to{' '}
                      <span className="text-primary font-mono font-medium">{email || 'your registered email ID'}</span>.
                    </p>
                  </div>
                </label>
              </div>

              {/* Station Info Chip */}
              <div className="flex items-center gap-2 rounded-lg border border-surface-container-high bg-surface-container-low px-3 py-2 text-xs text-outline">
                <MapPin size={13} className="text-primary shrink-0" />
                <span className="truncate">
                  <strong className="text-on-surface font-medium">{currentRoleMeta.agency}</strong> &bull;{' '}
                  {currentRoleMeta.posting}
                </span>
              </div>

              {/* Error Display */}
              {error && (
                <div className="rounded-lg border border-error/40 bg-error-container px-3 py-2 text-xs font-semibold text-on-error-container">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="group flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-headline-lg font-bold text-on-primary transition-all hover:bg-primary-container active:scale-[0.99] disabled:opacity-60 shadow-md shadow-primary/20 cursor-pointer"
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
            <div className="mt-6 border-t border-surface-container-high pt-4 text-center">
              <p className="text-[11px] text-outline font-caption">
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
