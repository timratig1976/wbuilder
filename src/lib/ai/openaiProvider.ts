import OpenAI from 'openai'
import { AIProvider, CompletionParams } from './types'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export class OpenAIProvider implements AIProvider {
  async complete(params: CompletionParams): Promise<string> {
    const isO = params.model.startsWith('o4') || params.model.startsWith('o3')
    const res = await client.chat.completions.create({
      model: params.model,
      messages: [
        ...(params.system ? [{ role: 'system' as const, content: params.system }] : []),
        ...params.messages,
      ],
      ...(isO
        ? { max_completion_tokens: params.max_tokens }
        : { max_tokens: params.max_tokens, temperature: params.temperature }),
      ...(params.response_format ? { response_format: params.response_format } : {}),
    })
    return res.choices[0]?.message?.content ?? ''
  }

  async stream(params: CompletionParams, onChunk: (c: string) => void): Promise<string> {
    let full = ''
    const stream = await client.chat.completions.create({
      model: params.model,
      messages: [
        ...(params.system ? [{ role: 'system' as const, content: params.system }] : []),
        ...params.messages,
      ],
      max_tokens: params.max_tokens,
      temperature: params.temperature,
      stream: true,
    })
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? ''
      if (delta) { full += delta; onChunk(delta) }
    }
    return full
  }
}
