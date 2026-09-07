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
  if (s === 'Critical') return 'bg-alert/20 text-alert border-alert/40'
  if (s === 'High') return 'bg-warn/20 text-warn border-warn/40'
  if (s === 'Moderate') return 'bg-info/20 text-info border-info/40'
  return 'bg-lime/20 text-lime border-lime/40'
}

export function roadClass(s: RoadStatus) {
  if (s === 'Blocked') return 'text-alert'
  if (s === 'Restricted') return 'text-warn'
  return 'text-lime'
}

export function roleLabel(role: string) {
  if (role === 'ndma') return 'NDMA Command'
  if (role === 'district') return 'District Authority'
  if (role === 'field') return 'Field Officer'
  return 'Community Reporter'
}
