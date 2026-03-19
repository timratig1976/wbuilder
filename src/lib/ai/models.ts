import { OpenAIProvider } from './openaiProvider'
import { AnthropicProvider } from './anthropicProvider'
import { AIProvider } from './types'

export const MODEL_CONFIG = {
  manifest_generation: {
    model: 'gpt-5.4-mini-2026-03-17', max_tokens: 4000, temperature: 0.3,
    response_format: { type: 'json_object' as const },
  },
  pass1_structure: {
    model: 'gpt-5.4-mini-2026-03-17', max_tokens: 10000, temperature: 0.4,
  },
  pass2_visual: {
    model: 'claude-sonnet-4-6', max_tokens: 8000, temperature: 0.6,
    effort: 'medium' as const,
  },
  pass3_validator: {
    model: 'gpt-5.4-nano', max_tokens: 2000, temperature: 0.1,
    response_format: { type: 'json_object' as const },
  },
  screenshot_analysis: {
    model: 'gpt-5.4-mini-2026-03-17', max_tokens: 2000, temperature: 0.1,
    response_format: { type: 'json_object' as const },
  },
} as const

// Route to correct provider based on model prefix
export function getProvider(model: string): AIProvider {
  return model.startsWith('claude') ? new AnthropicProvider() : new OpenAIProvider()
}

// Default provider (OpenAI) — kept for backward compat where callers don't pass a model
export const provider = new OpenAIProvider()
