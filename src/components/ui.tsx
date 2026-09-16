import type { ComponentType, ReactNode } from 'react'
import { severityClass } from '../lib/format'
import type { Severity } from '../types'

export function Panel({
  title,
  action,
  children,
  className = '',
  icon: Icon,
}: {
  title: string
  action?: ReactNode
  children: ReactNode
  className?: string
  icon?: ComponentType<{ size?: number; className?: string }> | ReactNode
}) {
  return (
    <section
      className={`bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container-high/80 overflow-hidden flex flex-col transition-all duration-300 hover:shadow-md hover:border-surface-container-highest ${className}`}
    >
      <header className="px-5 py-3.5 flex items-center justify-between bg-surface-container-low/80 border-b border-surface-container-high/60 backdrop-blur-xs">
        <h2 className="font-headline-lg text-xs sm:text-sm text-on-surface font-bold flex items-center gap-2 tracking-tight">
          {Icon && (typeof Icon === 'function' || typeof Icon === 'object') ? (
            <span className="p-1 rounded-md bg-surface-container-high text-primary flex items-center justify-center">
              {/* @ts-expect-error Component vs Element check */}
              <Icon size={15} />
            </span>
          ) : null}
          <span>{title}</span>
        </h2>
        {action}
      </header>
      <div className="p-5 flex-1">{children}</div>
    </section>
  )
}

export function Kpi({
  label,
  value,
  hint,
  tone = 'lime',
  trend,
}: {
  label: string
  value: string
  hint: string
  tone?: 'lime' | 'alert' | 'warn' | 'info'
  trend?: string
}) {
  const color =
    tone === 'alert'
      ? 'text-error'
      : tone === 'warn'
        ? 'text-tertiary'
        : tone === 'info'
          ? 'text-primary'
          : 'text-secondary'

  const bgBadge =
    tone === 'alert'
      ? 'bg-error-container/60 text-error'
      : tone === 'warn'
        ? 'bg-tertiary-container/60 text-tertiary'
        : tone === 'info'
          ? 'bg-primary-fixed/60 text-primary'
          : 'bg-secondary-container/60 text-secondary'

  const iconName =
    tone === 'alert'
      ? 'warning'
      : tone === 'warn'
        ? 'pending_actions'
        : tone === 'info'
          ? 'satellite_alt'
          : 'verified_user'

  return (
    <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-surface-container-high/70 flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-surface-container-highest group">
      <div className="flex items-center justify-between mb-2">
        <span className="font-label-caps text-[10px] text-outline tracking-wider font-semibold">{label}</span>
        <div className={`w-8 h-8 rounded-xl ${bgBadge} flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-xs`}>
          <span className={`material-symbols-outlined ${color} text-[17px]`}>{iconName}</span>
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`font-mono-telemetry text-xl sm:text-2xl font-extrabold tracking-tight ${color}`}>{value}</span>
      </div>
      <div className="mt-2 flex items-center justify-between gap-1 text-[11.5px] text-outline font-body-base">
        <span className="line-clamp-1">{hint}</span>
        {trend && (
          <span className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant shrink-0">
            {trend}
          </span>
        )}
      </div>
    </div>
  )
}

export function Pill({ severity }: { severity: Severity }) {
  const dotColor =
    severity === 'Critical'
      ? 'bg-error animate-pulse'
      : severity === 'High'
        ? 'bg-primary'
        : severity === 'Moderate'
          ? 'bg-tertiary'
          : 'bg-secondary'

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-label-caps font-bold border shadow-2xs transition-all ${severityClass(
        severity
      )}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {severity}
    </span>
  )
}

export function ChipToggle({
  label,
  active,
  onClick,
  count,
  icon,
}: {
  label: string
  active: boolean
  onClick: () => void
  count?: number
  icon?: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
        active
          ? 'bg-primary text-on-primary shadow-sm ring-2 ring-primary/20 scale-[1.02]'
          : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high border border-surface-container-high/80'
      }`}
    >
      {icon && <span className="text-[14px]">{icon}</span>}
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
            active ? 'bg-on-primary/20 text-on-primary' : 'bg-surface-container-high text-outline'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  )
}

export function SkeletonCard({ count = 1 }: { count?: number }) {
  return (
    <div className="grid gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-surface-container-lowest p-5 rounded-2xl border border-surface-container-high/70 shadow-xs space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="h-4 w-32 rounded-md skeleton-shimmer" />
            <div className="h-5 w-16 rounded-full skeleton-shimmer" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full rounded-md skeleton-shimmer" />
            <div className="h-3 w-3/4 rounded-md skeleton-shimmer" />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <div className="h-6 w-20 rounded-lg skeleton-shimmer" />
            <div className="h-6 w-24 rounded-lg skeleton-shimmer" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function SkeletonTable({ rows = 4, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-2xl border border-surface-container-high overflow-hidden bg-surface-container-lowest">
      <div className="bg-surface-container-low px-4 py-3 flex gap-4 border-b border-surface-container-high">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-3.5 flex-1 rounded skeleton-shimmer" />
        ))}
      </div>
      <div className="divide-y divide-surface-container-high/60">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="px-4 py-3.5 flex gap-4 items-center">
            {Array.from({ length: cols }).map((_, c) => (
              <div key={c} className="h-3 flex-1 rounded skeleton-shimmer" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
