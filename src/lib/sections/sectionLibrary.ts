import path from 'path'
import fs from 'fs'
import { StyleParadigm } from '../types/manifest'

interface SectionMeta {
  id: string; type: string; paradigm: StyleParadigm
  quality_score: number; tags: string[]; industries: string[]
  tone: string[]; html_path: string; label?: string
}

export interface SectionMatchResult {
  html: string | null
  selected: string | null
  matchScore: number
  topCandidates: { label: string; score: number }[]
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

function rankSections(
  sectionType: string,
  paradigm: StyleParadigm,
  industry?: string,
  tone?: string,
  navbarBehaviour?: string
): { ranked: { meta: SectionMeta; score: number }[]; navbarDirect?: SectionMeta } {
  const index = loadIndex()
  const typed = index.filter((s) => s.type === sectionType)
  const sectionKeywords = sectionType.toLowerCase().replace(/-/g, ' ').split(/\s+/)

  if (sectionType === 'navbar' && navbarBehaviour) {
    const navbarDirect = typed.find((s) => s.tags.includes(navbarBehaviour))
    if (navbarDirect) return { ranked: [], navbarDirect }
  }

  const ranked = typed
    .map(meta => ({ meta, score: scoreSection(meta, paradigm, industry, tone, sectionKeywords) }))
    .sort((a, b) => b.score - a.score)

  return { ranked }
}

// Returns HTML + metadata for logging
export function findBestSectionWithMeta(
  sectionType: string,
  paradigm: StyleParadigm,
  industry?: string,
  tone?: string,
  navbarBehaviour?: string
): SectionMatchResult {
  const index = loadIndex()
  if (index.length === 0) return { html: null, selected: null, matchScore: 0, topCandidates: [] }

  const typed = index.filter((s) => s.type === sectionType)
  if (typed.length === 0) return { html: null, selected: null, matchScore: 0, topCandidates: [] }

  if (sectionType === 'navbar' && navbarBehaviour) {
    const behaviourMatch = typed.find((s) => s.tags.includes(navbarBehaviour))
    if (behaviourMatch) {
      try {
        const htmlPath = path.join(process.cwd(), 'src/data/section-library', behaviourMatch.html_path)
        const html = fs.readFileSync(htmlPath, 'utf-8')
        return { html, selected: behaviourMatch.label ?? behaviourMatch.id, matchScore: 99, topCandidates: [] }
      } catch { /* fall through */ }
    }
  }

  const { ranked } = rankSections(sectionType, paradigm, industry, tone, navbarBehaviour)
  const best = ranked[0]?.meta
  if (!best) return { html: null, selected: null, matchScore: 0, topCandidates: [] }

  try {
    const htmlPath = path.join(process.cwd(), 'src/data/section-library', best.html_path)
    const html = fs.readFileSync(htmlPath, 'utf-8')
    return {
      html,
      selected: best.label ?? best.id,
      matchScore: ranked[0]?.score ?? 0,
      topCandidates: ranked.slice(0, 3).map((r) => ({ label: r.meta.label ?? r.meta.id, score: r.score })),
    }
  } catch {
    return { html: null, selected: null, matchScore: 0, topCandidates: [] }
  }
}

// Backwards-compatible: returns only HTML
export function findBestSection(
  sectionType: string,
  paradigm: StyleParadigm,
  industry?: string,
  tone?: string,
  navbarBehaviour?: string
): string | null {
  return findBestSectionWithMeta(sectionType, paradigm, industry, tone, navbarBehaviour).html
}
