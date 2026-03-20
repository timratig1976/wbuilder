export interface SectionLayout {
  id:        string
  name:      string
  prompt:    string
  forbidden: string[]
  paradigms?: string[]
  excludeIndustries?: string[]
}

export const HERO_LAYOUTS: SectionLayout[] = [
  {
    id: 'hero-split',
    name: 'Split Screen',
    prompt: `LAYOUT: 2 columns (45%/55%). Left: Eyebrow + Headline (text-5xl+) + Subline + CTA stack + stats row at bottom. Right: dominant product panel full height. Thin vertical dividing line.`,
    forbidden: ['centered headline', 'three equal panels'],
  },
  {
    id: 'hero-bento',
    name: 'Bento Grid',
    prompt: `LAYOUT: CSS Grid grid-template-columns:2fr 1.25fr 1.35fr, 2 rows, 2px gap on dark BG. Card A (col 1, row 1+2): Headline+CTA. Card B (col 2, row 1): Stats. Card C (col 3, row 1+2): Live demo. Card D (col 2, row 2): Platform badges. NO classic hero layout.`,
    forbidden: ['traditional hero layout', 'single large image', 'centered headline'],
    paradigms: ['tech-dark'],
    excludeIndustries: ['construction', 'real-estate', 'luxury', 'consulting', 'healthcare', 'legal', 'finance'],
  },
  {
    id: 'hero-centered',
    name: 'Centered + Panels',
    prompt: `LAYOUT: Headline centered at top (text-6xl+). Below: mono subline left + CTA right. Below that: 2-3 floating content panels side by side. Background: dark with dot-grid.`,
    forbidden: ['split-screen', 'image right', 'single screenshot'],
  },
  {
    id: 'hero-editorial',
    name: 'Editorial Oversized Type',
    prompt: `LAYOUT: Each word of the headline on its own line, full width. font-size:clamp(3rem,12vw,10rem), font-weight:800, line-height:0.91. Below: monospace subline + one CTA. No mockup. The typography IS the visual.`,
    forbidden: ['normal headline size', 'product mockup', 'split layout'],
    paradigms: ['luxury-editorial', 'bold-expressive', 'brutalist'],
  },
  {
    id: 'hero-bottom-anchored',
    name: 'Bottom Anchored',
    prompt: `LAYOUT: Visual dominates top 60% — full width. Headline + subline + CTA anchored at the BOTTOM edge, slightly overlapping. Like a magazine cover.`,
    forbidden: ['text at top or center', 'classic stacked layout'],
    paradigms: ['luxury-editorial', 'bold-expressive'],
  },
]

export const FEATURES_LAYOUTS: SectionLayout[] = [
  {
    id: 'features-bento',
    name: 'Bento Grid',
    prompt: `LAYOUT: Asymmetric grid. 2 large cards (spanning 2 columns, with mini demo SVG) + 4 small cards. No equal-size cards.`,
    forbidden: ['equal-size cards', 'symmetric 3-column grid'],
  },
  {
    id: 'features-alternating',
    name: 'Alternating Rows',
    prompt: `LAYOUT: Alternating 2-column rows across full width. Odd rows: text left + visual right. Even rows: visual left + text right. Minimum 4 features.`,
    forbidden: ['grid of cards', 'all same direction'],
  },
  {
    id: 'features-tabbed',
    name: 'Tabbed',
    prompt: `LAYOUT: 5-6 feature tabs horizontal at top. Below: tab content (description 45% + visual 55%). First tab active. JS toggle between tabs.`,
    forbidden: ['static all-visible grid', 'no interactivity'],
  },
  {
    id: 'features-spotlight',
    name: 'Spotlight',
    prompt: `LAYOUT: One large hero feature (60% width, full bleed). Beside/below: 3-4 secondary features compact.`,
    forbidden: ['equal feature sizes', 'symmetric grid'],
  },
]

export const CTA_LAYOUTS: SectionLayout[] = [
  {
    id: 'cta-centered-glow',
    name: 'Centered Glow',
    prompt: `LAYOUT: Dark background. Content centered (max-w-3xl). Large headline + subline + primary CTA + secondary text link. Radial glow + animated gradient orbs.`,
    forbidden: ['split layout', 'light background'],
  },
  {
    id: 'cta-split-visual',
    name: 'Split Visual',
    prompt: `LAYOUT: Split-screen. Left 55%: Headline + subline + CTAs + trust row. Right 45%: product visual. Gradient background.`,
    forbidden: ['centered layout', 'dark-only background'],
  },
  {
    id: 'cta-floating-card',
    name: 'Floating Card',
    prompt: `LAYOUT: Large floating card (max-w-5xl, mx-auto) with brand gradient. Content centered inside. Card on dark page background. rounded-3xl, shadow-2xl.`,
    forbidden: ['full-width flat background', 'left-aligned content'],
  },
]

