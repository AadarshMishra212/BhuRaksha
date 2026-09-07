import type {
  AlertRecord,
  FieldReport,
  IncidentAction,
  Language,
  RiskZone,
  RoadSegment,
  SensorNode,
  Village,
  WeatherCell,
} from '../types'

export interface UserLocation {
  name: string
  lat: number
  lng: number
  accuracy?: number
  isGps?: boolean
  district?: string
  state?: string
}

export interface ChatAction {
  label: string
  type: 'NAVIGATE' | 'SELECT_ZONE' | 'SET_LANG' | 'TOGGLE_LIVE' | 'SET_LOCATION' | 'EMERGENCY_CALL'
  payload: string
  zoneId?: string
}

export interface ChatMessage {
  id: string
  sender: 'user' | 'bot'
  text: string
  timestamp: string
  actions?: ChatAction[]
  structuredData?: {
    type: 'hazard_card' | 'zone_detail' | 'shelter_card' | 'road_card' | 'weather_card' | 'safety_guide'
    data: any
  }
}

export interface ProximityAssessment {
  userLocation: UserLocation
  nearestZone: RiskZone
  distanceToZoneKm: number
  hazardLevel: 'Immediate Danger' | 'High Vigilance' | 'Moderate Watch' | 'Low Risk'
  nearestShelter: {
    village: Village
    distanceKm: number
  }
  nearbyRoads: {
    road: RoadSegment
    distanceKm: number
  }[]
  localWeather?: WeatherCell
  activeAlertsNearby: AlertRecord[]
}

export const PRESET_LOCATIONS: UserLocation[] = [
  { name: 'Gangtok, Sikkim', lat: 27.3389, lng: 88.6065, state: 'Sikkim', district: 'Gangtok' },
  { name: 'Shillong, Meghalaya', lat: 25.5788, lng: 91.8933, state: 'Meghalaya', district: 'East Khasi Hills' },
  { name: 'Guwahati, Assam', lat: 26.1445, lng: 91.7362, state: 'Assam', district: 'Kamrup Metro' },
  { name: 'Kohima, Nagaland', lat: 25.6751, lng: 94.1086, state: 'Nagaland', district: 'Kohima' },
  { name: 'Aizawl, Mizoram', lat: 23.7271, lng: 92.7176, state: 'Mizoram', district: 'Aizawl' },
  { name: 'Itanagar, Arunachal Pradesh', lat: 27.0844, lng: 93.6053, state: 'Arunachal Pradesh', district: 'Papum Pare' },
  { name: 'Tawang, Arunachal Pradesh', lat: 27.5861, lng: 91.8594, state: 'Arunachal Pradesh', district: 'Tawang' },
  { name: 'Haflong, Assam', lat: 25.1643, lng: 93.0175, state: 'Assam', district: 'Dima Hasao' },
  { name: 'Noney, Manipur', lat: 24.8622, lng: 93.6189, state: 'Manipur', district: 'Noney' },
  { name: 'Sohra / Cherrapunji, Meghalaya', lat: 25.2986, lng: 91.7323, state: 'Meghalaya', district: 'East Khasi Hills' },
  { name: 'Mangan, North Sikkim', lat: 27.5092, lng: 88.5341, state: 'Sikkim', district: 'Mangan' },
  { name: 'Agartala, Tripura', lat: 23.8315, lng: 91.2868, state: 'Tripura', district: 'West Tripura' },
  { name: 'Jampui Hills, Tripura', lat: 24.0185, lng: 92.2792, state: 'Tripura', district: 'North Tripura' },
  { name: 'Lunglei, Mizoram', lat: 22.8872, lng: 92.7383, state: 'Mizoram', district: 'Lunglei' },
  { name: 'Wokha, Nagaland', lat: 26.0975, lng: 94.2638, state: 'Nagaland', district: 'Wokha' },
]

/**
 * Calculates Great-Circle Distance between two coordinates in Kilometers (Haversine formula)
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Number((R * c).toFixed(1))
}

/**
 * Evaluates comprehensive hazard proximity for a given user coordinate
 */
