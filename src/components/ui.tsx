import type { ReactNode } from 'react'
import { severityClass } from '../lib/format'
import type { Severity } from '../types'

export function Panel({
  title,
  action,
  children,
  className = '',
}: {
  title: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`bg-surface-container-lowest rounded-xl shadow-xs border border-surface-container-high/80 overflow-hidden flex flex-col transition-all ${className}`}>
      <header className="px-space-md py-space-sm flex items-center justify-between bg-surface-container-low/70 border-b border-surface-container-high/60">
        <h2 className="font-headline-lg text-xs sm:text-sm text-on-surface font-semibold flex items-center gap-1.5">
          {title}
        </h2>
        {action}
      </header>
      <div className="p-space-md">{children}</div>
    </section>
  )
}

export function Kpi({
  label,
  value,
  hint,
  tone = 'lime',
}: {
  label: string
  value: string
  hint: string
  tone?: 'lime' | 'alert' | 'warn' | 'info'
}) {
  const color =
    tone === 'alert'
      ? 'text-error'
      : tone === 'warn'
        ? 'text-tertiary'
        : tone === 'info'
          ? 'text-primary'
          : 'text-secondary'

  const iconName =
    tone === 'alert'
      ? 'warning'
      : tone === 'warn'
        ? 'pending_actions'
        : tone === 'info'
          ? 'satellite'
          : 'shield'

  return (
    <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-xs border border-surface-container-high/70 flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:border-surface-container-highest">
      <div className="flex items-center justify-between mb-space-xs">
        <span className="font-label-caps text-[9px] text-outline">{label}</span>
        <span className={`material-symbols-outlined ${color} text-[16px]`}>{iconName}</span>
      </div>
      <div className="flex items-baseline gap-space-xs">
        <span className={`font-mono-telemetry text-lg sm:text-xl font-bold tracking-tight ${color}`}>{value}</span>
      </div>
      <div className="mt-space-xs flex items-center gap-1 text-[11px] text-outline font-body-base">
        <span>{hint}</span>
      </div>
    </div>
  )
}

export function Pill({ severity }: { severity: Severity }) {
  return (
    <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-label-caps border ${severityClass(severity)}`}>
      {severity}
    </span>
  )
}
