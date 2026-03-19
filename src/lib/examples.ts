import { SectionType } from './store'

export interface TailwindExample {
  id: string
  category: string
  source: string
  layout_id?: string   // matches SectionLayout.id
  paradigm?: string    // matches StyleParadigm
  html: string
  tags: string[]
}

let cache: Record<string, TailwindExample[]> = {}

export function loadExamples(
  type: SectionType,
  options?: { layoutId?: string; paradigm?: string }
): TailwindExample[] {
  if (!cache[type]) {
    try {
      // In server context (API routes), load from disk
      if (typeof window === 'undefined') {
        const fs = require('fs')
        const path = require('path')
        const filePath = path.join(process.cwd(), 'data', 'blocks', `${type}.json`)
        if (fs.existsSync(filePath)) {
          const raw = fs.readFileSync(filePath, 'utf-8')
          cache[type] = JSON.parse(raw)
        }
      }
    } catch {
      // silently fail — examples are optional context
    }
  }

  let results: TailwindExample[] = cache[type] ?? []
  if (options?.layoutId) {
    const m = results.filter(e => e.layout_id === options.layoutId)
    if (m.length) return m
  }
  if (options?.paradigm) {
    const m = results.filter(e => e.paradigm === options.paradigm)
    if (m.length) return m
  }
  return results
}

export function getAllExamples(): Record<string, TailwindExample[]> {
  return cache
}
