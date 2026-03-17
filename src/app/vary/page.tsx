'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { VARIATION_AXES, MODEL_OPTIONS } from '@/app/api/v2/vary-batch/route'
import type { BatchVariationResult, VariationModel } from '@/app/api/v2/vary-batch/route'
import {
  ArrowLeft, Wand2, Sparkles, Loader2, Save, Eye, EyeOff,
  Code2, CheckSquare, Square, Layers, Zap, LayoutGrid, X, Check,
  Star, RotateCcw, Pencil, ChevronDown, ChevronUp, Maximize2, Copy
} from 'lucide-react'
import { toast } from 'sonner'
import { SECTION_EXAMPLES, EXAMPLE_CATEGORIES } from './examples'

function buildPreviewDoc(html: string): string {
  const reportHeight = `<scr` + `ipt>
    function report(){
      const h = document.body.scrollHeight;
      window.parent.postMessage({type:'iframeHeight',h},'*');
    }
    window.addEventListener('load', () => setTimeout(report, 300));
  </scr` + `ipt>`
  // Strip any existing closing tags so our script injection doesn't end up as visible text
  const cleanHtml = html
    .replace(/<\/body\s*>/gi, '')
    .replace(/<\/html\s*>/gi, '')
    .replace(/<html[^>]*>/gi, '')
    .replace(/<body[^>]*>/gi, '')
    .replace(/<head>[\s\S]*?<\/head>/gi, '')
    .replace(/<!DOCTYPE[^>]*>/gi, '')
    // Remove SVG paths with truncated d attributes (AI sometimes truncates with …)
    .replace(/<path[^>]*d="[^"]*[…\u2026][^"]*"[^>]*\/?>/gi, '')
  return [
    '<!DOCTYPE html><html class="dark"><head>',
    '<script src="https://unpkg.com/@tailwindcss/browser@4"></s' + 'cript>',
    '<style>*{box-sizing:border-box}body{margin:0;font-family:Inter,sans-serif}</style>',
    '</head><body>',
    cleanHtml,
    reportHeight,
    '</body></html>',
  ].join('')
}

