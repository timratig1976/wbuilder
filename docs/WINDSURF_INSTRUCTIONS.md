# wbuilder v2 — Windsurf Implementierungsanweisung
**viminds GmbH · Rostock · Stand März 2026**  
**Repo:** `github.com/timratig1976/wbuilder`  
**Stack:** Next.js 14 · Zustand · OpenAI SDK · Tailwind CDN · Puppeteer  

---

## VOR DEM START — LIES DIES ZUERST

Du implementierst wbuilder v2. Das ist ein KI-gestütztes Webdesign-Tool für die Agentur viminds.

**Drei absolute Regeln:**

1. **Bestehender Code läuft weiter.** `src/lib/ai.ts`, `src/app/api/generate/route.ts`, `src/app/builder/page.tsx` — alles bleibt voll funktionsfähig. v2 wird addiert, nicht ersetzt.

2. **Kein Schritt ohne Test.** Jedes Modul hat Akzeptanzkriterien. Führe sie aus, bevor du zum nächsten Modul gehst.

3. **Reihenfolge einhalten.** Module haben Abhängigkeiten. Modul 2 baut auf Modul 1 auf usw. Nicht überspringen.

**Umgebungsvariablen die vorhanden sein müssen:**
```
OPENAI_API_KEY=sk-...
```

**Neue npm-Dependencies:** Keine. `openai` und `puppeteer` sind bereits in `package.json`.

---

## MODUL 1 — Typen und Data Files
*Keine Abhängigkeiten. Kein API-Call. Nur Dateien anlegen.*

### Schritt 1.1 — Kern-Typen

**Erstelle:** `src/lib/types/manifest.ts`

```typescript
export type StyleParadigm =
  | 'minimal-clean' | 'tech-dark' | 'bold-expressive'
  | 'luxury-editorial' | 'bento-grid' | 'brutalist'

export type AnimationBudget = 'none' | 'subtle' | 'moderate' | 'rich'

export type SectionTransition =
  | 'flat' | 'concave-bottom' | 'convex-bottom'
  | 'wave-bottom' | 'diagonal-bottom'

export interface DesignTokens {
  colors: {
    primary: string; secondary: string; accent: string
    highlight: string; background: string; surface: string
    dark: string; text: string; text_muted: string
    _source: string
  }
  typography: {
    font_heading: string; font_body: string
    heading_weight: string; tracking_heading: string
    line_height_heading: string; _source: string
  }
  type_scale: {
    hero_h1: string; section_h2: string; card_h3: string
    body: string; eyebrow: string; cta_button: string
  }
  spacing: {
    section_padding_light: string; section_padding_heavy: string
    container_max: string; container_padding: string
  }
}

export interface SiteManifest {
  id: string; version: string
  site: {
    name: string; language: string; industry: string
    tone: string; adjectives: string[]; primary_cta_goal: string
  }
  design_tokens: DesignTokens
  style_paradigm: StyleParadigm
  style_dictionary_ref: string
  style_source: { type: string; url?: string; confidence?: number }
  navbar: {
    style: 'sticky-blur'|'static'|'transparent-hero'|'hidden-scroll'
    scroll_threshold_px: number; height: string
    layout_desktop: string; mobile_menu: string
    cta_button: boolean; cta_label: string; links: string[]
  }
  section_stacking_rules: Record<string, object>
  pass1_prompt_rules: { rules: string[] }
  pass3_auto_flags: string[]
  pages: Array<{
    id: string; slug: string; title: string
    sections: string[]; meta_description: string
  }>
  content: {
    company_name: string; company_usp: string
    primary_cta: string; secondary_cta: string
    personas: string[]; pain_points: string[]; trust_signals: string[]
  }
  generated_at: string
  _decision_log: Record<string, string>
}

export interface ValidationError {
  type: string; message: string
  severity: 'error'|'warning'; auto_fixable: boolean
}

export interface ValidationResult {
  valid: boolean; score: number; errors: ValidationError[]
}
```

**Erstelle:** `src/lib/types/pattern.ts`

```typescript
import { StyleParadigm } from './manifest'

export type PatternType =
  | 'section-transition' | 'hero-layout' | 'section-sequence'
  | 'grid-pattern' | 'whitespace-rhythm' | 'scroll-behavior'
  | 'background-treatment' | 'card-style' | 'image-treatment'
  | 'type-hierarchy' | 'display-font-usage'
  | 'hover-micro-interaction' | 'text-animation' | 'scroll-animation'

export interface DesignPattern {
  id: string; type: PatternType
  source_url: string; scraped_at: string; confidence: number
  name: string; description: string
  tags: string[]; industries: string[]; paradigms: StyleParadigm[]
  implementation: {
    css_snippet?: string; html_snippet?: string
    placeholder?: string
    style_dict_key: string; style_dict_val: unknown
  }
  preview_description: string
  visual_weight: 'light' | 'medium' | 'heavy'
  brand_dependency: 'none' | 'color-dependent' | 'font-dependent'
  discovery_meta?: {
    seen_count: number; seen_on: string[]
    css_hint: string | null; auto_discovered: boolean
  }
}
```

**Erstelle:** `src/lib/types/styleDictionary.ts`

```typescript
import { StyleParadigm, SectionTransition } from './manifest'

export interface StyleDictionary {
  id: string; paradigm: StyleParadigm
  rules: {
    layout: {
      section_padding: string; max_width: string
      columns_max: number; overlaps_allowed: boolean
      negative_margin_allowed: boolean; full_bleed_allowed: boolean
      asymmetric_allowed?: boolean; section_transition: SectionTransition
    }
    typography: {
      heading_font: string; heading_weight: string
      heading_size_hero: string; heading_size_section: string
      tracking: string; gradient_text_allowed: boolean
    }
    color: {
      base: string; dark_sections_allowed: boolean
      gradient_allowed: boolean; accent_count_max: number
    }
    animation: {
      budget: 'none' | 'subtle' | 'moderate' | 'rich'
      keyframes_allowed: boolean; scroll_driven_allowed: boolean
      text_animations_allowed?: string[]
      hover_effects_allowed?: string[]
    }
    decoration: {
      mesh_gradient: boolean; glassmorphism: boolean
      border_glow: boolean; geometric_shapes: boolean
      noise_texture: boolean; color_overlays: boolean
      diagonal_cuts?: boolean; concave_sections?: boolean
    }
  }
  forbidden_patterns: string[]
  required_patterns: string[]
  html_patterns: Record<string, string>
}
```

### Schritt 1.2 — Style Dictionary JSON-Files

**Erstelle:** `src/data/style-dictionaries/bold-expressive-v1.json`

```json
{
  "id": "bold-expressive-v1",
  "paradigm": "bold-expressive",
  "rules": {
    "layout": {
      "section_padding": "py-16 md:py-24",
      "max_width": "max-w-7xl mx-auto",
      "columns_max": 4,
      "overlaps_allowed": true,
      "negative_margin_allowed": true,
      "full_bleed_allowed": true,
      "section_transition": "concave-bottom"
    },
    "typography": {
      "heading_font": "font-display",
      "heading_weight": "font-bold",
      "heading_size_hero": "text-4xl md:text-5xl lg:text-[5rem]",
      "heading_size_section": "text-3xl md:text-[3rem]",
      "tracking": "tracking-[-0.025em]",
      "gradient_text_allowed": true
    },
    "color": {
      "base": "mixed",
      "dark_sections_allowed": true,
      "gradient_allowed": true,
      "accent_count_max": 3
    },
    "animation": {
      "budget": "rich",
      "keyframes_allowed": true,
      "scroll_driven_allowed": true,
      "text_animations_allowed": ["word-cycle", "fade-up", "scramble", "typewriter"],
      "hover_effects_allowed": ["scale", "glow", "reveal", "magnetic", "tilt"]
    },
    "decoration": {
      "mesh_gradient": true,
      "glassmorphism": true,
      "border_glow": true,
      "geometric_shapes": true,
      "noise_texture": true,
      "color_overlays": true,
      "diagonal_cuts": true,
      "concave_sections": true
    }
  },
  "forbidden_patterns": [
    "font-serif (kein reguläres serif — nur Display-Serif)",
    "py-40 oder mehr",
    "single-column hero",
    "min-h-screen ohne md: prefix"
  ],
  "required_patterns": [
    "mindestens ein dark-bg Abschnitt",
    "gradient oder glow auf Hero-CTA",
    "animation im sichtbaren Bereich above-fold",
    "alle grids: grid-cols-1 md:grid-cols-X"
  ],
  "html_patterns": {
    "section_wrapper": "<section class=\"relative overflow-hidden isolate py-16 md:py-24\">",
    "container": "<div class=\"max-w-7xl mx-auto px-5 md:px-8\">",
    "eyebrow": "<div class=\"text-[.68rem] font-semibold tracking-[.14em] uppercase text-accent flex items-center gap-2.5 mb-5\"><span class=\"inline-block w-5 h-px bg-accent\"></span>LABEL</div>",
    "hero_h1": "<h1 class=\"font-display font-bold text-4xl md:text-5xl lg:text-[5rem] leading-[1.05] tracking-[-0.025em]\">",
    "cta_primary": "<a href=\"#\" class=\"inline-flex items-center gap-2 px-7 py-4 bg-accent text-white text-sm font-semibold tracking-wide rounded-sm hover:bg-accent/90 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-accent/30 transition-all duration-200\">",
    "dark_section": "<section class=\"relative overflow-hidden isolate bg-primary py-16 md:py-24\">",
    "stat_number": "<div class=\"font-display font-bold text-4xl md:text-5xl text-accent leading-none\" data-target=\"NUMBER\">"
  }
}
```

**Erstelle:** `src/data/style-dictionaries/minimal-clean-v1.json`

```json
{
  "id": "minimal-clean-v1",
  "paradigm": "minimal-clean",
  "rules": {
    "layout": {
      "section_padding": "py-24 md:py-32",
      "max_width": "max-w-4xl mx-auto",
      "columns_max": 2,
      "overlaps_allowed": false,
      "negative_margin_allowed": false,
      "full_bleed_allowed": false,
      "section_transition": "flat"
    },
    "typography": {
      "heading_font": "font-display",
      "heading_weight": "font-light",
      "heading_size_hero": "text-5xl md:text-7xl",
      "heading_size_section": "text-4xl md:text-5xl",
      "tracking": "tracking-tight",
      "gradient_text_allowed": false
    },
    "color": {
      "base": "light",
      "dark_sections_allowed": false,
      "gradient_allowed": false,
      "accent_count_max": 1
    },
    "animation": {
      "budget": "none",
      "keyframes_allowed": false,
      "scroll_driven_allowed": false,
      "hover_effects_allowed": ["opacity", "translate-y-0.5"]
    },
    "decoration": {
      "mesh_gradient": false,
      "glassmorphism": false,
      "border_glow": false,
      "geometric_shapes": false,
      "noise_texture": false,
      "color_overlays": false,
      "diagonal_cuts": false,
      "concave_sections": false
    }
  },
  "forbidden_patterns": [
    "bg-gradient-to-*",
    "backdrop-blur-*",
    "@keyframes",
    "animate-*",
    "min-h-screen ohne md:",
    "negative margins"
  ],
  "required_patterns": [
    "generous whitespace",
    "single accent color only",
    "max 2 font-size variations per section",
    "alle grids: grid-cols-1 md:grid-cols-X"
  ],
  "html_patterns": {
    "section_wrapper": "<section class=\"relative overflow-hidden isolate py-24 md:py-32 bg-white\">",
    "container": "<div class=\"max-w-4xl mx-auto px-6\">",
    "hero_h1": "<h1 class=\"font-display font-light text-5xl md:text-7xl tracking-tight leading-none\">",
    "cta_primary": "<a href=\"#\" class=\"inline-block px-8 py-4 bg-primary text-white text-sm font-medium rounded-sm hover:opacity-90 transition-opacity\">"
  }
}
```

