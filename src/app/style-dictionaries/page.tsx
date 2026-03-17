'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { StyleDictionary, PatternVariant } from '@/lib/types/styleDictionary'
import {
  ArrowLeft, Plus, Edit2, Trash2, Eye, EyeOff, Check, X,
  ChevronDown, ChevronUp, Copy, Layers, Zap, Type, Palette,
  LayoutTemplate, Code2, Star, AlertCircle, ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'

// ── Paradigm metadata ────────────────────────────────────────────────────────
const PARADIGM_META: Record<string, { label: string; emoji: string; summary: string; palette: string[] }> = {
  'bold-expressive':  { label: 'Bold & Expressive',  emoji: '⚡', summary: 'Big type, rich animation, overlaps, dark sections', palette: ['#0f0f0f','#6d28d9','#f59e0b','#ffffff'] },
  'minimal-clean':    { label: 'Minimal & Clean',    emoji: '◻️', summary: 'Whitespace-first, no animation, single accent',      palette: ['#ffffff','#f9fafb','#111827','#6366f1'] },
  'tech-dark':        { label: 'Tech Dark',           emoji: '🖥️', summary: 'Dark bg, grid patterns, code-like precision',        palette: ['#030712','#111827','#10b981','#6366f1'] },
  'luxury-editorial': { label: 'Luxury Editorial',   emoji: '✦',  summary: 'Serif forward, large imagery, editorial spacing',    palette: ['#fafaf9','#1c1917','#b45309','#d6d3d1'] },
  'bento-grid':       { label: 'Bento Grid',         emoji: '⊞',  summary: 'Card mosaic, asymmetric layout, mixed sizes',        palette: ['#f8fafc','#0f172a','#0ea5e9','#f59e0b'] },
  'brutalist':        { label: 'Brutalist',           emoji: '■',  summary: 'Raw edges, heavy borders, no softness',             palette: ['#ffffff','#000000','#ff0000','#ffff00'] },
}

// ── Live HTML preview for a pattern ─────────────────────────────────────────
const PREVIEW_W = 1280

function PatternPreview({ html, label }: { html: string; label: string }) {
  const [iframeH, setIframeH] = useState(600)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerW, setContainerW] = useState(800)
  const id = `preview-${Math.random().toString(36).slice(2)}`
  const idRef = useRef(id)

  const safeHtml = html.replace(/var\(--color-[^)]+\)/g, '#6366f1').replace(/var\(--[^)]+\)/g, '#6366f1')
  const wrapped = [
    '<!DOCTYPE html><html class="dark"><head>',
    '<script src="https://unpkg.com/@tailwindcss/browser@4"><\/script>',
    '<style>*{box-sizing:border-box}html,body{margin:0;font-family:Inter,sans-serif}</style>',
    '</head><body>',
    safeHtml,
    '<scr' + 'ipt>window.addEventListener("load",()=>setTimeout(()=>window.parent.postMessage({type:"ph",id:"' + idRef.current + '",h:document.body.scrollHeight},"*"),500))</scr' + 'ipt>',
    '</body></html>',
  ].join('')

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (e.data?.type === 'ph' && e.data?.id === idRef.current) {
        setIframeH(Math.max(200, e.data.h + 16))
      }
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [])

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(entries => {
      setContainerW(entries[0].contentRect.width || 800)
    })
    ro.observe(containerRef.current)
    setContainerW(containerRef.current.offsetWidth || 800)
    return () => ro.disconnect()
  }, [])

  const scale = containerW / PREVIEW_W
  const scaledH = iframeH * scale

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100">
        <span className="text-[10px] font-mono text-gray-400">{label}</span>
      </div>
      <div ref={containerRef} style={{ height: scaledH, overflow: 'hidden', position: 'relative' }}>
        <iframe
          srcDoc={wrapped}
          style={{
            width: PREVIEW_W,
            height: iframeH,
            border: 'none',
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            pointerEvents: 'none',
            display: 'block',
          }}
          sandbox="allow-scripts"
        />
      </div>
    </div>
  )
}

