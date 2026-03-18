import { OpenAIProvider } from './openaiProvider'

export const MODEL_CONFIG = {
  manifest_generation: {
    model: 'gpt-5-mini', max_tokens: 4000, temperature: 0.3,
    response_format: { type: 'json_object' as const },
  },
  pass1_structure: {
    model: 'gpt-5.4', max_tokens: 10000, temperature: 0.4,
  },
  pass2_visual: {
    model: 'gpt-5.4', max_tokens: 8000, temperature: 0.6,
  },
  pass3_validator: {
    model: 'gpt-5-mini', max_tokens: 2000, temperature: 0.1,
    response_format: { type: 'json_object' as const },
  },
  screenshot_analysis: {
    model: 'gpt-5-mini', max_tokens: 2000, temperature: 0.1,
    response_format: { type: 'json_object' as const },
  },
} as const

export const provider = new OpenAIProvider()
