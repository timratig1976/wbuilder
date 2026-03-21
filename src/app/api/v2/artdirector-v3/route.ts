import { NextRequest } from 'next/server'
import { getProvider } from '@/lib/ai/models'
import path from 'path'
import fs from 'fs'

export const runtime = 'nodejs'
export const maxDuration = 300

// ─── Types ───────────────────────────────────────────────────────────────────

type V3Request = {
  artDirectorModel?: string
  developerModel?: string
  fastModel?: string
  industry: string
  paradigm: string
  companyName: string
  usp: string
  language?: 'de' | 'en'
  conversionGoal?: string
  layoutOverride?: string
  paradigmOverride?: string
  creativityLevel?: 'normal' | 'balanced' | 'free'
  brandContext?: {
    primaryColor?: string
    secondaryColor?: string
    accentColor?: string
    fontHeadline?: string
    fontBody?: string
    logoStyle?: string
    designNotes?: string
  }
  contentInventory?: {
    hasStats?: boolean
    hasVisual?: boolean
    hasLogos?: boolean
    hasDemo?: boolean
    hasVideo?: boolean
    statsExamples?: string[]
    ctaGoal?: string
  }
}

type ConversionBlueprint = {
  strongestHook: string
  painPoint: string
  solutionFrame: string
  proofType: string
  conversionBlockers: string[]
  ctaApproach: string
  sectionOrder: string
}

type ImageBriefing = {
  mood: string
  composition: string
  subject: string
  avoid: string
  picsumSeed: string
  picsumId: number
  overlayOpacity: number
}

type AnimationStrategy = {
  overallMotion: string
  heroEntranceEffect: string
  backgroundAnimation: string
  stillElements: string[]
  hoverEffects: string
  scrollBehavior: string
  cssPattern: string
}

type DesignerMockup = {
  layoutId: string
  gridClasses: string
  slotAssignment: Record<string, string>
  typographyDecisions: string
  spacingNotes: string
  visualHierarchy: string
}

// ─── Conversion Goal → Micro-copy / CTA guidance for the Texter ─────────────
const CONVERSION_GOAL_GUIDANCE: Record<string, string> = {
  'b2b-contact':  'B2B contact/inquiry. CTA: "Jetzt anfragen" / "Get in touch". Micro-copy: reassurance without credit-card framing — use "Unverbindlich" / "No commitment" or "Kostenlose Erstberatung" / "Free consultation". NO mention of credit cards.',
  'b2b-demo':     'B2B demo booking. CTA: "Demo buchen" / "Book a demo". Micro-copy: "30 Min. genügen" / "30 min call" or "Persönlich & live" / "Live walkthrough". NO mention of credit cards.',
  'b2b-tender':   'B2B tender/RFP. CTA: "Ausschreibung einreichen" / "Submit RFP". Micro-copy: "Vertraulich" / "Confidential" or "Innerhalb 48h" / "Reply within 48h". NO mention of credit cards.',
  'saas-trial':   'SaaS free trial. CTA: "Kostenlos testen" / "Start free trial". Micro-copy: "14 Tage gratis · Keine Kreditkarte" / "14 days free · No credit card". Credit card mention is appropriate here.',
  'saas-signup':  'SaaS account creation. CTA: "Account erstellen" / "Create account". Micro-copy: "In 2 Minuten eingerichtet" / "Set up in 2 minutes". Credit card mention optional.',
  'ecom-buy':     'E-commerce purchase. CTA: "Jetzt kaufen" / "Buy now". Micro-copy: "Sicher bezahlen · Gratis Rücksendung" / "Secure checkout · Free returns".',
  'lead-form':    'Lead generation form. CTA: "Jetzt bewerben" / "Apply now". Micro-copy: "Dauert 2 Minuten" / "Takes 2 minutes". NO mention of credit cards.',
  'newsletter':   'Newsletter signup. CTA: "Anmelden" / "Subscribe". Micro-copy: "Kein Spam · Jederzeit abmeldbar" / "No spam · Unsubscribe anytime". NO mention of credit cards.',
  'download':     'Content download. CTA: "Whitepaper laden" / "Download now". Micro-copy: "Sofort verfügbar · Kostenlos" / "Instant access · Free". NO mention of credit cards.',
}

type TexterOutput = {
  eyebrow: string
  eyebrowVariants?: string[]
  headlinePart1: string
  headlinePart2: string
  subline: string
  ctaPrimary: string
  ctaSecondary: string
  microCopy: string
  stats: Array<{ value: string; label: string }>
  trustSignals: string[]
  tonalityNote: string
}

type QAResult = {
  valid: boolean
  errors: Array<{ type: string; message: string; severity: string; auto_fixable: boolean }>
  score: number
}

// ─── SSE helper ──────────────────────────────────────────────────────────────

function sseEvent(obj: unknown) {
  return `data: ${JSON.stringify(obj)}\n\n`
}

// ─── Icon Library (Call 7 / Developer) ───────────────────────────────────────

const ICON_LIBRARY = `ICON LIBRARY — use ONLY these exact SVG paths, never invent paths:
check:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M20 6L9 17l-5-5"/></svg>
arrow:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
star:    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
shield:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
users:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
clock:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
chart:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
mail:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
phone:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 01.22 2.18 2 2 0 012.18 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.56 6.56l1.07-1.07a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>`

// ─── Prompt builders ──────────────────────────────────────────────────────────

function buildConversionStrategistSystem(lang: 'de' | 'en'): string {
  return lang === 'de'
    ? `Du bist Conversion-Stratege in einer Top-Performance-Marketing-Agentur.
Aufgabe: Erstelle einen Conversion Blueprint für eine Landing Page Hero Section.
Output: NUR valides JSON — kein Markdown, keine Erklärungen außerhalb des JSON.
JSON-Schema:
{
  "strongestHook": "string — der stärkste emotionale Einstieg",
  "painPoint": "string — der konkreteste Schmerzpunkt der Zielgruppe",
  "solutionFrame": "string — wie die Lösung präsentiert werden soll",
  "proofType": "string — welcher Beweis am stärksten wirkt (Zahl/Zitat/Logo/Fallstudie)",
  "conversionBlockers": ["string — was Nutzer zögern lässt"],
  "ctaApproach": "string — konkrete CTA-Formulierung und Positionierung",
  "sectionOrder": "string — Reihenfolge: Problem → Lösung → Beweis → CTA"
}`
    : `You are a conversion strategist at a top performance marketing agency.
Task: Create a conversion blueprint for a landing page hero section.
Output: ONLY valid JSON — no markdown, no explanations outside JSON.
JSON schema:
{
  "strongestHook": "string — the strongest emotional entry point",
  "painPoint": "string — the most concrete pain point of the target audience",
  "solutionFrame": "string — how the solution should be framed",
  "proofType": "string — which proof type works best (number/quote/logo/case study)",
  "conversionBlockers": ["string — what makes users hesitate"],
  "ctaApproach": "string — concrete CTA wording and positioning",
  "sectionOrder": "string — order: Problem → Solution → Proof → CTA"
}`
}

function buildArtDirectorSystem(lang: 'de' | 'en'): string {
  return lang === 'de'
    ? `Du bist Creative Director in einem preisgekrönten Digitalstudio.
Aufgabe: Gib eine kreative visuelle DIREKTION für eine Hero Section — kein Layout, kein Grid.
Regeln:
- Output ist reiner Text (kein HTML, kein Markdown, kein JSON).
- Maximal 6 Sätze.
- Beschreibe: (1) Emotion + Leitmotiv, (2) Farbstimmung + Kontrast — KONKRETE Farben nennen (z.B. "tiefes Ozeanblau + sanftes Cremeweisß", "sattes Waldgrün + helles Elfenbein"), (3) eine unerwartete aber umsetzbare Design-Entscheidung, (4) Typografie-Gefühl, (5) Bewegung/Stille.
- VERBOTEN: Anthrazit+Gelb, Dunkelgrau+Gelb, Charcoal+Amber — das sind überabgenutzte Kombinationen.
- Wähle echte, unerwartete Farben die zur Industrie passen. Beispiele: Tiefblau+Terrakotta, Smaragd+Off-White, Marineblau+Blassrosa, Slate+Mintgrün, Dunkelviolett+Champagner.
- Alles muss mit Tailwind CSS + CSS Custom Properties umsetzbar sein.`
    : `You are a creative director at an award-winning digital studio.
Task: Provide creative visual DIRECTION for a hero section — no layout, no grid.
Rules:
- Output is plain text (no HTML, no markdown, no JSON).
- Max 6 sentences.
- Describe: (1) emotion + visual motif, (2) color mood + contrast — name CONCRETE colors (e.g. "deep ocean blue + soft cream white", "rich forest green + ivory"), (3) one unexpected but implementable design decision, (4) typographic feel, (5) motion/stillness.
- FORBIDDEN: anthracite+yellow, dark grey+yellow, charcoal+amber — these are overused combinations.
- Choose genuinely unexpected colors that fit the industry. Examples: deep blue+terracotta, emerald+off-white, navy+blush, slate+mint, dark violet+champagne.
- Everything must be implementable with Tailwind CSS + CSS Custom Properties.`
}

function buildFotografSystem(lang: 'de' | 'en'): string {
  return lang === 'de'
    ? `Du bist Fotograf und Bild-Stratege für digitale Kampagnen.
Aufgabe: Erstelle ein präzises Bild-Briefing für eine Hero Section als JSON.
Output: NUR valides JSON — kein Markdown, keine Erklärungen.
Regeln:
- picsumId: wähle eine Zahl zwischen 1-1000 die thematisch passt (z.B. Architektur: 200-250, Menschen: 100-150, Natur: 400-450)
- picsumSeed: beschreibender Begriff auf Englisch (z.B. "construction-site", "team-meeting")
- overlayOpacity: 0 = kein Overlay, 0.3 = leichtes Overlay, 0.7 = starkes Overlay
JSON-Schema:
{
  "mood": "string — Stimmung des Bildes in 3 Adjektiven",
  "composition": "string — Bildaufbau (z.B. 'Zentral, Tiefenwirkung, rule-of-thirds')",
  "subject": "string — Was ist zu sehen? Konkret, keine Abstraktionen",
  "avoid": "string — Was vermeiden? (z.B. 'kein Stock-Foto-Lächeln, keine Anzüge')",
  "picsumSeed": "string — englischer Begriff für picsum.photos/seed/SEED/800/600",
  "picsumId": number,
  "overlayOpacity": number
}`
    : `You are a photographer and image strategist for digital campaigns.
Task: Create a precise image briefing for a hero section as JSON.
Output: ONLY valid JSON — no markdown, no explanations.
Rules:
- picsumId: choose a number 1-1000 that fits thematically (e.g. architecture: 200-250, people: 100-150, nature: 400-450)
- picsumSeed: descriptive English term (e.g. "construction-site", "team-meeting")
- overlayOpacity: 0 = no overlay, 0.3 = light overlay, 0.7 = heavy overlay
JSON schema:
{
  "mood": "string — image mood in 3 adjectives",
  "composition": "string — image composition (e.g. 'centered, depth, rule-of-thirds')",
  "subject": "string — what is shown? Concrete, no abstractions",
  "avoid": "string — what to avoid? (e.g. 'no stock photo smiles, no suits')",
  "picsumSeed": "string — English term for picsum.photos/seed/SEED/800/600",
  "picsumId": number,
  "overlayOpacity": number
}`
}

