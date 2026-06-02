const BRAND_PRESETS = [
  {
    match: /royal caribbean/i,
    themeName: 'Royal Caribbean Bluewater',
    primary: '#123d73',
    secondary: '#f2b705',
    accent: '#eaf4ff',
    tone: 'High-energy family and expedition cruising'
  },
  {
    match: /carnival/i,
    themeName: 'Carnival Funship',
    primary: '#c8102e',
    secondary: '#005eb8',
    accent: '#fff2f4',
    tone: 'Bright family vacation operations'
  },
  {
    match: /norwegian/i,
    themeName: 'Norwegian Freestyle',
    primary: '#005eb8',
    secondary: '#00a3e0',
    accent: '#eef8ff',
    tone: 'Flexible freestyle cruising'
  },
  {
    match: /holland america/i,
    themeName: 'Holland America Classic',
    primary: '#063b63',
    secondary: '#8a6f2a',
    accent: '#f4f0e6',
    tone: 'Premium heritage cruising'
  },
  {
    match: /princess/i,
    themeName: 'Princess Ocean Medallion',
    primary: '#003e7e',
    secondary: '#00a5df',
    accent: '#edf7fc',
    tone: 'Polished destination-forward cruising'
  },
  {
    match: /celebrity/i,
    themeName: 'Celebrity Modern Luxury',
    primary: '#1f2937',
    secondary: '#c8a96a',
    accent: '#f7f3ea',
    tone: 'Modern luxury guest experience'
  },
  {
    match: /disney/i,
    themeName: 'Disney Nautical Magic',
    primary: '#0b3d91',
    secondary: '#f6c800',
    accent: '#eef3ff',
    tone: 'Family storytelling at sea'
  }
]

const FALLBACK_BRAND = {
  themeName: 'Cruise Explorer Default',
  primary: '#17456b',
  secondary: '#2f8f9d',
  accent: '#eef7f9',
  tone: 'Neutral multi-cruise-line operations'
}

function getCruiseLineBranding(cruiseLine = {}) {
  const name = cruiseLine.name || ''
  const preset = BRAND_PRESETS.find(candidate => candidate.match.test(name)) || FALLBACK_BRAND

  return {
    ...preset,
    displayName: name || 'Selected cruise line',
    country: cruiseLine.country || 'Global operations',
    website: cruiseLine.website || '',
    isFallback: preset === FALLBACK_BRAND
  }
}

export { BRAND_PRESETS, FALLBACK_BRAND, getCruiseLineBranding }
