'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { PageTopbar } from '@/components/ui/PageTopbar'
import { useLogStore, AICallLog, AICallPass, AICallStatus } from '@/lib/logStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Zap, Trash2, Download, Search, ChevronDown, ChevronUp,
  CheckCircle2, AlertCircle, Clock, Code2, MessageSquare,
  Filter, X, BarChart2, Loader2
} from 'lucide-react'
import { toast } from 'sonner'

const STATUS_CONFIG: Record<AICallStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending:   { label: 'Pending',   color: 'bg-gray-50 text-gray-600 border-gray-200',         icon: <Clock className="w-3.5 h-3.5" /> },
  streaming: { label: 'Streaming', color: 'bg-blue-50 text-blue-700 border-blue-200',          icon: <Loader2 className="w-3.5 h-3.5 animate-spin" /> },
  success:   { label: 'Success',   color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  error:     { label: 'Error',     color: 'bg-red-50 text-red-700 border-red-200',             icon: <AlertCircle className="w-3.5 h-3.5" /> },
}

const PASS_CONFIG: Record<AICallPass, { label: string; color: string }> = {
  manifest:        { label: 'Manifest',  color: 'bg-purple-50 text-purple-700 border-purple-200' },
  pass1_structure: { label: 'Pass 1',    color: 'bg-blue-50 text-blue-700 border-blue-200' },
  pass2_visual:    { label: 'Pass 2',    color: 'bg-amber-50 text-amber-700 border-amber-200' },
  pass3_validator: { label: 'Pass 3',    color: 'bg-green-50 text-green-700 border-green-200' },
  coherence:       { label: 'Coherence', color: 'bg-violet-50 text-violet-700 border-violet-200' },
  other:           { label: 'Other',     color: 'bg-gray-50 text-gray-600 border-gray-200' },
}

function fmt(ts: number) {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

function TokenBar({ input, output }: { input: number; output: number }) {
  const total = input + output
  const inputPct = total > 0 ? (input / total) * 100 : 50
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-gray-500 w-20 text-right">{input.toLocaleString()} in</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden flex">
        <div className="bg-indigo-400 h-full rounded-l-full" style={{ width: `${inputPct}%` }} />
        <div className="bg-emerald-400 h-full rounded-r-full flex-1" />
      </div>
      <span className="text-gray-500 w-20">{output.toLocaleString()} out</span>
    </div>
  )
}