function buildAnimationsguruSystem(lang: 'de' | 'en'): string {
  return lang === 'de'
    ? `Du bist Animations-Direktor für hochwertige digitale Erlebnisse.
Aufgabe: Definiere die Animation-Strategie für eine Hero Section als JSON.
Output: NUR valides JSON — kein Markdown, keine Erklärungen.
Regeln:
- Animationen müssen mit reinem CSS + Tailwind umsetzbar sein (kein GSAP, kein JS-Framework).
- cssPattern: ein konkretes CSS-Pattern das der Developer 1:1 einfügen kann.
- stillElements: mindestens 2 Elemente die NICHT animiert werden (bewusste Ruhe).
JSON-Schema:
{
  "overallMotion": "string — Gesamtcharakter der Bewegung (z.B. 'langsam, schwer, fast unhörbar')",
  "heroEntranceEffect": "string — Wie erscheint der Hero? (z.B. 'fade-up mit 600ms delay pro Element')",
  "backgroundAnimation": "string — Hintergrund-Animation oder 'none' (z.B. 'sehr langsames gradient-shift 20s')",
  "stillElements": ["string — Elemente die bewusst still bleiben"],
  "hoverEffects": "string — Hover-Verhalten auf CTAs und Cards",
  "scrollBehavior": "string — was passiert beim Scrollen?",
  "cssPattern": "string — konkreter CSS @keyframes Code-Block oder Tailwind-Klassen"
}`
    : `You are an animation director for premium digital experiences.
Task: Define the animation strategy for a hero section as JSON.
Output: ONLY valid JSON — no markdown, no explanations.
Rules:
- Animations must be implementable with pure CSS + Tailwind (no GSAP, no JS framework).
- cssPattern: a concrete CSS pattern the developer can paste directly.
- stillElements: at least 2 elements that are NOT animated (conscious stillness).
JSON schema:
{
  "overallMotion": "string — overall motion character (e.g. 'slow, heavy, almost inaudible')",
  "heroEntranceEffect": "string — how does the hero appear? (e.g. 'fade-up with 600ms delay per element')",
  "backgroundAnimation": "string — background animation or 'none' (e.g. 'very slow gradient-shift 20s')",
  "stillElements": ["string — elements that consciously stay still"],
  "hoverEffects": "string — hover behavior on CTAs and cards",
  "scrollBehavior": "string — what happens on scroll?",
  "cssPattern": "string — concrete CSS @keyframes code block or Tailwind classes"
}`
}

function buildDesignerSystem(lang: 'de' | 'en'): string {
  return lang === 'de'
    ? `Du bist eigensinniger Layout-Architekt und Visual Director für digitale Interfaces.
Aufgabe: Erfinde ein EINZIGARTIGES visuelles Konzept als JSON. Sei mutig und spezifisch — kein generisches "eyebrow+h1+cta".
Output: NUR valides JSON — kein Markdown, keine Erklärungen.
Regeln:
- layoutId: wähle aus: bento-3col | bento-2col | split-50 | centered | editorial-split | bento-asymmetric-right
- slotAssignment: KONKRETE visuelle Behandlung je Slot — beschreibe genau WIE es aussehen soll, nicht nur WAS drin ist.
  Beispiele für Left-Slot: "große Display-Zahl als Hintergrund-Watermark + H1 darüber", "H1 + 3 horizontale Progress-Balken als Proof", "H1 + Icon-Grid 2x2 mit Mini-Labels"
  Beispiele für Stats-Slot: "einzelne dominante KPI zentriert XXL + 2 Mini-Stats darunter", "3 Stats als vertikale Timeline mit Jahreszahlen", "radial-gradient Hintergrund + 2 Stats"
  Beispiele für Visual-Slot: "Bild mit diagonalem Clip-Path unten-links", "Bild als Vollbild + großes Zitat-Overlay", "Bild mit Farb-Overlay in Akzentfarbe + Titel oben"
- typographyDecisions: konkrete Größen und Gewichte für H1, Eyebrow, Subline
- WICHTIG: Jede Entscheidung muss sich von Standard-Templates abheben. Überrasche.
JSON-Schema:
{
  "layoutId": "string",
  "gridClasses": "string",
  "slotAssignment": {"left": "KONKRETE visuelle Behandlung", "stats": "KONKRETE visuelle Behandlung", "visual": "KONKRETE visuelle Behandlung"},
  "typographyDecisions": "string",
  "spacingNotes": "string",
  "visualHierarchy": "string"
}`
    : `You are an opinionated layout architect and visual director for digital interfaces.
Task: Invent a UNIQUE visual concept as JSON. Be bold and specific — never write generic "eyebrow+h1+cta".
Output: ONLY valid JSON — no markdown, no explanations.
Rules:
- layoutId: choose from: bento-3col | bento-2col | split-50 | centered | editorial-split | bento-asymmetric-right
- slotAssignment: SPECIFIC visual treatment per slot — describe exactly HOW it looks, not just WHAT is in it.
  Left slot examples: "giant display number as background watermark + H1 layered on top", "H1 + 3 horizontal progress bars as social proof", "H1 + 2x2 icon grid with micro-labels"
  Stats slot examples: "single dominant XXL KPI centered + 2 mini-stats below", "3 stats as vertical timeline with years", "radial-gradient bg + 2 oversized stats"
  Visual slot examples: "image with diagonal clip-path bottom-left", "full-bleed image + oversized pull-quote overlay", "image with accent-color duotone overlay + title top-left"
- typographyDecisions: concrete sizes and weights for H1, eyebrow, subline
- IMPORTANT: Every decision must deviate from standard templates. Surprise the developer.
JSON schema:
{
  "layoutId": "string",
  "gridClasses": "string",
  "slotAssignment": {"left": "SPECIFIC visual treatment", "stats": "SPECIFIC visual treatment", "visual": "SPECIFIC visual treatment"},
  "typographyDecisions": "string",
  "spacingNotes": "string",
  "visualHierarchy": "string"
}`
}

function buildTexterSystem(lang: 'de' | 'en'): string {
  return lang === 'de'
    ? `Du bist Senior Copywriter für digitale Produkte und Dienstleistungen.
Aufgabe: Erstelle alle Texte für eine Hero Section als JSON.
Regeln:
- Output: NUR valides JSON, kein Markdown.
- Deutsche Headlines: NIEMALS länger als 4 Wörter pro Zeile — nutze den Headline-Split.
- Eyebrow: Generiere 3 verschiedene Eyebrow-Varianten (eyebrowVariants) in unterschiedlichen Stilen:
  Stil A: Kategorie-Badge (z.B. "BAUMANAGEMENT", "PROJEKTSTEUERUNG")
  Stil B: Sozial-Beweis oder Zahl (z.B. "200+ Projekte", "#1 in Bayern")
  Stil C: Frage oder Aussage (z.B. "Termine im Griff?", "Seit 2009")
  Das Feld "eyebrow" ist der beste der 3 für den gewählten Paradigm/Tonalität.
- Headline Part 1: 2-3 Wörter, neutral.
- Headline Part 2: 2-4 Wörter, emotional/stark — wird visuell hervorgehoben.
- Subline: 1 Satz, Outcome-fokussiert, max 12 Wörter.
- CTA Primary: Verb + Nutzen, max 4 Wörter.
- Micro Copy: Risiko-Reduktion, max 5 Wörter ("Kostenlos · Keine Kreditkarte").
- Stats: echte oder plausible Zahlen mit Einheit.
JSON-Schema:
{
  "eyebrow": "string — beste Variante",
  "eyebrowVariants": ["string", "string", "string"],
  "headlinePart1": "string",
  "headlinePart2": "string",
  "subline": "string",
  "ctaPrimary": "string",
  "ctaSecondary": "string",
  "microCopy": "string",
  "stats": [{"value": "string", "label": "string"}],
  "trustSignals": ["string"],
  "tonalityNote": "string — ein Satz für den Developer über Tonalität"
}`
    : `You are a senior copywriter for digital products and services.
Task: Create all texts for a hero section as JSON.
Rules:
- Output: ONLY valid JSON, no markdown.
- Headlines: max 4 words per line — use the headline split.
- Eyebrow: Generate 3 different eyebrow variants (eyebrowVariants) in distinct styles:
  Style A: Category badge (e.g. "CONSTRUCTION MANAGEMENT", "PROJECT CONTROL")
  Style B: Social proof or number (e.g. "200+ Projects", "#1 in Bavaria")
  Style C: Question or statement hook (e.g. "On schedule?", "Since 2009")
  The field "eyebrow" is the best of the 3 for the chosen paradigm/tonality.
- Headline Part 1: 2-3 words, neutral.
- Headline Part 2: 2-4 words, emotional/strong — will be visually highlighted.
- Subline: 1 sentence, outcome-focused, max 12 words.
- CTA Primary: Verb + benefit, max 4 words.
- Micro Copy: risk reduction, max 5 words ("Free · No credit card").
- Stats: real or plausible numbers with unit.
JSON schema:
{
  "eyebrow": "string — best variant",
  "eyebrowVariants": ["string", "string", "string"],
  "headlinePart1": "string",
  "headlinePart2": "string",
  "subline": "string",
  "ctaPrimary": "string",
  "ctaSecondary": "string",
  "microCopy": "string",
  "stats": [{"value": "string", "label": "string"}],
  "trustSignals": ["string"],
  "tonalityNote": "string — one sentence for the developer about tonality"
}`
}

