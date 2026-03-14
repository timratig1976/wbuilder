import fs from 'fs'
import path from 'path'

const LOG_DIR = path.join(process.cwd(), 'logs')
const LOG_FILE = path.join(LOG_DIR, 'ai-runs.ndjson')

// Ensure log dir exists once at module load — not on every write
try { if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true }) } catch {}

export type RunType = 'full-page' | 'add-section' | 'regenerate' | 'style-edit' | 'classify'

export interface ServerLogEntry {
  ts: string
  /** Shared ID across all calls belonging to one user action (e.g. one full-page generate) */
  runId: string
  /** What triggered this run */
  runType: RunType
  step: string
  sectionType: string
  model: string
  fallbackUsed: boolean
  status: string
  durationMs: number
  inputTokensEst: number
  outputTokensEst: number
  pagePrompt?: string
  customPrompt?: string
  error?: string
  userMessage: string
  systemPrompt: string
  outputHtml: string
}

/** Appends one log entry as a single JSON line to logs/ai-runs.ndjson */
export function appendLog(entry: ServerLogEntry): void {
  try {
    const line = JSON.stringify(entry) + '\n'
    fs.appendFileSync(LOG_FILE, line, 'utf-8')
  } catch { /* never crash the request because of logging */ }
}

/** Reads the last N log entries from the file (newest last in file, returned newest-first) */
export function readRecentLogs(limit = 100): ServerLogEntry[] {
  try {
    if (!fs.existsSync(LOG_FILE)) return []
    const raw = fs.readFileSync(LOG_FILE, 'utf-8')
    const lines = raw.trim().split('\n').filter(Boolean)
    return lines
      .slice(-limit)
      .reverse()
      .map((l) => JSON.parse(l) as ServerLogEntry)
  } catch {
    return []
  }
}

/** Returns all entries belonging to a specific runId */
export function readRunLogs(runId: string): ServerLogEntry[] {
  try {
    if (!fs.existsSync(LOG_FILE)) return []
    const raw = fs.readFileSync(LOG_FILE, 'utf-8')
    const lines = raw.trim().split('\n').filter(Boolean)
    return lines
      .map((l) => JSON.parse(l) as ServerLogEntry)
      .filter((e) => e.runId === runId)
  } catch {
    return []
  }
}

/** Returns the runId of the most recent full-page run */
export function getLastRunId(): string | null {
  try {
    if (!fs.existsSync(LOG_FILE)) return null
    const raw = fs.readFileSync(LOG_FILE, 'utf-8')
    const lines = raw.trim().split('\n').filter(Boolean).reverse()
    for (const line of lines) {
      const entry = JSON.parse(line) as ServerLogEntry
      if (entry.runType === 'full-page') return entry.runId
    }
    return lines.length > 0 ? (JSON.parse(lines[0]) as ServerLogEntry).runId : null
  } catch {
    return null
  }
}

/** Wipes the log file */
export function clearLogs(): void {
  try {
    if (fs.existsSync(LOG_FILE)) fs.writeFileSync(LOG_FILE, '', 'utf-8')
  } catch {}
}
