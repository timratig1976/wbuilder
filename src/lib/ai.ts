import { SectionType } from './store'
import { loadExamples } from './examples'
import { pickLayout, buildLayoutBlock } from './sectionLayouts'
import { callProvider, routeGenerate, routeEnhance } from './providers'

export interface AICallLog {
  step: 'classify' | 'generate' | 'enhance'
  sectionType: string
  model: string
  fallbackUsed: boolean
  systemPrompt: string
  userMessage: string
  outputHtml: string
  inputTokensEst: number
  outputTokensEst: number
  durationMs: number
  status: 'success' | 'error' | 'fallback'
  error?: string
}

/**
 * Model selection strategy:
 *
 * gpt-4o-mini  → classify (fast JSON, no creativity)
 * gpt-4o       → hero, features, pricing, testimonials, custom
 *                (design creativity, complex multi-column layouts)
 * gpt-4o-mini  → navbar, footer, cta, stats, faq
 *                (templatic, low design complexity)
 */
interface ModelConfig {
  primary: string
  fallback: string
  temperature: number
  maxTokens: number
}

/**
 * 3-tier model ladder:
 *
 * Tier 1 — gpt-5.4       : Flagship, best HTML/design output. hero, features, pricing, custom.
 *                          $2.50/MTok in, $15/MTok out. Fast, 1M context, 128K max output.
 * Tier 2 — gpt-4o        : Strong quality, mid-complexity. testimonials.
 * Tier 3 — gpt-4o-mini   : Fast + cheap, templatic. navbar, footer, cta, stats, faq.
 * Classify — gpt-4o-mini : Just valid JSON, no creativity needed.
 *
 * Fallback chain on 429/404: Tier1 → gpt-4o → gpt-4o-mini
 */
const MODEL_CONFIG: Record<SectionType, ModelConfig> = {
  // gpt-5.3-codex: latest working codex model (responses API), non-reasoning, optimized for HTML/code
  // Fallback: gpt-4.1 (chat completions)
  // Pass 1: gpt-4.1 for all sections — fast (~15-20s), solid structural HTML
  // Pass 2 (enhance): gpt-4.1 — visual upgrade, fixes artifacts (~20-30s)
  hero:         { primary: 'gpt-5.4', fallback: 'gpt-5-mini', temperature: 0.8, maxTokens: 4096 },
  features:     { primary: 'gpt-5.4', fallback: 'gpt-5-mini', temperature: 0.7, maxTokens: 4096 },
  pricing:      { primary: 'gpt-5.4', fallback: 'gpt-5-mini', temperature: 0.5, maxTokens: 4096 },
  custom:       { primary: 'gpt-5.4', fallback: 'gpt-5-mini', temperature: 0.8, maxTokens: 4096 },
  testimonials: { primary: 'gpt-5.4', fallback: 'gpt-5-mini', temperature: 0.7, maxTokens: 4096 },
  navbar:       { primary: 'gpt-5.4', fallback: 'gpt-5-mini', temperature: 0.5, maxTokens: 3000 },
  footer:       { primary: 'gpt-5.4', fallback: 'gpt-5-mini', temperature: 0.4, maxTokens: 3000 },
  cta:          { primary: 'gpt-5.4', fallback: 'gpt-5-mini', temperature: 0.7, maxTokens: 3000 },
  stats:        { primary: 'gpt-5.4', fallback: 'gpt-5-mini', temperature: 0.5, maxTokens: 3000 },
  faq:          { primary: 'gpt-5.4', fallback: 'gpt-5-mini', temperature: 0.5, maxTokens: 4096 },
}