function buildDeveloperSystem(lang: 'de' | 'en'): string {
  return lang === 'de'
    ? `Du bist Senior Frontend Engineer der Hero Sections in Tailwind CSS implementiert.
Output: NUR rohes HTML — kein Markdown, keine Code-Fences, keine Erklärungen.
Erstes Zeichen MUSS "<" sein.

━━━ REGEL 1 — KEIN HEX, KEIN RGB (KRITISCH) ━━━
Du darfst NIEMALS Hex-Werte oder RGB-Werte schreiben. Nicht in style="", nicht in <style>-Blöcken, nirgends.
FALSCH: style="background: #1c1c1c"  background: #161616;  color: rgb(0,0,0)  border: 1px solid #444
RICHTIG: class="bg-gray-900"  style="background: var(--color-surface)"  class="border-white/10"
Nur erlaubt: Tailwind-Klassen (bg-gray-900, text-white, border-gray-700 etc.) ODER CSS Custom Properties (var(--color-*)).

━━━ REGEL 2 — DEUTSCHE HEADLINES (KRITISCH) ━━━
NIEMALS text-5xl/6xl/7xl für deutschen Text. Immer clamp():
FALSCH: class="text-6xl font-bold"
RICHTIG: style="font-size: clamp(1.8rem, 3.5vw, 3rem)" class="font-bold"

━━━ REGEL 3 — SVG DEKORATIV ━━━
Alle dekorativen SVGs (Icons ohne Text-Kontext) brauchen aria-hidden="true".
FALSCH: <svg viewBox="...">...
RICHTIG: <svg viewBox="..." aria-hidden="true">...

━━━ REGEL 4 — HTML VOLLSTÄNDIG ━━━
Du MUSST das HTML vollständig ausgeben — kein Abbrechen, keine Kürzungen.
Schreibe bis zum letzten </section> Tag.

WEITERE REGELN:
- NUR Tailwind CDN Klassen — keine arbitrary [value] Klassen außer CSS Custom Properties.
- DENSITY RULE: MAX 1 Content-Typ pro Bento-Kachel — EINER von: stat | image | list | badge-row.
- Responsive: grid-cols-1 als Base, dann md:/lg: Breakpoints.
- min-h-screen IMMER mit md: Präfix: md:min-h-screen.
- Alle Buttons/Links: min py-3 (44px Touch-Target).
- IIFE für alle inline Scripts: ;(function(){ ... })();
- Alle @keyframes in <style> Tag, mit @media (prefers-reduced-motion: no-preference) Wrapper.
- Icons: NUR aus der Icon Library — niemals SVG-Paths erfinden.
- Bilder: picsum.photos URLs mit konkreten IDs (z.B. https://picsum.photos/seed/construction/800/600).
- Root-Element: overflow-hidden isolate Klassen.

${ICON_LIBRARY}`
    : `You are a senior frontend engineer implementing hero sections in Tailwind CSS.
Output: ONLY raw HTML — no markdown, no code fences, no explanations.
First character MUST be "<".

━━━ RULE 1 — NO HEX, NO RGB (CRITICAL) ━━━
You MUST NEVER write hex values or RGB values. Not in style="", not in <style> blocks, nowhere.
WRONG: style="background: #1c1c1c"  background: #161616;  color: rgb(0,0,0)  border: 1px solid #444
CORRECT: class="bg-gray-900"  style="background: var(--color-surface)"  class="border-white/10"
Only allowed: Tailwind classes (bg-gray-900, text-white, border-gray-700 etc.) OR CSS Custom Properties (var(--color-*)).

━━━ RULE 2 — GERMAN HEADLINES (CRITICAL) ━━━
NEVER text-5xl/6xl/7xl for German text. Always clamp():
WRONG: class="text-6xl font-bold"
CORRECT: style="font-size: clamp(1.8rem, 3.5vw, 3rem)" class="font-bold"

━━━ RULE 3 — DECORATIVE SVGS ━━━
All decorative SVGs (icons without text context) need aria-hidden="true".
WRONG: <svg viewBox="...">...
CORRECT: <svg viewBox="..." aria-hidden="true">...

━━━ RULE 4 — COMPLETE HTML ━━━
You MUST output complete HTML — no truncation, no cutting short.
Write until the final </section> closing tag.

ADDITIONAL RULES:
- ONLY Tailwind CDN classes — no arbitrary [value] classes except CSS Custom Properties.
- DENSITY RULE: MAX 1 content type per bento card — ONE of: stat | image | list | badge-row.
- Responsive: grid-cols-1 as base, then md:/lg: breakpoints.
- min-h-screen ALWAYS with md: prefix: md:min-h-screen.
- All buttons/links: min py-3 (44px touch target).
- IIFE for all inline scripts: ;(function(){ ... })();
- All @keyframes in <style> tag, with @media (prefers-reduced-motion: no-preference) wrapper.
- Icons: ONLY from Icon Library — never invent SVG paths.
- Images: picsum.photos URLs with specific IDs (e.g. https://picsum.photos/seed/construction/800/600).
- Root element: overflow-hidden isolate classes.

${ICON_LIBRARY}`
}

function buildQASystem(): string {
  return `You are an HTML/CSS validator. Respond ONLY with valid JSON — no markdown, no explanations.
Check the provided HTML and return:
{
  "valid": boolean,
  "errors": [{ "type": string, "message": string, "severity": "error"|"warning", "auto_fixable": boolean }],
  "score": number (0-100)
}
Check for:
1. Hardcoded hex colors (should use CSS vars)
2. German text with text-5xl or larger (should use clamp())
3. @keyframes without prefers-reduced-motion wrapper
4. grid-cols-X without grid-cols-1 base
5. min-h-screen without md: prefix
6. Buttons/links without py-3 minimum
7. Bento cards with multiple content types (density violation)
8. Images without proper alt text
9. Icon-only buttons without aria-label
10. Inline scripts not wrapped in IIFE`
}

// ─── Layout selector based on content inventory ───────────────────────────────

function pickHeroLayout(inv: V3Request['contentInventory']): string {
  if (!inv) return 'split-50'
  if (inv.hasStats && inv.hasVisual && inv.hasLogos) return 'bento-3col'
  if (inv.hasStats && inv.hasVisual) return 'bento-asymmetric-right'
  if (inv.hasVisual && inv.hasLogos) return 'editorial-split'
  if (inv.hasVisual) return 'bento-asymmetric-right'
  if (inv.hasDemo) return 'bento-asymmetric-right'
  return 'centered'
}

function buildLayoutDirective(layoutId: string, lang: 'de' | 'en'): string {
  const de = lang === 'de'
  const layouts: Record<string, string> = {
    'bento-3col': de
      ? `LAYOUT (PFLICHT): Bento 3-Spalten
- grid-cols-1 lg:grid-cols-12 gap-6
- Links (lg:col-span-5): Eyebrow + Headline + Subline + CTAs
- Mitte (lg:col-span-3): Stats-Kachel (NUR Zahlen + Labels, max 4 Stats)
- Rechts (lg:col-span-4): Visual-Kachel (NUR ein Bild/Illustration)
- Unten (lg:col-span-12): Trust-Logo-Streifen (max 5 Logos als Text)
- Jede Kachel: NUR EIN Content-Typ`
      : `LAYOUT (MANDATORY): 3-column bento
- grid-cols-1 lg:grid-cols-12 gap-6
- Left (lg:col-span-5): eyebrow + headline + subline + CTAs
- Mid (lg:col-span-3): stats card (ONLY numbers + labels, max 4 stats)
- Right (lg:col-span-4): visual card (ONLY one image/illustration)
- Bottom (lg:col-span-12): trust logo strip (max 5 logos as text)
- Each card: ONLY ONE content type`,

    'split-50': de
      ? `LAYOUT (PFLICHT): Split 50/50
- grid-cols-1 md:grid-cols-2 gap-10 items-center
- Links: Eyebrow + Headline + Subline + CTAs + kurze Trust-Zeile
- Rechts: eine große Visual-Kachel (Bild) mit kleiner Caption
- Kein Bento, keine extra Reihen`
      : `LAYOUT (MANDATORY): Split 50/50
- grid-cols-1 md:grid-cols-2 gap-10 items-center
- Left: eyebrow + headline + subline + CTAs + short trust line
- Right: one large visual card (image) with small caption
- No bento, no extra rows`,

    'centered': de
      ? `LAYOUT (PFLICHT): Centered
- max-w-3xl mx-auto text-center
- Reihenfolge: Eyebrow → Headline → Subline → CTAs → Trust-Zeile
- Kein Bild, kein Side-by-side`
      : `LAYOUT (MANDATORY): Centered
- max-w-3xl mx-auto text-center
- Order: eyebrow → headline → subline → CTAs → trust line
- No image, no side-by-side`,

    'editorial-split': de
      ? `LAYOUT (PFLICHT): Editorial Split
- grid-cols-1 lg:grid-cols-12 gap-10
- Links (lg:col-span-6): stark typografisch (Headline/Subline/CTA)
- Rechts (lg:col-span-6): Bild in ruhigem Frame + Logo-Strip darunter
- Viel Whitespace, dünne Divider`
      : `LAYOUT (MANDATORY): Editorial split
- grid-cols-1 lg:grid-cols-12 gap-10
- Left (lg:col-span-6): typography-led (headline/subline/CTA)
- Right (lg:col-span-6): image in calm frame + logo strip below
- Lots of whitespace, thin dividers`,

    'bento-2col': de
      ? `LAYOUT (PFLICHT): Bento 2-Spalten
- grid-cols-1 lg:grid-cols-2 gap-6
- Links: Headline + Subline + CTAs + Stats-Kachel darunter
- Rechts: Visual-Kachel (volles Bild, keine anderen Inhalte)`
      : `LAYOUT (MANDATORY): 2-column bento
- grid-cols-1 lg:grid-cols-2 gap-6
- Left: headline + subline + CTAs + stats card below
- Right: visual card (full image, no other content)`,

    'bento-asymmetric-right': de
      ? `LAYOUT (PFLICHT): Bento Asymmetrisch Rechts (Demo-fokussiert)
- grid-cols-1 lg:grid-cols-12 gap-6
- Links (lg:col-span-5): Eyebrow + Headline + Subline + CTAs + Stats
- Rechts (lg:col-span-7): großer Demo/Screenshot Container`
      : `LAYOUT (MANDATORY): Bento asymmetric right (demo-focused)
- grid-cols-1 lg:grid-cols-12 gap-6
- Left (lg:col-span-5): eyebrow + headline + subline + CTAs + stats
- Right (lg:col-span-7): large demo/screenshot container`,
  }
  return layouts[layoutId] ?? layouts['split-50']
}

// ─── HTML completeness check + continuation ──────────────────────────────────