**Erstelle:** `src/data/style-dictionaries/tech-dark-v1.json`

```json
{
  "id": "tech-dark-v1",
  "paradigm": "tech-dark",
  "rules": {
    "layout": {
      "section_padding": "py-20 md:py-28",
      "max_width": "max-w-6xl mx-auto",
      "columns_max": 4,
      "overlaps_allowed": true,
      "negative_margin_allowed": false,
      "full_bleed_allowed": true,
      "section_transition": "flat"
    },
    "typography": {
      "heading_font": "font-sans",
      "heading_weight": "font-bold md:font-extrabold",
      "heading_size_hero": "text-5xl md:text-7xl",
      "heading_size_section": "text-4xl md:text-5xl",
      "tracking": "tracking-tighter",
      "gradient_text_allowed": true
    },
    "color": {
      "base": "dark",
      "dark_sections_allowed": true,
      "gradient_allowed": true,
      "accent_count_max": 2
    },
    "animation": {
      "budget": "moderate",
      "keyframes_allowed": true,
      "scroll_driven_allowed": true,
      "text_animations_allowed": ["word-cycle", "fade-up", "scramble"],
      "hover_effects_allowed": ["scale", "glow", "reveal"]
    },
    "decoration": {
      "mesh_gradient": true,
      "glassmorphism": true,
      "border_glow": true,
      "geometric_shapes": true,
      "noise_texture": true,
      "color_overlays": true
    }
  },
  "forbidden_patterns": [
    "bg-white",
    "font-serif",
    "py-40 oder mehr",
    "single column hero"
  ],
  "required_patterns": [
    "dark background auf 60%+ der Sections",
    "gradient oder glow accent im Hero",
    "min 1 animated element above fold",
    "alle grids: grid-cols-1 md:grid-cols-X"
  ],
  "html_patterns": {
    "section_wrapper": "<section class=\"relative overflow-hidden isolate bg-zinc-900 py-20 md:py-28\">",
    "container": "<div class=\"max-w-6xl mx-auto px-5 md:px-8\">",
    "hero_h1": "<h1 class=\"font-sans font-extrabold text-5xl md:text-7xl tracking-tighter leading-[1.05] text-white\">",
    "gradient_text": "<span class=\"bg-gradient-to-r from-cyan-400 to-sky-400 bg-clip-text text-transparent\">",
    "glass_card": "<div class=\"backdrop-blur-md bg-white/10 border border-white/10 rounded-2xl shadow-xl p-6\">"
  }
}
```

**Erstelle:** `src/data/style-dictionaries/luxury-editorial-v1.json`

```json
{
  "id": "luxury-editorial-v1",
  "paradigm": "luxury-editorial",
  "rules": {
    "layout": {
      "section_padding": "py-28 md:py-40",
      "max_width": "max-w-5xl mx-auto",
      "columns_max": 2,
      "overlaps_allowed": false,
      "negative_margin_allowed": false,
      "full_bleed_allowed": false,
      "section_transition": "flat"
    },
    "typography": {
      "heading_font": "font-display",
      "heading_weight": "font-light",
      "heading_size_hero": "text-6xl md:text-8xl",
      "heading_size_section": "text-5xl md:text-6xl",
      "tracking": "tracking-tight",
      "gradient_text_allowed": false
    },
    "color": {
      "base": "light",
      "dark_sections_allowed": false,
      "gradient_allowed": false,
      "accent_count_max": 1
    },
    "animation": {
      "budget": "subtle",
      "keyframes_allowed": false,
      "scroll_driven_allowed": false,
      "hover_effects_allowed": ["opacity"]
    },
    "decoration": {
      "mesh_gradient": false,
      "glassmorphism": false,
      "border_glow": false,
      "geometric_shapes": false,
      "noise_texture": false,
      "color_overlays": false
    }
  },
  "forbidden_patterns": [
    "bg-gradient-*",
    "animate-*",
    "font-bold above font-medium",
    "rounded-full on cards",
    "multiple accent colors"
  ],
  "required_patterns": [
    "extreme whitespace",
    "serif typography dominant",
    "single thin accent line as decoration",
    "alle grids: grid-cols-1 md:grid-cols-X"
  ],
  "html_patterns": {
    "section_wrapper": "<section class=\"relative overflow-hidden isolate py-28 md:py-40 bg-white\">",
    "hero_h1": "<h1 class=\"font-display font-light text-6xl md:text-8xl tracking-tight leading-none\">",
    "accent_line": "<div class=\"w-8 h-px bg-accent mb-8\"></div>"
  }
}
```

**Erstelle:** `src/data/pattern-library/patterns.json`
```json
[]
```

**Erstelle:** `src/data/section-library/index.json`
```json
[]
```

**Erstelle:** `src/data/discovery/queue.json`
```json
[]
```

**Erstelle:** `src/data/discovery/trends.json`
```json
{}
```

**Erstelle:** `src/data/discovery/baseline.json`
```json
{ "sites_count": 0, "properties": {} }
```

### Akzeptanzkriterium Modul 1:
```bash
npx tsc --noEmit
# Muss fehlerfrei durchlaufen.
# Alle JSON-Dateien sind valides JSON (node -e "require('./src/data/...')")
```

---

## MODUL 2 — OpenAI Provider
*Abhängigkeit: Modul 1*

### Schritt 2.1 — Provider Interface

**Erstelle:** `src/lib/ai/types.ts`

```typescript
export interface CompletionParams {
  model: string
  system?: string
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  max_tokens: number
  temperature?: number
  response_format?: { type: 'json_object' | 'text' }
}

export interface AIProvider {
  complete(params: CompletionParams): Promise<string>
  stream(params: CompletionParams, onChunk: (chunk: string) => void): Promise<string>
}
```

### Schritt 2.2 — OpenAI Provider

**Erstelle:** `src/lib/ai/openaiProvider.ts`

```typescript
import OpenAI from 'openai'
import { AIProvider, CompletionParams } from './types'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export class OpenAIProvider implements AIProvider {
  async complete(params: CompletionParams): Promise<string> {
    // o4-mini und o3-Modelle benutzen max_completion_tokens und kein temperature
    const isO = params.model.startsWith('o4') || params.model.startsWith('o3')
    const res = await client.chat.completions.create({
      model: params.model,
      messages: [
        ...(params.system ? [{ role: 'system' as const, content: params.system }] : []),
        ...params.messages,
      ],
      ...(isO
        ? { max_completion_tokens: params.max_tokens }
        : { max_tokens: params.max_tokens, temperature: params.temperature }),
      ...(params.response_format ? { response_format: params.response_format } : {}),
    })
    return res.choices[0]?.message?.content ?? ''
  }

  async stream(params: CompletionParams, onChunk: (c: string) => void): Promise<string> {
    let full = ''
    const stream = await client.chat.completions.create({
      model: params.model,
      messages: [
        ...(params.system ? [{ role: 'system' as const, content: params.system }] : []),
        ...params.messages,
      ],
      max_tokens: params.max_tokens,
      temperature: params.temperature,
      stream: true,
    })
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? ''
      if (delta) { full += delta; onChunk(delta) }
    }
    return full
  }
}
```

### Schritt 2.3 — MODEL_CONFIG

**Erstelle:** `src/lib/ai/models.ts`

```typescript
import { OpenAIProvider } from './openaiProvider'

export const MODEL_CONFIG = {
  // Manifest: deterministisch, strukturiert
  manifest_generation: {
    model: 'gpt-4.1',
    max_tokens: 4000,
    temperature: 0.2,
    response_format: { type: 'json_object' as const },
  },
  // Pass 1: Struktur + Inhalt
  pass1_structure: {
    model: 'gpt-4.1',
    max_tokens: 8192,
    temperature: 0.4,
  },
  // Pass 2: Visual Layer — mehr Kreativität
  pass2_visual: {
    model: 'gpt-4.1',
    max_tokens: 6000,
    temperature: 0.65,
  },
  // Pass 3: Validator — kein temperature, json_object zwingend
  pass3_validator: {
    model: 'o4-mini',
    max_tokens: 2000,
    response_format: { type: 'json_object' as const },
  },
  // Vision: Screenshot-Analyse
  screenshot_analysis: {
    model: 'gpt-4o',
    max_tokens: 2000,
    temperature: 0.1,
    response_format: { type: 'json_object' as const },
  },
} as const

// Singleton — ein Provider für alles (OpenAI-only)
export const provider = new OpenAIProvider()
```

### Akzeptanzkriterium Modul 2:
```bash
npx tsc --noEmit
# Muss fehlerfrei. Provider ist importierbar.
```

---

## MODUL 3 — Vollständige LLM-Prompts & Generation Pipeline
*Abhängigkeit: Modul 1, 2*

### Schritt 3.1 — Style Dictionary Loader

**Erstelle:** `src/lib/style/styleDictionary.ts`

```typescript
import { StyleParadigm } from '../types/manifest'
import { StyleDictionary } from '../types/styleDictionary'

const cache = new Map<string, StyleDictionary>()

export function loadStyleDictionary(paradigm: StyleParadigm): StyleDictionary {
  if (cache.has(paradigm)) return cache.get(paradigm)!
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const dict = require(`../../data/style-dictionaries/${paradigm}-v1.json`) as StyleDictionary
  cache.set(paradigm, dict)
  return dict
}
```

### Schritt 3.2 — Section Library

**Erstelle:** `src/lib/sections/sectionLibrary.ts`

```typescript
import { readFileSync, existsSync } from 'fs'
import path from 'path'
import { SiteManifest, StyleParadigm } from '../types/manifest'

interface SectionMeta {
  id: string; type: string; paradigm: StyleParadigm
  quality_score: number; tags: string[]; industries: string[]
}

export function findBestReference(
  section_type: string,
  manifest: SiteManifest
): string | null {
  try {
    const indexPath = path.join(process.cwd(), 'src/data/section-library/index.json')
    if (!existsSync(indexPath)) return null
    const index: SectionMeta[] = JSON.parse(readFileSync(indexPath, 'utf-8'))
    const candidates = index
      .filter(s => s.type === section_type && s.paradigm === manifest.style_paradigm && s.quality_score >= 4)
      .sort((a, b) => b.quality_score - a.quality_score)
    if (!candidates.length) return null
    const htmlPath = path.join(process.cwd(), `src/data/section-library/sections/${candidates[0].id}.html`)
    if (!existsSync(htmlPath)) return null
    return readFileSync(htmlPath, 'utf-8').slice(0, 600)
  } catch {
    return null
  }
}
```

### Schritt 3.3 — Auto-Fix Engine

**Erstelle:** `src/lib/generation/autoFix.ts`