// Per-section layout hints appended to the system prompt
const SECTION_HINTS: Partial<Record<SectionType, string>> = {
  hero: `Design a hero section that immediately communicates value and creates a strong first impression.
- Layout: split-screen (text left, visual right) OR full-width centred with large visual below — pick whichever suits the product
- Headline: text-5xl to text-7xl on desktop, font-black, 1-2 lines max. One key word or phrase should use gradient text or the brand accent colour
- Sub-headline: text-xl, muted colour, max-w-2xl, 2 sentences max — outcome-focused, not feature-focused
- CTAs: primary button (large, filled, shadow-xl, with arrow icon) + secondary (outline or text link). Add a micro-copy line below ("No credit card required" or "Free 14-day trial")
- Social proof badge: floating pill near CTAs — star rating + user count or logo strip of 4-5 known company logos (text placeholders)
- Hero visual: right side on desktop — use a styled div or SVG to represent a product dashboard, abstract 3D shape, or device mockup. Make it feel dimensional with shadows and layers
- Background: MUST have depth — animated gradient orbs (CSS @keyframes), mesh gradient, radial glow behind the visual, subtle grid/dot pattern overlay
- Decorative: floating stat cards, notification toast mockups, or feature badges scattered around the visual
- Add a thin scroll-down indicator at the bottom`,

  features: `Design a features section that shows depth and builds confidence.
- Open with a centred eyebrow label ("Why teams choose us") + large headline + one-line subtitle
- Layout: NOT a boring 3-equal-column grid. Use one of: bento grid (mixed sizes), alternating 2-column rows with image+text, 2-col grid where one card spans full width, or a tabbed interface
- Minimum 6 features. Each feature: SVG icon in a coloured rounded container, bold title, 2-3 sentence description, optional "Explore →" link
- Feature cards: subtle gradient border or ring on hover, shadow, rounded-2xl, hover:-translate-y-1 transition
- At least one "highlight" feature card that is larger, has a background gradient, and shows a mini product screenshot or diagram
- Section background: off-white or very subtle pattern — not pure white
- Add a bottom trust strip: logos of integrations or a horizontal scrolling list of tool names`,

  pricing: `Design a pricing section that drives conversion.
- 3 tiers with contextual names matching the product (not just "Basic/Pro/Enterprise")
- Annual/monthly toggle at top (visual UI — no JS needed)
- Middle tier: visually elevated — primary colour bg or strong border, "Most Popular" badge, slightly larger card, bolder CTA
- Each tier: large price display, billing period, one-line positioning statement, 8-10 feature line items with check/cross icons, CTA button
- Add feature comparison logic: use different icon colours for included (primary) vs. partial (muted) vs. excluded (strikethrough or dash)
- Below cards: trust row — "SOC2 Certified · No contracts · Cancel anytime · Priority support on Pro+"
- FAQ mini-section: 2-3 common pricing questions in an accordion below the cards
- Background: split — gradient or coloured top half, white/light bottom, or vice versa`,

  testimonials: `Design a testimonials section that builds trust and social proof.
- Open with aggregate rating: large "4.9/5" display + star icons + "from X reviews" + review platform logos (G2, Capterra, Trustpilot as text badges)
- 3-4 testimonial cards in a grid or masonry layout — varied card heights for visual interest
- Each card: large decorative quote mark (text-6xl, accent colour), 3-4 sentence testimonial with SPECIFIC results ("reduced our onboarding time by 60%"), avatar placeholder (rounded-full, initials fallback), full name, job title, company name, company size
- One "featured" testimonial: larger, full-width or 2-col span, with company logo, metric callout box ("📈 3x faster deployment"), and a video thumbnail placeholder
- Cards: white bg, shadow-lg, rounded-2xl, subtle left border in accent colour
- Background: subtle gradient or light pattern`,

  stats: `Design a stats/metrics section that demonstrates scale and impact.
- 4-6 key metrics — make them specific and impressive (not round numbers): "14,847 teams", "99.97% uptime", "$2.4M saved monthly"
- Each stat: very large number (text-5xl to text-6xl, font-black, gradient or accent colour), unit/suffix styled differently, descriptive label below
- Layout: horizontal row on desktop, 2-col grid on mobile — with subtle vertical dividers
- Add an animated counting effect placeholder (static number but add a data-target attribute for future JS)
- Section background: dark or strong gradient to make numbers pop — this section should feel bold
- Above the stats: one-line context headline ("Trusted by teams who move fast")
- Below: optional logos strip of recognisable companies`,

  cta: `Design a CTA section that creates urgency and drives action.
- NOT a simple coloured bar. Make it feel like a moment — a section with real weight
- Options: full-bleed gradient with floating card in centre, split-screen with product image on one side, or dark section with glowing elements
- Headline: bold, benefit-focused, 1-2 lines max
- Sub-copy: 1 sentence, outcome-focused
- Primary CTA: large, high contrast, with arrow or sparkle icon. Secondary: ghost/outline
- Add urgency elements: "Join 14,000+ teams" or "Setup in under 5 minutes" as micro-copy
- Decorative: animated gradient background, floating geometric shapes, radial glow
- Include a minimal form placeholder (email input + button) as an alternative path if appropriate`,

  navbar: `Design a professional sticky navigation bar.
- Logo: icon/mark on left + product name, bold
- Nav links: 4-6 items, some with dropdown indicators (no actual dropdown needed) — group as "Product", "Solutions", "Pricing", "Docs", "Blog"
- Right side: secondary link ("Sign in") + primary CTA button ("Get started free") with accent colour
- Mobile: hamburger menu button that toggles a full-width dropdown (JS toggle with hidden/block)
- Design: frosted glass effect (bg-white/80 backdrop-blur-md) with subtle bottom border — or dark variant for dark pages
- Add a top announcement bar above the nav: "🎉 Velox raises $12M Series A · Read more →" in a thin coloured strip`,

  footer: `Design a comprehensive, well-structured footer.
- 4-5 column layout: Logo+tagline+socials column, then 3-4 link group columns (Product, Company, Resources, Legal)
- Each link group: bold heading, 5-7 links below
- Social icons: inline SVG icons for Twitter/X, LinkedIn, GitHub, YouTube
- Bottom bar: copyright + privacy + terms links + "Built with ❤️ in Berlin" (or relevant location)
- Above the main footer: a mini-CTA strip — email newsletter signup with input + button
- Design: dark background footer (gray-900 or slate-900) with muted link colours and a subtle top border accent line in the primary colour
- Include a "Status: Operational 🟢" badge somewhere in the footer`,

  faq: `Design a FAQ section that answers objections and reduces friction.
- Open with headline ("Everything you need to know") + subtitle + optionally a contact support link
- 6-8 questions covering: pricing, security/compliance, onboarding time, integrations, support, cancellation, data privacy, team size limits
- Accordion UI: each item has a question row (bold, with +/- toggle icon) and an answer panel below. Use <details>/<summary> for native toggle behaviour
- Two-column layout on desktop (questions split into 2 cols), single column on mobile
- Style: clean, generous padding per item, subtle divider lines, smooth transition hint in CSS
- Add a "Still have questions?" CTA card at the bottom with email/chat support options`,

  custom: `Design a completely unique, visually rich section appropriate to the page context.
- Infer the purpose from the surrounding page description
- Could be: process/how-it-works steps, integration showcase, team/about section, product demo embed, comparison table, case study highlight, awards/press logos
- Whatever the type, apply maximum visual sophistication — layered backgrounds, rich typography, complex layout, micro-interactions
- Make it feel like the most memorable section on the page`,
}

