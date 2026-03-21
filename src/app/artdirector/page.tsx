'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Play, Copy, Check, Loader2, AlertCircle } from 'lucide-react'

const INDUSTRIES = [
  'software',
  'construction',
  'consulting',
  'coaching',
  'real-estate',
  'healthcare',
  'manufacturing',
]

const PARADIGMS = [
  'brutal',
  'bold-expressive',
  'minimal-clean',
  'luxury-editorial',
  'tech-dark',
]

const STRUCTURE_PRESETS = [
  'bento-3col',
  'split-50',
  'centered',
  'editorial',
  'magazine-grid',
] as const
type StructurePreset = typeof STRUCTURE_PRESETS[number]

const MODELS = [
  { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5 (fast, cheap)' },
  { id: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5 (creative)' },
  { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6 (latest)' },
  { id: 'gpt-4o-mini', label: 'GPT-4o mini (fast, cheap)' },
  { id: 'gpt-5.4-nano', label: 'GPT-5.4 nano (fastest)' },
  { id: 'gpt-5.4-mini-2026-03-17', label: 'GPT-5.4 mini' },
]

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
      className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors px-2 py-1 rounded hover:bg-gray-100"
    >
      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

export default function ArtDirectorPage() {
  const [sectionType, setSectionType] = useState('hero')
  const [industry, setIndustry] = useState('construction')
  const [paradigm, setParadigm] = useState('bold-expressive')
  const [usp, setUsp] = useState('Baumanagement, das Projekte termingerecht und kostenstabil ins Ziel bringt.')
  const [language, setLanguage] = useState<'de' | 'en'>('de')
  const [artDirectorModel, setArtDirectorModel] = useState('claude-haiku-4-5')
  const [developerModel, setDeveloperModel] = useState('gpt-4o-mini')
  const [structurePreset, setStructurePreset] = useState<StructurePreset>('bento-3col')

  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')

  const [status, setStatus] = useState('')
  const [concept, setConcept] = useState('')
  const [html, setHtml] = useState('')

  const iframeRef = useRef<HTMLIFrameElement>(null)

  const iframeDoc = useMemo(() => {
    const tailwind = '<script src="https://cdn.tailwindcss.com"></script>'
    const base = `<style>
      *, *::before, *::after { box-sizing: border-box; }
      :root {
        --color-background: #0b0f14;
        --color-surface: #111827;
        --color-primary: #111827;
        --color-accent: #7c3aed;
        --color-text: #e5e7eb;
      }
      body { margin: 0; background: var(--color-background); color: var(--color-text); font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; }
    </style>`
    return `<!doctype html><html><head>${base}${tailwind}</head><body>${html}</body></html>`
  }, [html])

  useEffect(() => {
    if (!iframeRef.current) return
    const doc = iframeRef.current.contentDocument
    if (!doc) return
    doc.open()
    doc.write(iframeDoc)
    doc.close()
  }, [iframeDoc])

  async function runChain() {
    if (running) return
    setRunning(true)
    setError('')
    setStatus('')
    setConcept('')
    setHtml('')

    try {
      const res = await fetch('/api/v2/artdirector', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artDirectorModel,
          developerModel,
          sectionType,
          industry,
          paradigm,
          usp,
          structurePreset,
          language,
        }),
      })

      if (!res.ok || !res.body) {
        const t = await res.text().catch(() => '')
        throw new Error(`HTTP ${res.status}${t ? `: ${t.slice(0, 200)}` : ''}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6)
          try {
            const evt = JSON.parse(payload)
            if (evt.type === 'status') setStatus(String(evt.message ?? ''))
            if (evt.type === 'concept_delta') setConcept((p) => p + String(evt.text ?? ''))
            if (evt.type === 'html_delta') setHtml((p) => p + String(evt.text ?? ''))
            if (evt.type === 'error') setError(String(evt.message ?? 'Unknown error'))
            if (evt.type === 'complete') {
              if (evt.concept) setConcept(String(evt.concept))
              if (evt.html) setHtml(String(evt.html))
            }
          } catch {
            continue
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/builder" className="text-gray-400 hover:text-gray-700 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <span className="font-semibold text-gray-900 text-sm">Art Director Chain</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={runChain}
            disabled={running}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-40 transition-colors font-semibold"
          >
            {running
              ? <><Loader2 className="w-3 h-3 animate-spin" /> Running…</>
              : <><Play className="w-3 h-3" /> Run</>
            }
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3 lg:col-span-2">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Inputs</div>

          <label className="text-xs text-gray-600">Art Director Model</label>
          <select value={artDirectorModel} onChange={(e) => setArtDirectorModel(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            {MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>

          <label className="text-xs text-gray-600">Developer Model</label>
          <select value={developerModel} onChange={(e) => setDeveloperModel(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            {MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>

          <label className="text-xs text-gray-600">Section</label>
          <input value={sectionType} onChange={(e) => setSectionType(e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />

          <label className="text-xs text-gray-600">Industry</label>
          <select value={industry} onChange={(e) => setIndustry(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
          </select>

          <label className="text-xs text-gray-600">Paradigm</label>
          <select value={paradigm} onChange={(e) => setParadigm(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            {PARADIGMS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          <label className="text-xs text-gray-600">Language</label>
          <select value={language} onChange={(e) => setLanguage(e.target.value as any)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="de">de</option>
            <option value="en">en</option>
          </select>

          <label className="text-xs text-gray-600">Structure preset</label>
          <select value={structurePreset} onChange={(e) => setStructurePreset(e.target.value as StructurePreset)} className="px-3 py-2 border rounded-lg text-sm">
            {STRUCTURE_PRESETS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          <label className="text-xs text-gray-600">USP</label>
          <textarea
            value={usp}
            onChange={(e) => setUsp(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm min-h-28"
          />

          {status && (
            <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              {status}
            </div>
          )}

          {error && (
            <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span className="break-words">{error}</span>
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col lg:col-span-3">
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Creative Direction</span>
            <CopyButton text={concept} />
          </div>
          <pre className="flex-1 overflow-auto font-mono text-[11px] leading-relaxed p-3 bg-white text-gray-800 whitespace-pre-wrap">{concept}</pre>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col lg:col-span-7">
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">HTML + Preview</span>
            <CopyButton text={html} />
          </div>
          <div className="h-48 border-b border-gray-200 overflow-auto">
            <pre className="font-mono text-[10px] leading-relaxed p-3 text-gray-700 whitespace-pre-wrap">{html}</pre>
          </div>
          <div className="flex-1 bg-black">
            <iframe
              ref={iframeRef}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin"
              title="Art director preview"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