```typescript
import { ValidationError } from '../types/manifest'

export function safeParseJson<T>(raw: string): T | null {
  const cleaned = raw
    .replace(/^```json\s*/i, '').replace(/\s*```$/i, '')
    .replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim()
  try { return JSON.parse(cleaned) } catch { return null }
}

export function autoFix(html: string, errors: ValidationError[]): string {
  let fixed = html
  for (const err of errors.filter(e => e.auto_fixable)) {
    switch (err.type) {
      case 'missing-alt':
        fixed = fixed.replace(/<img(?![^>]*\balt=)([^>]*)>/g, '<img alt=""$1>')
        break
      case 'missing-loading-lazy':
        fixed = fixed.replace(/<img(?![^>]*\bloading=)([^>]*)>/g, '<img loading="lazy"$1>')
        break
      case 'missing-aria-label':
        fixed = fixed.replace(
          /<button([^>]*)>(\s*<svg[^>]*>[\s\S]*?<\/svg>\s*)<\/button>/g,
          (match, attrs, content) =>
            attrs.includes('aria-label') ? match
              : `<button${attrs} aria-label="Action">${content}</button>`
        )
        break
      case 'missing-reduced-motion':
        fixed = fixed.replace(
          /(@keyframes\s+\w+\s*\{[\s\S]*?\})/g,
          '@media (prefers-reduced-motion: no-preference) { $1 }'
        )
        break
      case 'missing-overflow-hidden':
        fixed = fixed.replace(
          /<section\b([^>]*)class="([^"]*)"([^>]*)>/,
          (match, pre, cls, post) =>
            cls.includes('overflow-hidden') ? match
              : `<section${pre}class="${cls} overflow-hidden isolate"${post}>`
        )
        break
    }
  }
  return fixed
}
```

### Schritt 3.4 — Alle LLM-Prompts

**Erstelle:** `src/lib/generation/prompts.ts`

**ACHTUNG: Diese Datei ist das Herzstück des Systems. Jede Zeile ist wichtig. Nicht kürzen.**

```typescript
import { SiteManifest } from '../types/manifest'
import { StyleDictionary } from '../types/styleDictionary'

// ═══════════════════════════════════════════════════════
// MANIFEST GENERATION
// ═══════════════════════════════════════════════════════

export const MANIFEST_SYSTEM = `You are a design system architect. Generate a complete Site Manifest as JSON.
RULES:
- Respond with ONLY valid JSON. No text, no markdown, no explanation.
- All colors as exact hex values (#RRGGBB).
- All Tailwind classes as exact strings ("text-4xl md:text-5xl").
- All font names in CSS format ("'Inter', sans-serif").`

export function buildManifestPrompt(input: {
  company_name: string; industry: string; adjectives: string[]
  tone: string; primary_cta: string; personas: string[]
  pain_points: string[]; style_paradigm: string
  animation_budget: string; navbar_style: string
  navbar_mobile: string; brand_colors?: Record<string, string>
}): string {
  return `Generate a SiteManifest JSON for this project:

Company: ${input.company_name}
Industry: ${input.industry}
Adjectives: ${input.adjectives.join(', ')}
Tone: ${input.tone}
Primary CTA: ${input.primary_cta}
Personas: ${input.personas.join('; ')}
Pain Points: ${input.pain_points.join('; ')}
Style Paradigm: ${input.style_paradigm}
Animation Budget: ${input.animation_budget}
Navbar Style: ${input.navbar_style}
Navbar Mobile: ${input.navbar_mobile}
${input.brand_colors ? `Brand Colors (MUST USE EXACTLY): ${JSON.stringify(input.brand_colors)}` : ''}

Generate the manifest following this exact schema:
{
  "id": "uuid-here",
  "version": "2.0",
  "site": {
    "name": "${input.company_name}",
    "language": "de",
    "industry": "${input.industry}",
    "tone": "${input.tone}",
    "adjectives": ${JSON.stringify(input.adjectives)},
    "primary_cta_goal": "describe-goal"
  },
  "design_tokens": {
    "colors": {
      "primary": "#hex",
      "secondary": "#hex",
      "accent": "#hex",
      "highlight": "#hex",
      "background": "#hex",
      "surface": "#hex",
      "dark": "#hex",
      "text": "#hex",
      "text_muted": "#hex",
      "_source": "${input.brand_colors ? 'user-brand' : 'ai-generated'}"
    },
    "typography": {
      "font_heading": "Google Font name in CSS format",
      "font_body": "'Inter', sans-serif",
      "heading_weight": "700",
      "tracking_heading": "-0.025em",
      "line_height_heading": "1.05",
      "_source": "ai-generated"
    },
    "type_scale": {
      "hero_h1": "text-4xl md:text-5xl lg:text-[5rem]",
      "section_h2": "text-3xl md:text-[3rem]",
      "card_h3": "text-sm md:text-base",
      "body": "text-sm md:text-base",
      "eyebrow": "text-[.68rem] font-semibold tracking-[.14em] uppercase",
      "cta_button": "text-xs md:text-sm font-semibold tracking-wide"
    },
    "spacing": {
      "section_padding_light": "py-16 md:py-24",
      "section_padding_heavy": "py-14 md:py-24",
      "container_max": "max-w-7xl mx-auto",
      "container_padding": "px-5 md:px-8"
    }
  },
  "style_paradigm": "${input.style_paradigm}",
  "style_dictionary_ref": "${input.style_paradigm}-v1",
  "navbar": {
    "style": "${input.navbar_style}",
    "scroll_threshold_px": 40,
    "height": "h-16",
    "layout_desktop": "logo-left nav-center cta-right",
    "mobile_menu": "${input.navbar_mobile}",
    "cta_button": true,
    "cta_label": "${input.primary_cta}",
    "links": ["Leistungen", "Ablauf", "Kontakt"]
  },
  "pages": [
    {
      "id": "home",
      "slug": "index",
      "title": "Startseite",
      "sections": ["hero", "pain-points", "services", "process", "cta"],
      "meta_description": "Write a compelling meta description"
    }
  ],
  "content": {
    "company_name": "${input.company_name}",
    "company_usp": "Write compelling USP based on adjectives and tone",
    "primary_cta": "${input.primary_cta}",
    "secondary_cta": "Mehr erfahren",
    "personas": ${JSON.stringify(input.personas)},
    "pain_points": ${JSON.stringify(input.pain_points)},
    "trust_signals": ["Generate 4 compelling trust signals"]
  },
  "pass1_prompt_rules": {
    "rules": [
      "NO inline style for layout — Tailwind classes only",
      "inline style ONLY for CSS Custom Properties: style='color: var(--color-accent)'",
      "Every grid: grid-cols-1 base, then md:/lg: breakpoints",
      "Split sections: primary content DOM-first (H1+CTA mobile top)",
      "order-X ONLY for secondary content — NEVER on H1, H2, forms",
      "min-h-screen ALWAYS as md:min-h-screen",
      "All interactive elements: min h-11 mobile (py-3 minimum)",
      "Use CSS Custom Properties: var(--color-primary), var(--color-accent)",
      "Animation placeholders: <!-- [ANIM: word-cycle | words: [...]] -->",
      "Background placeholders: <!-- [BG: geometric-shapes | opacity: 0.1] -->",
      "NO @keyframes in Pass 1 — that is Pass 2 responsibility",
      "Output ONLY HTML, no markdown, no comments outside HTML"
    ]
  },
  "pass3_auto_flags": [
    "style='' contains grid/flex/column/height → layout in inline style",
    "grid-cols-X without preceding grid-cols-1 → no mobile-first grid",
    "min-h-screen without md: prefix → full height on mobile too",
    "order-1 on element containing h1/h2/form → primary content reordered",
    "button or a without py-3+ → touch target too small",
    "@keyframes outside prefers-reduced-motion guard → unprotected animation",
    "img without alt attribute → missing alt text",
    "icon-only button without aria-label → missing ARIA"
  ],
  "generated_at": "${new Date().toISOString()}",
  "_decision_log": {
    "paradigm": "${input.style_paradigm} — user selected",
    "colors": "${input.brand_colors ? 'user brand colors — not overwritten' : 'ai-generated from industry+tone'}",
    "navbar": "${input.navbar_style} — user selected in briefing wizard"
  }
}`
}

// ═══════════════════════════════════════════════════════
// PASS 1 — STRUCTURE
// ═══════════════════════════════════════════════════════

export function buildPass1System(dict: StyleDictionary, manifest: SiteManifest): string {
  const tokens = manifest.design_tokens
  return `You are a precision HTML developer building section scaffolding. Structure and content only — NO animations, NO @keyframes, NO fancy backgrounds.

OUTPUT FORMAT: Respond with ONLY raw HTML starting with < and ending with >. No markdown, no code fences, no explanation.

STYLE DICTIONARY — MANDATORY CONSTRAINTS:
Paradigm: ${dict.paradigm}
Forbidden patterns (NEVER use): ${JSON.stringify(dict.forbidden_patterns)}
Required patterns (ALWAYS include): ${JSON.stringify(dict.required_patterns)}

CSS CUSTOM PROPERTIES (use these, never hardcode hex values):
:root {
  --color-primary:   ${tokens.colors.primary};
  --color-secondary: ${tokens.colors.secondary};
  --color-accent:    ${tokens.colors.accent};
  --color-highlight: ${tokens.colors.highlight};
  --color-background:${tokens.colors.background};
  --color-surface:   ${tokens.colors.surface};
  --color-dark:      ${tokens.colors.dark};
  --color-text:      ${tokens.colors.text};
  --color-muted:     ${tokens.colors.text_muted};
  --font-heading:    ${tokens.typography.font_heading};
  --font-body:       ${tokens.typography.font_body};
}

LAYOUT RULES (non-negotiable):
${manifest.pass1_prompt_rules.rules.map(r => '- ' + r).join('\n')}

SECTION HTML PATTERNS from Style Dictionary:
${Object.entries(dict.html_patterns).map(([k, v]) => `${k}: ${v}`).join('\n')}

PLACEHOLDER SYNTAX for Pass 2:
- Animation: <!-- [ANIM: word-cycle | words: ["Option1","Option2","Option3"]] -->
- Background: <!-- [BG: geometric-shapes | color: primary | opacity: 0.06] -->
- Blob:       <!-- [BG: blob-morph | fill: accent | opacity: 0.15] -->
- Wave:       <!-- [TRANSITION: wave-bottom | next: white] -->
- Concave:    <!-- [TRANSITION: concave-bottom | next: white | depth: 60px] -->`
}

export function buildPass1User(input: {
  section_type: string
  manifest: SiteManifest
  content_brief: string
  rag_reference: string | null
}): string {
  const { manifest } = input
  return `Generate a "${input.section_type}" section for:

Company: ${manifest.content.company_name}
USP: ${manifest.content.company_usp}
Tone: ${manifest.site.tone}
Adjectives: ${manifest.site.adjectives.join(', ')}
Primary CTA: ${manifest.content.primary_cta}
Pain Points: ${manifest.content.pain_points.join('; ')}
Trust Signals: ${manifest.content.trust_signals.join(' · ')}
${input.content_brief ? `Specific instructions: ${input.content_brief}` : ''}

Section type rules:
- Root element MUST have: overflow-hidden isolate classes
- Root element MUST have: position relative
- Section padding: ${manifest.design_tokens.spacing.section_padding_heavy}
- Container: ${manifest.design_tokens.spacing.container_max} ${manifest.design_tokens.spacing.container_padding}
${input.rag_reference ? `\nQUALITY REFERENCE (match or exceed this quality — do not copy verbatim):\n${input.rag_reference}` : ''}`
}

// ═══════════════════════════════════════════════════════
// PASS 2 — VISUAL LAYER
// ═══════════════════════════════════════════════════════

export function buildPass2System(dict: StyleDictionary): string {
  return `You are a visual developer enhancing HTML sections with animations and decorative layers.
You receive complete HTML and must resolve placeholder comments into real implementations.

OUTPUT FORMAT: Complete HTML only. No markdown, no explanation.

YOUR TASKS:
1. Replace <!-- [ANIM: word-cycle | words: [...]] --> with working JS word-cycle implementation
2. Replace <!-- [BG: geometric-shapes | ...] --> with SVG background in absolute positioned div
3. Replace <!-- [TRANSITION: wave-bottom | next: COLOR] --> with SVG wave at section bottom
4. Replace <!-- [TRANSITION: concave-bottom | next: COLOR | depth: Xpx] --> with CSS concave
5. Add @keyframes in a <style> block at the top of the section
6. ALL @keyframes MUST be inside: @media (prefers-reduced-motion: no-preference) { }
7. Add counter-tick behavior (data-target attribute + IntersectionObserver JS) to stat numbers
8. All JS MUST be in IIFE: ;(function(){ YOUR CODE })();

ANIMATION BUDGET: ${dict.rules.animation.budget}
Allowed text animations: ${JSON.stringify(dict.rules.animation.text_animations_allowed ?? [])}
Allowed hover effects: ${JSON.stringify(dict.rules.animation.hover_effects_allowed ?? [])}
Keyframes allowed: ${dict.rules.animation.keyframes_allowed}

FORBIDDEN in this pass:
- Do NOT change any HTML structure
- Do NOT change any text content
- Do NOT change any Tailwind classes
- Do NOT add new sections or remove elements
- ONLY resolve placeholders and add visual layer

WORD-CYCLE IMPLEMENTATION PATTERN:
<style>
@media (prefers-reduced-motion: no-preference) {
  @keyframes wordOut { to { opacity:0; transform:translateY(-7px); } }
  @keyframes wordIn  { from { opacity:0; transform:translateY(7px); } to { opacity:1; transform:translateY(0); } }
  .word-out { animation: wordOut .22s ease forwards; }
  .word-in  { animation: wordIn  .22s ease forwards; }
}
</style>
<script>;(function(){
  var el=document.getElementById('wordCycle');
  if(!el)return;
  var words=['Word1','Word2','Word3'];
  var i=0;
  var reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduced)return;
  setInterval(function(){
    el.classList.add('word-out');
    setTimeout(function(){
      i=(i+1)%words.length;
      el.textContent=words[i];
      el.classList.remove('word-out');
      el.classList.add('word-in');
      setTimeout(function(){ el.classList.remove('word-in'); },230);
    },220);
  },3200);
})();</script>

COUNTER-TICK PATTERN (for elements with data-target="NUMBER"):
<script>;(function(){
  var reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduced)return;
  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(!e.isIntersecting)return;
      var el=e.target,end=parseInt(el.dataset.target),dur=1400,t0=performance.now();
      (function tick(now){
        var p=Math.min((now-t0)/dur,1),v=1-Math.pow(1-p,3);
        el.textContent=Math.floor(v*end)+'+';
        if(p<1)requestAnimationFrame(tick);
      })(t0);
      io.unobserve(el);
    });
  },{threshold:0.5});
  document.querySelectorAll('[data-target]').forEach(function(el){ io.observe(el); });
})();</script>

