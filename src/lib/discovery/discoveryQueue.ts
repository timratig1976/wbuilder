import path from 'path'
import fs from 'fs'
import { nanoid } from 'nanoid'
import { DesignPattern } from '../types/pattern'
import { SurpriseObservation, ScrapedFingerprint } from '../scraping/siteScraperService'

export type CandidateStatus = 'pending' | 'reviewing' | 'approved' | 'rejected'

export interface DiscoveryCandidate {
  id: string
  status: CandidateStatus
  observation: string
  category: SurpriseObservation['category']
  confidence: number
  css_hint: string | null
  reusability: SurpriseObservation['reusability']
  seen_count: number
  seen_on: string[]
  first_seen: string
  last_seen: string
  reviewer_note?: string
  source_url: string
}

interface TrendData {
  [category: string]: {
    [month: string]: number
  }
}

const QUEUE_PATH = path.join(process.cwd(), 'src/data/discovery/queue.json')
const TREND_PATH = path.join(process.cwd(), 'src/data/discovery/trends.json')

function loadQueue(): DiscoveryCandidate[] {
  try {
    return JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf-8')) as DiscoveryCandidate[]
  } catch {
    return []
  }
}

function saveQueue(queue: DiscoveryCandidate[]): void {
  fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2))
}

function loadTrends(): TrendData {
  try {
    return JSON.parse(fs.readFileSync(TREND_PATH, 'utf-8')) as TrendData
  } catch {
    return {}
  }
}

function saveTrends(trends: TrendData): void {
  fs.writeFileSync(TREND_PATH, JSON.stringify(trends, null, 2))
}

// Jaccard similarity on word sets
function similarity(a: string, b: string): number {
  const setA = new Set(a.toLowerCase().split(/\W+/).filter(Boolean))
  const setB = new Set(b.toLowerCase().split(/\W+/).filter(Boolean))
  const intersection = [...setA].filter((w) => setB.has(w)).length
  const union = new Set([...setA, ...setB]).size
  if (union === 0) return 0

  // Boost for shared key design words
  const keyWords = ['gradient', 'blur', 'glass', 'bento', 'clip', 'noise', 'scroll', 'counter', 'nav', 'hero']
  let boost = 0
  for (const kw of keyWords) {
    if (setA.has(kw) && setB.has(kw)) boost += 0.1
  }

  return Math.min(1, intersection / union + boost)
}

export function ingestSurprises(
  surprises: SurpriseObservation[],
  meta: Partial<ScrapedFingerprint>
): void {
  const queue = loadQueue()
  const trends = loadTrends()
  const month = new Date().toISOString().slice(0, 7)

  for (const surprise of surprises) {
    if (surprise.confidence < 0.65) continue

    // Check for similar existing entry
    const existing = queue.find(
      (c) => c.category === surprise.category && similarity(c.observation, surprise.observation) > 0.4
    )

    if (existing) {
      existing.seen_count++
      existing.last_seen = new Date().toISOString()
      if (meta.url && !existing.seen_on.includes(meta.url)) {
        existing.seen_on.push(meta.url)
      }
      if (surprise.confidence > existing.confidence) {
        existing.confidence = surprise.confidence
        existing.css_hint = surprise.css_hint
      }
    } else {
      const candidate: DiscoveryCandidate = {
        id: nanoid(),
        status: 'pending',
        observation: surprise.observation,
        category: surprise.category,
        confidence: surprise.confidence,
        css_hint: surprise.css_hint,
        reusability: surprise.reusability,
        seen_count: 1,
        seen_on: meta.url ? [meta.url] : [],
        first_seen: new Date().toISOString(),
        last_seen: new Date().toISOString(),
        source_url: meta.url ?? '',
      }
      queue.push(candidate)
    }

    // Track trends
    if (!trends[surprise.category]) trends[surprise.category] = {}
    trends[surprise.category][month] = (trends[surprise.category][month] ?? 0) + 1
  }

  saveQueue(queue)
  saveTrends(trends)
}

export function getQueue(filters: {
  status?: CandidateStatus
  category?: string
  minSeenCount?: number
  reusability?: string
} = {}): DiscoveryCandidate[] {
  let queue = loadQueue()
  if (filters.status)       queue = queue.filter((c) => c.status === filters.status)
  if (filters.category)     queue = queue.filter((c) => c.category === filters.category)
  if (filters.minSeenCount) queue = queue.filter((c) => c.seen_count >= filters.minSeenCount!)
  if (filters.reusability)  queue = queue.filter((c) => c.reusability === filters.reusability)
  return queue.sort((a, b) => b.seen_count - a.seen_count || b.confidence - a.confidence)
}

export function updateStatus(
  id: string,
  status: CandidateStatus,
  reviewerNote?: string
): DiscoveryCandidate | null {
  const queue = loadQueue()
  const entry = queue.find((c) => c.id === id)
  if (!entry) return null
  entry.status = status
  if (reviewerNote) entry.reviewer_note = reviewerNote
  saveQueue(queue)
  return entry
}

export function formalize(
  id: string,
  overrides: Partial<DesignPattern> = {}
): DesignPattern | null {
  const queue = loadQueue()
  const entry = queue.find((c) => c.id === id)
  if (!entry || entry.status !== 'approved') return null

  const pattern: DesignPattern = {
    id: nanoid(),
    type: (entry.category as DesignPattern['type']) ?? 'card-style',
    source_url: entry.source_url,
    scraped_at: entry.first_seen,
    confidence: entry.confidence,
    name: entry.observation.slice(0, 60),
    description: entry.observation,
    tags: [entry.category],
    industries: [],
    paradigms: [],
    implementation: {
      style_dict_key: entry.category,
      style_dict_val: entry.css_hint,
      css_snippet: entry.css_hint ?? undefined,
    },
    preview_description: entry.observation,
    visual_weight: 'medium',
    brand_dependency: 'none',
    discovery_meta: {
      seen_count: entry.seen_count,
      seen_on: entry.seen_on,
      css_hint: entry.css_hint,
      auto_discovered: true,
    },
    ...overrides,
  }

  return pattern
}

export function getTrends(): TrendData {
  return loadTrends()
}

export function getStats(): Record<CandidateStatus, number> {
  const queue = loadQueue()
  return {
    pending:   queue.filter((c) => c.status === 'pending').length,
    reviewing: queue.filter((c) => c.status === 'reviewing').length,
    approved:  queue.filter((c) => c.status === 'approved').length,
    rejected:  queue.filter((c) => c.status === 'rejected').length,
  }
}