export function assessProximity(
  location: UserLocation,
  zones: RiskZone[],
  villages: Village[],
  roads: RoadSegment[],
  weather: WeatherCell[],
  alerts: AlertRecord[],
): ProximityAssessment {
  // Find nearest risk zone
  let nearestZone = zones[0]
  let minZoneDist = 99999

  for (const z of zones) {
    const dist = calculateDistanceKm(location.lat, location.lng, z.lat, z.lng)
    if (dist < minZoneDist) {
      minZoneDist = dist
      nearestZone = z
    }
  }

  // Find nearest shelter / village
  let nearestVillage = villages[0]
  let minVillageDist = 99999

  for (const v of villages) {
    const dist = calculateDistanceKm(location.lat, location.lng, v.lat, v.lng)
    if (dist < minVillageDist) {
      minVillageDist = dist
      nearestVillage = v
    }
  }

  // Check nearby roads within 120 km
  const nearbyRoads = roads
    .map((r) => {
      let minRoadDist = 99999
      for (const pt of r.path) {
        const d = calculateDistanceKm(location.lat, location.lng, pt[0], pt[1])
        if (d < minRoadDist) minRoadDist = d
      }
      return { road: r, distanceKm: minRoadDist }
    })
    .filter((nr) => nr.distanceKm <= 120)
    .sort((a, b) => a.distanceKm - b.distanceKm)

  // Local weather
  const localWeather =
    weather.find(
      (w) =>
        (location.district && w.district.toLowerCase().includes(location.district.toLowerCase())) ||
        (location.state && w.state.toLowerCase().includes(location.state.toLowerCase())),
    ) ||
    weather.find((w) => w.district === nearestZone.district) ||
    weather[0]

  // Nearby alerts (within 40 km or in same zone)
  const activeAlertsNearby = alerts.filter(
    (a) => a.zoneId === nearestZone.id || (!a.acknowledged && minZoneDist <= 40),
  )

  // Determine overall hazard level
  let hazardLevel: ProximityAssessment['hazardLevel'] = 'Low Risk'
  if (minZoneDist <= 12) {
    if (nearestZone.severity === 'Critical') hazardLevel = 'Immediate Danger'
    else if (nearestZone.severity === 'High') hazardLevel = 'High Vigilance'
    else hazardLevel = 'Moderate Watch'
  } else if (minZoneDist <= 35) {
    if (nearestZone.severity === 'Critical' || nearestZone.severity === 'High') {
      hazardLevel = 'High Vigilance'
    } else {
      hazardLevel = 'Moderate Watch'
    }
  } else if (minZoneDist <= 65) {
    hazardLevel = 'Moderate Watch'
  }

  return {
    userLocation: location,
    nearestZone,
    distanceToZoneKm: minZoneDist,
    hazardLevel,
    nearestShelter: {
      village: nearestVillage,
      distanceKm: minVillageDist,
    },
    nearbyRoads,
    localWeather,
    activeAlertsNearby,
  }
}

export interface PlatformContext {
  zones: RiskZone[]
  sensors: SensorNode[]
  roads: RoadSegment[]
  villages: Village[]
  alerts: AlertRecord[]
  reports: FieldReport[]
  actions: IncidentAction[]
  weather: WeatherCell[]
  language: Language
  selectedZone: RiskZone | null
  live: boolean
}

/**
 * Intelligent Natural Language Processing Engine for Bhuraksha
 */
