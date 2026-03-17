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

function scoreSection(
  meta: SectionMeta,
  paradigm: StyleParadigm,
  industry: string | undefined,
  tone: string | undefined,
  sectionKeywords: string[]
): number {
  let score = meta.quality_score ?? 0

  // Paradigm exact match — highest weight
  if (meta.paradigm === paradigm) score += 10

  // Industry match
  if (industry && meta.industries?.includes(industry)) score += 4
  // Partial industry match (e.g. 'saas' in 'saas-startup')
  if (industry && meta.industries?.some(ind => ind.includes(industry) || industry.includes(ind))) score += 2

  // Tone match
  if (tone && meta.tone?.includes(tone)) score += 3

  // Tag overlap with section type keywords
  const tagOverlap = sectionKeywords.filter(kw =>
    meta.tags?.some(tag => tag.toLowerCase().includes(kw) || kw.includes(tag.toLowerCase()))
  ).length
  score += tagOverlap * 2

  return score
}

export function findBestSection(
  sectionType: string,
  paradigm: StyleParadigm,
  industry?: string,
  tone?: string
): string | null {
  const index = loadIndex()
  if (index.length === 0) return null

  const sectionKeywords = sectionType.toLowerCase().replace(/-/g, ' ').split(/\s+/)

  // Filter to matching section type first
  const typed = index.filter((s) => s.type === sectionType)
  if (typed.length === 0) return null

  // Score all candidates, sort descending
  const ranked = typed
    .map(meta => ({ meta, score: scoreSection(meta, paradigm, industry, tone, sectionKeywords) }))
    .sort((a, b) => b.score - a.score)

  // Pick best — if top score is very low (no real match), still use it
  const best = ranked[0]?.meta
  if (!best) return null

  try {
    const htmlPath = path.join(process.cwd(), 'src/data/section-library', best.html_path)
    return fs.readFileSync(htmlPath, 'utf-8')
  } catch {
    return null
  }
}
