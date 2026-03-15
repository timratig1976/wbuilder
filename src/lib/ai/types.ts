export interface CompletionParams {
  model: string
  system?: string
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  max_tokens: number
  temperature?: number
  response_format?: { type: 'json_object' | 'text' }
}

export interface AIProvider {
  complete(params: CompletionParams): Promise<string>
  stream(params: CompletionParams, onChunk: (chunk: string) => void): Promise<string>
}
