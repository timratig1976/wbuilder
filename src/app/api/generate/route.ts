import { NextRequest } from 'next/server'
import { generateSection, classifyIntent } from '@/lib/ai'
import { SectionType } from '@/lib/store'

export const runtime = 'nodejs'

// Sentinel that separates streamed HTML from the log JSON trailer
const LOG_SEPARATOR = '\n\n<!--PAGECRAFT_LOG:'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { type, pagePrompt, customPrompt, classify } = body

  if (classify) {
    const result = await classifyIntent(pagePrompt)
    return Response.json({ sections: result.sections, log: result.log })
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
          }
        )
        // Append log as a JSON trailer after the HTML stream
        const trailer = `${LOG_SEPARATOR}${JSON.stringify(result.log)}-->`
        controller.enqueue(encoder.encode(trailer))
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Generation failed'
        controller.enqueue(encoder.encode(`<!-- ERROR: ${msg} -->`))
      } finally {
        controller.close()
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
