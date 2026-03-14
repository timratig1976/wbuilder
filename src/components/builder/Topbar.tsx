'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useBuilderStore, BrandStyle } from '@/lib/store'
import { useLogStore } from '@/lib/logStore'
import { Button } from '@/components/ui/button'
import { Download, Trash2, Loader2, Zap, Save, FilePlus, X, BarChart2, Plus, Globe, Paintbrush, DollarSign } from 'lucide-react'
import { toast } from 'sonner'

function SitemapDrawer({ onClose }: { onClose: () => void }) {
  const { project, savedProjects, setActivePageId, addPage, deletePage, setProjectName, loadProject, deleteProject } = useBuilderStore()
  const [newTitle, setNewTitle] = useState('')
  const [adding, setAdding] = useState(false)
  const [showSaved, setShowSaved] = useState(false)

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
                      onClick={() => { if (confirm(`Load "${sp.name}"? Current unsaved work will be lost.`)) { loadProject(sp.id); onClose(); toast.success(`Loaded "${sp.name}"`) } }}
                      className="text-[11px] bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-2 py-0.5 rounded font-medium"
                    >
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

// OpenAI pricing per 1M tokens (USD), converted to EUR at 0.92
const MODEL_PRICING: Record<string, { in: number; out: number }> = {
  'gpt-5.4':       { in: 2.50,  out: 15.00 },
  'gpt-5.4-codex': { in: 2.50,  out: 15.00 },
  'gpt-4.1':       { in: 2.00,  out: 8.00  },
  'gpt-4o':        { in: 2.50,  out: 10.00 },
  'gpt-4o-mini':   { in: 0.15,  out: 0.60  },
}
const USD_TO_EUR = 0.92

function calcRunCost(logs: import('@/lib/logStore').AILogEntry[]): number | null {
  if (logs.length === 0) return null
  // Find the most recent classify entry — that's the start of the last run
  const sorted = [...logs].sort((a, b) => b.timestamp - a.timestamp)
  const lastClassify = sorted.find(l => l.step === 'classify')
  if (!lastClassify) return null
  // All logs at or after the classify timestamp belong to this run
  const runStart = lastClassify.timestamp
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

export function Topbar() {
  const { page, project, generating, clearSections, saveProject, newProject } = useBuilderStore()
  const { logs } = useLogStore()
  const [showSitemap, setShowSitemap] = useState(false)

  const runCostEur = calcRunCost(logs)

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

  function handleSave() {
    saveProject()
    toast.success(`"${project.name}" saved`)
  }

  function handleNew() {
    if (!confirm('Start a new project? Unsaved changes will be lost.')) return
    newProject()
    toast.success('New project started')
  }

  function handleClear() {
    if (page.sections.length === 0) return
    if (confirm('Clear all sections on this page?')) { clearSections(); toast.success('Page cleared') }
  }

  const hasBrand = Object.values(project.brand).some((v) => v.trim() !== '')

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 flex-shrink-0 z-10 relative">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900 text-lg">PageCraft</span>
        </div>
        <span className="text-gray-300">|</span>

        {/* Sitemap button */}
        <div className="relative">
          <button
            onClick={() => setShowSitemap(!showSitemap)}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="max-w-[140px] truncate">{project.name}</span>
            <span className="text-gray-400 text-xs">/ {page.title}</span>
          </button>
          {showSitemap && <SitemapDrawer onClose={() => setShowSitemap(false)} />}
        </div>

        {generating && (
          <span className="flex items-center gap-1.5 text-xs text-indigo-600 font-medium bg-indigo-50 px-2.5 py-1 rounded-full">
            <Loader2 className="w-3 h-3 animate-spin" /> AI is building your page...
          </span>
        )}

        {!generating && runCostEur !== null && runCostEur > 0 && (
          <span
            className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"
            title="Estimated cost of last generation run (generate + enhance passes)"
          >
            <DollarSign className="w-3 h-3" />
            {runCostEur < 0.01
              ? '<€0.01'
              : `€${runCostEur.toFixed(2)}`}
            <span className="text-emerald-500 font-normal">est.</span>
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 font-medium">{project.pages.length} page{project.pages.length !== 1 ? 's' : ''} · {page.sections.length} sections</span>

        {/* Brand style button → full page */}
        <Link href="/brand">
          <Button
            variant="ghost" size="sm"
            className={`text-xs gap-1.5 ${hasBrand ? 'text-pink-600 hover:text-pink-700' : 'text-gray-500 hover:text-pink-600'}`}
          >
            <Paintbrush className="w-4 h-4" /> Brand
            {hasBrand && <span className="w-1.5 h-1.5 rounded-full bg-pink-500 inline-block" />}
          </Button>
        </Link>

        <Button variant="ghost" size="sm" onClick={handleNew} className="text-gray-500 hover:text-indigo-600 text-xs gap-1.5">
          <FilePlus className="w-4 h-4" /> New
        </Button>

        <Button variant="ghost" size="sm" onClick={handleSave} className="text-gray-500 hover:text-indigo-600 text-xs gap-1.5">
          <Save className="w-4 h-4" /> Save
        </Button>

        <Link href="/logs">
          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-indigo-600 text-xs gap-1.5 relative">
            <BarChart2 className="w-4 h-4" /> AI Logs
            {logs.length > 0 && (
              <span className="bg-indigo-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {logs.length > 99 ? '99+' : logs.length}
              </span>
            )}
          </Button>
        </Link>

        <div className="w-px h-5 bg-gray-200" />

        <Button variant="ghost" size="sm" onClick={handleClear} disabled={page.sections.length === 0} className="text-gray-400 hover:text-red-500 text-xs">
          <Trash2 className="w-4 h-4 mr-1" /> Clear
        </Button>

        <Button onClick={handleExport} disabled={page.sections.length === 0} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm gap-1.5">
          <Download className="w-4 h-4" /> Export HTML
        </Button>
      </div>

      {showSitemap && (
        <div className="fixed inset-0 z-40" onClick={() => setShowSitemap(false)} />
      )}
    </header>
  )
}