export const STATS_LAYOUTS: SectionLayout[] = [
  {
    id: 'stats-dark-row',
    name: 'Dark Bold Row',
    prompt: `LAYOUT: Dark background. 4-5 stats horizontal. Each: huge number (text-5xl+, font-black, accent color) + unit + label. Vertical dividers between stats.`,
    forbidden: ['light background', 'card per stat'],
  },
  {
    id: 'stats-grid-cards',
    name: 'Grid Cards',
    prompt: `LAYOUT: 2×2 or 2×3 grid of stat cards. Light surface background. Cards: border, hover-lift.`,
    forbidden: ['dark full-bleed', 'flat horizontal row'],
  },
]

export const TESTIMONIALS_LAYOUTS: SectionLayout[] = [
  {
    id: 'testimonials-masonry',
    name: 'Masonry',
    prompt: `LAYOUT: 3-column grid, varying card heights. One featured card spanning 2 columns. Cards: large quote mark + text + avatar + name + role.`,
    forbidden: ['equal-height cards', 'single column'],
  },
  {
    id: 'testimonials-featured-grid',
    name: 'Featured + Grid',
    prompt: `LAYOUT: Top: large featured quote with logo + metric callout. Bottom: 3 smaller cards in a row.`,
    forbidden: ['uniform grid', 'equal-size testimonials'],
  },
]

// ── NAVBAR — 3 Varianten ─────────────────────────────────────────

export const NAVBAR_LAYOUTS: SectionLayout[] = [
  {
    id: 'navbar-sticky-blur',
    name: 'Sticky Blur',
    prompt: `LAYOUT: Position sticky top-0, z-50. Background: bg-white/80 or bg-dark/80 + backdrop-blur-md + border-b. Left: Logo (icon + name). Center: nav links (4-5 items). Right: "Sign in" link + primary CTA button (bg-accent). Mobile: hamburger icon that opens a dropdown via JS toggle.`,
    forbidden: ['position fixed', 'no blur', 'centered logo'],
  },
  {
    id: 'navbar-transparent-hero',
    name: 'Transparent über Hero',
    prompt: `LAYOUT: Position absolute top-0, full width, z-50. No background (transparent). Text and links: white or light. Becomes solid on scroll (JS class 'scrolled' → bg-dark/95 backdrop-blur). Logo left, links center, CTA right.`,
    forbidden: ['solid background on load', 'sticky', 'colored background'],
  },
  {
    id: 'navbar-minimal',
    name: 'Minimal Static',
    prompt: `LAYOUT: Static, no sticky logic. bg-surface or white. Logo left, few links (3-4) right beside CTA. No announcement bar. No hamburger dropdown — on mobile only logo + CTA visible.`,
    forbidden: ['sticky', 'backdrop-blur', 'announcement bar', 'complex mobile menu'],
    paradigms: ['minimal-clean', 'luxury-editorial'],
  },
]

// ── FOOTER — 2 Varianten ──────────────────────────────────────────

export const FOOTER_LAYOUTS: SectionLayout[] = [
  {
    id: 'footer-full',
    name: 'Full Multi-Column',
    prompt: `LAYOUT: bg-dark or slate-900. Top: email newsletter strip (full width, input + button). Below: 4-5 column grid. Column 1: Logo + tagline + social icons (SVG: Twitter/X, LinkedIn, GitHub). Columns 2-5: link groups (Product, Company, Resources, Legal) each with bold heading + 5-6 links. Bottom: copyright + privacy + terms.`,
    forbidden: ['light background', 'single column', 'no social icons'],
  },
  {
    id: 'footer-minimal',
    name: 'Minimal',
    prompt: `LAYOUT: Light background (gray-50 or surface). Two rows. Top: logo left + nav links right (5-6 items horizontal). Bottom: copyright left + "Status: Operational 🟢" right. No newsletter, no columns.`,
    forbidden: ['dark background', 'multi-column', 'newsletter form'],
    paradigms: ['minimal-clean', 'luxury-editorial'],
  },
]

// ── PRICING — 2 Varianten ─────────────────────────────────────────

