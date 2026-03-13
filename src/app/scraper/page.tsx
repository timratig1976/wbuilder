'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Database, Zap, RefreshCw, Trash2, Code2, Eye, EyeOff,
  ArrowLeft, FileJson, Download, Upload, CheckCircle2,
  AlertCircle, Layers, Search, ChevronDown, ChevronUp, Info
} from 'lucide-react'
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

  const previewHtml = `<!DOCTYPE html><html><head>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>body{font-family:sans-serif}</style>
  </head><body>${block.html}</body></html>`

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Preview thumbnail */}
      {showPreview && (
        <div className="h-48 bg-gray-50 border-b border-gray-200 overflow-hidden">
          <iframe
            srcDoc={previewHtml}
            className="w-full h-full scale-75 origin-top-left pointer-events-none"
            style={{ width: '133%', height: '133%' }}
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
            <div className="grid md:grid-cols-2 gap-4">
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

export default function ScraperPage() {
  const [data, setData] = useState<BlocksData>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [scraping, setScraping] = useState(false)

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
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-sm font-medium transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
            <Separator orientation="vertical" className="h-5" />
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-600" />
              <span className="font-bold text-gray-900">Block Library</span>
              <Badge variant="secondary" className="text-xs">Scraper Dashboard</Badge>
            </div>
          </div>
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
        </div>
      </header>

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