CONCAVE BOTTOM TRANSITION:
<style>
.section-concave { position: relative; overflow: hidden; }
.section-concave::after {
  content: ''; position: absolute;
  bottom: -60px; left: -5%; right: -5%;
  height: 100px; background: NEXT_COLOR; border-radius: 50%;
}
</style>`
}

export function buildPass2User(pass1Html: string, manifest: SiteManifest): string {
  return `Enhance this HTML section with the visual layer. Resolve all placeholder comments.
Company context: ${manifest.content.company_name}, style: ${manifest.style_paradigm}
Colors: primary=${manifest.design_tokens.colors.primary}, accent=${manifest.design_tokens.colors.accent}

HTML TO ENHANCE:
${pass1Html}`
}

// ═══════════════════════════════════════════════════════
// PASS 3 — VALIDATOR
// ═══════════════════════════════════════════════════════

export const PASS3_SYSTEM = `You are an HTML/CSS validator. Respond ONLY with JSON matching this exact schema:
{
  "valid": boolean,
  "score": number (0-100),
  "errors": [{ "type": string, "message": string, "severity": "error"|"warning", "auto_fixable": boolean }]
}
No markdown, no explanation, no other keys.`

export function buildPass3User(html: string, dict: StyleDictionary, manifest: SiteManifest): string {
  return `Validate this HTML section against all checks.

FORBIDDEN PATTERNS (from style dictionary — flag if found):
${JSON.stringify(dict.forbidden_patterns)}

AUTO-FLAG RULES (from manifest):
${manifest.pass3_auto_flags.map((r, i) => `${i + 1}. ${r}`).join('\n')}

CHECKLIST:
1. All img have alt="" attribute?
2. All icon-only buttons have aria-label?
3. @keyframes exist outside @media(prefers-reduced-motion:no-preference)?
4. style="" contains layout properties (grid/flex/width/height)?
5. grid-cols-X used without preceding grid-cols-1?
6. min-h-screen without md: prefix?
7. order-1 on element containing h1, h2, or form?
8. button or a element without py-3 or min-h-11?
9. Any forbidden patterns from style dictionary present?
10. CSS Custom Properties used correctly (var(--color-*) syntax)?
11. All inline scripts wrapped in IIFE?
12. section root element has overflow-hidden and isolate classes?
13. img missing loading="lazy"?

For each issue: set auto_fixable: true if fixable with string-replace.
Score: start at 100, subtract 10 per error, 3 per warning.

HTML TO VALIDATE:
${html.slice(0, 8000)}`
}
```

### Schritt 3.5 — Section Generator

**Erstelle:** `src/lib/generation/sectionGenerator.ts`

```typescript
import { SiteManifest, ValidationResult, ValidationError } from '../types/manifest'
import { loadStyleDictionary } from '../style/styleDictionary'
import { provider, MODEL_CONFIG } from '../ai/models'
import {
  MANIFEST_SYSTEM, buildManifestPrompt,
  buildPass1System, buildPass1User,
  buildPass2System, buildPass2User,
  PASS3_SYSTEM, buildPass3User,
} from './prompts'
import { safeParseJson, autoFix } from './autoFix'
import { findBestReference } from '../sections/sectionLibrary'

export interface SectionGenerationResult {
  html: string
  pass1_html: string
  pass2_html: string
  validation_score: number
  validation_errors: ValidationError[]
  duration_ms: number
  passes_run: number
}

export async function generateSection(input: {
  section_type: string
  manifest: SiteManifest
  content_brief?: string
}): Promise<SectionGenerationResult> {
  const t0   = Date.now()
  const dict = loadStyleDictionary(input.manifest.style_paradigm)
  const ragRef = findBestReference(input.section_type, input.manifest)

  // ── Pass 1: Struktur ──────────────────────────────────────────────────
  const pass1Html = await provider.complete({
    model:       MODEL_CONFIG.pass1_structure.model,
    system:      buildPass1System(dict, input.manifest),
    messages:    [{ role: 'user', content: buildPass1User({
      section_type:  input.section_type,
      manifest:      input.manifest,
      content_brief: input.content_brief ?? '',
      rag_reference: ragRef,
    })}],
    max_tokens:  MODEL_CONFIG.pass1_structure.max_tokens,
    temperature: MODEL_CONFIG.pass1_structure.temperature,
  })

  // ── Pass 2: Visual Layer (nur wenn animation budget > none) ──────────
  let pass2Html = pass1Html
  let passesRun = 1

  if (dict.rules.animation.budget !== 'none') {
    pass2Html = await provider.complete({
      model:       MODEL_CONFIG.pass2_visual.model,
      system:      buildPass2System(dict),
      messages:    [{ role: 'user', content: buildPass2User(pass1Html, input.manifest) }],
      max_tokens:  MODEL_CONFIG.pass2_visual.max_tokens,
      temperature: MODEL_CONFIG.pass2_visual.temperature,
    })
    passesRun = 2
  }

  // ── Pass 3: Validierung ───────────────────────────────────────────────
  const validationRaw = await provider.complete({
    model:           MODEL_CONFIG.pass3_validator.model,
    system:          PASS3_SYSTEM,
    messages:        [{ role: 'user', content: buildPass3User(pass2Html, dict, input.manifest) }],
    max_tokens:      MODEL_CONFIG.pass3_validator.max_tokens,
    response_format: MODEL_CONFIG.pass3_validator.response_format,
  })
  passesRun = 3

  const validation = safeParseJson<ValidationResult>(validationRaw)
  const finalHtml  = autoFix(pass2Html, validation?.errors ?? [])

  return {
    html:              finalHtml,
    pass1_html:        pass1Html,
    pass2_html:        pass2Html,
    validation_score:  validation?.score ?? 0,
    validation_errors: validation?.errors ?? [],
    duration_ms:       Date.now() - t0,
    passes_run:        passesRun,
  }
}

// Alle Sections einer Seite parallel generieren
export async function generatePage(
  page: SiteManifest['pages'][0],
  manifest: SiteManifest,
  onProgress?: (section: string, status: 'start' | 'done', score?: number) => void
): Promise<{ section_type: string; html: string; score: number }[]> {
  return Promise.all(
    page.sections.map(async (sectionType) => {
      onProgress?.(sectionType, 'start')
      const result = await generateSection({ section_type: sectionType, manifest })
      onProgress?.(sectionType, 'done', result.validation_score)
      return { section_type: sectionType, html: result.html, score: result.validation_score }
    })
  )
}

// Manifest aus BriefingInput generieren
export async function generateManifest(
  input: Parameters<typeof buildManifestPrompt>[0]
): Promise<SiteManifest> {
  const raw = await provider.complete({
    model:           MODEL_CONFIG.manifest_generation.model,
    system:          MANIFEST_SYSTEM,
    messages:        [{ role: 'user', content: buildManifestPrompt(input) }],
    max_tokens:      MODEL_CONFIG.manifest_generation.max_tokens,
    temperature:     MODEL_CONFIG.manifest_generation.temperature,
    response_format: MODEL_CONFIG.manifest_generation.response_format,
  })

  const manifest = safeParseJson<SiteManifest>(raw)
  if (!manifest) throw new Error('Manifest generation failed — invalid JSON response')

  manifest.id           = manifest.id || crypto.randomUUID()
  manifest.generated_at = new Date().toISOString()

  // User Brand-Farben dürfen nie überschrieben werden
  if (input.brand_colors) {
    Object.assign(manifest.design_tokens.colors, input.brand_colors)
    manifest.design_tokens.colors._source = 'user-brand'
    manifest._decision_log.colors = 'User-provided brand colors — not overwritten'
  }

  return manifest
}
```

### Akzeptanzkriterium Modul 3:
```bash
npx tsc --noEmit
# Alle Imports auflösbar, keine TypeScript-Fehler
```

---

## MODUL 4 — API-Routen (v2)
*Abhängigkeit: Modul 2, 3*

### Schritt 4.1 — Manifest Route

**Erstelle:** `src/app/api/v2/manifest/route.ts`

```typescript
import { NextRequest } from 'next/server'
import { generateManifest } from '@/lib/generation/sectionGenerator'

export const runtime    = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const input = await req.json()
  if (!input.company_name || !input.style_paradigm) {
    return Response.json(
      { error: 'company_name and style_paradigm required' },
      { status: 400 }
    )
  }
  const manifest = await generateManifest(input)
  return Response.json({ manifest })
}
```

### Schritt 4.2 — Generation Route mit SSE

**Erstelle:** `src/app/api/v2/generate/route.ts`

```typescript
import { NextRequest } from 'next/server'
import { generateSection } from '@/lib/generation/sectionGenerator'
import { SiteManifest } from '@/lib/types/manifest'

export const runtime    = 'nodejs'
export const maxDuration = 120

export async function POST(req: NextRequest) {
  const { manifest, section_type, content_brief } = await req.json() as {
    manifest: SiteManifest
    section_type: string
    content_brief?: string
  }

  const encoder = new TextEncoder()
  const stream  = new TransformStream()
  const writer  = stream.writable.getWriter()

  const send = (event: string, data: object) =>
    writer.write(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))

  ;(async () => {
    try {
      send('status', { phase: 'pass1', message: 'Struktur wird generiert...' })
      const result = await generateSection({ section_type, manifest, content_brief })

      send('pass1',  { html: result.pass1_html })

      if (result.passes_run >= 2) {
        send('status', { phase: 'pass2', message: 'Visual Layer wird hinzugefügt...' })
        send('pass2',  { html: result.pass2_html })
      }

      send('status',   { phase: 'pass3', message: 'Validierung läuft...' })
      send('complete', {
        html:              result.html,
        validation_score:  result.validation_score,
        validation_errors: result.validation_errors,
        duration_ms:       result.duration_ms,
        passes_run:        result.passes_run,
      })
    } catch (err) {
      send('error', { message: err instanceof Error ? err.message : 'Unknown error' })
    } finally {
      writer.close()
    }
  })()

  return new Response(stream.readable, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
    },
  })
}
```

### Schritt 4.3 — assembler.ts erweitern

**Bestehende Datei ändern:** `src/lib/assembler.ts`

Füge am Ende der Datei hinzu (bestehende Funktionen NICHT ändern):

