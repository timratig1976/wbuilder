import OpenAI from 'openai'
import { SectionType } from './store'
import { loadExamples } from './examples'

export interface AICallLog {
  step: 'classify' | 'generate'
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

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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
  // Tier 1 — gpt-5.4 for most visible, design-critical sections
  hero:         { primary: 'gpt-5.4',     fallback: 'gpt-4o',      temperature: 0.8, maxTokens: 4096 },
  features:     { primary: 'gpt-5.4',     fallback: 'gpt-4o',      temperature: 0.7, maxTokens: 4096 },
  pricing:      { primary: 'gpt-5.4',     fallback: 'gpt-4o',      temperature: 0.5, maxTokens: 4096 },
  custom:       { primary: 'gpt-5.4',     fallback: 'gpt-4o',      temperature: 0.8, maxTokens: 4096 },
  // Tier 2 — gpt-4o for moderate complexity
  testimonials: { primary: 'gpt-4o',      fallback: 'gpt-4o-mini', temperature: 0.7, maxTokens: 3000 },
  // Tier 3 — gpt-4o-mini for templatic sections
  navbar:       { primary: 'gpt-4o-mini', fallback: 'gpt-4o',      temperature: 0.4, maxTokens: 2048 },
  footer:       { primary: 'gpt-4o-mini', fallback: 'gpt-4o',      temperature: 0.4, maxTokens: 2048 },
  cta:          { primary: 'gpt-4o-mini', fallback: 'gpt-4o',      temperature: 0.6, maxTokens: 1500 },
  stats:        { primary: 'gpt-4o-mini', fallback: 'gpt-4o',      temperature: 0.4, maxTokens: 1500 },
  faq:          { primary: 'gpt-4o-mini', fallback: 'gpt-4o',      temperature: 0.5, maxTokens: 2048 },
}

// Per-section layout hints appended to the system prompt
const SECTION_HINTS: Partial<Record<SectionType, string>> = {
  hero:         'Use a full-width layout with a large bold headline, subtext, 1-2 CTA buttons, and a hero image or gradient background.',
  features:     'Use a grid layout (2 or 3 columns) with icon + title + description per feature. Include 4-6 features.',
  pricing:      'Show 2-3 pricing tiers side-by-side. Highlight the recommended plan. Include feature lists and a CTA button per tier.',
  testimonials: 'Show 3 customer testimonials in a card grid with avatar, name, role, company, and quote.',
  stats:        'Show 3-4 key metrics as large numbers with labels, in a horizontal row or grid.',
  cta:          'Full-width banner with a bold headline, short supporting text, and one prominent CTA button.',
  navbar:       'Sticky top navigation with logo on left, nav links in center/right, and a CTA button. Include a mobile hamburger menu placeholder.',
  footer:       'Multi-column footer with logo, nav link groups, social icons, and copyright line.',
  faq:          'Accordion-style FAQ with 4-6 question/answer pairs. Use details/summary or styled divs.',
  custom:       'Create a visually rich, unique section that fits the page context.',
}

const BASE_SYSTEM_PROMPT = `You are an expert HTML and Tailwind CSS developer.
Generate ONLY raw HTML for a single webpage section.
STRICT RULES:
- Use ONLY Tailwind CSS utility classes (CDN compatible, no custom config needed)
- Use https://placehold.co/WIDTHxHEIGHT/BGCOLOR/TEXTCOLOR?text=Label for all images
- Mobile-first, fully responsive using Tailwind breakpoints (sm:, md:, lg:)
- Clean semantic HTML5 elements
- No JavaScript unless absolutely essential for the section type
- NO markdown, NO code fences, NO explanation — return ONLY the raw HTML
- Make it visually beautiful, modern and professional
- Use rich color, spacing, and typography — avoid plain/minimal output`

function buildSystemPrompt(type: SectionType): string {
  const hint = SECTION_HINTS[type]
  return hint ? `${BASE_SYSTEM_PROMPT}\n\nSECTION-SPECIFIC GUIDANCE: ${hint}` : BASE_SYSTEM_PROMPT
}

export interface GenerateResult {
  html: string
  log: AICallLog
}

export interface ClassifyResult {
  sections: SectionType[]
  log: AICallLog
}

