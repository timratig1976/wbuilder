import { SectionType } from './store'

export interface TailwindExample {
  id: string
  category: string
  source: string
  html: string
  tags: string[]
}

let cache: Record<string, TailwindExample[]> = {}

export function loadExamples(type: SectionType): TailwindExample[] {
  if (cache[type]) return cache[type]

  try {
    // In server context (API routes), load from disk
    if (typeof window === 'undefined') {
      const fs = require('fs')
      const path = require('path')
      const filePath = path.join(process.cwd(), 'data', 'blocks', `${type}.json`)
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8')
        cache[type] = JSON.parse(raw)
        return cache[type]
      }
    }
  } catch {
    // silently fail — examples are optional context
  }

  return []
}

export function getAllExamples(): Record<string, TailwindExample[]> {
  return cache
}