export function generateLocalAiResponse(
  query: string,
  userLocation: UserLocation | null,
  context: PlatformContext,
): ChatMessage {
  const q = query.toLowerCase().trim()
  const lang = context.language

  // 1. Check if location is not set and user asks about proximity or safety
  const proximityKeywords = ['near me', 'my location', 'am i safe', 'here', 'where i am', 'nearby', 'my area', 'closest']
  const isAskingProximity = proximityKeywords.some((k) => q.includes(k))

  if (isAskingProximity && !userLocation) {
    return {
      id: `bot-${Date.now()}`,
      sender: 'bot',
      text:
        lang === 'hi'
          ? '📍 आपकी सुरक्षा का सटीक विश्लेषण करने के लिए कृपया अपनी वर्तमान लोकेशन साझा करें या नीचे दी गई सूची में से अपना शहर/जिला चुनें।'
          : lang === 'as'
            ? '📍 আপোনাৰ সুৰক্ষা সঠিকভাৱে নিৰ্ণয় কৰিবলৈ অনুগ্ৰহ কৰি আপোনাৰ বৰ্তমান স্থান শ্বেয়াৰ কৰক বা তলৰ তালিকাৰ পৰা চহৰ বাছনি কৰক।'
            : '📍 To provide hyper-local landslide risk, road passability, and emergency shelter guidance, please share your current GPS location or select your town from the location bar above.',
      timestamp: new Date().toISOString(),
      actions: [
        { label: '📍 Gangtok, Sikkim', type: 'SET_LOCATION', payload: 'Gangtok, Sikkim' },
        { label: '📍 Shillong, Meghalaya', type: 'SET_LOCATION', payload: 'Shillong, Meghalaya' },
        { label: '📍 Guwahati, Assam', type: 'SET_LOCATION', payload: 'Guwahati, Assam' },
        { label: '📍 Haflong (Dima Hasao)', type: 'SET_LOCATION', payload: 'Haflong, Assam' },
        { label: '📍 Kohima, Nagaland', type: 'SET_LOCATION', payload: 'Kohima, Nagaland' },
      ],
    }
  }

  // 2. Proximity & Local Risk Assessment
  if (userLocation && (isAskingProximity || q.includes('risk') || q.includes('safe') || q.includes('status') || q.includes('hazard'))) {
    const assessment = assessProximity(
      userLocation,
      context.zones,
      context.villages,
      context.roads,
      context.weather,
      context.alerts,
    )

    const z = assessment.nearestZone
    const s = assessment.nearestShelter
    const r = assessment.nearbyRoads[0]

    let statusHeader = `🛡️ **Local Landslide Risk Assessment for ${userLocation.name}**\n\n`
    if (assessment.hazardLevel === 'Immediate Danger') {
      statusHeader += `🚨 **STATUS: CRITICAL DANGER ZONE** (Within ${assessment.distanceToZoneKm} km of ${z.name})\n`
    } else if (assessment.hazardLevel === 'High Vigilance') {
      statusHeader += `⚠️ **STATUS: HIGH VIGILANCE ZONE** (Within ${assessment.distanceToZoneKm} km of ${z.name})\n`
    } else {
      statusHeader += `🟢 **STATUS: ${assessment.hazardLevel.toUpperCase()}** (${assessment.distanceToZoneKm} km from ${z.name})\n`
    }

    const details = `
• **Nearest Hazard Zone**: **${z.name}** (${z.district}, ${z.state})
• **Landslide Risk Score**: **${z.riskScore.toFixed(1)} / 100** [${z.severity.toUpperCase()}]
• **Rainfall (24h / Intensity)**: ${z.rainfall24h.toFixed(1)} mm | ${z.rainfallIntensity.toFixed(1)} mm/h
• **6-Hour Forecast Trend**: ${z.forecast6h.slice(0, 3).map((v, i) => `+${i + 1}h: ${v.toFixed(0)}`).join(' ➔ ')}
• **Nearest Safe Shelter**: **${s.village.shelter}** (~${s.distanceKm} km away)
• **Key Road Connectivity**: **${r ? `${r.road.name} (${r.road.status})` : 'All local arterials active'}**

${
  assessment.hazardLevel === 'Immediate Danger'
    ? '🛑 **URGENT RECOMMENDATION**: Evacuate downslope dwellings immediately. Stay away from steep road cuts and water channels. Contact SEOC control room or NDRF.'
    : '💡 **SAFETY ADVISORY**: Monitor continuous slope weep holes, avoid night hill driving, and keep emergency supplies ready.'
}
`

    return {
      id: `bot-${Date.now()}`,
      sender: 'bot',
      text: statusHeader + details,
      timestamp: new Date().toISOString(),
      structuredData: {
        type: 'hazard_card',
        data: assessment,
      },
      actions: [
        { label: `🗺️ View ${z.name} on GIS Map`, type: 'SELECT_ZONE', payload: z.id, zoneId: z.id },
        { label: '📡 Sensor Telemetry', type: 'NAVIGATE', payload: '/sensors' },
        { label: '🚨 Early Warning Alerts', type: 'NAVIGATE', payload: '/alerts' },
      ],
    }
  }

  // 3. Shelter & Evacuation Assistance
  if (q.includes('shelter') || q.includes('evacuat') || q.includes('relief') || q.includes('camp') || q.includes('safe place')) {
    if (userLocation) {
      const assessment = assessProximity(
        userLocation,
        context.zones,
        context.villages,
        context.roads,
        context.weather,
        context.alerts,
      )
      const v = assessment.nearestShelter.village
      return {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: `🏛️ **Designated Emergency Shelter for ${userLocation.name}**\n\n• **Facility**: **${v.shelter}**\n• **Location**: ${v.name}, ${v.district}, ${v.state} (~${assessment.nearestShelter.distanceKm} km away)\n• **Village Households**: ${v.households} families\n• **Road Access**: **${v.connectivity}**\n• **Local Support Language**: ${v.language}\n\n⚠️ **Evacuation Protocol**: Carry essential documents, medical kits, and battery flashlights. Do not cross swollen mountain rivulets on foot.`,
        timestamp: new Date().toISOString(),
        structuredData: {
          type: 'shelter_card',
          data: v,
        },
        actions: [
          { label: '🏘️ View Villages & Shelters', type: 'NAVIGATE', payload: '/communities' },
          { label: '🗺️ Open GIS Map', type: 'NAVIGATE', payload: '/gis' },
        ],
      }
    } else {
      const vList = context.villages.slice(0, 5)
      return {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: `🏛️ **Active Community Relief Shelters in Northeast India**:\n\n${vList.map((v) => `• **${v.name} (${v.district})**: ${v.shelter} — Road: *${v.connectivity}*`).join('\n')}\n\n📍 *Set your location to identify the single closest emergency evacuation shelter to your GPS position.*`,
        timestamp: new Date().toISOString(),
        actions: [
          { label: '🏘️ View All Community Centers', type: 'NAVIGATE', payload: '/communities' },
          { label: '📍 Set Location (Gangtok)', type: 'SET_LOCATION', payload: 'Gangtok, Sikkim' },
          { label: '📍 Set Location (Shillong)', type: 'SET_LOCATION', payload: 'Shillong, Meghalaya' },
        ],
      }
    }
  }

  // 4. Highway & Road Corridor Status
  if (q.includes('road') || q.includes('highway') || q.includes('nh-') || q.includes('nh10') || q.includes('nh6') || q.includes('nh37') || q.includes('nh29') || q.includes('traffic') || q.includes('passable') || q.includes('blocked')) {
    const blocked = context.roads.filter((r) => r.status === 'Blocked')
    const restricted = context.roads.filter((r) => r.status === 'Restricted')
    const open = context.roads.filter((r) => r.status === 'Open')

    let response = `🛣️ **Northeast Strategic Road Corridor Intelligence**\n\n`

    if (blocked.length > 0) {
      response += `🛑 **BLOCKED CORRIDORS**:\n` + blocked.map((r) => `• **${r.name}** (${r.state}): ${r.diversion}`).join('\n') + '\n\n'
    }
    if (restricted.length > 0) {
      response += `⚠️ **RESTRICTED / CONVOY ONLY**:\n` + restricted.map((r) => `• **${r.name}** (${r.state}): ${r.diversion}`).join('\n') + '\n\n'
    }
    response += `🟢 **OPEN ROUTES**: ${open.map((r) => r.name).join(', ') || 'None currently clear'}\n\n`
    response += `*Always verify with State PWD / BRO checkpoints before committing night freight or passenger convoys.*`

    return {
      id: `bot-${Date.now()}`,
      sender: 'bot',
      text: response,
      timestamp: new Date().toISOString(),
      structuredData: {
        type: 'road_card',
        data: context.roads,
      },
      actions: [
        { label: '🗺️ View Road Network on GIS', type: 'NAVIGATE', payload: '/gis' },
        { label: '📋 View Community Logistics', type: 'NAVIGATE', payload: '/communities' },
      ],
    }
  }

  // 5. Zone specific queries (e.g. Gangtok, Chandmari, Haflong, Sonapur, Tawang, etc.)
  const matchedZone = context.zones.find(
    (z) =>
      q.includes(z.name.toLowerCase()) ||
      q.includes(z.district.toLowerCase()) ||
      q.includes(z.id.toLowerCase()) ||
      q.includes(z.state.toLowerCase()),
  )

  if (matchedZone && (q.includes('zone') || q.includes('explain') || q.includes('gangtok') || q.includes('haflong') || q.includes('shillong') || q.includes('sonapur') || q.includes('tawang') || q.includes('aizawl') || q.includes('details') || q.includes('soil') || q.includes('slope'))) {
    const z = matchedZone
    const topFactors = z.explain.slice(0, 3).map((e) => `• ${e.feature}: **${e.value}** (${(e.weight * 100).toFixed(0)}% weight)`).join('\n')

    return {
      id: `bot-${Date.now()}`,
      sender: 'bot',
      text: `🔬 **Operational Zone Profile: ${z.name}**\n\n• **District & State**: ${z.district}, ${z.state}\n• **Landslide Risk Score**: **${z.riskScore.toFixed(1)}** (${z.severity})\n• **Slope Angle**: ${z.slopeDeg}° | **Lithology**: ${z.lithology}\n• **24h Rainfall**: ${z.rainfall24h.toFixed(1)} mm (Intensity: ${z.rainfallIntensity.toFixed(1)} mm/h)\n• **Ground Displacement**: ${z.displacementMm.toFixed(2)} mm (InSAR / GNSS)\n• **Population At Risk**: ${z.populationAtRisk.toLocaleString()} people\n• **Corridor**: ${z.corridor}\n\n📊 **Key ML Model Drivers (SHAP Explainability)**:\n${topFactors}\n\n📈 **6h Forecast**: ${z.forecast6h.map((v, i) => `+${i + 1}h: ${v.toFixed(0)}`).join(' | ')}`,
      timestamp: new Date().toISOString(),
      structuredData: {
        type: 'zone_detail',
        data: z,
      },
      actions: [
        { label: `🗺️ Locate ${z.district} in GIS`, type: 'SELECT_ZONE', payload: z.id, zoneId: z.id },
        { label: '🧠 Deep ML SHAP Analysis', type: 'NAVIGATE', payload: '/ai' },
        { label: '📡 Sensors in this Zone', type: 'NAVIGATE', payload: '/sensors' },
      ],
    }
  }

  // 6. Weather & IMD Bulletins
  if (q.includes('weather') || q.includes('rain') || q.includes('precipitation') || q.includes('imd') || q.includes('monsoon') || q.includes('cloud')) {
    const totalRain = context.weather.reduce((sum, w) => sum + w.rainfallMm, 0) / context.weather.length
    const criticalCells = context.weather.filter((w) => w.warning.toLowerCase().includes('orange') || w.warning.toLowerCase().includes('red') || w.rainfallMm > 45)

    let wText = `🌦️ **IMD Live Doppler & Precipitation Telemetry**\n\n• **Regional Average 24h Rainfall**: ${totalRain.toFixed(1)} mm\n• **Active Warning Zones**:\n`
    criticalCells.slice(0, 4).forEach((w) => {
      wText += `• **${w.district} (${w.state})**: ${w.condition}, Rain: **${w.rainfallMm.toFixed(1)} mm**, Wind: ${w.windKph.toFixed(0)} km/h\n  ↳ *Warning*: ${w.warning}\n`
    })

    return {
      id: `bot-${Date.now()}`,
      sender: 'bot',
      text: wText,
      timestamp: new Date().toISOString(),
      actions: [
        { label: '🌦️ Open Full IMD Weather Radar', type: 'NAVIGATE', payload: '/weather' },
        { label: '🚨 View Early Warning Desk', type: 'NAVIGATE', payload: '/alerts' },
      ],
    }
  }

  // 7. Sensor Nodes & Telemetry
  if (q.includes('sensor') || q.includes('telemetry') || q.includes('gnss') || q.includes('piezometer') || q.includes('gauge') || q.includes('insar') || q.includes('node') || q.includes('feed')) {
    const online = context.sensors.filter((s) => s.status === 'Online').length
    const degraded = context.sensors.filter((s) => s.status === 'Degraded').length
    const offline = context.sensors.filter((s) => s.status === 'Offline').length

    return {
      id: `bot-${Date.now()}`,
      sender: 'bot',
      text: `🛰️ **IoT Telemetry & Slope Monitoring Network**\n\n• **Total Sensor Nodes**: ${context.sensors.length} across 8 States\n• **Health**: 🟢 ${online} Online | 🟡 ${degraded} Degraded | 🔴 ${offline} Offline\n• **Sensor Types Active**:\n  1. **Rain Gauges / AWS**: Instant hourly precipitation & IMD calibration\n  2. **Soil Moisture Probes**: Subsurface pore pressure saturation (0-100%)\n  3. **GNSS Differential Baselines**: Millimeter slope surface displacement\n  4. **Piezometers**: Hydrostatic pore water pressure in shear planes\n  5. **Sentinel-1 InSAR Proxies**: Satellite interferometric deformation`,
      timestamp: new Date().toISOString(),
      actions: [
        { label: '📡 Open Sensors & Feeds Page', type: 'NAVIGATE', payload: '/sensors' },
        { label: '🗺️ View Sensor Overlays on GIS', type: 'NAVIGATE', payload: '/gis' },
      ],
    }
  }

  // 8. Field Reports & Reporting Cracks
  if (q.includes('report') || q.includes('crack') || q.includes('debris') || q.includes('volunteer') || q.includes('submit') || q.includes('field intelligence')) {
    return {
      id: `bot-${Date.now()}`,
      sender: 'bot',
      text: `📱 **Field Intelligence & Ground Incident Reporting**\n\nGround observers, PWD engineers, and VDMC volunteers can log real-time slope anomalies directly:\n\n• **Reportable Categories**:\n  1. ⚡ **Slope Tension Cracks** (crown fissures > 2 cm)\n  2. 🪨 **Debris / Boulder Fall on Carriageway**\n  3. 🌊 **Blocked Weep Holes & Muddy Slurry Runoff**\n  4. 🏚️ **Building / Retaining Wall Tilt**\n  5. 🏞️ **Toe Erosion & River Cut**\n\n*Offline-first storage automatically syncs when satellite or mobile connection is restored.*`,
      timestamp: new Date().toISOString(),
      actions: [
        { label: '📝 Open Field Intelligence Desk', type: 'NAVIGATE', payload: '/field' },
        { label: '🚨 View Early Warning Alerts', type: 'NAVIGATE', payload: '/alerts' },
      ],
    }
  }

  // 9. Navigation Commands
  if (q.startsWith('go to') || q.startsWith('open') || q.startsWith('navigate') || q.includes('take me to') || q.includes('show me page')) {
    if (q.includes('gis') || q.includes('map')) {
      return {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: '🗺️ Navigating directly to **GIS Operations Map** with interactive multi-layer terrain, hazard contours, and live telemetry.',
        timestamp: new Date().toISOString(),
        actions: [{ label: '🚀 Go to GIS Operations', type: 'NAVIGATE', payload: '/gis' }],
      }
    }
    if (q.includes('alert') || q.includes('early warning')) {
      return {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: '🚨 Navigating to **Early Warning & Alert Dissemination Desk**.',
        timestamp: new Date().toISOString(),
        actions: [{ label: '🚀 Open Early Warning Desk', type: 'NAVIGATE', payload: '/alerts' }],
      }
    }
    if (q.includes('ai') || q.includes('engine') || q.includes('model')) {
      return {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: '🧠 Opening the **AI Gradient-Boosted Slope Failure Engine** with SHAP explainability matrices.',
        timestamp: new Date().toISOString(),
        actions: [{ label: '🚀 Go to AI Engine', type: 'NAVIGATE', payload: '/ai' }],
      }
    }
    if (q.includes('response') || q.includes('sdrf') || q.includes('ndrf')) {
      return {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: '🛡️ Opening the **Incident Response Desk & Unit Dispatch Board**.',
        timestamp: new Date().toISOString(),
        actions: [{ label: '🚀 Go to Response Desk', type: 'NAVIGATE', payload: '/response' }],
      }
    }
    if (q.includes('report') || q.includes('sitrep') || q.includes('field')) {
      return {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: '📝 Opening **Field Intelligence Desk**.',
        timestamp: new Date().toISOString(),
        actions: [{ label: '🚀 Go to Field Intelligence', type: 'NAVIGATE', payload: '/field' }],
      }
    }
    if (q.includes('home') || q.includes('command')) {
      return {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: '🏠 Navigating to **SEOC Master Command Center**.',
        timestamp: new Date().toISOString(),
        actions: [{ label: '🚀 Go to Command Center', type: 'NAVIGATE', payload: '/' }],
      }
    }
  }

  // 10. Language switching
  if (q.includes('hindi') || q.includes('हिन्दी')) {
    return {
      id: `bot-${Date.now()}`,
      sender: 'bot',
      text: '🇮🇳 भाषा को **हिन्दी (Hindi)** में बदल दिया गया है। आप भूस्खलन चेतावनी और सुरक्षा सम्बन्धी कोई भी प्रश्न पूछ सकते हैं।',
      timestamp: new Date().toISOString(),
      actions: [{ label: '🇮🇳 Switch Language to Hindi', type: 'SET_LANG', payload: 'hi' }],
    }
  }
  if (q.includes('assamese') || q.includes('অসমীয়া')) {
    return {
      id: `bot-${Date.now()}`,
      sender: 'bot',
      text: '🇮🇳 ভাষা **অসমীয়া (Assamese)** লৈ সলনি কৰা হৈছে। ভূমিস্খলন সতৰ্কবাণী আৰু সুৰক্ষা সম্বন্ধীয় যিকোনো প্ৰশ্ন সুধিব পাৰে।',
      timestamp: new Date().toISOString(),
      actions: [{ label: '🇮🇳 Switch Language to Assamese', type: 'SET_LANG', payload: 'as' }],
    }
  }

  // 11. Safety Guidelines & Precautions
  if (q.includes('what to do') || q.includes('precautions') || q.includes('dos and donts') || q.includes('safety tips') || q.includes('landslide tips')) {
    return {
      id: `bot-${Date.now()}`,
      sender: 'bot',
      text: `🚨 **Official NDMA Landslide Safety Protocols**\n\n**BEFORE A LANDSLIDE**:\n• Inspect retaining walls for cracks, bulging, or new water seeps.\n• Clear hillside drainage channels of colluvium and fallen leaves.\n• Prepare an Emergency Go-Bag (water, torch, first aid, medicines, documents).\n\n**DURING A LANDSLIDE**:\n• Move away from the path of debris flow to higher, stable ground immediately.\n• If indoors, take shelter under sturdy furniture and protect your head.\n• Never cross a road when water with mud or rolling boulders is flowing.\n\n**AFTER A LANDSLIDE**:\n• Stay clear of slide areas; secondary failures often follow immediately.\n• Check for trapped or injured persons without entering direct hazard zone.\n• Report broken utility lines and slope movement to SEOC / local authorities.`,
      timestamp: new Date().toISOString(),
      actions: [
        { label: '🏛️ Locate Safe Emergency Shelters', type: 'NAVIGATE', payload: '/communities' },
        { label: '🚨 View Early Warning Alerts', type: 'NAVIGATE', payload: '/alerts' },
      ],
    }
  }

  // Default Comprehensive Response
  const criticalZones = context.zones.filter((z) => z.severity === 'Critical')
  return {
    id: `bot-${Date.now()}`,
    sender: 'bot',
    text: `👋 **Hello! I am Shru, your Bhuraksha SEOC AI Operations Assistant.**\n\nI have complete real-time access to the **National Landslide Early Warning System** across all 8 Northeast states:\n\n• 📍 **Location-Based Risk**: Share your GPS location to get tailored landslide nowcasts, road connectivity, and nearest shelters.\n• 📊 **16 Active High-Risk Zones**: Instant ML risk scores, SHAP explainability, and 6-hour predictive nowcasts.\n• 🛣️ **Strategic Highway Status**: Real-time road passability (NH-10, NH-6, NH-37, Balipara-Tawang) and diversions.\n• 🛰️ **IoT Telemetry**: Rain gauges, InSAR satellites, GNSS displacement, and piezometers.\n• 🌦️ **IMD Doppler Bulletins & Alerts**: Multi-lingual emergency broadcasts.\n\n*What would you like to explore or check with Shru right now?*`,
    timestamp: new Date().toISOString(),
    actions: [
      { label: '📍 Check Risk Near My Location', type: 'SET_LOCATION', payload: 'Gangtok, Sikkim' },
      { label: '🛣️ Check Strategic Road Passability', type: 'NAVIGATE', payload: '/gis' },
      { label: `⚠️ View ${criticalZones.length} Critical Alert Zones`, type: 'NAVIGATE', payload: '/alerts' },
      { label: '🧠 Explain AI Gradient-Boosted Model', type: 'NAVIGATE', payload: '/ai' },
    ],
  }
}
