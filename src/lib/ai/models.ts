import { OpenAIProvider } from './openaiProvider'

export const MODEL_CONFIG = {
  manifest_generation: {
    model: 'gpt-4.1', max_tokens: 4000, temperature: 0.2,
    response_format: { type: 'json_object' as const },
  },
  pass1_structure: {
    model: 'gpt-4.1', max_tokens: 8192, temperature: 0.4,
  },
  pass2_visual: {
    model: 'gpt-4.1', max_tokens: 6000, temperature: 0.65,
  },
  pass3_validator: {
    model: 'o4-mini', max_tokens: 2000,
    response_format: { type: 'json_object' as const },
  },
  screenshot_analysis: {
    model: 'gpt-4o', max_tokens: 2000, temperature: 0.1,
    response_format: { type: 'json_object' as const },
  },
} as const

export const provider = new OpenAIProvider()