export async function generateSection(
  type: SectionType,
  pagePrompt: string,
  customPrompt?: string,
  onChunk?: (chunk: string) => void
): Promise<GenerateResult> {
  const examples = loadExamples(type)
  const exampleContext = examples.length > 0
    ? `\n\nREFERENCE EXAMPLE (use as style inspiration, do NOT copy verbatim):\n${examples[0].html.slice(0, 1500)}`
    : ''

  const userMessage = `Generate a "${type}" section for the following webpage:
Page description: ${pagePrompt}
${customPrompt ? `Additional instructions: ${customPrompt}` : ''}
Section type: ${type}
${exampleContext}`

  const cfg = MODEL_CONFIG[type] ?? MODEL_CONFIG.custom
  const systemPrompt = buildSystemPrompt(type)
  const models = [cfg.primary, cfg.fallback]
  let fallbackUsed = false

  console.log(`[AI] ${type} → ${cfg.primary} (t=${cfg.temperature}, max=${cfg.maxTokens})`)

  for (const model of models) {
    const t0 = Date.now()
    try {
      let html = ''

      if (onChunk) {
        const stream = await openai.chat.completions.create({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          stream: true,
          max_tokens: cfg.maxTokens,
          temperature: cfg.temperature,
        })
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content ?? ''
          html += delta
          onChunk(delta)
        }
      } else {
        const res = await openai.chat.completions.create({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          max_tokens: cfg.maxTokens,
          temperature: cfg.temperature,
        })
        html = res.choices[0]?.message?.content ?? ''
      }

      const cleaned = cleanHtml(html)
      return {
        html: cleaned,
        log: {
          step: 'generate',
          sectionType: type,
          model,
          fallbackUsed,
          systemPrompt,
          userMessage,
          outputHtml: cleaned,
          inputTokensEst: Math.ceil((systemPrompt.length + userMessage.length) / 4),
          outputTokensEst: Math.ceil(cleaned.length / 4),
          durationMs: Date.now() - t0,
          status: fallbackUsed ? 'fallback' : 'success',
        },
      }
    } catch (err: unknown) {
      const isRateLimit = err instanceof OpenAI.APIError && err.status === 429
      const isModelNotFound = err instanceof OpenAI.APIError && err.status === 404
      if (isRateLimit || isModelNotFound) {
        console.warn(`[AI] ${model} failed, trying fallback ${cfg.fallback}...`)
        fallbackUsed = true
        continue
      }
      const msg = err instanceof Error ? err.message : String(err)
      return {
        html: `<!-- ERROR: ${msg} -->`,
        log: {
          step: 'generate',
          sectionType: type,
          model,
          fallbackUsed,
          systemPrompt,
          userMessage,
          outputHtml: '',
          inputTokensEst: Math.ceil((systemPrompt.length + userMessage.length) / 4),
          outputTokensEst: 0,
          durationMs: Date.now() - t0,
          status: 'error',
          error: msg,
        },
      }
    }
  }

  throw new Error('All models failed')
}

// Intent classification — gpt-4o-mini: fast, cheap, just needs valid JSON output
export async function classifyIntent(prompt: string): Promise<ClassifyResult> {
  const CLASSIFY_SYSTEM = `You are a webpage section planner. Given a description of a webpage, return a JSON array of section types in order.
Available types: navbar, hero, features, stats, testimonials, pricing, faq, cta, footer
Return ONLY a valid JSON array like: ["navbar","hero","features","cta","footer"]
No explanation, no markdown.`

  const t0 = Date.now()
  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: CLASSIFY_SYSTEM },
      { role: 'user', content: prompt },
    ],
    max_tokens: 200,
    temperature: 0.3,
  })

  const raw = res.choices[0]?.message?.content ?? '[]'
  const cleaned = raw.replace(/```json|```/g, '').trim()
  let sections: SectionType[]
  try {
    sections = JSON.parse(cleaned) as SectionType[]
  } catch {
    sections = ['navbar', 'hero', 'features', 'cta', 'footer']
  }

  return {
    sections,
    log: {
      step: 'classify',
      sectionType: 'all',
      model: 'gpt-4o-mini',
      fallbackUsed: false,
      systemPrompt: CLASSIFY_SYSTEM,
      userMessage: prompt,
      outputHtml: raw,
      inputTokensEst: Math.ceil((CLASSIFY_SYSTEM.length + prompt.length) / 4),
      outputTokensEst: Math.ceil(raw.length / 4),
      durationMs: Date.now() - t0,
      status: 'success',
    },
  }
}

function cleanHtml(raw: string): string {
  return raw
    .replace(/^```html\n?/i, '')
    .replace(/^```\n?/, '')
    .replace(/\n?```$/, '')
    .trim()
}