const BASE_SYSTEM_PROMPT = `CRITICAL OUTPUT FORMAT RULE — READ THIS FIRST:
Your response MUST start with "<" and end with ">". No exceptions.
NEVER wrap your output in markdown code blocks. NEVER write \`\`\`html or \`\`\` anywhere.
NEVER write any text before the opening "<" tag or after the closing ">" tag.
If you wrap your output in \`\`\`html...\`\`\` your response is BROKEN and unusable.

CSS CUSTOM PROPERTIES — MANDATORY COLOR SYSTEM:
The page assembler injects brand colors as CSS Custom Properties + utility classes.
You MUST use these classes for ALL brand colors — NEVER hardcode hex values for brand colors:

BACKGROUND:  bg-primary · bg-secondary · bg-accent · bg-dark · bg-surface · bg-highlight
TEXT:        text-primary · text-accent · text-muted · text-highlight
BORDER:      border-accent · border-primary
GRADIENT:    from-primary · from-accent · from-secondary · to-accent · to-primary
FONT:        font-display (heading font) · font-body (body font)

CORRECT:   <section class="bg-dark">  /  <button class="bg-accent text-white">
           <h1 class="font-display text-primary">  /  <span class="text-accent">
FORBIDDEN: <section style="background-color:#0F2645">  /  <button class="bg-[#1E6FFF]">

Standard Tailwind palette (slate-900, gray-50 etc.) is still allowed for
non-brand elements: overlay backgrounds, shadow colors, neutral text.

You are a world-class UI/UX designer and senior front-end engineer at a top-tier product design agency. You build visually stunning, conversion-optimised marketing websites that win awards. Your output is always production-ready and looks like it was crafted by a funded startup's design team.

Return ONLY raw HTML. No markdown, no code fences, no explanations, no comments.

TECHNICAL RULES:
- Tailwind CSS utility classes only (CDN v3 compatible). NEVER use arbitrary value classes like bg-[#abc] or from-[#123456] or text-[14px] — use only standard palette classes (bg-indigo-600, from-sky-500 etc). Arbitrary values are invisible to the CDN and will not render.
- NEVER use slate-950, gray-950, zinc-950 or any color above 900 — Tailwind v3 CDN palette stops at 900. Use slate-900, gray-900 etc instead.
- Images: https://placehold.co/WIDTHxHEIGHT/BGCOLOR/TEXTCOLOR?text=Label with realistic dimensions.
- Icons: inline SVG only. No external icon libraries.
- Fully responsive: use sm: md: lg: xl: breakpoints throughout every layout.
- Semantic HTML5: use <section>, <article>, <nav>, <figure>, <ul> etc. appropriately.
- CSS animations: YOU MAY and SHOULD use <style> tags with @keyframes for background animations, floating elements, gradient shifts, mesh movement. Also use Tailwind animate-pulse, animate-bounce, animate-spin where appropriate.
- Glassmorphism: use backdrop-blur-sm/md/lg + bg-white/10 + border border-white/20 for glass cards when the design calls for it.
- JavaScript: allowed for essential interactions (mobile menu, tabs, toggles). CRITICAL: every inline script block MUST be wrapped in an IIFE so variables never leak into global scope. Pattern: ;(function(){ YOUR CODE HERE })(); — never declare const/let/var at the top level of a script tag.
- NEVER add <script src="https://cdn.tailwindcss.com"> — it is already loaded by the page shell. Adding it again breaks everything.
- NEVER add <link> tags for Google Fonts or any external stylesheet — fonts are already loaded by the page shell.
- NEVER output <!DOCTYPE>, <html>, <head>, or <body> tags — output a single <section> (or <nav>/<footer>) element only.
- Every root <section> MUST have both overflow-hidden and isolate classes to prevent decorative elements bleeding into adjacent sections.
- ALL HTML tags must be properly closed. Self-closing tags like <img>, <br>, <hr> must use the form <img .../> or <img ...> (never leave a dangling >). Never produce malformed or unclosed HTML.

DESIGN QUALITY — every output MUST have ALL of these:

1. VISUAL DEPTH: layered backgrounds — gradients, SVG blob shapes, mesh/grid patterns, radial glows, noise textures via CSS. Never flat single-colour backgrounds.
2. TYPOGRAPHY HIERARCHY: minimum 4 distinct type levels. Desktop headlines text-5xl or larger. Use font-black or font-extrabold for impact. Gradient text (bg-gradient-to-r + bg-clip-text + text-transparent) on key words.
3. COLOUR: rich, intentional use of the brand palette. Accent colours on badges, borders, icon backgrounds, underlines, hover states. Never grey-on-white unless the brief explicitly asks for minimal.
4. SPACING: generous — py-24 to py-32 for sections. Internal rhythm with consistent gap-6/8/12.
5. REALISTIC COPY: write compelling, specific marketing copy. Real product names, real feature descriptions, real testimonial names/roles/companies, real pricing tier names. ZERO lorem ipsum.
6. MICRO-INTERACTIONS: hover:scale-105, hover:-translate-y-1, hover:shadow-2xl, transition-all duration-300 on all interactive elements.
7. COMPONENTS: every section contains multiple rich sub-components — badges, tags, stat counters, avatars, icon containers, dividers, progress bars, tooltips.
8. DECORATIVE ELEMENTS: at least one purely decorative layer — animated gradient orbs, SVG geometric shapes, background dot/grid patterns, floating accent cards, glowing rings.
9. LAYOUT SOPHISTICATION: use asymmetric grids, overlapping elements, offset cards, full-bleed images, sticky sidebars, split-screen layouts. Avoid boring symmetric 3-column grids.
10. ADAPT TO CONTEXT: infer the visual style from the page description. A luxury brand → elegant serif fonts, gold/cream palette, generous whitespace. A tech startup → dark bg, electric accents, monospace elements. A children's app → rounded, bright, playful. Match the product's world perfectly.

The output should feel like it belongs on awwwards.com or siteinspire.com.

PARADIGM RULES — apply strictly when styleParadigm is set:

tech-dark: Backgrounds slate-900/gray-900. Gradient text on headlines (bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent). Glassmorphism cards (bg-white/10 backdrop-blur-md border border-white/10). @keyframes animations required. Electric accents (blue-500, cyan-400, violet-500).

bold-expressive: Mix of dark and light sections. Display font at extreme sizes (text-7xl+). Overlapping elements allowed. Rich @keyframes animations. Concave or diagonal section transitions. One dominant brand-color block per section.

minimal-clean: Light backgrounds only (white or gray-50). Zero animations. Max 1 accent color. Generous whitespace (py-32+). font-light headings. No glassmorphism. No decorative orbs.

luxury-editorial: Cream (#faf9f5) or white background. Serif display font (font-serif or Playfair Display via @import). Extreme whitespace. Thin divider lines only. Almost no decoration. Never dark backgrounds.

brutalist: Background #f2efe8 or white. ALL borders: border-2 border-black (no exceptions). border-radius: 0 everywhere — cards, buttons, inputs, images all sharp. No box-shadow. No glassmorphism. No gradient backgrounds. font-black sans-serif. Accent color ONLY on primary CTA button fill. Hover CTA: accent → black bg + white text. No @keyframes. Offset shadows only: box-shadow: 4px 4px 0 black.

bento-grid: Asymmetric CSS Grid layout for main content. Mixed column spans. 2px gap on dark background. Information-dense.

Default if no paradigm: bold-expressive.

OUTPUT INTEGRITY — these rules are absolute:
- NEVER truncate the output. Always return the COMPLETE, fully-formed HTML.
- NEVER use placeholders like "<!-- rest of section -->" or "<!-- add more items here -->"
- NEVER summarise or skip parts of the output. Every card, every list item, every decorative element must be fully written out.
- If the section requires 6 feature cards, write all 6. If it requires 3 pricing tiers, write all 3. Complete everything.
- The HTML must be self-contained and renderable as-is in a browser with Tailwind CDN.
- Do not add any text before or after the HTML — the very first character of your response must be "<" and the very last must be ">".`

