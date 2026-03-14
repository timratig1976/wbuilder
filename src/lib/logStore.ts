import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'

export type LogStatus = 'success' | 'error' | 'fallback'

export interface AILogEntry {
  id: string
  timestamp: number
  step: 'classify' | 'generate' | 'enhance'
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

// Only persist lightweight fields — systemPrompt/userMessage/outputHtml are too large for localStorage
type PersistedLogEntry = Omit<AILogEntry, 'systemPrompt' | 'userMessage' | 'outputHtml'>

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
          logs: [{ ...entry, id: nanoid() }, ...s.logs].slice(0, 50), // cap at 50 entries
        })),
      clearLogs: () => set({ logs: [] }),
      deleteLog: (id) => set((s) => ({ logs: s.logs.filter((l) => l.id !== id) })),
    }),
    {
      name: 'pagecraft-ai-logs',
      // Strip large fields before writing to localStorage
      partialize: (state) => ({
        logs: state.logs.map(({ systemPrompt: _sp, userMessage: _um, outputHtml: _oh, ...rest }) => rest) as PersistedLogEntry[],
      }),
    }
  )
)

// Estimate tokens from string length (~4 chars per token)
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}
