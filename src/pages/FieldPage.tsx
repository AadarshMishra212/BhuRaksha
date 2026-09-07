import { useState, type FormEvent } from 'react'
import { Panel } from '../components/ui'
import { fmtTime } from '../lib/format'
import { useStore } from '../store/AppStore'
import type { FieldReport } from '../types'

const CATEGORIES: FieldReport['category'][] = ['Slope crack', 'Debris on road', 'Blocked drain', 'Building tilt', 'River cut']

export function FieldPage() {
  const { reports, addReport, zones, user } = useStore()
  const [zoneId, setZoneId] = useState(zones[0]?.id ?? '')
  const [category, setCategory] = useState<FieldReport['category']>('Slope crack')
  const [note, setNote] = useState('Fresh tension crack above the highway bench; weep holes discharging muddy water.')
  const [photoName, setPhotoName] = useState('field-capture.jpg')
  const [photoData, setPhotoData] = useState<string | undefined>()
  const [offline, setOffline] = useState(false)
  const [saved, setSaved] = useState<string | null>(null)

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const z = zones.find((x) => x.id === zoneId)
    if (!z || !user) return
    const report: FieldReport = {
      id: `FR-${Date.now()}`,
      time: new Date().toISOString(),
      reporter: user.name,
      role: user.role,
      zoneId: z.id,
      lat: z.lat + 0.004,
      lng: z.lng - 0.003,
      category,
      note,
      photoName,
      photoData,
      status: offline ? 'Queued' : 'Synced',
    }
    addReport(report)
    setSaved(offline ? 'Stored locally — will sync when VSAT/2G returns.' : 'Synced to SEOC and attached to the zone geometry.')
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] tracking-[0.22em] text-lime uppercase">Geo-tagged field desk</p>
        <h1 className="text-2xl font-semibold">Citizen &amp; officer ground truth</h1>
        <p className="text-sm text-muted">Upload cracks, debris and blocked drains. Toggle low-network to queue for later sync.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="New observation">
          <form className="space-y-3" onSubmit={onSubmit}>
            <label className="block text-xs text-muted">
              Watch box
              <select className="mt-1 w-full rounded border border-lime/20 bg-command px-2 py-2 text-sm" value={zoneId} onChange={(e) => setZoneId(e.target.value)}>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-muted">
              Category
              <select
                className="mt-1 w-full rounded border border-lime/20 bg-command px-2 py-2 text-sm"
                value={category}
                onChange={(e) => setCategory(e.target.value as FieldReport['category'])}
              >
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-muted">
              Narrative
              <textarea
                className="mt-1 min-h-24 w-full rounded border border-lime/20 bg-command px-2 py-2 text-sm"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </label>
            <label className="block text-xs text-muted">
              Geo-tagged photo
              <input
                type="file"
                accept="image/*"
                className="mt-1 w-full text-sm"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  setPhotoName(file.name)
                  const reader = new FileReader()
                  reader.onload = () => setPhotoData(String(reader.result))
                  reader.readAsDataURL(file)
                }}
              />
            </label>
            {photoData ? <img src={photoData} alt="Field capture preview" className="max-h-40 rounded-lg object-cover" /> : null}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={offline} onChange={(e) => setOffline(e.target.checked)} />
              Low-network / offline queue
            </label>
            <button type="submit" className="rounded-lg bg-lime px-4 py-2 text-sm font-semibold text-command">
              File to SEOC
            </button>
            {saved ? <p className="text-sm text-lime">{saved}</p> : null}
          </form>
        </Panel>
        <Panel title="Incoming reports">
          <ul className="max-h-[640px] space-y-3 overflow-auto">
            {reports.map((r) => (
              <li key={r.id} className="rounded-lg border border-white/5 p-3 text-sm">
                <div className="flex justify-between gap-2">
                  <p className="font-medium">{r.category}</p>
                  <span className="text-[11px] text-lime">{r.status}</span>
                </div>
                <p className="text-xs text-muted">
                  {r.reporter} · {fmtTime(r.time)} · {r.photoName}
                </p>
                <p className="mt-2">{r.note}</p>
                {r.photoData ? <img src={r.photoData} alt={r.photoName} className="mt-2 max-h-32 rounded object-cover" /> : null}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  )
}