function buildSystemPrompt(type: SectionType, layoutBlock?: string): string {
  const hint = SECTION_HINTS[type]
  const parts = [BASE_SYSTEM_PROMPT]
  if (layoutBlock) parts.push(layoutBlock)
  if (hint) parts.push(`SECTION-SPECIFIC GUIDANCE:\n${hint}`)
  return parts.join('\n\n')
}

export interface GenerateResult {
  html: string
  log: AICallLog
}

export interface ClassifyResult {
  sections: SectionType[]
  log: AICallLog
}

export interface BrandContext {
  primaryColor?: string
  secondaryColor?: string
  fontFamily?: string
  borderRadius?: string
  tone?: string
  styleParadigm?: string   // 'tech-dark' | 'bold-expressive' | 'brutalist' etc.
  extraNotes?: string
}

// Describes a section already on the page — stripped of full HTML to save tokens
export interface ExistingSection {
  type: SectionType
  label: string
  /** First 400 chars of HTML — enough for the AI to infer colors, tone, component patterns */
  htmlSnippet: string
}

export interface PageContext {
  pageTitle: string
  pagePrompt: string
  /** Sections already generated on this page — for holistic awareness */
  existingSections: ExistingSection[]
  /** Which position this new section occupies (0-indexed) */
  insertPosition?: number
  /** Total sections expected on the full page */
  totalExpected?: number
}

