import path from 'path'
import fs from 'fs'
import { StyleDictionary } from '../types/styleDictionary'

const DICT_DIR = path.join(process.cwd(), 'src/data/style-dictionaries')

export function loadStyleDictionary(ref: string): StyleDictionary {
  const filePath = path.join(DICT_DIR, `${ref}.json`)
  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(raw) as StyleDictionary
  } catch {
    throw new Error(`Style dictionary not found: ${ref}`)
  }
}

export function listStyleDictionaries(): string[] {
  try {
    return fs.readdirSync(DICT_DIR)
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.replace('.json', ''))
  } catch {
    return []
  }
}
