export interface CompletionParams {
  model: string
  system?: string
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  max_tokens: number
  temperature?: number
  effort?: 'low' | 'medium' | 'high'   // Anthropic extended thinking budget
  response_format?: { type: 'json_object' | 'text' }
}

import { AICallPass } from '../logStore'

export interface AICallMeta {
  pass?: AICallPass
  label?: string
}

export interface AIProvider {
  complete(params: CompletionParams, meta?: AICallMeta): Promise<string>
  stream(params: CompletionParams, onChunk: (chunk: string) => void, meta?: AICallMeta): Promise<string>
}
