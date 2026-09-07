import { Panel } from '../components/ui'
import { useStore } from '../store/AppStore'

const ARCHIVE = [
  { id: 'H1', date: '04 Oct 2023', place: 'Chungthang, Sikkim', impact: 'Glacial lake outburst + debris flow; NH-10 severed for 18 days; Teesta cascade damaged.' },
  { id: 'H2', date: '12 Jun 2022', place: 'Noney / NH-37, Manipur', impact: 'Cut-slope failure buried two lanes; 9 hours isolation of hill villages west of Imphal.' },
  { id: 'H3', date: '19 Jul 2021', place: 'Sonapur, Meghalaya', impact: 'NH-6 boulder fall; three fatalities; Guwahati–Shillong stalled overnight.' },
  { id: 'H4', date: '08 Aug 2020', place: 'Aizawl Ramhlun, Mizoram', impact: 'Urban slope failure after 210 mm/24h; 14 dwellings vacated.' },
  { id: 'H5', date: '22 Sep 2019', place: 'Haflong–Jatinga, Assam', impact: 'Flysch slide on NF Railway; goods traffic held 36 hours.' },
  { id: 'H6', date: '11 Jul 2018', place: 'Kohima Zubza, Nagaland', impact: 'Shale slump on NH-29; convoy protocol instituted.' },
]

export function HistoryPage() {
  const { zones } = useStore()
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] tracking-[0.22em] text-lime uppercase">Training memory</p>
        <h1 className="text-2xl font-semibold">Historical landslide archive (NER)</h1>
        <p className="text-sm text-muted">Used as a prior in the model. Counts shown on each watch box.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Catalogued events">
          <ul className="space-y-3">
            {ARCHIVE.map((e) => (
              <li key={e.id} className="border-b border-white/5 pb-3 text-sm last:border-0">
                <p className="font-mono text-[11px] text-lime">{e.date}</p>
                <p className="font-semibold">{e.place}</p>
                <p className="text-muted">{e.impact}</p>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Watch-box priors">
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] uppercase text-muted">
              <tr>
                <th className="pb-2">Zone</th>
                <th>State</th>
                <th>Events</th>
              </tr>
            </thead>
            <tbody>
              {zones
                .slice()
                .sort((a, b) => b.historicalEvents - a.historicalEvents)
                .map((z) => (
                  <tr key={z.id} className="border-t border-white/5">
                    <td className="py-2">{z.name}</td>
                    <td className="text-muted">{z.state}</td>
                    <td className="font-mono">{z.historicalEvents}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  )
}
