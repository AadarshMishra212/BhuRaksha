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
    <section className={`minim-card overflow-hidden ${className}`}>
      <header className="flex items-center justify-between gap-3 border-b border-white/[0.06] bg-white/[0.015] px-4 py-3">
        <h2 className="text-[11px] font-semibold tracking-[0.2em] text-ink/90 uppercase">{title}</h2>
        {action}
      </header>
      <div className="p-4">{children}</div>
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
    tone === 'alert' ? 'text-alert' : tone === 'warn' ? 'text-warn' : tone === 'info' ? 'text-info' : 'text-lime'
  return (
    <div className="minim-card p-4 transition-all duration-200 hover:-translate-y-[1px]">
      <p className="text-[10px] font-semibold tracking-[0.22em] text-muted uppercase">{label}</p>
      <p className={`mt-1 font-mono text-2xl font-bold tracking-tight ${color}`}>{value}</p>
      <p className="mt-1.5 text-xs text-muted/90">{hint}</p>
    </div>
  )
}

export function Pill({ severity }: { severity: Severity }) {
  return (
    <span className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold tracking-[0.14em] uppercase ${severityClass(severity)}`}>
      {severity}
    </span>
  )
}
