import OpenAI from 'openai'
import { StyleParadigm } from '../types/manifest'

export interface SurpriseObservation {
  observation: string
  category: 'layout' | 'transition' | 'animation' | 'typography' | 'decoration' | 'interaction' | 'color'
  confidence: number
  css_hint: string | null
  reusability: 'universal' | 'paradigm-specific' | 'brand-specific'
}

export interface ScrapedFingerprint {
  url: string
  scraped_at: string
  colors: {
    primary: string; background: string; text: string; accent: string
  }
  typography: {
    heading_font: string; body_font: string
    heading_weight: string; heading_size: string
  }
  layout: {
    nav_style: string; hero_style: string
    section_count: number; grid_max_cols: number
  }
  decoration: {
    has_backdrop_blur: boolean; has_clip_path: boolean
    has_gradient_text: boolean; has_noise_texture: boolean
    has_bento_grid: boolean; has_negative_margin: boolean
    has_svg_background: boolean
  }
  animation: {
    has_scroll_animation: boolean; has_counter_anim: boolean
    has_css_transitions: boolean
  }
  paradigm_detected: StyleParadigm
  tags: string[]
  section_sequence: string[]
  surprises: SurpriseObservation[]
  confidence: number
  _raw_css?: Record<string, unknown>
}

const EXTENDED_EXTRACT = `(function() {
  const sections = Array.from(document.querySelectorAll('section, [class*="section"], main > div'))
  const firstSection = sections[0]
  const body = document.body
  const nav = document.querySelector('nav, header')
  const h1 = document.querySelector('h1')

  function getStyle(el, prop) {
    return el ? getComputedStyle(el).getPropertyValue(prop).trim() : ''
  }

  const allEls = Array.from(document.querySelectorAll('*'))
  const allGridEls = allEls.filter(el => getComputedStyle(el).display === 'grid')

  function hasBackdropBlur() {
    return allEls.some(el => getComputedStyle(el).backdropFilter && getComputedStyle(el).backdropFilter !== 'none')
  }
  function hasClipPath() {
    return allEls.some(el => getComputedStyle(el).clipPath && getComputedStyle(el).clipPath !== 'none')
  }
  function hasSvgBackground() {
    return allEls.some(el => {
      const bg = getComputedStyle(el).backgroundImage
      return bg && bg.includes('svg')
    })
  }
  function hasScrollAnimation() {
    return allEls.some(el => {
      const anim = getComputedStyle(el).animation
      return anim && anim !== 'none' && anim.includes('scroll')
    })
  }
  function hasCounterAnim() {
    return !!document.querySelector('[data-target], [data-count], .counter, .count-up')
  }
  function hasGradientText() {
    return allEls.some(el => {
      const bg = getComputedStyle(el).backgroundImage
      const clip = getComputedStyle(el).webkitBackgroundClip || getComputedStyle(el).backgroundClip
      return bg && bg.includes('gradient') && clip === 'text'
    })
  }
  function hasNoiseTexture() {
    return allEls.some(el => {
      const bg = getComputedStyle(el).backgroundImage
      return bg && (bg.includes('noise') || bg.includes('grain') || bg.includes('url("data:image/svg+xml'))
    })
  }
  function hasBentoGrid() {
    return allGridEls.some(el => {
      const cols = getComputedStyle(el).gridTemplateColumns
      return cols && cols.split(' ').length >= 3
    })
  }
  function hasTransparentNav() {
    if (!nav) return false
    const bg = getComputedStyle(nav).backgroundColor
    return bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)'
  }
  function hasNegativeMargin(sections) {
    return sections.some(el => {
      const mt = parseFloat(getComputedStyle(el).marginTop)
      const mb = parseFloat(getComputedStyle(el).marginBottom)
      return mt < 0 || mb < 0
    })
  }
  function hasCssTransitions() {
    return allEls.some(el => {
      const t = getComputedStyle(el).transition
      return t && t !== 'all 0s ease 0s' && t !== 'none'
    })
  }

  const navPos = nav ? getComputedStyle(nav).position : ''

  return {
    h1_font: getStyle(h1, 'font-family'),
    h1_weight: getStyle(h1, 'font-weight'),
    h1_size: getStyle(h1, 'font-size'),
    body_font: getStyle(body, 'font-family'),
    body_bg: getStyle(body, 'background-color'),
    body_color: getStyle(body, 'color'),
    nav_bg: getStyle(nav, 'background-color'),
    nav_position: navPos,
    has_backdrop_blur: hasBackdropBlur(),
    has_clip_path: hasClipPath(),
    has_svg_background: hasSvgBackground(),
    has_scroll_animation: hasScrollAnimation(),
    has_counter_anim: hasCounterAnim(),
    has_gradient_text: hasGradientText(),
    has_noise_texture: hasNoiseTexture(),
    has_bento_grid: hasBentoGrid(),
    has_transparent_nav: hasTransparentNav(),
    has_negative_margin: hasNegativeMargin(sections),
    has_css_transitions: hasCssTransitions(),
    section_count: sections.length,
    grid_count: allGridEls.length,
    svg_count: document.querySelectorAll('svg').length,
    theme_color: document.querySelector('meta[name="theme-color"]')?.content || '',
  }
})()`