/**
 * Builds a rich context block describing what's already on the page.
 * Inspired by bolt.new's holistic approach: the AI must be aware of ALL
 * surrounding content before generating a new section.
 */
function buildPageContextBlock(ctx?: PageContext): string {
  if (!ctx || ctx.existingSections.length === 0) return ''

  const sectionList = ctx.existingSections
    .map((s, i) => {
      const snippet = s.htmlSnippet
        .replace(/<[^>]+>/g, ' ')  // strip tags for readability
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 180)
      return `  ${i + 1}. [${s.type.toUpperCase()}] "${s.label}" — ${snippet}…`
    })
    .join('\n')

  const positionHint = ctx.insertPosition !== undefined
    ? `\nThis new section is at position ${ctx.insertPosition + 1}${ctx.totalExpected ? ` of ${ctx.totalExpected}` : ''} on the page.`
    : ''

  return `

PAGE CONTEXT — EXISTING SECTIONS (holistic awareness required):
Page title: "${ctx.pageTitle}"
Sections already on this page:
${sectionList}${positionHint}

CRITICAL RULES for consistency:
- Match the visual style, colour palette, and tone of existing sections exactly
- Do NOT repeat content already covered (e.g. if features are listed, don't list them again)
- Maintain typographic scale consistency — headline sizes should feel part of one coherent page
- Background colours should flow naturally from the previous section (avoid jarring contrast breaks)
- The section you generate must feel like it belongs to the SAME page as the sections above`
}