```typescript
import { SiteManifest } from './types/manifest'

// Neue Funktion — v2 mit Manifest und CSS Custom Properties
export function assemblePageWithManifest(
  title: string,
  sections: { html: string }[],
  manifest: SiteManifest
): string {
  const tokens = manifest.design_tokens

  const headingFont = tokens.typography.font_heading
    .replace(/['"]/g, '').split(',')[0].trim()
  const googleFonts = `https://fonts.googleapis.com/css2?family=${headingFont.replace(/ /g, '+')}:wght@300;400;700&family=Inter:wght@300;400;500;600;700&display=swap`

  const cssVars = `
    :root {
      --color-primary:    ${tokens.colors.primary};
      --color-secondary:  ${tokens.colors.secondary};
      --color-accent:     ${tokens.colors.accent};
      --color-highlight:  ${tokens.colors.highlight};
      --color-background: ${tokens.colors.background};
      --color-surface:    ${tokens.colors.surface};
      --color-dark:       ${tokens.colors.dark};
      --color-text:       ${tokens.colors.text};
      --color-muted:      ${tokens.colors.text_muted};
      --font-heading:     ${tokens.typography.font_heading};
      --font-body:        ${tokens.typography.font_body};
    }
    body { background: var(--color-background); color: var(--color-text); }
    .font-display { font-family: var(--font-heading); }
    .text-primary { color: var(--color-primary); }
    .text-accent  { color: var(--color-accent); }
    .bg-primary   { background-color: var(--color-primary); }
    .bg-accent    { background-color: var(--color-accent); }
    .bg-dark      { background-color: var(--color-dark); }
  `

  const body = sections.map(s => s.html).join('\n\n')

  return `<!DOCTYPE html>
<html lang="${manifest.site.language}" class="scroll-smooth">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} | ${manifest.site.name}</title>
  <meta name="description" content="${manifest.pages[0]?.meta_description ?? ''}" />
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="${googleFonts}" rel="stylesheet" />
  <style>${cssVars}</style>
</head>
<body class="antialiased">
${body}
</body>
</html>`
}
```

### Schritt 4.4 — Store erweitern

**Bestehende Datei ändern:** `src/lib/store.ts`

Füge folgendes hinzu (bestehenden Code NICHT ändern):

```typescript
// 1. Import am Anfang der Datei ergänzen:
import { SiteManifest } from './types/manifest'

// 2. In das BuilderStore-Interface einfügen:
manifest: SiteManifest | null
setManifest: (m: SiteManifest) => void
clearManifest: () => void

// 3. Im create()-Block initial state ergänzen:
manifest: null,

// 4. Im create()-Block actions ergänzen:
setManifest: (m) => set({ manifest: m }),
clearManifest: () => set({ manifest: null }),

// 5. In partialize (wenn vorhanden) ergänzen:
manifest: s.manifest,
```

### Schritt 4.5 — Builder UI auf v2 umschalten

**Bestehende Datei ändern:** `src/app/builder/page.tsx`

Finde die `handleGenerate`-Funktion und ersetze sie durch:

```typescript
const manifest = useBuilderStore(s => s.manifest)

async function handleGenerate(sectionType: string) {
  // v2: wenn manifest vorhanden → neue Pipeline
  if (manifest) {
    const res = await fetch('/api/v2/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ manifest, section_type: sectionType }),
    })

    const reader  = res.body!.getReader()
    const decoder = new TextDecoder()
    let   buffer  = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value)
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          const eventName = line.slice(7).trim()
          // Nächste Zeile ist data:
          continue
        }
        if (!line.startsWith('data: ')) continue
        try {
          const data = JSON.parse(line.slice(6))
          if (data.html) {
            // HTML aktualisieren sobald verfügbar (pass1 oder complete)
            updatePreviewHtml(data.html)
          }
        } catch { /* ignore parse errors */ }
      }
    }
    return
  }

  // v1 Fallback: bestehende Logik bleibt unverändert
  handleGenerateV1(sectionType)
}
```

### Akzeptanzkriterium Modul 4:
```bash
# Terminal 1:
npm run dev

# Terminal 2 — Manifest generieren:
curl -X POST http://localhost:3000/api/v2/manifest \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Test GmbH",
    "style_paradigm": "bold-expressive",
    "industry": "saas-tech",
    "adjectives": ["modern", "vertrauenswürdig"],
    "tone": "professional",
    "primary_cta": "Jetzt starten",
    "personas": ["CTO"],
    "pain_points": ["zu langsam"],
    "animation_budget": "rich",
    "navbar_style": "sticky-blur",
    "navbar_mobile": "hamburger-dropdown"
  }'

# Erwartete Antwort: { manifest: { id: "...", design_tokens: { colors: {...} }, ... } }
```

---

## MODUL 5 — Briefing Wizard
*Abhängigkeit: Modul 3, 4*

### Schritt 5.1 — Briefing Page

**Erstelle:** `src/app/briefing/page.tsx`

```typescript
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useBuilderStore } from '@/lib/store'
import { StyleParadigm } from '@/lib/types/manifest'

const PARADIGM_OPTIONS: { id: StyleParadigm; label: string; desc: string }[] = [
  { id: 'bold-expressive',  label: 'Bold & Expressive',  desc: 'Overlaps, Display-Font, Animationen' },
  { id: 'minimal-clean',    label: 'Minimal & Clean',    desc: 'Whitespace, kein Animation, 1 Accent' },
  { id: 'tech-dark',        label: 'Tech / Dark',        desc: 'Dark Mode, Gradients, Glassmorphism' },
  { id: 'luxury-editorial', label: 'Luxury / Editorial', desc: 'Serif, extremes Whitespace' },
]

const INDUSTRY_OPTIONS = [
  'saas-tech', 'recruiting-b2b', 'construction', 'e-commerce',
  'consulting-law', 'real-estate', 'healthcare', 'creative-agency'
]

