/**
 * BHOOMI Audio & Voice Notification Engine
 * 100% Offline / Client-Side — Zero external audio files or API keys required.
 * Uses Web Audio API for synthetic emergency sirens and Web Speech API for voice advisories.
 */

let audioCtx: AudioContext | null = null
let activeOscillator: OscillatorNode | null = null
let activeGain: GainNode | null = null
let alarmInterval: number | null = null
let isPlayingAlarm = false

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (AudioContextClass) {
      audioCtx = new AudioContextClass()
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

/**
 * Plays synthesized emergency sirens / warning chimes
 */
export function playEmergencyAlarm(type: 'thunderstorm' | 'landslide_evacuation' | 'chime' = 'thunderstorm') {
  stopEmergencyAlarm()
  const ctx = getAudioContext()
  if (!ctx) return

  isPlayingAlarm = true

  if (type === 'chime') {
    // Pleasant dual-tone alert chime
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(587.33, now) // D5
    osc.frequency.setValueAtTime(880, now + 0.15) // A5

    gain.gain.setValueAtTime(0.15, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.6)

    setTimeout(() => {
      isPlayingAlarm = false
    }, 650)
    return
  }

  if (type === 'thunderstorm') {
    // Pulsating thunderstorm warning warble (low-to-mid frequency pulsing tone)
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(440, now) // A4

    // LFO frequency modulation for pulse
    let up = true
    let freq = 440
    gain.gain.setValueAtTime(0.2, now)

    alarmInterval = window.setInterval(() => {
      if (!audioCtx || !isPlayingAlarm) return
      freq = up ? 660 : 440
      up = !up
      if (activeOscillator) {
        activeOscillator.frequency.setTargetAtTime(freq, audioCtx.currentTime, 0.08)
      }
    }, 300)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()

    activeOscillator = osc
    activeGain = gain
  } else if (type === 'landslide_evacuation') {
    // High-urgency European / Indian disaster siren (two-tone alternating hi-lo)
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(780, now)
    gain.gain.setValueAtTime(0.18, now)

    let high = true
    alarmInterval = window.setInterval(() => {
      if (!audioCtx || !isPlayingAlarm) return
      const nextFreq = high ? 960 : 640
      high = !high
      if (activeOscillator) {
        activeOscillator.frequency.setTargetAtTime(nextFreq, audioCtx.currentTime, 0.05)
      }
    }, 450)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()

    activeOscillator = osc
    activeGain = gain
  }
}

/**
 * Stops any active emergency siren
 */
export function stopEmergencyAlarm() {
  isPlayingAlarm = false
  if (alarmInterval) {
    clearInterval(alarmInterval)
    alarmInterval = null
  }
  if (activeOscillator) {
    try {
      activeOscillator.stop()
      activeOscillator.disconnect()
    } catch {
      // ignore
    }
    activeOscillator = null
  }
  if (activeGain) {
    try {
      activeGain.disconnect()
    } catch {
      // ignore
    }
    activeGain = null
  }
}

export function isAlarmActive(): boolean {
  return isPlayingAlarm
}

/**
 * Speaks an urgent emergency voice directive using Web Speech API
 */
export function speakBhoomiAdvisory(message: string, onEnd?: () => void) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onEnd?.()
    return
  }

  // Cancel any previous speech
  window.speechSynthesis.cancel()

  const cleanText = message.replace(/[#*`_~]/g, '')
  const utterance = new SpeechSynthesisUtterance(cleanText)

  // Configure natural voice settings
  utterance.rate = 1.02
  utterance.pitch = 1.05
  utterance.volume = 1.0

  // Prefer English (India or Great Britain) voice if available
  const voices = window.speechSynthesis.getVoices()
  const preferredVoice =
    voices.find((v) => v.lang.includes('en-IN') || v.lang.includes('en_IN')) ||
    voices.find((v) => v.lang.includes('en-GB') || v.lang.includes('en-US'))

  if (preferredVoice) {
    utterance.voice = preferredVoice
  }

  utterance.onend = () => {
    onEnd?.()
  }

  utterance.onerror = () => {
    onEnd?.()
  }

  window.speechSynthesis.speak(utterance)
}

/**
 * Stops any ongoing voice speech
 */
export function stopSpeech() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
}
