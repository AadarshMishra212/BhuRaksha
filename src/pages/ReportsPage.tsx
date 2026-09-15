import { jsPDF } from 'jspdf'
import { useState } from 'react'
import { Panel } from '../components/ui'
import { fmtClock, fmtTime } from '../lib/format'
import { useStore } from '../store/useStore'

export function ReportsPage() {
  const { zones, alerts, roads, actions, user, sitreps, addSitrep } = useStore()
  const [title, setTitle] = useState('NER Landslide Situation Report — Morning cycle')
  const [note, setNote] = useState(
    'Duty recommendation: hold night traffic on NH-37 Noney and NH-6 Sonapur; pre-position SDRF at Haflong and Aizawl Ramhlun. Community SMS in Khasi, Mizo and Nepali already queued.',
  )
  const [flash, setFlash] = useState<string | null>(null)

  const critical = zones.filter((z) => z.severity === 'Critical' || z.severity === 'High')

  function buildBody() {
    const lines = [
      'BHURAKSHA — AI-Powered Landslide Early Warning & Risk Management System',
      'National Disaster Management Architecture • Official SEOC Situation Report',
      title,
      `Generated: ${fmtClock()} IST`,
      `Author: ${user?.name ?? 'SEOC'} (${user?.agency ?? ''})`,
      '',
      '1. WATCH BOXES (High / Critical)',
      ...critical.map(
        (z) =>
          `  - ${z.name} | ${z.district}, ${z.state} | score ${z.riskScore.toFixed(1)} ${z.severity} | rain ${z.rainfall24h.toFixed(0)} mm | soil ${z.soilMoisture.toFixed(0)}% | ${z.corridor}`,
      ),
      '',
      '2. CORRIDORS',
      ...roads.map((r) => `  - ${r.name}: ${r.status}. ${r.diversion}`),
      '',
      '3. OPEN ALERTS',
      ...alerts.slice(0, 8).map((a) => `  - ${fmtTime(a.time)} ${a.severity} ${a.zoneName}: ${a.message.en}`),
      '',
      '4. RESPONSE',
      ...actions.map((a) => {
        const z = zones.find((x) => x.id === a.zoneId)
        return `  - P${a.priority} ${z?.district}: ${a.unit} / ${a.status} / ${a.action}`
      }),
      '',
      '5. DUTY NOTE',
      `  ${note}`,
      '',
      'Built for safer and more resilient communities across North Eastern India.',
    ]
    return lines.join('\n')
  }

  function downloadPdf() {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    const text = buildBody()
    const parts = doc.splitTextToSize(text, 500)
    let y = 48
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('BHURAKSHA SITREP', 48, y)
    y += 22
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    parts.forEach((line: string) => {
      if (y > 780) {
        doc.addPage()
        y = 48
      }
      doc.text(line, 48, y)
      y += 13
    })
    const id = `SR-${Date.now()}`
    doc.save(`${id}.pdf`)
    addSitrep({ id, generatedAt: new Date().toISOString(), author: user?.name ?? 'SEOC', title })
    setFlash(`PDF ${id}.pdf downloaded.`)
  }

  function downloadTxt() {
    const blob = new Blob([buildBody()], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `BHURAKSHA-SITREP-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
    const id = `SR-${Date.now()}`
    addSitrep({ id, generatedAt: new Date().toISOString(), author: user?.name ?? 'SEOC', title })
    setFlash('Plain-text SITREP downloaded for low-bandwidth share.')
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="font-label-caps text-secondary">Situation reports</p>
        <h1 className="font-display-2xl text-on-surface">SITREP factory</h1>
        <p className="text-sm text-on-surface-variant">Pulls live zones, roads, alerts and tasking into a ministry-style brief.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Compose">
          <label className="block text-xs font-semibold text-outline uppercase">
            Title
            <input className="mt-1 w-full rounded-lg border border-surface-container-high bg-surface-container-low px-3 py-2 text-sm text-on-surface shadow-xs outline-none focus:border-secondary focus:ring-1 focus:ring-secondary" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="mt-3 block text-xs font-semibold text-outline uppercase">
            Duty officer note
            <textarea className="mt-1 min-h-28 w-full rounded-lg border border-surface-container-high bg-surface-container-low p-3 text-sm text-on-surface shadow-xs outline-none focus:border-secondary focus:ring-1 focus:ring-secondary" value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={downloadPdf} className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-on-secondary shadow-sm hover:bg-secondary/90 transition cursor-pointer">
              Generate PDF
            </button>
            <button type="button" onClick={downloadTxt} className="rounded-lg border border-surface-container-high bg-surface-container-low px-4 py-2 text-sm font-semibold text-on-surface shadow-xs hover:bg-surface-container-high transition cursor-pointer">
              Download TXT
            </button>
            <button type="button" onClick={() => window.print()} className="rounded-lg border border-surface-container-high bg-surface-container-low px-4 py-2 text-sm font-semibold text-on-surface shadow-xs hover:bg-surface-container-high transition cursor-pointer">
              Print preview
            </button>
          </div>
          {flash ? <p className="mt-3 text-sm font-semibold text-secondary">{flash}</p> : null}
        </Panel>
        <Panel title="Live brief preview">
          <pre className="max-h-[480px] overflow-auto whitespace-pre-wrap font-mono text-[11px] leading-5 text-on-surface bg-surface-container-low p-3 rounded-lg border border-surface-container-high">{buildBody()}</pre>
        </Panel>
      </div>
      <Panel title="Generated this session">
        {sitreps.length === 0 ? (
          <p className="text-sm text-outline">No SITREPs generated yet in this browser session.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {sitreps.map((s) => (
              <li key={s.id} className="flex justify-between gap-2 border-b border-surface-container-high pb-2 text-on-surface">
                <span className="font-medium">{s.title}</span>
                <span className="font-mono text-[11px] text-outline">
                  {s.id} · {fmtTime(s.generatedAt)} · {s.author}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}
