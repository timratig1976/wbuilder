'use client'

import { useState } from 'react'
import { useLogStore, AICallLog, AICallPass } from '@/lib/logStore'
import {
  Bot, ChevronDown, ChevronRight, ChevronLeft, Trash2, Clock,
  Zap, AlertCircle, CheckCircle2, Loader2, Play, Square, Pause
} from 'lucide-react'

const PASS_COLORS: Record<AICallPass, { bg: string; text: string; border: string; label: string; dot: string }> = {
  manifest:        { bg: 'bg-purple-50',  text: 'text-purple-700', border: 'border-purple-200', label: 'Manifest', dot: 'bg-purple-400' },
  pass1_structure: { bg: 'bg-blue-50',    text: 'text-blue-700',   border: 'border-blue-200',   label: 'Pass 1',   dot: 'bg-blue-400'   },
  pass2_visual:    { bg: 'bg-amber-50',   text: 'text-amber-700',  border: 'border-amber-200',  label: 'Pass 2',   dot: 'bg-amber-400'  },
  pass3_validator: { bg: 'bg-green-50',   text: 'text-green-700',  border: 'border-green-200',  label: 'Pass 3',   dot: 'bg-green-400'  },
  other:           { bg: 'bg-gray-50',    text: 'text-gray-600',   border: 'border-gray-200',   label: 'Call',     dot: 'bg-gray-400'   },
}

const PASS_LABEL: Record<AICallPass, string> = {
  manifest: 'Manifest', pass1_structure: 'Pass 1', pass2_visual: 'Pass 2', pass3_validator: 'Pass 3', other: 'Call',
}

function StatusIcon({ status }: { status: AICallLog['status'] }) {
  if (status === 'pending')   return <Clock className="w-3 h-3 text-gray-400" />
  if (status === 'streaming') return <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
  if (status === 'success')   return <CheckCircle2 className="w-3 h-3 text-green-500" />
  return <AlertCircle className="w-3 h-3 text-red-500" />
}

