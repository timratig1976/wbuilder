import { NextRequest } from 'next/server'
import { savePreview, getPreview } from '@/lib/previewStore'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const { html, id } = await req.json()
  if (!html || !id) return Response.json({ error: 'Missing html or id' }, { status: 400 })
  savePreview(id, html)
  return Response.json({ ok: true })
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return new Response('Missing id', { status: 400 })
  const html = getPreview(id)
  if (!html) return new Response('Preview not found or expired', { status: 404 })
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
