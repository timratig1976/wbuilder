import Anthropic from '@anthropic-ai/sdk'
import { AIProvider, CompletionParams, AICallMeta } from './types'
import { createPendingLog, estimateTokens, AICallLog } from '../logStore'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export class AnthropicProvider implements AIProvider {
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
      const res = await client.messages.create({
        model:       params.model,
        max_tokens:  params.max_tokens,
        temperature: params.temperature ?? 0.7,
        system:      params.system,
        messages:    params.messages.map((m) => ({ role: m.role, content: m.content })),
      } as any)
      const block = res.content[0]
      const response = block?.type === 'text' ? block.text : ''
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
      const stream = (await client.messages.create({
        model:       params.model,
        max_tokens:  params.max_tokens,
        temperature: params.temperature ?? 0.7,
        system:      params.system,
        messages:    params.messages.map((m) => ({ role: m.role, content: m.content })),
        stream:      true,
      } as any)) as unknown as AsyncIterable<any>
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          full += event.delta.text
          onChunk(event.delta.text)
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
