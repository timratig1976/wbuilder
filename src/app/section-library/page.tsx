'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Wand2, Eye, Save, Trash2, Plus, Tag, Code2, Loader2, Check, X, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

const SECTION_TYPES = ['navbar', 'hero', 'features', 'stats', 'testimonials', 'pricing', 'faq', 'cta', 'footer', 'custom']
const PARADIGMS = ['minimal-clean', 'bold-expressive', 'tech-dark', 'luxury-editorial']
const BEHAVIOUR_TAGS = ['sticky', 'overlay-hero', 'hide-on-scroll', 'static', 'blur', 'transparent', 'solid', 'border']

interface LibraryEntry {
  id: string
  type: string
  paradigm: string
  quality_score: number
  tags: string[]
  industries: string[]
  tone: string[]
  html_path: string
  label?: string
  description?: string
  source?: string
  html: string
}

// ─── Auto-fixer ───────────────────────────────────────────────────────────────
// Converts raw pasted HTML into our system's conventions
function autoFixHtml(raw: string): { html: string; changes: string[] } {
  let html = raw.trim()
  const changes: string[] = []

  // Detect JSX / React component code — not valid for the library
  const isJsx =
    /const\s+\w+\s*=\s*\(.*\)\s*=>/.test(html) ||           // arrow component
    /React\.useState|React\.useEffect|React\.useRef/.test(html) || // React hooks
    /className=\{/.test(html) ||                              // dynamic className
    /\.map\s*\(\s*\(/.test(html) ||                          // .map() JSX
    /return\s*\(\s*</.test(html)                              // return ( <JSX>

  if (isJsx) {
    changes.push('⛔ This looks like React/JSX code, not plain HTML.')
    changes.push('The section library requires vanilla HTML + vanilla JS only.')
    changes.push('Tip: Extract the static HTML structure from the JSX return() block, replace className= → class=, remove {expressions}, convert onClick= to onclick=, and hardcode the nav links as <a> elements.')
    return { html: raw, changes }
  }

  // Maps Tailwind color class → CSS property:value
  const colorMap: Record<string, string> = {
    'text-white':       'color:#fff',
    'text-gray-900':    'color:var(--color-text)',
    'text-gray-700':    'color:var(--color-text)',
    'text-gray-500':    'color:var(--color-text-muted)',
    'text-gray-400':    'color:var(--color-text-muted)',
    'bg-white':         'background-color:var(--color-background)',
    'bg-gray-900':      'background-color:var(--color-dark)',
    'bg-gray-800':      'background-color:var(--color-dark)',
    'bg-indigo-600':    'background-color:var(--color-primary)',
    'bg-indigo-700':    'background-color:var(--color-primary)',
    'bg-violet-600':    'background-color:var(--color-primary)',
    'text-indigo-600':  'color:var(--color-primary)',
    'text-indigo-700':  'color:var(--color-primary)',
  }

  // 1. For every HTML tag, strip matched color classes from class="" and merge into style=""
  let colorCount = 0
  html = html.replace(/<([a-zA-Z][^>]*)>/g, (fullTag, inner) => {
    // Extract class attribute value
    const classMatch = inner.match(/\bclass="([^"]*)"/)
    if (!classMatch) return fullTag

    const classes = classMatch[1].split(/\s+/)
    const extraStyles: string[] = []
    const remainingClasses: string[] = []

    for (const cls of classes) {
      if (colorMap[cls]) {
        extraStyles.push(colorMap[cls])
        colorCount++
      } else {
        remainingClasses.push(cls)
      }
    }

    if (extraStyles.length === 0) return fullTag

    // Rebuild class attribute (remove if empty)
    let newInner = inner.replace(/\bclass="[^"]*"/, remainingClasses.length > 0 ? `class="${remainingClasses.join(' ')}"` : '')

    // Merge into existing style="" or add new one
    const styleMatch = newInner.match(/\bstyle="([^"]*)"/)
    if (styleMatch) {
      const existing = styleMatch[1].replace(/;$/, '')
      newInner = newInner.replace(/\bstyle="[^"]*"/, `style="${existing};${extraStyles.join(';')}"`)
    } else {
      // Insert style after class (or at end of tag)
      newInner = newInner.replace(/(\bclass="[^"]*")/, `$1 style="${extraStyles.join(';')}"`)
      if (!newInner.includes('style=')) newInner += ` style="${extraStyles.join(';')}"`
    }

    return `<${newInner}>`
  })

  if (colorCount > 0) changes.push(`Replaced ${colorCount} hardcoded Tailwind color class(es) → CSS vars`)

  // 2. Fix class-based JS (.menu-btn, .mobile-menu) → ID-based null-safe pattern
  if (html.includes('querySelectorAll') || html.includes('.menu-btn') || html.includes('.mobile-menu')) {
    html = html.replace(
      /<script>[\s\S]*?querySelectorAll[\s\S]*?<\/script>/g,
      `<script>(function(){var b=document.getElementById('nav-toggle');var m=document.getElementById('nav-menu');if(b&&m)b.addEventListener('click',function(){m.classList.toggle('hidden');});})()</script>`
    )
    // Rename class selectors to IDs
    html = html.replace(/class="([^"]*)\bmenu-btn\b([^"]*)"/g, 'id="nav-toggle" class="$1$2"')
    html = html.replace(/class="([^"]*)\bmobile-menu\b([^"]*)"/g, 'id="nav-menu" class="$1$2"')
    changes.push('Converted class-based JS (.menu-btn/.mobile-menu) → ID-based null-safe pattern')
  }

  // 3. Convert onclick with querySelector to null-safe getElementById
  html = html.replace(
    /onclick="document\.querySelector\('([^']+)'\)\.classList\.toggle\('([^']+)'\)"/g,
    (_m, sel, cls) => {
      const id = sel.replace(/^[#.]/, '').replace(/-/g, '-')
      changes.push(`Fixed querySelector onclick → getElementById null-safe`)
      return `onclick="const _m=document.getElementById('${id}');if(_m)_m.classList.toggle('${cls}')"`
    }
  )

  // 4. Flag inline SVG logos (too company-specific) — replace with text placeholder
  const svgLogoMatch = html.match(/<svg[^>]*>[\s\S]{200,}<\/svg>/)
  if (svgLogoMatch) {
    html = html.replace(
      /<a[^>]*>\s*<svg[\s\S]*?<\/svg>\s*<\/a>/,
      `<a href="#" style="color:var(--color-text);font-family:var(--font-heading)" class="font-bold text-lg tracking-tight">{{COMPANY_NAME}}</a>`
    )
    changes.push('Replaced SVG logo → {{COMPANY_NAME}} text placeholder')
  }

  // 5. Replace hardcoded from-*/to-* gradient classes with CSS var equivalent note
  if (/from-\w+-\d+/.test(html)) {
    changes.push('⚠ Gradient classes detected (from-indigo-700 etc.) — consider replacing with var(--color-primary) via inline style')
  }

  // 6. Ensure mobile menu uses hidden class (not display:none style)
  html = html.replace(/style="display:\s*none"/g, () => {
    changes.push('Converted display:none → hidden class')
    return 'class="hidden"'
  })

  return { html, changes }
}

function buildPreviewHtml(html: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<script src="https://cdn.tailwindcss.com"></script>
<style>
  :root {
    --color-primary: #4F46E5;
    --color-secondary: #818CF8;
    --color-accent: #6366F1;
    --color-background: #ffffff;
    --color-surface: #f9fafb;
    --color-dark: #111827;
    --color-text: #111827;
    --color-text-muted: #6B7280;
    --font-heading: Inter, sans-serif;
    --font-body: Inter, sans-serif;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: var(--font-body); background: #f3f4f6; }
</style>
</head>
<body>
${html}
<div style="height:400px;background:linear-gradient(135deg,#e0e7ff,#f3f4f6);display:flex;align-items:center;justify-content:center;color:#9ca3af;font-size:14px;font-family:sans-serif;">
  ↑ Hero section would appear here
</div>
</body>
</html>`
}

export default function SectionLibraryPage() {
  const [entries, setEntries] = useState<LibraryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Editor state
  const [rawHtml, setRawHtml] = useState('')
  const [fixedHtml, setFixedHtml] = useState('')
  const [fixChanges, setFixChanges] = useState<string[]>([])
  const [type, setType] = useState('navbar')
  const [paradigm, setParadigm] = useState('minimal-clean')
  const [qualityScore, setQualityScore] = useState(8)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [label, setLabel] = useState('')
  const [description, setDescription] = useState('')
  const [source, setSource] = useState('')
  const [tab, setTab] = useState<'raw' | 'fixed' | 'preview'>('raw')
  const [saving, setSaving] = useState(false)
  const [isNew, setIsNew] = useState(true)
  const [typeFilter, setTypeFilter] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/section-library')
      .then((r) => r.json())
      .then((d) => { setEntries(d.entries ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function runAutoFix() {
    if (!rawHtml.trim()) return
    const { html, changes } = autoFixHtml(rawHtml)
    const isJsxError = changes.some((c) => c.startsWith('⛔'))
    setFixedHtml(isJsxError ? '' : html)
    setFixChanges(changes)
    setTab('fixed')
    if (isJsxError) toast.error('React/JSX detected — paste plain HTML only')
    else if (changes.length === 0) toast.info('No issues found — HTML looks clean')
    else toast.success(`${changes.length} fix(es) applied`)
  }

  function selectEntry(entry: LibraryEntry) {
    setSelectedId(entry.id)
    setRawHtml(entry.html)
    setFixedHtml(entry.html)
    setFixChanges([])
    setType(entry.type)
    setParadigm(entry.paradigm)
    setQualityScore(entry.quality_score)
    setTags(entry.tags)
    setLabel(entry.label ?? '')
    setDescription(entry.description ?? '')
    setSource(entry.source ?? '')
    setTab('preview')
    setIsNew(false)
  }

  function newEntry() {
    setSelectedId(null)
    setRawHtml('')
    setFixedHtml('')
    setFixChanges([])
    setType(typeFilter ?? 'navbar')
    setParadigm('minimal-clean')
    setQualityScore(8)
    setTags([])
    setLabel('')
    setDescription('')
    setSource('')
    setTab('raw')
    setIsNew(true)
  }

  async function save() {
    const html = fixedHtml || rawHtml
    if (!html.trim()) { toast.error('No HTML to save'); return }
    setSaving(true)
    try {
      const body = {
        id: isNew ? undefined : selectedId ?? undefined,
        type, paradigm, quality_score: qualityScore,
        tags, industries: [], tone: [],
        label, description, source, html,
      }
      const res = await fetch('/api/section-library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      toast.success('Saved to section library!')
      // Refresh list
      const listRes = await fetch('/api/section-library')
      const listData = await listRes.json()
      setEntries(listData.entries ?? [])
      setSelectedId(data.id)
      setIsNew(false)
    } catch {
      toast.error('Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function deleteEntry(id: string) {
    if (!confirm('Delete this entry?')) return
    await fetch('/api/section-library', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setEntries((e) => e.filter((x) => x.id !== id))
    if (selectedId === id) newEntry()
    toast.success('Deleted')
  }

  function addTag(t: string) {
    const cleaned = t.trim().toLowerCase()
    if (cleaned && !tags.includes(cleaned)) setTags([...tags, cleaned])
    setTagInput('')
  }

  const filteredEntries = typeFilter ? entries.filter((e) => e.type === typeFilter) : entries
  const countByType = SECTION_TYPES.reduce<Record<string, number>>((acc, t) => {
    acc[t] = entries.filter((e) => e.type === t).length
    return acc
  }, {})
  const previewHtml = buildPreviewHtml(fixedHtml || rawHtml)

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* Topbar */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/builder">
            <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </Link>
          <div className="w-px h-5 bg-gray-200" />
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-violet-500" />
            <span className="font-bold text-gray-900">Section Library</span>
            <span className="text-xs text-gray-400 ml-1">— reference HTML for AI generation</span>
          </div>
        </div>
        <button
          onClick={newEntry}
          className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Example
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: entry list */}
        <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
          {/* Type filter strip */}
          <div className="border-b border-gray-100 px-2 py-2 flex flex-col gap-0.5">
            <button
              onClick={() => setTypeFilter(null)}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                typeFilter === null ? 'bg-violet-600 text-white' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <span>All types</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                typeFilter === null ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'
              }`}>{entries.length}</span>
            </button>
            {SECTION_TYPES.filter((t) => t !== 'custom' || countByType['custom'] > 0).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(typeFilter === t ? null : t)}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  typeFilter === t ? 'bg-violet-600 text-white' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span>{t}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  typeFilter === t ? 'bg-white/20 text-white' : countByType[t] > 0 ? 'bg-violet-100 text-violet-600' : 'bg-gray-100 text-gray-300'
                }`}>{countByType[t] ?? 0}</span>
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Code2 className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-xs text-gray-400">
                  {typeFilter && entries.length > 0
                    ? <>No <strong>{typeFilter}</strong> examples yet.<br />Click Add Example to add one.</>  
                    : <>No examples yet.<br />Click Add Example to paste one.</> 
                  }
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredEntries.map((entry) => (
                  <div
                    key={entry.id}
                    onClick={() => selectEntry(entry)}
                    className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${selectedId === entry.id ? 'bg-violet-50 border-l-2 border-violet-500' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{entry.label || entry.id}</p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {!typeFilter && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700">{entry.type}</span>}
                          {entry.tags.slice(0, 2).map((t) => (
                            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">{t}</span>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteEntry(entry.id) }}
                        className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Right: editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="bg-white border-b border-gray-200 px-6 flex items-center gap-1 h-11 flex-shrink-0">
            {(['raw', 'fixed', 'preview'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-violet-100 text-violet-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
              >
                {t === 'raw' && '📋 Raw paste'}
                {t === 'fixed' && (
                  fixChanges.some((c) => c.startsWith('⛔'))
                    ? `⛔ Error`
                    : `✨ Auto-fixed${fixChanges.length > 0 ? ` (${fixChanges.length})` : ''}`
                )}
                {t === 'preview' && '👁 Preview'}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={runAutoFix}
                disabled={!rawHtml.trim()}
                className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Wand2 className="w-3.5 h-3.5" /> Auto-Fix
              </button>
              <button
                onClick={save}
                disabled={saving || (!rawHtml.trim() && !fixedHtml.trim())}
                className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save to Library
              </button>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* HTML editor panel */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {tab === 'raw' && (
                <div className="flex-1 flex flex-col p-4 gap-3">
                  <p className="text-xs text-gray-500">Paste raw HTML from PrebuiltUI, Tailwind UI, etc. — then hit Auto-Fix to clean it up.</p>
                  <textarea
                    value={rawHtml}
                    onChange={(e) => setRawHtml(e.target.value)}
                    className="flex-1 text-xs font-mono border border-gray-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none bg-gray-50 leading-relaxed"
                    placeholder="<nav class=...>
  Paste your navbar/section HTML here...
</nav>
<script>
  ...
</script>"
                  />
                </div>
              )}
              {tab === 'fixed' && (
                <div className="flex-1 flex flex-col p-4 gap-3 overflow-hidden">
                  {fixChanges.length > 0 && (() => {
                    const isErr = fixChanges.some((c) => c.startsWith('⛔'))
                    return (
                      <div className={`flex-shrink-0 rounded-xl px-4 py-3 border ${
                        isErr ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
                      }`}>
                        <p className={`text-xs font-semibold mb-1.5 ${
                          isErr ? 'text-red-800' : 'text-amber-800'
                        }`}>{isErr ? 'Cannot process — not plain HTML:' : 'Changes applied:'}</p>
                        <ul className="space-y-1.5">
                          {fixChanges.map((c, i) => (
                            <li key={i} className={`text-xs flex items-start gap-1.5 ${
                              isErr ? 'text-red-700' : 'text-amber-700'
                            }`}>
                              {isErr
                                ? <X className="w-3 h-3 mt-0.5 flex-shrink-0 text-red-500" />
                                : <Check className="w-3 h-3 mt-0.5 flex-shrink-0 text-amber-600" />
                              }
                              {c.replace('⛔ ', '')}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  })()}
                  {fixedHtml ? (
                    <textarea
                      value={fixedHtml}
                      onChange={(e) => setFixedHtml(e.target.value)}
                      className="flex-1 text-xs font-mono border border-gray-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none bg-gray-50 leading-relaxed"
                    />
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
                      Paste HTML in the Raw tab, then click Auto-Fix
                    </div>
                  )}
                </div>
              )}
              {tab === 'preview' && (
                <div className="flex-1 overflow-hidden p-4">
                  {(rawHtml || fixedHtml) ? (
                    <iframe
                      srcDoc={previewHtml}
                      className="w-full h-full rounded-xl border border-gray-200 bg-white"
                      sandbox="allow-scripts"
                      title="Section preview"
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-sm text-gray-400">
                      <div className="text-center">
                        <Eye className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p>Paste HTML to see a preview</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Metadata sidebar */}
            <div className="w-72 flex-shrink-0 border-l border-gray-200 bg-white overflow-y-auto p-5 space-y-5">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Label</label>
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Sticky Blur Navbar"
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Section Type</label>
                <select
                  value={type}
                  onChange={(e) => { setType(e.target.value); setTypeFilter(e.target.value) }}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white"
                >
                  {SECTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Paradigm</label>
                <select
                  value={paradigm}
                  onChange={(e) => setParadigm(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white"
                >
                  {PARADIGMS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Quality Score (1–10)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range" min={1} max={10} value={qualityScore}
                    onChange={(e) => setQualityScore(Number(e.target.value))}
                    className="flex-1 accent-violet-600"
                  />
                  <span className="text-sm font-bold text-violet-700 w-4">{qualityScore}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Tags</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {tags.map((t) => (
                    <span key={t} className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                      {t}
                      <button onClick={() => setTags(tags.filter((x) => x !== t))}><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
                {/* Quick behaviour tags */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {BEHAVIOUR_TAGS.map((t) => (
                    <button
                      key={t}
                      onClick={() => tags.includes(t) ? setTags(tags.filter((x) => x !== t)) : addTag(t)}
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full border transition-colors ${tags.includes(t) ? 'bg-violet-600 text-white border-violet-600' : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-violet-300'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1.5">
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput) } }}
                    placeholder="custom tag…"
                    className="flex-1 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-300"
                  />
                  <button onClick={() => addTag(tagInput)} className="text-xs px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-violet-100 text-gray-600 hover:text-violet-700 transition-colors">
                    <Tag className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="What makes this example good? When should the AI use it?"
                  className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Source URL</label>
                <div className="flex gap-1.5">
                  <input
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="https://prebuiltui.com/..."
                    className="flex-1 text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300"
                  />
                  {source && (
                    <a href={source} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                      <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                    </a>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Saved examples are injected into the AI prompt as <code className="bg-gray-100 px-1 rounded">REFERENCE SECTION</code> blocks during generation. Higher quality score = more likely to be selected.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
