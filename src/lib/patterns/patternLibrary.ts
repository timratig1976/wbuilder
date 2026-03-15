import path from 'path'
import fs from 'fs'
import { DesignPattern, PatternType } from '../types/pattern'
import { StyleParadigm } from '../types/manifest'

const PATTERNS_PATH = path.join(process.cwd(), 'src/data/pattern-library/patterns.json')

export function loadAll(): DesignPattern[] {
  try {
    return JSON.parse(fs.readFileSync(PATTERNS_PATH, 'utf-8')) as DesignPattern[]
  } catch {
    return []
  }
}

export function savePatterns(patterns: DesignPattern[]): void {
  fs.writeFileSync(PATTERNS_PATH, JSON.stringify(patterns, null, 2))
}

export function addPattern(pattern: DesignPattern): void {
  const all = loadAll()
  const existing = all.findIndex((p) => p.id === pattern.id)
  if (existing >= 0) {
    all[existing] = pattern
  } else {
    all.push(pattern)
  }
  savePatterns(all)
}

export function findPatterns(filters: {
  type?: PatternType
  paradigm?: StyleParadigm
  industry?: string
  minConfidence?: number
} = {}): DesignPattern[] {
  let all = loadAll()
  if (filters.type)          all = all.filter((p) => p.type === filters.type)
  if (filters.paradigm)      all = all.filter((p) => p.paradigms.includes(filters.paradigm!))
  if (filters.industry)      all = all.filter((p) => p.industries.includes(filters.industry!))
  if (filters.minConfidence) all = all.filter((p) => p.confidence >= filters.minConfidence!)
  return all.sort((a, b) => b.confidence - a.confidence)
}

export function deletePattern(id: string): boolean {
  const all = loadAll()
  const filtered = all.filter((p) => p.id !== id)
  if (filtered.length === all.length) return false
  savePatterns(filtered)
  return true
}