function buildBrandBlock(brand?: BrandContext): string {
  if (!brand) return ''
  const lines: string[] = []
  if (brand.primaryColor) lines.push(`- Primary colour: ${brand.primaryColor} — use for CTAs, active states, icon backgrounds, gradient starts, accent borders, highlights`)
  if (brand.secondaryColor) lines.push(`- Secondary/accent colour: ${brand.secondaryColor} — use for gradient ends, secondary badges, hover states, decorative elements`)
  if (brand.fontFamily) lines.push(`- Font family: ${brand.fontFamily} — apply to all text elements via inline style or a @import in a <style> tag`)
  if (brand.borderRadius) lines.push(`- Shape style: ${brand.borderRadius} — apply to ALL buttons, cards, badges, inputs, image containers, icon boxes`)
  if (brand.tone) lines.push(`- Visual tone: ${brand.tone} — this defines the overall aesthetic. Adapt background colours, heading weights, spacing density, and decorative style to match this tone precisely`)
  if (brand.styleParadigm) lines.push(
    `- Visual paradigm: ${brand.styleParadigm} — apply the PARADIGM RULES for this style (defined in system prompt)`
  )
  if (brand.extraNotes) lines.push(`- Additional design rules (MUST follow): ${brand.extraNotes}`)
  if (lines.length === 0) return ''
  return `\n\nBRAND IDENTITY (these rules are MANDATORY and override all other design decisions):\n${lines.join('\n')}\nDo not use colours, fonts, or shapes that conflict with these brand settings.`
}

export async function generateSection(
  type: SectionType,
  pagePrompt: string,
  customPrompt?: string,
  onChunk?: (chunk: string) => void,
  brand?: BrandContext,
  pageContext?: PageContext
): Promise<GenerateResult> {
  const seed = Math.floor(Date.now() / 300000) % 100  // wechselt alle 5 Min
  const layout = pickLayout(type, {
    seed,
    paradigm: brand?.styleParadigm ?? brand?.tone,
  })
  const layoutBlock = layout ? buildLayoutBlock(layout) : ''

  const examples = loadExamples(type, {
    layoutId: layout?.id,
    paradigm: brand?.styleParadigm,
  })
  const exampleContext = examples.length > 0
    ? `\n\nREFERENCE EXAMPLE (style inspiration only — do NOT copy verbatim, adapt to the page context):\n${examples[0].html.slice(0, 1200)}`
    : ''

  const brandBlock = buildBrandBlock(brand)
  const pageContextBlock = buildPageContextBlock(pageContext)

  const userMessage = [
    `Generate a "${type}" section for the following webpage.`,
    ``,
    `PAGE DESCRIPTION: ${pagePrompt}`,
    customPrompt ? `SPECIFIC INSTRUCTIONS FOR THIS SECTION: ${customPrompt}` : '',
    `SECTION TYPE TO GENERATE: ${type}`,
    brandBlock,
    pageContextBlock,
    exampleContext,
  ].filter(Boolean).join('\n')

  const systemPrompt = buildSystemPrompt(type, layoutBlock)
  const route = routeGenerate(type)
  const t0 = Date.now()

  console.log(`[AI] ${type} → ${route.provider}/${route.model} (t=${route.temperature}, max=${route.maxTokens})`)

  try {
    const html = await callProvider({
      provider: route.provider, model: route.model,
      system: systemPrompt, user: userMessage,
      maxTokens: route.maxTokens, temperature: route.temperature, onChunk,
    })
    const cleaned = cleanHtml(html)
    return {
      html: cleaned,
      log: {
        step: 'generate', sectionType: type,
        model: `${route.provider}/${route.model}`,
        fallbackUsed: false, systemPrompt, userMessage,
        outputHtml: cleaned,
        inputTokensEst:  Math.ceil((systemPrompt.length + userMessage.length) / 4),
        outputTokensEst: Math.ceil(cleaned.length / 4),
        durationMs: Date.now() - t0, status: 'success',
      },
    }
  } catch (err) {
    console.warn(`[AI] ${route.provider}/${route.model} failed → fallback gpt-5.4-mini`)
    const html = await callProvider({
      provider: 'openai', model: 'gpt-5.4-mini',
      system: systemPrompt, user: userMessage,
      maxTokens: route.maxTokens, temperature: route.temperature, onChunk,
    })
    const cleaned = cleanHtml(html)
    return {
      html: cleaned,
      log: {
        step: 'generate', sectionType: type,
        model: 'openai/gpt-5.4-mini (fallback)',
        fallbackUsed: true, systemPrompt, userMessage,
        outputHtml: cleaned,
        inputTokensEst:  Math.ceil((systemPrompt.length + userMessage.length) / 4),
        outputTokensEst: Math.ceil(cleaned.length / 4),
        durationMs: Date.now() - t0, status: 'fallback',
      },
    }
  }
}

// ─── Pass 2: Enhance/Validate ────────────────────────────────────────────────