function buildVisionPrompt(url: string, cssData: Record<string, unknown>): string {
  return `You are a senior design analyst reviewing a website screenshot.
Analyze BOTH the visual design AND the extracted CSS data below.
Respond ONLY with valid JSON matching this exact schema. No markdown, no explanation.

URL: ${url}
CSS extracted from browser: ${JSON.stringify(cssData)}

JSON schema:
{
  "confidence": 0.0-1.0,
  "colors": {
    "primary": "#hex",
    "background": "#hex",
    "text": "#hex",
    "accent": "#hex"
  },
  "typography": {
    "heading_font": "string",
    "body_font": "string",
    "heading_weight": "string",
    "heading_size": "string"
  },
  "layout": {
    "nav_style": "sticky|static|transparent|hidden",
    "hero_style": "centered|split|fullscreen|minimal",
    "section_count": 0,
    "grid_max_cols": 0
  },
  "decoration": {
    "has_backdrop_blur": false,
    "has_clip_path": false,
    "has_gradient_text": false,
    "has_noise_texture": false,
    "has_bento_grid": false,
    "has_negative_margin": false,
    "has_svg_background": false
  },
  "animation": {
    "has_scroll_animation": false,
    "has_counter_anim": false,
    "has_css_transitions": false
  },
  "paradigm_detected": "minimal-clean|tech-dark|bold-expressive|luxury-editorial|bento-grid|brutalist",
  "tags": ["string"],
  "section_sequence": ["hero", "features", "..."],
  "surprises": [
    {
      "observation": "Describe in 1-2 sentences something UNUSUAL, CLEVER, or DESIGN-FORWARD that you rarely see. Be specific and visual.",
      "category": "layout|transition|animation|typography|decoration|interaction|color",
      "confidence": 0.0-1.0,
      "css_hint": "If CSS data supports this, quote the relevant property. Otherwise null.",
      "reusability": "universal|paradigm-specific|brand-specific"
    }
  ]
}

CRITICAL for surprises:
- Include 3-6 genuinely unusual observations only
- Only include surprises where confidence >= 0.65
- reusability: universal = works in any design, paradigm-specific = fits a style, brand-specific = too tied to this brand
- Quality over quantity — if nothing is genuinely surprising, return fewer items`
}

