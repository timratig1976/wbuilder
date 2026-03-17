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
  visual_tone?: string
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
Visual Tone: ${input.visual_tone ?? 'confident'}
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
  "visual_tone": "${input.visual_tone ?? 'confident'}",
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

export function buildPass1System(dict: StyleDictionary, manifest: SiteManifest, sectionType?: string): string {
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
  const effectiveBgMode          = ds?.animation.bg_mode              ?? color.bg_animation_mode          ?? 'none'
  const effectiveBgSequence      = ds?.animation.section_bg_sequence  ?? color.section_bg_sequence       ?? ['background', 'surface']
  const effectiveFocusSections   = color.bg_animation_focus_sections ?? ['hero']

  // Build the concrete HTML patterns block from the style dictionary
  const patternsBlock = Object.entries(hp)
    .map(([key, val]) => `${key}:\n  ${val}`)
    .join('\n')

  // Lazy variant injection — only inject variants relevant to this sectionType
  // Keeps token budget small: each section only sees its relevant variant options
  const variantsBlock = (() => {
    if (!dict.variants || !sectionType) return ''
    const sectionKeywords = sectionType.toLowerCase().replace(/-/g, ' ').split(/\s+/)
    const lines: string[] = []
    for (const [slot, variants] of Object.entries(dict.variants)) {
      if (!variants?.length) continue
      // Filter: include variant if any of its tags overlap with section keywords
      const relevant = variants.filter((v) =>
        v.tags.some((tag) =>
          sectionKeywords.some((kw) => tag.toLowerCase().includes(kw) || kw.includes(tag.toLowerCase()))
        )
      ).slice(0, 5) // max 5 variants per slot to stay within token budget
      if (!relevant.length) continue
      lines.push(`\n${slot} VARIANTS — pick the best fit for this section type:`)
      relevant.forEach((v) => {
        lines.push(`  [${v.name}] ${v.description}`)
        lines.push(`    ${v.html}`)
      })
    }
    return lines.length ? `\n\n── PATTERN VARIANTS ──${lines.join('\n')}\nUse the variant that best matches the section context. If none match, use the default pattern above.` : ''
  })()

  // Visual tone rules — orthogonal to paradigm, calibrate intensity
  const tone = manifest.visual_tone ?? 'confident'
  const visualToneBlock = {
    whisper: `
VISUAL TONE: WHISPER (subtle & quiet)
- Whitespace: GENEROUS — use py-24 md:py-32 for sections, wide gaps between elements
- Decoration: NONE — no geometric shapes, no mesh gradients, no border glows, no diagonal cuts
- Typography: use lighter font weights (font-normal or font-medium for body, font-semibold max for headings)
- Copy density: SHORT — max 1 short sentence per sub-item, prefer single-word labels
- Color usage: RESTRAINED — use background and surface tokens only, avoid dark sections except footer
- Cards: no hover translate effects — only subtle opacity change allowed
- CTAs: ghost or secondary style preferred, minimal padding`,

    editorial: `
VISUAL TONE: EDITORIAL (structured & formal)
- Whitespace: AMPLE — use py-20 md:py-28, clear vertical rhythm between elements
- Decoration: MINIMAL — serif-forward typography is the decoration; no mesh, no geometric shapes
- Typography: mix font weights deliberately — thin eyebrows, heavy headlines, regular body
- Copy density: MEDIUM — complete sentences, editorial phrasing, no bullet-point telegrams
- Color usage: CONTROLLED — max 2 section backgrounds per page, prefer surface over dark
- Cards: flat with thin border, no hover translate — only underline or color shift
- CTAs: secondary style preferred; primary only for the single most important action`,

    confident: `
VISUAL TONE: CONFIDENT (balanced & clear)
- Whitespace: BALANCED — standard section padding py-16 md:py-24, clear hierarchy
- Decoration: MODERATE — one decorative element per section max, keep opacity ≤ 0.08
- Typography: bold headings, regular body — standard weight contrast
- Copy density: MEDIUM — concise but complete, benefit-driven copy
- Color usage: STANDARD — follow bg_sequence, include 1-2 dark sections for contrast
- Cards: standard hover translate (-translate-y-1) with shadow
- CTAs: primary for hero CTA, secondary for supporting actions`,

    expressive: `
VISUAL TONE: EXPRESSIVE (bold & energetic)
- Whitespace: TIGHT — sections can be dense, overlapping elements encouraged if paradigm allows
- Decoration: RICH — use geometric shapes, gradient overlays, border glows freely
- Typography: heavy weights (font-bold, font-black), large tracking contrast, gradient text where allowed
- Copy density: SHORT & PUNCHY — headlines do the heavy lifting, body is minimal
- Color usage: HIGH CONTRAST — maximize dark sections, use primary/accent liberally in backgrounds
- Cards: strong hover effects (translate + shadow + border glow)
- CTAs: primary style everywhere, add hover shadow/glow in hero`,

    electric: `
VISUAL TONE: ELECTRIC (maximum energy)
- Whitespace: COMPRESSED — every pixel working, tight gaps, overlapping layers
- Decoration: MAXIMUM — mesh gradients, animated backgrounds, noise textures, geometric shapes all welcome
- Typography: EXTREME contrast — display font at max size, mix ultra-light and ultra-bold in same heading
- Copy density: ULTRA-SHORT — 2-3 word headlines, single-word CTAs, numbers > words
- Color usage: VIBRANT MAXIMUM — dark sections dominate, neon accents, gradient everywhere
- Cards: dramatic hover (large translate + glow + scale + shadow combination)
- CTAs: always primary with glow, shimmer, or gradient fill; never ghost`,
  }[tone] ?? ''

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
- Hero H1 size: ${typography.heading_size_hero}
- Section H2 size: ${typography.heading_size_section}
- Hero line-height: ${typography.line_height_hero ?? 'leading-tight'} — ALWAYS apply this to every H1 element
- Section line-height: ${typography.line_height_section ?? 'leading-snug'} — ALWAYS apply this to every H2/H3 element
- Tracking: ${typography.tracking}
- Gradient text: ${typography.gradient_text_allowed ? 'ALLOWED — use bg-gradient-to-r bg-clip-text text-transparent' : 'NOT ALLOWED'}

RESPONSIVE FONT SCALING (${typography.responsive_scale !== false ? 'ENABLED — required' : 'DISABLED'}):
${typography.responsive_scale !== false ? `- ALL headings MUST use responsive size classes — never a single fixed size
- Hero H1 pattern:  text-3xl sm:text-4xl md:text-5xl lg:${typography.heading_size_hero.replace(/^text-/, 'text-')} ${typography.line_height_hero ?? 'leading-tight'} ${typography.heading_weight ? `font-[${typography.heading_weight}]` : ''}
- Section H2 pattern: text-2xl sm:text-3xl md:${typography.heading_size_section} ${typography.line_height_section ?? 'leading-snug'}
- Sub-headings H3: text-xl sm:text-2xl leading-snug
- Body text: text-sm sm:text-base leading-relaxed
- NEVER use text-5xl or larger without a smaller mobile prefix (e.g. text-3xl sm:text-5xl)
- Line-height is CRITICAL on large headings — ${typography.line_height_hero ?? 'leading-tight'} prevents excessive gaps between wrapped lines` : `- Use fixed heading sizes as specified above`}

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
${effectiveBgMode === 'focus-sections'
  ? `- Focus-sections mode: animated BG decorations ONLY on these section types: ${effectiveFocusSections.join(', ')}
- All OTHER section types use FLAT solid background colors — NO SVG shapes, NO animated bg, NO mesh gradients
- For each focus section, use <!-- [BG: geometric-shapes | opacity: 0.06] --> placeholder — resolved in Pass 2
- This keeps animations intentional and prevents the stacked cut-off look`
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
${dict.paradigm === 'brutalist' ? `
══════════════════════════════════
BRUTALIST RULES (absolute — these override everything else)
══════════════════════════════════
BORDER-FIRST DESIGN — borders are your primary visual element, not shadows or colors:
- Every card, button, and section divider MUST have border-4 (minimum) with style="border-color: var(--color-text)"
- Section separator: add border-b-4 with style="border-color: var(--color-text)" to every <section>
- NO Tailwind shadow-* classes — NEVER. Shadows are CSS only: style="box-shadow: 6px 6px 0 var(--color-text)"

OFFSET SHADOW SYSTEM (the #1 brutalist signature):
- Cards: style="box-shadow: 6px 6px 0 var(--color-text)" on the card div (NOT wrapper)
- Buttons: style="box-shadow: 4px 4px 0 var(--color-text)" on the <a> element
- Hover state: add group-hover:translate-x-1 group-hover:translate-y-1 to the card — this makes the shadow appear to shrink (offset shift = brutalist click feel)
- Dark sections: use style="box-shadow: 6px 6px 0 var(--color-accent)" instead

TYPOGRAPHY — raw, loud, unapologetic:
- ALL headings MUST be uppercase (add class="... uppercase")
- Hero H1: font-size clamp(3rem, 12vw, 10rem), line-height 0.9, font-mono font-black uppercase
- Section H2: text-5xl md:text-7xl font-mono font-black uppercase
- Eyebrow label format: "// LABEL" or "[ LABEL ]" — not plain text
- Body copy: font-mono text-sm, stark contrast (black on white, white on black)
- ZERO gradient text, ZERO text shadows

LAYOUT — raw grid, no polish:
- NO rounded corners anywhere — NEVER use rounded-* except rounded-none
- Grid gaps exposed: use gap-px (1px gap showing bg color as "border") or gap-4 for breathing room
- Asymmetric layouts encouraged: one col-span-2 next to two col-span-1 tiles
- Full-width borders as section dividers — no decorative lines, no hr-style dividers

COLOR — maximum contrast, minimum palette:
- Background: white (#fff) or near-black only
- Accent: ONE aggressive flat color (var(--color-accent)) — used sparingly as punch
- ZERO gradients, ZERO glassmorphism, ZERO opacity overlays
- Dark sections: pure black bg + white text + accent for one element only

WHAT BRUTALISM IS NOT — avoid these generic patterns:
- NOT just "dark mode with thick borders" — the RAW EXPOSED structure is the aesthetic
- NOT bold-expressive with borders added — brutalism actively rejects decoration
- NOT neo-brutalism-lite — go all the way or it looks like a mistake` : ''}
${dict.paradigm === 'bento-grid' ? `
══════════════════════════════════
BENTO GRID RULES (absolute — these override all layout rules above)
══════════════════════════════════
CORE CONCEPT — The grid IS the design:
- Inspired by Japanese bento boxes and Apple's product spec pages
- The entire grid of tiles is viewed as ONE composed picture — not a list of cards
- Each tile serves exactly ONE purpose: one stat, one feature, one image, one CTA
- Depth comes from BACKGROUND COLOR CONTRAST between tiles — no shadows, no borders
- The viewer's eye flows across tiles of different sizes and colors — this IS the aesthetic

GRID STRUCTURE (non-negotiable):
- class="grid grid-cols-1 md:grid-cols-4 gap-3 auto-rows-[minmax(200px,auto)]"
- MUST use minimum 3 different tile sizes — uniform grids are FORBIDDEN
- All tiles: rounded-2xl overflow-hidden (NEVER rounded-none, NEVER border-*)

TILE TAXONOMY — use ALL four types in every bento section:
① HERO TILE (md:col-span-2 md:row-span-2) — ONE per grid, always top-left or top-right
  - Primary headline + 1 sentence + primary CTA
  - Dark or primary background, white text
  - Pattern: <div class="md:col-span-2 md:row-span-2 rounded-2xl p-8 flex flex-col justify-between overflow-hidden relative" style="background-color: var(--color-dark)">

② WIDE TILE (md:col-span-2 row-span-1) — ONE or TWO per grid
  - Secondary feature headline + short body (2 lines max)
  - Surface or accent background
  - Pattern: <div class="md:col-span-2 rounded-2xl p-6 flex flex-col justify-between overflow-hidden relative" style="background-color: var(--color-surface)">

③ STAT TILE (col-span-1 row-span-1) — TWO to FOUR per grid
  - Single big number (clamp(2rem,5vw,3.5rem)) + label below
  - Alternate between surface, primary, dark backgrounds
  - Pattern: <div class="rounded-2xl p-6 flex flex-col justify-between overflow-hidden relative" style="background-color: var(--color-primary)">

④ IMAGE TILE (col-span-1 row-span-1 or col-span-2) — ONE per grid
  - Full-bleed image with gradient overlay, 1-2 words of text at bottom
  - Pattern: <div class="rounded-2xl overflow-hidden relative" style="min-height:200px">
      <img src="https://picsum.photos/600/400?random=N" alt="..." class="absolute inset-0 w-full h-full object-cover">
      <div class="absolute inset-0 p-5 flex flex-col justify-end" style="background:linear-gradient(to top,rgba(0,0,0,0.65) 0%,transparent 60%)">

TILE CONTENT RULES:
- Every tile: flex flex-col justify-between (label/eyebrow TOP, stat/CTA BOTTOM)
- Eyebrow label: text-xs font-semibold tracking-[0.12em] uppercase, color: var(--color-text-muted) or white/60
- Big stat: font-display font-bold, font-size clamp(2rem,5vw,3.5rem), color: var(--color-accent)
- Icons: w-10 h-10 or w-12 h-12, positioned top-right (absolute top-4 right-4) OR inline with eyebrow
- Body copy per tile: MAX 2 lines — tiles are scannable, not readable

BACKGROUND COLOR VARIATION (mandatory — every tile MUST be different from neighbors):
- Vary: var(--color-background) / var(--color-surface) / var(--color-dark) / var(--color-primary) / var(--color-accent)
- NEVER two adjacent tiles with the same background
- Accent background: use sparingly — max 1 tile per grid

NO BORDERS, NO SHADOWS:
- NEVER add border-* to tiles — the gap-3 between tiles + bg contrast creates separation
- NEVER add shadow-* to tiles — completely flat, depth from color only
- Hover: only scale-[1.015] — nothing else` : ''}

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

${visualToneBlock}

SITE:
Company: ${manifest.content.company_name} | Industry: ${manifest.site.industry}
Tone: ${manifest.site.tone} | Adjectives: ${manifest.site.adjectives.join(', ')}${manifest.selected_patterns?.length ? `

DESIGN PATTERNS (mandatory — apply to every section):
${manifest.selected_patterns.map((p, i) => `${i + 1}. [${p.type}] ${p.name}: ${p.description}${p.preview_description ? ` — ${p.preview_description}` : ''}${p.implementation?.html_snippet ? `\n   USE THIS EXACT HTML: ${p.implementation.html_snippet.slice(0, 400)}` : ''}${p.implementation?.css_snippet ? `\n   CSS: ${p.implementation.css_snippet.slice(0, 200)}` : ''}${p.implementation?.placeholder ? `\n   Drop placeholder where appropriate: ${p.implementation.placeholder}` : ''}`).join('\n')}` : ''}`
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
  posCtx?: SectionPositionContext,
  pageIndex?: number
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

  const pageCtxBlock = (() => {
    if (manifest.pages && manifest.pages.length > 1) {
      const pi = pageIndex ?? 0
      const mp = manifest.pages[pi] ?? manifest.pages[0]
      const otherPages = manifest.pages
        .filter((_, i) => i !== pi)
        .map((p) => `"${p.title}" (${p.slug})`)
        .join(', ')
      return `
PAGE CONTEXT (multi-page site — tailor content for THIS page only):
- Current page: "${mp.title}" (slug: ${mp.slug})
- Purpose: ${mp.sections.length > 0 ? `contains sections: ${mp.sections.join(', ')}` : 'general content page'}
- Other pages in this site: ${otherPages}
- Do NOT repeat hero-level company intros on non-home pages — assume user already knows the brand
- Adapt CTA text and copy to match this page's specific purpose`
    }
    return ''
  })()

  return `Create a "${sectionType}" section for:
Company: ${content.company_name}
USP: ${content.company_usp}
Primary CTA: ${content.primary_cta}
Pain Points: ${content.pain_points.join(', ')}
Trust Signals: ${content.trust_signals.join(', ')}
Tone: ${manifest.site.tone}
${pageCtxBlock}
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
You receive finished HTML and resolve ALL placeholder comments into concrete implementations.

OUTPUT FORMAT: Respond with ONLY raw HTML. No markdown, no code fences, no explanation.

STYLE DICTIONARY — Animation budget: ${dict.rules.animation.budget}
Allowed text animations: ${JSON.stringify(dict.rules.animation.text_animations_allowed ?? [])}
Allowed hover effects: ${JSON.stringify(dict.rules.animation.hover_effects_allowed ?? [])}
Decoration: glassmorphism=${dict.rules.decoration.glassmorphism} | mesh=${dict.rules.decoration.mesh_gradient} | geometric=${dict.rules.decoration.geometric_shapes} | noise=${dict.rules.decoration.noise_texture} | glow=${dict.rules.decoration.border_glow}

PLACEHOLDER RESOLUTION LOOKUP — replace each comment with the implementation below:

<!-- [ANIM: word-cycle | words: [...]] -->
→ Add a <style> block with @keyframes + JS IIFE that cycles words every 2.5s with fade transition:
  <style>@media(prefers-reduced-motion:no-preference){.wc-word{display:inline-block;transition:opacity 0.4s,transform 0.4s}.wc-word.wc-out{opacity:0;transform:translateY(-8px)}.wc-word.wc-in{opacity:0;transform:translateY(8px)}}</style>
  JS: parse the words array from the placeholder, build cycling logic with setInterval(2500)

<!-- [BG: mesh-gradient | colors=primary+accent | opacity=X] -->
→ Insert inside the <section> as first child, position:absolute inset-0 pointer-events-none z-0:
  <div aria-hidden="true" style="position:absolute;inset:0;pointer-events:none;z:0;opacity:X;background:radial-gradient(ellipse at 20% 50%,var(--color-primary) 0%,transparent 60%),radial-gradient(ellipse at 80% 20%,var(--color-accent) 0%,transparent 50%),radial-gradient(ellipse at 60% 80%,var(--color-highlight) 0%,transparent 50%)"></div>

<!-- [BG: geometric-shapes | color=primary | opacity=X] -->
→ Insert inside <section> as first child, position:absolute inset-0 overflow-hidden pointer-events-none z-0:
  <div aria-hidden="true" style="position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:0"><svg style="position:absolute;top:-10%;right:-5%;width:40%;opacity:X;" viewBox="0 0 200 200" fill="none"><circle cx="100" cy="100" r="90" stroke="var(--color-primary)" stroke-width="1"/><circle cx="100" cy="100" r="60" stroke="var(--color-accent)" stroke-width="0.5"/><line x1="0" y1="100" x2="200" y2="100" stroke="var(--color-primary)" stroke-width="0.5"/><line x1="100" y1="0" x2="100" y2="200" stroke="var(--color-primary)" stroke-width="0.5"/></svg><svg style="position:absolute;bottom:-5%;left:-5%;width:30%;opacity:${0.6}X;" viewBox="0 0 160 160" fill="none"><rect x="20" y="20" width="120" height="120" stroke="var(--color-accent)" stroke-width="1" transform="rotate(45 80 80)"/></svg></div>

<!-- [BG: noise-texture | opacity=X] -->
→ Insert inside <section> as first child:
  <div aria-hidden="true" style="position:absolute;inset:0;pointer-events:none;z-index:0;opacity:X;background-image:url('data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\'><filter id=\'n\'><feTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/></filter><rect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'1\'/></svg>');background-size:200px 200px"></div>

<!-- [BG: photo-overlay | darken=X | gradient=bottom] -->
→ Insert a picsum background image + gradient overlay:
  <div aria-hidden="true" style="position:absolute;inset:0;z-index:0"><img src="https://picsum.photos/1440/900?random=99" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"><div style="position:absolute;inset:0;background:linear-gradient(to top,var(--color-dark) 30%,rgba(0,0,0,0.5) 70%,rgba(0,0,0,0.2))"></div></div>

<!-- [BG: svg-illustration | type=abstract | opacity=X] -->
→ Same as geometric-shapes but use a more complex abstract SVG path composition

<!-- [ANIM: counter-tick | target=NUMBER] -->
→ The element has data-target="NUMBER". Add JS IIFE:
  (function(){var els=document.querySelectorAll('[data-target]');var obs=new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting){var el=e.target;var target=+el.dataset.target;var start=0;var dur=1800;var t0=null;function step(ts){if(!t0)t0=ts;var p=Math.min((ts-t0)/dur,1);el.textContent=Math.round(p*target).toLocaleString();if(p<1)requestAnimationFrame(step);}requestAnimationFrame(step);obs.unobserve(el);}});},{threshold:0.3});els.forEach(function(el){obs.observe(el);});})();

<!-- [ANIM: scroll-driven | property=opacity | from=0 | to=1] -->
→ Add CSS animation-timeline: scroll() to the target element, or use IntersectionObserver JS fallback for fade-in

<!-- [TRANSITION: concave-bottom | next=X | depth=Ypx] -->
→ NOTE: Section transitions are injected by the assembler — do NOT attempt to render this placeholder.
  The assembler handles overlap via negative margin-bottom on the SVG divider + padding-top on the next section.
  Remove this comment from the HTML output entirely.

INSTRUCTIONS:
1. Find EVERY placeholder comment in the HTML and replace it using the lookup above
2. Add a single <style> block at the TOP of the section for all @keyframes (wrapped in prefers-reduced-motion)
3. All JS must be IIFE: (function(){ ... })()
4. Do NOT change structure, copy, or layout — only add visual layer on top
5. Keep all var(--color-*) tokens intact — never hardcode hex values
6. Make sure added absolute-positioned elements have pointer-events:none so they don't block clicks
7. If animation budget is 'none' — skip ALL animation placeholders but still resolve BG placeholders`
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
