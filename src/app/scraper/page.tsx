'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { PageTopbar } from '@/components/ui/PageTopbar'
import {
  Database, Zap, RefreshCw, Trash2, Code2, Eye, EyeOff,
  ArrowLeft, FileJson, Download, Upload, CheckCircle2,
  AlertCircle, Layers, Search, ChevronDown, ChevronUp, Info, Globe2, Loader2,
  Scissors, Sparkles, Plus, Save, Wand2, Copy
} from 'lucide-react'
import type { ExtractedSection } from '@/app/api/v2/extract-sections/route'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

interface BlockEntry {
  id: string
  category: string
  source: string
  html: string
  tags: string[]
}

interface CategoryData {
  count: number
  sizeKb: number
  examples: BlockEntry[]
}

type BlocksData = Record<string, CategoryData>

const CATEGORIES = ['navbar', 'hero', 'features', 'stats', 'testimonials', 'pricing', 'faq', 'cta', 'footer']

const CATEGORY_META: Record<string, { icon: string; color: string; desc: string }> = {
  navbar:       { icon: '☰',  color: 'bg-slate-100 text-slate-700 border-slate-200',       desc: 'Navigation headers, menus, and top bars' },
  hero:         { icon: '⚡', color: 'bg-indigo-50 text-indigo-700 border-indigo-200',      desc: 'Hero banners, headlines, and primary CTAs' },
  features:     { icon: '✦',  color: 'bg-violet-50 text-violet-700 border-violet-200',     desc: 'Feature grids, benefit lists, and highlights' },
  stats:        { icon: '📊', color: 'bg-blue-50 text-blue-700 border-blue-200',            desc: 'Stats counters, metrics, and KPI displays' },
  testimonials: { icon: '💬', color: 'bg-emerald-50 text-emerald-700 border-emerald-200',  desc: 'Customer quotes, reviews, and social proof' },
  pricing:      { icon: '💳', color: 'bg-amber-50 text-amber-700 border-amber-200',        desc: 'Pricing tables, plan comparisons, and tiers' },
  faq:          { icon: '❓', color: 'bg-orange-50 text-orange-700 border-orange-200',      desc: 'Accordion FAQs and question-answer sections' },
  cta:          { icon: '🎯', color: 'bg-rose-50 text-rose-700 border-rose-200',            desc: 'Call-to-action banners and conversion sections' },
  footer:       { icon: '▬',  color: 'bg-gray-50 text-gray-700 border-gray-200',           desc: 'Page footers with links and copyright info' },
}

const DATA_FLOW = [
  {
    step: '1',
    label: 'Scraper runs',
    detail: 'scripts/scrape-tailwind.ts',
    desc: 'Puppeteer visits Tailwind UI preview pages and extracts HTML blocks',
    color: 'bg-indigo-600',
  },
  {
    step: '2',
    label: 'Saved as JSON',
    detail: 'data/blocks/{category}.json',
    desc: 'Each block is saved as a structured entry with id, category, source, html, tags',
    color: 'bg-violet-600',
  },
  {
    step: '3',
    label: 'Loaded by examples.ts',
    detail: 'src/lib/examples.ts',
    desc: 'Server-side loader reads JSON files on-demand, caches per category',
    color: 'bg-blue-600',
  },
  {
    step: '4',
    label: 'Injected into AI prompt',
    detail: 'src/lib/ai.ts',
    desc: 'Best matching example is appended to the system prompt as reference HTML context',
    color: 'bg-emerald-600',
  },
  {
    step: '5',
    label: 'AI generates section',
    detail: '/api/generate',
    desc: 'GPT-4o uses the example as style inspiration to produce a matching Tailwind block',
    color: 'bg-amber-600',
  },
  {
    step: '6',
    label: 'Streamed to canvas',
    detail: 'src/app/builder/page.tsx',
    desc: 'Generated HTML is streamed chunk-by-chunk into the live iframe preview',
    color: 'bg-rose-600',
  },
]

function JsonSchema() {
  return (
    <div className="bg-gray-900 rounded-xl p-5 font-mono text-sm">
      <div className="text-gray-400 text-xs mb-3 uppercase tracking-wider">TailwindExample interface</div>
      <pre className="text-green-400 leading-7">{`interface TailwindExample {
  id:       string      <span class="text-gray-500">// nanoid — unique key</span>
  category: string      <span class="text-gray-500">// "hero" | "features" | ...</span>
  source:   string      <span class="text-gray-500">// URL scraped from</span>
  html:     string      <span class="text-gray-500">// raw Tailwind HTML block</span>
  tags:     string[]    <span class="text-gray-500">// ["dark","centered","grid"]</span>
}`}</pre>
    </div>
  )
}

