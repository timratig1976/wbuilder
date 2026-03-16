import { create } from 'zustand'
import { nanoid } from 'nanoid'

export type AICallPass = 'manifest' | 'pass1_structure' | 'pass2_visual' | 'pass3_validator' | 'other'
export type AICallStatus = 'pending' | 'streaming' | 'success' | 'error'

export interface AICallLog {
  id: string
  timestamp: number
  pass: AICallPass
  label: string           // e.g. "Pass 1 — hero structure"
  model: string
  systemPrompt: string
  userMessage: string
  response: string
  inputTokensEst: number
  outputTokensEst: number
  durationMs: number
  status: AICallStatus
  error?: string
  streaming?: boolean
}

export interface ActivePause {
  breakpointId: string
  sectionType: string
  afterPass: 'pass1_structure' | 'pass2_visual'
  sectionId: string
}

interface LogStore {
  logs: AICallLog[]
  upsertLog: (entry: AICallLog) => void
  clearLogs: () => void
  deleteLog: (id: string) => void
  // Step-pause mode
  stepPauseMode: boolean
  toggleStepPause: () => void
  activePauses: ActivePause[]
  // Returns a promise that resolves on continue, rejects on abort
  registerBreakpoint: (pause: Omit<ActivePause, 'breakpointId'>) => { id: string; promise: Promise<void> }
  resumeBreakpoint: (id: string) => void
  abortBreakpoint: (id: string) => void
}

// Map lives outside Zustand to avoid serialization issues with functions
const _breakpoints = new Map<string, { resolve: () => void; reject: (e: Error) => void }>()

export const useLogStore = create<LogStore>()((set, get) => ({
  logs: [],
  upsertLog: (entry) =>
    set((s) => {
      const idx = s.logs.findIndex((l) => l.id === entry.id)
      if (idx >= 0) {
        const next = [...s.logs]
        next[idx] = entry
        return { logs: next }
      }
      return { logs: [entry, ...s.logs].slice(0, 100) } // cap at 100
    }),
  clearLogs: () => set({ logs: [] }),
  deleteLog: (id) => set((s) => ({ logs: s.logs.filter((l) => l.id !== id) })),
  // Step-pause mode
  stepPauseMode: false,
  toggleStepPause: () => set((s) => ({ stepPauseMode: !s.stepPauseMode })),
  activePauses: [],
  registerBreakpoint: (pause) => {
    const id = nanoid()
    const promise = new Promise<void>((resolve, reject) => {
      _breakpoints.set(id, { resolve, reject })
    })
    set((s) => ({ activePauses: [...s.activePauses, { ...pause, breakpointId: id }] }))
    return { id, promise }
  },
  resumeBreakpoint: (id) => {
    _breakpoints.get(id)?.resolve()
    _breakpoints.delete(id)
    set((s) => ({ activePauses: s.activePauses.filter((p) => p.breakpointId !== id) }))
  },
  abortBreakpoint: (id) => {
    _breakpoints.get(id)?.reject(new Error('aborted'))
    _breakpoints.delete(id)
    set((s) => ({ activePauses: s.activePauses.filter((p) => p.breakpointId !== id) }))
  },
}))

// Estimate tokens from string length (~4 chars per token)
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

// Create a new pending log entry and return it
export function createPendingLog(
  pass: AICallPass,
  label: string,
  model: string,
  systemPrompt: string,
  userMessage: string
): AICallLog {
  return {
    id: nanoid(),
    timestamp: Date.now(),
    pass,
    label,
    model,
    systemPrompt,
    userMessage,
    response: '',
    inputTokensEst: estimateTokens(systemPrompt + userMessage),
    outputTokensEst: 0,
    durationMs: 0,
    status: 'pending',
  }
}