export const PRICING_LAYOUTS: SectionLayout[] = [
  {
    id: 'pricing-three-tier',
    name: '3 Tiers — Classic',
    prompt: `LAYOUT: Top: Annual/Monthly toggle (visual switch, no JS needed for display). 3 cards side by side. Middle card: visually elevated (larger, bg-accent or strong border, "Most Popular" badge). Each card: large price + billing info + USP sentence + 8-10 feature items (✓/✗) + CTA button. Bottom: trust row (SOC2 · No contracts · Cancel anytime).`,
    forbidden: ['flat equal cards', 'no featured tier', 'fewer than 3 tiers'],
  },
  {
    id: 'pricing-comparison-table',
    name: 'Comparison Table',
    prompt: `LAYOUT: Horizontal comparison table. First column: feature names. Further columns: one per plan. Header row: plan name + price + CTA. Rows alternating bg-surface/white. Checkmarks (✓ in accent) and crosses (✗ in muted) per cell. Scrollable on mobile.`,
    forbidden: ['card layout', 'no feature comparison', 'equal column width everywhere'],
  },
]

// ── FAQ — 2 Varianten ─────────────────────────────────────────────

export const FAQ_LAYOUTS: SectionLayout[] = [
  {
    id: 'faq-two-column-accordion',
    name: 'Two Column Accordion',
    prompt: `LAYOUT: Headline centered at top. Below: 2-column grid. In each column: 3-4 accordion items (<details>/<summary>). Each item: question (font-semibold) + +/- icon right. Answer: hidden in <details>, visible when open. 6-8 questions total. Bottom: "Still have questions?" card with email/chat link.`,
    forbidden: ['single column', 'all questions visible at once', 'no toggle'],
  },
  {
    id: 'faq-single-column-rich',
    name: 'Single Column Rich',
    prompt: `LAYOUT: Headline left, subtitle right (2-column header). Below: single wide column (max-w-3xl, mx-auto). 6-8 accordion items with generous padding. Each item has a colored number (text-accent, font-black). No 2-column grid.`,
    forbidden: ['two-column grid', 'no numbering', 'cramped padding'],
    paradigms: ['minimal-clean', 'luxury-editorial'],
  },
]

// ── CUSTOM — 1 Fallback ───────────────────────────────────────────

export const CUSTOM_LAYOUTS: SectionLayout[] = [
  {
    id: 'custom-freeform',
    name: 'Freeform',
    prompt: `LAYOUT: Infer the purpose from the page context. Possible types: How-it-Works (3-4 steps horizontal with numbers + connector lines), Integration Showcase (logo grid with hover cards), Team Section (avatar grid + names + roles), Case Study (split with metric callouts), Comparison Table. Choose the type that best fits the context and implement it fully.`,
    forbidden: ['generic placeholder content', 'lorem ipsum'],
  },
]

const LAYOUTS: Record<string, SectionLayout[]> = {
  hero:         HERO_LAYOUTS,
  features:     FEATURES_LAYOUTS,
  cta:          CTA_LAYOUTS,
  stats:        STATS_LAYOUTS,
  testimonials: TESTIMONIALS_LAYOUTS,
  navbar:       NAVBAR_LAYOUTS,
  footer:       FOOTER_LAYOUTS,
  pricing:      PRICING_LAYOUTS,
  faq:          FAQ_LAYOUTS,
  custom:       CUSTOM_LAYOUTS,
}

export function pickLayout(
  sectionType: string,
  options?: { seed?: number; paradigm?: string; industry?: string; layoutId?: string }
): SectionLayout | null {
  const pool = LAYOUTS[sectionType]
  if (!pool?.length) return null

  if (options?.layoutId) {
    return pool.find(l => l.id === options.layoutId) ?? pool[0]
  }

  let candidates = [...pool]

  if (options?.paradigm) {
    const filtered = candidates.filter(
      l => !l.paradigms || l.paradigms.includes(options.paradigm!)
    )
    if (filtered.length > 0) candidates = filtered
  }

  if (options?.industry) {
    const filtered = candidates.filter(
      l => !l.excludeIndustries || !l.excludeIndustries.includes(options.industry!)
    )
    if (filtered.length > 0) candidates = filtered
  }

  const idx = options?.seed !== undefined
    ? options.seed % candidates.length
    : Math.floor(Math.random() * candidates.length)

  return candidates[idx]
}

export function buildLayoutBlock(layout: SectionLayout): string {
  return [
    `LAYOUT DIRECTIVE — MUST IMPLEMENT EXACTLY (ID: ${layout.id}):`,
    layout.prompt,
    ``,
    `FORBIDDEN in this section:`,
    layout.forbidden.map(f => `- ${f}`).join('\n'),
  ].join('\n')
}
