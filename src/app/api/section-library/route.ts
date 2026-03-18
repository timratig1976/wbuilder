import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

const LIBRARY_DIR = path.join(process.cwd(), 'src/data/section-library')
const INDEX_PATH = path.join(LIBRARY_DIR, 'index.json')

interface SectionMeta {
  id: string
  type: string
  paradigm: string
  quality_score: number
  tags: string[]
  industries: string[]
  tone: string[]
  html_path: string
  label?: string
  description?: string
  source?: string
}

function loadIndex(): SectionMeta[] {
  try { return JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8')) as SectionMeta[] }
  catch { return [] }
}

function saveIndex(index: SectionMeta[]) {
  fs.writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2) + '\n', 'utf-8')
}

export async function GET() {
  const index = loadIndex()
  const entries = index.map((meta) => {
    let html = ''
    try { html = fs.readFileSync(path.join(LIBRARY_DIR, meta.html_path), 'utf-8') } catch { /* missing */ }
    return { ...meta, html }
  })
  return NextResponse.json({ entries })
}

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    id?: string; type: string; paradigm: string; quality_score: number
    tags: string[]; industries: string[]; tone: string[]
    label?: string; description?: string; source?: string; html: string
  }
  const index = loadIndex()
  const id = body.id || `${body.type}-${Date.now()}`
  const html_path = `${id}.html`

  fs.writeFileSync(path.join(LIBRARY_DIR, html_path), body.html, 'utf-8')

  const meta: SectionMeta = {
    id, type: body.type, paradigm: body.paradigm || 'minimal-clean',
    quality_score: body.quality_score ?? 8,
    tags: Array.from(new Set([body.type, ...(body.tags ?? [])])), industries: body.industries ?? [], tone: body.tone ?? [],
    html_path, label: body.label, description: body.description, source: body.source,
  }
  const existing = index.findIndex((e) => e.id === id)
  if (existing !== -1) index[existing] = meta
  else index.push(meta)
  saveIndex(index)
  return NextResponse.json({ ok: true, id })
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json() as { id: string }
  const index = loadIndex()
  const entry = index.find((e) => e.id === id)
  if (entry) { try { fs.unlinkSync(path.join(LIBRARY_DIR, entry.html_path)) } catch { /* gone */ } }
  saveIndex(index.filter((e) => e.id !== id))
  return NextResponse.json({ ok: true })
}
