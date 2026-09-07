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
    <section className={`rounded-xl border border-lime/15 bg-panel/90 shadow-[0_0_0_1px_rgba(0,0,0,0.4)] ${className}`}>
      <header className="flex items-center justify-between gap-3 border-b border-lime/10 px-4 py-2.5">
        <h2 className="text-[11px] font-semibold tracking-[0.16em] text-lime uppercase">{title}</h2>
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
    <div className="rounded-xl border border-lime/15 bg-panel px-4 py-3">
      <p className="text-[10px] tracking-[0.18em] text-muted uppercase">{label}</p>
      <p className={`mt-1 font-mono text-2xl font-semibold ${color}`}>{value}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </div>
  )
}

export function Pill({ severity }: { severity: Severity }) {
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${severityClass(severity)}`}>
      {severity}
    </span>
  )
}
