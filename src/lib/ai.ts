import OpenAI from 'openai'
import { SectionType } from './store'
import { loadExamples } from './examples'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const SYSTEM_PROMPT = `You are an expert HTML and Tailwind CSS developer.
Generate ONLY raw HTML for a single webpage section.
STRICT RULES:
- Use ONLY Tailwind CSS utility classes (CDN compatible, no custom config needed)
- Use https://placehold.co/WIDTHxHEIGHT/BGCOLOR/TEXTCOLOR?text=Description for all images
- Mobile-first, fully responsive using Tailwind breakpoints (sm:, md:, lg:)
- Clean semantic HTML5
- No JavaScript unless absolutely essential
- NO markdown, NO code fences, NO explanation — return ONLY the raw HTML
- Make it visually beautiful, modern and professional`

export async function generateSection(
  type: SectionType,
  pagePrompt: string,
  customPrompt?: string,
  onChunk?: (chunk: string) => void
): Promise<string> {
  const examples = loadExamples(type)
  const exampleContext = examples.length > 0
    ? `\n\nREFERENCE EXAMPLE (use as style inspiration, do NOT copy verbatim):\n${examples[0].html.slice(0, 1500)}`
    : ''

  const userMessage = `Generate a "${type}" section for the following webpage:
Page description: ${pagePrompt}
${customPrompt ? `Additional instructions: ${customPrompt}` : ''}
Section type: ${type}
${exampleContext}`

  const models = ['gpt-4o', 'gpt-4o']

  for (const model of models) {
    try {
      if (onChunk) {
        const stream = await openai.chat.completions.create({
          model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userMessage },
          ],
          stream: true,
          max_tokens: 3000,
          temperature: 0.7,
        })

        let full = ''
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content ?? ''
          full += delta
          onChunk(delta)
        }
        return cleanHtml(full)
      } else {
        const res = await openai.chat.completions.create({
          model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userMessage },
          ],
          max_tokens: 3000,
          temperature: 0.7,
        })
        return cleanHtml(res.choices[0]?.message?.content ?? '')
      }
    } catch (err: unknown) {
      const isRateLimit = err instanceof OpenAI.APIError && err.status === 429
      const isModelNotFound = err instanceof OpenAI.APIError && err.status === 404
      if (isRateLimit || isModelNotFound) {
        console.warn(`Model ${model} failed, trying fallback...`)
        continue
      }
      throw err
    }
  }

  throw new Error('All models failed')
}

export async function classifyIntent(prompt: string): Promise<SectionType[]> {
  const res = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a webpage section planner. Given a description of a webpage, return a JSON array of section types in order.
Available types: navbar, hero, features, stats, testimonials, pricing, faq, cta, footer
Return ONLY a valid JSON array like: ["navbar","hero","features","cta","footer"]
No explanation, no markdown.`,
      },
      { role: 'user', content: prompt },
    ],
    max_tokens: 200,
    temperature: 0.3,
  })

  try {
    const content = res.choices[0]?.message?.content ?? '[]'
    const cleaned = content.replace(/```json|```/g, '').trim()
    return JSON.parse(cleaned) as SectionType[]
  } catch {
    return ['navbar', 'hero', 'features', 'cta', 'footer']
  }
}

function cleanHtml(raw: string): string {
  return raw
    .replace(/^```html\n?/i, '')
    .replace(/^```\n?/, '')
    .replace(/\n?```$/, '')
    .trim()
}
