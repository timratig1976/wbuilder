/**
 * anomalyDetector.js
 *
 * Findet NEUE Patterns durch statistischen Vergleich:
 * Was an dieser Site weicht vom Durchschnitt aller bisherigen Fingerprints ab?
 *
 * Kein GPT-4o nötig — rein deterministisch auf CSS/DOM-Daten.
 */

const { readFileSync, existsSync } = require('fs')
const path = require('path')

const BASELINE_PATH = path.join(__dirname, 'data/css-baseline.json')

// ─── Baseline verwalten ────────────────────────────────────────────────────

function loadBaseline() {
  try { return JSON.parse(readFileSync(BASELINE_PATH, 'utf-8')) }
  catch { return { sites_count: 0, properties: {} } }
}

/**
 * Baseline mit neuen CSS-Daten aktualisieren.
 * cssData: { property: value } Objekt von Puppeteer
 */
function updateBaseline(cssData, baseline) {
  baseline.sites_count++
  for (const [prop, value] of Object.entries(cssData)) {
    if (!baseline.properties[prop]) {
      baseline.properties[prop] = { total: 0, values: {} }
    }
    baseline.properties[prop].total++
    const valKey = String(value)
    baseline.properties[prop].values[valKey] =
      (baseline.properties[prop].values[valKey] || 0) + 1
  }
  return baseline
}

/**
 * Berechnet wie auffällig ein CSS-Property-Wert ist.
 * Rückgabe: 0.0 (total normal) bis 1.0 (nie zuvor gesehen)
 */
function rarityScore(prop, value, baseline) {
  const propData = baseline.properties[prop]
  if (!propData || baseline.sites_count < 5) return 0 // zu wenig Daten
  const seenCount = propData.values[String(value)] || 0
  return 1 - (seenCount / baseline.sites_count)
}

// ─── CSS-Daten die wir aus Puppeteer extrahieren wollen ────────────────────

/**
 * Erweiterte CSS-Extraktion — direkt im Puppeteer evaluate() Block ausführen.
 * Gibt strukturiertes Objekt zurück das ins Fingerprint fließt.
 */
const PUPPETEER_EXTRACT_SCRIPT = `
(function() {
  const sections = Array.from(document.querySelectorAll('section, [class*="section"], main > div'))
  const firstSection = sections[0]
  const body = document.body

  function getStyle(el, prop) {
    return el ? getComputedStyle(el).getPropertyValue(prop).trim() : ''
  }

  // Pseudo-Element Analyse über getComputedStyle (::after)
  function hasPseudoConcave(el) {
    if (!el) return false
    try {
      const after = getComputedStyle(el, '::after')
      const br = after.borderRadius || ''
      return br.includes('50%') || br.includes('100%')
    } catch { return false }
  }

  // Negative Margins
  function hasNegativeMargin(elements) {
    return Array.from(elements).some(el => {
      const mt = parseFloat(getStyle(el, 'margin-top'))
      return mt < -10
    })
  }

  // backdrop-filter check
  const allEls = document.querySelectorAll('*')
  const hasBackdropBlur = Array.from(allEls).some(el =>
    getStyle(el, 'backdrop-filter').includes('blur') ||
    getStyle(el, '-webkit-backdrop-filter').includes('blur')
  )

  // clip-path diagonal check
  const hasClipPath = Array.from(sections).some(el =>
    getStyle(el, 'clip-path').includes('polygon')
  )

  // SVG backgrounds
  const hasSvgBackground = Array.from(allEls).some(el =>
    getStyle(el, 'background-image').includes('svg')
  )

  // scroll-driven animation
  const hasScrollAnimation = Array.from(allEls).some(el => {
    const at = getStyle(el, 'animation-timeline')
    return at && at !== 'auto' && at !== 'none'
  })

  // counting/data-target attributes (counter animations)
  const hasCounterAnim = document.querySelectorAll('[data-target],[data-count],[data-number]').length > 0

  // gradient text
  const hasGradientText = Array.from(allEls).some(el => {
    const bg = getStyle(el, 'background-image')
    const fill = getStyle(el, '-webkit-text-fill-color')
    return bg.includes('gradient') && (fill === 'transparent' || fill === 'rgba(0, 0, 0, 0)')
  })

  // noise texture (base64 bg)
  const hasNoiseTexture = Array.from(allEls).some(el =>
    getStyle(el, 'background-image').includes('base64') ||
    getStyle(el, 'background-image').includes('noise')
  )

  // bento grid: grid with varied column spans
  const allGridEls = Array.from(allEls).filter(el => getStyle(el, 'display') === 'grid')
  const hasBentoGrid = allGridEls.some(el => {
    const children = Array.from(el.children)
    const spans = children.map(c => getStyle(c, 'grid-column'))
    return spans.some(s => s.includes('span 2') || s.includes('span 3'))
  })

  // sticky/transparent nav
  const nav = document.querySelector('nav, header')
  const navBg = getStyle(nav, 'background-color')
  const navPos = getStyle(nav, 'position')
  const hasTransparentNav = navBg.includes('rgba(') && navBg.includes(', 0)') || navBg === 'transparent'

  return {
    // Standard
    h1_font:           getStyle(document.querySelector('h1'), 'font-family'),
    h1_weight:         getStyle(document.querySelector('h1'), 'font-weight'),
    h1_size:           getStyle(document.querySelector('h1'), 'font-size'),
    body_font:         getStyle(body, 'font-family'),
    body_bg:           getStyle(body, 'background-color'),
    body_color:        getStyle(body, 'color'),
    nav_bg:            getStyle(nav, 'background-color'),
    nav_position:      navPos,
    // Detected patterns (boolean)
    has_backdrop_blur:    hasBackdropBlur,
    has_clip_path:        hasClipPath,
    has_svg_background:   hasSvgBackground,
    has_scroll_animation: hasScrollAnimation,
    has_counter_anim:     hasCounterAnim,
    has_gradient_text:    hasGradientText,
    has_noise_texture:    hasNoiseTexture,
    has_bento_grid:       hasBentoGrid,
    has_transparent_nav:  hasTransparentNav,
    has_negative_margin:  hasNegativeMargin(sections),
    has_pseudo_concave:   sections.length > 0 ? hasPseudoConcave(firstSection) : false,
    // Counts
    section_count:     sections.length,
    grid_count:        allGridEls.length,
    svg_count:         document.querySelectorAll('svg').length,
    theme_color:       document.querySelector('meta[name="theme-color"]')?.content || '',
  }
})()
`

