'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Play, Copy, Check, Loader2, AlertCircle, Download } from 'lucide-react'

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

export default function ArtDirectorFullPagePage() {
  const [companyName, setCompanyName] = useState('BauPro Management')
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
  const [currentSection, setCurrentSection] = useState('')
  const [vision, setVision] = useState('')
  const [fullPage, setFullPage] = useState('')

  const [rawHtml, setRawHtml] = useState('')

  function openPreview() {
    if (!fullPage) return
    const blob = new Blob([fullPage], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }

  async function runChain() {
    if (running) return
    setRunning(true)
    setError('')
    setStatus('')
    setCurrentSection('')
    setVision('')
    setFullPage('')
    setRawHtml('')

    try {
      const res = await fetch('/api/v2/artdirector-fullpage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artDirectorModel,
          developerModel,
          industry,
          paradigm,
          companyName,
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
            if (evt.type === 'status') {
              setStatus(String(evt.message ?? ''))
              if (evt.section) setCurrentSection(String(evt.section))
            }
            if (evt.type === 'vision_delta') setVision((p) => p + String(evt.text ?? ''))
            if (evt.type === 'vision_complete') setVision(String(evt.vision ?? ''))
            if (evt.type === 'section_complete') {
              setRawHtml((p) => p + '\n' + String(evt.html ?? ''))
            }
            if (evt.type === 'complete') {
              if (evt.fullPage) {
                setFullPage(String(evt.fullPage))
                setRawHtml(String(evt.fullPage))
              }
              if (evt.vision) setVision(String(evt.vision))
            }
            if (evt.type === 'error') setError(String(evt.message ?? 'Unknown error'))
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

  function downloadHTML() {
    if (!fullPage) return
    const blob = new Blob([fullPage], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${companyName.replace(/\s+/g, '-').toLowerCase()}-landing.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/builder" className="text-gray-400 hover:text-gray-700 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <span className="font-semibold text-gray-900 text-sm">Full Page Generator</span>
          <span className="text-xs text-gray-400">Navbar + Hero + Services + Testimonials + Contact + Footer</span>
        </div>
        <div className="flex items-center gap-2">
          {fullPage && (
            <button
              onClick={downloadHTML}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors font-semibold"
            >
              <Download className="w-3 h-3" /> Download HTML
            </button>
          )}
          <button
            onClick={runChain}
            disabled={running}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-40 transition-colors font-semibold"
          >
            {running
              ? <><Loader2 className="w-3 h-3 animate-spin" /> Generating…</>
              : <><Play className="w-3 h-3" /> Generate Page</>
            }
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3 lg:col-span-2">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Inputs</div>

          <label className="text-xs text-gray-600">Company Name</label>
          <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />

          <label className="text-xs text-gray-600">Art Director Model</label>
          <select value={artDirectorModel} onChange={(e) => setArtDirectorModel(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            {MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>

          <label className="text-xs text-gray-600">Developer Model</label>
          <select value={developerModel} onChange={(e) => setDeveloperModel(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            {MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>

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

          <label className="text-xs text-gray-600">Hero Structure</label>
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
              {currentSection && <div className="mt-1 text-violet-600 font-semibold">→ {currentSection}</div>}
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
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Page Vision</span>
            <CopyButton text={vision} />
          </div>
          <pre className="flex-1 overflow-auto font-mono text-[11px] leading-relaxed p-3 bg-white text-gray-800 whitespace-pre-wrap">{vision}</pre>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col lg:col-span-7">
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Full Page Preview</span>
            <div className="flex items-center gap-2">
              {fullPage && <span className="text-xs text-green-600 font-semibold">✓ Complete</span>}
              {fullPage && (
                <button onClick={openPreview} className="text-xs px-2 py-1 rounded bg-violet-600 hover:bg-violet-700 text-white font-semibold">
                  Open in new tab ↗
                </button>
              )}
              <CopyButton text={fullPage || rawHtml} />
            </div>
          </div>
          <div className="bg-gray-950 flex flex-col" style={{ height: '80vh' }}>
            {fullPage ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="text-green-400 text-sm font-semibold">✓ Page generated ({rawHtml.length.toLocaleString()} chars)</div>
                <button onClick={openPreview} className="px-6 py-3 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm">
                  Open Full Preview ↗
                </button>
                <pre className="w-full overflow-auto font-mono text-[10px] p-3 text-green-400 whitespace-pre-wrap" style={{ maxHeight: '60vh' }}>{rawHtml}</pre>
              </div>
            ) : rawHtml ? (
              <pre className="w-full h-full overflow-auto font-mono text-[10px] p-3 text-green-400 whitespace-pre-wrap">{rawHtml}</pre>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-600 text-sm">Generated HTML will appear here</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
