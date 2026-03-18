'use client'

import { useState, useEffect } from 'react'
import { useBuilderStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Code2, X, Loader2, Wand2, Paintbrush, Library, ChevronDown, Check } from 'lucide-react'
import { toast } from 'sonner'

interface PatternEntry {
  id: string; name: string; description: string; type: string
  preview_description?: string; applicable_sections?: string[]
  implementation?: { css_snippet?: string; html_snippet?: string; placeholder?: string }
}

function SectionPatternPicker({ sectionType }: { sectionType: string }) {
  const { manifest, updateSectionPatterns } = useBuilderStore()
  const [patterns, setPatterns] = useState<PatternEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [open, setOpen] = useState(false)

  const active = manifest?.section_patterns?.[sectionType] ?? []
  const activeIds = new Set(active.map((p) => p.id))
  const globalIds = new Set((manifest?.selected_patterns ?? []).map((p) => p.id))

  function load() {
    if (loaded) return
    setLoading(true)
    fetch('/api/v2/discovery?view=patterns')
      .then((r) => r.json())
      .then((d) => {
        const all: PatternEntry[] = d.patterns ?? []
        const relevant = all.filter((p) => {
          const s = p.applicable_sections
          if (!s || s.includes('*')) return true
          return s.includes(sectionType)
        })
        setPatterns(relevant)
        setLoaded(true)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  function toggle(p: PatternEntry) {
    const next = activeIds.has(p.id)
      ? active.filter((a) => a.id !== p.id)
      : [...active, { id: p.id, name: p.name, description: p.description, type: p.type, preview_description: p.preview_description, implementation: p.implementation }]
    updateSectionPatterns(sectionType, next)
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors"
        onClick={() => { setOpen(!open); if (!open) load() }}
      >
        <div className="flex items-center gap-2">
          <Library className="w-3.5 h-3.5 text-violet-500" />
          <span className="text-xs font-semibold text-gray-700">Pattern Overrides</span>
          {active.length > 0 && (
            <span className="text-[10px] bg-violet-600 text-white px-1.5 py-0.5 rounded-full font-bold">{active.length}</span>
          )}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-gray-200">
          {loading ? (
            <div className="flex items-center justify-center py-6 text-gray-400 text-xs gap-2">
              <Loader2 className="w-3 h-3 animate-spin" /> Loading…
            </div>
          ) : patterns.length === 0 ? (
            <p className="text-xs text-gray-400 px-3 py-4 text-center">No patterns available for {sectionType}</p>
          ) : (
            <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
              {patterns.map((p) => {
                const isActive = activeIds.has(p.id)
                const isGlobal = globalIds.has(p.id)
                return (
                  <button
                    key={p.id}
                    onClick={() => toggle(p)}
                    className={`w-full flex items-start gap-2.5 px-3 py-2.5 text-left transition-colors ${
                      isActive ? 'bg-violet-50 hover:bg-violet-100' : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className={`mt-0.5 w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border transition-colors ${
                      isActive ? 'bg-violet-600 border-violet-600' : 'border-gray-300'
                    }`}>
                      {isActive && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-medium text-gray-800">{p.name}</span>
                        <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">{p.type}</span>
                        {isGlobal && <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">global</span>}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5 leading-snug line-clamp-2">{p.preview_description || p.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
          {active.length > 0 && (
            <div className="px-3 py-2 border-t border-gray-100 bg-gray-50">
              <p className="text-[10px] text-gray-500">
                {active.length} pattern{active.length !== 1 ? 's' : ''} will be injected into the next regeneration of this section.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface PropertiesPanelProps {
  onRegenerate: (sectionId: string, customPrompt: string, mode: 'full' | 'content-edit') => void
}

const STYLE_PILLS: Record<string, string[]> = {
  hero: [
    'Remove background animations',
    'Make background solid dark, no shapes',
    'Increase heading size',
    'Make CTA button more prominent',
    'Add more vertical padding',
  ],
  features: [
    'Remove background animations',
    'Make cards have a white background with subtle shadow',
    'Switch to a 3-column grid',
    'Make icons larger and more colorful',
    'Add hover lift effect to cards',
  ],
  stats: [
    'Remove background animations',
    'Make numbers larger and bolder',
    'Use accent color for stat values',
    'Switch to horizontal layout',
    'Add a subtle divider between stats',
  ],
  testimonials: [
    'Remove background animations',
    'Make cards darker with light text',
    'Increase quote font size',
    'Add star ratings to each card',
    'Switch to a single-column stack',
  ],
  pricing: [
    'Make the featured plan stand out more',
    'Use accent color for the CTA button',
    'Add a subtle border to non-featured plans',
    'Increase font size of prices',
    'Remove background animations',
  ],
  navbar: [
    'Make navbar background solid dark',
    'Increase logo size',
    'Make nav links bolder',
    'Remove glassmorphism effect',
    'Make CTA button use accent color',
  ],
  cta: [
    'Remove background animations',
    'Make background use accent color',
    'Increase heading size',
    'Make button white with dark text',
    'Add more vertical padding',
  ],
  footer: [
    'Make background solid dark',
    'Increase link spacing',
    'Make social icons larger',
    'Add a top border accent line',
  ],
  _default: [
    'Remove background animations',
    'Make background solid dark, no shapes',
    'Increase padding and whitespace',
    'Make heading larger and bolder',
    'Use accent color for highlights',
  ],
}

const INVERT_INSTRUCTION = `Invert the section background between dark and light using only the brand CSS variables. Rules:
- If section background is var(--color-dark) or var(--color-primary), change it to var(--color-background)
- If section background is var(--color-background) or var(--color-surface), change it to var(--color-dark)
- After swapping the section background, update ALL text colors inside to maintain legibility:
  - On dark bg: headings → var(--color-text) or white, body text → var(--color-text-muted) or rgba(255,255,255,0.7), accent text → var(--color-accent)
  - On light bg: headings → var(--color-dark) or var(--color-text), body text → var(--color-text-muted), accent text → var(--color-accent)
- Update card/box backgrounds: on dark bg use rgba(255,255,255,0.06) or var(--color-surface); on light bg use white or var(--color-surface)
- Update card border colors to match the new theme
- Update icon colors and SVG fills to match the new theme
- Keep all layout, spacing, structure, and text content unchanged
- Do NOT remove animations or decorative elements`

const REGEN_PILLS: Record<string, string[]> = {
  hero: ['Make it darker and more dramatic', 'Use a split layout with image', 'Add a video background', 'More minimalist — less decoration'],
  features: ['Switch to bento grid layout', 'Use icon + text rows instead of cards', '2-column layout with large icons', 'Dark theme with glowing cards'],
  stats: ['Horizontal scrolling stats bar', 'Large centered numbers with labels', 'Dark background with accent numbers'],
  testimonials: ['Carousel layout', 'Masonry card grid', 'Single large featured quote'],
  pricing: ['3-tier side-by-side layout', 'Toggle monthly/annual pricing', 'Minimal table-style layout'],
  _default: ['Make it darker', 'Use a more minimal layout', 'Add more visual interest', 'Make it bolder and more expressive'],
}

export function PropertiesPanel({ onRegenerate }: PropertiesPanelProps) {
  const { page, selectedSectionId, setSelectedSection, updateSectionHtml, snapshotSections, revertSections, htmlSnapshots, manifest } = useBuilderStore()
  const section = page.sections.find((s) => s.id === selectedSectionId)
  const canRevert = section && htmlSnapshots[section.id] != null && htmlSnapshots[section.id] !== section.html

  const [regenPrompt, setRegenPrompt] = useState('')
  const [regenMode, setRegenMode] = useState<'full' | 'content-edit'>('full')
  const [editingHtml, setEditingHtml] = useState(false)
  const [htmlValue, setHtmlValue] = useState('')
  const [aiStylePrompt, setAiStylePrompt] = useState('')
  const [applyingStyle, setApplyingStyle] = useState(false)

  function handleRevert() {
    if (!section) return
    revertSections([section.id])
    toast.success('Reverted to previous version')
  }

  async function handleAiStyleEdit() {
    if (!section || !aiStylePrompt.trim()) return
    snapshotSections([section.id])
    setApplyingStyle(true)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          styleEdit: true,
          currentHtml: section.html,
          styleInstruction: aiStylePrompt.trim(),
          sectionType: section.type,
        }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`HTTP ${res.status}: ${text}`)
      }
      const data = await res.json()
      if (data.html?.trim()) {
        updateSectionHtml(section!.id, data.html)
        setAiStylePrompt('')
        toast.success('Style applied!')
      } else {
        toast.error('No changes were made — try rephrasing')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(`Style edit failed: ${msg}`)
      console.error('Style edit failed', err)
    } finally {
      setApplyingStyle(false)
    }
  }

  if (!section) {
    return (
      <aside className="w-72 flex-shrink-0 bg-gray-50 border-l border-gray-200 flex flex-col h-full items-center justify-center text-center px-6">
        <Code2 className="w-8 h-8 text-gray-300 mb-3" />
        <p className="text-sm text-gray-400 font-medium">Select a section</p>
        <p className="text-xs text-gray-400 mt-1">Click any section in the left panel to edit it here</p>
      </aside>
    )
  }

  function handleStartHtmlEdit() {
    setHtmlValue(section!.html)
    setEditingHtml(true)
  }

  function handleSaveHtml() {
    updateSectionHtml(section!.id, htmlValue)
    setEditingHtml(false)
  }

  return (
    <aside className="w-72 flex-shrink-0 bg-gray-50 border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-200 bg-white flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Editing</p>
          <h3 className="font-semibold text-gray-900 mt-0.5">{section.label}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">{section.type}</Badge>
          <button onClick={() => setSelectedSection(null)} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-4 py-4 space-y-5">
          {/* Regenerate */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Wand2 className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-semibold text-gray-700">Regenerate Section</span>
            </div>
            {/* Mode toggle */}
            <div className="flex gap-1 mb-2 bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setRegenMode('full')}
                className={`flex-1 text-xs px-2 py-1.5 rounded-md font-medium transition-colors ${
                  regenMode === 'full' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Full rebuild
              </button>
              <button
                onClick={() => setRegenMode('content-edit')}
                className={`flex-1 text-xs px-2 py-1.5 rounded-md font-medium transition-colors ${
                  regenMode === 'content-edit' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Text only
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mb-2">
              {regenMode === 'full'
                ? 'Rebuilds the entire section from scratch — layout, content, and style.'
                : 'Only changes text (headlines, copy, CTAs). Layout and styling stay exactly the same.'}
            </p>
            {regenMode === 'full' && (
              <div className="flex flex-wrap gap-1 mb-2">
                {(REGEN_PILLS[section.type] ?? REGEN_PILLS._default).map((pill) => (
                  <button
                    key={pill}
                    onClick={() => setRegenPrompt(pill)}
                    className={`px-2 py-0.5 rounded-full text-[10px] border transition-all ${
                      regenPrompt === pill
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-white border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-600'
                    }`}
                  >
                    {pill}
                  </button>
                ))}
              </div>
            )}
            {regenMode === 'full' && manifest && (
              <div className="mb-2">
                <SectionPatternPicker sectionType={section.type} />
              </div>
            )}
            <Textarea
              value={regenPrompt}
              onChange={(e) => setRegenPrompt(e.target.value)}
              placeholder={regenMode === 'full'
                ? `e.g. "make it darker", "use a 2-column layout", "add a video background"`
                : `e.g. "change headline to: We hire faster", "make CTA say Book a Demo"`}
              className="text-sm resize-none h-16 bg-white"
            />
            <Button
              onClick={() => {
                onRegenerate(section.id, regenPrompt, regenMode)
                setRegenPrompt('')
              }}
              disabled={section.generating || (regenMode === 'content-edit' && !regenPrompt.trim())}
              className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
            >
              {section.generating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {regenMode === 'content-edit' ? 'Editing...' : 'Regenerating...'}</>
              ) : (
                <><RefreshCw className="w-4 h-4 mr-2" /> {regenMode === 'content-edit' ? 'Apply Text Change' : 'Regenerate'}</>
              )}
            </Button>
          </div>

          <Separator />

          {/* Style Tweaker */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Paintbrush className="w-4 h-4 text-pink-500" />
              <span className="text-sm font-semibold text-gray-700">Style Tweaks</span>
            </div>

            {/* Invert Section — one-click action */}
            <button
              disabled={applyingStyle}
              onClick={async () => {
                if (!section) return
                snapshotSections([section.id])
                setApplyingStyle(true)
                try {
                  const res = await fetch('/api/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      styleEdit: true,
                      currentHtml: section.html,
                      styleInstruction: INVERT_INSTRUCTION,
                      sectionType: section.type,
                    }),
                  })
                  const data = await res.json()
                  if (data.html?.trim()) {
                    updateSectionHtml(section.id, data.html)
                    toast.success('Section inverted!')
                  } else {
                    toast.error('No changes — try again')
                  }
                } catch { toast.error('Invert failed') }
                finally { setApplyingStyle(false) }
              }}
              className="w-full mb-3 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-indigo-300 text-xs font-medium text-indigo-600 hover:bg-indigo-50 hover:border-indigo-400 transition-all disabled:opacity-50"
            >
              {applyingStyle ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>⇅</span>}
              Invert dark ↔ light (keeps brand tokens + font colors)
            </button>

            <p className="text-xs text-gray-400 mb-1 leading-relaxed">Or describe a custom change:</p>
            <div className="flex flex-wrap gap-1 mb-2">
              {(STYLE_PILLS[section.type] ?? STYLE_PILLS._default).map((pill) => (
                <button
                  key={pill}
                  onClick={() => setAiStylePrompt(pill)}
                  className={`px-2 py-0.5 rounded-full text-[10px] border transition-all ${
                    aiStylePrompt === pill
                      ? 'bg-pink-600 border-pink-600 text-white'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-pink-300 hover:text-pink-600'
                  }`}
                >
                  {pill}
                </button>
              ))}
            </div>
            <Textarea
              value={aiStylePrompt}
              onChange={(e) => setAiStylePrompt(e.target.value)}
              placeholder={`e.g. "make the background dark navy", "remove floating shapes", "increase padding"`}
              className="text-sm resize-none h-16 bg-white"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleAiStyleEdit}
                disabled={applyingStyle || !aiStylePrompt.trim()}
                className="flex-1 mt-2 bg-pink-600 hover:bg-pink-700 text-white text-sm"
              >
                {applyingStyle ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Applying...</>
                ) : (
                  <><Paintbrush className="w-4 h-4 mr-2" /> Apply</>
                )}
              </Button>
              {canRevert && (
                <Button
                  onClick={handleRevert}
                  variant="outline"
                  className="mt-2 text-xs px-3 border-orange-300 text-orange-600 hover:bg-orange-50"
                  title="Undo last style change"
                >
                  Undo
                </Button>
              )}
            </div>
          </div>

          <Separator />

          {/* HTML Editor */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Code2 className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-semibold text-gray-700">HTML Source</span>
            </div>

            {editingHtml ? (
              <div className="space-y-2">
                <textarea
                  value={htmlValue}
                  onChange={(e) => setHtmlValue(e.target.value)}
                  className="w-full h-64 text-xs font-mono bg-gray-900 text-green-400 rounded-lg p-3 border-0 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  spellCheck={false}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveHtml} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs">
                    Apply
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingHtml(false)} className="flex-1 text-xs">
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="bg-gray-900 rounded-lg p-3 h-36 overflow-hidden relative">
                  <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap break-all line-clamp-6 leading-5">
                    {section.html.slice(0, 300)}…
                  </pre>
                  <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-gray-900 to-transparent" />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleStartHtmlEdit}
                  className="w-full mt-2 text-xs"
                >
                  <Code2 className="w-3.5 h-3.5 mr-1" /> Edit HTML
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* Section info */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Original Prompt</p>
            <p className="text-xs text-gray-500 bg-white rounded-lg p-3 border border-gray-200 leading-relaxed">
              {section.prompt || 'Generated from page prompt'}
            </p>
          </div>
        </div>
      </ScrollArea>
    </aside>
  )
}
