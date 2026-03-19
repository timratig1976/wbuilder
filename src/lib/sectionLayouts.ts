export interface SectionLayout {
  id:        string
  name:      string
  prompt:    string
  forbidden: string[]
  paradigms?: string[]
}

export const HERO_LAYOUTS: SectionLayout[] = [
  {
    id: 'hero-split',
    name: 'Split Screen',
    prompt: `LAYOUT: 2 Spalten (45%/55%). Links: Eyebrow + Headline (text-5xl+) + Subline + CTA-Stack + Statistik-Zeile unten. Rechts: dominantes Produkt-Panel volle Höhe. Dünne vertikale Trennlinie.`,
    forbidden: ['centered headline', 'three equal panels'],
  },
  {
    id: 'hero-bento',
    name: 'Bento Grid',
    prompt: `LAYOUT: CSS Grid grid-template-columns:2fr 1.25fr 1.35fr, 2 Zeilen, 2px Gap auf dunklem BG. Karte A (Sp.1, Z.1+2): Headline+CTA. Karte B (Sp.2, Z.1): Stats. Karte C (Sp.3, Z.1+2): Live-Demo. Karte D (Sp.2, Z.2): Plattform-Badges. KEIN klassisches Hero.`,
    forbidden: ['traditional hero layout', 'single large image', 'centered headline'],
  },
  {
    id: 'hero-centered',
    name: 'Centered + Panels',
    prompt: `LAYOUT: Headline zentriert oben (text-6xl+). Darunter: Mono-Subline links + CTA rechts. Darunter: 2-3 floatende Content-Panels nebeneinander. Hintergrund: dunkel mit Dot-Grid.`,
    forbidden: ['split-screen', 'image right', 'single screenshot'],
  },
  {
    id: 'hero-editorial',
    name: 'Editorial Oversized Type',
    prompt: `LAYOUT: Jedes Wort der Headline auf eigener Zeile, volle Breite. font-size:clamp(3rem,12vw,10rem), font-weight:800, line-height:0.91. Darunter: Monospace-Subline + ein CTA. Kein Mockup. Die Typografie IS das Visual.`,
    forbidden: ['normal headline size', 'product mockup', 'split layout'],
    paradigms: ['luxury-editorial', 'bold-expressive', 'brutalist'],
  },
  {
    id: 'hero-bottom-anchored',
    name: 'Bottom Anchored',
    prompt: `LAYOUT: Visual dominiert obere 60% — volle Breite. Headline + Subline + CTA am UNTEREN Rand verankert, leicht überlappend. Wie ein Magazin-Cover.`,
    forbidden: ['text at top or center', 'classic stacked layout'],
    paradigms: ['luxury-editorial', 'bold-expressive'],
  },
]

export const FEATURES_LAYOUTS: SectionLayout[] = [
  {
    id: 'features-bento',
    name: 'Bento Grid',
    prompt: `LAYOUT: Asymmetrisches Grid. 2 große Karten (spanning 2 Spalten, mit Mini-Demo-SVG) + 4 kleine Karten. Keine gleichgroßen Karten.`,
    forbidden: ['equal-size cards', 'symmetric 3-column grid'],
  },
  {
    id: 'features-alternating',
    name: 'Alternating Rows',
    prompt: `LAYOUT: Abwechselnde 2-Spalten-Zeilen über volle Breite. Ungerade: Text links + Visual rechts. Gerade: Visual links + Text rechts. Min 4 Features.`,
    forbidden: ['grid of cards', 'all same direction'],
  },
  {
    id: 'features-tabbed',
    name: 'Tabbed',
    prompt: `LAYOUT: 5-6 Feature-Tabs horizontal oben. Darunter: Tab-Content (Beschreibung 45% + Visual 55%). Erster Tab aktiv. JS-Toggle zwischen Tabs.`,
    forbidden: ['static all-visible grid', 'no interactivity'],
  },
  {
    id: 'features-spotlight',
    name: 'Spotlight',
    prompt: `LAYOUT: Ein großes Hero-Feature (60% Breite, volles Bleed). Daneben/darunter: 3-4 sekundäre Features kompakt.`,
    forbidden: ['equal feature sizes', 'symmetric grid'],
  },
]

