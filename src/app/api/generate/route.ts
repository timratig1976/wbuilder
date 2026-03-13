import { NextRequest } from 'next/server'
import { generateSection, classifyIntent } from '@/lib/ai'
import { SectionType } from '@/lib/store'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { type, pagePrompt, customPrompt, classify } = body

  if (classify) {
    const sections = await classifyIntent(pagePrompt)
    return Response.json({ sections })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        await generateSection(
          type as SectionType,
          pagePrompt,
          customPrompt,
          (chunk: string) => {
            controller.enqueue(encoder.encode(chunk))
          }
        )
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
