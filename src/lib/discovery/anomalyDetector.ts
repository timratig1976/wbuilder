import path from 'path'
import fs from 'fs'
import { SurpriseObservation } from '../scraping/siteScraperService'

interface PropertyStats {
  count: number
  values: Record<string, number>
}

export interface Baseline {
  sites_count: number
  properties: Record<string, PropertyStats>
}

const BASELINE_PATH = path.join(process.cwd(), 'src/data/discovery/baseline.json')

export function loadBaseline(): Baseline {
  try {
    return JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf-8')) as Baseline
  } catch {
    return { sites_count: 0, properties: {} }
  }
}

export function saveBaseline(baseline: Baseline): void {
  fs.writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2))
}

export function updateBaseline(
  cssData: Record<string, unknown>,
  baseline: Baseline
): Baseline {
  const updated: Baseline = {
    sites_count: baseline.sites_count + 1,
    properties: { ...baseline.properties },
  }

  for (const [key, value] of Object.entries(cssData)) {
    if (value === null || value === undefined) continue
    const strVal = String(value)
    if (!updated.properties[key]) {
      updated.properties[key] = { count: 0, values: {} }
    }
    updated.properties[key].count++
    updated.properties[key].values[strVal] = (updated.properties[key].values[strVal] ?? 0) + 1
  }

  return updated
}

function rarityScore(key: string, value: unknown, baseline: Baseline): number {
  if (baseline.sites_count < 3) return 0
  const prop = baseline.properties[key]
  if (!prop) return 1 // never seen before → maximally rare

  const strVal = String(value)
  const seenCount = prop.values[strVal] ?? 0
  return 1 - seenCount / baseline.sites_count
}

// Boolean flags that indicate interesting patterns when true
const INTERESTING_BOOLEANS: Array<{
  key: string
  observation: string
  category: SurpriseObservation['category']
  reusability: SurpriseObservation['reusability']
}> = [
  {
    key: 'has_backdrop_blur',
    observation: 'Site uses backdrop-filter: blur() for glassmorphism elements — a modern depth technique',
    category: 'decoration',
    reusability: 'universal',
  },
  {
    key: 'has_clip_path',
    observation: 'Site uses clip-path to create non-rectangular section shapes — unusual geometric transitions',
    category: 'layout',
    reusability: 'paradigm-specific',
  },
  {
    key: 'has_gradient_text',
    observation: 'Site uses gradient text via background-clip: text — highlights key words with color gradients',
    category: 'typography',
    reusability: 'universal',
  },
  {
    key: 'has_noise_texture',
    observation: 'Site overlays noise/grain texture on backgrounds — adds tactile depth',
    category: 'decoration',
    reusability: 'paradigm-specific',
  },
  {
    key: 'has_bento_grid',
    observation: 'Site uses a bento-style asymmetric grid with 3+ columns — Apple-inspired card layout',
    category: 'layout',
    reusability: 'universal',
  },
  {
    key: 'has_negative_margin',
    observation: 'Site uses negative margins between sections — creates visual overlap and layering',
    category: 'layout',
    reusability: 'paradigm-specific',
  },
  {
    key: 'has_svg_background',
    observation: 'Site uses inline SVG as background pattern — custom vector decoration',
    category: 'decoration',
    reusability: 'universal',
  },
  {
    key: 'has_scroll_animation',
    observation: 'Site uses scroll-driven CSS animations — content reveals on scroll without JS',
    category: 'animation',
    reusability: 'universal',
  },
  {
    key: 'has_counter_anim',
    observation: 'Site uses animated number counters for stats — adds energy to metrics sections',
    category: 'animation',
    reusability: 'universal',
  },
]

export function detectAnomalies(
  cssData: Record<string, unknown>,
  baseline: Baseline
): SurpriseObservation[] {
  const surprises: SurpriseObservation[] = []
  const RARITY_THRESHOLD = 0.75

  // 1. Check interesting boolean flags
  for (const flag of INTERESTING_BOOLEANS) {
    if (cssData[flag.key] !== true) continue
    const rarity = rarityScore(flag.key, true, baseline)
    if (rarity >= RARITY_THRESHOLD || baseline.sites_count < 5) {
      surprises.push({
        observation: flag.observation,
        category: flag.category,
        confidence: Math.min(0.95, 0.65 + rarity * 0.3),
        css_hint: flag.key,
        reusability: flag.reusability,
      })
    }
  }

  // 2. Check numerical outliers (section_count, grid_count, svg_count)
  const numericalChecks: Array<{
    key: string
    threshold: number
    observation: string
    category: SurpriseObservation['category']
  }> = [
    {
      key: 'section_count',
      threshold: 10,
      observation: `Site has ${cssData.section_count} sections — unusually deep scrolling experience`,
      category: 'layout',
    },
    {
      key: 'grid_count',
      threshold: 8,
      observation: `Site uses ${cssData.grid_count} CSS grid containers — heavy grid-based layout system`,
      category: 'layout',
    },
    {
      key: 'svg_count',
      threshold: 15,
      observation: `Site uses ${cssData.svg_count} SVG elements — icon-rich or illustration-heavy design`,
      category: 'decoration',
    },
  ]

  for (const check of numericalChecks) {
    const val = cssData[check.key]
    if (typeof val !== 'number' || val < check.threshold) continue
    const rarity = rarityScore(check.key, String(val), baseline)
    if (rarity >= RARITY_THRESHOLD) {
      surprises.push({
        observation: check.observation,
        category: check.category,
        confidence: Math.min(0.9, 0.65 + rarity * 0.25),
        css_hint: `${check.key}: ${val}`,
        reusability: 'universal',
      })
    }
  }

  return surprises
}