const ENHANCE_SYSTEM_PROMPT = `You are a world-class UI/UX engineer and creative director at a top-tier product design agency. You receive a functional HTML section skeleton and your job is to TRANSFORM it into a visually stunning, award-winning section that belongs on awwwards.com or siteinspire.com.

RESPONSE FORMAT: Return a JSON object with a single key "html".
Example: {"html": "<section class=\\"...\\">....</section>"}
No markdown, no code fences, no extra keys.

YOUR MISSION — transform the skeleton by doing ALL of the following:

1. VISUAL DEPTH — the background must have multiple layers:
   - Add a rich gradient background (dark or brand-appropriate)
   - Add 2-3 animated radial orbs / glow blobs using @keyframes in a <style> tag (float, pulse, drift)
   - Add a subtle dot or grid pattern overlay using CSS background-image
   - Add at least one SVG decorative shape (blob, geometric accent, wave divider)

2. TYPOGRAPHY UPGRADE:
   - Headlines: font-black, text-5xl minimum on desktop (text-7xl for hero), tight tracking
   - Key words: gradient text (bg-gradient-to-r from-cyan-400 to-sky-400 bg-clip-text text-transparent)
   - Subheadlines: muted, max-w-2xl, outcome-focused copy
   - Maintain 4+ distinct type levels

3. GLASSMORPHISM CARDS (where applicable):
   - backdrop-blur-md, bg-white/10, border border-white/10, rounded-2xl, shadow-xl
   - ring-1 ring-white/10 on hover

4. MICRO-INTERACTIONS on every interactive element:
   - hover:scale-105 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300
   - Button: large, filled, shadow-lg, with arrow or icon

5. TECHNICAL FIXES (always apply):
   - Remove any CDN script tags, @import rules, external link tags, <!DOCTYPE>, <html>, <head>, <body>
   - Fix unclosed tags, stray ">" text artifacts
   - Replace arbitrary Tailwind classes (bg-[#abc], text-[14px]) with standard palette equivalents
   - Replace slate-950/gray-950 with slate-900/gray-900 (Tailwind v3 CDN max is 900)
   - Root element MUST have overflow-hidden and isolate classes
   - All <script> blocks MUST be wrapped in IIFEs: ;(function(){ ... })();

6. PRESERVE:
   - All text copy exactly as-is (headlines, body, labels, prices, names)
   - Overall section type and layout structure
   - All working Tailwind classes that are already good
   - All SVG icons

OUTPUT RULES:
- Return ONLY the JSON object. No explanation, no markdown fences.
- NEVER truncate — return the COMPLETE, fully-written HTML inside the JSON.
- Only standard Tailwind v3 CDN classes — no arbitrary [value] classes.`

export interface EnhanceResult {
  html: string
  log: AICallLog
}

