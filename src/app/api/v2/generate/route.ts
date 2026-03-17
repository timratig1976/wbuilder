import { NextRequest } from 'next/server'
import { generateSectionStreamed } from '@/lib/generation/sectionGenerator'
import { SiteManifest } from '@/lib/types/manifest'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function POST(req: NextRequest) {
  const { manifest, sectionType, pageIndex, customPrompt, existingHtml, mode } = await req.json() as {
    manifest: SiteManifest
    sectionType: string
    pageIndex?: number
    customPrompt?: string
    existingHtml?: string
    mode?: 'full' | 'content-edit'
  }

  if (!manifest || !sectionType) {
    return Response.json({ error: 'Missing manifest or sectionType' }, { status: 400 })
  }

  const encoder = new TextEncoder()
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()

  const sseWriter = {
    write: (data: string) => {
      writer.write(encoder.encode(data)).catch(() => {})
    },
    close: () => {
      writer.close().catch(() => {})
    },
  }

  // Run generation async — do not await here so we return the stream immediately
  generateSectionStreamed(
    sectionType, manifest, sseWriter, undefined, pageIndex,
    { customPrompt, existingHtml, mode: mode ?? 'full' }
  ).catch((err) => {
    sseWriter.write(`data: ${JSON.stringify({ type: 'error', message: String(err) })}\n\n`)
    sseWriter.close()
  })

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