function LogEntry({ log }: { log: AICallLog }) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'system' | 'user' | 'response'>('response')
  const c = PASS_COLORS[log.pass]
  const time = new Date(log.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <div className={`border rounded-lg overflow-hidden ${c.border} ${open ? 'shadow-sm' : ''}`}>
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-1.5 px-2.5 py-2 text-left hover:opacity-80 transition-opacity ${c.bg}`}
      >
        <StatusIcon status={log.status} />
        <span className={`text-[9px] font-bold uppercase tracking-wider px-1 py-0.5 rounded ${c.text} border ${c.border} bg-white/60 flex-shrink-0`}>
          {c.label}
        </span>
        <span className="flex-1 text-[11px] font-medium text-gray-700 truncate min-w-0">{log.label}</span>
        <span className="text-[9px] text-gray-400 font-mono flex-shrink-0">{log.model}</span>
        {log.durationMs > 0 && (
          <span className="text-[9px] text-gray-400 flex-shrink-0">{(log.durationMs / 1000).toFixed(1)}s</span>
        )}
        <span className="text-[9px] text-gray-300 flex-shrink-0">{time}</span>
        {open ? <ChevronDown className="w-3 h-3 text-gray-400 flex-shrink-0" /> : <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />}
      </button>

      {log.status === 'error' && log.error && (
        <div className="px-2.5 py-1.5 bg-red-50 border-t border-red-100 text-[10px] text-red-700 font-mono">
          ⚠ {log.error}
        </div>
      )}

      {open && (
        <div className="border-t border-gray-100">
          {/* Token bar */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 border-b border-gray-100 text-[10px] text-gray-500">
            <Zap className="w-2.5 h-2.5 text-indigo-400" />
            <span className="font-mono">in ~{log.inputTokensEst.toLocaleString()}</span>
            <span className="text-gray-300">·</span>
            <span className="font-mono">out ~{log.outputTokensEst.toLocaleString()}</span>
            <span className="text-gray-300 ml-auto">total ~{(log.inputTokensEst + log.outputTokensEst).toLocaleString()}</span>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            {(['system', 'user', 'response'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-2.5 py-1 text-[10px] font-semibold transition-colors flex items-center gap-1 ${
                  tab === t ? 'text-indigo-600 border-b-2 border-indigo-500 -mb-px bg-indigo-50/50' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {t === 'system' ? 'System' : t === 'user' ? 'User' : 'Response'}
                {t === 'response' && log.status === 'streaming' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <pre className="px-2.5 py-2 text-[10px] font-mono text-gray-700 whitespace-pre-wrap break-words max-h-64 overflow-y-auto bg-white leading-relaxed">
            {tab === 'system'
              ? (log.systemPrompt || '(none)')
              : tab === 'user'
              ? (log.userMessage || '(none)')
              : (log.response || (log.status === 'pending' ? '⏳ waiting…' : log.status === 'streaming' ? '⟳ streaming…' : '(empty)'))}
          </pre>
        </div>
      )}
    </div>
  )
}

// Extract section name from log label e.g. "Pass 1 — hero structure" → "hero"
// Manifest logs get their own group key
function extractSection(log: AICallLog): string {
  if (log.pass === 'manifest') return '__manifest__'
  // Label format: "Pass N — <section> <suffix>"
  const m = log.label.match(/—\s*(.+?)(?:\s+(?:structure|visual layer|validation))?$/i)
  return m ? m[1].trim().toLowerCase() : log.label.toLowerCase()
}


function SectionGroup({ name, logs }: { name: string; logs: AICallLog[] }) {
  const [open, setOpen] = useState(true)
  const totalIn  = logs.reduce((s, l) => s + l.inputTokensEst, 0)
  const totalOut = logs.reduce((s, l) => s + l.outputTokensEst, 0)
  const totalMs  = logs.reduce((s, l) => s + l.durationMs, 0)
  const hasError = logs.some((l) => l.status === 'error')
  const isStreaming = logs.some((l) => l.status === 'streaming')
  const allDone = logs.every((l) => l.status === 'success' || l.status === 'error')
  const label = name === '__manifest__' ? 'Manifest' : name

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Group header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-2.5 py-2 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <span className="text-[11px] font-bold text-gray-800 flex-1 capitalize">{label}</span>
        {/* pass badges */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {logs.map((l) => {
            const c = PASS_COLORS[l.pass]
            return (
              <span key={l.id} className={`text-[8px] font-bold px-1 py-0.5 rounded border ${c.bg} ${c.text} ${c.border}`}>
                {c.label}
              </span>
            )
          })}
        </div>
        {/* status dot */}
        <span className="flex-shrink-0">
          {hasError    ? <AlertCircle className="w-3 h-3 text-red-500" /> :
           isStreaming ? <Loader2 className="w-3 h-3 text-blue-500 animate-spin" /> :
           allDone     ? <CheckCircle2 className="w-3 h-3 text-green-500" /> :
                         <Clock className="w-3 h-3 text-gray-400" />}
        </span>
        {/* token + time summary */}
        <span className="text-[9px] text-gray-400 font-mono flex-shrink-0">
          ~{(totalIn + totalOut).toLocaleString()}t
        </span>
        {totalMs > 0 && (
          <span className="text-[9px] text-gray-400 flex-shrink-0">{(totalMs / 1000).toFixed(1)}s</span>
        )}
        {open
          ? <ChevronDown className="w-3 h-3 text-gray-400 flex-shrink-0" />
          : <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />}
      </button>

      {/* Pass rows */}
      {open && (
        <div className="divide-y divide-gray-100">
          {logs.map((log) => <LogEntry key={log.id} log={log} />)}
        </div>
      )}
    </div>
  )
}

function SectionGroupedLogs({ logs }: { logs: AICallLog[] }) {
  // logs are newest-first; iterate reversed so groups appear in page order (top→bottom)
  const order: string[] = []
  const groups: Record<string, AICallLog[]> = {}
  for (const log of [...logs].reverse()) {
    const key = extractSection(log)
    if (!groups[key]) { groups[key] = []; order.push(key) }
    groups[key].push(log)
  }
  return (
    <div className="space-y-1.5">
      {order.map((key) => (
        <SectionGroup key={key} name={key} logs={groups[key]} />
      ))}
    </div>
  )
}

export function AILogPanel() {
  const {
    logs, clearLogs,
    stepPauseMode, toggleStepPause,
    activePauses, resumeBreakpoint, abortBreakpoint,
  } = useLogStore()

  const [collapsed, setCollapsed] = useState(false)
  const [filter, setFilter] = useState<AICallPass | 'all'>('all')

  const filtered = filter === 'all' ? logs : logs.filter((l) => l.pass === filter)
  const activeCount = logs.filter((l) => l.status === 'streaming' || l.status === 'pending').length
  const hasPauses = activePauses.length > 0

  // Collapsed: show just a slim toggle strip
  if (collapsed) {
    return (
      <div className="flex flex-col items-center border-l border-gray-200 bg-gray-50 w-9 flex-shrink-0">
        <button
          onClick={() => setCollapsed(false)}
          className="flex flex-col items-center gap-1 py-3 px-1 w-full hover:bg-gray-100 transition-colors"
          title="Open AI Log"
        >
          <ChevronLeft className="w-3.5 h-3.5 text-gray-400" />
          <Bot className="w-4 h-4 text-indigo-400" />
          {activeCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          )}
          {hasPauses && (
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          )}
          <span className="text-[9px] text-gray-400 font-mono [writing-mode:vertical-lr] mt-1">
            {logs.length} calls
          </span>
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200 w-[360px] flex-shrink-0 min-w-0">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 bg-gray-50 flex-shrink-0">
        <Bot className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
        <span className="text-xs font-bold text-gray-700">AI Log</span>
        {activeCount > 0 && (
          <span className="flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full font-medium">
            <Loader2 className="w-2.5 h-2.5 animate-spin" />{activeCount}
          </span>
        )}
        <span className="text-[10px] text-gray-400 ml-auto">{logs.length}</span>
        <button onClick={clearLogs} className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600" title="Clear">
          <Trash2 className="w-3 h-3" />
        </button>
        <button onClick={() => setCollapsed(true)} className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600" title="Collapse">
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* ── Step-pause toggle ───────────────────────────────── */}
      <div className={`flex items-center gap-2 px-3 py-2 border-b flex-shrink-0 ${stepPauseMode ? 'border-orange-200 bg-orange-50' : 'border-gray-100 bg-white'}`}>
        <Pause className={`w-3 h-3 flex-shrink-0 ${stepPauseMode ? 'text-orange-500' : 'text-gray-400'}`} />
        <span className={`text-[11px] font-semibold flex-1 ${stepPauseMode ? 'text-orange-700' : 'text-gray-600'}`}>
          Step-Pause Mode
        </span>
        <span className="text-[9px] text-gray-400 mr-1">pause after each pass</span>
        {/* Toggle switch */}
        <button
          onClick={toggleStepPause}
          className={`relative w-8 h-4 rounded-full transition-colors flex-shrink-0 ${stepPauseMode ? 'bg-orange-500' : 'bg-gray-200'}`}
          role="switch"
          aria-checked={stepPauseMode}
        >
          <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${stepPauseMode ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </button>
      </div>

      {/* ── Pass filters ────────────────────────────────────── */}
      <div className="flex gap-1 px-2 py-1.5 border-b border-gray-100 flex-shrink-0 overflow-x-auto">
        {(['all', 'manifest', 'pass1_structure', 'pass2_visual', 'pass3_validator'] as const).map((f) => {
          const count = f === 'all' ? logs.length : logs.filter((l) => l.pass === f).length
          const label = f === 'all' ? 'All' : PASS_LABEL[f as AICallPass]
          const c = f !== 'all' ? PASS_COLORS[f as AICallPass] : null
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-shrink-0 flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full transition-colors ${
                filter === f ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {c && filter !== f && <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />}
              {label}
              {count > 0 && <span className="opacity-60">({count})</span>}
            </button>
          )
        })}
      </div>

      {/* ── Paused queue (pinned, compact) ───────────────── */}
      {activePauses.length > 0 && (
        <div className="flex-shrink-0 border-b border-orange-200 bg-orange-50">
          <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-orange-100">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-[10px] font-bold text-orange-700 uppercase tracking-wide">
              {activePauses.length} waiting for review
            </span>
            <button
              onClick={() => activePauses.forEach((p) => resumeBreakpoint(p.breakpointId))}
              className="ml-auto text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Continue all
            </button>
          </div>
          {activePauses.map((p) => (
            <div key={p.breakpointId} className="flex items-center gap-2 px-3 py-1.5 border-b border-orange-100 last:border-0">
              <span className="text-[11px] font-medium text-orange-800 flex-1 truncate">
                {p.sectionType}
                <span className="text-orange-400 font-normal ml-1">after {PASS_LABEL[p.afterPass as AICallPass]}</span>
              </span>
              <button
                onClick={() => resumeBreakpoint(p.breakpointId)}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-semibold transition-colors flex-shrink-0"
              >
                <Play className="w-2.5 h-2.5" /> Continue
              </button>
              <button
                onClick={() => abortBreakpoint(p.breakpointId)}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-100 hover:bg-red-200 text-red-700 text-[10px] font-semibold transition-colors flex-shrink-0"
              >
                <Square className="w-2.5 h-2.5" /> Abort
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Log list (grouped by section) ───────────────────── */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-300 text-center py-16">
            <Bot className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-xs font-medium text-gray-400">No AI calls yet</p>
            <p className="text-[10px] mt-1 text-gray-300">Generate a page to see live logs</p>
          </div>
        ) : (
          <SectionGroupedLogs logs={filtered} />
        )}
      </div>
    </div>
  )
}
