import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

const PROJECTS_DIR = path.join(process.cwd(), 'src/data/projects')

function ensureDir() {
  if (!fs.existsSync(PROJECTS_DIR)) fs.mkdirSync(PROJECTS_DIR, { recursive: true })
}

// GET /api/projects — list all saved projects (metadata only, no section HTML)
export async function GET() {
  ensureDir()
  try {
    const files = fs.readdirSync(PROJECTS_DIR).filter((f) => f.endsWith('.json'))
    const projects = files.map((f) => {
      try {
        const raw = fs.readFileSync(path.join(PROJECTS_DIR, f), 'utf-8')
        const p = JSON.parse(raw)
        return {
          id: p.id,
          name: p.name,
          updatedAt: p.updatedAt,
          createdAt: p.createdAt,
          sectionCount: p.pages?.[0]?.sections?.length ?? 0,
          paradigm: p.manifest?.style_paradigm ?? null,
          company: p.manifest?.content?.company_name ?? null,
        }
      } catch { return null }
    }).filter(Boolean)
    return NextResponse.json(projects)
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}

// POST /api/projects — save or update a project (full payload)
export async function POST(req: NextRequest) {
  ensureDir()
  try {
    const project = await req.json()
    if (!project?.id) return NextResponse.json({ error: 'Missing project id' }, { status: 400 })
    const filePath = path.join(PROJECTS_DIR, `${project.id}.json`)
    fs.writeFileSync(filePath, JSON.stringify(project, null, 2), 'utf-8')
    return NextResponse.json({ ok: true, id: project.id })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
