import { NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 180

// ── Predefined mutation axes ─────────────────────────────────────────────────
// Each axis produces a distinctly different visual treatment.
// These are grouped so you can pick a subset or run all 31.
export const VARIATION_AXES: { id: string; label: string; group: string; instruction: string }[] = [
  // Color / bg
  { id: 'dark-bg',        group: 'color',    label: 'Dark background',     instruction: 'Convert to a dark background design: use bg-gray-900 or bg-slate-950 as section bg, make text white/light, adjust borders to white/10 opacity, keep accent color' },
  { id: 'light-bg',       group: 'color',    label: 'Light background',    instruction: 'Convert to a clean light background: use bg-white or bg-gray-50 as section bg, dark text, subtle gray borders, clean and minimal' },
  { id: 'gradient-bg',    group: 'color',    label: 'Gradient background', instruction: 'Replace the section background with a rich gradient: use bg-gradient-to-br from indigo/violet to bg matching the design direction' },
  { id: 'glass-dark',     group: 'color',    label: 'Glassmorphism dark',  instruction: 'Dark background with glassmorphism effect: set section bg to bg-gray-950, apply bg-white/5 backdrop-blur-md border border-white/10 on inner container/cards. CRITICAL: change ALL text to light colors — headings to text-white, body text to text-gray-300, muted text to text-gray-400. Ensure every text element is readable on the dark background.' },
  { id: 'brand-accent',   group: 'color',    label: 'Accent-first',        instruction: 'Make the accent color dominant: use var(--color-accent) as the section background, white text, invert the color hierarchy so accent is the primary surface' },

  // Layout
  { id: 'centered',       group: 'layout',   label: 'Centered layout',     instruction: 'Convert to a fully centered single-column layout: all content center-aligned, max-w-3xl mx-auto, remove any grid columns' },
  { id: 'split-50-50',    group: 'layout',   label: 'Split 50/50',         instruction: 'Convert to a two-column split layout: grid grid-cols-1 md:grid-cols-2 gap-12, content left, visual/image right' },
  { id: 'wide-asymmetric',group: 'layout',   label: 'Asymmetric wide',     instruction: 'Use an asymmetric grid: grid-cols-5, content takes 3 cols and visual takes 2, or vice versa' },
  { id: 'full-width',     group: 'layout',   label: 'Full bleed',          instruction: 'Make the section full-bleed: remove max-width constraints, content touches edges, use edge-to-edge background treatments' },
  { id: 'bento-grid',     group: 'layout',   label: 'Bento grid',          instruction: 'Convert to a bento grid layout: mixed-size cards in a CSS grid, some spanning 2 columns, use grid-cols-3 with strategic col-span-2' },

  // Typography
  { id: 'large-type',     group: 'typography', label: 'Giant headline',    instruction: 'Make the headline extremely large and dominant: use text-6xl md:text-8xl lg:text-9xl, font-black, tight tracking, let it be the hero of the layout' },
  { id: 'editorial',      group: 'typography', label: 'Editorial serif',   instruction: 'Switch to an editorial style: use font-serif for headings, font-normal or font-light weight, generous line-height, refined and magazine-like' },
  { id: 'mono-tech',      group: 'typography', label: 'Monospace tech',    instruction: 'Use monospace/tech typography: font-mono for labels and sub-headings, add code-like eyebrow labels like "// FEATURE 01", technical aesthetic' },
  { id: 'minimal-type',   group: 'typography', label: 'Minimal text',      instruction: 'Reduce text to absolute minimum: very short copy, lots of whitespace, small font sizes for body, only one CTA, clean and sparse' },

  // Decoration
  { id: 'no-decoration',  group: 'decoration', label: 'No decoration',     instruction: 'Strip all decorative elements: remove gradients, shapes, overlays, borders, shadows — pure flat color backgrounds, typography-first design' },
  { id: 'mesh-gradient',  group: 'decoration', label: 'Mesh gradient',     instruction: 'Add a mesh gradient background: use multiple layered radial-gradient CSS values in the background, overlapping soft color blobs in the section bg' },
  { id: 'border-heavy',   group: 'decoration', label: 'Bold borders',      instruction: 'Add strong borders: heavy 2px borders on cards and sections, bold dividers, border-based layout structure, brutalist-adjacent but still clean' },
  { id: 'noise-texture',  group: 'decoration', label: 'Noise texture',     instruction: 'Add a subtle noise/grain texture overlay: use a pseudo-element with SVG noise as background-image, set opacity-[0.03], creates organic tactile feel' },
  { id: 'geometric',      group: 'decoration', label: 'Geometric shapes',  instruction: 'Add decorative geometric shapes: use absolutely positioned divs with rotate transforms, circles, squares as background decoration, low opacity' },

  // Animation
  { id: 'no-animation',   group: 'animation', label: 'Static / no anim',  instruction: 'Remove all animations and transitions: delete any animate-*, @keyframes, transition-* classes. Pure static, no movement at all' },
  { id: 'fade-up',        group: 'animation', label: 'Fade up on scroll',  instruction: 'Add fade-up scroll animations: use opacity-0 translate-y-8 with intersection observer data attributes, or use Tailwind animate-fade-up class' },
  { id: 'stagger-anim',   group: 'animation', label: 'Stagger entrance',   instruction: 'Add staggered entrance animations to child elements: each item delays 100ms more than previous, using animation-delay inline styles' },
  { id: 'hover-rich',     group: 'animation', label: 'Rich hover effects', instruction: 'Add rich hover interactions to cards/items: scale-[1.03], shadow-xl, -translate-y-2 on hover, group/group-hover pattern, smooth transition-all duration-300' },

  // Card style
  { id: 'flat-cards',     group: 'cards',    label: 'Flat cards',          instruction: 'Use completely flat cards: no shadow, thin 1px border border-gray-200, no hover lift, clean minimal card aesthetic' },
  { id: 'elevated-cards', group: 'cards',    label: 'Elevated cards',      instruction: 'Use heavily elevated cards: shadow-2xl, rounded-2xl or rounded-3xl, white bg, deep hover shadow, card feels like it floats off the page' },
  { id: 'outlined-cards', group: 'cards',    label: 'Outlined cards',      instruction: 'Cards with prominent outline borders: border-2 border-accent/30 or border-primary, no fill background, border-first aesthetic' },
  { id: 'icon-top',       group: 'cards',    label: 'Icon top cards',      instruction: 'Add icon-top pattern to cards: each card starts with a w-10 h-10 rounded-xl icon container with accent bg, then heading, then body text' },

  // Density
  { id: 'compact',        group: 'density',  label: 'Compact / dense',     instruction: 'Make the layout compact and information-dense: reduce padding by 50%, tighter gaps, more items visible, smaller text, efficient use of space' },
  { id: 'spacious',       group: 'density',  label: 'Spacious / airy',     instruction: 'Make the layout extremely spacious: double all padding and gaps, py-32 md:py-40 for sections, wide gaps between elements, luxurious whitespace' },

  // CTA style
  { id: 'pill-cta',       group: 'cta',      label: 'Pill CTAs',           instruction: 'Change all CTA buttons to pill/rounded style: rounded-full, add slight padding increase, pill shape is the distinctive change' },
  { id: 'ghost-cta',      group: 'cta',      label: 'Ghost CTAs',          instruction: 'Change primary CTA to ghost style: transparent bg, accent-colored border and text, only outline — no filled button' },
]

export type VariationModel =
  | 'gpt-5.4'
  | 'gpt-5.4-2026-03-05'
  | 'gpt-5-mini-2025-08-07'
  | 'gpt-5-2025-08-07'
  | 'gpt-4.1'
  | 'gpt-4.1-mini'
  | 'gpt-4.1-nano'
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'gpt-4-turbo'
  | 'claude-3-5-haiku-20241022'
  | 'claude-3-5-sonnet-20241022'
  | 'claude-3-7-sonnet-20250219'

// GPT-5 family requires max_completion_tokens instead of max_tokens, and no temperature
const GPT5_MODELS = new Set(['gpt-5.4','gpt-5.4-2026-03-05','gpt-5-mini-2025-08-07','gpt-5-2025-08-07','gpt-5','gpt-5-mini','gpt-5-nano'])

export const MODEL_OPTIONS: { id: VariationModel; label: string; provider: 'openai' | 'anthropic'; note: string }[] = [
  { id: 'gpt-5.4',                    label: 'GPT-5.4',            provider: 'openai',    note: '🔥 Latest GPT-5 · best' },
  { id: 'gpt-5.4-2026-03-05',         label: 'GPT-5.4 (Mar 26)',   provider: 'openai',    note: '🔥 GPT-5.4 snapshot' },
  { id: 'gpt-5-mini-2025-08-07',      label: 'GPT-5 mini',         provider: 'openai',    note: 'GPT-5 · fast · cheap' },
  { id: 'gpt-5-2025-08-07',           label: 'GPT-5',              provider: 'openai',    note: 'GPT-5 base' },
  { id: 'gpt-4.1',                    label: 'GPT-4.1',            provider: 'openai',    note: 'Latest GPT-4 · great quality' },
  { id: 'gpt-4.1-mini',               label: 'GPT-4.1 mini',       provider: 'openai',    note: 'Fast · great quality' },
  { id: 'gpt-4.1-nano',               label: 'GPT-4.1 nano',       provider: 'openai',    note: 'Fastest · cheapest' },
  { id: 'gpt-4o',                     label: 'GPT-4o',             provider: 'openai',    note: 'Proven · reliable' },
  { id: 'gpt-4o-mini',                label: 'GPT-4o mini',        provider: 'openai',    note: 'Fast · cheap' },
  { id: 'gpt-4-turbo',                label: 'GPT-4 Turbo',        provider: 'openai',    note: 'Creative · slower' },
  { id: 'claude-3-5-haiku-20241022',  label: 'Claude 3.5 Haiku',  provider: 'anthropic', note: 'Fast · very creative' },
  { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet', provider: 'anthropic', note: 'Best Anthropic quality' },
  { id: 'claude-3-7-sonnet-20250219', label: 'Claude 3.7 Sonnet', provider: 'anthropic', note: 'Latest · most creative' },
]

export interface BatchVariationRequest {
  html: string
  axisIds?: string[]   // subset of VARIATION_AXES ids — if empty, use all
  concurrency?: number // max parallel requests (default 10, max 15)
  model?: VariationModel
}

export interface BatchVariationResult {
  axisId: string
  label: string
  group: string
  html: string | null
  error?: string
  ms: number
  modelUsed?: string
}

function stripSvgs(html: string): { stripped: string; svgs: string[] } {
  const svgs: string[] = []
  const stripped = html.replace(/<svg[\s\S]*?<\/svg>/gi, (match) => {
    svgs.push(match)
    return `__SVG_${svgs.length - 1}__`
  })
  return { stripped, svgs }
}

function restoreSvgs(html: string, svgs: string[]): string {
  return html.replace(/__SVG_(\d+)__/g, (_, i) => svgs[Number(i)] ?? '')
}

const SYSTEM_PROMPT = `You are an expert Tailwind CSS UI developer producing visual variations of HTML sections.
Apply the variation instruction precisely. Keep semantic structure and content identical.
Output ONLY the raw modified HTML — no markdown, no code fences, no explanation.
Preserve all Tailwind classes not affected by the variation.
Use CSS variables var(--color-accent), var(--color-primary) for brand colors when needed.
SVG elements have been replaced with __SVG_0__, __SVG_1__ etc. placeholders — keep them exactly as-is in your output, do not modify or remove them.`

async function generateVariationOpenAI(
  model: string,
  sourceHtml: string,
  axis: { id: string; label: string; group: string; instruction: string }
): Promise<BatchVariationResult> {
  const start = Date.now()
  try {
    const OpenAI = (await import('openai')).default
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const isGpt5 = GPT5_MODELS.has(model)
    const { stripped, svgs } = stripSvgs(sourceHtml)
    const resp = await client.chat.completions.create({
      model,
      ...(isGpt5
        ? { max_completion_tokens: 4000 }           // GPT-5: no temperature, use max_completion_tokens
        : { max_tokens: 4000, temperature: 0.7 }),   // GPT-4 family: classic params
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `VARIATION: ${axis.label}\nINSTRUCTION: ${axis.instruction}\n\nSOURCE HTML:\n${stripped.slice(0, 8000)}` },
      ],
    })
    const raw = resp.choices[0]?.message?.content ?? ''
    const clean = raw.replace(/^```[\w]*\n?/m, '').replace(/\n?```$/m, '').trim()
    const restored = restoreSvgs(clean, svgs)
    const modelUsed = resp.model ?? model
    return { axisId: axis.id, label: axis.label, group: axis.group, html: restored, ms: Date.now() - start, modelUsed }
  } catch (err) {
    return { axisId: axis.id, label: axis.label, group: axis.group, html: null, error: String(err), ms: Date.now() - start, modelUsed: model }
  }
}

