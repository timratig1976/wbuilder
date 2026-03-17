import { NextRequest } from 'next/server'
import path from 'path'
import fs from 'fs'

const DICT_DIR = path.join(process.cwd(), 'src/data/style-dictionaries')

export async function GET(req: NextRequest) {
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
