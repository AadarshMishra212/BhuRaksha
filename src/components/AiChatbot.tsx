import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronDown,
  Compass,
  LocateFixed,
  MapPin,
  Maximize2,
  Mic,
  MicOff,
  Minimize2,
  Radio,
  Send,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react'
import {
  assessProximity,
  generateLocalAiResponse,
  PRESET_LOCATIONS,
  type ChatAction,
  type ChatMessage,
  type UserLocation,
} from '../engine/chatbotEngine'
import { useStore } from '../store/useStore'

export function AiChatbot() {
  const store = useStore()
  const {
    zones,
    sensors,
    roads,
    villages,
    alerts,
    reports,
    actions,
    weather,
    language,
    setLanguage,
    selectZone,
    selectedZone,
    live,
  } = store

  const navigate = useNavigate()

  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [input, setInput] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [speechEnabled, setSpeechEnabled] = useState(false)
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const [locationSearch, setLocationSearch] = useState('')
  const [isGpsLoading, setIsGpsLoading] = useState(false)
  const [gpsError, setGpsError] = useState<string | null>(null)

  // Default to Gangtok or saved location in local storage
  const [userLocation, setUserLocation] = useState<UserLocation | null>(() => {
    try {
      const saved = localStorage.getItem('bhuraksha_user_location')
      return saved ? JSON.parse(saved) : PRESET_LOCATIONS[0]
    } catch {
      return PRESET_LOCATIONS[0]
    }
  })

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'init-1',
      sender: 'bot',
      text: `🛰️ **BHURAKSHA SEOC Tactical Operations Console**\n\nReal-time telemetry interface for North East landslide hazard zones, strategic highway passability, slope sensor feeds, and DDMA designated shelter networks.\n\n📍 Current Active Sector: **${userLocation ? userLocation.name : 'Not set'}**`,
      timestamp: new Date().toISOString(),
      actions: [
        { label: '🛡️ Assess Risk at My Location', type: 'NAVIGATE', payload: 'PROXIMITY_CHECK' },
        { label: '🛣️ Check Blocked Highways', type: 'NAVIGATE', payload: '/gis' },
        { label: '🏛️ Locate Nearest Shelter', type: 'NAVIGATE', payload: '/communities' },
      ],
    },
  ])

  // Allow closing with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)
  const idCounter = useRef(100)

  const speakText = useCallback(
    (text: string) => {
      if (!speechEnabled || !('speechSynthesis' in window)) return
      window.speechSynthesis.cancel()
      const clean = text.replace(/[*_#•`]/g, '')
      const utterance = new SpeechSynthesisUtterance(clean)
      utterance.rate = 1.05
      utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN'
      window.speechSynthesis.speak(utterance)
    },
    [speechEnabled, language],
  )

  const handleSendMessage = useCallback(
    (textToSend?: string) => {
      const query = (textToSend || input).trim()
      if (!query) return

      idCounter.current += 1
      const currentId = idCounter.current
      const userMsg: ChatMessage = {
        id: `user-${currentId}`,
        sender: 'user',
        text: query,
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, userMsg])
      setInput('')

      // Generate local intelligence response
      setTimeout(() => {
        const platformContext = {
          zones,
          sensors,
          roads,
          villages,
          alerts,
          reports,
          actions,
          weather,
          language,
          selectedZone,
          live,
        }

        const botResponse = generateLocalAiResponse(query, userLocation, platformContext)
        setMessages((prev) => [...prev, botResponse])

        if (speechEnabled) {
          speakText(botResponse.text)
        }
      }, 250)
    },
    [input, zones, sensors, roads, villages, alerts, reports, actions, weather, language, selectedZone, live, userLocation, speechEnabled, speakText],
  )

  // Save location to localStorage
  useEffect(() => {
    if (userLocation) {
      localStorage.setItem('bhuraksha_user_location', JSON.stringify(userLocation))
    }
  }, [userLocation])

  // Scroll to bottom when messages update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  // Setup Web Speech Recognition if supported
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      const rec = new SpeechRecognition()
      rec.continuous = false
      rec.interimResults = false
      rec.lang = language === 'hi' ? 'hi-IN' : language === 'as' ? 'as-IN' : 'en-IN'

      rec.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript
        setInput(transcript)
        setIsListening(false)
        handleSendMessage(transcript)
      }
      rec.onerror = () => setIsListening(false)
      rec.onend = () => setIsListening(false)
      recognitionRef.current = rec
    }
  }, [language, handleSendMessage])

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser.')
      return
    }
    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch {
        setIsListening(false)
      }
    }
  }

  // Handle GPS location detection
  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.')
      return
    }
    setIsGpsLoading(true)
    setGpsError(null)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsGpsLoading(false)
        const lat = Number(pos.coords.latitude.toFixed(4))
        const lng = Number(pos.coords.longitude.toFixed(4))

        // Find closest known town or seed
        const matched = PRESET_LOCATIONS.reduce((best, loc) => {
          const d = Math.hypot(loc.lat - lat, loc.lng - lng)
          return d < best.d ? { d, loc } : best
        }, { d: 999, loc: PRESET_LOCATIONS[0] })

        const newLoc: UserLocation = {
          name: `GPS (${lat}°N, ${lng}°E) ~ ${matched.loc.name}`,
          lat,
          lng,
          isGps: true,
          district: matched.loc.district,
          state: matched.loc.state,
        }

        setUserLocation(newLoc)
        setShowLocationPicker(false)

        idCounter.current += 1
        const botMsg: ChatMessage = {
          id: `loc-${idCounter.current}`,
          sender: 'bot',
          text: `📍 **GPS Position Locked**: \`${lat}°N, ${lng}°E\` (Near ${matched.loc.name})\n\nEvaluating immediate slope hazards, road status, and emergency shelters around your coordinates...`,
          timestamp: new Date().toISOString(),
          actions: [
            { label: '🛡️ View Local Safety Assessment', type: 'NAVIGATE', payload: 'PROXIMITY_CHECK' },
            { label: '🗺️ Locate in GIS Map', type: 'NAVIGATE', payload: '/gis' },
          ],
        }
        setMessages((prev) => [...prev, botMsg])
      },
      (err) => {
        setIsGpsLoading(false)
        setGpsError(err.message || 'Unable to retrieve your location.')
      },
      { timeout: 10000, enableHighAccuracy: true },
    )
  }

  const handleSelectPreset = (loc: UserLocation) => {
    setUserLocation(loc)
    setShowLocationPicker(false)
    idCounter.current += 1
    const botMsg: ChatMessage = {
      id: `loc-${idCounter.current}`,
      sender: 'bot',
      text: `📍 Location updated to **${loc.name}** (${loc.lat.toFixed(3)}°N, ${loc.lng.toFixed(3)}°E).\n\nWhat would you like to check for this sector?`,
      timestamp: new Date().toISOString(),
      actions: [
        { label: `🛡️ Check ${loc.district} Risk Level`, type: 'NAVIGATE', payload: 'PROXIMITY_CHECK' },
        { label: '🏛️ Nearest Shelter', type: 'NAVIGATE', payload: 'SHELTER_CHECK' },
        { label: '🛣️ Road Passability', type: 'NAVIGATE', payload: 'ROAD_CHECK' },
      ],
    }
    setMessages((prev) => [...prev, botMsg])
  }

  const handleExecuteAction = (action: ChatAction) => {
    if (action.type === 'NAVIGATE') {
      if (action.payload === 'PROXIMITY_CHECK') {
        handleSendMessage('What is the landslide risk near my location?')
      } else if (action.payload === 'SHELTER_CHECK') {
        handleSendMessage('Where is my nearest emergency shelter?')
      } else if (action.payload === 'ROAD_CHECK') {
        handleSendMessage('What is the status of strategic highways and roads near me?')
      } else {
        navigate(action.payload)
        if (window.innerWidth < 768) {
          setIsExpanded(false)
        }
      }
    } else if (action.type === 'SELECT_ZONE') {
      if (action.zoneId) {
        selectZone(action.zoneId)
        navigate('/gis')
      } else {
        selectZone(action.payload)
        navigate('/gis')
      }
    } else if (action.type === 'SET_LANG') {
      setLanguage(action.payload as 'en' | 'hi' | 'as')
    } else if (action.type === 'SET_LOCATION') {
      const match = PRESET_LOCATIONS.find((p) => p.name.includes(action.payload) || action.payload.includes(p.name))
      if (match) {
        handleSelectPreset(match)
      }
    }
  }

  const currentProximity = userLocation
    ? assessProximity(userLocation, zones, villages, roads, weather, alerts)
    : null

  const filteredPresets = PRESET_LOCATIONS.filter(
    (p) =>
      p.name.toLowerCase().includes(locationSearch.toLowerCase()) ||
      (p.district && p.district.toLowerCase().includes(locationSearch.toLowerCase())) ||
      (p.state && p.state.toLowerCase().includes(locationSearch.toLowerCase())),
  )

  return (
    <>
      {/* Floating Tactical Console Launcher Button */}
      {!isOpen && (
        <aside aria-label="SEOC Tactical Operations Quick Launch" className="fixed bottom-14 right-3 z-40 sm:bottom-16 sm:right-6">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-2 rounded-full border border-[#fc6c26]/60 bg-[#160e0a] px-3.5 py-2.5 sm:px-4 sm:py-2.5 text-[#fff4d6] shadow-[0_4px_25px_rgba(252,108,38,0.4)] backdrop-blur-md transition-all hover:scale-105 hover:border-[#fc6c26] hover:bg-[#22140d] hover:shadow-[0_4px_35px_rgba(252,108,38,0.6)] cursor-pointer"
            title="Open SEOC Duty Desk"
            aria-label="Open SEOC Duty Desk"
          >
            {/* Pulsing radar rings */}
            <span className="absolute -inset-0.5 animate-ping rounded-full bg-[#fc6c26]/25 duration-1000" />
            <span className="relative flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-[#fc6c26] text-[#1a0800] font-bold group-hover:bg-[#ff7e3d] transition shadow-sm">
              <Radio size={17} className="animate-pulse" />
            </span>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold tracking-wider text-[#fc6c26] uppercase">SEOC Desk</span>
                <span className="h-1.5 w-1.5 rounded-full bg-[#fc6c26] animate-ping" />
              </div>
              <p className="text-[10px] text-[#e8dcbe] font-mono">
                {userLocation ? userLocation.name.split(',')[0] : 'Telemetry Console'}
              </p>
            </div>
            <Compass size={15} className="text-[#fc6c26] transition group-hover:rotate-45" />
          </button>
        </aside>
      )}

      {/* Main Interactive SEOC Console Window */}
      {isOpen && (
        <aside
          aria-label="SEOC Duty Desk Window"
          className={`fixed bottom-14 right-2 z-50 flex flex-col rounded-2xl border border-[#fc6c26]/40 bg-[#120a05] shadow-[0_12px_45px_rgba(0,0,0,0.85)] text-[#fff4d6] backdrop-blur-xl transition-all duration-300 sm:bottom-16 sm:right-6 ${
            isExpanded
              ? 'h-[70vh] max-h-[76vh] w-[95vw] sm:w-[540px] lg:w-[600px]'
              : 'h-[440px] sm:h-[470px] max-h-[68vh] w-[94vw] sm:w-[370px] md:w-[380px]'
          }`}
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-[#fc6c26]/20 bg-[#1b1008] px-3.5 py-2.5 rounded-t-2xl">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-[#fc6c26] border border-[#ff8c4b] text-[#1a0800] font-bold shadow-md">
                <Radio size={17} />
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#ffb592] animate-ping" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold tracking-wider text-[#fc6c26] uppercase">SEOC DUTY DESK</h3>
                  <span className="rounded bg-[#fc6c26]/20 px-1.5 py-0.2 font-mono text-[9px] font-semibold text-[#ffb592] border border-[#fc6c26]/40">
                    LIVE OPS
                  </span>
                </div>
                <p className="text-[10px] text-[#e8dcbe]">Tactical Geohazard Telemetry</p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-[#e8dcbe]">
              {/* Text-to-speech toggle */}
              <button
                type="button"
                onClick={() => {
                  setSpeechEnabled(!speechEnabled)
                  if (speechEnabled && 'speechSynthesis' in window) {
                    window.speechSynthesis.cancel()
                  }
                }}
                className={`rounded-lg p-1.5 transition cursor-pointer ${
                  speechEnabled ? 'text-[#fc6c26] bg-[#fc6c26]/20 border border-[#fc6c26]' : 'hover:bg-white/10 hover:text-[#fff4d6]'
                }`}
                title={speechEnabled ? 'Voice Reader On (Mute)' : 'Voice Reader Off (Enable audio narration)'}
                aria-label="Toggle voice output"
              >
                {speechEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
              </button>

              {/* Expand / Shrink */}
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="rounded-lg p-1.5 transition hover:bg-white/10 hover:text-[#fff4d6] hidden sm:block cursor-pointer"
                title={isExpanded ? 'Restore window size' : 'Expand window'}
                aria-label="Toggle window size"
              >
                {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </button>

              {/* Prominent close button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg border border-rose-500/40 bg-rose-500/20 p-1.5 text-rose-300 transition hover:bg-rose-600 hover:text-white hover:border-rose-500 shadow-sm ml-1 cursor-pointer"
                title="Close Duty Desk (Esc)"
                aria-label="Close Duty Desk"
              >
                <X size={16} className="stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Location Bar & Quick Proximity Summary */}
          <div className="border-b border-[#fc6c26]/20 bg-[#1e130a] px-3.5 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 overflow-hidden">
                <MapPin size={14} className="shrink-0 text-[#fc6c26]" />
                <span className="text-[11px] font-medium text-[#e8dcbe] shrink-0">Location:</span>
                <button
                  type="button"
                  onClick={() => setShowLocationPicker(!showLocationPicker)}
                  className="truncate text-xs font-bold text-[#fc6c26] underline decoration-[#fc6c26]/40 underline-offset-2 hover:text-[#fff4d6] transition cursor-pointer"
                  title="Click to change your location"
                >
                  {userLocation ? userLocation.name : 'Click to Set Location'}
                </button>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={handleDetectGps}
                  disabled={isGpsLoading}
                  className="flex items-center gap-1 rounded border border-[#fc6c26]/40 bg-[#fc6c26]/20 px-2 py-0.5 text-[10px] font-bold text-[#fc6c26] hover:bg-[#fc6c26] hover:text-[#1a0800] transition disabled:opacity-50 cursor-pointer"
                  title="Detect GPS location"
                >
                  <LocateFixed size={11} className={isGpsLoading ? 'animate-spin' : ''} />
                  <span>{isGpsLoading ? 'Locating...' : 'GPS'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowLocationPicker(!showLocationPicker)}
                  className="rounded border border-white/10 bg-white/5 p-1 text-[#e8dcbe] hover:text-[#fff4d6] hover:bg-white/10 cursor-pointer"
                  title="Select from cities"
                  aria-label="Open location selector"
                >
                  <ChevronDown size={12} />
                </button>
              </div>
            </div>

            {/* Live Proximity Indicator Pill */}
            {currentProximity && (
              <div className="mt-2 flex flex-wrap items-center justify-between gap-1.5 rounded-lg border border-[#fc6c26]/20 bg-black/40 px-2.5 py-1 text-[10px]">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      currentProximity.hazardLevel === 'Immediate Danger'
                        ? 'bg-rose-500 animate-ping'
                        : currentProximity.hazardLevel === 'High Vigilance'
                          ? 'bg-amber-400'
                          : 'bg-[#fc6c26]'
                    }`}
                  />
                  <span className="font-bold text-[#fff4d6]">
                    {currentProximity.hazardLevel}:
                  </span>
                  <span className="text-[#e8dcbe]">
                    {currentProximity.distanceToZoneKm} km to {currentProximity.nearestZone.district}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleSendMessage('What is the landslide risk near my location?')}
                  className="text-[#fc6c26] font-mono font-bold hover:text-[#fff4d6] hover:underline cursor-pointer"
                >
                  View Details &rarr;
                </button>
              </div>
            )}

            {/* Expandable Location Selector Modal Dropdown */}
            {showLocationPicker && (
              <div className="mt-2.5 rounded-xl border border-[#fc6c26]/40 bg-[#180e08] p-3 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#fc6c26] flex items-center gap-1.5">
                    <Compass size={13} />
                    Select Your Operational Sector
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowLocationPicker(false)}
                    className="text-[#a88d74] hover:text-[#fff4d6] cursor-pointer"
                    aria-label="Close location selector"
                  >
                    <X size={14} />
                  </button>
                </div>

                {gpsError && (
                  <p className="mt-2 text-[11px] text-rose-300 bg-rose-500/20 border border-rose-500/40 rounded p-1.5">
                    {gpsError}
                  </p>
                )}

                <div className="mt-2.5">
                  <input
                    type="text"
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    placeholder="Search district, town, or state..."
                    className="w-full rounded-lg border border-[#fc6c26]/40 bg-[#120a05] px-2.5 py-1.5 text-xs text-[#fff4d6] placeholder:text-[#a88d74] outline-none focus:border-[#fc6c26] shadow-sm"
                  />
                </div>

                <div className="mt-2 max-h-40 overflow-y-auto no-scrollbar space-y-1">
                  {filteredPresets.map((loc) => (
                    <button
                      key={loc.name}
                      type="button"
                      onClick={() => handleSelectPreset(loc)}
                      className={`w-full text-left flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition cursor-pointer ${
                        userLocation?.name === loc.name
                          ? 'bg-[#fc6c26] text-[#1a0800] font-bold border border-[#ff8c4b]'
                          : 'text-[#e8dcbe] hover:bg-white/10 hover:text-[#fff4d6]'
                      }`}
                    >
                      <span>{loc.name}</span>
                      <span className="font-mono text-[10px] text-[#a88d74]">{loc.state}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleDetectGps}
                    className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-[#fc6c26] bg-[#fc6c26] py-1.5 text-xs font-bold text-[#1a0800] hover:bg-[#ff7e3d] transition cursor-pointer shadow-sm"
                  >
                    <LocateFixed size={14} />
                    Use Device GPS Coordinates
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scan-grid">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                {/* Message Header / Timestamp */}
                <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-[#e8dcbe]">
                  {m.sender === 'bot' ? (
                    <>
                      <Radio size={11} className="text-[#fc6c26]" />
                      <span className="font-bold text-[#fc6c26]">SEOC TACTICAL DESK</span>
                    </>
                  ) : (
                    <>
                      <span className="font-semibold text-[#fff4d6]">You</span>
                    </>
                  )}
                  <span>&bull;</span>
                  <span className="font-mono text-[#a88d74]">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[92%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-md ${
                    m.sender === 'user'
                      ? 'bg-[#e65510] text-[#fff4d6] border border-[#fc6c26] rounded-tr-none font-medium'
                      : 'bg-[#1c120b] text-[#fff4d6] border border-[#fc6c26]/30 rounded-tl-none font-normal'
                  }`}
                >
                  <div className="whitespace-pre-line space-y-1">
                    {m.text.split('\n\n').map((paragraph, i) => (
                      <p key={i} className={paragraph.startsWith('•') ? 'pl-2' : ''}>
                        {paragraph}
                      </p>
                    ))}
                  </div>

                  {/* Interactive Action Buttons inside Bot Bubbles */}
                  {m.actions && m.actions.length > 0 && (
                    <div className="mt-3.5 pt-2.5 border-t border-white/10 flex flex-wrap gap-1.5">
                      {m.actions.map((act, actIdx) => (
                        <button
                          key={actIdx}
                          type="button"
                          onClick={() => handleExecuteAction(act)}
                          className="flex items-center gap-1 rounded-md border border-[#fc6c26]/60 bg-[#fc6c26]/20 px-2.5 py-1 text-[11px] font-bold text-[#ffb592] hover:bg-[#fc6c26] hover:text-[#1a0800] transition shadow-sm cursor-pointer"
                        >
                          <span>{act.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Recommendation Chips */}
          <div className="border-t border-[#fc6c26]/20 bg-[#120a05] px-3 py-2 overflow-x-auto no-scrollbar flex items-center gap-1.5">
            <span className="text-[10px] text-[#a88d74] font-mono uppercase shrink-0 flex items-center gap-1">
              <Zap size={11} className="text-[#fc6c26]" /> Quick:
            </span>
            <button
              type="button"
              onClick={() => handleSendMessage('What is the landslide risk near my location?')}
              className="shrink-0 rounded-full border border-[#fc6c26]/30 bg-[#22150e] px-2.5 py-0.5 text-[10px] font-medium text-[#fff4d6] hover:border-[#fc6c26] hover:bg-[#fc6c26] hover:text-[#1a0800] transition cursor-pointer"
            >
              🛡️ Am I in danger?
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage('Which strategic highways and roads are currently blocked?')}
              className="shrink-0 rounded-full border border-[#fc6c26]/30 bg-[#22150e] px-2.5 py-0.5 text-[10px] font-medium text-[#fff4d6] hover:border-[#fc6c26] hover:bg-[#fc6c26] hover:text-[#1a0800] transition cursor-pointer"
            >
              🛣️ Blocked Roads
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage('Where is my nearest designated emergency shelter?')}
              className="shrink-0 rounded-full border border-[#fc6c26]/30 bg-[#22150e] px-2.5 py-0.5 text-[10px] font-medium text-[#fff4d6] hover:border-[#fc6c26] hover:bg-[#fc6c26] hover:text-[#1a0800] transition cursor-pointer"
            >
              🏛️ Nearest Shelter
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage('Show me live IMD Doppler rainfall and weather warnings')}
              className="shrink-0 rounded-full border border-[#fc6c26]/30 bg-[#22150e] px-2.5 py-0.5 text-[10px] font-medium text-[#fff4d6] hover:border-[#fc6c26] hover:bg-[#fc6c26] hover:text-[#1a0800] transition cursor-pointer"
            >
              🌦️ IMD Weather
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage('What should I do during a landslide? Give me NDMA safety precautions')}
              className="shrink-0 rounded-full border border-[#fc6c26]/30 bg-[#22150e] px-2.5 py-0.5 text-[10px] font-medium text-[#fff4d6] hover:border-[#fc6c26] hover:bg-[#fc6c26] hover:text-[#1a0800] transition cursor-pointer"
            >
              🚨 Safety Guide
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage('Take me to GIS Operations map')}
              className="shrink-0 rounded-full border border-[#fc6c26]/30 bg-[#22150e] px-2.5 py-0.5 text-[10px] font-medium text-[#fff4d6] hover:border-[#fc6c26] hover:bg-[#fc6c26] hover:text-[#1a0800] transition cursor-pointer"
            >
              🗺️ Open GIS
            </button>
          </div>

          {/* Input & Voice Bar */}
          <div className="border-t border-[#fc6c26]/20 bg-[#170e08] p-3 rounded-b-2xl">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSendMessage()
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    isListening
                      ? 'Listening to speech... Speak now'
                      : language === 'hi'
                        ? 'भूस्खलन, सड़क या सुरक्षा सम्बन्धी प्रश्न पूछें...'
                        : 'Ask about landslide risks, roads, shelters, weather...'
                  }
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-xs text-[#fff4d6] placeholder:text-[#a88d74] outline-none transition ${
                    isListening
                      ? 'border-rose-500 bg-rose-500/20 ring-2 ring-rose-500/40'
                      : 'border-[#fc6c26]/40 bg-[#1f130b] focus:border-[#fc6c26] focus:ring-1 focus:ring-[#fc6c26]'
                  }`}
                />
              </div>

              {/* Mic Speech-to-Text Button */}
              <button
                type="button"
                onClick={toggleListening}
                className={`rounded-xl border p-2.5 transition cursor-pointer ${
                  isListening
                    ? 'border-rose-500 bg-rose-600 text-white animate-pulse'
                    : 'border-[#fc6c26]/40 bg-[#22150e] text-[#e8dcbe] hover:border-[#fc6c26] hover:text-[#fff4d6]'
                }`}
                title={isListening ? 'Stop listening' : 'Speak using microphone (Speech to Text)'}
                aria-label="Toggle voice input"
              >
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>

              {/* Submit Send Button */}
              <button
                type="submit"
                disabled={!input.trim()}
                className="flex items-center justify-center rounded-xl border border-[#fc6c26] bg-[#fc6c26] px-3.5 py-2.5 font-bold text-[#1a0800] transition hover:bg-[#ff7e3d] disabled:opacity-40 shadow-md shadow-[#fc6c26]/20 cursor-pointer"
                title="Send query"
                aria-label="Send message"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </aside>
      )}
    </>
  )
}