async function generateVariationAnthropic(
  model: string,
  sourceHtml: string,
  axis: { id: string; label: string; group: string; instruction: string }
): Promise<BatchVariationResult> {
  const start = Date.now()
  try {
    const { stripped, svgs } = stripSvgs(sourceHtml)
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY ?? '',
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: 4000,
        system: SYSTEM_PROMPT,
        messages: [
          { role: 'user', content: `VARIATION: ${axis.label}\nINSTRUCTION: ${axis.instruction}\n\nSOURCE HTML:\n${stripped.slice(0, 8000)}` },
        ],
      }),
    })
    if (!resp.ok) {
      const err = await resp.text()
      throw new Error(`Anthropic ${resp.status}: ${err.slice(0, 200)}`)
    }
    const json = await resp.json() as { content: Array<{ type: string; text: string }> }
    const raw = json.content?.find(c => c.type === 'text')?.text ?? ''
    const clean = raw.replace(/^```[\w]*\n?/m, '').replace(/\n?```$/m, '').trim()
    const restored = restoreSvgs(clean, svgs)
    return { axisId: axis.id, label: axis.label, group: axis.group, html: restored, ms: Date.now() - start, modelUsed: model }
  } catch (err) {
    return { axisId: axis.id, label: axis.label, group: axis.group, html: null, error: String(err), ms: Date.now() - start, modelUsed: model }
  }
}