export const CTA_LAYOUTS: SectionLayout[] = [
  {
    id: 'cta-centered-glow',
    name: 'Centered Glow',
    prompt: `LAYOUT: Dunkler BG. Inhalt zentriert (max-w-3xl). Große Headline + Subline + primärer CTA + sekundärer Text-Link. Radialer Glow + animierte Gradient-Orbs.`,
    forbidden: ['split layout', 'light background'],
  },
  {
    id: 'cta-split-visual',
    name: 'Split Visual',
    prompt: `LAYOUT: Split-Screen. Links 55%: Headline + Subline + CTAs + Trust-Zeile. Rechts 45%: Produkt-Visual. Gradient-Hintergrund.`,
    forbidden: ['centered layout', 'dark-only background'],
  },
  {
    id: 'cta-floating-card',
    name: 'Floating Card',
    prompt: `LAYOUT: Große schwebende Karte (max-w-5xl, mx-auto) mit Brand-Gradient. Zentrierter Inhalt darin. Karte auf dunklem Seiten-BG. rounded-3xl, shadow-2xl.`,
    forbidden: ['full-width flat background', 'left-aligned content'],
  },
]

export const STATS_LAYOUTS: SectionLayout[] = [
  {
    id: 'stats-dark-row',
    name: 'Dark Bold Row',
    prompt: `LAYOUT: Dunkler BG. 4-5 Stats horizontal. Jede: riesige Zahl (text-5xl+, font-black, Accent) + Einheit + Label. Vertikale Trennlinien zwischen Stats.`,
    forbidden: ['light background', 'card per stat'],
  },
  {
    id: 'stats-grid-cards',
    name: 'Grid Cards',
    prompt: `LAYOUT: 2×2 oder 2×3 Grid aus Stat-Karten. Heller Surface-BG. Karten: border, hover-lift.`,
    forbidden: ['dark full-bleed', 'flat horizontal row'],
  },
]

export const TESTIMONIALS_LAYOUTS: SectionLayout[] = [
  {
    id: 'testimonials-masonry',
    name: 'Masonry',
    prompt: `LAYOUT: 3-spaltiges Grid, unterschiedliche Kartenhöhen. Eine Featured-Karte spanning 2 Spalten. Karten: großes Anführungszeichen + Text + Avatar + Name + Rolle.`,
    forbidden: ['equal-height cards', 'single column'],
  },
  {
    id: 'testimonials-featured-grid',
    name: 'Featured + Grid',
    prompt: `LAYOUT: Oben: großes Featured-Quote mit Logo + Metric-Callout. Unten: 3 kleinere Karten in einer Reihe.`,
    forbidden: ['uniform grid', 'equal-size testimonials'],
  },
]

// ── NAVBAR — 3 Varianten ─────────────────────────────────────────

export const NAVBAR_LAYOUTS: SectionLayout[] = [
  {
    id: 'navbar-sticky-blur',
    name: 'Sticky Blur',
    prompt: `LAYOUT: Position sticky top-0, z-50. Hintergrund: bg-white/80 oder bg-dark/80 + backdrop-blur-md + border-b. Links: Logo (Icon + Name). Mitte: Nav-Links (4-5 Items). Rechts: "Sign in" Link + primärer CTA-Button (bg-accent). Mobile: Hamburger-Icon das per JS-Toggle ein Dropdown öffnet.`,
    forbidden: ['position fixed', 'no blur', 'centered logo'],
  },
  {
    id: 'navbar-transparent-hero',
    name: 'Transparent über Hero',
    prompt: `LAYOUT: Position absolute top-0, volle Breite, z-50. Kein Hintergrund (transparent). Text und Links: weiß oder hell. Wird beim Scroll solid (JS-Klasse 'scrolled' → bg-dark/95 backdrop-blur). Logo links, Links mitte, CTA rechts.`,
    forbidden: ['solid background on load', 'sticky', 'colored background'],
  },
  {
    id: 'navbar-minimal',
    name: 'Minimal Static',
    prompt: `LAYOUT: Static, keine Sticky-Logik. bg-surface oder white. Logo links, wenige Links (3-4) rechts neben CTA. Kein Announcement-Bar. Kein Hamburger-Dropdown — bei Mobile nur Logo + CTA sichtbar.`,
    forbidden: ['sticky', 'backdrop-blur', 'announcement bar', 'complex mobile menu'],
    paradigms: ['minimal-clean', 'luxury-editorial'],
  },
]

// ── FOOTER — 2 Varianten ──────────────────────────────────────────