export default function BriefingPage() {
  const router     = useRouter()
  const setManifest = useBuilderStore(s => s.setManifest)

  const [step, setStep]       = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const [form, setForm] = useState({
    company_name:     '',
    industry:         'saas-tech',
    adjectives:       [] as string[],
    tone:             'professional',
    primary_cta:      'Jetzt starten',
    personas:         [''] as string[],
    pain_points:      [''] as string[],
    style_paradigm:   'bold-expressive' as StyleParadigm,
    animation_budget: 'rich' as const,
    navbar_style:     'sticky-blur',
    navbar_mobile:    'hamburger-dropdown',
    brand_colors:     {} as Record<string, string>,
  })

  function update<K extends keyof typeof form>(key: K, val: typeof form[K]) {
    setForm(f => ({ ...f, [key]: val }))
  }

  function toggleAdjective(adj: string) {
    update('adjectives', form.adjectives.includes(adj)
      ? form.adjectives.filter(a => a !== adj)
      : [...form.adjectives, adj].slice(0, 4)
    )
  }

  async function handleSubmit() {
    if (!form.company_name.trim()) {
      setError('Unternehmensname fehlt')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/v2/manifest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          personas:    form.personas.filter(Boolean),
          pain_points: form.pain_points.filter(Boolean),
          brand_colors: Object.keys(form.brand_colors).length ? form.brand_colors : undefined,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      const { manifest } = await res.json()
      setManifest(manifest)
      router.push('/builder')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Generieren')
    } finally {
      setLoading(false)
    }
  }

  const ADJECTIVES = [
    'Vertrauenswürdig', 'Modern & frisch', 'Persönlich & nahbar',
    'Ambitioniert', 'Luxury', 'Playful', 'Technical', 'Minimal'
  ]

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-2xl mx-auto px-5 py-12">
        <h1 className="text-2xl font-semibold mb-2">Neues Projekt briefen</h1>
        <p className="text-sm text-zinc-500 mb-8">Schritt {step} von 4</p>

        {/* Progress */}
        <div className="flex gap-1 mb-10">
          {[1,2,3,4].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full ${s <= step ? 'bg-zinc-900' : 'bg-zinc-200'}`} />
          ))}
        </div>

        {/* Step 1: Unternehmen */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium block mb-2">Unternehmensname *</label>
              <input
                type="text"
                value={form.company_name}
                onChange={e => update('company_name', e.target.value)}
                placeholder="z.B. viminds GmbH"
                className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">Branche</label>
              <select
                value={form.industry}
                onChange={e => update('industry', e.target.value)}
                className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none"
              >
                {INDUSTRY_OPTIONS.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">Primärer CTA</label>
              <input
                type="text"
                value={form.primary_cta}
                onChange={e => update('primary_cta', e.target.value)}
                placeholder="Jetzt starten"
                className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>
        )}

        {/* Step 2: Ton und Adjektive */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium block mb-3">Tonalität (max. 4 wählen)</label>
              <div className="flex flex-wrap gap-2">
                {ADJECTIVES.map(adj => (
                  <button
                    key={adj}
                    onClick={() => toggleAdjective(adj)}
                    className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                      form.adjectives.includes(adj)
                        ? 'bg-zinc-900 text-white border-zinc-900'
                        : 'border-zinc-200 hover:border-zinc-400'
                    }`}
                  >
                    {adj}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">Zielgruppen (eine pro Zeile)</label>
              {form.personas.map((p, i) => (
                <input
                  key={i}
                  type="text"
                  value={p}
                  onChange={e => {
                    const next = [...form.personas]
                    next[i] = e.target.value
                    update('personas', next)
                  }}
                  placeholder={`Persona ${i+1}`}
                  className="w-full px-4 py-2 border border-zinc-200 rounded-xl mb-2 focus:outline-none"
                />
              ))}
              <button onClick={() => update('personas', [...form.personas, ''])}
                className="text-sm text-zinc-500 hover:text-zinc-800">+ Weiteres</button>
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">Pain Points der Zielgruppe</label>
              {form.pain_points.map((p, i) => (
                <input
                  key={i}
                  type="text"
                  value={p}
                  onChange={e => {
                    const next = [...form.pain_points]
                    next[i] = e.target.value
                    update('pain_points', next)
                  }}
                  placeholder={`Pain Point ${i+1}`}
                  className="w-full px-4 py-2 border border-zinc-200 rounded-xl mb-2 focus:outline-none"
                />
              ))}
              <button onClick={() => update('pain_points', [...form.pain_points, ''])}
                className="text-sm text-zinc-500 hover:text-zinc-800">+ Weiteres</button>
            </div>
          </div>
        )}

        {/* Step 3: Design-Paradigma */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-500 mb-4">Welche visuelle Richtung?</p>
            {PARADIGM_OPTIONS.map(p => (
              <button
                key={p.id}
                onClick={() => update('style_paradigm', p.id)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
                  form.style_paradigm === p.id
                    ? 'border-zinc-900 bg-zinc-50'
                    : 'border-zinc-200 hover:border-zinc-400'
                }`}
              >
                <div className="font-medium">{p.label}</div>
                <div className="text-sm text-zinc-500 mt-0.5">{p.desc}</div>
              </button>
            ))}
            <div className="mt-4">
              <label className="text-sm font-medium block mb-2">Animation</label>
              <div className="flex gap-2">
                {(['none','subtle','moderate','rich'] as const).map(b => (
                  <button
                    key={b}
                    onClick={() => update('animation_budget', b)}
                    className={`flex-1 py-2 rounded-lg text-sm border transition-colors ${
                      form.animation_budget === b
                        ? 'bg-zinc-900 text-white border-zinc-900'
                        : 'border-zinc-200 hover:border-zinc-400'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Navbar + Brand-Farben */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium block mb-2">Navbar-Stil</label>
              <select
                value={form.navbar_style}
                onChange={e => update('navbar_style', e.target.value)}
                className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none"
              >
                <option value="sticky-blur">Sticky mit Blur</option>
                <option value="static">Statisch</option>
                <option value="transparent-hero">Transparent über Hero</option>
                <option value="hidden-scroll">Versteckt beim Scrollen</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">Mobile Menü</label>
              <select
                value={form.navbar_mobile}
                onChange={e => update('navbar_mobile', e.target.value)}
                className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none"
              >
                <option value="hamburger-dropdown">Hamburger Dropdown</option>
                <option value="hamburger-overlay">Hamburger Fullscreen</option>
                <option value="hamburger-sidebar">Hamburger Sidebar</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">Brand-Farben (optional)</label>
              <div className="grid grid-cols-2 gap-3">
                {(['primary','accent'] as const).map(key => (
                  <div key={key}>
                    <label className="text-xs text-zinc-500 block mb-1">{key}</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={form.brand_colors[key] || '#000000'}
                        onChange={e => update('brand_colors', { ...form.brand_colors, [key]: e.target.value })}
                        className="w-10 h-10 rounded cursor-pointer border-0"
                      />
                      <input
                        type="text"
                        value={form.brand_colors[key] || ''}
                        onChange={e => update('brand_colors', { ...form.brand_colors, [key]: e.target.value })}
                        placeholder="#000000"
                        className="flex-1 px-3 py-2 border border-zinc-200 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-zinc-400 mt-2">
                Wenn leer: KI wählt Farben passend zur Branche und Tonalität
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-10">
          {step > 1 ? (
            <button onClick={() => setStep(s => s - 1)}
              className="px-6 py-3 border border-zinc-200 rounded-xl hover:border-zinc-400 transition-colors">
              Zurück
            </button>
          ) : <div />}

          {step < 4 ? (
            <button
              onClick={() => {
                if (step === 1 && !form.company_name.trim()) {
                  setError('Unternehmensname fehlt')
                  return
                }
                setError('')
                setStep(s => s + 1)
              }}
              className="px-6 py-3 bg-zinc-900 text-white rounded-xl hover:bg-zinc-700 transition-colors"
            >
              Weiter
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-8 py-3 bg-zinc-900 text-white rounded-xl disabled:opacity-50 hover:bg-zinc-700 transition-colors"
            >
              {loading ? 'Manifest wird generiert…' : 'Projekt erstellen →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
```

### Akzeptanzkriterium Modul 5:
```
/briefing öffnen → alle 4 Schritte navigierbar
Letzter Schritt: "Projekt erstellen" → POST /api/v2/manifest → redirect /builder
Im Builder: manifest im Zustand-Store gesetzt
```

---

## MODUL 6 — Scraping
*Abhängigkeit: Modul 1, 2*

### Schritt 6.1 — Site Scraper

**Erstelle:** `src/lib/scraping/siteScraperService.ts`

```typescript
import puppeteer from 'puppeteer'
import OpenAI from 'openai'

export interface ScrapedFingerprint {
  source_url: string; scraped_at: string; confidence: number
  colors: { primary: string; secondary: string; accent: string; background: string; text: string }
  typography: { heading_font: string; body_font: string; heading_weight: string; size_scale: string }
  layout: { whitespace: string; full_bleed: boolean; overlaps: boolean; diagonal_cuts: boolean; concave_sections: boolean }
  decoration: { gradients: boolean; color_overlays: boolean; glassmorphism: boolean; geometric_shapes: boolean; mesh_gradient: boolean }
  animation: { budget: string; scroll_driven: boolean; text_animations: boolean }
  paradigm_detected: string
  tags: string[]
  section_sequence: string[]
  surprises?: Array<{
    observation: string; category: string
    confidence: number; css_hint: string | null
    reusability: 'universal' | 'paradigm-specific' | 'brand-specific'
  }>
}

// Vollständiges CSS-Extract-Script
const EXTRACT_SCRIPT = `(function() {
  const sections = Array.from(document.querySelectorAll('section, main > div, [class*="section"]'))
  const body = document.body
  const nav  = document.querySelector('nav, header')
  const h1   = document.querySelector('h1')
  const all  = Array.from(document.querySelectorAll('*'))
  function gs(el, p) { return el ? getComputedStyle(el).getPropertyValue(p).trim() : '' }
  return {
    h1_font:    gs(h1,'font-family'), h1_weight: gs(h1,'font-weight'), h1_size: gs(h1,'font-size'),
    body_font:  gs(body,'font-family'), body_bg: gs(body,'background-color'), body_color: gs(body,'color'),
    nav_bg:     gs(nav,'background-color'), nav_position: gs(nav,'position'),
    theme_color: document.querySelector('meta[name="theme-color"]')?.content || '',
    has_backdrop_blur:    all.some(el => gs(el,'backdrop-filter').includes('blur') || gs(el,'-webkit-backdrop-filter').includes('blur')),
    has_clip_path:        sections.some(el => gs(el,'clip-path').includes('polygon')),
    has_svg_background:   all.some(el => gs(el,'background-image').includes('svg')),
    has_scroll_animation: all.some(el => { const at = gs(el,'animation-timeline'); return at && at !== 'auto' && at !== 'none'; }),
    has_counter_anim:     document.querySelectorAll('[data-target],[data-count],[data-number]').length > 0,
    has_gradient_text:    all.some(el => gs(el,'background-image').includes('gradient') && gs(el,'-webkit-text-fill-color') === 'transparent'),
    has_noise_texture:    all.some(el => gs(el,'background-image').includes('base64')),
    has_bento_grid:       all.filter(el => gs(el,'display') === 'grid').some(el => Array.from(el.children).some(c => gs(c,'grid-column').includes('span 2') || gs(c,'grid-column').includes('span 3'))),
    has_transparent_nav:  (gs(nav,'background-color') || '').includes('rgba') && (gs(nav,'background-color') || '').includes(', 0)'),
    has_negative_margin:  sections.some(el => parseFloat(gs(el,'margin-top')) < -10),
    has_pseudo_concave:   (() => { try { const a = sections[0] && getComputedStyle(sections[0],'::after'); return a && (a.borderRadius||'').includes('50%'); } catch { return false; } })(),
    section_count: sections.length, grid_count: all.filter(el => gs(el,'display') === 'grid').length,
    svg_count: document.querySelectorAll('svg').length,
  };
})()`

const VISION_PROMPT = (url: string, cssData: object) => `You are a senior design analyst reviewing a website screenshot.
Analyze BOTH the visual design AND the extracted CSS data below.
Respond ONLY with valid JSON matching this exact schema. No markdown, no explanation.

URL: ${url}
CSS extracted from browser: ${JSON.stringify(cssData)}

JSON schema:
{
  "confidence": 0.0-1.0,
  "colors": { "primary": "#hex", "secondary": "#hex", "accent": "#hex", "background": "#hex", "text": "#hex" },
  "typography": { "heading_font": "exact font family", "body_font": "exact font family", "heading_weight": "400|500|600|700|800|900", "size_scale": "compact|normal|large|display", "tracking": "tight|normal|wide" },
  "layout": { "whitespace": "tight|balanced|generous|extreme", "full_bleed": true|false, "overlaps": true|false, "diagonal_cuts": true|false, "concave_sections": true|false },
  "decoration": { "gradients": true|false, "color_overlays": true|false, "geometric_shapes": true|false, "glassmorphism": true|false, "mesh_gradient": true|false },
  "animation": { "budget": "none|subtle|moderate|rich", "scroll_driven": true|false, "text_animations": true|false },
  "paradigm_detected": "minimal-clean|tech-dark|bold-expressive|luxury-editorial|bento-grid|brutalist",
  "tags": ["max 8 tags"],
  "section_sequence": ["detected section types in order, max 10"],
  "surprises": [
    {
      "observation": "1-2 sentences: UNUSUAL or CLEVER design decision rarely seen. Be visual and specific. NOT generic.",
      "category": "layout|transition|animation|typography|decoration|interaction|color",
      "confidence": 0.0-1.0,
      "css_hint": "relevant CSS property if supported by data, else null",
      "reusability": "universal|paradigm-specific|brand-specific"
    }
  ]
}
Include 3-6 surprises where confidence >= 0.65. Skip brand-specific observations.`

export async function scrapeSite(url: string): Promise<ScrapedFingerprint> {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1440, height: 900 })
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })

    const [screenshot, cssData] = await Promise.all([
      page.screenshot({ type: 'jpeg', quality: 75 }) as Promise<Buffer>,
      page.evaluate(EXTRACT_SCRIPT) as Promise<Record<string, unknown>>,
    ])

    const openai  = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const base64  = (screenshot as Buffer).toString('base64')

    const res = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}`, detail: 'low' } },
          { type: 'text', text: VISION_PROMPT(url, cssData) },
        ],
      }],
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    })

    const result = JSON.parse(res.choices[0]?.message?.content ?? '{}') as ScrapedFingerprint
    result.source_url = url
    result.scraped_at = new Date().toISOString()

    // Discovery async auslösen — blockiert Rückgabe nicht
    ingestDiscovery(result, cssData).catch(err => console.warn('Discovery ingest failed:', err))

    return result
  } finally {
    await browser.close()
  }
}

async function ingestDiscovery(fingerprint: ScrapedFingerprint, cssData: Record<string, unknown>) {
  try {
    const { ingestSurprises } = await import('../discovery/discoveryQueue')
    const { detectAnomalies, loadBaseline, updateBaseline, saveBaseline } = await import('../discovery/anomalyDetector')

    if (fingerprint.surprises?.length) {
      ingestSurprises(fingerprint.surprises, fingerprint)
    }

    const baseline  = loadBaseline()
    const anomalies = detectAnomalies(cssData as any, baseline)
    if (anomalies.length) {
      ingestSurprises(anomalies, fingerprint)
    }
    saveBaseline(updateBaseline(cssData as any, baseline))
  } catch (err) {
    console.warn('Discovery ingest error:', err)
  }
}
```

### Schritt 6.2 — Scrape Route

**Erstelle:** `src/app/api/v2/scrape/route.ts`

```typescript
import { NextRequest } from 'next/server'
import { scrapeSite } from '@/lib/scraping/siteScraperService'

export const runtime    = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const { url } = await req.json()
  if (!url?.startsWith('http')) {
    return Response.json({ error: 'Valid URL required (must start with http)' }, { status: 400 })
  }
  const fingerprint = await scrapeSite(url)
  return Response.json({ fingerprint })
}
```

### Akzeptanzkriterium Modul 6:
```bash
curl -X POST http://localhost:3000/api/v2/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://vercel.com"}'

# Erwartete Antwort in < 45s:
# { fingerprint: { paradigm_detected: "tech-dark", colors: {...}, surprises: [...] } }
```

---

## MODUL 7 — Discovery System
*Abhängigkeit: Modul 1, 6*

### Schritt 7.1 — Discovery Queue

**Erstelle:** `src/lib/discovery/discoveryQueue.ts`

```typescript
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import path from 'path'
import { DesignPattern } from '../types/pattern'

const QUEUE_PATH  = path.join(process.cwd(), 'src/data/discovery/queue.json')
const TREND_PATH  = path.join(process.cwd(), 'src/data/discovery/trends.json')

export interface DiscoveryEntry {
  id: string; source_url: string; scraped_at: string
  observation: string; category: string; confidence: number
  css_hint: string | null; reusability: string; paradigm: string
  tags: string[]; status: 'pending'|'reviewing'|'approved'|'rejected'
  pattern_id: string | null; reviewer_note: string | null
  seen_count: number; seen_on: string[]
}

function ensureDir(p: string) {
  const d = path.dirname(p)
  if (!existsSync(d)) mkdirSync(d, { recursive: true })
}

function loadQueue(): DiscoveryEntry[] {
  try { return JSON.parse(readFileSync(QUEUE_PATH, 'utf-8')) } catch { return [] }
}

function saveQueue(q: DiscoveryEntry[]) {
  ensureDir(QUEUE_PATH)
  writeFileSync(QUEUE_PATH, JSON.stringify(q, null, 2))
}

function loadTrends(): Record<string, Record<string, number>> {
  try { return JSON.parse(readFileSync(TREND_PATH, 'utf-8')) } catch { return {} }
}

function saveTrends(t: Record<string, Record<string, number>>) {
  ensureDir(TREND_PATH)
  writeFileSync(TREND_PATH, JSON.stringify(t, null, 2))
}

// Jaccard-Similarity + Boost für kurze Texte
function similarity(a: string, b: string): number {
  const tok = (s: string) => new Set(s.toLowerCase().split(/\W+/).filter(w => w.length > 3))
  const tA = tok(a), tB = tok(b)
  const inter = [...tA].filter(t => tB.has(t)).length
  const union = new Set([...tA, ...tB]).size
  const jaccard = union === 0 ? 0 : inter / union
  const minLen  = Math.min(tA.size, tB.size)
  const boost   = (minLen <= 5 && inter >= 2) ? 0.25 : 0
  return Math.min(1, jaccard + boost)
}

export function ingestSurprises(
  surprises: Array<{ observation: string; category: string; confidence: number; css_hint?: string|null; reusability: string }>,
  meta: { source_url: string; scraped_at?: string; paradigm_detected: string; tags?: string[] }
): { added: number; incremented: number } {
  const queue  = loadQueue()
  const trends = loadTrends()
  let added = 0, incremented = 0

  for (const s of surprises) {
    if (s.confidence < 0.65) continue
    if (s.reusability === 'brand-specific') continue

    const similar = queue.find(e =>
      e.category === s.category && similarity(e.observation, s.observation) > 0.4
    )

    if (similar) {
      similar.seen_count++
      similar.seen_on = [...(similar.seen_on ?? []), meta.source_url].filter((v, i, a) => a.indexOf(v) === i)
      incremented++
    } else {
      queue.push({
        id:            `disc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        source_url:    meta.source_url,
        scraped_at:    meta.scraped_at ?? new Date().toISOString(),
        observation:   s.observation,
        category:      s.category,
        confidence:    s.confidence,
        css_hint:      s.css_hint ?? null,
        reusability:   s.reusability,
        paradigm:      meta.paradigm_detected,
        tags:          meta.tags ?? [],
        status:        'pending',
        pattern_id:    null,
        reviewer_note: null,
        seen_count:    1,
        seen_on:       [meta.source_url],
      })
      added++
      const month = new Date().toISOString().slice(0, 7)
      if (!trends[s.category]) trends[s.category] = {}
      trends[s.category][month] = (trends[s.category][month] ?? 0) + 1
    }
  }

  saveQueue(queue)
  saveTrends(trends)
  return { added, incremented }
}

export function getQueue(filter?: {
  status?: string; category?: string; reusability?: string; minSeenCount?: number
}): DiscoveryEntry[] {
  let q = loadQueue()
  if (filter?.status)       q = q.filter(e => e.status === filter.status)
  if (filter?.category)     q = q.filter(e => e.category === filter.category)
  if (filter?.reusability)  q = q.filter(e => e.reusability === filter.reusability)
  if (filter?.minSeenCount) q = q.filter(e => e.seen_count >= filter.minSeenCount!)
  return q.sort((a, b) => b.seen_count - a.seen_count || b.confidence - a.confidence)
}

export function updateStatus(id: string, status: string, reviewerNote?: string): DiscoveryEntry | null {
  const queue = loadQueue()
  const entry = queue.find(e => e.id === id)
  if (!entry) return null
  entry.status = status as DiscoveryEntry['status']
  if (reviewerNote) entry.reviewer_note = reviewerNote
  saveQueue(queue)
  return entry
}

export function formalize(id: string, overrides: Partial<DesignPattern> = {}): DesignPattern {
  const queue = loadQueue()
  const entry = queue.find(e => e.id === id)
  if (!entry || entry.status !== 'approved') throw new Error(`Candidate ${id} not found or not approved`)

  const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50)
  const patternId = `disc-${slug(entry.observation.slice(0, 40))}-${Date.now()}`

  const pattern: DesignPattern = {
    id:          patternId,
    type:        (overrides.type ?? entry.category) as DesignPattern['type'],
    source_url:  entry.source_url,
    scraped_at:  entry.scraped_at,
    confidence:  entry.confidence,
    name:        overrides.name ?? entry.observation.slice(0, 60),
    description: overrides.description ?? entry.observation,
    tags:        overrides.tags ?? [...entry.tags, 'discovered', entry.category],
    industries:  overrides.industries ?? ['general'],
    paradigms:   overrides.paradigms ?? [entry.paradigm as any],
    implementation: {
      style_dict_key: overrides.implementation?.style_dict_key ?? `rules.decoration.${slug(entry.category)}`,
      style_dict_val: overrides.implementation?.style_dict_val ?? true,
      css_hint:       entry.css_hint ?? undefined,
      placeholder:    overrides.implementation?.placeholder,
      html_snippet:   overrides.implementation?.html_snippet,
    } as any,
    preview_description: overrides.preview_description ?? entry.observation.slice(0, 80),
    visual_weight:    overrides.visual_weight ?? 'medium',
    brand_dependency: overrides.brand_dependency ?? 'none',
    discovery_meta: {
      seen_count:      entry.seen_count,
      seen_on:         entry.seen_on,
      css_hint:        entry.css_hint,
      auto_discovered: true,
    },
  }

  entry.pattern_id = patternId
  saveQueue(queue)
  return pattern
}

export function getTrends() {
  const trends = loadTrends()
  const now    = new Date()
  const months = [0, 1, 2].map(i => {
    const d = new Date(now); d.setMonth(d.getMonth() - i)
    return d.toISOString().slice(0, 7)
  })
  return Object.entries(trends).map(([category, data]) => {
    const recent = months.reduce((s, m) => s + (data[m] ?? 0), 0)
    const older  = Object.entries(data).filter(([m]) => !months.includes(m)).reduce((s, [, v]) => s + v, 0)
    const trend  = older === 0 ? 'new' : recent > older ? 'rising' : recent < older ? 'declining' : 'stable'
    return { category, recent, older, trend, total: recent + older }
  }).sort((a, b) => b.recent - a.recent)
}

export function getStats() {
  const q = loadQueue()
  return {
    total:     q.length,
    pending:   q.filter(e => e.status === 'pending').length,
    reviewing: q.filter(e => e.status === 'reviewing').length,
    approved:  q.filter(e => e.status === 'approved').length,
    rejected:  q.filter(e => e.status === 'rejected').length,
    hot:       q.filter(e => e.seen_count >= 3 && e.status === 'pending').length,
  }
}
```

### Schritt 7.2 — Anomaly Detector

**Erstelle:** `src/lib/discovery/anomalyDetector.ts`

```typescript
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import path from 'path'

const BASELINE_PATH = path.join(process.cwd(), 'src/data/discovery/baseline.json')

export interface CssData {
  has_backdrop_blur: boolean; has_clip_path: boolean; has_svg_background: boolean
  has_scroll_animation: boolean; has_counter_anim: boolean; has_gradient_text: boolean
  has_noise_texture: boolean; has_bento_grid: boolean; has_transparent_nav: boolean
  has_negative_margin: boolean; has_pseudo_concave: boolean
  section_count: number; grid_count: number; svg_count: number; h1_size: string
  [key: string]: unknown
}

export interface Baseline {
  sites_count: number
  properties: Record<string, { total: number; values: Record<string, number> }>
}

export function loadBaseline(): Baseline {
  try { return JSON.parse(readFileSync(BASELINE_PATH, 'utf-8')) }
  catch { return { sites_count: 0, properties: {} } }
}

export function saveBaseline(b: Baseline) {
  const dir = path.dirname(BASELINE_PATH)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(BASELINE_PATH, JSON.stringify(b, null, 2))
}

export function updateBaseline(cssData: CssData, baseline: Baseline): Baseline {
  baseline.sites_count++
  for (const [prop, value] of Object.entries(cssData)) {
    if (!baseline.properties[prop]) baseline.properties[prop] = { total: 0, values: {} }
    baseline.properties[prop].total++
    const vk = String(value)
    baseline.properties[prop].values[vk] = (baseline.properties[prop].values[vk] ?? 0) + 1
  }
  return baseline
}

function rarityScore(prop: string, value: unknown, baseline: Baseline): number {
  const d = baseline.properties[prop]
  if (!d || baseline.sites_count < 5) return 0
  const seen = d.values[String(value)] ?? 0
  return 1 - (seen / baseline.sites_count)
}

export function detectAnomalies(
  cssData: CssData,
  baseline: Baseline
): Array<{ observation: string; category: string; confidence: number; css_hint: string; reusability: 'universal' }> {
  if (baseline.sites_count < 5) return []

  const anomalies = []

  const FLAGS: Record<string, { name: string; category: string; hint: string }> = {
    has_backdrop_blur:    { name: 'Glassmorphism-Effekt',        category: 'decoration',  hint: 'backdrop-filter: blur()' },
    has_clip_path:        { name: 'Diagonaler Clip-Path Schnitt', category: 'transition',  hint: 'clip-path: polygon()' },
    has_svg_background:   { name: 'SVG-Hintergrundgrafik',       category: 'decoration',  hint: 'background-image: url(svg)' },
    has_scroll_animation: { name: 'Scroll-Driven Animation',     category: 'animation',   hint: 'animation-timeline: scroll()' },
    has_counter_anim:     { name: 'Zähler-Animation',            category: 'animation',   hint: '[data-target] attributes' },
    has_gradient_text:    { name: 'Gradient Text Effekt',        category: 'typography',  hint: '-webkit-text-fill-color: transparent' },
    has_noise_texture:    { name: 'Noise-Textur Hintergrund',    category: 'decoration',  hint: 'base64 background-image' },
    has_bento_grid:       { name: 'Bento-Grid Layout',           category: 'layout',      hint: 'grid-column: span 2+' },
    has_transparent_nav:  { name: 'Transparente Nav am Start',   category: 'interaction', hint: 'nav background: transparent' },
    has_negative_margin:  { name: 'Negative Margin Überlappung', category: 'layout',      hint: 'margin-top: negative' },
    has_pseudo_concave:   { name: 'Konkave Pseudo-Kurve',        category: 'transition',  hint: '::after border-radius: 50%' },
  }

  for (const [flag, meta] of Object.entries(FLAGS)) {
    if (!cssData[flag]) continue
    const rarity = rarityScore(flag, 'true', baseline)
    if (rarity < 0.5) continue
    anomalies.push({
      observation:  `${meta.name} — in nur ${Math.round((1 - rarity) * 100)}% der Referenz-Sites gesehen`,
      category:     meta.category,
      confidence:   Math.min(0.95, 0.7 + rarity * 0.25),
      css_hint:     meta.hint,
      reusability:  'universal' as const,
    })
  }

  const h1Px = parseFloat(cssData.h1_size)
  if (h1Px >= 80) {
    anomalies.push({
      observation:  `Extrem große Headline (${cssData.h1_size}) — Display-Typografie als Hauptgestaltungselement`,
      category:     'typography',
      confidence:   0.8,
      css_hint:     `h1 font-size: ${cssData.h1_size}`,
      reusability:  'universal' as const,
    })
  }

  if ((cssData.svg_count as number) > 10) {
    anomalies.push({
      observation:  `Ungewöhnlich viele SVG-Elemente (${cssData.svg_count}) — wahrscheinlich SVG-basierte Dekoration`,
      category:     'decoration',
      confidence:   0.75,
      css_hint:     `${cssData.svg_count} SVG elements`,
      reusability:  'universal' as const,
    })
  }

  return anomalies
}
```

### Schritt 7.3 — Discovery API

**Erstelle:** `src/app/api/v2/discovery/route.ts`

```typescript
import { NextRequest } from 'next/server'
import {
  ingestSurprises, getQueue, updateStatus,
  formalize, getTrends, getStats,
} from '@/lib/discovery/discoveryQueue'
import { detectAnomalies, loadBaseline, updateBaseline, saveBaseline } from '@/lib/discovery/anomalyDetector'
import { savePatterns } from '@/lib/patterns/patternLibrary'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const view = searchParams.get('view')

  if (view === 'trends') return Response.json({ trends: getTrends(), stats: getStats() })
  if (view === 'stats')  return Response.json(getStats())

  const queue = getQueue({
    status:       searchParams.get('status') ?? undefined,
    category:     searchParams.get('category') ?? undefined,
    reusability:  searchParams.get('reusability') ?? undefined,
    minSeenCount: searchParams.get('minSeen') ? parseInt(searchParams.get('minSeen')!) : undefined,
  })
  return Response.json({ queue, stats: getStats() })
}