async function generateVariation(
  model: VariationModel,
  sourceHtml: string,
  axis: { id: string; label: string; group: string; instruction: string }
): Promise<BatchVariationResult> {
  const provider = MODEL_OPTIONS.find(m => m.id === model)?.provider ?? 'openai'
  return provider === 'anthropic'
    ? generateVariationAnthropic(model, sourceHtml, axis)
    : generateVariationOpenAI(model, sourceHtml, axis)
}

export async function POST(req: NextRequest) {
  const body = await req.json() as BatchVariationRequest
  const { html, axisIds, concurrency = 10, model = 'gpt-4o-mini' } = body

  if (!html) return Response.json({ error: 'Missing html' }, { status: 400 })

  const axes = axisIds?.length
    ? VARIATION_AXES.filter(a => axisIds.includes(a.id))
    : VARIATION_AXES

  const maxConcurrency = Math.min(Math.max(1, concurrency), 15)

  // Process in batches of maxConcurrency
  const results: BatchVariationResult[] = []
  for (let i = 0; i < axes.length; i += maxConcurrency) {
    const batch = axes.slice(i, i + maxConcurrency)
    const batchResults = await Promise.all(
      batch.map(axis => generateVariation(model, html, axis))
    )
    results.push(...batchResults)
  }

  const succeeded = results.filter(r => r.html).length
  const failed = results.filter(r => !r.html).length

  return Response.json({ results, succeeded, failed, total: results.length })
}
