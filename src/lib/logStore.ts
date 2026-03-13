import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'

export type LogStatus = 'success' | 'error' | 'fallback'

export interface AILogEntry {
  id: string
  timestamp: number
  step: 'classify' | 'generate'
  sectionType: string
  model: string
  fallbackUsed: boolean
  systemPrompt: string
  userMessage: string
  outputHtml: string
  inputTokensEst: number
  outputTokensEst: number
  durationMs: number
  status: LogStatus
  error?: string
  pageTitle: string
  pagePrompt: string
  customPrompt?: string
}

interface LogStore {
  logs: AILogEntry[]
  addLog: (entry: Omit<AILogEntry, 'id'>) => void
  clearLogs: () => void
  deleteLog: (id: string) => void
}

export const useLogStore = create<LogStore>()(
  persist(
    (set) => ({
      logs: [],
      addLog: (entry) =>
        set((s) => ({
          logs: [{ ...entry, id: nanoid() }, ...s.logs].slice(0, 200), // cap at 200 entries
        })),
      clearLogs: () => set({ logs: [] }),
      deleteLog: (id) => set((s) => ({ logs: s.logs.filter((l) => l.id !== id) })),
    }),
    { name: 'pagecraft-ai-logs' }
  )
)

// Estimate tokens from string length (~4 chars per token)
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}