export async function scrapeSite(url: string): Promise<ScrapedFingerprint> {
  let puppeteer: typeof import('puppeteer') | null = null
  try {
    puppeteer = await import('puppeteer')
  } catch {
    throw new Error('puppeteer not installed. Run: npm install puppeteer')
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  })

  let screenshot: Buffer
  let cssData: Record<string, unknown> = {}

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1440, height: 900 })
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 })
    await new Promise((r) => setTimeout(r, 1500))

    screenshot = await page.screenshot({ type: 'jpeg', quality: 85, fullPage: false }) as Buffer

    try {
      cssData = await page.evaluate(EXTENDED_EXTRACT) as Record<string, unknown>
    } catch {
      cssData = {}
    }
  } finally {
    await browser.close()
  }

  // Call GPT-4o Vision
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const base64 = screenshot.toString('base64')

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 2000,
    temperature: 0.1,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${base64}`, detail: 'high' },
          },
          {
            type: 'text',
            text: buildVisionPrompt(url, cssData),
          },
        ],
      },
    ],
  })

  const raw = response.choices[0]?.message?.content ?? '{}'
  let parsed: Partial<ScrapedFingerprint>
  try {
    parsed = JSON.parse(raw) as Partial<ScrapedFingerprint>
  } catch {
    parsed = {}
  }

  const fingerprint: ScrapedFingerprint = {
    url,
    scraped_at: new Date().toISOString(),
    colors: parsed.colors ?? { primary: '#000', background: '#fff', text: '#333', accent: '#0066ff' },
    typography: parsed.typography ?? { heading_font: 'sans-serif', body_font: 'sans-serif', heading_weight: '700', heading_size: '2rem' },
    layout: parsed.layout ?? { nav_style: 'static', hero_style: 'centered', section_count: 0, grid_max_cols: 3 },
    decoration: {
      has_backdrop_blur:  (cssData.has_backdrop_blur as boolean) ?? parsed.decoration?.has_backdrop_blur ?? false,
      has_clip_path:      (cssData.has_clip_path as boolean) ?? parsed.decoration?.has_clip_path ?? false,
      has_gradient_text:  (cssData.has_gradient_text as boolean) ?? parsed.decoration?.has_gradient_text ?? false,
      has_noise_texture:  (cssData.has_noise_texture as boolean) ?? parsed.decoration?.has_noise_texture ?? false,
      has_bento_grid:     (cssData.has_bento_grid as boolean) ?? parsed.decoration?.has_bento_grid ?? false,
      has_negative_margin:(cssData.has_negative_margin as boolean) ?? parsed.decoration?.has_negative_margin ?? false,
      has_svg_background: (cssData.has_svg_background as boolean) ?? parsed.decoration?.has_svg_background ?? false,
    },
    animation: {
      has_scroll_animation: (cssData.has_scroll_animation as boolean) ?? parsed.animation?.has_scroll_animation ?? false,
      has_counter_anim:     (cssData.has_counter_anim as boolean) ?? parsed.animation?.has_counter_anim ?? false,
      has_css_transitions:  (cssData.has_css_transitions as boolean) ?? parsed.animation?.has_css_transitions ?? false,
    },
    paradigm_detected: (parsed.paradigm_detected as StyleParadigm) ?? 'minimal-clean',
    tags: parsed.tags ?? [],
    section_sequence: parsed.section_sequence ?? [],
    surprises: (parsed.surprises ?? []).filter((s) => s.confidence >= 0.65),
    confidence: parsed.confidence ?? 0.5,
    _raw_css: cssData,
  }

  // Fire-and-forget: ingest into discovery pipeline
  ingestDiscovery(fingerprint, cssData).catch(console.error)

  return fingerprint
}

async function ingestDiscovery(
  fingerprint: ScrapedFingerprint,
  cssData: Record<string, unknown>
): Promise<void> {
  try {
    const { ingestSurprises } = await import('../discovery/discoveryQueue')
    if (fingerprint.surprises?.length) {
      ingestSurprises(fingerprint.surprises, fingerprint)
    }
  } catch { /* discovery module may not exist yet */ }

  try {
    const { detectAnomalies, loadBaseline, updateBaseline, saveBaseline } = await import('../discovery/anomalyDetector')
    const baseline = loadBaseline()
    const anomalies = detectAnomalies(cssData, baseline)
    if (anomalies.length) {
      const { ingestSurprises } = await import('../discovery/discoveryQueue')
      ingestSurprises(anomalies, fingerprint)
    }
    saveBaseline(updateBaseline(cssData, baseline))
  } catch { /* discovery module may not exist yet */ }
}
