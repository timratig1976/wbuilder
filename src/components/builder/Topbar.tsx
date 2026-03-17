'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useBuilderStore, BrandStyle } from '@/lib/store'
import { useLogStore } from '@/lib/logStore'
import { useProjectAutoSave } from '@/hooks/useProjectAutoSave'
import { Button } from '@/components/ui/button'
import { Download, Trash2, Loader2, Zap, Save, FilePlus, X, BarChart2, Plus, Globe, Paintbrush, DollarSign, Sparkles, Compass, FileJson, ChevronDown, ChevronUp, Pencil, Library, Tag, History, Layers } from 'lucide-react'
import { VersionHistory } from './VersionHistory'
import { toast } from 'sonner'

function SitemapDrawer({ onClose }: { onClose: () => void }) {
  const { project, savedProjects, setActivePageId, addPage, deletePage, setProjectName, loadProject, deleteProject, setManifest } = useBuilderStore()
  const [newTitle, setNewTitle] = useState('')
  const [adding, setAdding] = useState(false)
  const [showSaved, setShowSaved] = useState(false)
  const [loadingSnapshotId, setLoadingSnapshotId] = useState<string | null>(null)

  async function handleLoadSnapshot(id: string, name: string) {
    if (!confirm(`Load "${name}"? Current unsaved work will be lost.`)) return
    setLoadingSnapshotId(id)
    try {
      const res = await fetch(`/api/projects/${id}`)
      if (res.ok) {
        const serverProject = await res.json()
        useBuilderStore.setState((s) => ({
          savedProjects: [serverProject, ...s.savedProjects.filter((p) => p.id !== serverProject.id)],
        }))
        useBuilderStore.getState().loadProject(serverProject.id)
        if (serverProject.manifest) setManifest(serverProject.manifest)
      } else {
        const localProject = useBuilderStore.getState().savedProjects.find((p) => p.id === id)
        loadProject(id)
        if (localProject?.manifest) setManifest(localProject.manifest)
      }
    } catch {
      const localProject = useBuilderStore.getState().savedProjects.find((p) => p.id === id)
      loadProject(id)
      if (localProject?.manifest) setManifest(localProject.manifest)
    } finally {
      setLoadingSnapshotId(null)
    }
    onClose()
    toast.success(`Loaded "${name}"`)
  }

  function fmt(ts: number) {
    return new Date(ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  function handleAdd() {
    if (!newTitle.trim()) return
    const slug = '/' + newTitle.trim().toLowerCase().replace(/\s+/g, '-')
    addPage(newTitle.trim(), slug)
    setNewTitle('')
    setAdding(false)
    toast.success(`Page "${newTitle.trim()}" created — click it to switch`)
  }

  return (
    <div className="absolute top-14 left-0 z-50 w-72 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
          <Globe className="w-4 h-4 text-indigo-500" /> Site Pages
        </span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
      </div>

      {/* Project name */}
      <div className="px-4 py-2 border-b border-gray-100 bg-gray-50">
        <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">Project name</label>
        <input
          value={project.name}
          onChange={(e) => setProjectName(e.target.value)}
          className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
        />
      </div>

      {/* Pages list */}
      <div className="max-h-64 overflow-y-auto">
        {project.pages.map((p) => (
          <div
            key={p.id}
            className={`flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 border-b border-gray-50 last:border-0 cursor-pointer ${
              p.id === project.activePageId ? 'bg-indigo-50' : ''
            }`}
            onClick={() => { setActivePageId(p.id); onClose() }}
          >
            <div className="flex-1 min-w-0">
              <p className={`font-medium text-sm truncate ${p.id === project.activePageId ? 'text-indigo-700' : 'text-gray-800'}`}>
                {p.title}
              </p>
              <p className="text-[11px] text-gray-400 font-mono mt-0.5">{p.slug} &middot; {p.sections.length} section{p.sections.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex items-center gap-1 ml-2 flex-shrink-0">
              {p.id === project.activePageId
                ? <span className="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded font-semibold">editing</span>
                : <span className="text-[10px] text-gray-400">open →</span>
              }
              {project.pages.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${p.title}"?`)) deletePage(p.id) }}
                  className="p-1 text-gray-300 hover:text-red-500 rounded transition-colors ml-1"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add page */}
      <div className="px-4 py-3 border-t border-gray-100">
        {adding ? (
          <div className="flex gap-2">
            <input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false) }}
              placeholder="Page title, e.g. Services"
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <Button size="sm" onClick={handleAdd} disabled={!newTitle.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3">Add</Button>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium w-full"
          >
            <Plus className="w-4 h-4" /> Add new page
          </button>
        )}
      </div>

      {/* Saved projects */}
      <div className="border-t border-gray-100">
        <button
          onClick={() => setShowSaved(!showSaved)}
          className="flex items-center justify-between w-full px-4 py-2.5 text-xs font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-50"
        >
          <span className="flex items-center gap-1.5">Saved snapshots ({savedProjects.length})</span>
          <span>{showSaved ? '▲' : '▼'}</span>
        </button>
        {showSaved && (
          <div className="max-h-48 overflow-y-auto">
            {savedProjects.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No saves yet — click Save in the toolbar</p>
            ) : (
              savedProjects.map((sp) => (
                <div key={sp.id} className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 border-b border-gray-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{sp.name}</p>
                    <p className="text-[11px] text-gray-400">{fmt(sp.updatedAt)} · {sp.pages.length} page{sp.pages.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                    <button
                      onClick={() => handleLoadSnapshot(sp.id, sp.name)}
                      disabled={loadingSnapshotId === sp.id}
                      className="text-[11px] bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-2 py-0.5 rounded font-medium disabled:opacity-50 flex items-center gap-1"
                    >
                      {loadingSnapshotId === sp.id && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                      Load
                    </button>
                    <button
                      onClick={() => { if (confirm(`Delete saved snapshot "${sp.name}"?`)) deleteProject(sp.id) }}
                      className="p-1 text-gray-300 hover:text-red-500 rounded"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function BrandDrawer({ onClose }: { onClose: () => void }) {
  const { project, setBrand } = useBuilderStore()
  const b = project.brand

  const field = (label: string, key: keyof BrandStyle, placeholder: string, type = 'text') => (
    <div>
      <label className="text-xs font-semibold text-gray-500 block mb-1">{label}</label>
      {key === 'extraNotes' ? (
        <textarea
          value={b[key]}
          onChange={(e) => setBrand({ [key]: e.target.value })}
          placeholder={placeholder}
          rows={2}
          className="w-full text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
        />
      ) : (
        <input
          type={type}
          value={b[key]}
          onChange={(e) => setBrand({ [key]: e.target.value })}
          placeholder={placeholder}
          className="w-full text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      )}
    </div>
  )

  return (
    <div className="absolute top-14 left-0 z-50 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="font-semibold text-gray-900 text-sm flex items-center gap-1.5"><Paintbrush className="w-4 h-4 text-pink-500" /> Brand Style</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
      </div>
      <div className="px-4 py-4 space-y-3 max-h-96 overflow-y-auto">
        <p className="text-xs text-gray-400 leading-relaxed">These values are injected into every AI generation so all pages stay visually consistent.</p>
        {field('Primary Color', 'primaryColor', 'e.g. indigo, #4F46E5, deep blue')}
        {field('Secondary Color', 'secondaryColor', 'e.g. rose, slate, #F43F5E')}
        {field('Font Family', 'fontFamily', 'e.g. Inter, Poppins, serif, monospace')}
        {field('Border Radius', 'borderRadius', 'e.g. rounded-xl, pill buttons, sharp corners')}
        {field('Tone / Personality', 'tone', 'e.g. minimal, bold, corporate, playful')}
        {field('Extra Notes', 'extraNotes', 'e.g. always use dark backgrounds, hero has gradient...')}
        <Button onClick={() => { toast.success('Brand style saved — will apply to all new generations'); onClose() }} className="w-full bg-pink-600 hover:bg-pink-700 text-white text-sm mt-1">
          Save Brand Style
        </Button>
      </div>
    </div>
  )
}

// ── Pattern Picker Drawer ─────────────────────────────────────────────────

interface PatternEntry {
  id: string; name: string; description: string; type: string
  paradigms: string[]; tags: string[]; confidence: number
  preview_description: string; visual_weight: string
  implementation?: { css_snippet?: string; html_snippet?: string; placeholder?: string }
}

const PT_TYPE_META: Record<string, { emoji: string; color: string; bg: string }> = {
  'section-transition':   { emoji: '〰️', color: 'text-blue-700',   bg: 'bg-blue-50'   },
  'background-treatment': { emoji: '🎨', color: 'text-amber-700',  bg: 'bg-amber-50'  },
  'card-style':           { emoji: '🃏', color: 'text-teal-700',   bg: 'bg-teal-50'   },
  'hero-layout':          { emoji: '🖼️', color: 'text-rose-700',   bg: 'bg-rose-50'   },
  'grid-pattern':         { emoji: '⊞',  color: 'text-indigo-700', bg: 'bg-indigo-50' },
  'text-animation':       { emoji: '✨', color: 'text-purple-700', bg: 'bg-purple-50' },
  'scroll-animation':     { emoji: '↕️', color: 'text-green-700',  bg: 'bg-green-50'  },
  'interaction':          { emoji: '👆', color: 'text-orange-700', bg: 'bg-orange-50' },
  'typography':           { emoji: '𝐓',  color: 'text-pink-700',   bg: 'bg-pink-50'   },
}
const PT_PARADIGM_COLORS: Record<string, string> = {
  'bold-expressive':  'bg-orange-100 text-orange-700',
  'tech-dark':        'bg-slate-200 text-slate-700',
  'minimal-clean':    'bg-gray-100 text-gray-600',
  'luxury-editorial': 'bg-yellow-100 text-yellow-800',
  'bento-grid':       'bg-teal-100 text-teal-700',
  'brutalist':        'bg-red-100 text-red-700',
}
const PT_WEIGHT: Record<string, number> = { light: 1, medium: 2, heavy: 3 }

function PatternPreviewThumb({ p }: { p: PatternEntry }) {
  const t = p.type
  if (t === 'section-transition' && p.id.includes('concave'))
    return <div className="w-full h-full bg-gradient-to-b from-slate-800 to-slate-900 relative overflow-hidden flex items-end justify-center"><div className="absolute bottom-0 left-[-10%] right-[-10%] h-8 bg-white rounded-[50%]"/><span className="relative z-10 text-white/40 text-[9px] mb-4 font-mono">concave</span></div>
  if (t === 'section-transition' && p.id.includes('diagonal'))
    return <div className="w-full h-full relative overflow-hidden" style={{ clipPath:'polygon(0 0,100% 0,100% 75%,0 100%)', background:'linear-gradient(135deg,#1e293b,#334155)' }}><span className="absolute bottom-2 left-2 text-white/40 text-[9px] font-mono">diagonal</span></div>
  if (t === 'background-treatment' && p.id.includes('mesh'))
    return <div className="w-full h-full" style={{ background:'radial-gradient(circle at 20% 50%,#818cf880,transparent 50%),radial-gradient(circle at 80% 20%,#f472b680,transparent 50%),radial-gradient(circle at 60% 80%,#34d39980,transparent 50%),#0f172a' }}><span className="absolute bottom-2 left-2 text-white/50 text-[9px] font-mono">mesh</span></div>
  if (t === 'background-treatment' && p.id.includes('geometric'))
    return <div className="w-full h-full bg-slate-900 relative overflow-hidden flex items-center justify-center"><svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 60"><circle cx="20" cy="20" r="14" fill="none" stroke="#818cf8" strokeWidth="0.8"/><circle cx="80" cy="45" r="20" fill="none" stroke="#818cf8" strokeWidth="0.8"/><line x1="0" y1="30" x2="100" y2="30" stroke="#818cf8" strokeWidth="0.5"/><line x1="50" y1="0" x2="50" y2="60" stroke="#818cf8" strokeWidth="0.5"/></svg><span className="text-white/40 text-[9px] font-mono">geometric</span></div>
  if (t === 'background-treatment' && p.id.includes('noise'))
    return <div className="w-full h-full bg-slate-800 relative overflow-hidden"><svg className="absolute inset-0 w-full h-full opacity-30"><filter id="nt"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(#nt)" opacity="0.4"/></svg><span className="absolute bottom-2 left-2 text-white/50 text-[9px] font-mono">noise</span></div>
  if (t === 'background-treatment' && p.id.includes('photo'))
    return <div className="w-full h-full relative" style={{ background:'linear-gradient(to top,#0f172a 20%,rgba(0,0,0,.5) 70%,rgba(0,0,0,.2))', backgroundColor:'#334155' }}><span className="absolute bottom-2 left-2 text-white/60 text-[9px] font-mono">overlay</span></div>
  if (t === 'background-treatment' && p.id.includes('svg'))
    return <div className="w-full h-full bg-white relative flex items-center justify-center"><svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 60"><path d="M10 50 Q30 10 50 30 T90 20" fill="none" stroke="#6366f1" strokeWidth="2"/><circle cx="50" cy="30" r="25" fill="none" stroke="#6366f1" strokeWidth="1"/></svg><span className="text-gray-400 text-[9px] font-mono">svg-bg</span></div>
  if (t === 'card-style' && p.id.includes('glass'))
    return <div className="w-full h-full relative overflow-hidden" style={{ background:'linear-gradient(135deg,#1e1b4b,#312e81)' }}><div className="absolute inset-3 rounded-xl border border-white/20" style={{ backdropFilter:'blur(8px)', background:'rgba(255,255,255,0.08)' }}><div className="p-2 space-y-1"><div className="h-1.5 w-12 bg-white/30 rounded"/><div className="h-1 w-8 bg-white/20 rounded"/></div></div></div>
  if (t === 'hero-layout')
    return <div className="w-full h-full bg-slate-900 relative overflow-hidden flex flex-col items-start justify-center px-3"><div className="h-2 w-16 bg-indigo-500 rounded mb-1.5"/><div className="h-1 w-12 bg-white/30 rounded mb-1"/><div className="h-4 w-14 bg-indigo-500 rounded-full"/><span className="absolute bottom-2 right-2 text-white/30 text-[9px] font-mono">full-bleed</span></div>
  if (t === 'grid-pattern' && p.id.includes('bento'))
    return <div className="w-full h-full bg-slate-50 p-2 grid grid-cols-3 gap-1"><div className="col-span-2 bg-indigo-100 rounded-md"/><div className="bg-violet-100 rounded-md"/><div className="bg-teal-100 rounded-md"/><div className="col-span-2 bg-pink-100 rounded-md"/></div>
  if (t === 'grid-pattern' && p.id.includes('overlap'))
    return <div className="w-full h-full bg-white relative overflow-hidden flex items-center justify-center"><div className="absolute top-3 left-6 right-6 h-10 bg-indigo-100 rounded-xl shadow"/><div className="absolute top-6 left-4 right-4 h-10 bg-violet-200 rounded-xl shadow"/><div className="absolute top-9 left-2 right-2 h-10 bg-purple-300 rounded-xl shadow"/></div>
  if (t === 'text-animation')
    return <div className="w-full h-full bg-slate-900 flex flex-col items-start justify-center px-3 gap-1"><span className="text-white/40 text-[8px] font-mono uppercase tracking-widest">Wir sind</span><div className="flex items-baseline gap-1"><span className="text-white text-xs font-bold">die</span><span className="text-indigo-400 text-xs font-bold underline decoration-dotted">Lösung</span></div><span className="text-white/30 text-[8px]">↺ word-cycle</span></div>
  if (t === 'scroll-animation' && p.id.includes('counter'))
    return <div className="w-full h-full bg-white flex items-center justify-center gap-3 px-2">{['98%','4.9★','12k'].map((v) => <div key={v} className="flex flex-col items-center"><span className="text-indigo-600 font-bold text-sm">{v}</span><div className="h-px w-6 bg-gray-200 mt-0.5"/></div>)}</div>
  if (t === 'scroll-animation')
    return <div className="w-full h-full bg-slate-900 flex items-center justify-center relative overflow-hidden"><div className="absolute left-3 top-0 bottom-0 w-px bg-indigo-500/40"/><div className="space-y-1 pl-6">{[1,2,3].map((i) => <div key={i} className="h-1.5 rounded bg-indigo-400/60" style={{ width:`${(4-i)*16}px` }}/>)}</div></div>
  if (t === 'interaction')
    return <div className="w-full h-full bg-slate-900 flex flex-col"><div className="h-5 border-b border-white/10 flex items-center px-2 gap-2"><div className="w-3 h-1 bg-white/60 rounded"/><div className="flex-1"/><div className="w-6 h-1.5 bg-indigo-500 rounded-full"/></div><div className="flex-1 flex items-center justify-center"><div className="w-8 h-5 rounded-md border border-white/10" style={{ backdropFilter:'blur(4px)', background:'rgba(255,255,255,0.05)' }}/></div><span className="text-white/30 text-[9px] font-mono text-center pb-1">nav blur</span></div>
  if (t === 'typography')
    return <div className="w-full h-full bg-slate-900 flex items-center justify-center px-3"><span className="text-sm font-bold" style={{ background:'linear-gradient(90deg,#818cf8,#f472b6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Gradient</span></div>
  const meta = PT_TYPE_META[t] ?? { emoji: '◈', bg: 'bg-gray-100' }
  return <div className={`w-full h-full ${meta.bg} flex items-center justify-center`}><span className="text-2xl">{meta.emoji}</span></div>
}

function PatternPickerDrawer({ onClose }: { onClose: () => void }) {
  const [patterns, setPatterns] = useState<PatternEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [detail, setDetail] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/v2/discovery?view=patterns')
      .then((r) => r.json())
      .then((d) => { setPatterns(d.patterns ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = patterns.filter((p) =>
    !filter || p.name.toLowerCase().includes(filter.toLowerCase()) ||
    p.type.toLowerCase().includes(filter.toLowerCase()) ||
    p.tags?.some((t) => t.toLowerCase().includes(filter.toLowerCase()))
  )

  return (
    <div className="fixed top-14 right-0 z-50 w-[440px] h-[calc(100vh-56px)] bg-white border-l border-gray-200 shadow-2xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Library className="w-4 h-4 text-violet-500" />
          <span className="font-semibold text-gray-900 text-sm">Pattern Library</span>
          <span className="text-[10px] bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded font-semibold">{patterns.length}</span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><X className="w-4 h-4" /></button>
      </div>

      {/* Filter */}
      <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by name, type or tag…"
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300"
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading patterns…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <Library className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-sm font-medium text-gray-500 mb-1">No patterns yet</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              Scrape sites at <span className="font-mono">/scraper</span> and approve discoveries at <span className="font-mono">/discovery</span> to build your pattern library.
            </p>
          </div>
        ) : (
          <div className="px-4 py-4 grid grid-cols-2 gap-3">
            {filtered.map((p) => {
              const meta = PT_TYPE_META[p.type] ?? { emoji: '◈', color: 'text-gray-500', bg: 'bg-gray-100' }
              const dots = PT_WEIGHT[p.visual_weight ?? 'light'] ?? 1
              const isDetail = detail === p.id
              return (
                <div
                  key={p.id}
                  className="relative rounded-xl border border-gray-200 overflow-hidden hover:border-violet-300 hover:shadow-sm transition-all cursor-pointer group"
                  onClick={() => setDetail(isDetail ? null : p.id)}
                >
                  {/* Visual thumb */}
                  <div className="h-[72px] relative overflow-hidden bg-gray-100">
                    <PatternPreviewThumb p={p} />
                  </div>

                  {/* Footer */}
                  <div className="px-2.5 py-2 bg-white">
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <span className="text-[11px] font-semibold text-gray-800 leading-tight">{p.name}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0 ${meta.bg} ${meta.color}`}>{meta.emoji}</span>
                    </div>
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-[9px] text-gray-400">weight</span>
                      <div className="flex gap-0.5">
                        {[1,2,3].map((d) => <div key={d} className={`w-3 h-1 rounded-full ${d <= dots ? 'bg-gray-400' : 'bg-gray-200'}`}/>)}
                      </div>
                      <span className="text-[9px] text-violet-500 font-semibold ml-auto">{Math.round(p.confidence * 100)}%</span>
                    </div>
                    {(p.paradigms ?? []).length > 0 && (
                      <div className="flex flex-wrap gap-0.5">
                        {p.paradigms.slice(0, 2).map((pr) => (
                          <span key={pr} className={`text-[8px] px-1 py-0.5 rounded font-medium ${PT_PARADIGM_COLORS[pr] ?? 'bg-gray-100 text-gray-500'}`}>{pr.replace('-', ' ')}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Detail overlay */}
                  {isDetail && (
                    <div className="absolute inset-0 z-10 bg-white/97 p-3 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                      <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={(e) => { e.stopPropagation(); setDetail(null) }}>
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <p className="text-[10px] font-bold text-gray-800 mb-1 pr-5">{p.name}</p>
                      <p className="text-[9px] text-gray-500 italic mb-2 leading-relaxed">{p.preview_description}</p>
                      {(p.tags ?? []).length > 0 && (
                        <div className="flex flex-wrap gap-0.5 mb-2">
                          {p.tags.map((t) => <span key={t} className="text-[8px] bg-violet-50 text-violet-600 px-1 py-0.5 rounded">{t}</span>)}
                        </div>
                      )}
                      {p.implementation?.css_snippet && (
                        <pre className="text-[8px] font-mono bg-gray-100 rounded p-1.5 overflow-x-auto text-gray-600 whitespace-pre-wrap leading-relaxed mb-1">{p.implementation.css_snippet.slice(0, 220)}</pre>
                      )}
                      {p.implementation?.placeholder && (
                        <pre className="text-[8px] font-mono bg-indigo-50 rounded p-1.5 text-indigo-700 whitespace-pre-wrap">{p.implementation.placeholder}</pre>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-100 flex-shrink-0">
        <a href="/discovery" className="text-xs text-violet-600 hover:text-violet-800 font-medium transition-colors">
          → Manage patterns in Discovery
        </a>
      </div>
    </div>
  )
}

// ── Manifest Drawer ────────────────────────────────────────────────────────

function ManifestDrawer({ onClose }: { onClose: () => void }) {
  const { manifest, clearManifest } = useBuilderStore()
  const [tab, setTab] = useState<'overview' | 'tokens' | 'pages' | 'patterns' | 'raw'>('overview')

  if (!manifest) return null

  const colors = manifest.design_tokens?.colors
  const typo   = manifest.design_tokens?.typography

  return (
    <div className="fixed top-14 right-0 z-50 w-[480px] h-[calc(100vh-56px)] bg-white border-l border-gray-200 shadow-2xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <FileJson className="w-4 h-4 text-indigo-500" />
            <span className="font-semibold text-gray-900 text-sm">Site Manifest</span>
            <span className="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded font-semibold">{manifest.version ?? '2.0'}</span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{manifest.content?.company_name} · {manifest.style_paradigm}{manifest.visual_tone ? ` · ${manifest.visual_tone}` : ''}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><X className="w-4 h-4" /></button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 flex-shrink-0">
        {(['overview', 'tokens', 'pages', 'patterns', 'raw'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-semibold capitalize transition-colors ${
              tab === t ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {t === 'patterns' ? (
              <span className="inline-flex items-center justify-center gap-1">
                Patterns
                {(manifest.selected_patterns?.length ?? 0) > 0 && (
                  <span className="bg-violet-600 text-white text-[8px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                    {manifest.selected_patterns!.length}
                  </span>
                )}
              </span>
            ) : t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">

        {tab === 'overview' && (
          <div className="p-5 space-y-4">
            <Section label="Site">
              <Row k="Company" v={manifest.site?.name} />
              <Row k="Industry" v={manifest.site?.industry} />
              <Row k="Tone" v={manifest.site?.tone} />
              <Row k="Language" v={manifest.site?.language} />
              <Row k="Adjectives" v={manifest.site?.adjectives?.join(', ')} />
              <Row k="CTA Goal" v={manifest.site?.primary_cta_goal} />
            </Section>
            <Section label="Visual Style">
              <Row k="Paradigm" v={manifest.style_paradigm} />
              <Row k="Visual Tone" v={manifest.visual_tone ?? 'confident'} />
            </Section>
            <Section label="Content">
              <Row k="USP" v={manifest.content?.company_usp} />
              <Row k="Primary CTA" v={manifest.content?.primary_cta} />
              <Row k="Secondary CTA" v={manifest.content?.secondary_cta} />
              <Row k="Personas" v={manifest.content?.personas?.join(', ')} />
              <Row k="Pain Points" v={manifest.content?.pain_points?.join(', ')} />
            </Section>
            <Section label="Navbar">
              <Row k="Style" v={manifest.navbar?.style} />
              <Row k="Mobile" v={manifest.navbar?.mobile_menu} />
              <Row k="CTA Label" v={manifest.navbar?.cta_label} />
              <Row k="Links" v={manifest.navbar?.links?.join(', ')} />
            </Section>
          </div>
        )}

        {tab === 'tokens' && (
          <div className="p-5 space-y-4">
            {colors && (
              <Section label="Colors">
                {Object.entries(colors).filter(([k]) => k !== '_source').map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between py-1">
                    <span className="text-xs text-gray-500">{k}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded border border-gray-200" style={{ backgroundColor: v as string }} />
                      <span className="text-xs font-mono text-gray-700">{v as string}</span>
                    </div>
                  </div>
                ))}
              </Section>
            )}
            {typo && (
              <Section label="Typography">
                <Row k="Heading Font" v={typo.font_heading} />
                <Row k="Body Font" v={typo.font_body} />
                <Row k="Heading Weight" v={typo.heading_weight} />
                <Row k="Tracking" v={typo.tracking_heading} />
              </Section>
            )}
            {manifest.design_tokens?.type_scale && (
              <Section label="Type Scale">
                {Object.entries(manifest.design_tokens.type_scale).map(([k, v]) => (
                  <Row key={k} k={k} v={v as string} mono />
                ))}
              </Section>
            )}
            {manifest.design_tokens?.spacing && (
              <Section label="Spacing">
                {Object.entries(manifest.design_tokens.spacing).map(([k, v]) => (
                  <Row key={k} k={k} v={v as string} mono />
                ))}
              </Section>
            )}
          </div>
        )}

        {tab === 'pages' && (
          <div className="p-5 space-y-3">
            {manifest.pages?.map((p, i) => (
              <div key={p.id ?? i} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm text-gray-900">{p.title}</span>
                  <span className="font-mono text-[11px] text-gray-400">{p.slug}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {p.sections?.map((s) => (
                    <span key={s} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-[11px] font-medium border border-indigo-100">{s}</span>
                  ))}
                </div>
                {p.meta_description && (
                  <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">{p.meta_description}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'patterns' && (
          <div className="p-4">
            {!manifest.selected_patterns?.length ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Library className="w-10 h-10 text-gray-200 mb-3" />
                <p className="text-sm font-medium text-gray-500 mb-1">No patterns selected</p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Select patterns in the Briefing wizard (Step 3 — Design) or reopen via{' '}
                  <span className="font-semibold text-indigo-500">Edit Manifest</span>.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {manifest.selected_patterns.map((p) => {
                  const meta = PT_TYPE_META[p.type] ?? { emoji: '◈', color: 'text-gray-500', bg: 'bg-gray-100' }
                  return (
                    <div key={p.id} className="border border-gray-200 rounded-xl overflow-hidden">
                      {/* thumb + header row */}
                      <div className="flex items-stretch">
                        <div className="w-20 h-16 flex-shrink-0 bg-gray-100 overflow-hidden relative">
                          <PatternPreviewThumb p={p as PatternEntry} />
                        </div>
                        <div className="flex-1 px-3 py-2 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-0.5">
                            <span className="text-sm font-semibold text-gray-900 leading-tight">{p.name}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0 ${meta.bg} ${meta.color}`}>{meta.emoji} {p.type}</span>
                          </div>
                          <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2">{p.preview_description ?? p.description}</p>
                        </div>
                      </div>
                      {/* implementation details */}
                      {(p.implementation?.css_snippet || p.implementation?.placeholder || p.implementation?.html_snippet) && (
                        <div className="border-t border-gray-100 px-3 py-2 space-y-1 bg-gray-50">
                          {p.implementation.placeholder && (
                            <pre className="text-[10px] font-mono text-indigo-700 bg-indigo-50 rounded px-2 py-1 whitespace-pre-wrap">{p.implementation.placeholder}</pre>
                          )}
                          {p.implementation.css_snippet && (
                            <pre className="text-[10px] font-mono text-gray-600 bg-white rounded px-2 py-1 overflow-x-auto whitespace-pre-wrap border border-gray-100">{p.implementation.css_snippet.slice(0, 200)}{p.implementation.css_snippet.length > 200 ? '…' : ''}</pre>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'raw' && (
          <div className="p-4">
            <pre className="text-[11px] text-gray-600 leading-relaxed whitespace-pre-wrap break-all font-mono bg-gray-50 rounded-xl p-4">
              {JSON.stringify(manifest, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between flex-shrink-0">
        <span className="text-[11px] text-gray-400">Generated {manifest.generated_at ? new Date(manifest.generated_at).toLocaleString() : '—'}</span>
        <button
          onClick={() => { clearManifest(); onClose() }}
          className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors"
        >
          Remove manifest
        </button>
      </div>
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">{label}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

function Row({ k, v, mono }: { k: string; v?: string; mono?: boolean }) {
  if (!v) return null
  return (
    <div className="flex items-start justify-between gap-3 py-1 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-500 flex-shrink-0">{k}</span>
      <span className={`text-xs text-gray-800 text-right ${mono ? 'font-mono' : ''}`}>{v}</span>
    </div>
  )
}

// OpenAI pricing per 1M tokens (USD), converted to EUR at 0.92
const MODEL_PRICING: Record<string, { in: number; out: number }> = {
  'gpt-5.4':       { in: 2.50,  out: 15.00 },
  'gpt-5.4-codex': { in: 2.50,  out: 15.00 },
  'gpt-4.1':       { in: 2.00,  out: 8.00  },
  'gpt-4o':        { in: 2.50,  out: 10.00 },
  'gpt-4o-mini':   { in: 0.15,  out: 0.60  },
}
const USD_TO_EUR = 0.92

function calcRunCost(logs: import('@/lib/logStore').AICallLog[]): number | null {
  if (logs.length === 0) return null
  // Find the most recent pass1 entry — that's the start of the last generation run
  const sorted = [...logs].sort((a, b) => b.timestamp - a.timestamp)
  const lastPass1 = sorted.find(l => l.pass === 'pass1_structure' || l.pass === 'manifest')
  if (!lastPass1) return null
  // All logs at or after that timestamp belong to this run
  const runStart = lastPass1.timestamp
  const runLogs = sorted.filter(l => l.timestamp >= runStart)

  let totalUsd = 0
  for (const log of runLogs) {
    const pricing = MODEL_PRICING[log.model] ?? MODEL_PRICING['gpt-4o']
    const inCost  = (log.inputTokensEst  / 1_000_000) * pricing.in
    const outCost = (log.outputTokensEst / 1_000_000) * pricing.out
    totalUsd += inCost + outCost
  }
  return totalUsd * USD_TO_EUR
}

// ── Shared nav button variants ────────────────────────────────────────────

function NavBtn({
  onClick, href, active, children, variant = 'ghost', disabled,
}: {
  onClick?: () => void
  href?: string
  active?: boolean
  children: React.ReactNode
  variant?: 'ghost' | 'primary' | 'danger' | 'accent'
  disabled?: boolean
}) {
  const base = 'inline-flex items-center gap-1.5 text-xs font-medium rounded-md px-2.5 py-1.5 transition-colors whitespace-nowrap select-none'
  const variants = {
    ghost:   active
      ? 'bg-gray-100 text-gray-900'
      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
    danger:  'text-gray-400 hover:bg-red-50 hover:text-red-600',
    accent:  active
      ? 'bg-violet-100 text-violet-800'
      : 'text-violet-600 hover:bg-violet-50 hover:text-violet-800',
  }
  const cls = `${base} ${variants[variant]} ${disabled ? 'opacity-40 pointer-events-none' : ''}`
  if (href) return <Link href={href} className={cls}>{children}</Link>
  return <button onClick={onClick} disabled={disabled} className={cls}>{children}</button>
}

// ── Open Project drawer (server-saved projects) ───────────────────────────

interface ServerProjectMeta {
  id: string; name: string; updatedAt: number; createdAt: number
  sectionCount: number; paradigm: string | null; company: string | null
}

function OpenProjectDrawer({ onClose }: { onClose: () => void }) {
  const { setManifest } = useBuilderStore()
  const [projects, setProjects] = useState<ServerProjectMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  function fmt(ts: number) {
    return new Date(ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  useEffect(() => {
    fetch('/api/projects')
      .then((r) => r.json())
      .then((data) => { setProjects(data ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function handleLoad(id: string, name: string) {
    if (!confirm(`Load "${name}"? Unsaved changes to the current project will be lost.`)) return
    setLoadingId(id)
    try {
      const res = await fetch(`/api/projects/${id}`)
      if (!res.ok) { toast.error('Project not found on server'); return }
      const project = await res.json()
      // Inject into savedProjects then load
      useBuilderStore.setState((s) => ({
        savedProjects: [project, ...s.savedProjects.filter((p) => p.id !== project.id)],
      }))
      useBuilderStore.getState().loadProject(project.id)
      if (project.manifest) setManifest(project.manifest)
      toast.success(`"${name}" loaded`)
      onClose()
    } catch { toast.error('Failed to load project') }
    finally { setLoadingId(null) }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}" from server? This cannot be undone.`)) return
    try {
      await fetch(`/api/projects/${id}`, { method: 'DELETE' })
      setProjects((p) => p.filter((x) => x.id !== id))
      toast.success(`"${name}" deleted`)
    } catch { toast.error('Delete failed') }
  }

  return (
    <div className="absolute top-14 left-0 z-50 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
          <Library className="w-4 h-4 text-indigo-500" /> Saved Projects
        </span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-10 gap-2 text-gray-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-10 px-4">
            <p className="text-sm text-gray-500 font-medium">No saved projects yet</p>
            <p className="text-xs text-gray-400 mt-1">Projects auto-save to the server after you generate content.</p>
          </div>
        ) : (
          projects
            .sort((a, b) => b.updatedAt - a.updatedAt)
            .map((p) => (
              <div key={p.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">{p.name || 'Untitled'}</p>
                  {p.company && <p className="text-[11px] text-indigo-600 font-medium truncate">{p.company}</p>}
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {fmt(p.updatedAt)} · {p.sectionCount} section{p.sectionCount !== 1 ? 's' : ''}
                    {p.paradigm && <span className="ml-1 px-1 bg-gray-100 rounded text-[10px]">{p.paradigm}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                  <button
                    onClick={() => handleLoad(p.id, p.name)}
                    disabled={loadingId === p.id}
                    className="text-[11px] bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-2.5 py-1 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    {loadingId === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                    Open
                  </button>
                  <button
                    onClick={() => handleDelete(p.id, p.name)}
                    className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
        )}
      </div>

      <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50">
        <p className="text-[10px] text-gray-400">Projects auto-save 2s after changes · stored in <span className="font-mono">src/data/projects/</span></p>
      </div>
    </div>
  )
}

function Divider() {
  return <div className="w-px h-4 bg-gray-200 mx-1 flex-shrink-0" />
}

// ── Main Topbar ────────────────────────────────────────────────────────────

export function Topbar() {
  const { page, project, manifest, generating, clearSections, saveProject, newProject, setManifest } = useBuilderStore()
  const { logs } = useLogStore()
  const { isDirty } = useProjectAutoSave()
  const { history } = useBuilderStore()
  const [showSitemap, setShowSitemap] = useState(false)
  const [showManifest, setShowManifest] = useState(false)
  const [showPatterns, setShowPatterns] = useState(false)
  const [showOpen, setShowOpen] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const runCostEur = calcRunCost(logs)
  const hasBrand = Object.values(project.brand).some((v) => v.trim() !== '')
  const patternCount = manifest?.selected_patterns?.length ?? 0

  async function handleExport() {
    if (page.sections.length === 0) { toast.error('No sections to export'); return }
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: page.title, sections: page.sections }),
      })
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${page.title.replace(/\s+/g, '-').toLowerCase()}.html`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Page exported!')
    } catch {
      toast.error('Export failed')
    }
  }

  const handleSave = useCallback(() => {
    saveProject()
    toast.success(`“${project.name}” saved`)
  }, [saveProject, project.name])

  // Cmd+S / Ctrl+S keyboard shortcut
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleSave])
  function handleNew() {
    if (!confirm('Start a new project? Unsaved changes will be lost.')) return
    newProject(); toast.success('New project started')
  }
  function handleClear() {
    if (page.sections.length === 0) return
    if (confirm('Clear all sections on this page?')) { clearSections(); toast.success('Page cleared') }
  }

  const importRef = useRef<HTMLInputElement>(null)

  function handleExportJson() {
    const payload = { ...project, manifest: manifest ?? project.manifest }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const slug = (project.name || 'project').replace(/\s+/g, '-').toLowerCase()
    a.download = `${slug}-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Project exported as JSON')
  }

  function handleImportJson(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string)
        if (!parsed?.id || !parsed?.pages) { toast.error('Invalid project file'); return }
        // Save into savedProjects and load it
        useBuilderStore.getState().saveProject()
        setManifest(parsed.manifest ?? null)
        // Load by writing directly into store
        const store = useBuilderStore.getState()
        store.loadProject(parsed.id)
        // If not already in savedProjects, inject it first
        const already = useBuilderStore.getState().savedProjects.find((p) => p.id === parsed.id)
        if (!already) {
          // Manually inject the imported project then load it
          useBuilderStore.setState((s) => ({
            savedProjects: [parsed, ...s.savedProjects.filter((p) => p.id !== parsed.id)],
          }))
          useBuilderStore.getState().loadProject(parsed.id)
        }
        toast.success(`Project "${parsed.name}" imported`)
      } catch { toast.error('Failed to parse project JSON') }
    }
    reader.readAsText(file)
    e.target.value = '' // allow re-import same file
  }

  return (
    <header className="h-12 bg-white border-b border-gray-200 flex items-center px-3 gap-2 flex-shrink-0 z-10 relative">

      {/* ── Logo ── */}
      <div className="flex items-center gap-2 flex-shrink-0 mr-1">
        <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center">
          <Zap className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="font-bold text-gray-900 text-sm tracking-tight">PageCraft</span>
      </div>

      <Divider />

      {/* ── Project / page breadcrumb ── */}
      <div className="relative flex-shrink-0">
        <button
          onClick={() => setShowSitemap(!showSitemap)}
          className={`inline-flex items-center gap-1 text-xs rounded-md px-2 py-1.5 transition-colors ${showSitemap ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
        >
          <Globe className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="font-medium max-w-[110px] truncate">{project.name}</span>
          <span className="text-gray-400">/</span>
          <span className="max-w-[80px] truncate text-gray-500">{page.title}</span>
          <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform flex-shrink-0 ${showSitemap ? 'rotate-180' : ''}`} />
        </button>
        {showSitemap && <SitemapDrawer onClose={() => setShowSitemap(false)} />}
      </div>

      {/* ── Status pill ── */}
      {generating && (
        <span className="flex items-center gap-1.5 text-xs text-indigo-600 font-medium bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100 flex-shrink-0">
          <Loader2 className="w-3 h-3 animate-spin" /> Generating…
        </span>
      )}
      {!generating && runCostEur !== null && runCostEur > 0 && (
        <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 flex-shrink-0" title="Estimated cost of last generation run">
          <DollarSign className="w-3 h-3" />
          {runCostEur < 0.01 ? '<€0.01' : `€${runCostEur.toFixed(2)}`}
        </span>
      )}

      {/* ── Spacer ── */}
      <div className="flex-1" />

      {/* ── Stats ── */}
      <span className="text-[11px] text-gray-400 font-medium flex-shrink-0 hidden xl:block">
        {project.pages.length}p · {page.sections.length}s
      </span>

      <Divider />

      {/* ── Design group: Brand · Manifest · Edit Manifest · Patterns · Discovery ── */}
      <div className="flex items-center gap-0.5">
        <NavBtn href="/brand" active={hasBrand}>
          <Paintbrush className="w-3.5 h-3.5" />
          Brand
          {hasBrand && <span className="w-1.5 h-1.5 rounded-full bg-pink-400 flex-shrink-0" />}
        </NavBtn>

        {manifest ? (
          <>
            <NavBtn onClick={() => { setShowManifest(!showManifest); setShowPatterns(false) }} active={showManifest}>
              <FileJson className="w-3.5 h-3.5" />
              Manifest
            </NavBtn>
            <NavBtn href="/briefing?edit=1">
              <Pencil className="w-3.5 h-3.5" />
              Edit Manifest
            </NavBtn>
          </>
        ) : (
          <NavBtn href="/briefing">
            <Sparkles className="w-3.5 h-3.5" />
            Briefing
          </NavBtn>
        )}

        <NavBtn
          onClick={() => { setShowPatterns(!showPatterns); setShowManifest(false) }}
          active={showPatterns}
          variant="accent"
        >
          <Library className="w-3.5 h-3.5" />
          Patterns
          {patternCount > 0 && (
            <span className="bg-violet-600 text-white text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center flex-shrink-0">
              {patternCount}
            </span>
          )}
        </NavBtn>

        <NavBtn href="/discovery" variant="accent">
          <Compass className="w-3.5 h-3.5" />
          Discovery
        </NavBtn>

        <NavBtn href="/style-rules" variant="accent">
          <Tag className="w-3.5 h-3.5" />
          Style Rules
        </NavBtn>

        <NavBtn href="/style-dictionaries" variant="accent">
          <Layers className="w-3.5 h-3.5" />
          Dictionaries
        </NavBtn>

        <NavBtn href="/vary" variant="accent">
          <Sparkles className="w-3.5 h-3.5" />
          Vary
        </NavBtn>
      </div>

      <Divider />

      {/* ── Action group: New · Save · Logs · Clear ── */}
      <div className="flex items-center gap-0.5">
        <NavBtn onClick={handleNew}>
          <FilePlus className="w-3.5 h-3.5" />
          New
        </NavBtn>

        <div className="relative">
          <NavBtn onClick={() => setShowOpen(!showOpen)} active={showOpen}>
            <Library className="w-3.5 h-3.5" />
            Open
          </NavBtn>
          {showOpen && <OpenProjectDrawer onClose={() => setShowOpen(false)} />}
        </div>

        <button
          onClick={handleSave}
          title="Save project (Cmd+S)"
          className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all shadow-sm ${
            isDirty
              ? 'bg-emerald-500 hover:bg-emerald-600 text-white ring-2 ring-emerald-300 ring-offset-1'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          <Save className="w-3.5 h-3.5" />
          Save
          {isDirty && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full animate-pulse border border-white" />
          )}
        </button>

        <div className="relative">
          <button
            onClick={() => setShowHistory(!showHistory)}
            title="Version History"
            className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              showHistory
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            History
            {history.length > 0 && (
              <span className="bg-indigo-600 text-white text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                {history.length > 9 ? '9+' : history.length}
              </span>
            )}
          </button>
          {showHistory && <VersionHistory onClose={() => setShowHistory(false)} />}
        </div>

        <NavBtn href="/logs">
          <BarChart2 className="w-3.5 h-3.5" />
          AI Logs
          {logs.length > 0 && (
            <span className="bg-indigo-600 text-white text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center flex-shrink-0">
              {logs.length > 9 ? '9+' : logs.length}
            </span>
          )}
        </NavBtn>

        <NavBtn onClick={handleClear} variant="danger" disabled={page.sections.length === 0}>
          <Trash2 className="w-3.5 h-3.5" />
          Clear
        </NavBtn>
      </div>

      <Divider />

      {/* ── JSON Export / Import ── */}
      <div className="flex items-center gap-0.5">
        <NavBtn onClick={handleExportJson} disabled={page.sections.length === 0}>
          <FileJson className="w-3.5 h-3.5" />
          Save JSON
        </NavBtn>
        <NavBtn onClick={() => importRef.current?.click()}>
          <FilePlus className="w-3.5 h-3.5" />
          Load JSON
        </NavBtn>
        <input
          ref={importRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handleImportJson}
        />
      </div>

      <Divider />

      {/* ── Primary CTA ── */}
      <NavBtn onClick={handleExport} variant="primary" disabled={page.sections.length === 0}>
        <Download className="w-3.5 h-3.5" />
        Export HTML
      </NavBtn>

      {/* ── Overlays ── */}
      {showOpen    && <div className="fixed inset-0 z-40" onClick={() => setShowOpen(false)} />}
      {showSitemap && <div className="fixed inset-0 z-40" onClick={() => setShowSitemap(false)} />}

      {showManifest && manifest && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowManifest(false)} />
          <ManifestDrawer onClose={() => setShowManifest(false)} />
        </>
      )}

      {showPatterns && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowPatterns(false)} />
          <PatternPickerDrawer onClose={() => setShowPatterns(false)} />
        </>
      )}
    </header>
  )
}
