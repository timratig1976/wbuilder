import { NextRequest } from 'next/server'
import { generateSection, classifyIntent, enhanceSection, PageContext } from '@/lib/ai'
import { SectionType } from '@/lib/store'
import { appendLog, RunType } from '@/lib/serverLogger'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 min — generate (~50s) + enhance (~35s) per section

// Sentinels that separate streamed HTML from the log trailers
const LOG_SEPARATOR = '\n\n<!--PAGECRAFT_LOG:'
const ENHANCE_SEPARATOR = '\n\n<!--PAGECRAFT_ENHANCED:'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { type, pagePrompt, customPrompt, classify, styleEdit, currentHtml, styleInstruction, brand, pageContext, runId, runType } = body
  const effectiveRunId: string = runId ?? `manual-${Date.now()}`
  const effectiveRunType: RunType = runType ?? 'add-section'

  if (classify) {
    const result = await classifyIntent(pagePrompt)
    appendLog({
      ts: new Date().toISOString(),
      runId: effectiveRunId,
      runType: 'classify',
      step: 'classify',
      sectionType: 'all',
      model: result.log.model,
      fallbackUsed: false,
      status: result.log.status,
      durationMs: result.log.durationMs,
      inputTokensEst: result.log.inputTokensEst,
      outputTokensEst: result.log.outputTokensEst,
      pagePrompt,
      userMessage: result.log.userMessage,
      systemPrompt: result.log.systemPrompt,
      outputHtml: `sections: ${JSON.stringify(result.sections)}`,
    })
    return Response.json({ sections: result.sections, log: result.log })
  }

  if (styleEdit) {
    const t0 = Date.now()
    const systemPrompt = `You are an expert HTML/CSS/Tailwind engineer. You will receive a section's full HTML (which may include an inline <style> block with keyframes and CSS rules) and a style instruction.

Apply ONLY the changes described in the instruction. Rules:
- You MAY edit the inline <style> block (add, remove, or modify CSS rules and @keyframes)
- You MAY change Tailwind class strings on elements
- You MAY add or remove inline style= attributes
- Do NOT change any text content, headings, paragraphs, or copy
- Do NOT add, remove, or restructure HTML elements
- Do NOT change IDs, data attributes, or aria attributes
- Return ONLY the modified HTML — no explanation, no markdown fences, no commentary`

    const userMessage = `INSTRUCTION: ${styleInstruction}\n\nHTML:\n${currentHtml}`

    const res = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 4000,
      temperature: 0.1,
    })
    let html = res.choices[0]?.message?.content?.trim() ?? (currentHtml as string)
    // Strip accidental markdown fences
    html = html.replace(/^```html?\n?/i, '').replace(/\n?```$/, '').trim()
    // Sanity check — if AI returned empty or suspiciously short, fall back
    if (html.length < 100) html = currentHtml as string

    const log = {
      step: 'style-edit',
      sectionType: body.sectionType ?? 'unknown',
      model: 'gpt-4o',
      fallbackUsed: false,
      systemPrompt,
      userMessage: userMessage.slice(0, 500),
      outputHtml: html,
      inputTokensEst: Math.ceil((systemPrompt.length + userMessage.length) / 4),
      outputTokensEst: Math.ceil(html.length / 4),
      durationMs: Date.now() - t0,
      status: html !== currentHtml ? 'success' : 'no-change',
    }
    appendLog({
      ts: new Date().toISOString(),
      runId: effectiveRunId,
      runType: 'style-edit',
      step: 'style-edit',
      sectionType: log.sectionType,
      model: 'gpt-4o',
      fallbackUsed: false,
      status: log.status,
      durationMs: log.durationMs,
      inputTokensEst: log.inputTokensEst,
      outputTokensEst: log.outputTokensEst,
      pagePrompt: pagePrompt ?? '',
      userMessage: log.userMessage,
      systemPrompt,
      outputHtml: html.slice(0, 500),
    })
    return Response.json({ html, log })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const result = await generateSection(
          type as SectionType,
          pagePrompt,
          customPrompt,
          (chunk: string) => {
            controller.enqueue(encoder.encode(chunk))
          },
          brand ?? undefined,
          pageContext as PageContext | undefined
        )
        // Log pass 1 (generate)
        appendLog({
          ts: new Date().toISOString(),
          runId: effectiveRunId,
          runType: effectiveRunType,
          step: result.log.step,
          sectionType: result.log.sectionType,
          model: result.log.model,
          fallbackUsed: result.log.fallbackUsed,
          status: result.log.status,
          durationMs: result.log.durationMs,
          inputTokensEst: result.log.inputTokensEst,
          outputTokensEst: result.log.outputTokensEst,
          pagePrompt: pagePrompt ?? '',
          customPrompt: customPrompt ?? undefined,
          error: result.log.error,
          userMessage: result.log.userMessage,
          systemPrompt: result.log.systemPrompt,
          outputHtml: result.log.outputHtml.slice(0, 800),
        })
        // Append pass-1 log trailer so client can write to browser logStore
        const trailer = `${LOG_SEPARATOR}${JSON.stringify(result.log).replace(/-->/g, '--\u003E')}-->`
        controller.enqueue(encoder.encode(trailer))

        // Pass 2: enhance/validate — runs for all operation types
        // Now that generation is parallel, enhance adds minimal total time
        const shouldEnhance = true
        if (shouldEnhance) {
          console.log(`[enhance] starting ${type}`)
          const enhanced = await enhanceSection(
            type as SectionType,
            result.html,
            pagePrompt ?? ''
          )
          console.log(`[enhance] done ${type} model=${enhanced.log.model} status=${enhanced.log.status} dur=${enhanced.log.durationMs}ms`)
          appendLog({
            ts: new Date().toISOString(),
            runId: effectiveRunId,
            runType: effectiveRunType,
            step: 'enhance',
            sectionType: enhanced.log.sectionType,
            model: enhanced.log.model,
            fallbackUsed: false,
            status: enhanced.log.status,
            durationMs: enhanced.log.durationMs,
            inputTokensEst: enhanced.log.inputTokensEst,
            outputTokensEst: enhanced.log.outputTokensEst,
            pagePrompt: pagePrompt ?? '',
            error: enhanced.log.error,
            userMessage: enhanced.log.userMessage,
            systemPrompt: enhanced.log.systemPrompt,
            outputHtml: enhanced.html.slice(0, 800),
          })
          const enhancePayload = JSON.stringify({ html: enhanced.html, log: enhanced.log }).replace(/-->/g, '--\u003E')
          const enhanceTrailer = `${ENHANCE_SEPARATOR}${enhancePayload}-->`
          try { controller.enqueue(encoder.encode(enhanceTrailer)) } catch { /* already closed */ }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Generation failed'
        // Log the error server-side so it's visible in logs
        appendLog({
          ts: new Date().toISOString(),
          runId: effectiveRunId,
          runType: effectiveRunType,
          step: 'generate',
          sectionType: type ?? 'unknown',
          model: 'unknown',
          fallbackUsed: false,
          status: 'error',
          durationMs: 0,
          inputTokensEst: 0,
          outputTokensEst: 0,
          pagePrompt: pagePrompt ?? '',
          error: msg,
          userMessage: '',
          systemPrompt: '',
          outputHtml: '',
        })
        try {
          controller.enqueue(encoder.encode(`<!-- ERROR: ${msg} -->`))
        } catch { /* controller may already be closed */ }
      } finally {
        try { controller.close() } catch { /* already closed */ }
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
