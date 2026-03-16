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
      "sections": ["navbar", "hero", "pain-points", "services", "process", "cta", "footer"],
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
  const { layout, typography, color, decoration } = dict.rules
  const hp = dict.html_patterns

  // Build the concrete HTML patterns block from the style dictionary
  const patternsBlock = Object.entries(hp)
    .map(([key, val]) => `${key}:\n  ${val}`)
    .join('\n')

  return `You are an expert frontend developer. Generate a single HTML section — structure and content only.
NO @keyframes, NO animations, NO transition-* in Pass 1. That is Pass 2's job.

OUTPUT: Raw HTML only. Start with < end with >. Zero markdown, zero code fences, zero explanation.

══════════════════════════════════
DESIGN SYSTEM: ${dict.paradigm.toUpperCase()}
══════════════════════════════════
Use EXACTLY these HTML patterns from the design system — not alternatives:
${patternsBlock}

LAYOUT RULES (non-negotiable):
- Outer <section> = full-width background + vertical padding (${layout.section_padding})
- Inner container = max-width centering: ${layout.max_width} with px-5 md:px-8
- ALL content lives inside the container div — never directly in <section>
- Max columns: ${layout.columns_max} — grids always start grid-cols-1 then md:grid-cols-X
- Overlaps allowed: ${layout.overlaps_allowed} | Full bleed: ${layout.full_bleed_allowed} | Negative margins: ${layout.negative_margin_allowed}

TYPOGRAPHY RULES:
- Heading size hero: ${typography.heading_size_hero}
- Heading size section: ${typography.heading_size_section}
- Tracking: ${typography.tracking}
- Gradient text: ${typography.gradient_text_allowed ? 'ALLOWED — use bg-gradient-to-r bg-clip-text text-transparent' : 'NOT ALLOWED'}

COLOR SYSTEM (${color.base} base):
- Dark sections: ${color.dark_sections_allowed ? 'ALLOWED' : 'NOT ALLOWED'}
- Gradients: ${color.gradient_allowed ? 'ALLOWED' : 'NOT ALLOWED'}

DECORATION:
- Glassmorphism: ${decoration.glassmorphism} | Mesh gradient: ${decoration.mesh_gradient}
- Border glow: ${decoration.border_glow} | Geometric shapes: ${decoration.geometric_shapes}
- Diagonal cuts: ${decoration.diagonal_cuts ?? false} | Concave sections: ${decoration.concave_sections ?? false}
→ Use <!-- [BG: geometric-shapes | opacity: 0.08] --> as placeholder (resolved in Pass 2)

FORBIDDEN (never use): ${dict.forbidden_patterns.join(' | ')}
REQUIRED (always include): ${dict.required_patterns.join(' | ')}

══════════════════════════════════
CSS CUSTOM PROPERTIES
══════════════════════════════════
These vars are defined globally in <head> — do NOT redefine :root in section HTML.
Always use var() — NEVER hardcode hex values.

BACKGROUND TOKENS:
  style="background-color: var(--color-background)"  → default page bg (${tokens.colors.background})
  style="background-color: var(--color-surface)"     → alternating/card bg (${tokens.colors.surface})
  style="background-color: var(--color-dark)"        → dark hero/CTA sections (${tokens.colors.dark})
  style="background-color: var(--color-primary)"     → strong CTA/accent sections (${tokens.colors.primary})

TEXT TOKENS:
  style="color: var(--color-text)"        → headings + body on light bg
  style="color: var(--color-text-muted)"  → subtitles, captions, nav links
  style="color: white" or color:#fff      → text on dark/primary backgrounds

ACCENT TOKENS:
  style="background-color: var(--color-primary)"   → primary buttons, main CTA
  style="background-color: var(--color-accent)"    → secondary CTAs, hover fills
  style="color: var(--color-accent)"               → inline links, icon color, emphasis
  style="color: var(--color-highlight)"            → highlighted words in headings
  style="background-color: var(--color-secondary)" → feature icons bg, tag badges

FONT TOKENS (set on <body> globally, apply to override headings):
  style="font-family: var(--font-heading)"  → explicit heading override if needed
  style="font-family: var(--font-body)"     → body text (already inherited)

TYPE SCALE (use these Tailwind classes for text sizing):
  Hero H1:    ${tokens.type_scale.hero_h1}
  Section H2: ${tokens.type_scale.section_h2}
  Card H3:    ${tokens.type_scale.card_h3}
  Eyebrow:    ${tokens.type_scale.eyebrow}
  CTA button: ${tokens.type_scale.cta_button}

SPACING:
  Section light: ${tokens.spacing.section_padding_light}
  Section heavy: ${tokens.spacing.section_padding_heavy}
  Container: ${tokens.spacing.container_max} ${tokens.spacing.container_padding}

══════════════════════════════════
RESPONSIVE (non-negotiable)
══════════════════════════════════
${manifest.pass1_prompt_rules.rules.map((r, i) => `${i + 1}. ${r}`).join('\n')}

SITE:
Company: ${manifest.content.company_name} | Industry: ${manifest.site.industry}
Tone: ${manifest.site.tone} | Adjectives: ${manifest.site.adjectives.join(', ')}${manifest.selected_patterns?.length ? `