export async function POST(req: NextRequest) {
  const { action, ...body } = await req.json()

  if (action === 'ingest') {
    const { fingerprint, cssData } = body
    const visionResult = fingerprint.surprises?.length
      ? ingestSurprises(fingerprint.surprises, fingerprint)
      : { added: 0, incremented: 0 }

    let anomalyResult = { added: 0, incremented: 0 }
    if (cssData) {
      const baseline  = loadBaseline()
      const anomalies = detectAnomalies(cssData, baseline)
      if (anomalies.length) anomalyResult = ingestSurprises(anomalies, fingerprint)
      saveBaseline(updateBaseline(cssData, baseline))
    }

    return Response.json({
      vision:      visionResult,
      anomaly:     anomalyResult,
      total_added: visionResult.added + anomalyResult.added,
      stats:       getStats(),
    })
  }

  if (action === 'status') {
    const updated = updateStatus(body.id, body.status, body.reviewer_note)
    if (!updated) return Response.json({ error: 'not found' }, { status: 404 })
    return Response.json({ entry: updated, stats: getStats() })
  }

  if (action === 'formalize') {
    try {
      const pattern = formalize(body.id, body.overrides ?? {})
      savePatterns([pattern])
      return Response.json({ pattern, stats: getStats() })
    } catch (e) {
      return Response.json({ error: String(e) }, { status: 400 })
    }
  }

  return Response.json({ error: `Unknown action: ${action}` }, { status: 400 })
}
```

### Schritt 7.4 — Pattern Library

**Erstelle:** `src/lib/patterns/patternLibrary.ts`

```typescript
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import path from 'path'
import { DesignPattern, PatternType } from '../types/pattern'
import { StyleParadigm } from '../types/manifest'
import { StyleDictionary } from '../types/styleDictionary'