const GROUP_META: Record<string, { label: string; color: string }> = {
  color:      { label: 'Color & Background', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  layout:     { label: 'Layout',             color: 'bg-violet-100 text-violet-700 border-violet-200' },
  typography: { label: 'Typography',         color: 'bg-blue-100 text-blue-700 border-blue-200' },
  decoration: { label: 'Decoration',         color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  animation:  { label: 'Animation',          color: 'bg-amber-100 text-amber-700 border-amber-200' },
  cards:      { label: 'Cards',              color: 'bg-rose-100 text-rose-700 border-rose-200' },
  density:    { label: 'Density',            color: 'bg-orange-100 text-orange-700 border-orange-200' },
  cta:        { label: 'CTA Style',          color: 'bg-pink-100 text-pink-700 border-pink-200' },
}

const GROUPS = Object.keys(GROUP_META)

function GroupBadge({ group }: { group: string }) {
  const meta = GROUP_META[group] ?? { label: group, color: 'bg-gray-100 text-gray-600 border-gray-200' }
  return (
    <span className={`px-1.5 py-0.5 rounded border text-[10px] font-semibold ${meta.color}`}>
      {meta.label}
    </span>
  )
}

function VariationModal({ result, refinedHtml, onClose, onSave }: {
  result: BatchVariationResult
  refinedHtml: string | null
  onClose: () => void
  onSave: (html: string) => void
}) {
  const [showRefined, setShowRefined] = useState(!!refinedHtml)
  const [showCode, setShowCode] = useState(false)
  const activeHtml = (refinedHtml && showRefined) ? refinedHtml : (result.html ?? '')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900">{result.label}</span>
              <GroupBadge group={result.group} />
              {refinedHtml && (
                <div className="flex gap-1">
                  <button onClick={() => setShowRefined(true)} className={`text-[10px] px-2 py-0.5 rounded font-medium ${showRefined ? 'bg-violet-600 text-white' : 'bg-violet-100 text-violet-600'}`}>Refined</button>
                  <button onClick={() => setShowRefined(false)} className={`text-[10px] px-2 py-0.5 rounded font-medium ${!showRefined ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Original</button>
                </div>
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">{result.ms}ms · {activeHtml.length} chars</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { navigator.clipboard.writeText(activeHtml); toast.success('Copied!') }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg"
            ><Copy className="w-3 h-3" /> Copy HTML</button>
            <button
              onClick={() => onSave(activeHtml)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
            ><Save className="w-3 h-3" /> Save to Dict</button>
            <button onClick={() => setShowCode(!showCode)} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg ${showCode ? 'bg-gray-900 text-green-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>
              <Code2 className="w-3 h-3" /> {showCode ? 'Preview' : 'HTML'}
            </button>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500"><X className="w-4 h-4" /></button>
          </div>
        </div>
        {/* Body — full-height preview */}
        <div className="flex-1 overflow-hidden">
          {showCode ? (
            <div className="h-full bg-gray-950 overflow-auto p-5">
              <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap leading-5">{activeHtml}</pre>
            </div>
          ) : (
            <iframe
              srcDoc={buildPreviewDoc(activeHtml)}
              className="w-full h-full block"
              style={{ border: 'none', minHeight: 500 }}
              sandbox="allow-scripts"
            />
          )}
        </div>
      </div>
    </div>
  )
}

function VariationCard({
  result,
  selected,
  favourited,
  onToggleSelect,
  onToggleFavourite,
  onSave,
  onExpand,
}: {
  result: BatchVariationResult
  selected: boolean
  favourited: boolean
  onToggleSelect: () => void
  onToggleFavourite: () => void
  onSave: (html: string) => void
  onExpand: (refinedHtml: string | null) => void
}) {
  const [showHtml, setShowHtml] = useState(false)
  const [refineOpen, setRefineOpen] = useState(false)
  const [instruction, setInstruction] = useState('')
  const [refining, setRefining] = useState(false)
  const [refinedHtml, setRefinedHtml] = useState<string | null>(null)
  const [showRefined, setShowRefined] = useState(true)

  const activeHtml = (refinedHtml && showRefined) ? refinedHtml : (result.html ?? '')
  const previewDoc = activeHtml ? buildPreviewDoc(activeHtml) : ''

  async function handleRefine() {
    if (!instruction.trim() || !result.html) return
    setRefining(true)
    try {
      const res = await fetch('/api/v2/vary-snippet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: result.html, instruction: instruction.trim(), count: 1 }),
      })
      const json = await res.json()
      const html = json.variations?.[0] ?? json.html ?? null
      if (!html) throw new Error('No output')
      setRefinedHtml(html)
      setShowRefined(true)
      toast.success('Refined!')
    } catch (err) {
      toast.error(`Refine failed: ${String(err)}`)
    } finally {
      setRefining(false)
    }
  }

  return (
    <div
      className={`relative rounded-2xl border-2 overflow-hidden transition-all duration-200 ${
        favourited ? 'border-amber-400 shadow-lg shadow-amber-50' :
        selected ? 'border-indigo-500 shadow-lg shadow-indigo-100' :
        'border-gray-200 hover:border-gray-300'
      } ${result.html ? '' : 'opacity-50'}`}
    >
      {/* Top-left: select checkbox */}
      <button
        onClick={onToggleSelect}
        className="absolute top-2 left-2 z-10 w-6 h-6 rounded-md bg-white/90 border border-gray-200 flex items-center justify-center hover:bg-indigo-50 transition-colors"
      >
        {selected
          ? <Check className="w-3.5 h-3.5 text-indigo-600" />
          : <span className="w-3 h-3 rounded-sm border border-gray-400" />
        }
      </button>

      {/* Top-right: favourite star */}
      <button
        onClick={onToggleFavourite}
        className={`absolute top-2 right-2 z-10 w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
          favourited ? 'text-amber-400' : 'text-gray-300 hover:text-amber-300'
        }`}
      >
        <Star className="w-4 h-4" fill={favourited ? 'currentColor' : 'none'} />
      </button>

      {activeHtml ? (
        <div className="overflow-hidden bg-white" style={{ height: 380 }}>
          <iframe
            srcDoc={previewDoc}
            className="pointer-events-none w-full block"
            style={{ height: 380, border: 'none' }}
            sandbox="allow-scripts"
          />
        </div>
      ) : (
        <div className="bg-red-50 flex flex-col items-center justify-center gap-2 p-4" style={{ height: 320 }}>
          <p className="text-xs font-bold text-red-500">Generation failed</p>
          <p className="text-[10px] text-red-400 text-center font-mono break-all">{result.error ?? 'Unknown error'}</p>
        </div>
      )}

      {/* Refined indicator */}
      {refinedHtml && (
        <div className="flex items-center gap-1 px-3 py-1.5 bg-violet-50 border-b border-violet-100">
          <Sparkles className="w-3 h-3 text-violet-500" />
          <span className="text-[10px] text-violet-600 font-semibold">AI refined</span>
          <div className="ml-auto flex gap-1">
            <button
              onClick={() => setShowRefined(true)}
              className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                showRefined ? 'bg-violet-600 text-white' : 'bg-violet-100 text-violet-600'
              }`}
            >Refined</button>
            <button
              onClick={() => setShowRefined(false)}
              className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                !showRefined ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >Original</button>
            <button
              onClick={() => { setRefinedHtml(null); setShowRefined(true) }}
              className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-500 hover:bg-red-100 font-medium"
              title="Discard refinement"
            ><RotateCcw className="w-2.5 h-2.5" /></button>
          </div>
        </div>
      )}

      <div className="p-3">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="text-xs font-bold text-gray-800">{result.label}</span>
          <div className="flex items-center gap-1.5">
            {result.modelUsed && (
              <span className="text-[9px] px-1.5 py-0.5 rounded font-mono bg-violet-100 text-violet-600 border border-violet-200">{result.modelUsed}</span>
            )}
            <span className="text-[10px] text-gray-400">{result.ms}ms</span>
          </div>
        </div>
        <GroupBadge group={result.group} />

        {result.html && (
          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            <button
              onClick={() => onExpand(refinedHtml)}
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              <Maximize2 className="w-2.5 h-2.5" /> Open
            </button>
            <button
              onClick={() => onSave(activeHtml)}
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              <Save className="w-2.5 h-2.5" /> {refinedHtml && showRefined ? 'Save refined' : 'Save'}
            </button>
            <button
              onClick={() => setRefineOpen(!refineOpen)}
              className={`flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded-lg transition-colors ${
                refineOpen ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
            >
              <Pencil className="w-2.5 h-2.5" /> Refine
            </button>
            <button
              onClick={() => setShowHtml(!showHtml)}
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
            >
              <Code2 className="w-2.5 h-2.5" /> {showHtml ? 'Hide' : 'HTML'}
            </button>
          </div>
        )}

        {/* AI Refine panel */}
        {refineOpen && result.html && (
          <div className="mt-3 space-y-2">
            <div className="flex gap-1.5">
              <input
                value={instruction}
                onChange={e => setInstruction(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleRefine() }}
                placeholder="e.g. make it dark, add gradient headline…"
                className="flex-1 text-[10px] border border-violet-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-400 bg-violet-50/30"
              />
              <button
                onClick={handleRefine}
                disabled={refining || !instruction.trim()}
                className="flex items-center gap-1 px-2 py-1.5 text-[10px] font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-lg disabled:opacity-50"
              >
                {refining ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Sparkles className="w-2.5 h-2.5" />}
                {refining ? '…' : 'Go'}
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {['make it dark','add gradient headline','remove all decoration','make it compact','glassmorphism cards'].map(s => (
                <button key={s} onClick={() => setInstruction(s)}
                  className="text-[9px] px-1.5 py-0.5 bg-gray-100 hover:bg-violet-100 hover:text-violet-700 text-gray-500 rounded border border-gray-200 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {showHtml && activeHtml && (
          <div className="mt-2 bg-gray-900 rounded-lg p-2 overflow-auto max-h-32">
            <pre className="text-[9px] text-green-400 font-mono whitespace-pre-wrap break-all leading-4">
              {activeHtml.slice(0, 500)}{activeHtml.length > 500 ? '\n…' : ''}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

export default function VaryPage() {
  const [sourceHtml, setSourceHtml] = useState('')
  const [previewKey, setPreviewKey] = useState(0)
  const [previewHeight, setPreviewHeight] = useState(300)
  const [savedExamples, setSavedExamples] = useState<typeof SECTION_EXAMPLES>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem('vary-examples')
      if (raw) setSavedExamples(JSON.parse(raw))
    } catch { /* ignore */ }
    try {
      const loadHtml = localStorage.getItem('vary-load-html')
      if (loadHtml) {
        setSourceHtml(loadHtml)
        localStorage.removeItem('vary-load-html')
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.data?.type === 'iframeHeight') setPreviewHeight(Math.max(200, e.data.h + 16))
      if (e.data?.type === 'iframeDebug') console.log('[iframe] innerWidth:', e.data.innerWidth)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])
  const [selectedAxes, setSelectedAxes] = useState<Set<string>>(new Set(VARIATION_AXES.map(a => a.id)))

  useEffect(() => {
    const t = setTimeout(() => setPreviewKey(k => k + 1), 800)
    return () => clearTimeout(t)
  }, [sourceHtml])
  const [results, setResults] = useState<BatchVariationResult[]>([])
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set())
  const [favourites, setFavourites] = useState<Set<string>>(new Set())
  const [axisLog, setAxisLog] = useState<Record<string, 'pending'|'running'|'done'|'error'>>({})
  const [selectedModel, setSelectedModel] = useState<VariationModel>('gpt-4o-mini')
  const [modalResult, setModalResult] = useState<{ result: BatchVariationResult; refinedHtml: string | null } | null>(null)
  const [savingAll, setSavingAll] = useState(false)
  const [filterGroup, setFilterGroup] = useState<string | null>(null)
  const [dictionaries, setDictionaries] = useState<Array<{ id: string; label?: string; paradigm: string }>>([])
  const [targetDict, setTargetDict] = useState('')
  const [targetSlot, setTargetSlot] = useState('card')

  const toggleAxis = (id: string) => {
    setSelectedAxes(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleGroup = (group: string) => {
    const groupAxes = VARIATION_AXES.filter(a => a.group === group).map(a => a.id)
    const allSelected = groupAxes.every(id => selectedAxes.has(id))
    setSelectedAxes(prev => {
      const next = new Set(prev)
      groupAxes.forEach(id => allSelected ? next.delete(id) : next.add(id))
      return next
    })
  }

  const selectAll = () => setSelectedAxes(new Set(VARIATION_AXES.map(a => a.id)))
  const selectNone = () => setSelectedAxes(new Set())

  const loadDicts = useCallback(async () => {
    if (dictionaries.length) return dictionaries
    const res = await fetch('/api/style-dictionary?list=1')
    const all = await res.json()
    const dicts = (Array.isArray(all) ? all : []).map((d: { id: string; label?: string; paradigm: string }) => ({
      id: d.id, label: d.label, paradigm: d.paradigm
    }))
    setDictionaries(dicts)
    if (!targetDict && dicts.length) setTargetDict(dicts[0].id)
    return dicts
  }, [dictionaries, targetDict])

  async function handleGenerate() {
    if (!sourceHtml.trim()) return toast.error('Paste an HTML section first')
    if (selectedAxes.size === 0) return toast.error('Select at least one variation axis')

    const axes = VARIATION_AXES.filter(a => selectedAxes.has(a.id))
    setGenerating(true)
    setProgress(0)
    setResults([])
    setSelectedResults(new Set())
    setFavourites(new Set())

    // Mark all as pending
    const initialLog: Record<string, 'pending'|'running'|'done'|'error'> = {}
    axes.forEach(a => { initialLog[a.id] = 'pending' })
    setAxisLog(initialLog)

    let completed = 0
    const total = axes.length
    // Run sequentially — one at a time, result appears as each finishes
    async function runAxis(axis: typeof axes[0]) {
      setAxisLog(prev => ({ ...prev, [axis.id]: 'running' }))
      try {
        console.log(`[vary] → ${axis.id} | model: ${selectedModel} | htmlLen: ${sourceHtml.length}`)
        const res = await fetch('/api/v2/vary-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ html: sourceHtml, axisIds: [axis.id], concurrency: 1, model: selectedModel }),
        })
        if (!res.ok) {
          const errText = await res.text()
          console.error(`[vary] ✗ ${axis.id} HTTP ${res.status}:`, errText)
          throw new Error(`HTTP ${res.status}: ${errText.slice(0, 300)}`)
        }
        const json = await res.json()
        console.log(`[vary] ✓ ${axis.id} | ok: ${!!json.results?.[0]?.html} | model: ${json.results?.[0]?.modelUsed}`)
        const result: BatchVariationResult = json.results?.[0] ?? {
          axisId: axis.id, label: axis.label, group: axis.group, html: null, error: 'No result', ms: 0
        }
        completed++
        setAxisLog(prev => ({ ...prev, [axis.id]: result.html ? 'done' : 'error' }))
        setResults(prev => [...prev, result])
        setProgress(Math.round((completed / total) * 100))
      } catch (err) {
        completed++
        setAxisLog(prev => ({ ...prev, [axis.id]: 'error' }))
        setResults(prev => [...prev, {
          axisId: axis.id, label: axis.label, group: axis.group, html: null, error: String(err), ms: 0
        }])
        setProgress(Math.round((completed / total) * 100))
      }
    }

    // Sequential — one at a time, results appear as each finishes
    for (const axis of axes) {
      await runAxis(axis)
    }

    const finalResults = await new Promise<BatchVariationResult[]>(resolve => {
      setResults(prev => { resolve(prev); return prev })
    })
    const succeeded = finalResults.filter(r => r.html).length
    toast.success(`Generated ${succeeded}/${total} variations`)
    setGenerating(false)
    setProgress(100)
  }

  async function saveVariation(result: BatchVariationResult, slotOverride?: string) {
    const dicts = await loadDicts()
    const dictId = targetDict || dicts[0]?.id
    if (!dictId) return toast.error('No dictionary selected')

    const res = await fetch(`/api/style-dictionary?ref=${dictId}`)
    const dict = await res.json()
    const slot = slotOverride ?? targetSlot
    const existingVariants = dict.variants?.[slot] ?? []

    const newVariant = {
      name: result.axisId,
      description: `${result.label} variation`,
      html: result.html!,
      tags: [result.group, result.axisId],
      preview_note: `Generated variation: ${result.label}`,
    }

    await fetch('/api/style-dictionary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ref: dictId,
        dict: { ...dict, variants: { ...(dict.variants ?? {}), [slot]: [...existingVariants, newVariant] } },
      }),
    })
    toast.success(`Saved "${result.label}" → ${dictId}/${slot}`)
  }

  async function saveSelected() {
    if (selectedResults.size === 0) return toast.error('Select variations first')
    setSavingAll(true)
    const toSave = results.filter(r => selectedResults.has(r.axisId) && r.html)
    for (const r of toSave) {
      await saveVariation(r)
    }
    toast.success(`Saved ${toSave.length} variations`)
    setSavingAll(false)
  }

  const visibleResults = filterGroup
    ? results.filter(r => r.group === filterGroup)
    : results

  const succeeded = results.filter(r => r.html).length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/scraper" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" /> Scraper
          </Link>
          <div className="w-px h-4 bg-gray-200" />
          <div className="flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-violet-500" />
            <span className="text-sm font-bold text-gray-900">Batch Variation Generator</span>
            <span className="px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full text-xs font-semibold">up to 31 in parallel</span>
          </div>
        </div>
        {results.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">{succeeded}/{results.length} succeeded</span>
            {selectedResults.size > 0 && (
              <button
                onClick={saveSelected}
                disabled={savingAll}
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50"
              >
                {savingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save {selectedResults.size} selected
              </button>
            )}
          </div>
        )}
      </div>

      <div className="max-w-screen-2xl mx-auto px-6 py-6 space-y-6">

        {/* Source HTML — full width */}
        <div className="space-y-6">

          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2 flex-wrap">
              <Code2 className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-bold text-gray-900">Source HTML</span>
              <span className="text-xs text-gray-400">Paste any section block</span>
              <div className="ml-auto flex items-center gap-2 flex-wrap">
                {EXAMPLE_CATEGORIES.map(cat => (
                  <div key={cat.id} className="relative group">
                    <button className="flex items-center gap-1 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-colors">
                      {cat.label}
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50 hidden group-hover:block">
                      {[...SECTION_EXAMPLES, ...savedExamples].filter(e => e.category === cat.id).map(ex => (
                        <button
                          key={ex.id}
                          onClick={() => setSourceHtml(ex.html)}
                          className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 first:rounded-t-xl last:rounded-b-xl transition-colors"
                        >
                          {ex.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4">
              <textarea
                value={sourceHtml}
                onChange={e => setSourceHtml(e.target.value)}
                placeholder={`<section class="py-16 bg-white">
  <div class="max-w-7xl mx-auto px-8">
    <h2 class="text-3xl font-bold">Your section here</h2>
    ...
  </div>
</section>`}
                rows={12}
                className="w-full text-xs font-mono border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-300 resize-y bg-gray-50"
              />
              {sourceHtml && (
                <div className="mt-3">
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Live preview</div>
                  <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                    <iframe
                      key={previewKey}
                      srcDoc={buildPreviewDoc(sourceHtml)}
                      className="w-full block"
                      style={{ border: 'none', height: previewHeight }}
                      sandbox="allow-scripts"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Axis selector — below source */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-violet-500" />
                <span className="text-sm font-bold text-gray-900">Variation Axes</span>
                <span className="px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full text-xs font-semibold">{selectedAxes.size} selected</span>
              </div>
              <div className="flex gap-2">
                <button onClick={selectAll} className="text-xs text-indigo-600 hover:underline">All</button>
                <button onClick={selectNone} className="text-xs text-gray-400 hover:underline">None</button>
              </div>
            </div>
            <div className="p-4">
              {GROUPS.map(group => {
                const axes = VARIATION_AXES.filter(a => a.group === group)
                const allSel = axes.every(a => selectedAxes.has(a.id))
                const someSel = axes.some(a => selectedAxes.has(a.id))
                return (
                  <div key={group} className="mb-4">
                    <button
                      onClick={() => toggleGroup(group)}
                      className="flex items-center gap-2 mb-2 w-full text-left"
                    >
                      <span className={`w-4 h-4 rounded flex items-center justify-center border ${allSel ? 'bg-indigo-600 border-indigo-600' : someSel ? 'bg-indigo-200 border-indigo-300' : 'border-gray-300'}`}>
                        {allSel && <Check className="w-2.5 h-2.5 text-white" />}
                      </span>
                      <GroupBadge group={group} />
                      <span className="text-[10px] text-gray-400 ml-auto">{axes.filter(a => selectedAxes.has(a.id)).length}/{axes.length}</span>
                    </button>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-1.5 pl-6">
                      {axes.map(axis => (
                        <button
                          key={axis.id}
                          onClick={() => toggleAxis(axis.id)}
                          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-left text-xs transition-colors ${
                            selectedAxes.has(axis.id)
                              ? 'bg-indigo-50 border border-indigo-200 text-indigo-700 font-medium'
                              : 'bg-gray-50 border border-gray-200 text-gray-500 hover:bg-gray-100'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${selectedAxes.has(axis.id) ? 'bg-indigo-500' : 'bg-gray-300'}`} />
                          {axis.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Model selector */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide block mb-2">Model</label>
          <div className="flex flex-wrap gap-1.5">
            {MODEL_OPTIONS.map(m => (
              <button
                key={m.id}
                onClick={() => setSelectedModel(m.id)}
                title={m.note}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  selectedModel === m.id
                    ? m.provider === 'anthropic'
                      ? 'bg-orange-600 border-orange-600 text-white'
                      : 'bg-violet-600 border-violet-600 text-white'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <span className={`text-[9px] px-1 py-0.5 rounded font-bold ${
                  selectedModel === m.id ? 'bg-white/20 text-white' :
                  m.provider === 'anthropic' ? 'bg-orange-100 text-orange-600' : 'bg-violet-100 text-violet-600'
                }`}>
                  {m.provider === 'anthropic' ? 'Claude' : 'OAI'}
                </span>
                {m.label}
              </button>
            ))}
          </div>
          {MODEL_OPTIONS.find(m => m.id === selectedModel) && (
            <p className="text-[10px] text-gray-400 mt-1.5">{MODEL_OPTIONS.find(m => m.id === selectedModel)?.note}</p>
          )}
        </div>

        {/* Save target + generate button */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3 flex-1">
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">Save to Dictionary</label>
              {dictionaries.length === 0 ? (
                <button onClick={loadDicts} className="text-xs text-indigo-600 hover:underline">Load dictionaries</button>
              ) : (
                <select
                  value={targetDict}
                  onChange={e => setTargetDict(e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  {dictionaries.map(d => <option key={d.id} value={d.id}>{d.label ?? d.id}</option>)}
                </select>
              )}
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">Slot</label>
              <input
                value={targetSlot}
                onChange={e => setTargetSlot(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 w-28 focus:outline-none focus:ring-2 focus:ring-indigo-300 font-mono"
                placeholder="card"
              />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating || !sourceHtml.trim() || selectedAxes.size === 0}
            className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-colors ml-auto"
          >
            {generating
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating {results.length}/{selectedAxes.size}…</>
              : <><Sparkles className="w-4 h-4" /> Generate {selectedAxes.size} variations</>}
          </button>
        </div>

        {/* Live generation log */}
        {Object.keys(axisLog).length > 0 && (
          <div className="bg-gray-950 rounded-2xl border border-gray-800 p-4">
            <div className="flex items-center gap-3 mb-3">
              {generating && <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin flex-shrink-0" />}
              <span className="text-xs font-bold text-gray-300">
                {generating ? `Generating… ${results.length}/${Object.keys(axisLog).length}` : `Done — ${results.filter(r=>r.html).length} succeeded, ${results.filter(r=>!r.html).length} failed`}
              </span>
              <div className="flex-1 bg-gray-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-violet-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-[10px] text-gray-500 font-mono">{progress}%</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {VARIATION_AXES.filter(a => axisLog[a.id]).map(axis => {
                const status = axisLog[axis.id]
                const result = results.find(r => r.axisId === axis.id)
                return (
                  <div key={axis.id} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono border transition-all ${
                    status === 'running' ? 'bg-violet-900/50 border-violet-700 text-violet-300' :
                    status === 'done'    ? 'bg-emerald-900/40 border-emerald-800 text-emerald-400' :
                    status === 'error'   ? 'bg-red-900/40 border-red-800 text-red-400' :
                    'bg-gray-800 border-gray-700 text-gray-500'
                  }`}>
                    {status === 'running' && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                    {status === 'done'    && <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />}
                    {status === 'error'   && <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />}
                    {status === 'pending' && <span className="w-2 h-2 rounded-full bg-gray-600 flex-shrink-0" />}
                    <span>{axis.label}</span>
                    {status === 'done' && result?.ms && <span className="text-gray-600 ml-0.5">{result.ms}ms</span>}
                    {status === 'error' && <span className="text-red-600 ml-0.5">err</span>}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Results grid */}
        {results.length > 0 && (
          <div>
            {/* Filter bar */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="text-xs font-semibold text-gray-500">Filter:</span>
              <button
                onClick={() => setFilterGroup(null)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${!filterGroup ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                All ({results.length})
              </button>
              {GROUPS.filter(g => results.some(r => r.group === g)).map(g => (
                <button
                  key={g}
                  onClick={() => setFilterGroup(filterGroup === g ? null : g)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${filterGroup === g ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {GROUP_META[g]?.label ?? g} ({results.filter(r => r.group === g).length})
                </button>
              ))}
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => setSelectedResults(new Set(visibleResults.filter(r => r.html).map(r => r.axisId)))}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  Select all visible
                </button>
                <button
                  onClick={() => setSelectedResults(new Set())}
                  className="text-xs text-gray-400 hover:underline"
                >
                  Deselect all
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {visibleResults.map(result => (
                <VariationCard
                  key={result.axisId}
                  result={result}
                  selected={selectedResults.has(result.axisId)}
                  favourited={favourites.has(result.axisId)}
                  onToggleSelect={() => {
                    setSelectedResults(prev => {
                      const next = new Set(prev)
                      next.has(result.axisId) ? next.delete(result.axisId) : next.add(result.axisId)
                      return next
                    })
                  }}
                  onToggleFavourite={() => {
                    setFavourites(prev => {
                      const next = new Set(prev)
                      next.has(result.axisId) ? next.delete(result.axisId) : next.add(result.axisId)
                      return next
                    })
                  }}
                  onSave={(html) => saveVariation({ ...result, html })}
                  onExpand={(refinedHtml) => setModalResult({ result, refinedHtml })}
                />
              ))}
              {/* Skeleton placeholders while generating */}
              {generating && Array.from({ length: selectedAxes.size - results.length }).map((_, i) => (
                <div key={`sk-${i}`} className="rounded-2xl border-2 border-gray-100 overflow-hidden animate-pulse">
                  <div className="bg-gray-100" style={{ height: 420 }} />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                    <div className="h-2 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!generating && results.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <Wand2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-sm font-medium">Paste HTML + select axes → generate</p>
            <p className="text-xs mt-1">All {VARIATION_AXES.length} axes run in parallel batches of 10 — ~15–25s total</p>
          </div>
        )}
      </div>

      {modalResult && (
        <VariationModal
          result={modalResult.result}
          refinedHtml={modalResult.refinedHtml}
          onClose={() => setModalResult(null)}
          onSave={(html) => { saveVariation({ ...modalResult.result, html }); setModalResult(null) }}
        />
      )}
    </div>
  )
}