// ── Variant chip ─────────────────────────────────────────────────────────────
function VariantTag({ tag }: { tag: string }) {
  return <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-medium">{tag}</span>
}

// ── Dictionary card ──────────────────────────────────────────────────────────
function DictCard({
  dict,
  onEdit,
  onToggleActive,
  onDelete,
  isSelected,
  onSelect,
}: {
  dict: StyleDictionary
  onEdit: () => void
  onToggleActive: () => void
  onDelete?: () => void
  isSelected: boolean
  onSelect: () => void
}) {
  const meta = PARADIGM_META[dict.paradigm] ?? { label: dict.label ?? dict.paradigm, emoji: '🎨', summary: dict.description ?? '', palette: ['#e5e7eb','#374151','#6366f1','#f59e0b'] }
  const patternCount = Object.keys(dict.html_patterns).length
  const variantCount = Object.values(dict.variants ?? {}).reduce((s, arr) => s + arr.length, 0)
  const isActive = dict.active !== false

  return (
    <div
      onClick={onSelect}
      className={`relative rounded-2xl border-2 cursor-pointer transition-all duration-200 overflow-hidden ${
        isSelected ? 'border-indigo-500 shadow-lg shadow-indigo-100' : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
      }`}
    >
      {/* Colour palette strip */}
      <div className="flex h-2">
        {meta.palette.map((c, i) => <div key={i} className="flex-1" style={{ background: c }} />)}
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{meta.emoji}</span>
            <div>
              <h3 className="font-bold text-gray-900 text-sm leading-tight">{meta.label}</h3>
              <p className="text-[11px] text-gray-400 font-mono mt-0.5">{dict.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {dict.is_custom && (
              <span className="px-1.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 rounded text-[10px] font-semibold">Custom</span>
            )}
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${isActive ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
              {isActive ? 'Active' : 'Hidden'}
            </span>
          </div>
        </div>

        <p className="text-xs text-gray-500 mb-4 leading-relaxed">{meta.summary || dict.description}</p>

        {/* Stats row */}
        <div className="flex items-center gap-4 text-[11px] text-gray-400 mb-4">
          <span className="flex items-center gap-1"><Code2 className="w-3 h-3" />{patternCount} patterns</span>
          <span className="flex items-center gap-1"><Layers className="w-3 h-3" />{variantCount} variants</span>
          <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{dict.rules.animation.budget}</span>
        </div>

        {/* Quick preview: card + CTA */}
        <div className="space-y-2 mb-4">
          {dict.html_patterns.cta_primary && (
            <PatternPreview html={dict.html_patterns.cta_primary + ' CTA Button'} label="cta_primary" />
          )}
          {dict.html_patterns.card && (
            <PatternPreview html={dict.html_patterns.card + '<p style="font-size:12px;margin:4px 0 0">Card body text</p></div>'} label="card" />
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit() }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            <Edit2 className="w-3 h-3" /> Edit
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleActive() }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              isActive ? 'bg-orange-50 hover:bg-orange-100 text-orange-700' : 'bg-green-50 hover:bg-green-100 text-green-700'
            }`}
          >
            {isActive ? <><EyeOff className="w-3 h-3" /> Hide</> : <><Eye className="w-3 h-3" /> Activate</>}
          </button>
          {dict.is_custom && onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete() }}
              className="ml-auto flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
            >
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Variant editor row ────────────────────────────────────────────────────────
function VariantRow({
  slot, variant, idx, onChange, onDelete
}: {
  slot: string; variant: PatternVariant; idx: number
  onChange: (v: PatternVariant) => void; onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-3 py-2 bg-gray-50">
        <button onClick={() => setOpen(!open)} className="flex items-center gap-2 flex-1 text-left">
          {open ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
          <span className="text-xs font-semibold text-gray-700">{variant.name || `variant-${idx+1}`}</span>
          <div className="flex gap-1">{variant.tags.map(t => <VariantTag key={t} tag={t} />)}</div>
        </button>
        <button
          onClick={() => {
            localStorage.setItem('vary-load-html', variant.html)
            toast.success('Loaded into /vary — open it to preview')
          }}
          className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors"
          title="Load this variant into /vary for previewing and generating variations"
        >
          <ExternalLink className="w-3 h-3" /> /vary
        </button>
        <button onClick={onDelete} className="text-gray-300 hover:text-red-400 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      {open && (
        <div className="p-3 space-y-3 bg-white">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Name</label>
              <input
                value={variant.name}
                onChange={e => onChange({ ...variant, name: e.target.value })}
                placeholder="e.g. testimonial-card"
                className="mt-1 w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Tags (comma separated)</label>
              <input
                value={variant.tags.join(',')}
                onChange={e => onChange({ ...variant, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                placeholder="card, testimonial, dark"
                className="mt-1 w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Description — shown to AI</label>
            <input
              value={variant.description}
              onChange={e => onChange({ ...variant, description: e.target.value })}
              placeholder="Use for testimonial sections — dark card with border glow"
              className="mt-1 w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">HTML Snippet</label>
            <textarea
              value={variant.html}
              onChange={e => onChange({ ...variant, html: e.target.value })}
              placeholder="<div class='...'> ... </div>"
              rows={5}
              className="mt-1 w-full text-xs font-mono border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-y"
            />
          </div>
          {variant.html && (
            <PatternPreview html={variant.html} label="preview" />
          )}
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Preview note (optional)</label>
            <input
              value={variant.preview_note ?? ''}
              onChange={e => onChange({ ...variant, preview_note: e.target.value })}
              placeholder="Best on dark backgrounds"
              className="mt-1 w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ── Pattern slot editor ───────────────────────────────────────────────────────
function PatternSlotEditor({
  slotKey, value, variants, onHtmlChange, onVariantsChange
}: {
  slotKey: string; value: string; variants: PatternVariant[]
  onHtmlChange: (v: string) => void
  onVariantsChange: (v: PatternVariant[]) => void
}) {
  const [open, setOpen] = useState(false)

  const addVariant = () => {
    onVariantsChange([...variants, { name: '', description: '', html: value, tags: [], preview_note: '' }])
    setOpen(true)
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 text-left transition-colors"
      >
        <div className="flex items-center gap-3">
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          <span className="text-sm font-semibold text-gray-800 font-mono">{slotKey}</span>
          <span className="text-xs text-gray-400">{variants.length} variant{variants.length !== 1 ? 's' : ''}</span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); addVariant() }}
          className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-md transition-colors"
        >
          <Plus className="w-3 h-3" /> Add variant
        </button>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-2 space-y-3 bg-gray-50 border-t border-gray-100">
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Default HTML (used when no variant matches)</label>
            <textarea
              value={value}
              onChange={e => onHtmlChange(e.target.value)}
              rows={3}
              className="mt-1 w-full text-xs font-mono border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-y"
            />
            {value && <PatternPreview html={value} label="default preview" />}
          </div>
          {variants.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Variants — AI picks based on section type</p>
              {variants.map((v, i) => (
                <VariantRow
                  key={i} slot={slotKey} variant={v} idx={i}
                  onChange={(nv) => {
                    const arr = [...variants]; arr[i] = nv; onVariantsChange(arr)
                  }}
                  onDelete={() => {
                    const arr = [...variants]; arr.splice(i, 1); onVariantsChange(arr)
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Blank dictionary template ─────────────────────────────────────────────────
function blankDict(id: string): StyleDictionary {
  return {
    id,
    paradigm: id,
    label: 'New Style',
    description: '',
    is_custom: true,
    active: true,
    rules: {
      layout: { section_padding: 'py-16 md:py-24', max_width: 'max-w-7xl mx-auto', columns_max: 4, overlaps_allowed: false, negative_margin_allowed: false, full_bleed_allowed: false, section_transition: 'flat' },
      typography: { heading_font: 'font-display', heading_weight: 'font-bold', heading_size_hero: 'text-4xl md:text-6xl', heading_size_section: 'text-3xl md:text-4xl', tracking: 'tracking-tight', gradient_text_allowed: false },
      color: { base: 'light', dark_sections_allowed: false, gradient_allowed: false, accent_count_max: 1, section_bg_sequence: ['background', 'surface'], bg_animation_mode: 'none' },
      animation: { budget: 'subtle', keyframes_allowed: false, scroll_driven_allowed: false, hover_effects_allowed: ['opacity'] },
      decoration: { mesh_gradient: false, glassmorphism: false, border_glow: false, geometric_shapes: false, noise_texture: false, color_overlays: false },
    },
    forbidden_patterns: [],
    required_patterns: [],
    html_patterns: {
      section_wrapper: '<section class="relative overflow-hidden py-16 md:py-24" style="background-color:var(--section-bg)">',
      container: '<div class="max-w-7xl mx-auto px-5 md:px-8">',
      hero_h1: '<h1 class="font-display font-bold text-4xl md:text-6xl tracking-tight leading-tight">',
      cta_primary: '<a href="#" class="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-lg transition-all" style="background-color:var(--color-accent);color:#fff">',
      cta_secondary: '<a href="#" class="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-lg border transition-all" style="border-color:var(--color-accent);color:var(--color-accent)">',
      card: '<div class="bg-white border border-gray-200 rounded-xl p-6">',
      card_hover: 'group-hover:-translate-y-1 group-hover:shadow-md',
      card_hover_classes: 'transition-all duration-200',
      card_wrapper: '<div class="group cursor-pointer">',
    },
    variants: {},
  }
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function StyleDictionariesPage() {
  const [dicts, setDicts] = useState<StyleDictionary[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editing, setEditing] = useState<StyleDictionary | null>(null)
  const [saving, setSaving] = useState(false)
  const [view, setView] = useState<'overview' | 'editor'>('overview')
  const [newIdInput, setNewIdInput] = useState('')
  const [showNewForm, setShowNewForm] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/style-dictionary?list=1')
      const data = await res.json()
      setDicts(Array.isArray(data) ? data : [])
    } catch { toast.error('Failed to load style dictionaries') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const openEditor = (dict: StyleDictionary) => {
    setEditing(JSON.parse(JSON.stringify(dict)))
    setView('editor')
  }

  const createNew = () => {
    const id = newIdInput.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-v1'
    if (!id || id === '-v1') return toast.error('Enter a valid name')
    if (dicts.some(d => d.id === id)) return toast.error('ID already exists')
    const d = blankDict(id)
    d.label = newIdInput.trim()
    openEditor(d)
    setShowNewForm(false)
    setNewIdInput('')
  }

  const save = async () => {
    if (!editing) return
    setSaving(true)
    try {
      await fetch('/api/style-dictionary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref: editing.id, dict: editing }),
      })
      toast.success('Saved!')
      await load()
      setView('overview')
      setEditing(null)
    } catch { toast.error('Save failed') }
    finally { setSaving(false) }
  }

  const toggleActive = async (dict: StyleDictionary) => {
    const updated = { ...dict, active: dict.active === false ? true : false }
    await fetch('/api/style-dictionary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref: updated.id, dict: updated }),
    })
    toast.success(updated.active ? 'Activated' : 'Hidden from briefing wizard')
    await load()
  }

  const deleteDict = async (dict: StyleDictionary) => {
    if (!dict.is_custom) return
    if (!confirm(`Delete "${dict.id}"? This cannot be undone.`)) return
    await fetch('/api/style-dictionary', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref: dict.id }),
    })
    toast.success('Deleted')
    await load()
  }

  const updatePattern = (key: string, value: string) => {
    if (!editing) return
    setEditing({ ...editing, html_patterns: { ...editing.html_patterns, [key]: value } })
  }

  const updateVariants = (key: string, variants: PatternVariant[]) => {
    if (!editing) return
    setEditing({ ...editing, variants: { ...(editing.variants ?? {}), [key]: variants } })
  }

  // ── EDITOR VIEW ──────────────────────────────────────────────────────────────
  if (view === 'editor' && editing) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => { setView('overview'); setEditing(null) }} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="w-px h-4 bg-gray-200" />
            <span className="text-sm font-semibold text-gray-900">{editing.label || editing.id}</span>
            {editing.is_custom && <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 rounded text-xs font-semibold">Custom</span>}
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : <><Check className="w-4 h-4" /> Save dictionary</>}
          </button>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">

          {/* Basic info */}
          <section>
            <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2"><Star className="w-4 h-4 text-amber-400" /> Basic Info</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Display Label</label>
                <input value={editing.label ?? ''} onChange={e => setEditing({ ...editing, label: e.target.value })}
                  className="mt-1 w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">ID (read-only)</label>
                <input value={editing.id} readOnly className="mt-1 w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 font-mono text-gray-500" />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Description (shown in overview)</label>
                <input value={editing.description ?? ''} onChange={e => setEditing({ ...editing, description: e.target.value })}
                  className="mt-1 w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
            </div>
          </section>

          {/* Rules */}
          <section>
            <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2"><Zap className="w-4 h-4 text-indigo-500" /> Rules</h2>
            <div className="grid grid-cols-2 gap-4 bg-white border border-gray-200 rounded-xl p-4">
              {/* Animation budget */}
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Animation Budget</label>
                <select
                  value={editing.rules.animation.budget}
                  onChange={e => setEditing({ ...editing, rules: { ...editing.rules, animation: { ...editing.rules.animation, budget: e.target.value as never } } })}
                  className="mt-1 w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  {['none','subtle','moderate','rich'].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              {/* Section padding */}
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Section Padding</label>
                <input value={editing.rules.layout.section_padding}
                  onChange={e => setEditing({ ...editing, rules: { ...editing.rules, layout: { ...editing.rules.layout, section_padding: e.target.value } } })}
                  className="mt-1 w-full text-sm border border-gray-200 rounded-lg px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              {/* BG sequence */}
              <div className="col-span-2">
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Section BG Sequence (comma separated)</label>
                <input
                  value={(editing.rules.color.section_bg_sequence ?? []).join(',')}
                  onChange={e => setEditing({ ...editing, rules: { ...editing.rules, color: { ...editing.rules.color, section_bg_sequence: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } } })}
                  placeholder="background,surface,dark,background"
                  className="mt-1 w-full text-sm border border-gray-200 rounded-lg px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              {/* Decoration toggles */}
              <div className="col-span-2">
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Decoration Flags</label>
                <div className="flex flex-wrap gap-2">
                  {(Object.entries(editing.rules.decoration) as [string, boolean][]).map(([k, v]) => (
                    <button key={k}
                      onClick={() => setEditing({ ...editing, rules: { ...editing.rules, decoration: { ...editing.rules.decoration, [k]: !v } } })}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${v ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-gray-100 text-gray-400 border border-gray-200'}`}
                    >
                      {v ? '✓' : '○'} {k.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Forbidden / required patterns */}
          <section>
            <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2"><AlertCircle className="w-4 h-4 text-red-400" /> Pattern Rules</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <label className="text-[10px] font-semibold text-red-500 uppercase tracking-wide block mb-2">Forbidden (one per line)</label>
                <textarea
                  value={editing.forbidden_patterns.join('\n')}
                  onChange={e => setEditing({ ...editing, forbidden_patterns: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) })}
                  rows={5}
                  className="w-full text-xs font-mono border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-red-200 resize-y"
                />
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <label className="text-[10px] font-semibold text-green-600 uppercase tracking-wide block mb-2">Required (one per line)</label>
                <textarea
                  value={editing.required_patterns.join('\n')}
                  onChange={e => setEditing({ ...editing, required_patterns: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) })}
                  rows={5}
                  className="w-full text-xs font-mono border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-green-200 resize-y"
                />
              </div>
            </div>
          </section>

          {/* HTML pattern slots + variants */}
          <section>
            <h2 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2"><Code2 className="w-4 h-4 text-violet-500" /> HTML Patterns & Variants</h2>
            <p className="text-xs text-gray-500 mb-4">Each slot has a default HTML snippet + optional named variants. The AI picks the best variant for each section based on tags (e.g. <code className="bg-gray-100 px-1 rounded">card</code>, <code className="bg-gray-100 px-1 rounded">testimonial</code>, <code className="bg-gray-100 px-1 rounded">dark</code>).</p>
            <div className="space-y-2">
              {Object.entries(editing.html_patterns).map(([key, val]) => (
                <PatternSlotEditor
                  key={key}
                  slotKey={key}
                  value={val}
                  variants={editing.variants?.[key] ?? []}
                  onHtmlChange={v => updatePattern(key, v)}
                  onVariantsChange={v => updateVariants(key, v)}
                />
              ))}
            </div>
            {/* Standalone variant slots — keys not in html_patterns (e.g. saved from scraper) */}
            {Object.entries(editing.variants ?? {})
              .filter(([key]) => !(key in editing.html_patterns))
              .map(([key, variants]) => (
                <div key={key} className="border border-indigo-200 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50">
                    <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-xs font-semibold text-indigo-700 font-mono">{key}</span>
                    <span className="text-[10px] text-indigo-400">{variants.length} variant{variants.length !== 1 ? 's' : ''} — standalone (no default HTML)</span>
                  </div>
                  <div className="p-3 space-y-2 bg-white">
                    {variants.map((v, i) => (
                      <VariantRow
                        key={i} slot={key} variant={v} idx={i}
                        onChange={(nv) => {
                          const arr = [...variants]; arr[i] = nv
                          updateVariants(key, arr)
                        }}
                        onDelete={() => {
                          const arr = [...variants]; arr.splice(i, 1)
                          updateVariants(key, arr)
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}

            {/* Add new slot */}
            <div className="mt-3 flex gap-2">
              <input
                placeholder="New slot name (e.g. badge, stat_number)"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const v = (e.target as HTMLInputElement).value.trim()
                    if (v && !editing.html_patterns[v]) {
                      updatePattern(v, '');
                      (e.target as HTMLInputElement).value = ''
                    }
                  }
                }}
                className="flex-1 text-xs font-mono border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <p className="text-xs text-gray-400 self-center">Press Enter to add</p>
            </div>
          </section>
        </div>
      </div>
    )
  }

  // ── OVERVIEW VIEW ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/builder" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" /> Builder
          </Link>
          <div className="w-px h-4 bg-gray-200" />
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-bold text-gray-900">Style Dictionaries</span>
            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">{dicts.length}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {showNewForm ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={newIdInput}
                onChange={e => setNewIdInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createNew()}
                placeholder="e.g. My Agency Style"
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 w-52 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <button onClick={createNew} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700">Create</button>
              <button onClick={() => { setShowNewForm(false); setNewIdInput('') }} className="text-gray-400 hover:text-gray-700"><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <button onClick={() => setShowNewForm(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors">
              <Plus className="w-4 h-4" /> New style
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Info banner */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-5 py-4 mb-8 flex gap-4">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <LayoutTemplate className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-indigo-900 mb-1">How Style Dictionaries work</p>
            <p className="text-xs text-indigo-700 leading-relaxed">
              Each dictionary defines the complete visual personality of a design paradigm — typography, animation budget, decoration flags, and exact <strong>HTML patterns</strong> that the AI copies verbatim into generated sections.
              Add <strong>variants</strong> per slot (e.g. multiple card styles) and the AI picks the best one based on the section type.
              Active dictionaries appear in the <strong>briefing wizard</strong> and <strong>manifest editor</strong>. Hidden ones are saved but not offered.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-24 text-gray-400 text-sm">Loading…</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {dicts.map(d => (
              <DictCard
                key={d.id}
                dict={d}
                isSelected={selectedId === d.id}
                onSelect={() => setSelectedId(d.id === selectedId ? null : d.id)}
                onEdit={() => openEditor(d)}
                onToggleActive={() => toggleActive(d)}
                onDelete={d.is_custom ? () => deleteDict(d) : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