export const FOOTER_LAYOUTS: SectionLayout[] = [
  {
    id: 'footer-full',
    name: 'Full Multi-Column',
    prompt: `LAYOUT: bg-dark oder slate-900. Oben: Email-Newsletter-Strip (volle Breite, Input + Button). Darunter: 4-5 Spalten Grid. Spalte 1: Logo + Tagline + Social Icons (SVG: Twitter/X, LinkedIn, GitHub). Spalten 2-5: Link-Gruppen (Product, Company, Resources, Legal) je mit Bold-Heading + 5-6 Links. Unten: Copyright + Privacy + Terms.`,
    forbidden: ['light background', 'single column', 'no social icons'],
  },
  {
    id: 'footer-minimal',
    name: 'Minimal',
    prompt: `LAYOUT: Heller BG (gray-50 oder surface). Zwei Zeilen. Oben: Logo links + Nav-Links rechts (5-6 Items horizontal). Unten: Copyright links + "Status: Operational 🟢" rechts. Kein Newsletter, keine Spalten.`,
    forbidden: ['dark background', 'multi-column', 'newsletter form'],
    paradigms: ['minimal-clean', 'luxury-editorial'],
  },
]

// ── PRICING — 2 Varianten ─────────────────────────────────────────

export const PRICING_LAYOUTS: SectionLayout[] = [
  {
    id: 'pricing-three-tier',
    name: '3 Tiers — Classic',
    prompt: `LAYOUT: Oben: Annual/Monthly-Toggle (visueller Switch, kein JS nötig für Darstellung). 3 Karten nebeneinander. Mittlere Karte: visuell erhöht (größer, bg-accent oder starker Border, "Most Popular" Badge). Jede Karte: Preis groß + Billing-Info + USP-Satz + 8-10 Feature-Items (✓/✗) + CTA-Button. Unten: Trust-Zeile (SOC2 · No contracts · Cancel anytime).`,
    forbidden: ['flat equal cards', 'no featured tier', 'fewer than 3 tiers'],
  },
  {
    id: 'pricing-comparison-table',
    name: 'Comparison Table',
    prompt: `LAYOUT: Horizontale Vergleichstabelle. Erste Spalte: Feature-Namen. Weitere Spalten: je ein Plan. Header-Zeile: Plan-Name + Preis + CTA. Zeilen abwechselnd bg-surface/white. Checkmarks (✓ in Accent) und Kreuze (✗ in muted) pro Zelle. Scrollbar auf Mobile.`,
    forbidden: ['card layout', 'no feature comparison', 'equal column width everywhere'],
  },
]

// ── FAQ — 2 Varianten ─────────────────────────────────────────────

export const FAQ_LAYOUTS: SectionLayout[] = [
  {
    id: 'faq-two-column-accordion',
    name: 'Two Column Accordion',
    prompt: `LAYOUT: Headline zentriert oben. Darunter: 2-spaltiges Grid. In jeder Spalte: 3-4 Accordion-Items (<details>/<summary>). Jedes Item: Frage (font-semibold) + +/- Icon rechts. Antwort: in <details> versteckt, bei open: sichtbar. 6-8 Fragen gesamt. Unten: "Still have questions?" Karte mit Email/Chat-Link.`,
    forbidden: ['single column', 'all questions visible at once', 'no toggle'],
  },
  {
    id: 'faq-single-column-rich',
    name: 'Single Column Rich',
    prompt: `LAYOUT: Headline links, Subtitle rechts (2-Spalten Header). Darunter: einzelne breite Spalte (max-w-3xl, mx-auto). 6-8 Accordion-Items mit großzügigem Padding. Jedes Item hat eine farbige Nummerierung (text-accent, font-black). Kein 2-Spalten-Grid.`,
    forbidden: ['two-column grid', 'no numbering', 'cramped padding'],
    paradigms: ['minimal-clean', 'luxury-editorial'],
  },
]

// ── CUSTOM — 1 Fallback ───────────────────────────────────────────

export const CUSTOM_LAYOUTS: SectionLayout[] = [
  {
    id: 'custom-freeform',
    name: 'Freeform',
    prompt: `LAYOUT: Inferiere den Zweck aus dem Page-Kontext. Mögliche Typen: How-it-Works (3-4 Steps horizontal mit Nummern + Connector-Lines), Integration-Showcase (Logo-Grid mit Hover-Cards), Team-Section (Avatar-Grid + Names + Roles), Case Study (Split mit Metric-Callouts), Comparison Table. Wähle den zum Kontext passenden Typ und setze ihn vollständig um.`,
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
  options?: { seed?: number; paradigm?: string; layoutId?: string }
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

  const idx = options?.seed !== undefined
    ? options.seed % candidates.length
    : Math.floor(Math.random() * candidates.length)

  return candidates[idx]
}

export function buildLayoutBlock(layout: SectionLayout): string {
  return [
    `LAYOUT-VORGABE — ZWINGEND UMSETZEN (ID: ${layout.id}):`,
    layout.prompt,
    ``,
    `VERBOTEN in dieser Section:`,
    layout.forbidden.map(f => `- ${f}`).join('\n'),
  ].join('\n')
}
