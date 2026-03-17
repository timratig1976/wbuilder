import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

const PROJECTS_DIR = path.join(process.cwd(), 'src/data/projects')

// GET /api/projects/[id] — load full project
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const filePath = path.join(PROJECTS_DIR, `${id}.json`)
  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    return NextResponse.json(JSON.parse(raw))
  } catch {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }
}

// DELETE /api/projects/[id] — remove project file
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const filePath = path.join(PROJECTS_DIR, `${id}.json`)
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
