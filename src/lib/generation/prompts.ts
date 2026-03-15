import { SiteManifest } from '../types/manifest'
import { StyleDictionary } from '../types/styleDictionary'

// ═══════════════════════════════════════════════════════
// MANIFEST GENERATION PROMPT
// ═══════════════════════════════════════════════════════

export const MANIFEST_SYSTEM = `You are a design system architect. Generate a complete Site Manifest as JSON.
RULES:
- Respond with ONLY valid JSON. No text, no markdown, no explanation.
- All colors as exact hex values (#RRGGBB).
- All Tailwind classes as exact strings ("text-4xl md:text-5xl").
- All font names in CSS format ("'Inter', sans-serif").`

interface SelectedPattern {
  id: string; name: string; description: string; type: string
  preview_description?: string
  implementation?: { css_snippet?: string; html_snippet?: string }
}

export function buildManifestPrompt(input: {
  company_name: string
  industry: string
  adjectives: string[]
  tone: string
  primary_cta: string
  personas: string[]
  pain_points: string[]
  style_paradigm: string
  animation_budget: string
  navbar_style: string
  navbar_mobile: string
  brand_colors?: Record<string, string>
  selected_patterns?: SelectedPattern[]
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
${input.selected_patterns?.length ? `
SELECTED DESIGN PATTERNS (apply these to the manifest's pass1_prompt_rules and style tokens):
${input.selected_patterns.map((p, i) => `${i + 1}. [${p.type}] ${p.name}: ${p.description}${p.preview_description ? ` — ${p.preview_description}` : ''}${p.implementation?.css_snippet ? `\nCSS: ${p.implementation.css_snippet.slice(0, 300)}` : ''}`).join('\n')}
These patterns MUST be reflected in pass1_prompt_rules.rules and any relevant design_tokens.` : ''}

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
  "style_source": { "type": "ai-generated" },
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
  "section_stacking_rules": {},
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
    "style='' contains grid/flex/column/height — layout in inline style",
    "grid-cols-X without preceding grid-cols-1 — no mobile-first grid",
    "min-h-screen without md: prefix — full height on mobile too",
    "order-1 on element containing h1/h2/form — primary content reordered",
    "button or a without py-3+ — touch target too small",
    "@keyframes outside prefers-reduced-motion guard — unprotected animation",
    "img without alt attribute — missing alt text",
    "icon-only button without aria-label — missing ARIA"
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
// PASS 1 — STRUCTURE PROMPT
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
  --color-primary: ${tokens.colors.primary};
  --color-secondary: ${tokens.colors.secondary};
  --color-accent: ${tokens.colors.accent};
  --color-highlight: ${tokens.colors.highlight};
  --color-background: ${tokens.colors.background};
  --color-surface: ${tokens.colors.surface};
  --color-dark: ${tokens.colors.dark};
  --color-text: ${tokens.colors.text};
  --color-text-muted: ${tokens.colors.text_muted};
  --font-heading: ${tokens.typography.font_heading};
  --font-body: ${tokens.typography.font_body};
}

TYPE SCALE (use ONLY these classes for text sizing):
hero_h1: ${tokens.type_scale.hero_h1}
section_h2: ${tokens.type_scale.section_h2}
card_h3: ${tokens.type_scale.card_h3}
eyebrow: ${tokens.type_scale.eyebrow}
cta_button: ${tokens.type_scale.cta_button}

SPACING:
section_padding_light: ${tokens.spacing.section_padding_light}
section_padding_heavy: ${tokens.spacing.section_padding_heavy}
container: ${tokens.spacing.container_max} ${tokens.spacing.container_padding}

RESPONSIVE RULES (non-negotiable):
${manifest.pass1_prompt_rules.rules.map((r, i) => `${i + 1}. ${r}`).join('\n')}

SITE CONTEXT:
Company: ${manifest.content.company_name}
Industry: ${manifest.site.industry}
Tone: ${manifest.site.tone}
Adjectives: ${manifest.site.adjectives.join(', ')}${manifest.selected_patterns?.length ? `

SELECTED DESIGN PATTERNS (apply these to every section — non-negotiable):
${manifest.selected_patterns.map((p, i) => `${i + 1}. [${p.type}] ${p.name}: ${p.description}${p.preview_description ? ` — ${p.preview_description}` : ''}${p.implementation?.css_snippet ? `\n   CSS: ${p.implementation.css_snippet.slice(0, 200)}` : ''}${p.implementation?.placeholder ? `\n   Placeholder: ${p.implementation.placeholder}` : ''}`).join('\n')}
These patterns define the visual identity of this site. Every section MUST incorporate the applicable patterns from this list.` : ''}`
}

export function buildPass1User(
  sectionType: string,
  manifest: SiteManifest,
  referenceHtml?: string | null
): string {
  const content = manifest.content
  return `Create a "${sectionType}" section for:
Company: ${content.company_name}
USP: ${content.company_usp}
Primary CTA: ${content.primary_cta}
Pain Points: ${content.pain_points.join(', ')}
Trust Signals: ${content.trust_signals.join(', ')}
Tone: ${manifest.site.tone}
${referenceHtml ? `\nREFERENCE SECTION (use as structural inspiration, not copy-paste):\n${referenceHtml.slice(0, 2000)}` : ''}`
}

// ═══════════════════════════════════════════════════════
// PASS 2 — VISUAL LAYER PROMPT
// ═══════════════════════════════════════════════════════

export function buildPass2System(dict: StyleDictionary): string {
  return `You are a Visual-Developer enriching HTML sections with the visual layer.
You receive finished HTML and resolve placeholder comments into concrete implementations.

OUTPUT FORMAT: Respond with ONLY raw HTML. No markdown, no code fences, no explanation.

STYLE DICTIONARY — Animation budget: ${dict.rules.animation.budget}
Allowed text animations: ${JSON.stringify(dict.rules.animation.text_animations_allowed ?? [])}
Allowed hover effects: ${JSON.stringify(dict.rules.animation.hover_effects_allowed ?? [])}
Decoration allowed: ${JSON.stringify(dict.rules.decoration)}

INSTRUCTIONS:
1. Replace <!-- [ANIM: word-cycle | words: [...]] --> with a working JS word-cycle implementation
2. Replace <!-- [BG: geometric-shapes | opacity: X] --> with inline SVG background shapes
3. Add @keyframes inside a <style> block at the top of the section
4. Wrap ALL @keyframes in: @media (prefers-reduced-motion: no-preference) { ... }
5. Do NOT change structure, copy, or layout — only add visual layer
6. Keep all CSS Custom Properties (var(--color-*)) intact
7. All scripts must be IIFE: (function() { ... })()`
}

export function buildPass2User(pass1Html: string): string {
  return `Enrich this section with the visual layer. Resolve all placeholder comments:

${pass1Html}`
}

// ═══════════════════════════════════════════════════════
// PASS 3 — VALIDATOR PROMPT
// ═══════════════════════════════════════════════════════

export const PASS3_SYSTEM = `You are an HTML/CSS validator. Respond ONLY with valid JSON. No text, no markdown.`

export function buildPass3User(html: string, autoFlags: string[]): string {
  return `Validate this HTML section against the checklist. Respond with ONLY JSON.

HTML:
${html}

AUTO-FLAG RULES (check each):
${autoFlags.map((f, i) => `${i + 1}. ${f}`).join('\n')}

ADDITIONAL CHECKS:
- aria-label on all icon-only buttons?
- alt attribute on all img elements?
- @keyframes inside prefers-reduced-motion guard?
- IIFE wrapper on all inline scripts?
- CSS Custom Properties used correctly (var(--...) syntax)?

Respond with exactly this JSON structure:
{
  "valid": boolean,
  "score": number between 0 and 100,
  "errors": [
    {
      "type": "string identifier",
      "message": "human readable description",
      "severity": "error" or "warning",
      "auto_fixable": boolean
    }
  ]
}`
}
