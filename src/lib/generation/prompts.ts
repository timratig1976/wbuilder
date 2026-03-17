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
- All font names in CSS format ("'Inter', sans-serif").

COLOR PALETTE REQUIREMENTS (critical — do NOT generate washed-out palettes):
- "background": light but NOT white — warm off-white, light stone, light sand (e.g. #f7f4ef, #f2ede6, #faf9f7)
- "surface": slightly darker than background for card/section contrast (e.g. #ede8e0, #e8e2d9, #f0ebe3)
- "dark": a RICH dark color for hero/footer sections — deep navy, charcoal, dark slate, deep brown, NOT #333 (e.g. #1a1a2e, #1c2333, #1e1b18, #0f1923, #1a1208)
- "primary": a STRONG, saturated brand color — gold, amber, navy, teal, rust, NOT a pastel (e.g. #c8973a, #1e4d8c, #2a7a6a, #b85c2a, #8b1f3f)
- "secondary": a complementary mid-tone (e.g. #2c4a7c, #5a3e28, #1a5c4a)
- "accent": vibrant highlight for links/icons (similar family to primary but lighter/brighter)
- "highlight": bright warm tone for emphasized words in headings (e.g. #e8b84b, #f0c060, #d4943c)
- "text": DARK readable text — near-black (e.g. #1a1612, #0f0d0a, #1c1917, #111827)
- "text_muted": medium gray — NOT too light (e.g. #6b6560, #7a7068, #64748b)

CONTRAST RULE: text on background MUST have contrast ratio ≥ 7:1. Never generate text lighter than #555.
DEPTH RULE: dark must be visually MUCH darker than background. Minimum perceived difference of 60% lightness.`

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
  // design_spec on the manifest takes precedence over raw dictionary patterns
  // — it is the per-project override layer
  const ds = manifest.design_spec
  const hp: Record<string, string> = {
    ...dict.html_patterns,
    // Override CTA patterns from design_spec if present
    ...(ds?.cta.primary   ? { cta_primary:   ds.cta.primary }   : {}),
    ...(ds?.cta.secondary ? { cta_secondary: ds.cta.secondary } : {}),
    ...(ds?.cta.ghost     ? { cta_ghost:     ds.cta.ghost }     : {}),
    // Override card patterns from design_spec if present
    ...(ds?.card.base_classes       ? { card:               `<div class="${ds.card.base_classes}">` } : {}),
    ...(ds?.card.hover_classes      ? { card_hover:          ds.card.hover_classes }                  : {}),
    ...(ds?.card.transition_classes ? { card_hover_classes:  ds.card.transition_classes }             : {}),
    ...(ds?.card.wrapper_classes    ? { card_wrapper:        `<div class="${ds.card.wrapper_classes}">` } : {}),
  }

  // Effective animation settings — design_spec overrides dictionary
  const effectiveBgMode     = ds?.animation.bg_mode              ?? color.bg_animation_mode  ?? 'none'
  const effectiveBgSequence = ds?.animation.section_bg_sequence  ?? color.section_bg_sequence ?? ['background', 'surface']

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

SECTION BACKGROUND RULES (critical — prevents every section looking the same):
- Background sequence pattern: ${effectiveBgSequence.join(' → ')} (cycle through these tokens in order)
  - "background" → style="background-color: var(--color-background)"
  - "surface"     → style="background-color: var(--color-surface)"
  - "dark"        → style="background-color: var(--color-dark)"
  - "primary"     → style="background-color: var(--color-primary)"
- NEVER use the same background token for two adjacent sections
- Hero is ALWAYS "dark" background regardless of sequence
- Navbar and footer are EXCLUDED from the sequence (they manage their own bg)

BACKGROUND ANIMATION MODE: ${effectiveBgMode}
${effectiveBgMode === 'page-level'
  ? `- Page-level mode: SVG/geometric background animations belong ONLY in the hero section
- All other sections use FLAT solid background colors — NO SVG shapes, NO animated bg, NO mesh gradients
- This prevents the cut-off stacking look when sections are viewed together`
  : effectiveBgMode === 'per-section'
  ? `- Per-section mode: Each dark section MAY have its own subtle background decoration
- Keep decorations SMALL (max 20% of section area) and low opacity (≤ 0.08) so they don't dominate
- Use <!-- [BG: geometric-shapes | opacity: 0.06] --> placeholder — resolved in Pass 2`
  : `- No background animations — solid flat colors only`}

DECORATION:
- Glassmorphism: ${decoration.glassmorphism} | Mesh gradient: ${decoration.mesh_gradient}
- Border glow: ${decoration.border_glow} | Geometric shapes: ${decoration.geometric_shapes}
- Diagonal cuts: ${decoration.diagonal_cuts ?? false} | Concave sections: ${decoration.concave_sections ?? false}
→ Use <!-- [BG: geometric-shapes | opacity: 0.08] --> as placeholder (resolved in Pass 2)

CTA BUTTON SYSTEM (non-negotiable — use ONLY these three variants, nothing else):
PRIMARY CTA   → ${hp.cta_primary ?? `<a href="#" class="inline-flex items-center gap-2 px-7 py-4 text-sm font-semibold rounded-sm transition-all duration-200 hover:-translate-y-0.5" style="background-color:var(--color-accent);color:#fff">`}
SECONDARY CTA → ${hp.cta_secondary ?? `<a href="#" class="inline-flex items-center gap-2 px-7 py-4 text-sm font-semibold rounded-sm border transition-all duration-200" style="border-color:var(--color-accent);color:var(--color-accent)">`}
GHOST CTA     → ${hp.cta_ghost ?? `<a href="#" class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors" style="color:var(--color-text-muted)">`}

CTA USAGE RULES:
- Use PRIMARY CTA for the single most important action on this section only
- Use SECONDARY CTA for supporting actions (e.g. "Learn more", "See pricing")
- Use GHOST CTA for tertiary links only (e.g. "Already a customer? Sign in")
- NEVER mix CTA styles arbitrarily — every button on the page must match one of the three above
- NEVER add extra border, box-shadow, shimmer, ring, glow, or gradient to a CTA unless the section is the HERO — in hero only, PRIMARY CTA may add hover shadow: hover:shadow-xl hover:shadow-accent/30
- NEVER hardcode colors on buttons — always var(--color-accent) or var(--color-primary) via style=""
- ALL buttons minimum h-11 (py-3 minimum) for touch targets

CARD HOVER SYSTEM (non-negotiable — every hoverable card must use this exact pattern):
Card base      → ${hp.card ?? `<div class="bg-white border border-gray-100 rounded-sm p-6">`}
Card wrapper   → ${hp.card_wrapper ?? `<div class="group cursor-pointer">`}
Hover classes  → add these to the card element: ${(hp.card_hover_classes ?? 'transition-all duration-200 ease-out')} ${hp.card_hover ?? 'group-hover:-translate-y-1 group-hover:shadow-md'}

CARD HOVER RULES:
- ALL cards that are clickable/interactive MUST use the group/group-hover Tailwind pattern above
- The card_wrapper div gets class="group cursor-pointer", the inner card div gets the hover classes
- NEVER use onmouseover JS for hover effects — CSS group-hover only
- NEVER mix different hover effects on cards in the same section — pick one consistent style
- Non-interactive cards (purely decorative) should NOT have hover effects
- The hover transition classes (${hp.card_hover_classes ?? 'transition-all duration-200 ease-out'}) MUST always be present on the card element alongside the group-hover classes
- Pattern to follow exactly:
  <div class="group cursor-pointer">
    <div class="${(hp.card ?? '').replace('<div class="', '').replace('">', '')} ${hp.card_hover_classes ?? 'transition-all duration-200 ease-out'} ${hp.card_hover ?? 'group-hover:-translate-y-1 group-hover:shadow-md'}">
      <!-- card content -->
    </div>
  </div>

FORBIDDEN (never use): ${dict.forbidden_patterns.join(' | ')}
REQUIRED (always include): ${dict.required_patterns.join(' | ')}

IMAGE RULES (non-negotiable):
- NEVER use local image paths like /images/*, /kunden/*, /photos/*, /assets/*.jpg, *.png
- NEVER reference images that don't exist on the server
- For real photos: use https://picsum.photos/800/600?random=1 (change random= number for each image)
- For team/person avatars: use https://i.pravatar.cc/150?img=1 (change img= 1-70)
- For logos/icons: use inline SVG or Tailwind icon placeholders — never <img> for logos
- ALWAYS add meaningful alt attributes to every <img>

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

export interface SectionPositionContext {
  position: number          // 0-based index in page section list
  total: number             // total sections on page
  prevBg?: string           // bg token used by section above (e.g. 'dark', 'surface')
  nextBg?: string           // bg token used by section below
}

export function buildPass1User(
  sectionType: string,
  manifest: SiteManifest,
  referenceHtml?: string | null,
  posCtx?: SectionPositionContext
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
${nav.style === 'sticky-blur'
  ? '- STICKY BLUR: add classes "sticky top-0 z-50 backdrop-blur-md" and style="background-color: color-mix(in srgb, var(--color-background) 85%, transparent)" to <nav>'
  : nav.style === 'transparent-hero'
  ? '- TRANSPARENT HERO: add classes "absolute top-0 left-0 right-0 z-50" to <nav>, no background color (transparent)'
  : nav.style === 'hidden-scroll'
  ? '- HIDDEN SCROLL: add classes "sticky top-0 z-50" to <nav>, style="background-color: var(--color-background)" — JS will hide on scroll-down, show on scroll-up'
  : '- DEFAULT STICKY: add classes "sticky top-0 z-50" and style="background-color: var(--color-background); border-bottom: 1px solid rgba(0,0,0,0.08)" to <nav>'}
- Logo: <a href="#"> with company name as styled text (font-bold, font-family: var(--font-heading))
- Desktop links: <ul class="hidden md:flex items-center gap-6"> — text-sm, color: var(--color-text-muted)
- CTA button: hidden on mobile (hidden md:flex), background: var(--color-primary), text white, rounded, px-4 py-2
- Hamburger icon: visible only mobile (md:hidden), opens a mobile overlay menu below
- Mobile menu: full-width dropdown below nav, hidden by default, toggled via JS onclick
- Mobile menu toggle JS MUST use null-safe pattern: const m = document.getElementById('...'); if (m) m.classList.toggle('hidden');
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

  const posBlock = posCtx ? `
PAGE POSITION (critical for background choice):
- This is section ${posCtx.position + 1} of ${posCtx.total} on the page
${posCtx.prevBg ? `- Section above uses background token: ${posCtx.prevBg} — MUST use a DIFFERENT token` : '- This is the first content section'}
${posCtx.nextBg ? `- Section below uses background token: ${posCtx.nextBg} — MUST use a DIFFERENT token` : ''}
- Pick the correct token from the bg_sequence so adjacent sections never share the same background` : ''

  return `Create a "${sectionType}" section for:
Company: ${content.company_name}
USP: ${content.company_usp}
Primary CTA: ${content.primary_cta}
Pain Points: ${content.pain_points.join(', ')}
Trust Signals: ${content.trust_signals.join(', ')}
Tone: ${manifest.site.tone}
${posBlock}
IMAGE RULES (non-negotiable):
- NEVER use local paths (/kunden/, /images/, /photos/, /assets/) — they don't exist
- For photos: https://picsum.photos/800/600?random=N (use different N=1,2,3… per image)
- For avatars/team: https://i.pravatar.cc/150?img=N (N=1–70)
- Always add descriptive alt text to every <img>
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

// ═══════════════════════════════════════════════════════
// PAGE COHERENCE PASS — runs once after all sections done
// Sees the full assembled page, fixes cross-section issues
// ═══════════════════════════════════════════════════════

export const COHERENCE_SYSTEM = `You are a page-level HTML coherence editor.
You receive a full assembled page (all sections stacked) and fix cross-section problems.
OUTPUT: Return the full corrected HTML. Raw HTML only — no markdown, no explanation, no code fences.`

export function buildCoherenceUser(
  fullPageHtml: string,
  bgSequence: string[],
  bgAnimationMode: string
): string {
  return `Fix cross-section coherence issues in this assembled page.

BACKGROUND SEQUENCE RULE: sections must cycle through: ${bgSequence.join(' → ')}
  - "background" = var(--color-background)
  - "surface"    = var(--color-surface)
  - "dark"       = var(--color-dark)
  - "primary"    = var(--color-primary)
  NEVER two adjacent sections with the same background.

ANIMATION MODE: ${bgAnimationMode}
${bgAnimationMode === 'page-level'
  ? `- Remove ALL SVG backgrounds, mesh gradients, geometric shape decorations from every section EXCEPT the first hero section.
- Hero keeps its background decoration. All other sections: flat solid color only.`
  : bgAnimationMode === 'per-section'
  ? `- Each dark section may keep ONE small background decoration (opacity ≤ 0.08, max 20% of section area).
- Remove duplicate/redundant decorations if multiple sections have the same pattern.`
  : `- Remove ALL SVG/animated backgrounds from every section. Flat solid colors only.`}

FIXES TO APPLY:
1. Background alternation — correct any adjacent sections sharing the same background token
2. Background decorations — enforce the animation mode rules above
3. CTA consistency — ensure only ONE section has the primary CTA button, others use secondary
4. Decoration stacking — remove any background SVG/shapes that bleed or visually stack
5. Do NOT change any text content, layout, or component structure

PAGE HTML:
${fullPageHtml.slice(0, 12000)}`
}

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