// ─── Anomaly Detection ──────────────────────────────────────────────────────

/**
 * Nimmt CSS-Daten einer Site und findet Anomalien gegenüber der Baseline.
 * Gibt strukturierte Anomaly-Candidates zurück.
 */
function detectAnomalies(cssData, baseline) {
  if (baseline.sites_count < 5) {
    return [] // zu wenig Daten für sinnvolle Analyse
  }

  const anomalies = []

  // Boolean-Flags: selten=true ist auffällig
  const boolFlags = {
    has_backdrop_blur:    { name: 'Glassmorphism-Effekt',        category: 'decoration',  hint: 'backdrop-filter: blur()' },
    has_clip_path:        { name: 'Diagonaler Clip-Path Schnitt', category: 'transition',  hint: 'clip-path: polygon()' },
    has_svg_background:   { name: 'SVG-Hintergrundgrafik',        category: 'decoration',  hint: 'background-image: url(svg)' },
    has_scroll_animation: { name: 'Scroll-Driven Animation',      category: 'animation',   hint: 'animation-timeline: scroll()' },
    has_counter_anim:     { name: 'Zähler-Animation',             category: 'animation',   hint: 'data-target / data-count attributes' },
    has_gradient_text:    { name: 'Gradient Text Effect',         category: 'typography',  hint: '-webkit-text-fill-color: transparent' },
    has_noise_texture:    { name: 'Noise-Textur Hintergrund',     category: 'decoration',  hint: 'base64 background-image' },
    has_bento_grid:       { name: 'Bento-Grid Layout',            category: 'layout',      hint: 'grid-column: span 2+' },
    has_transparent_nav:  { name: 'Transparente Nav am Start',    category: 'interaction', hint: 'nav background: transparent' },
    has_negative_margin:  { name: 'Negative Margin Überlappung',  category: 'layout',      hint: 'margin-top: negative' },
    has_pseudo_concave:   { name: 'Konkave Pseudo-Element Kurve', category: 'transition',  hint: '::after border-radius: 50%' },
  }

  for (const [flag, meta] of Object.entries(boolFlags)) {
    if (!cssData[flag]) continue // nicht vorhanden

    const rarity = rarityScore(flag, 'true', baseline)
    if (rarity < 0.5) continue // mehr als 50% der Sites haben das — nicht auffällig

    anomalies.push({
      observation:  `${meta.name} — selten bei ${Math.round((1 - rarity) * 100)}% der analysierten Sites`,
      category:     meta.category,
      confidence:   0.7 + rarity * 0.25, // höhere Seltenheit = höhere Confidence
      css_hint:     meta.hint,
      reusability:  'universal',
      source:       'anomaly-detector',
    })
  }

  // Numerische Ausreißer: z.B. sehr viele SVGs, ungewöhnliche Font-Größe
  if (cssData.svg_count > 10) {
    anomalies.push({
      observation:  `Ungewöhnlich viele SVG-Elemente (${cssData.svg_count}) — wahrscheinlich SVG-basierte Dekorationen oder Illustrationen`,
      category:     'decoration',
      confidence:   0.75,
      css_hint:     `${cssData.svg_count} SVG elements found`,
      reusability:  'universal',
      source:       'anomaly-detector',
    })
  }

  const h1Size = parseFloat(cssData.h1_size)
  if (h1Size >= 80) {
    anomalies.push({
      observation:  `Extrem große Headline (${cssData.h1_size}) — Display-Typografie als Hauptgestaltungselement`,
      category:     'typography',
      confidence:   0.8,
      css_hint:     `h1 font-size: ${cssData.h1_size}`,
      reusability:  'paradigm-specific',
      source:       'anomaly-detector',
    })
  }

  return anomalies
}

module.exports = {
  PUPPETEER_EXTRACT_SCRIPT,
  updateBaseline,
  detectAnomalies,
  loadBaseline,
}