DESIGN PATTERNS (mandatory — apply to every section):
${manifest.selected_patterns.map((p, i) => `${i + 1}. [${p.type}] ${p.name}: ${p.description}${p.preview_description ? ` — ${p.preview_description}` : ''}${p.implementation?.css_snippet ? `\n   CSS: ${p.implementation.css_snippet.slice(0, 200)}` : ''}${p.implementation?.placeholder ? `\n   Placeholder: ${p.implementation.placeholder}` : ''}`).join('\n')}` : ''}`
}

export function buildPass1User(
  sectionType: string,
  manifest: SiteManifest,
  referenceHtml?: string | null
): string {
  const content = manifest.content
  const nav = manifest.navbar

  if (sectionType === 'navbar') {
    return `Create a responsive navbar for:
Company: ${content.company_name}
Style: ${nav.style}
Height: ${nav.height}
Desktop layout: ${nav.layout_desktop}
Nav links: ${nav.links.join(', ')}
CTA button: ${nav.cta_button ? `Yes — label: "${nav.cta_label}"` : 'No'}
Mobile menu: ${nav.mobile_menu}
Tone: ${manifest.site.tone}

NAVBAR OUTPUT RULES (non-negotiable):
- Outermost element MUST be <nav> — NOT <section>
- Apply to <nav>: class="${nav.height} w-full flex items-center justify-between px-5 md:px-8"
${nav.style === 'sticky-blur' ? '- Add to <nav>: class "sticky top-0 z-50 backdrop-blur-md" + style="background-color: color-mix(in srgb, var(--color-background) 85%, transparent)"' : ''}
${nav.style === 'transparent-hero' ? '- Add to <nav>: class "absolute top-0 left-0 right-0 z-50" with transparent background' : ''}
- Logo: <a href="#"> with company name as styled text (font-bold, font-family: var(--font-heading))
- Desktop links: <ul class="hidden md:flex items-center gap-6"> — text-sm, color: var(--color-text-muted)
- CTA button: hidden on mobile (hidden md:flex), background: var(--color-primary), text white, rounded, px-4 py-2
- Hamburger icon: visible only mobile (md:hidden), opens a mobile overlay menu below
- Mobile menu: full-width dropdown below nav, hidden by default, toggled via JS onclick
- ALL colors via var(--color-*) — no hardcoded hex values`
  }

  if (sectionType === 'footer') {
    return `Create a footer for:
Company: ${content.company_name}
Nav links: ${nav.links.join(', ')}
Primary CTA: ${content.primary_cta}
Trust Signals: ${content.trust_signals.join(', ')}
Tone: ${manifest.site.tone}

FOOTER OUTPUT RULES (non-negotiable):
- Outermost element MUST be <footer> — NOT <section>
- Dark background: style="background-color: var(--color-dark)"
- Inner container: max-w-7xl mx-auto px-5 md:px-8 py-12 md:py-16
- Include: company name (bold, var(--font-heading)), nav links row, copyright line
- Optional: short tagline below company name
- ALL colors via var(--color-*) — no hardcoded hex values`
  }

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
  return `Validate this HTML section. Respond with ONLY valid JSON — no markdown, no text.

HTML:
${html}

CHECKLIST:

STRUCTURE (critical):
- For navbar: outermost element must be <nav>, NOT <section> — if it is <nav>, structure is valid
- For footer: outermost element must be <footer>, NOT <section> — if it is <footer>, structure is valid
- For all other sections: outermost element must be <section>
- Is there an inner container div with max-w-* mx-auto classes? (not required for navbar)
- Is ALL content inside that container? (not required for navbar)
- Does the outermost element have appropriate padding? (py-* for sections, px-* height class for navbar)

AUTO-FLAG RULES:
${autoFlags.map((f, i) => `${i + 1}. ${f}`).join('\n')}

ACCESSIBILITY:
- aria-label on all icon-only buttons?
- alt attribute on all img elements?

CODE QUALITY:
- @keyframes inside prefers-reduced-motion guard?
- IIFE wrapper on all inline scripts?
- var(--color-*) used for colors — no hardcoded hex?
- No :root {} block defined inside the section HTML?

Respond with exactly this JSON:
{
  "valid": boolean,
  "score": number,
  "errors": [
    { "type": "string", "message": "description", "severity": "error" | "warning", "auto_fixable": boolean }
  ]
}`
}
