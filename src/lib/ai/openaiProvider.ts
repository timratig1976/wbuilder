import OpenAI from 'openai'
import { AIProvider, CompletionParams, AICallMeta } from './types'
import { createPendingLog, estimateTokens, AICallLog } from '../logStore'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export class OpenAIProvider implements AIProvider {
  // Optional callback — set by sectionGenerator to forward log events via SSE
  onLog?: (entry: AICallLog) => void

  private emit(entry: AICallLog) {
    this.onLog?.(entry)
  }

  async complete(params: CompletionParams, meta?: AICallMeta): Promise<string> {
    const userMessage = params.messages.map((m) => m.content).join('\n')
    const entry = createPendingLog(
      meta?.pass ?? 'other',
      meta?.label ?? params.model,
      params.model,
      params.system ?? '',
      userMessage,
    )
    this.emit(entry)

    const t0 = Date.now()
    try {
      const isO = params.model.startsWith('o4') || params.model.startsWith('o3')
      const isGpt5 = params.model.startsWith('gpt-5')
      const useCompletionTokens = isO || isGpt5
      const res = await client.chat.completions.create({
        model: params.model,
        messages: [
          ...(params.system ? [{ role: 'system' as const, content: params.system }] : []),
          ...params.messages,
        ],
        ...(useCompletionTokens
          ? { max_completion_tokens: params.max_tokens }
          : { max_tokens: params.max_tokens, temperature: params.temperature }),
        ...(params.model === 'gpt-5.4' ? { temperature: params.temperature } : {}),
        ...(params.response_format ? { response_format: params.response_format } : {}),
      })
      const response = res.choices[0]?.message?.content ?? ''
      this.emit({ ...entry, response, outputTokensEst: estimateTokens(response), durationMs: Date.now() - t0, status: 'success' })
      return response
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      this.emit({ ...entry, durationMs: Date.now() - t0, status: 'error', error: msg })
      throw err
    }
  }

  async stream(params: CompletionParams, onChunk: (c: string) => void, meta?: AICallMeta): Promise<string> {
    const userMessage = params.messages.map((m) => m.content).join('\n')
    const entry = createPendingLog(
      meta?.pass ?? 'other',
      meta?.label ?? params.model,
      params.model,
      params.system ?? '',
      userMessage,
    )
    entry.streaming = true
    entry.status = 'streaming'
    this.emit(entry)

    const t0 = Date.now()
    let full = ''
    try {
      const isO = params.model.startsWith('o4') || params.model.startsWith('o3') || params.model.startsWith('o1')
      const isGpt5 = params.model.startsWith('gpt-5')
      const useCompletionTokens = isO || isGpt5
      const stream = await client.chat.completions.create({
        model: params.model,
        messages: [
          ...(params.system ? [{ role: 'system' as const, content: params.system }] : []),
          ...params.messages,
        ],
        ...(useCompletionTokens
          ? { max_completion_tokens: params.max_tokens }
          : { max_tokens: params.max_tokens, temperature: params.temperature }),
        ...(params.model === 'gpt-5.4' ? { temperature: params.temperature } : {}),
        stream: true,
      })
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content ?? ''
        if (delta) {
          full += delta
          onChunk(delta)
        }
      }
      this.emit({ ...entry, response: full, outputTokensEst: estimateTokens(full), durationMs: Date.now() - t0, status: 'success' })
      return full
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      this.emit({ ...entry, response: full, durationMs: Date.now() - t0, status: 'error', error: msg })
      throw err
    }
  }
}