export async function enhanceSection(
  type: SectionType,
  rawHtml: string,
  pagePrompt: string
): Promise<EnhanceResult> {
  const t0 = Date.now()
  const userMessage = `SECTION TYPE: ${type}
PAGE CONTEXT: ${pagePrompt}

RAW HTML TO ENHANCE:
${rawHtml}`

  const route = routeEnhance()

  try {
    const content = await callProvider({
      provider: route.provider, model: route.model,
      system: ENHANCE_SYSTEM_PROMPT, user: userMessage,
      maxTokens: route.maxTokens, temperature: route.temperature,
    })

    // Claude gibt direkt HTML oder JSON — beide Fälle abfangen
    let extractedHtml = rawHtml
    if (content.trim().startsWith('{')) {
      try { extractedHtml = JSON.parse(content).html ?? rawHtml } catch { /* ignore */ }
    } else if (content.trim().startsWith('<')) {
      extractedHtml = content
    }

    const html = cleanHtml(extractedHtml)
    return {
      html,
      log: {
        step: 'enhance', sectionType: type,
        model: `${route.provider}/${route.model}`,
        fallbackUsed: false, systemPrompt: ENHANCE_SYSTEM_PROMPT, userMessage,
        outputHtml: html,
        inputTokensEst:  Math.ceil((ENHANCE_SYSTEM_PROMPT.length + userMessage.length) / 4),
        outputTokensEst: Math.ceil(html.length / 4),
        durationMs: Date.now() - t0, status: 'success',
      },
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return {
      html: rawHtml,
      log: {
        step: 'enhance', sectionType: type,
        model: `${route.provider}/${route.model}`,
        fallbackUsed: false, systemPrompt: ENHANCE_SYSTEM_PROMPT, userMessage,
        outputHtml: rawHtml,
        inputTokensEst: 0, outputTokensEst: 0,
        durationMs: Date.now() - t0, status: 'error', error: msg,
      },
    }
  }
}

// Intent classification — gpt-4o: better instruction following for JSON section lists
export async function classifyIntent(prompt: string): Promise<ClassifyResult> {
  const ALL_SECTIONS: SectionType[] = ['navbar', 'hero', 'features', 'stats', 'testimonials', 'pricing', 'faq', 'cta', 'footer']

  const CLASSIFY_SYSTEM = `You are an expert landing page architect. Given a webpage description, return a JSON object with a "sections" array listing the section types needed.

Available section types (use only these exact strings):
  navbar, hero, features, stats, testimonials, pricing, faq, cta, footer

RULES:
- For a product/SaaS/B2B page include ALL 9: navbar, hero, features, stats, testimonials, pricing, faq, cta, footer
- Order logically for conversion: navbar → hero → features → stats → testimonials → pricing → faq → cta → footer
- Return ONLY valid JSON: { "sections": ["navbar", "hero", ...] }
- No explanation, no markdown, no extra keys.`

  const t0 = Date.now()
  // Always return fixed canonical order — no AI call needed, ordering was unreliable anyway
  const sections: SectionType[] = ALL_SECTIONS

  return {
    sections,
    log: {
      step: 'classify',
      sectionType: 'all',
      model: 'fixed',
      fallbackUsed: false,
      systemPrompt: CLASSIFY_SYSTEM,
      userMessage: prompt,
      outputHtml: JSON.stringify(sections),
      inputTokensEst: 0,
      outputTokensEst: 0,
      durationMs: Date.now() - t0,
      status: 'success',
    },
  }
}

function cleanHtml(raw: string): string {
  // First: strip markdown code fences explicitly (handles ```html...``` wrapping from any model)
  let stripped = raw.trim()
  if (stripped.startsWith('```')) {
    stripped = stripped.replace(/^```(?:html)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
  }
  // Find the first < and last > — removes any remaining prose preamble or trailing text
  const firstTag = stripped.indexOf('<')
  const lastTag = stripped.lastIndexOf('>')
  const sliced = firstTag !== -1 && lastTag > firstTag
    ? stripped.slice(firstTag, lastTag + 1)
    : stripped

  // Only strip full document wrapper if the section truly starts with one
  const looksLikeFullDoc = /^\s*(?:<!DOCTYPE|<html)/i.test(sliced)
  const unwrapped = looksLikeFullDoc
    ? sliced
        .replace(/<!DOCTYPE[^>]*>/gi, '')
        .replace(/<html[^>]*>/gi, '')
        .replace(/<\/html>/gi, '')
        .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
        .replace(/<body[^>]*>/gi, '')
        .replace(/<\/body>/gi, '')
        .trim()
    : sliced

  return unwrapped
    // Remove injected <script src="cdn.tailwindcss.com"> — already loaded by assembler
    .replace(/<script\s+src=["']https?:\/\/cdn\.tailwindcss\.com[^"']*["'][^>]*><\/script>/gi, '')
    // Remove injected external script tags (googleapis etc)
    .replace(/<script\s+src=["']https?:\/\/[^"']*googleapis[^"']*["'][^>]*><\/script>/gi, '')
    // Remove <link> tags for Google Fonts — already in assembler head
    .replace(/<link\b[^>]*fonts\.googleapis[^>]*>/gi, '')
    // Strip @import rules inside <style> tags (font imports duplicated from assembler head)
    .replace(/@import\s+url\([^)]+\);?\s*/gi, '')
    // rgba() entfernen — hex-Farben (#abc, #aabbcc) BEHALTEN
    .replace(/\b[\w-]+-\[rgba?\([^\]]+\)\]/g, '')
    // nur Layout-px entfernen (w-, h-, gap- etc.)
    .replace(/\b(?:w|h|min-w|max-w|min-h|max-h|top|left|right|bottom|gap|p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr)-\[\d+px\]/g, '')
    // Replace non-CDN colors: slate-950 → slate-900, slate-925 → slate-900 (v3 CDN stops at 900)
    .replace(/\bslate-9[5-9]0\b/g, 'slate-900')
    .replace(/\bgray-9[5-9]0\b/g, 'gray-900')
    .replace(/\bzinc-9[5-9]0\b/g, 'zinc-900')
    .replace(/\bneutral-9[5-9]0\b/g, 'neutral-900')
    .replace(/\bstone-9[5-9]0\b/g, 'stone-900')
    .trim()
}