function LogEntryCard({ entry, onDelete }: { entry: AICallLog; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'system' | 'user' | 'response'>('response')
  const status = STATUS_CONFIG[entry.status]
  const pass = PASS_CONFIG[entry.pass]

  return (
    <div className={`bg-white border rounded-xl overflow-hidden transition-shadow ${entry.status === 'error' ? 'border-red-200' : 'border-gray-200'} hover:shadow-md`}>
      {/* Header row */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <Badge className={`text-xs border font-mono flex-shrink-0 ${pass.color}`}>{pass.label}</Badge>
        <span className="font-semibold text-sm text-gray-900 truncate flex-1 min-w-0">{entry.label}</span>
        <code className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-mono flex-shrink-0">{entry.model}</code>
        <Badge className={`text-xs border flex items-center gap-1 flex-shrink-0 ${status.color}`}>
          {status.icon} {status.label}
        </Badge>
        <div className="flex-1 hidden md:block max-w-[200px]">
          <TokenBar input={entry.inputTokensEst} output={entry.outputTokensEst} />
        </div>
        {entry.durationMs > 0 && (
          <span className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
            <Clock className="w-3 h-3" /> {(entry.durationMs / 1000).toFixed(1)}s
          </span>
        )}
        <span className="text-xs text-gray-400 flex-shrink-0 hidden lg:block">{fmt(entry.timestamp)}</span>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={(e) => { e.stopPropagation(); onDelete() }} className="p-1 text-gray-300 hover:text-red-500 rounded transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {entry.status === 'error' && entry.error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-100 text-xs text-red-700 font-mono">⚠ {entry.error}</div>
      )}

      {expanded && (
        <div className="border-t border-gray-100">
          <div className="flex border-b border-gray-100">
            {(['system', 'user', 'response'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-semibold capitalize transition-colors ${
                  activeTab === tab ? 'text-indigo-600 border-b-2 border-indigo-500 bg-indigo-50' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'user' && <><MessageSquare className="w-3 h-3 inline mr-1" />User Message</>}
                {tab === 'system' && <><Code2 className="w-3 h-3 inline mr-1" />System Prompt</>}
                {tab === 'response' && <><Zap className="w-3 h-3 inline mr-1" />Response</>}
              </button>
            ))}
          </div>
          <div className="p-4">
            {activeTab === 'system' && (
              <pre className="text-xs text-gray-600 bg-gray-50 rounded-lg p-4 whitespace-pre-wrap leading-5 font-mono max-h-64 overflow-auto">{entry.systemPrompt || '(none)'}</pre>
            )}
            {activeTab === 'user' && (
              <pre className="text-xs text-indigo-900 bg-indigo-50 rounded-lg p-4 whitespace-pre-wrap leading-5 font-mono max-h-64 overflow-auto">{entry.userMessage || '(none)'}</pre>
            )}
            {activeTab === 'response' && (
              <pre className="text-xs text-green-400 bg-gray-900 rounded-lg p-4 whitespace-pre-wrap leading-5 font-mono max-h-64 overflow-auto">{entry.response || '(empty)'}</pre>
            )}
          </div>
          <div className="px-4 pb-4 grid grid-cols-4 gap-3">
            {[
              { label: 'Input ~', value: entry.inputTokensEst.toLocaleString() },
              { label: 'Output ~', value: entry.outputTokensEst.toLocaleString() },
              { label: 'Total ~', value: (entry.inputTokensEst + entry.outputTokensEst).toLocaleString() },
              { label: 'Duration', value: `${(entry.durationMs / 1000).toFixed(1)}s` },
            ].map((s) => (
              <div key={s.label} className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-lg font-black text-gray-900">{s.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function LogsPage() {
  const { logs, clearLogs, deleteLog } = useLogStore()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<AICallStatus | 'all'>('all')
  const [filterPass, setFilterPass] = useState<AICallPass | 'all'>('all')

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (filterStatus !== 'all' && l.status !== filterStatus) return false
      if (filterPass !== 'all' && l.pass !== filterPass) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          l.label.toLowerCase().includes(q) ||
          l.model.toLowerCase().includes(q) ||
          l.userMessage.toLowerCase().includes(q) ||
          l.response.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [logs, search, filterStatus, filterPass])

  const totalInputTokens = logs.reduce((s, l) => s + l.inputTokensEst, 0)
  const totalOutputTokens = logs.reduce((s, l) => s + l.outputTokensEst, 0)
  const avgDuration = logs.length > 0 ? Math.round(logs.reduce((s, l) => s + l.durationMs, 0) / logs.length) : 0
  const errorCount = logs.filter((l) => l.status === 'error').length
  const modelCounts = logs.reduce<Record<string, number>>((acc, l) => {
    acc[l.model] = (acc[l.model] ?? 0) + 1
    return acc
  }, {})

  function handleExport() {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pagecraft-ai-logs-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Logs exported')
  }

  async function handleSyncToServer() {
    if (logs.length === 0) return
    try {
      const payload = logs.map((l) => ({
        ts: new Date(l.timestamp).toISOString(),
        pass: l.pass,
        label: l.label,
        model: l.model,
        status: l.status,
        durationMs: l.durationMs,
        inputTokensEst: l.inputTokensEst,
        outputTokensEst: l.outputTokensEst,
        error: l.error,
        userMessage: l.userMessage.slice(0, 400),
        systemPrompt: l.systemPrompt.slice(0, 400),
        response: l.response.slice(0, 800),
      }))
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      toast.success(`Synced ${data.written} entries to server logs`)
    } catch {
      toast.error('Sync failed')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageTopbar
        title="AI Protocol Log"
        backHref="/builder"
        backLabel="Builder"
        right={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleSyncToServer} disabled={logs.length === 0} className="text-xs gap-1.5 text-indigo-600 hover:text-indigo-700 hover:border-indigo-300">
              <Download className="w-3.5 h-3.5" /> Sync to Server
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={logs.length === 0} className="text-xs gap-1.5">
              <Download className="w-3.5 h-3.5" /> Export JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { if (confirm('Clear all logs?')) { clearLogs(); toast.success('Logs cleared') } }}
              disabled={logs.length === 0}
              className="text-xs gap-1.5 text-red-500 hover:text-red-600 hover:border-red-300"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear All
            </Button>
          </div>
        }
      />

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { label: 'Total Calls', value: logs.length, color: 'text-indigo-600' },
            { label: '~Input Tokens', value: totalInputTokens.toLocaleString(), color: 'text-blue-600' },
            { label: '~Output Tokens', value: totalOutputTokens.toLocaleString(), color: 'text-emerald-600' },
            { label: 'Avg Duration', value: `${(avgDuration / 1000).toFixed(1)}s`, color: 'text-violet-600' },
            { label: 'Streaming', value: logs.filter(l => l.status === 'streaming').length, color: 'text-amber-600' },
            { label: 'Errors', value: errorCount, color: errorCount > 0 ? 'text-red-600' : 'text-gray-400' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5 font-medium">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Model usage breakdown */}
        {Object.keys(modelCounts).length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Model usage</h3>
            <div className="flex items-center gap-4 flex-wrap">
              {Object.entries(modelCounts).map(([model, count]) => (
                <div key={model} className="flex items-center gap-2">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-700">{model}</code>
                  <span className="text-sm font-bold text-gray-900">{count}</span>
                  <span className="text-xs text-gray-400">calls ({Math.round((count / logs.length) * 100)}%)</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48 max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search prompts, models…" className="pl-9 text-sm" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Filter className="w-4 h-4 text-gray-400" />
            {(['all', 'manifest', 'pass1_structure', 'pass2_visual', 'pass3_validator', 'coherence'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setFilterPass(v as AICallPass | 'all')}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${filterPass === v ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                {v === 'all' ? 'All passes' : PASS_CONFIG[v as AICallPass].label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            {(['all', 'success', 'streaming', 'error', 'pending'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setFilterStatus(v as AICallStatus | 'all')}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${filterStatus === v ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                {v === 'all' ? 'All status' : v}
              </button>
            ))}
          </div>

          <span className="text-xs text-gray-400 ml-auto">{filtered.length} of {logs.length} entries</span>
        </div>

        {/* Log entries */}
        {logs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 py-20 text-center">
            <BarChart2 className="w-10 h-10 mx-auto text-gray-200 mb-3" />
            <p className="text-gray-500 font-semibold">No AI calls logged yet</p>
            <p className="text-sm text-gray-400 mt-1">Generate a page in the builder — every AI call will appear here</p>
            <Link href="/builder" className="inline-flex items-center gap-1.5 mt-4 text-sm text-indigo-600 font-medium hover:underline">
              <Zap className="w-4 h-4" /> Open Builder
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No entries match your filters</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((entry) => (
              <LogEntryCard key={entry.id} entry={entry} onDelete={() => deleteLog(entry.id)} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
