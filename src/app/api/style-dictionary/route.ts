import { NextRequest } from 'next/server'
import path from 'path'
import fs from 'fs'

const DICT_DIR = path.join(process.cwd(), 'src/data/style-dictionaries')

export async function GET(req: NextRequest) {
  const list = req.nextUrl.searchParams.get('list')

  // Return all dictionaries when ?list=1
  if (list) {
    try {
      const files = fs.readdirSync(DICT_DIR).filter((f) => f.endsWith('.json'))
      const dicts = files.map((f) => {
        try {
          return JSON.parse(fs.readFileSync(path.join(DICT_DIR, f), 'utf-8'))
        } catch { return null }
      }).filter(Boolean)
      return Response.json(dicts)
    } catch (err) {
      return Response.json({ error: String(err) }, { status: 500 })
    }
  }

  const ref = req.nextUrl.searchParams.get('ref')
  if (!ref) return Response.json({ error: 'Missing ref' }, { status: 400 })

  const filePath = path.join(DICT_DIR, `${ref}.json`)
  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    return Response.json(JSON.parse(raw))
  } catch {
    return Response.json({ error: `Not found: ${ref}` }, { status: 404 })
  }
}

export async function DELETE(req: NextRequest) {
  const { ref } = await req.json()
  if (!ref) return Response.json({ error: 'Missing ref' }, { status: 400 })
  if (!/^[a-zA-Z0-9_-]+$/.test(ref)) return Response.json({ error: 'Invalid ref' }, { status: 400 })

  const filePath = path.join(DICT_DIR, `${ref}.json`)
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    if (!raw.is_custom) return Response.json({ error: 'Cannot delete built-in dictionaries' }, { status: 403 })
    fs.unlinkSync(filePath)
    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }
}

export async function POST(req: NextRequest) {
  const { ref, dict } = await req.json()
  if (!ref || !dict) return Response.json({ error: 'Missing ref or dict' }, { status: 400 })

  // Sanitize ref — only allow alphanumeric, hyphens, underscores
  if (!/^[a-zA-Z0-9_-]+$/.test(ref)) {
    return Response.json({ error: 'Invalid ref' }, { status: 400 })
  }

  const filePath = path.join(DICT_DIR, `${ref}.json`)
  try {
    fs.writeFileSync(filePath, JSON.stringify(dict, null, 2), 'utf-8')
    return Response.json({ ok: true })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