const PATTERNS_PATH = path.join(process.cwd(), 'src/data/pattern-library/patterns.json')

export function loadAll(): DesignPattern[] {
  try { return JSON.parse(readFileSync(PATTERNS_PATH, 'utf-8')) } catch { return [] }
}

export function savePatterns(newPatterns: DesignPattern[]) {
  const dir = path.dirname(PATTERNS_PATH)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  const existing = loadAll()
  const deduped  = newPatterns.filter(p =>
    !existing.some(e => e.source_url === p.source_url && e.type === p.type)
  )
  writeFileSync(PATTERNS_PATH, JSON.stringify([...existing, ...deduped], null, 2))
  return deduped.length
}

export function getPatternsForParadigm(paradigm: StyleParadigm): DesignPattern[] {
  return loadAll().filter(p => p.paradigms.includes(paradigm))
}

export function getPatternsByType(type: PatternType): DesignPattern[] {
  return loadAll().filter(p => p.type === type).sort((a, b) => b.confidence - a.confidence)
}

// First-wins semantik — erstes Pattern pro Key gewinnt
export function enrichStyleDictionary(
  dict: StyleDictionary,
  selectedPatterns: DesignPattern[]
): StyleDictionary {
  const enriched    = JSON.parse(JSON.stringify(dict)) as StyleDictionary
  const alreadySet  = new Set<string>()

  for (const pattern of selectedPatterns) {
    const { style_dict_key, style_dict_val } = pattern.implementation
    if (!style_dict_key || alreadySet.has(style_dict_key)) continue
    alreadySet.add(style_dict_key)

    const keys = style_dict_key.split('.')
    let obj = enriched as Record<string, unknown>
    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) obj[keys[i]] = {}
      obj = obj[keys[i]] as Record<string, unknown>
    }
    obj[keys[keys.length - 1]] = style_dict_val
  }

  return enriched
}
```

### Schritt 7.5 — Discovery Page

**Erstelle:** `src/app/discovery/page.tsx`

Vollständige React-Seite mit Queue-Review-Interface. Kopiere `discovery-page.tsx` aus den Output-Files.

### Akzeptanzkriterium Modul 7:
```bash
# Queue-API aufrufen:
curl http://localhost:3000/api/v2/discovery
# Erwartete Antwort: { queue: [], stats: { total: 0, pending: 0, ... } }

# Discoveries ingestieren:
curl -X POST http://localhost:3000/api/v2/discovery \
  -H "Content-Type: application/json" \
  -d '{
    "action": "ingest",
    "fingerprint": {
      "source_url": "https://example.com",
      "paradigm_detected": "bold-expressive",
      "tags": ["test"],
      "surprises": [{
        "observation": "Unique hero section with concave bottom transition",
        "category": "transition",
        "confidence": 0.9,
        "css_hint": "::after border-radius: 50%",
        "reusability": "universal"
      }]
    }
  }'
# Erwartete Antwort: { vision: { added: 1, incremented: 0 }, total_added: 1 }
```

---

## END-TO-END TEST — Alle Module zusammen

Führe nach Abschluss aller Module diese Tests aus:

```bash
# 1. TypeScript — keine Fehler
npx tsc --noEmit

# 2. Build — sauber
npm run build

# 3. Dev-Server starten
npm run dev

# 4. Manifest generieren
curl -X POST http://localhost:3000/api/v2/manifest \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Mustermann GmbH",
    "style_paradigm": "bold-expressive",
    "industry": "saas-tech",
    "adjectives": ["modern", "vertrauenswürdig"],
    "tone": "professional",
    "primary_cta": "Kostenlos testen",
    "personas": ["Marketing Manager"],
    "pain_points": ["zu aufwendig", "kein System"],
    "animation_budget": "rich",
    "navbar_style": "sticky-blur",
    "navbar_mobile": "hamburger-dropdown"
  }'
# ✓ Gibt vollständiges manifest JSON zurück
# ✓ design_tokens.colors enthält alle Felder als Hex
# ✓ pass1_prompt_rules.rules hat 12 Einträge

# 5. Section generieren (SSE)
curl -N -X POST http://localhost:3000/api/v2/generate \
  -H "Content-Type: application/json" \
  -d '{"manifest": <MANIFEST_AUS_SCHRITT_4>, "section_type": "hero"}'
# ✓ SSE Events: status(pass1) → pass1{html} → status(pass2) → pass2{html} → status(pass3) → complete
# ✓ complete.validation_score >= 80
# ✓ complete.html enthält overflow-hidden, isolate, grid-cols-1
# ✓ complete.html enthält var(--color-primary) oder var(--color-accent)

# 6. Briefing Wizard
# /briefing aufrufen → 4 Schritte durchlaufen → Submit
# ✓ Redirect zu /builder
# ✓ Manifest im Zustand-Store gesetzt
# ✓ Neue Section im Builder nutzt /api/v2/generate

# 7. Scraping
curl -X POST http://localhost:3000/api/v2/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://vercel.com"}'
# ✓ Antwort in < 45s
# ✓ fingerprint.paradigm_detected gesetzt
# ✓ fingerprint.surprises Array vorhanden

# 8. Discovery
curl http://localhost:3000/api/v2/discovery
# ✓ Nach Scraping: queue enthält Einträge
# /discovery aufrufen
# ✓ Dashboard zeigt Kandidaten
```

---

## BEKANNTE FALLSTRICKE — EXAKTE LÖSUNGEN

**Problem:** `cleanHtml()` in `src/lib/ai.ts` löscht Tailwind arbitrary values wie `text-[5rem]`  
**Lösung:** `cleanHtml()` nur auf v1-Outputs anwenden. v2 nutzt CSS Custom Properties — keine arbitrary values nötig.

**Problem:** o4-mini akzeptiert kein `temperature` Parameter  
**Lösung:** Im OpenAIProvider: `isO = model.startsWith('o4') || model.startsWith('o3')` → dann `max_completion_tokens` statt `max_tokens`, kein temperature.

**Problem:** SSE-Stream endet vor Complete-Event  
**Lösung:** `writer.close()` muss im `finally`-Block stehen, nicht nach dem try.

**Problem:** `require()` in Next.js für JSON-Dateien gibt TypeScript-Fehler  
**Lösung:** `// eslint-disable-next-line @typescript-eslint/no-require-imports` direkt über der Zeile.

**Problem:** Puppeteer schlägt auf Production-Server fehl  
**Lösung:** `puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })` — immer beide Flags.

**Problem:** `response_format: { type: 'json_object' }` gibt leeren String zurück  
**Lösung:** System-Prompt muss explizit enthalten: `"Respond ONLY with valid JSON"`. Ohne diese Anweisung funktioniert json_object-Mode nicht zuverlässig.

**Problem:** Style Dictionary `require()` findet Datei nicht  
**Lösung:** Pfad ist relativ zum `process.cwd()`, nicht zur Datei. Immer `path.join(process.cwd(), 'src/data/...')` verwenden.

**Problem:** Manifest-Generierung gibt kein valides JSON zurück  
**Lösung:** `safeParseJson()` in `autoFix.ts` bereinigt Markdown-Fences. Immer durch diese Funktion parsen.

---

## DATEI-CHECKLISTE — VOLLSTÄNDIG

```
NEU ERSTELLEN (29 Dateien):
□ src/lib/types/manifest.ts
□ src/lib/types/pattern.ts
□ src/lib/types/styleDictionary.ts
□ src/lib/ai/types.ts
□ src/lib/ai/openaiProvider.ts
□ src/lib/ai/models.ts
□ src/lib/style/styleDictionary.ts
□ src/lib/sections/sectionLibrary.ts
□ src/lib/generation/autoFix.ts
□ src/lib/generation/prompts.ts             ← KRITISCH: alle LLM-Prompts
□ src/lib/generation/sectionGenerator.ts
□ src/lib/scraping/siteScraperService.ts
□ src/lib/discovery/discoveryQueue.ts
□ src/lib/discovery/anomalyDetector.ts
□ src/lib/patterns/patternLibrary.ts
□ src/app/api/v2/manifest/route.ts
□ src/app/api/v2/generate/route.ts
□ src/app/api/v2/scrape/route.ts
□ src/app/api/v2/discovery/route.ts
□ src/app/briefing/page.tsx
□ src/app/discovery/page.tsx
□ src/data/style-dictionaries/bold-expressive-v1.json
□ src/data/style-dictionaries/minimal-clean-v1.json
□ src/data/style-dictionaries/tech-dark-v1.json
□ src/data/style-dictionaries/luxury-editorial-v1.json
□ src/data/pattern-library/patterns.json    ← []
□ src/data/section-library/index.json       ← []
□ src/data/discovery/queue.json             ← []
□ src/data/discovery/trends.json            ← {}
□ src/data/discovery/baseline.json          ← { "sites_count": 0, "properties": {} }

BESTEHEND ÄNDERN (4 Dateien, minimal-invasiv):
□ src/lib/store.ts          → manifest: SiteManifest|null + setManifest + clearManifest
□ src/lib/assembler.ts      → assemblePageWithManifest() hinzufügen (alte Funktionen bleiben)
□ src/app/builder/page.tsx  → handleGenerate() → v2 wenn manifest vorhanden
□ src/app/scraper/page.tsx  → Fingerprint-Anzeige nach Scraping (optional, niedrige Priorität)

NICHT ANFASSEN (bestehende v1-Logik bleibt):
□ src/lib/ai.ts
□ src/app/api/generate/route.ts
□ src/app/api/export/route.ts
□ src/lib/examples.ts
□ src/components/builder/*
```

---

*viminds GmbH · Tim Ratig · Windsurf-Implementierung März 2026*
