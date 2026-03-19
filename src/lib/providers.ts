import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import type { SectionType } from './store'

const openaiClient    = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export type Provider = 'openai' | 'anthropic'

export interface CallParams {
  provider:     Provider
  model:        string
  system:       string
  user:         string
  maxTokens:    number
  temperature?: number
  effort?:      'low' | 'medium' | 'high'  // Anthropic extended thinking budget
  jsonMode?:    boolean
  onChunk?:     (chunk: string) => void
}

export async function callProvider(p: CallParams): Promise<string> {
  return p.provider === 'anthropic' ? callAnthropic(p) : callOpenAI(p)
}

async function callAnthropic(p: CallParams): Promise<string> {
  const base = {
    model:       p.model,
    max_tokens:  p.maxTokens,
    temperature: p.temperature ?? 0.7,
    effort:      p.effort ?? 'low',  // default low — Pass 1 is constraint-following, not reasoning
    system:      p.system,
    messages:    [{ role: 'user' as const, content: p.user }],
  }
  if (p.onChunk) {
    let full = ''
    const stream = await anthropicClient.messages.create({ ...base, stream: true })
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        full += event.delta.text
        p.onChunk(event.delta.text)
      }
    }
    return full
  }
  const res = await anthropicClient.messages.create(base)
  const block = res.content[0]
  return block?.type === 'text' ? block.text : ''
}

async function callOpenAI(p: CallParams): Promise<string> {
  const isGPT5 = p.model.startsWith('gpt-5')
  const maxKey = isGPT5 ? 'max_completion_tokens' : 'max_tokens'
  const params: Record<string, unknown> = {
    model: p.model,
    messages: [
      { role: 'system', content: p.system },
      { role: 'user',   content: p.user },
    ],
    [maxKey]:    p.maxTokens,
    temperature: p.temperature ?? 0.7,
  }
  if (p.jsonMode) params.response_format = { type: 'json_object' }
  if (p.onChunk) {
    let full = ''
    const stream = (await openaiClient.chat.completions.create({ ...params, stream: true } as any)) as unknown as AsyncIterable<any>
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? ''
      if (delta) { full += delta; p.onChunk(delta) }
    }
    return full
  }
  const res = await openaiClient.chat.completions.create(params as any)
  return (res as any).choices[0]?.message?.content ?? ''
}

// ── Routing ───────────────────────────────────────────────────────

const CREATIVE: SectionType[] = ['hero', 'features', 'custom', 'pricing', 'testimonials']

// Pinned model IDs — update when new stable snapshots are released
const MODELS = {
  claudeSonnet:  'claude-sonnet-4-6',        // no pinned snapshot available yet
  gptMini:       'gpt-5.4-mini-2026-03-17',  // alias: gpt-5.4-mini
  gptNano:       'gpt-5.4-nano',             // no snapshot alias yet
} as const

export function routeGenerate(type: SectionType) {
  if (CREATIVE.includes(type)) {
    return {
      provider:    'anthropic' as Provider,
      model:       MODELS.claudeSonnet,
      temperature: (type === 'hero' || type === 'custom') ? 0.85 : 0.7,
      maxTokens:   4096,
    }
  }
  return { provider: 'openai' as Provider, model: MODELS.gptMini, temperature: 0.5, maxTokens: 3000 }
}

export function routeEnhance() {
  return { provider: 'anthropic' as Provider, model: MODELS.claudeSonnet, temperature: 0.35, maxTokens: 6000, effort: 'medium' as const }
}

export function routeValidate() {
  return { provider: 'openai' as Provider, model: MODELS.gptNano, temperature: 0.1, maxTokens: 800 }
}
