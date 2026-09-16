import { Mail, PhoneCall, ShieldAlert } from 'lucide-react'

// Custom SVG Icons for Twitter/X and Instagram
function TwitterXIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

export function AppFooter() {
  return (
    <footer className="no-print border-t border-surface-container-high/80 bg-surface-container-lowest/90 backdrop-blur-md px-6 py-8 text-on-surface-variant font-body-base transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Left: Brand & Mission */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span className="font-display-2xl text-base font-extrabold tracking-tight text-on-surface bg-gradient-to-r from-primary via-primary-container to-tertiary bg-clip-text text-transparent">
              BHURAKSHA
            </span>
            <span className="px-2 py-0.5 rounded-full text-[9.5px] font-label-caps font-bold bg-primary-fixed/80 text-on-primary-fixed border border-primary/20">
              SEOC-NER 2026
            </span>
          </div>
          <p className="text-xs text-on-surface-variant max-w-md">
            AI-Powered Landslide Early Warning, Geohazard Decision Support &amp; Emergency Command for North Eastern India.
          </p>
          <div className="flex items-center gap-2 text-[11px] text-outline pt-1">
            <ShieldAlert size={13} className="text-primary" />
            <span>MDoNER &bull; NDMA &bull; Geological Survey of India (GSI)</span>
          </div>
        </div>

        {/* Center: 24/7 Emergency Dispatch Badge */}
        <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-surface-container-low border border-surface-container-high/80 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-on-surface">
            <PhoneCall size={14} className="text-primary animate-bounce" />
            <span>24/7 Disaster Control Helpline:</span>
            <a
              href="tel:1070"
              className="font-mono text-sm font-extrabold text-primary hover:underline bg-primary-fixed/60 px-2 py-0.5 rounded-lg"
            >
              1070 / 112
            </a>
          </div>
          <div className="flex items-center gap-1.5 text-[10.5px] text-secondary font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
            <span>All 8 NER Telemetry Nodes Operational (99.98% uptime)</span>
          </div>
        </div>

        {/* Right: Social & Contact Channels */}
        <div className="flex flex-col items-center md:items-end gap-3">
          <span className="font-label-caps text-[9.5px] text-outline font-bold tracking-wider">
            Connect &amp; Telemetry Feeds
          </span>
          <div className="flex items-center gap-2.5">
            {/* Instagram */}
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="w-8 h-8 rounded-xl bg-surface-container-low hover:bg-surface-container-high border border-surface-container-high text-on-surface-variant hover:text-primary flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-sm"
            >
              <InstagramIcon />
            </a>

            {/* Twitter / X */}
            <a
              href="https://x.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Twitter X"
              className="w-8 h-8 rounded-xl bg-surface-container-low hover:bg-surface-container-high border border-surface-container-high text-on-surface-variant hover:text-primary flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-sm"
            >
              <TwitterXIcon />
            </a>

            {/* Gmail / Email */}
            <a
              href="mailto:seoc.ner@bhuraksha.gov.in"
              aria-label="Gmail Support"
              className="w-8 h-8 rounded-xl bg-surface-container-low hover:bg-surface-container-high border border-surface-container-high text-on-surface-variant hover:text-primary flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-sm"
              title="seoc.ner@bhuraksha.gov.in"
            >
              <Mail size={15} />
            </a>
          </div>
          <p className="text-[10px] font-mono text-outline">
            &copy; {new Date().getFullYear()} SEOC BhuRaksha. Real-Time Edge Intelligence.
          </p>
        </div>

      </div>
    </footer>
  )
}