function BlockCard({ block, onDelete }: { block: BlockEntry; onDelete: () => void }) {
  const [showHtml, setShowHtml] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const previewHtml = `<!DOCTYPE html><html class="dark"><head><script src="https://unpkg.com/@tailwindcss/browser@4"><\/script><style>*{box-sizing:border-box}html,body{margin:0;font-family:Inter,sans-serif;min-width:1024px}</style></head><body>${block.html}</body></html>`

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Preview thumbnail */}
      {showPreview && (
        <div className="bg-gray-50 border-b border-gray-200 overflow-hidden">
          <iframe
            srcDoc={previewHtml}
            className="w-full pointer-events-none block"
            style={{ height: 320, border: 'none' }}
            sandbox="allow-scripts"
            title="Block preview"
          />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs font-mono">{block.id.slice(0, 8)}</Badge>
              {block.tags.map((t) => (
                <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1.5 truncate">{block.source}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              title={showPreview ? 'Hide preview' : 'Show preview'}
            >
              {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setShowHtml(!showHtml)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              title={showHtml ? 'Hide HTML' : 'Show HTML'}
            >
              <Code2 className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Delete block"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="text-xs text-gray-500">
          <span className="font-medium">{block.html.length.toLocaleString()}</span> chars HTML
        </div>

        {showHtml && (
          <div className="mt-3 bg-gray-900 rounded-lg p-3 overflow-auto max-h-48">
            <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap break-all leading-5">
              {block.html.slice(0, 800)}{block.html.length > 800 ? '\n…' : ''}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

function CategorySection({
  category,
  data,
  onDelete,
  onDeleteAll,
}: {
  category: string
  data: CategoryData
  onDelete: (id: string) => void
  onDeleteAll: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const meta = CATEGORY_META[category]
  const isEmpty = data.count === 0

  return (
    <div className={`border rounded-2xl overflow-hidden transition-all ${isEmpty ? 'border-gray-200 opacity-60' : 'border-gray-200 shadow-sm'}`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg border ${meta.color}`}>
            {meta.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 capitalize">{category}</span>
              <Badge
                className={`text-xs font-bold ${isEmpty ? 'bg-gray-100 text-gray-400' : 'bg-indigo-100 text-indigo-700'}`}
                variant="secondary"
              >
                {data.count} blocks
              </Badge>
              {!isEmpty && (
                <Badge variant="outline" className="text-xs text-gray-500">
                  {data.sizeKb} KB
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{meta.desc}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            {isEmpty ? (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <AlertCircle className="w-3.5 h-3.5" /> Empty
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" /> Ready
              </span>
            )}
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {/* Storage path */}
      <div className="px-5 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
          <FileJson className="w-3.5 h-3.5 text-indigo-400" />
          <span>data/blocks/<span className="text-indigo-600 font-semibold">{category}.json</span></span>
        </div>
        {!isEmpty && (
          <button
            onClick={(e) => { e.stopPropagation(); onDeleteAll() }}
            className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-3 h-3" /> Clear all
          </button>
        )}
      </div>

      {/* Blocks */}
      {expanded && (
        <div className="p-4 bg-gray-50 border-t border-gray-100">
          {isEmpty ? (
            <div className="text-center py-8 text-gray-400">
              <Database className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">No blocks scraped yet</p>
              <p className="text-xs mt-1">Run <code className="bg-gray-200 px-1.5 py-0.5 rounded text-gray-600">npm run scrape</code> to populate</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {data.examples.map((block) => (
                <BlockCard
                  key={block.id}
                  block={block}
                  onDelete={() => onDelete(block.id)}
                />
              ))}
              {data.count > 5 && (
                <div className="md:col-span-2 text-center py-3 text-sm text-gray-400 border border-dashed border-gray-300 rounded-xl">
                  + {data.count - 5} more blocks in <code className="bg-gray-100 px-1.5 py-0.5 rounded">data/blocks/{category}.json</code>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface ScrapeFingerprint {
  url: string
  scraped_at: string
  paradigm_detected: string
  confidence: number
  colors: { primary: string; background: string; text: string; accent: string }
  typography: { heading_font: string; body_font: string; heading_weight: string }
  decoration: Record<string, boolean>
  surprises: Array<{ observation: string; category: string; confidence: number; reusability: string }>
}

// ── Extracted section card ────────────────────────────────────────────────────
function ExtractedSectionCard({
  section,
  onSaveToDict,
  onVary,
  onAddToExamples,
}: {
  section: ExtractedSection
  onSaveToDict: (s: ExtractedSection, variantHtml?: string) => void
  onVary: (s: ExtractedSection) => void
  onAddToExamples: (s: ExtractedSection) => void
}) {
  const [showPreview, setShowPreview] = useState(true)
  const [showHtml, setShowHtml] = useState(false)
  const [variations, setVariations] = useState<string[]>([])
  const [varyInstruction, setVaryInstruction] = useState('')
  const [varying, setVarying] = useState(false)
  const [showVaryPanel, setShowVaryPanel] = useState(false)

  const previewHtml = `<!DOCTYPE html><html class="dark"><head><script src="https://unpkg.com/@tailwindcss/browser@4"><\/script><style>*{box-sizing:border-box}html,body{margin:0;font-family:Inter,sans-serif;min-width:1024px}</style></head><body>${section.html}</body></html>`

  const PARADIGM_COLORS: Record<string, string> = {
    'bold-expressive': 'bg-violet-100 text-violet-700',
    'minimal-clean': 'bg-gray-100 text-gray-600',
    'tech-dark': 'bg-emerald-100 text-emerald-700',
    'luxury-editorial': 'bg-amber-100 text-amber-700',
    'bento-grid': 'bg-blue-100 text-blue-700',
    'brutalist': 'bg-red-100 text-red-700',
  }

  async function handleVary() {
    if (!varyInstruction.trim()) return
    setVarying(true)
    try {
      const res = await fetch('/api/v2/vary-snippet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: section.html, instruction: varyInstruction, count: 2 }),
      })
      const json = await res.json()
      setVariations(json.variations ?? [])
      toast.success(`Generated ${json.variations?.length ?? 0} variations`)
    } catch {
      toast.error('Variation failed')
    } finally {
      setVarying(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Live preview */}
      {showPreview && (
        <div className="bg-gray-100 border-b border-gray-200 overflow-hidden">
          <iframe
            srcDoc={previewHtml}
            className="w-full pointer-events-none block"
            style={{ height: 480, border: 'none' }}
            sandbox="allow-scripts"
          />
        </div>
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold capitalize">{section.sectionType}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PARADIGM_COLORS[section.paradigm_hint] ?? 'bg-gray-100 text-gray-600'}`}>
                {section.paradigm_hint}
              </span>
              <span className="text-[10px] text-gray-400">{Math.round(section.confidence * 100)}% confidence</span>
            </div>
            <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">{section.description}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {section.tags.map(t => (
                <span key={t} className="text-[10px] bg-gray-50 border border-gray-200 text-gray-500 px-1.5 py-0.5 rounded">{t}</span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => setShowPreview(!showPreview)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" title="Toggle preview">
              {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
            <button onClick={() => setShowHtml(!showHtml)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" title="View HTML">
              <Code2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {showHtml && (
          <div className="mb-3 bg-gray-900 rounded-lg p-3 overflow-auto max-h-40">
            <pre className="text-[10px] text-green-400 font-mono whitespace-pre-wrap break-all">{section.html.slice(0, 600)}{section.html.length > 600 ? '\n…' : ''}</pre>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-gray-100 flex-wrap">
          <button
            onClick={() => onSaveToDict(section)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            <Save className="w-3 h-3" /> Save to Dictionary
          </button>
          <button
            onClick={() => onAddToExamples(section)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition-colors"
          >
            <Plus className="w-3 h-3" /> Add to Examples
          </button>
          <button
            onClick={() => setShowVaryPanel(!showVaryPanel)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-lg transition-colors"
          >
            <Wand2 className="w-3 h-3" /> Variations
          </button>
        </div>

        {/* Variation generator */}
        {showVaryPanel && (
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Generate variations on the fly</p>
            <div className="flex gap-2">
              <input
                value={varyInstruction}
                onChange={e => setVaryInstruction(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleVary()}
                placeholder="e.g. dark background version, centered layout, minimal no-decoration"
                className="flex-1 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-300"
              />
              <button
                onClick={handleVary}
                disabled={varying || !varyInstruction.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-violet-600 hover:bg-violet-700 text-white rounded-lg disabled:opacity-50 transition-colors"
              >
                {varying ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                {varying ? 'Generating…' : 'Generate'}
              </button>
            </div>

            {/* Variation results */}
            {variations.map((html, i) => (
              <div key={i} className="border border-violet-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-3 py-1.5 bg-violet-50">
                  <span className="text-[10px] font-semibold text-violet-700">Variation {i + 1}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => onSaveToDict({ ...section, html, description: section.description + ` (variation ${i + 1}: ${varyInstruction})` })}
                      className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                      <Save className="w-2.5 h-2.5" /> Save
                    </button>
                  </div>
                </div>
                <div className="overflow-hidden bg-gray-100">
                  <iframe
                    srcDoc={`<!DOCTYPE html><html class="dark"><head><script src="https://unpkg.com/@tailwindcss/browser@4"><\/script><style>*{box-sizing:border-box}body{margin:0}</style></head><body>${html}</body></html>`}
                    className="w-full pointer-events-none block"
                    style={{ height: 320, border: 'none' }}
                    sandbox="allow-scripts"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ScraperPage() {
  const [data, setData] = useState<BlocksData>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [scraping, setScraping] = useState(false)

  // v2 fingerprint state
  const [v2Url, setV2Url] = useState('')
  const [v2Scraping, setV2Scraping] = useState(false)
  const [v2Fingerprint, setV2Fingerprint] = useState<ScrapeFingerprint | null>(null)
  const [v2Error, setV2Error] = useState('')

  // Extract snippets state
  const [extractUrl, setExtractUrl] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [extractedSections, setExtractedSections] = useState<ExtractedSection[]>([])
  const [extractError, setExtractError] = useState('')
  const [dictionaries, setDictionaries] = useState<Array<{ id: string; label?: string; paradigm: string }>>([])  
  const [savingTo, setSavingTo] = useState<string | null>(null)

  // Manual HTML import state
  const [manualHtml, setManualHtml] = useState('')
  const [manualName, setManualName] = useState('')
  const [manualDesc, setManualDesc] = useState('')
  const [manualSectionType, setManualSectionType] = useState('hero')
  const [manualParadigm, setManualParadigm] = useState('bold-expressive')
  const [manualTags, setManualTags] = useState('')
  const [manualDictId, setManualDictId] = useState('')
  const [manualSaving, setManualSaving] = useState(false)
  const [manualPreviewKey, setManualPreviewKey] = useState(0)
  const [manualPreviewHeight, setManualPreviewHeight] = useState(300)

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (e.data?.type === 'iframeHeight') setManualPreviewHeight(Math.max(200, e.data.h + 16))
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [])

  async function handleV2Scrape() {
    if (!v2Url.startsWith('http')) return
    setV2Scraping(true)
    setV2Error('')
    setV2Fingerprint(null)
    try {
      const res = await fetch('/api/v2/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: v2Url }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
      setV2Fingerprint(json.fingerprint)
      toast.success(`Fingerprint: ${json.fingerprint.paradigm_detected} (${Math.round(json.fingerprint.confidence * 100)}% confidence)`)
    } catch (err) {
      setV2Error(String(err))
      toast.error('Scraping failed')
    } finally {
      setV2Scraping(false)
    }
  }

  async function handleExtract() {
    if (!extractUrl.startsWith('http')) return
    setExtracting(true)
    setExtractError('')
    setExtractedSections([])
    try {
      const res = await fetch('/api/v2/extract-sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: extractUrl }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
      setExtractedSections(json.sections ?? [])
      toast.success(`Extracted ${json.sections?.length ?? 0} sections from ${json.total_raw} raw blocks`)
    } catch (err) {
      setExtractError(String(err))
      toast.error('Extraction failed')
    } finally {
      setExtracting(false)
    }
  }

  async function handleSaveToDict(section: ExtractedSection, targetDictId?: string) {
    // Load dictionaries if not yet loaded, then show picker
    let dicts = dictionaries
    if (!dicts.length) {
      try {
        const res = await fetch('/api/style-dictionary?list=1')
        const all = await res.json()
        dicts = (Array.isArray(all) ? all : []).map((d: { id: string; label?: string; paradigm: string }) => ({ id: d.id, label: d.label, paradigm: d.paradigm }))
        setDictionaries(dicts)
      } catch { toast.error('Could not load dictionaries'); return }
    }

    // Pick target dictionary — prefer paradigm match or first
    const dictId = targetDictId ?? dicts.find(d => d.paradigm === section.paradigm_hint)?.id ?? dicts[0]?.id
    if (!dictId) { toast.error('No dictionaries found'); return }

    setSavingTo(section.id)
    try {
      // Load the target dictionary
      const res = await fetch(`/api/style-dictionary?ref=${dictId}`)
      if (!res.ok) throw new Error('Could not load dictionary')
      const dict = await res.json()

      // Build variant name from section type + source domain
      const domain = new URL(section.source_url).hostname.replace('www.', '')
      const variantName = `${section.sectionType}-${domain}`

      // Add the new variant to the card slot (or hero/section slot based on type)
      const slotKey = ['hero', 'features', 'testimonials', 'stats', 'pricing', 'faq', 'cta', 'footer', 'navbar'].includes(section.sectionType)
        ? section.sectionType
        : 'card'
      const existingVariants = dict.variants?.[slotKey] ?? []
      const newVariant = {
        name: variantName,
        description: section.description,
        html: section.html,
        tags: [...section.tags, section.sectionType, section.paradigm_hint],
        preview_note: `Scraped from ${section.source_url}`,
      }

      const updatedDict = {
        ...dict,
        variants: { ...(dict.variants ?? {}), [slotKey]: [...existingVariants, newVariant] },
      }

      await fetch('/api/style-dictionary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref: dictId, dict: updatedDict }),
      })
      toast.success(`Saved to "${dict.label ?? dictId}" → ${slotKey} variants`)
    } catch (err) {
      toast.error(`Save failed: ${String(err)}`)
    } finally {
      setSavingTo(null)
    }
  }

  function handleAddToExamples(section: ExtractedSection) {
    const validCategories = ['bento', 'hero', 'features', 'stats', 'cta'] as const
    type ExampleCategory = typeof validCategories[number]
    const categoryMap: Record<string, ExampleCategory> = {
      hero: 'hero', features: 'features', stats: 'stats', cta: 'cta',
      pricing: 'cta', faq: 'features', testimonials: 'features',
      navbar: 'hero', footer: 'hero', about: 'hero', other: 'hero',
    }
    const category: ExampleCategory = section.tags.includes('bento')
      ? 'bento'
      : (categoryMap[section.sectionType] ?? 'hero')

    const label = section.description.slice(0, 60) || `${section.sectionType} from ${new URL(section.source_url).hostname}`

    const newExample = { id: section.id, label, category, html: section.html }

    // Save to localStorage so /vary page can pick it up
    try {
      const existing = JSON.parse(localStorage.getItem('vary-examples') ?? '[]')
      const deduped = existing.filter((e: { id: string }) => e.id !== section.id)
      localStorage.setItem('vary-examples', JSON.stringify([...deduped, newExample]))
      toast.success(`Added "${label.slice(0, 40)}" to /vary examples`)
    } catch {
      toast.error('Could not save to examples')
    }
  }

  async function handleManualSave() {
    if (!manualHtml.trim()) return toast.error('Paste HTML first')
    if (!manualName.trim()) return toast.error('Enter a variant name')

    let dicts = dictionaries
    if (!dicts.length) {
      try {
        const res = await fetch('/api/style-dictionary?list=1')
        const all = await res.json()
        dicts = (Array.isArray(all) ? all : []).map((d: { id: string; label?: string; paradigm: string }) => ({ id: d.id, label: d.label, paradigm: d.paradigm }))
        setDictionaries(dicts)
      } catch { toast.error('Could not load dictionaries'); return }
    }

    const dictId = manualDictId || dicts.find(d => d.paradigm === manualParadigm)?.id || dicts[0]?.id
    if (!dictId) return toast.error('No dictionary found')

    setManualSaving(true)
    try {
      const res = await fetch(`/api/style-dictionary?ref=${dictId}`)
      const dict = await res.json()
      const slot = manualSectionType
      const tags = manualTags.split(',').map(t => t.trim()).filter(Boolean)
      const newVariant = {
        name: manualName.trim(),
        description: manualDesc.trim() || `${manualSectionType} — ${manualParadigm}`,
        html: manualHtml.trim(),
        tags: [...tags, manualSectionType, manualParadigm],
        preview_note: 'Manually added',
      }
      const updatedDict = {
        ...dict,
        variants: { ...(dict.variants ?? {}), [slot]: [...(dict.variants?.[slot] ?? []), newVariant] },
      }
      await fetch('/api/style-dictionary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref: dictId, dict: updatedDict }),
      })
      toast.success(`Saved "${manualName}" → ${dictId}/${slot}`)
      setManualHtml('')
      setManualName('')
      setManualDesc('')
      setManualTags('')
    } catch (err) {
      toast.error(`Save failed: ${String(err)}`)
    } finally {
      setManualSaving(false)
    }
  }

  const totalBlocks = Object.values(data).reduce((sum, d) => sum + d.count, 0)
  const totalKb = Object.values(data).reduce((sum, d) => sum + d.sizeKb, 0)
  const categoriesWithData = Object.values(data).filter((d) => d.count > 0).length

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/blocks')
      setData(await res.json())
    } catch {
      toast.error('Failed to load block data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleDelete(category: string, id: string) {
    await fetch(`/api/blocks?category=${category}&id=${id}`, { method: 'DELETE' })
    toast.success('Block deleted')
    fetchData()
  }

  async function handleDeleteAll(category: string) {
    if (!confirm(`Clear all ${category} blocks?`)) return
    await fetch(`/api/blocks?category=${category}`, { method: 'DELETE' })
    toast.success(`Cleared all ${category} blocks`)
    fetchData()
  }

  async function handleExportAll() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'all-blocks.json'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Exported all blocks')
  }

  const filteredCategories = CATEGORIES.filter((c) =>
    c.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <PageTopbar
        title="Block Library"
        right={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchData} className="text-xs gap-1.5">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportAll} className="text-xs gap-1.5">
              <Download className="w-3.5 h-3.5" /> Export All
            </Button>
            <Link href="/builder">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5">
                <Zap className="w-3.5 h-3.5" /> Open Builder
              </Button>
            </Link>
          </div>
        }
      />

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Blocks', value: totalBlocks, icon: <Layers className="w-5 h-5" />, color: 'text-indigo-600' },
            { label: 'Categories', value: `${categoriesWithData} / ${CATEGORIES.length}`, icon: <Database className="w-5 h-5" />, color: 'text-violet-600' },
            { label: 'Storage Size', value: `${Math.round(totalKb * 10) / 10} KB`, icon: <FileJson className="w-5 h-5" />, color: 'text-blue-600' },
            { label: 'Data Format', value: 'JSON', icon: <Code2 className="w-5 h-5" />, color: 'text-emerald-600' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className={`${stat.color} mb-3`}>{stat.icon}</div>
              <div className="text-2xl font-black text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-0.5 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* v2: Site Fingerprint Scraper */}
        <div className="bg-white rounded-2xl border border-indigo-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-indigo-100 flex items-center gap-2 bg-indigo-50">
            <Globe2 className="w-4 h-4 text-indigo-600" />
            <h2 className="font-bold text-gray-900">v2 Site Fingerprint</h2>
            <Badge className="text-xs bg-indigo-100 text-indigo-700 border-indigo-200 ml-1">GPT-4o Vision</Badge>
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-500 mb-4">
              Scrape any live website → extract design fingerprint → auto-ingest into Discovery queue.
            </p>
            <div className="flex gap-3">
              <Input
                value={v2Url}
                onChange={(e) => setV2Url(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleV2Scrape() }}
                placeholder="https://vercel.com"
                className="flex-1 text-sm font-mono"
              />
              <Button
                onClick={handleV2Scrape}
                disabled={v2Scraping || !v2Url.startsWith('http')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 min-w-[140px]"
              >
                {v2Scraping
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Analysing…</>
                  : <><Globe2 className="w-4 h-4" /> Fingerprint</>
                }
              </Button>
            </div>

            {v2Error && (
              <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {v2Error}
              </div>
            )}

            {v2Fingerprint && (
              <div className="mt-5 space-y-4">
                {/* Header */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm font-semibold text-gray-700">
                    {v2Fingerprint.url}
                  </span>
                  <Badge className="bg-indigo-600 text-white text-xs">{v2Fingerprint.paradigm_detected}</Badge>
                  <Badge variant="outline" className="text-xs">{Math.round(v2Fingerprint.confidence * 100)}% confidence</Badge>
                </div>

                {/* Tokens */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(v2Fingerprint.colors).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                      <div className="w-5 h-5 rounded border border-gray-300 flex-shrink-0" style={{ backgroundColor: v }} />
                      <div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-wide">{k}</div>
                        <div className="text-xs font-mono text-gray-700">{v}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Typography */}
                <div className="flex gap-4 text-xs text-gray-600 bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
                  <span><span className="text-gray-400">Heading: </span><strong>{v2Fingerprint.typography.heading_font}</strong></span>
                  <span><span className="text-gray-400">Body: </span><strong>{v2Fingerprint.typography.body_font}</strong></span>
                  <span><span className="text-gray-400">Weight: </span><strong>{v2Fingerprint.typography.heading_weight}</strong></span>
                </div>

                {/* Detected patterns */}
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Detected Patterns</div>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(v2Fingerprint.decoration)
                      .filter(([, val]) => val === true)
                      .map(([key]) => (
                        <span key={key} className="text-[11px] bg-violet-50 text-violet-700 border border-violet-200 px-2 py-0.5 rounded-full font-medium">
                          {key.replace(/^has_/, '').replace(/_/g, ' ')}
                        </span>
                      ))
                    }
                  </div>
                </div>

                {/* Surprises */}
                {v2Fingerprint.surprises.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Design Surprises → Discovery Queue</div>
                    <div className="space-y-2">
                      {v2Fingerprint.surprises.map((s, i) => (
                        <div key={i} className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-700">{s.observation}</p>
                            <div className="flex gap-2 mt-1">
                              <span className="text-[10px] text-amber-600">{s.category}</span>
                              <span className="text-[10px] text-gray-400">{Math.round(s.confidence * 100)}%</span>
                              <span className="text-[10px] text-gray-400">{s.reusability}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Manual HTML Import panel ── */}
        <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-emerald-100 flex items-center gap-2 bg-emerald-50">
            <Plus className="w-4 h-4 text-emerald-600" />
            <h2 className="font-bold text-gray-900">Add HTML Manually</h2>
            <Badge className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200 ml-1">Direct import</Badge>
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-500 mb-5">
              Paste any HTML snippet, classify it, and save it directly to a style dictionary as a named variant.
            </p>

            <div className="space-y-4">
              {/* Full-width: HTML textarea */}
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">HTML Snippet</label>
                <textarea
                  value={manualHtml}
                  onChange={e => { setManualHtml(e.target.value); setTimeout(() => setManualPreviewKey(k => k + 1), 800) }}
                  placeholder={`<section class="py-16 bg-white">...</section>`}
                  rows={8}
                  className="w-full text-xs font-mono border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-y bg-gray-50"
                />
              </div>

              {/* Full-width: Live preview */}
              {manualHtml && (
                <div>
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Live preview</div>
                  <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                    <iframe
                      key={manualPreviewKey}
                      srcDoc={[
                        '<!DOCTYPE html><html class="dark"><head>',
                        '<script src="https://unpkg.com/@tailwindcss/browser@4"></s' + 'cript>',
                        '<style>*{box-sizing:border-box}html,body{margin:0;font-family:Inter,sans-serif;min-width:1024px}</style>',
                        '</head><body>',
                        manualHtml,
                        '<scr' + 'ipt>window.addEventListener("load",()=>setTimeout(()=>window.parent.postMessage({type:"iframeHeight",h:document.body.scrollHeight},"*"),300))</scr' + 'ipt>',
                        '</body></html>',
                      ].join('')}
                      className="w-full block"
                      style={{ border: 'none', height: manualPreviewHeight }}
                      sandbox="allow-scripts"
                    />
                  </div>
                </div>
              )}

              {/* Save fields — horizontal grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 border-t border-gray-100">
                <div className="lg:col-span-1">
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Variant Name <span className="text-red-400">*</span></label>
                  <input
                    value={manualName}
                    onChange={e => setManualName(e.target.value)}
                    placeholder="hero-split-dark"
                    className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300 font-mono"
                  />
                </div>
                <div className="lg:col-span-2">
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Description</label>
                  <input
                    value={manualDesc}
                    onChange={e => setManualDesc(e.target.value)}
                    placeholder="e.g. Split-layout hero with gradient headline"
                    className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Section Type</label>
                  <select value={manualSectionType} onChange={e => setManualSectionType(e.target.value)} className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300">
                    {['hero','features','testimonials','stats','pricing','faq','cta','footer','navbar','about','team','process','logos','contact','card','other'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Paradigm</label>
                  <select value={manualParadigm} onChange={e => setManualParadigm(e.target.value)} className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300">
                    {['bold-expressive','minimal-clean','tech-dark','luxury-editorial','bento-grid','brutalist'].map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Tags</label>
                  <input value={manualTags} onChange={e => setManualTags(e.target.value)} placeholder="dark, split, saas" className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                </div>
              </div>

              {/* Dictionary + save button row */}
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Dictionary</label>
                  {dictionaries.length === 0 ? (
                    <button onClick={async () => {
                      const res = await fetch('/api/style-dictionary?list=1')
                      const all = await res.json()
                      const dicts = (Array.isArray(all) ? all : []).map((d: { id: string; label?: string; paradigm: string }) => ({ id: d.id, label: d.label, paradigm: d.paradigm }))
                      setDictionaries(dicts)
                      if (dicts.length) setManualDictId(dicts.find((d: { paradigm: string }) => d.paradigm === manualParadigm)?.id ?? dicts[0].id)
                    }} className="text-xs text-emerald-600 hover:underline">Load dictionaries</button>
                  ) : (
                    <select value={manualDictId || dictionaries.find(d => d.paradigm === manualParadigm)?.id || dictionaries[0]?.id} onChange={e => setManualDictId(e.target.value)} className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300">
                      {dictionaries.map(d => <option key={d.id} value={d.id}>{d.label ?? d.id}</option>)}
                    </select>
                  )}
                </div>
                <button
                  onClick={handleManualSave}
                  disabled={manualSaving || !manualHtml.trim() || !manualName.trim()}
                  className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-colors whitespace-nowrap"
                >
                  {manualSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {manualSaving ? 'Saving…' : 'Save to Dictionary'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Extract Snippets panel ── */}
        <div className="bg-white rounded-2xl border border-violet-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-violet-100 flex items-center gap-2 bg-violet-50">
            <Scissors className="w-4 h-4 text-violet-600" />
            <h2 className="font-bold text-gray-900">Extract & Classify Sections</h2>
            <Badge className="text-xs bg-violet-100 text-violet-700 border-violet-200 ml-1">GPT-4o + Puppeteer</Badge>
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-500 mb-4">
              Scrape any website → AI extracts individual section blocks, classifies each one (hero / features / testimonials…), assigns paradigm tags → save directly to a Style Dictionary as a named variant.
            </p>

            {/* How it works row */}
            <div className="flex items-center gap-2 text-[11px] text-gray-400 mb-5 flex-wrap">
              {['1. Puppeteer loads the page', '→', '2. JS extracts section HTML blocks', '→', '3. GPT-4o classifies each block', '→', '4. Save to Dictionary as a variant', '→', '5. AI picks the variant on next generate'].map((s, i) => (
                <span key={i} className={s === '→' ? 'text-gray-300' : 'bg-gray-50 border border-gray-200 px-2 py-1 rounded-lg font-medium text-gray-500'}>{s}</span>
              ))}
            </div>

            <div className="flex gap-3">
              <Input
                value={extractUrl}
                onChange={(e) => setExtractUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleExtract() }}
                placeholder="https://linear.app"
                className="flex-1 text-sm font-mono"
              />
              <Button
                onClick={handleExtract}
                disabled={extracting || !extractUrl.startsWith('http')}
                className="bg-violet-600 hover:bg-violet-700 text-white gap-2 min-w-[160px]"
              >
                {extracting
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Extracting…</>
                  : <><Scissors className="w-4 h-4" /> Extract Sections</>
                }
              </Button>
            </div>

            {extractError && (
              <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {extractError}
              </div>
            )}

            {extracting && (
              <div className="mt-6 text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-violet-400 mx-auto mb-3" />
                <p className="text-sm text-gray-500 font-medium">Loading page with Puppeteer…</p>
                <p className="text-xs text-gray-400 mt-1">Extracting sections → classifying with AI. Takes 20–40s.</p>
              </div>
            )}

            {extractedSections.length > 0 && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-800">
                    {extractedSections.length} sections extracted
                    <span className="text-gray-400 font-normal ml-2 text-xs">from {extractUrl}</span>
                  </p>
                  <div className="flex gap-2 text-xs text-gray-500">
                    {Array.from(new Set(extractedSections.map(s => s.sectionType))).map(t => (
                      <span key={t} className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-full font-medium capitalize">{t}</span>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {extractedSections.map(section => (
                    <ExtractedSectionCard
                      key={section.id}
                      section={section}
                      onSaveToDict={(s) => handleSaveToDict(s)}
                      onVary={(s) => {}}
                      onAddToExamples={handleAddToExamples}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Data Flow Section */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" />
            <h2 className="font-bold text-gray-900">How scraped data flows through the application</h2>
          </div>
          <div className="p-6">
            <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
              {DATA_FLOW.map((step, i) => (
                <div key={i} className="relative">
                  {i < DATA_FLOW.length - 1 && (
                    <div className="hidden lg:block absolute top-5 left-full w-full h-0.5 bg-gray-200 z-0" style={{ width: 'calc(100% - 2.5rem)', left: '2.5rem' }} />
                  )}
                  <div className="relative bg-gray-50 rounded-xl p-4 border border-gray-200 h-full">
                    <div className={`w-8 h-8 rounded-full ${step.color} text-white text-xs font-black flex items-center justify-center mb-3`}>
                      {step.step}
                    </div>
                    <div className="font-bold text-sm text-gray-900 mb-1">{step.label}</div>
                    <code className="text-xs text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded block mb-2 truncate">{step.detail}</code>
                    <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* JSON Schema */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Code2 className="w-4 h-4 text-indigo-500" />
            <h2 className="font-bold text-gray-900">Storage schema</h2>
            <Badge variant="outline" className="text-xs font-mono ml-auto">data/blocks/*.json</Badge>
          </div>
          <div className="p-6 grid md:grid-cols-2 gap-6">
            {/* Schema */}
            <div>
              <div className="bg-gray-900 rounded-xl p-5 font-mono text-sm">
                <div className="text-gray-400 text-xs mb-3 uppercase tracking-wider">TailwindExample (TypeScript)</div>
                <pre className="text-green-400 leading-7 text-xs">{`interface TailwindExample {
  id:       string   // nanoid unique key
  category: string   // "hero" | "features" | ...
  source:   string   // URL scraped from
  html:     string   // raw Tailwind HTML
  tags:     string[] // ["dark","grid","card"]
}`}</pre>
              </div>
            </div>
            {/* Example JSON */}
            <div>
              <div className="bg-gray-900 rounded-xl p-5 font-mono text-sm">
                <div className="text-gray-400 text-xs mb-3 uppercase tracking-wider">Example entry (data/blocks/hero.json)</div>
                <pre className="text-amber-300 leading-6 text-xs overflow-auto">{`[
  {
    "id": "abc123xyz",
    "category": "hero",
    "source": "https://tailwindui.com/...",
    "html": "<section class=\\"bg-white\\">\\n  <div class=\\"max-w-7xl mx-auto\\">...",
    "tags": ["hero", "light", "centered"]
  }
]`}</pre>
              </div>
            </div>
          </div>
        </div>

        {/* Block Library */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-xl text-gray-900">Block Library</h2>
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter categories..."
                className="pl-9 text-sm"
              />
            </div>
          </div>

          {/* Scrape instruction */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-5 py-4 mb-5 flex items-start gap-3">
            <Upload className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-indigo-900">Populate the library by running the scraper</p>
              <p className="text-sm text-indigo-700 mt-0.5">
                From the <code className="bg-indigo-100 px-1.5 py-0.5 rounded font-mono text-indigo-800">builder-app</code> directory, run:
              </p>
              <code className="mt-2 inline-block bg-indigo-900 text-indigo-100 px-4 py-2 rounded-lg text-sm font-mono">npm run scrape</code>
              <p className="text-xs text-indigo-500 mt-2">
                Scrapes Tailwind UI preview pages via Puppeteer → saves HTML blocks as JSON → used as AI prompt context
              </p>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-3">
              {CATEGORIES.map((c) => (
                <div key={c} className="h-16 bg-white rounded-2xl border border-gray-200 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCategories.map((category) => (
                <CategorySection
                  key={category}
                  category={category}
                  data={data[category] ?? { count: 0, sizeKb: 0, examples: [] }}
                  onDelete={(id) => handleDelete(category, id)}
                  onDeleteAll={() => handleDeleteAll(category)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