function isHtmlComplete(html: string): boolean {
  const trimmed = html.trimEnd()
  // Must close with a proper closing tag
  if (!trimmed.endsWith('</section>') && !trimmed.endsWith('</div>')) return false
  // Must not have a dangling partial open tag at the end
  if (/<[^>]*$/.test(trimmed)) return false
  // Detect mid-attribute truncation: any attr="...incomplete (no closing quote)
  // Strategy: find the last opening tag '<' that has no matching '>' after it,
  // OR count unmatched double-quotes after the last complete tag.
  // Simpler: check if the text after the last '>' has an odd number of '"' chars
  // (meaning we're inside an attribute value).
  const lastClose = trimmed.lastIndexOf('>')
  const afterLastTag = lastClose === -1 ? trimmed : trimmed.slice(lastClose + 1)
  // Also check everything from the last opening '<' onwards
  const lastOpen = trimmed.lastIndexOf('<')
  if (lastOpen > lastClose) {
    // There's an open tag with no closing '>' — definitely truncated
    return false
  }
  // Check for odd number of quotes in the last tag (mid-attribute)
  const lastTagStart = trimmed.lastIndexOf('<', lastClose)
  if (lastTagStart !== -1) {
    const lastTag = trimmed.slice(lastTagStart, lastClose + 1)
    const quoteCount = (lastTag.match(/"/g) ?? []).length
    if (quoteCount % 2 !== 0) return false // odd quotes = inside an attribute value
  }
  void afterLastTag // suppress unused warning
  // Basic tag balance: open sections must all be closed
  const openSec  = (trimmed.match(/<section[\s>]/g) ?? []).length
  const closeSec = (trimmed.match(/<\/section>/g) ?? []).length
  if (openSec !== closeSec) return false
  return true
}

async function continueHtml(
  partial: string,
  model: string,
  system: string,
  onChunk: (c: string) => void,
  label: string
): Promise<string> {
  const p = getProvider(model)
  let continuation = ''
  await p.stream(
    {
      model,
      max_tokens: 3000,
      temperature: 0.1,
      system,
      messages: [
        { role: 'user', content: 'Generate the hero section HTML.' },
        { role: 'assistant', content: partial },
        { role: 'user', content: 'The HTML was cut off. Continue EXACTLY from where it stopped — output only the remaining HTML, nothing else. Do not repeat any already-written content.' },
      ],
    },
    (chunk) => { continuation += chunk; onChunk(chunk) },
    { pass: 'pass1_structure', label }
  )
  return partial + continuation
}

// ─── Bento slot builders ──────────────────────────────────────────────────────

function buildSlotSystem(lang: 'de' | 'en', noHexRule: string, iconLib: string): string {
  return lang === 'de'
    ? `Du bist Senior Frontend Engineer der einzelne Bento-Kacheln in Tailwind CSS implementiert.
Output: NUR rohes HTML — kein Markdown, keine Code-Fences, keine Erklärungen.
Erstes Zeichen MUSS "<" sein. Letztes Zeichen MUSS ">" sein.

${noHexRule}

━━━ SCHRIFTGRÖSSEN (KRITISCH) ━━━
Du renderst in einer SCHMALEN SPALTE (ca. 300–450px), NICHT fullscreen.
NIEMALS text-5xl/6xl/7xl/8xl/9xl verwenden.
Headline in der linken Spalte: style="font-size:clamp(1.6rem,2.2vw,2.4rem)"
Stat-Zahlen: style="font-size:clamp(1.4rem,2vw,2.2rem)"
Alle anderen Texte: text-sm oder text-base (max text-lg).
overflow-hidden auf dem Wrapper-Element IMMER setzen.

WEITERE REGELN:
- NUR Tailwind CDN Klassen oder CSS Custom Properties (var(--color-*)).
- Alle dekorativen SVGs: aria-hidden="true".
- KEIN <style> Block, KEINE @keyframes, KEINE CSS-Animationen — nur statisches HTML+Tailwind.
- Alle Buttons/Links: min py-3.
- Bilder: picsum.photos URLs mit konkreten IDs.
- DENSITY RULE: NUR EIN Content-Typ pro Kachel.
${iconLib}`
    : `You are a senior frontend engineer implementing individual bento cards in Tailwind CSS.
Output: ONLY raw HTML — no markdown, no code fences, no explanations.
First character MUST be "<". Last character MUST be ">".

${noHexRule}

━━━ FONT SIZES (CRITICAL) ━━━
You are rendering into a NARROW COLUMN (~300–450px wide), NOT fullscreen.
NEVER use text-5xl/6xl/7xl/8xl/9xl.
Left column headline: style="font-size:clamp(1.6rem,2.2vw,2.4rem)"
Stat numbers: style="font-size:clamp(1.4rem,2vw,2.2rem)"
All other text: text-sm or text-base (max text-lg).
ALWAYS set overflow-hidden on the wrapper element.

ADDITIONAL RULES:
- ONLY Tailwind CDN classes or CSS Custom Properties (var(--color-*)).
- All decorative SVGs: aria-hidden="true".
- NO <style> blocks, NO @keyframes, NO CSS animations — static HTML+Tailwind only.
- All buttons/links: min py-3.
- Images: picsum.photos URLs with specific IDs.
- DENSITY RULE: ONLY ONE content type per card.
${iconLib}`
}

const NO_HEX_RULE = `━━━ NO HEX / NO RGB (CRITICAL) ━━━
NEVER write #hex or rgb() values anywhere — not in style="", not in <style> blocks.
WRONG: background: #1c1c1c  border: 1px solid #444  color: rgb(0,0,0)
CORRECT: class="bg-gray-900"  style="background:var(--color-surface)"  class="border-white/10"`

// ─── Deterministic Bento Density Validator ────────────────────────────────────
// Parses each lg:col-span-* slot independently, counts content-type signals.
// Returns violations with slot name + found types. No AI needed.

type ContentType = 'stat' | 'image' | 'list' | 'badge-row' | 'cta' | 'text-block' | 'video' | 'form'
type BentoViolation = { slot: string; types: ContentType[]; count: number }

function detectContentTypes(slotHtml: string): ContentType[] {
  const found = new Set<ContentType>()
  const h = slotHtml.toLowerCase()

  // stat: large number + unit pattern — e.g. "200+", "98%", "$1M"
  if (/\b\d+[%+km]?\b/.test(h) && /<[^>]+class="[^"]*(?:text-\d|font-bold|font-black)[^"]*"/.test(h)) found.add('stat')

  // image: <img or background-image or picsum
  if (/<img[\s>]|picsum\.photos|background.*url\(/.test(h)) found.add('image')

  // list: <ul or <ol or multiple <li
  if (/<ul[\s>]|<ol[\s>]/.test(h) || (h.match(/<li[\s>]/g) ?? []).length >= 2) found.add('list')

  // badge-row: multiple small inline spans that look like trust/logo badges
  const badgeMatches = h.match(/<span[^>]+class="[^"]*(?:rounded|badge|pill|tag)[^"]*"/g) ?? []
  if (badgeMatches.length >= 3) found.add('badge-row')

  // cta: <a or <button with py-3 or similar CTA classes
  if (/<(?:a|button)[^>]+(?:py-3|py-4|btn|cta)/i.test(h)) found.add('cta')

  // video: <video or iframe[youtube/vimeo]
  if (/<video[\s>]|youtube\.com|vimeo\.com|loom\.com/.test(h)) found.add('video')

  // form: <form or <input
  if (/<form[\s>]|<input[\s>]/.test(h)) found.add('form')

  // text-block: paragraph with more than ~30 chars (prose content)
  const pMatches = h.match(/<p[^>]*>([^<]{30,})<\/p>/g) ?? []
  if (pMatches.length >= 1) found.add('text-block')

  return Array.from(found)
}

function checkBentoDensity(slots: Record<string, string>): BentoViolation[] {
  const violations: BentoViolation[] = []
  for (const [slotId, slotHtml] of Object.entries(slots)) {
    if (!slotHtml) continue
    const types = detectContentTypes(slotHtml)
    // trust strip (col-span-12) is exempt — it's intentionally mixed
    if (slotId === 'trust') continue
    // density violation: more than 1 non-cta content type
    // (cta is always allowed alongside one primary type)
    const primary = types.filter(t => t !== 'cta')
    if (primary.length > 1) {
      violations.push({ slot: slotId, types, count: primary.length })
    }
  }
  return violations
}

// ─── Post-generation Auto-Fix ─────────────────────────────────────────────────
// Applied deterministically after Developer output, before QA.
// Fixes: inline rgba/hex → var(), keyframes usage gating, text-5xl→clamp,
//        custom grid-cols without base, html truncation closure.

// Load a bento slot reference HTML from the section library (returns empty string if not found)
// Picks B-variant for tech-dark/minimal-clean paradigms to inject structural variety
function loadSlotReference(slotType: 'bento-slot-left' | 'bento-slot-stats' | 'bento-slot-visual', paradigm?: string): string {
  const useVariantB = paradigm === 'tech-dark' || paradigm === 'minimal-clean'
  const fileMap: Record<string, string> = {
    'bento-slot-left':   useVariantB ? 'bento-slot-left-b.html'   : 'bento-slot-left.html',
    'bento-slot-stats':  'bento-slot-stats.html',
    'bento-slot-visual': useVariantB ? 'bento-slot-visual-b.html' : 'bento-slot-visual.html',
  }
  try {
    const filePath = path.join(process.cwd(), 'src/data/section-library', fileMap[slotType])
    return fs.readFileSync(filePath, 'utf-8').trim()
  } catch {
    return ''
  }
}

// Deterministically ensures the root element of a bento slot has h-full flex flex-col
// so CSS Grid's items-stretch can make all columns equal height regardless of LLM output.
function enforceSlotHFull(slotHtml: string): string {
  return slotHtml.replace(/^(\s*<\w+)(\s+class="([^"]*)")?/, (match, tag, _attrFull, existing) => {
    const classes = (existing ?? '').split(/\s+/).filter(Boolean)
    const needed = ['h-full', 'flex', 'flex-col']
    needed.forEach(c => { if (!classes.includes(c)) classes.push(c) })
    return `${tag} class="${classes.join(' ')}"`
  })
}

type FixLog = { rule: string; count: number }

function applyV3AutoFix(html: string, lang: 'de' | 'en'): { html: string; fixes: FixLog[] } {
  const fixes: FixLog[] = []
  let out = html

  // ── Fix 1: ANY hardcoded hex color → nearest CSS variable ───────────────────
  // Generic classifier: analyzes hue/saturation/lightness of any #rgb or #rrggbb
  // to map it to the correct semantic CSS var — no hardcoded list needed.
  let hexCount = 0

  function hexToHsl(hex: string): [number, number, number] {
    const h = hex.replace('#', '')
    const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h
    const r = parseInt(full.slice(0,2),16)/255
    const g = parseInt(full.slice(2,4),16)/255
    const b = parseInt(full.slice(4,6),16)/255
    const max = Math.max(r,g,b), min = Math.min(r,g,b)
    const l = (max+min)/2
    if (max === min) return [0, 0, l]
    const d = max - min
    const s = l > 0.5 ? d/(2-max-min) : d/(max+min)
    let hue = 0
    if (max === r) hue = ((g-b)/d + (g<b?6:0))/6
    else if (max === g) hue = ((b-r)/d + 2)/6
    else hue = ((r-g)/d + 4)/6
    return [hue*360, s, l]
  }

  function classifyHex(hex: string): string {
    const [hue, sat, lit] = hexToHsl(hex)
    // Near-white / very light → text color
    if (lit > 0.85) return 'var(--color-text)'
    // Near-black / very dark → background or surface
    if (lit < 0.12) return 'var(--color-background)'
    if (lit < 0.22) return 'var(--color-surface)'
    // Mid-grey (low saturation) → text-muted
    if (sat < 0.12 && lit >= 0.35 && lit <= 0.65) return 'var(--color-text-muted)'
    // Saturated colors: classify by hue
    if (sat >= 0.25) {
      // Blues / indigos / violets (200°–290°) → primary
      if (hue >= 200 && hue <= 290) return 'var(--color-primary)'
      // Everything else saturated (yellows, golds, oranges, reds, greens) → accent
      return 'var(--color-accent)'
    }
    // Dark muted tones → surface
    if (lit < 0.35) return 'var(--color-surface)'
    return 'var(--color-text-muted)'
  }

  const HEX_PATTERN = /#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g

  function classifyRgb(r: number, g: number, b: number): string {
    const max = Math.max(r,g,b)/255, min = Math.min(r,g,b)/255
    const l = (max+min)/2
    if (l > 0.85) return 'var(--color-text)'
    if (l < 0.12) return 'var(--color-background)'
    if (l < 0.22) return 'var(--color-surface)'
    const d = max - min
    if (d < 0.01) {
      if (l >= 0.35 && l <= 0.65) return 'var(--color-text-muted)'
      return l < 0.35 ? 'var(--color-surface)' : 'var(--color-text)'
    }
    const s = l > 0.5 ? d/(2-max-min) : d/(max+min)
    if (s < 0.12) return 'var(--color-text-muted)'
    let hue = 0
    const rn=r/255,gn=g/255,bn=b/255
    const mx=Math.max(rn,gn,bn),mn=Math.min(rn,gn,bn),dl=mx-mn
    if (mx===rn) hue=((gn-bn)/dl+(gn<bn?6:0))/6
    else if (mx===gn) hue=((bn-rn)/dl+2)/6
    else hue=((rn-gn)/dl+4)/6
    hue*=360
    if (hue>=200&&hue<=290) return 'var(--color-primary)'
    return 'var(--color-accent)'
  }

  function replaceHexInString(str: string): string {
    // Replace rgba(r,g,b,a) and rgb(r,g,b) with CSS vars
    let result = str.replace(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*[\d.]+)?\s*\)/g, (_m, r, g, b) => {
      hexCount++
      return classifyRgb(parseInt(r), parseInt(g), parseInt(b))
    })
    // Replace #hex
    result = result.replace(HEX_PATTERN, (match) => {
      hexCount++
      return classifyHex(match)
    })
    return result
  }

  // Apply in style="" attributes only (not class="", not data URIs)
  out = out.replace(/style="([^"]*)"/g, (_m, styleVal) => {
    return `style="${replaceHexInString(styleVal)}"`
  })
  // Apply in <style>...</style> blocks (skip data: URIs inline)
  out = out.replace(/(<style[^>]*>)([\s\S]*?)(<\/style>)/g, (_m, open, body, close) => {
    // Don't replace inside url("data:...") or url('data:...')
    const fixed = body.replace(/(url\(['"]?data:[^)]*['"]?\))|#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g,
      (m: string, dataUri: string) => {
        if (dataUri) return m // preserve data URIs
        hexCount++
        return classifyHex(m)
      }
    )
    return `${open}${fixed}${close}`
  })
  if (hexCount > 0) fixes.push({ rule: 'hex→css-var', count: hexCount })

  // ── Fix 2: normalize all stats KPI numbers to a single consistent font-size ─
  // The bento-slot-stats model sometimes uses different sizes per number.
  // Force all elements that look like KPI numbers (large font-size clamp) to the same value.
  let statsNormCount = 0
  const KPI_FONT = '2rem'
  // Normalize: any tabular-nums element with font-size → cap to 2rem (fits narrow col-span-3)
  // Catches both clamp() and raw rem/px values that are too large
  out = out.replace(/\btabular-nums\b([^"]*?)font-size:\s*(?:clamp\([^)]+\)|[\d.]+(?:rem|px|em))/g, (_m, mid) => {
    statsNormCount++
    return `tabular-nums${mid}font-size:${KPI_FONT}`
  })
  if (statsNormCount > 0) fixes.push({ rule: 'stats-kpi-font-normalized', count: statsNormCount })

  // ── Fix 3a: text-{5xl|6xl|7xl} class → clamp() ────────────────────────────
  let clampCount = 0
  const CLAMP_MAP: Record<string, string> = {
    '5xl': 'clamp(1.8rem, 3.5vw, 3rem)',
    '6xl': 'clamp(2.2rem, 4.5vw, 3.75rem)',
    '7xl': 'clamp(2.5rem, 5.5vw, 4.5rem)',
    '8xl': 'clamp(3rem, 6.5vw, 6rem)',
    '9xl': 'clamp(3.5rem, 8vw, 8rem)',
  }
  out = out.replace(/(<[^>]+\bclass="[^"]*)\b(?:(?:sm|md|lg|xl|2xl):)?text-(5xl|6xl|7xl|8xl|9xl)\b([^"]*"[^>]*>)/g,
    (match, pre, size, post) => {
      if (match.includes('font-size')) return match
      clampCount++
      const clamp = CLAMP_MAP[size] ?? CLAMP_MAP['5xl']
      const cleaned = match
        .replace(/\b(?:(?:sm|md|lg|xl|2xl):)?text-(5xl|6xl|7xl|8xl|9xl)\b/g, '')
        .replace(/class="(\s*)/, `class="`)
        .trim()
      return cleaned.replace(/>$/, ` style="font-size:${clamp}">`)
    }
  )
  if (clampCount > 0) fixes.push({ rule: 'text-5xl→clamp', count: clampCount })

  // ── Fix 3b: cap oversized inline font-size values (bento slot guard) ────────
  // The model sometimes ignores narrow-column rules and uses clamp(3rem,5vw,6rem)
  // in a slot that's only 400px wide. Cap the max value to 2.5rem for safety.
  let capCount = 0
  out = out.replace(/font-size:\s*clamp\(([^,]+),([^,]+),([^)]+)\)/g, (_m, minV, midV, maxV) => {
    const maxRem = parseFloat(maxV)
    if (isNaN(maxRem) || maxRem <= 2.5) return _m
    capCount++
    // Scale down proportionally, keep min/vw ratio
    const minRem = parseFloat(minV)
    const ratio = 2.5 / maxRem
    const newMin = (minRem * ratio).toFixed(2) + 'rem'
    const newMax = '2.5rem'
    // Keep the vw value but scale it too
    const vwMatch = midV.match(/([\d.]+)vw/)
    const newMid = vwMatch ? `${(parseFloat(vwMatch[1]) * ratio).toFixed(2)}vw` : midV.trim()
    return `font-size:clamp(${newMin},${newMid},${newMax})`
  })
  if (capCount > 0) fixes.push({ rule: 'font-size-cap-2.5rem', count: capCount })

  // ── Fix 4: custom grid-cols-[…] without grid-cols-1 base ─────────────────
  let gridCount = 0
  out = out.replace(/class="([^"]*)grid-cols-\[([^\]]+)\]([^"]*)"/g, (match, pre, val, post) => {
    if (pre.includes('grid-cols-1') || post.includes('grid-cols-1')) return match
    gridCount++
    return `class="${pre}grid-cols-1 grid-cols-[${val}]${post}"`
  })
  if (gridCount > 0) fixes.push({ rule: 'grid-cols-missing-base', count: gridCount })

  // ── Fix 5: Ensure HTML is closed (truncation guard) ───────────────────────
  // Handles: mid-tag truncation (e.g. stroke="cu"), unclosed style/script blocks,
  // unclosed divs/sections
  let closureCount = 0

  // 5a: Truncated inside a tag attribute — strip the dangling partial tag
  out = out.replace(/<[^>]*$/, () => {
    closureCount++
    return '' // drop the incomplete tag entirely
  })

  // 5a2: Truncated mid any-attribute value — remove the broken attribute entirely
  // Matches: anyattr="...value-without-closing-quote at end of string
  out = out.replace(/\s+[\w-]+="[^"]*$/g, () => {
    closureCount++
    return '' // drop the incomplete attribute
  })

  // 5b: Unclosed <style> block
  const openStyles = (out.match(/<style>/g) ?? []).length
  const closeStyles = (out.match(/<\/style>/g) ?? []).length
  if (openStyles > closeStyles) { out += '</style>'; closureCount++ }

  // 5c: Unclosed <script> block
  const openScripts = (out.match(/<script[\s>]/g) ?? []).length
  const closeScripts = (out.match(/<\/script>/g) ?? []).length
  if (openScripts > closeScripts) { out += '})();</script>'; closureCount++ }

  // 5d: Balance divs and sections
  const openDivs = (out.match(/<div[\s>]/g) ?? []).length
  const closeDivs = (out.match(/<\/div>/g) ?? []).length
  const openSections = (out.match(/<section[\s>]/g) ?? []).length
  const closeSections = (out.match(/<\/section>/g) ?? []).length
  let tail = ''
  for (let i = 0; i < openDivs - closeDivs; i++) { tail += '</div>'; closureCount++ }
  for (let i = 0; i < openSections - closeSections; i++) { tail += '</section>'; closureCount++ }
  if (tail) out = out + tail

  if (closureCount > 0) fixes.push({ rule: 'html-truncation-closed', count: closureCount })

  // ── Fix 6: strip <style> blocks entirely from slot HTML ───────────────────
  // Slots must be static HTML+Tailwind only — <style> blocks cause truncation and QA failures.
  let styleStripCount = 0
  out = out.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, () => {
    styleStripCount++
    return ''
  })
  if (styleStripCount > 0) fixes.push({ rule: 'slot-style-stripped', count: styleStripCount })

  // ── Fix 7: replace hex colors in inline event handlers ────────────────────
  // onmouseover/onmouseout/onclick attributes frequently contain hardcoded hex.
  // Replace using the same HSL classifier.
  let eventHexCount = 0
  const EVENT_ATTR = /\b(onmouse(?:over|out|enter|leave)|onclick|onfocus|onblur)="([^"]*)"/gi
  out = out.replace(EVENT_ATTR, (_m, attr, val) => {
    const fixed = val.replace(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g, (hex: string) => {
      eventHexCount++
      return classifyHex(hex)
    })
    return `${attr}="${fixed}"`
  })
  if (eventHexCount > 0) fixes.push({ rule: 'event-handler-hex→css-var', count: eventHexCount })

  return { html: out, fixes }
}

// ─── Safe JSON parse ──────────────────────────────────────────────────────────

function tryParseJson<T>(raw: string, fallback: T): T {
  try {
    const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '')
    return JSON.parse(cleaned) as T
  } catch {
    return fallback
  }
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json() as V3Request
  const {
    artDirectorModel = 'claude-sonnet-4-6',
    developerModel = 'claude-sonnet-4-6',
    fastModel = 'gpt-5.4-mini-2026-03-17',
    industry,
    paradigm: paradigmFromBody,
    companyName,
    usp,
    language = 'de',
    conversionGoal = 'b2b-contact',
    layoutOverride,
    paradigmOverride,
    creativityLevel = 'balanced',
    brandContext,
    contentInventory,
  } = body

  // Build brand context block injected into Art Director prompt
  const brandBlock = brandContext && Object.values(brandContext).some(Boolean)
    ? `\nBRAND CONTEXT (must be respected — do NOT deviate from these brand colours/fonts):\n${[
        brandContext.primaryColor  ? `- Primary colour: ${brandContext.primaryColor}` : '',
        brandContext.secondaryColor ? `- Secondary colour: ${brandContext.secondaryColor}` : '',
        brandContext.accentColor   ? `- Accent colour: ${brandContext.accentColor}` : '',
        brandContext.fontHeadline  ? `- Headline font: ${brandContext.fontHeadline}` : '',
        brandContext.fontBody      ? `- Body font: ${brandContext.fontBody}` : '',
        brandContext.logoStyle     ? `- Logo style: ${brandContext.logoStyle}` : '',
        brandContext.designNotes   ? `- CD notes: ${brandContext.designNotes}` : '',
      ].filter(Boolean).join('\n')}`
    : ''

  // Temperature map: normal = safe/predictable, balanced = current default, free = wild/surprising
  const tempArtDirector = creativityLevel === 'normal' ? 0.5 : creativityLevel === 'free' ? 1.0 : 0.92
  const tempDesigner    = creativityLevel === 'normal' ? 0.1 : creativityLevel === 'free' ? 0.85 : 0.2
  const tempDeveloper   = creativityLevel === 'normal' ? 0.2 : creativityLevel === 'free' ? 0.65 : 0.35
  const tempTexter      = creativityLevel === 'normal' ? 0.4 : creativityLevel === 'free' ? 0.95 : 0.7

  if (!industry || !paradigmFromBody || !companyName || !usp) {
    return Response.json({ error: 'Missing required fields: industry, paradigm, companyName, usp' }, { status: 400 })
  }

  const encoder = new TextEncoder()
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()
  let closed = false

  const write = (obj: unknown) => {
    if (closed) return
    writer.write(encoder.encode(sseEvent(obj))).catch(() => {})
  }
  const close = () => {
    if (closed) return
    closed = true
    writer.close().catch(() => {})
  }

  const run = async () => {
    try {

      // ════════════════════════════════════════════════════════════════
      // PHASE 1 — Page-wide (Calls 1–4, einmalig)
      // ════════════════════════════════════════════════════════════════
      write({ type: 'phase', phase: 1, message: 'Phase 1 — Moodboard & Strategie…' })

      // ── Call 1: Conversion Strategist ─────────────────────────────
      write({ type: 'status', call: 1, phase: 1, message: 'Call 1 — Conversion Strategist…' })
      let blueprintRaw = ''
      await getProvider(fastModel).stream(
        {
          model: fastModel, max_tokens: 800, temperature: 0.2,
          system: buildConversionStrategistSystem(language),
          messages: [{ role: 'user', content: `COMPANY: ${companyName}\nINDUSTRY: ${industry}\nUSP: ${usp}\nPARADIGM: ${paradigmFromBody}\nLANGUAGE: ${language}${contentInventory ? `\nCONTENT INVENTORY: ${JSON.stringify(contentInventory)}` : ''}` }],
        },
        (chunk) => { blueprintRaw += chunk },
        { pass: 'other', label: 'v3 Call 1 — Conversion Strategist' }
      )
      const blueprint = tryParseJson<ConversionBlueprint>(blueprintRaw, {
        strongestHook: usp, painPoint: '', solutionFrame: usp, proofType: 'stats',
        conversionBlockers: [], ctaApproach: language === 'de' ? 'Jetzt starten' : 'Get started',
        sectionOrder: 'Problem → Solution → Proof → CTA',
      })
      write({ type: 'call_complete', call: 1, phase: 1, blueprint })

      // ── Call 2: Art Director ───────────────────────────────────────
      write({ type: 'status', call: 2, phase: 1, message: 'Call 2 — Art Director…' })
      let artDirection = ''
      await getProvider(artDirectorModel).stream(
        {
          model: artDirectorModel, max_tokens: 500, temperature: tempArtDirector,
          system: buildArtDirectorSystem(language),
          messages: [{ role: 'user', content: `SECTION: hero\nINDUSTRY: ${industry}\nPARADIGM: ${paradigmFromBody}\nUSP: ${usp}\nCONVERSION HOOK: ${blueprint.strongestHook}${brandBlock}` }],
        },
        (chunk) => { artDirection += chunk; write({ type: 'art_direction_delta', text: chunk }) },
        { pass: 'other', label: 'v3 Call 2 — Art Director' }
      )
      artDirection = artDirection.trim()
      // Apply paradigm override: inject forced paradigm into artDirection string
      if (paradigmOverride) {
        artDirection = artDirection.replace(/paradigm:\s*\S+/i, `paradigm: ${paradigmOverride}`)
        if (!artDirection.includes('paradigm:')) artDirection = `paradigm: ${paradigmOverride}\n` + artDirection
      }
      const paradigm = (paradigmOverride || body.paradigm) as string
      write({ type: 'call_complete', call: 2, phase: 1, artDirection, paradigmOverride: paradigmOverride || null })

      // ── Calls 3 + 4 parallel: Fotograf + Animationsguru ──────────
      write({ type: 'status', call: 3, phase: 1, message: 'Calls 3+4 — Fotograf & Animationsguru (parallel)…' })
      let fotografRaw = ''
      let animRaw = ''
      await Promise.all([
        getProvider(fastModel).stream(
          {
            model: fastModel, max_tokens: 600, temperature: 0.7,
            system: buildFotografSystem(language),
            messages: [{ role: 'user', content: `SECTION: hero\nINDUSTRY: ${industry}\nPARADIGM: ${paradigm}\nUSP: ${usp}\nART DIRECTION: ${artDirection}\nCONVERSION HOOK: ${blueprint.strongestHook}` }],
          },
          (chunk) => { fotografRaw += chunk },
          { pass: 'other', label: 'v3 Call 3 — Fotograf' }
        ),
        getProvider(fastModel).stream(
          {
            model: fastModel, max_tokens: 800, temperature: 0.7,
            system: buildAnimationsguruSystem(language),
            messages: [{ role: 'user', content: `SECTION: hero\nINDUSTRY: ${industry}\nPARADIGM: ${paradigm}\nANIMATION BUDGET: moderate\nART DIRECTION: ${artDirection}` }],
          },
          (chunk) => { animRaw += chunk },
          { pass: 'other', label: 'v3 Call 4 — Animationsguru' }
        ),
      ])
      const imageBriefing = tryParseJson<ImageBriefing>(fotografRaw, {
        mood: 'professional, clean, confident', composition: 'centered',
        subject: `${industry} professional environment`,
        avoid: 'no stock photo smiles',
        picsumSeed: industry, picsumId: 200, overlayOpacity: 0,
      })
      const animStrategy = tryParseJson<AnimationStrategy>(animRaw, {
        overallMotion: 'subtle', heroEntranceEffect: 'fade-up 600ms',
        backgroundAnimation: 'none', stillElements: ['headline', 'cta'],
        hoverEffects: 'opacity transition', scrollBehavior: 'none',
        cssPattern: '',
      })
      write({ type: 'call_complete', call: 3, phase: 1, imageBriefing })
      write({ type: 'call_complete', call: 4, phase: 1, animStrategy })

      // ════════════════════════════════════════════════════════════════
      // PHASE 2 — Per Section (Calls 5–8)
      // ════════════════════════════════════════════════════════════════
      write({ type: 'phase', phase: 2, message: 'Phase 2 — Section Generation (hero)…' })

      // ── Call 5: Texter ─────────────────────────────────────────────
      write({ type: 'status', call: 5, phase: 2, message: 'Call 5 — Texter…' })
      let texterRaw = ''
      await getProvider(fastModel).stream(
        {
          model: fastModel, max_tokens: 1000, temperature: tempTexter,
          system: buildTexterSystem(language),
          messages: [{ role: 'user', content: `COMPANY: ${companyName}\nINDUSTRY: ${industry}\nUSP: ${usp}\nPARADIGM: ${paradigm}\nLANGUAGE: ${language}\nCONVERSION GOAL: ${conversionGoal}\n\nCONVERSION GOAL GUIDANCE:\n${CONVERSION_GOAL_GUIDANCE[conversionGoal] ?? CONVERSION_GOAL_GUIDANCE['b2b-contact']}\n\nCONVERSION BLUEPRINT:\n${JSON.stringify(blueprint)}\n\nART DIRECTION:\n${artDirection}\n\nIMAGE MOOD: ${imageBriefing.mood}\n\nCreate all hero section texts now.` }],
        },
        (chunk) => { texterRaw += chunk },
        { pass: 'other', label: 'v3 Call 5 — Texter' }
      )
      const texts = tryParseJson<TexterOutput>(texterRaw, {
        eyebrow: industry.toUpperCase(), headlinePart1: companyName,
        headlinePart2: usp.slice(0, 30), subline: usp,
        ctaPrimary: language === 'de' ? 'Jetzt starten' : 'Get started',
        ctaSecondary: language === 'de' ? 'Mehr erfahren' : 'Learn more',
        microCopy: language === 'de' ? 'Kostenlos · Unverbindlich' : 'Free · No commitment',
        stats: [], trustSignals: [], tonalityNote: '',
      })
      write({ type: 'call_complete', call: 5, phase: 2, texts })

      // ── Call 6: Designer / Strukturgeber ───────────────────────────
      write({ type: 'status', call: 6, phase: 2, message: 'Call 6 — Designer…' })
      let designerRaw = ''
      const suggestedLayout = pickHeroLayout(contentInventory)
      await getProvider(fastModel).stream(
        {
          model: fastModel, max_tokens: 800, temperature: tempDesigner,
          system: buildDesignerSystem(language),
          messages: [{ role: 'user', content: `SECTION: hero\nINDUSTRY: ${industry}\nPARADIGM: ${paradigm}\nSUGGESTED LAYOUT: ${suggestedLayout}\n\nCONTENT INVENTORY: ${JSON.stringify(contentInventory)}\n\nART DIRECTION: ${artDirection}\n\nTEXTS AVAILABLE: eyebrow="${texts.eyebrow}", h1="${texts.headlinePart1} / ${texts.headlinePart2}", subline="${texts.subline}", stats=${texts.stats.length}, trustSignals=${texts.trustSignals.length}\n\nIMAGE BRIEFING: ${JSON.stringify(imageBriefing)}\n\nCreate the structural mockup now.` }],
        },
        (chunk) => { designerRaw += chunk },
        { pass: 'other', label: 'v3 Call 6 — Designer' }
      )
      const designerMockup = tryParseJson<DesignerMockup>(designerRaw, {
        layoutId: suggestedLayout,
        gridClasses: 'grid grid-cols-1 lg:grid-cols-12 gap-6',
        slotAssignment: { left: 'eyebrow+h1+subline+cta', right: 'image' },
        typographyDecisions: 'H1: clamp(1.8rem,3.5vw,3rem) font-bold',
        spacingNotes: 'py-16 md:py-24',
        visualHierarchy: 'H1 dominates, CTA secondary',
      })
      const resolvedLayoutId = layoutOverride || designerMockup.layoutId || suggestedLayout
      write({ type: 'call_complete', call: 6, phase: 2, designerMockup, layoutId: resolvedLayoutId })

      // ── Call 7: Developer (parallel slots for bento, single for others) ──
      write({ type: 'status', call: 7, phase: 2, message: 'Call 7 — Developer…' })
      const imageUrl = `https://picsum.photos/id/${imageBriefing.picsumId}/800/600`
      const devSystem = buildDeveloperSystem(language)
      const slotSystem = buildSlotSystem(language, NO_HEX_RULE, ICON_LIBRARY)
      const sharedContext = `ART DIRECTION: ${artDirection}${brandBlock}
COMPANY: ${companyName} | INDUSTRY: ${industry} | PARADIGM: ${paradigm} | LANGUAGE: ${language}
TEXTS: eyebrow="${texts.eyebrow}"${texts.eyebrowVariants?.length ? ` | eyebrow-variants: [${texts.eyebrowVariants.map(v => `"${v}"`).join(', ')}] — pick the best fit for the paradigm` : ''} | h1="${texts.headlinePart1} / ${texts.headlinePart2}" | subline="${texts.subline}"
CTA: "${texts.ctaPrimary}" / "${texts.ctaSecondary}" | micro="${texts.microCopy}"
Stats: ${JSON.stringify(texts.stats)} | Trust: ${texts.trustSignals.join(' · ')}
Tonality: ${texts.tonalityNote}
IMAGE: ${imageUrl} | mood: ${imageBriefing.mood} | avoid: ${imageBriefing.avoid}
ANIMATION: entrance="${animStrategy.heroEntranceEffect}" | bg="${animStrategy.backgroundAnimation}" | hover="${animStrategy.hoverEffects}"
CSS PATTERN: ${animStrategy.cssPattern || 'none'}
DESIGNER MOCKUP: layout=${resolvedLayoutId} | grid="${designerMockup.gridClasses}" | typography="${designerMockup.typographyDecisions}" | spacing="${designerMockup.spacingNotes}" | hierarchy="${designerMockup.visualHierarchy}"`

      let html = ''

      if (resolvedLayoutId === 'bento-3col') {
        write({ type: 'status', call: 7, phase: 2, message: 'Call 7 — Developer (4 parallel bento slots)…' })

        // Load reference examples from section library
        const refLeft   = loadSlotReference('bento-slot-left',   paradigm)
        const refStats  = loadSlotReference('bento-slot-stats',   paradigm)
        const refVisual = loadSlotReference('bento-slot-visual',  paradigm)
        const refLeftBlock   = refLeft   ? (language === 'de' ? `\nINSPIRATION (nur als CSS/HTML-Referenz — Struktur darf und soll abweichen, Designer-Intent hat Vorrang):\n${refLeft}`   : `\nINSPIRATION (CSS/HTML reference only — structure may and should deviate, designer intent takes priority):\n${refLeft}`)   : ''
        const refStatsBlock  = refStats  ? (language === 'de' ? `\nINSPIRATION (nur als CSS/HTML-Referenz — Struktur darf und soll abweichen, Designer-Intent hat Vorrang):\n${refStats}`  : `\nINSPIRATION (CSS/HTML reference only — structure may and should deviate, designer intent takes priority):\n${refStats}`)  : ''
        const refVisualBlock = refVisual ? (language === 'de' ? `\nINSPIRATION (nur als CSS/HTML-Referenz — Struktur darf und soll abweichen, Designer-Intent hat Vorrang):\n${refVisual}` : `\nINSPIRATION (CSS/HTML reference only — structure may and should deviate, designer intent takes priority):\n${refVisual}`) : ''

        // Extract per-slot designer intent from slotAssignment
        const sa = designerMockup.slotAssignment ?? {}
        const designerLeft   = sa.left   ? (language === 'de' ? `\nDESIGNER-INTENT für diesen Slot: "${sa.left}" — implementiere diese visuellen Elemente.` : `\nDESIGNER INTENT for this slot: "${sa.left}" — implement these visual elements.`) : ''
        const designerStats  = (sa.stats ?? sa.center) ? (language === 'de' ? `\nDESIGNER-INTENT für diesen Slot: "${sa.stats ?? sa.center}" — implementiere diese visuellen Elemente.` : `\nDESIGNER INTENT for this slot: "${sa.stats ?? sa.center}" — implement these visual elements.`) : ''
        const designerVisual = sa.visual ? (language === 'de' ? `\nDESIGNER-INTENT für diesen Slot: "${sa.visual}" — implementiere diese visuellen Elemente (clip-path, overlay, texture etc. erlaubt).` : `\nDESIGNER INTENT for this slot: "${sa.visual}" — implement these visual elements (clip-path, overlay, texture etc. allowed).`) : ''

        const slotDefs = [
          {
            id: 'left', label: '7a — Left column',
            prompt: language === 'de'
              ? `Baue NUR die LINKE Spalte. Root-Element MUSS class="flex flex-col h-full ..." haben.
ERLAUBT: Eyebrow, H1 (zweigeteilt, Part 2 in Akzentfarbe), Subline, CTA-Buttons, Micro-Copy, dekorative Elemente laut Designer-Intent.
VERBOTEN: Stats/Zahlen, Bilder (<img>), Listen (<ul>/<ol>), Trust-Logos.
DENSITY-REGEL: Nur Text + CTAs — KEINE großen Zahlen in diesem Slot.
WICHTIG: Kein border, kein border-radius, kein background auf dem Root-Element — das übernimmt der Wrapper.${designerLeft}${refLeftBlock}\n\n${sharedContext}`
              : `Build ONLY the LEFT column. Root element MUST have class="flex flex-col h-full ...".
ALLOWED: Eyebrow, H1 (two parts, Part 2 in accent color), Subline, CTA buttons, Micro-copy, decorative elements per designer intent.
FORBIDDEN: Stats/numbers, images (<img>), lists (<ul>/<ol>), trust logos.
DENSITY RULE: Text + CTAs only — NO large numbers in this slot.
IMPORTANT: No border, no border-radius, no background on the root element — the wrapper handles that.${designerLeft}${refLeftBlock}\n\n${sharedContext}`,
          },
          {
            id: 'stats', label: '7b — Stats card',
            prompt: language === 'de'
              ? `Baue NUR die STATS-KACHEL. Root-Element MUSS class="flex flex-col h-full ..." haben.
ERLAUBT: Max 3–4 Kennzahlen (große Zahl + kurzes Label), dünne Trennlinien zwischen den Zeilen, optionale Kachel-Überschrift (max 3 Wörter).
VERBOTEN: Fließtext, <img>, CTAs, Listen, trust badges.
FORMAT JE STAT: Label oben (text-xs, gedämpft), Zahl darunter (font-size:2rem font-bold tabular-nums leading-none) — ALLE Stats identisch, KEIN flex justify-between.
DENSITY-REGEL: NUR Zahlen — keine Absätze, kein Fließtext.
SLOT IST SCHMAL (col-span-3): font-size NIEMALS über 2rem, overflow-hidden auf Root-Element.
WICHTIG: Kein border, kein border-radius, kein background auf dem Root-Element — das übernimmt der Wrapper.${designerStats}${refStatsBlock}\n\n${sharedContext}`
              : `Build ONLY the STATS CARD. Root element MUST have class="flex flex-col h-full ...".
ALLOWED: Max 3–4 KPIs (large number + short label), thin dividers between rows, optional card headline (max 3 words).
FORBIDDEN: Prose text, <img>, CTAs, lists, trust badges.
FORMAT PER STAT: Label on top (text-xs, muted), number below (font-size:2rem font-bold tabular-nums leading-none) — ALL stats identical, NO flex justify-between.
DENSITY RULE: Numbers only — no paragraphs, no prose.
SLOT IS NARROW (col-span-3): font-size NEVER above 2rem, overflow-hidden on root element.
IMPORTANT: No border, no border-radius, no background on the root element — the wrapper handles that.${designerStats}${refStatsBlock}\n\n${sharedContext}`,
          },
          {
            id: 'visual', label: '7c — Visual card',
            prompt: language === 'de'
              ? `Baue NUR die VISUAL-KACHEL. Root-Element MUSS class="h-full flex flex-col relative" haben. Das Bild MUSS style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover" haben.
ERLAUBT: <img> (${imageUrl}), max 1 kurze Caption (max 8 Wörter), Gradient-Overlay, dekorative Overlays/Clip-Paths laut Designer-Intent.
VERBOTEN: Stats, Fließtext, CTAs, Listen.
DENSITY-REGEL: NUR Bild + Caption — keine weiteren Content-Blöcke.
WICHTIG: Kein border, kein border-radius, kein background auf dem Root-Element — das übernimmt der Wrapper.${designerVisual}${refVisualBlock}\n\n${sharedContext}`
              : `Build ONLY the VISUAL CARD. Root element MUST have class="h-full flex flex-col relative". Image MUST use style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover".
ALLOWED: <img> (${imageUrl}), max 1 short caption (max 8 words), gradient overlay, decorative overlays/clip-paths per designer intent.
FORBIDDEN: Stats, prose text, CTAs, lists.
DENSITY RULE: Image + caption only — no additional content blocks.
IMPORTANT: No border, no border-radius, no background on the root element — the wrapper handles that.${designerVisual}${refVisualBlock}\n\n${sharedContext}`,
          },
          {
            id: 'trust', label: '7d — Trust strip',
            prompt: language === 'de'
              ? `Baue NUR den TRUST-STREIFEN (volle Breite, kompakt, 1 Zeile).
ERLAUBT: Label "Vertrauen von:" + max 5 Firmennamen als <span>-Badges nebeneinander.
VERBOTEN: Stats, Bilder, CTAs, mehrzeilig.
DENSITY-REGEL: NUR Badge-Row — keine weiteren Elemente.\n\n${sharedContext}`
              : `Build ONLY the TRUST STRIP (full width, compact, single row).
ALLOWED: Label "Trusted by:" + max 5 company names as <span> badges side by side.
FORBIDDEN: Stats, images, CTAs, multi-line.
DENSITY RULE: Badge-row only — no additional elements.\n\n${sharedContext}`,
          },
        ]
        const slotResults = await Promise.all(
          slotDefs.map(async (slot) => {
            let slotHtml = ''
            await getProvider(developerModel).stream(
              { model: developerModel, max_tokens: 4500, temperature: 0.35, system: slotSystem, messages: [{ role: 'user', content: slot.prompt }] },
              (chunk) => { slotHtml += chunk; write({ type: 'slot_delta', slot: slot.id, text: chunk }) },
              { pass: 'pass1_structure', label: `v3 ${slot.label}` }
            )
            slotHtml = slotHtml.replace(/^```[\w]*\r?\n?/gm, '').replace(/^```\s*$/gm, '').trim()
            if (!isHtmlComplete(slotHtml)) {
              slotHtml = await continueHtml(slotHtml, developerModel, slotSystem,
                (c) => write({ type: 'slot_delta', slot: slot.id, text: c }),
                `v3 ${slot.label} — continuation`
              )
              slotHtml = slotHtml.replace(/^```[\w]*\r?\n?/gm, '').replace(/^```\s*$/gm, '').trim()
            }
            slotHtml = enforceSlotHFull(slotHtml)
            write({ type: 'slot_complete', slot: slot.id })
            return { id: slot.id, html: slotHtml }
          })
        )
        const slots = Object.fromEntries(slotResults.map(s => [s.id, s.html]))

        // ── Deterministic bento density check ────────────────────────
        const bentoViolations = checkBentoDensity(slots)
        write({ type: 'bento_density_check', violations: bentoViolations, slotTypes: Object.fromEntries(
          Object.entries(slots).map(([id, h]) => [id, detectContentTypes(h)])
        )})

        const SLOT_CARD_CLIP  = `overflow-hidden`
        const SLOT_CARD_TEXT  = `min-w-0`
        const SLOT_STYLE = `background:var(--color-surface);border:1px solid color-mix(in srgb,var(--color-text) 10%,transparent)`
        html = `<section class="overflow-hidden isolate relative py-16 md:py-24" style="background:var(--color-background)">
  <div class="max-w-7xl mx-auto px-5 md:px-8">
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      <div class="lg:col-span-5 flex flex-col h-full ${SLOT_CARD_TEXT}" style="${SLOT_STYLE}">${slots.left ?? ''}</div>
      <div class="lg:col-span-3 flex flex-col h-full ${SLOT_CARD_CLIP}" style="${SLOT_STYLE}">${slots.stats ?? ''}</div>
      <div class="lg:col-span-4 flex flex-col h-full ${SLOT_CARD_CLIP}" style="${SLOT_STYLE}">${slots.visual ?? ''}</div>
      <div class="lg:col-span-12">${slots.trust ?? ''}</div>
    </div>
  </div>
</section>`
        write({ type: 'html_delta', text: html })

      } else if (resolvedLayoutId === 'bento-asymmetric-right') {
        write({ type: 'status', call: 7, phase: 2, message: 'Call 7 — Developer (2 parallel bento slots: asymmetric)…' })

        const refLeft   = loadSlotReference('bento-slot-left',   paradigm)
        const refVisual = loadSlotReference('bento-slot-visual',  paradigm)
        const refLeftBlock   = refLeft   ? (language === 'de' ? `\nINSPIRATION (nur als CSS/HTML-Referenz — Struktur darf und soll abweichen, Designer-Intent hat Vorrang):\n${refLeft}`   : `\nINSPIRATION (CSS/HTML reference only — structure may and should deviate, designer intent takes priority):\n${refLeft}`)   : ''
        const refVisualBlock = refVisual ? (language === 'de' ? `\nINSPIRATION (nur als CSS/HTML-Referenz — Struktur darf und soll abweichen, Designer-Intent hat Vorrang):\n${refVisual}` : `\nINSPIRATION (CSS/HTML reference only — structure may and should deviate, designer intent takes priority):\n${refVisual}`) : ''

        const asymSlotDefs = [
          {
            id: 'left', label: '7a — Left column (asymmetric)',
            prompt: language === 'de'
              ? `Baue NUR die LINKE Spalte (lg:col-span-7). Root-Element MUSS class="flex flex-col h-full ..." haben.
ERLAUBT: Eyebrow, H1 (zweigeteilt, Part 2 in Akzentfarbe), Subline, CTA-Buttons, Micro-Copy, Stats (max 3 inline).
VERBOTEN: Bilder (<img>), Trust-Logos.
WICHTIG: Kein border, kein border-radius, kein background auf dem Root-Element.${refLeftBlock}\n\n${sharedContext}`
              : `Build ONLY the LEFT column (lg:col-span-7). Root element MUST have class="flex flex-col h-full ...".
ALLOWED: Eyebrow, H1 (two parts, Part 2 in accent color), Subline, CTA buttons, Micro-copy, Stats (max 3 inline).
FORBIDDEN: Images (<img>), trust logos.
IMPORTANT: No border, no border-radius, no background on the root element.${refLeftBlock}\n\n${sharedContext}`,
          },
          {
            id: 'visual', label: '7b — Visual card (asymmetric)',
            prompt: language === 'de'
              ? `Baue NUR die RECHTE VISUAL-KACHEL (lg:col-span-5). Root-Element MUSS class="h-full flex flex-col relative" haben. Das Bild MUSS style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover" haben — KEIN langer Tailwind-Klassen-String auf dem img.
ERLAUBT: <img> (${imageUrl}), max 1 kurze Caption (max 8 Wörter), Gradient-Overlay unten.
VERBOTEN: Stats, Fließtext, CTAs, Listen.
WICHTIG: Kein border, kein border-radius, kein background auf dem Root-Element.${refVisualBlock}\n\n${sharedContext}`
              : `Build ONLY the RIGHT VISUAL CARD (lg:col-span-5). Root element MUST have class="h-full flex flex-col relative". Image MUST use style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover" — NO long Tailwind class string on the img.
ALLOWED: <img> (${imageUrl}), max 1 short caption (max 8 words), bottom gradient overlay.
FORBIDDEN: Stats, prose text, CTAs, lists.
IMPORTANT: No border, no border-radius, no background on the root element.${refVisualBlock}\n\n${sharedContext}`,
          },
        ]

        const asymResults = await Promise.all(
          asymSlotDefs.map(async (slot) => {
            let slotHtml = ''
            await getProvider(developerModel).stream(
              { model: developerModel, max_tokens: 4500, temperature: tempDeveloper, system: slotSystem, messages: [{ role: 'user', content: slot.prompt }] },
              (chunk) => { slotHtml += chunk; write({ type: 'slot_delta', slot: slot.id, text: chunk }) },
              { pass: 'pass1_structure', label: `v3 ${slot.label}` }
            )
            slotHtml = slotHtml.replace(/^```[\w]*\r?\n?/gm, '').replace(/^```\s*$/gm, '').trim()
            if (!isHtmlComplete(slotHtml)) {
              slotHtml = await continueHtml(slotHtml, developerModel, slotSystem,
                (c) => write({ type: 'slot_delta', slot: slot.id, text: c }),
                `v3 ${slot.label} — continuation`
              )
              slotHtml = slotHtml.replace(/^```[\w]*\r?\n?/gm, '').replace(/^```\s*$/gm, '').trim()
            }
            slotHtml = enforceSlotHFull(slotHtml)
            write({ type: 'slot_complete', slot: slot.id })
            return { id: slot.id, html: slotHtml }
          })
        )
        const asymSlots = Object.fromEntries(asymResults.map(s => [s.id, s.html]))
        const SLOT_STYLE_ASYM = `background:var(--color-surface);border:1px solid color-mix(in srgb,var(--color-text) 10%,transparent)`
        html = `<section class="overflow-hidden isolate relative py-16 md:py-24" style="background:var(--color-background)">
  <div class="max-w-7xl mx-auto px-5 md:px-8">
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      <div class="lg:col-span-7 flex flex-col h-full min-w-0" style="${SLOT_STYLE_ASYM}">${asymSlots.left ?? ''}</div>
      <div class="lg:col-span-5 flex flex-col h-full overflow-hidden" style="${SLOT_STYLE_ASYM}">${asymSlots.visual ?? ''}</div>
    </div>
  </div>
</section>`
        write({ type: 'html_delta', text: html })

      } else {
        const layoutDirective = buildLayoutDirective(resolvedLayoutId, language)
        await getProvider(developerModel).stream(
          {
            model: developerModel, max_tokens: 8000, temperature: tempDeveloper,
            system: devSystem,
            messages: [{ role: 'user', content: `${sharedContext}\n\n${layoutDirective}\n\nGenerate the complete hero section now. OUTPUT ONLY raw HTML.` }],
          },
          (chunk) => { html += chunk; write({ type: 'html_delta', text: chunk }) },
          { pass: 'pass1_structure', label: 'v3 Call 7 — Developer' }
        )
        html = html.replace(/^```[\w]*\r?\n?/gm, '').replace(/^```\s*$/gm, '').trim()
        if (!isHtmlComplete(html)) {
          html = await continueHtml(html, developerModel, devSystem,
            (c) => write({ type: 'html_delta', text: c }),
            'v3 Call 7 — Developer continuation'
          )
          html = html.replace(/^```[\w]*\r?\n?/gm, '').replace(/^```\s*$/gm, '').trim()
        }
      }
      // ── Auto-Fix pass (deterministic, before QA) ──────────────────
      const { html: fixedHtml, fixes } = applyV3AutoFix(html, language)
      html = fixedHtml
      if (fixes.length > 0) write({ type: 'autofix', fixes })

      write({ type: 'call_complete', call: 7, phase: 2 })

      // ── Call 8: QA Validator ───────────────────────────────────────
      write({ type: 'status', call: 8, phase: 2, message: 'Call 8 — QA Validator…' })
      let qaRaw = ''
      await getProvider('gpt-5.4-nano').stream(
        {
          model: 'gpt-5.4-nano', max_tokens: 1000, temperature: 0.1,
          system: buildQASystem(),
          messages: [{ role: 'user', content: `Validate this hero section HTML:\n\n${html.slice(0, 6000)}` }],
        },
        (chunk) => { qaRaw += chunk },
        { pass: 'other', label: 'v3 Call 8 — QA Validator' }
      )
      const qa = tryParseJson<QAResult>(qaRaw, { valid: true, errors: [], score: 80 })
      write({ type: 'call_complete', call: 8, phase: 2, qa })

      // ── Auto-save to Section Library if QA score >= threshold ─────
      const AUTO_SAVE_THRESHOLD = 80
      let savedToLibrary = false
      if (qa.score >= AUTO_SAVE_THRESHOLD && html.trim().length > 200) {
        try {
          const LIBRARY_DIR = path.join(process.cwd(), 'src/data/section-library')
          const INDEX_PATH = path.join(LIBRARY_DIR, 'index.json')
          const libIndex: Array<Record<string, unknown>> = (() => {
            try { return JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8')) } catch { return [] }
          })()
          const id = `hero-v3-${Date.now()}`
          const html_path = `${id}.html`
          fs.writeFileSync(path.join(LIBRARY_DIR, html_path), html, 'utf-8')
          const newMeta = {
            id, type: 'hero',
            paradigm: paradigm ?? 'minimal-clean',
            quality_score: qa.score,
            tags: ['hero', `v3-auto`, resolvedLayoutId, paradigm, industry].filter(Boolean),
            industries: [industry],
            tone: [],
            html_path,
            label: `${companyName} — ${resolvedLayoutId} (auto, score ${qa.score})`,
            description: `Auto-saved from v3 pipeline. USP: ${usp}`,
            source: 'v3-pipeline-auto',
          }
          libIndex.push(newMeta)
          fs.writeFileSync(INDEX_PATH, JSON.stringify(libIndex, null, 2) + '\n', 'utf-8')
          savedToLibrary = true
          write({ type: 'saved_to_library', id, score: qa.score, label: newMeta.label })
        } catch (saveErr) {
          write({ type: 'save_library_error', message: saveErr instanceof Error ? saveErr.message : String(saveErr) })
        }
      }

      write({
        type: 'complete', html, blueprint, artDirection, imageBriefing, animStrategy,
        texts, designerMockup, qa, layoutId: resolvedLayoutId,
        savedToLibrary,
        meta: { calls: 8, phase1: [1,2,3,4], phase2: [5,6,7,8], models: { strategist: fastModel, artDirector: artDirectorModel, fotograf: fastModel, anim: fastModel, texter: fastModel, designer: fastModel, developer: developerModel, qa: 'gpt-5.4-nano' } },
      })
    } catch (err) {
      write({ type: 'error', message: err instanceof Error ? err.message : String(err) })
    } finally {
      close()
    }
  }

  run().catch(() => close())

  return new Response(stream.readable, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
  })
}
