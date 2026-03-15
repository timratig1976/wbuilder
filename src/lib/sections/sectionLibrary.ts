import path from 'path'
import fs from 'fs'
import { StyleParadigm } from '../types/manifest'

interface SectionMeta {
  id: string; type: string; paradigm: StyleParadigm
  quality_score: number; tags: string[]; industries: string[]
  tone: string[]; html_path: string
}

const INDEX_PATH = path.join(process.cwd(), 'src/data/section-library/index.json')

function loadIndex(): SectionMeta[] {
  try {
    const raw = fs.readFileSync(INDEX_PATH, 'utf-8')
    return JSON.parse(raw) as SectionMeta[]
  } catch {
    return []
  }
}

export function findBestSection(
  sectionType: string,
  paradigm: StyleParadigm,
  industry?: string
): string | null {
  const index = loadIndex()
  if (index.length === 0) return null

  const candidates = index
    .filter((s) => s.type === sectionType && s.paradigm === paradigm)
    .sort((a, b) => {
      let scoreA = a.quality_score
      let scoreB = b.quality_score
      if (industry) {
        if (a.industries.includes(industry)) scoreA += 2
        if (b.industries.includes(industry)) scoreB += 2
      }
      return scoreB - scoreA
    })

  const best = candidates[0]
  if (!best) return null

  try {
    const htmlPath = path.join(process.cwd(), 'src/data/section-library', best.html_path)
    return fs.readFileSync(htmlPath, 'utf-8')
  } catch {
    return null
  }
}
