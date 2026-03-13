import { NextRequest } from 'next/server'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'

const CATEGORIES = ['navbar', 'hero', 'features', 'stats', 'testimonials', 'pricing', 'faq', 'cta', 'footer']
const BLOCKS_DIR = path.join(process.cwd(), 'data', 'blocks')

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')

  const result: Record<string, { count: number; sizeKb: number; examples: unknown[] }> = {}

  const cats = category ? [category] : CATEGORIES

  for (const cat of cats) {
    const filePath = path.join(BLOCKS_DIR, `${cat}.json`)
    if (!fs.existsSync(filePath)) {
      result[cat] = { count: 0, sizeKb: 0, examples: [] }
      continue
    }
    const raw = fs.readFileSync(filePath, 'utf-8')
    const parsed = JSON.parse(raw)
    const stat = fs.statSync(filePath)
    result[cat] = {
      count: parsed.length,
      sizeKb: Math.round(stat.size / 1024 * 10) / 10,
      examples: parsed.slice(0, 5),
    }
  }

  return Response.json(result)
}

export async function POST(req: NextRequest) {
  const { category, html, source, tags } = await req.json()
  if (!category || !html) {
    return Response.json({ error: 'category and html required' }, { status: 400 })
  }

  const filePath = path.join(BLOCKS_DIR, `${category}.json`)
  let existing: unknown[] = []
  if (fs.existsSync(filePath)) {
    existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  }

  const { nanoid } = await import('nanoid')
  const newEntry = {
    id: nanoid(),
    category,
    source: source ?? 'manual',
    html,
    tags: tags ?? [category],
  }

  existing.push(newEntry)
  fs.writeFileSync(filePath, JSON.stringify(existing, null, 2))

  return Response.json({ success: true, entry: newEntry })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const id = searchParams.get('id')

  if (!category) return Response.json({ error: 'category required' }, { status: 400 })

  const filePath = path.join(BLOCKS_DIR, `${category}.json`)
  if (!fs.existsSync(filePath)) return Response.json({ error: 'not found' }, { status: 404 })

  let items: { id: string }[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  if (id) {
    items = items.filter((x) => x.id !== id)
  } else {
    items = []
  }

  fs.writeFileSync(filePath, JSON.stringify(items, null, 2))
  return Response.json({ success: true })
}
