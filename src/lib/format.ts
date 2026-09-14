import type { RoadStatus, Severity } from '../types'

export function fmtTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: 'short',
    timeZone: 'Asia/Kolkata',
  })
}

export function fmtClock() {
  return new Date().toLocaleString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  })
}

export function severityClass(s: Severity) {
  if (s === 'Critical') return 'bg-error-container text-on-error-container border-error/30'
  if (s === 'High') return 'bg-tertiary-fixed text-on-tertiary-fixed-variant border-tertiary/30'
  if (s === 'Moderate') return 'bg-primary-fixed text-on-primary-fixed-variant border-primary/30'
  return 'bg-secondary-container text-on-secondary-container border-secondary/30'
}

export function roadClass(s: RoadStatus) {
  if (s === 'Blocked') return 'text-error'
  if (s === 'Restricted') return 'text-tertiary'
  return 'text-secondary'
}

export function roleLabel(role: string) {
  if (role === 'ndma') return 'NDMA Command'
  if (role === 'district') return 'District Authority'
  if (role === 'field') return 'Field Officer'
  return 'Community Reporter'
}
