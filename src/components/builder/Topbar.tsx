'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useBuilderStore, Page } from '@/lib/store'
import { useLogStore } from '@/lib/logStore'
import { Button } from '@/components/ui/button'
import { Download, Trash2, Loader2, Zap, Save, FolderOpen, FilePlus, X, Clock, BarChart2 } from 'lucide-react'
import { toast } from 'sonner'

function SavedPagesDrawer({ onClose }: { onClose: () => void }) {
  const { savedPages, loadPage, deleteSavedPage } = useBuilderStore()

  function fmt(ts: number) {
    return new Date(ts).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div className="absolute top-14 right-4 z-50 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="font-semibold text-gray-900 text-sm">Saved Pages ({savedPages.length})</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {savedPages.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">No saved pages yet</div>
        ) : (
          savedPages.map((p: Page) => (
            <div key={p.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate">{p.title}</p>
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" /> {fmt(p.updatedAt)} · {p.sections.length} sections
                </p>
              </div>
              <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                <button
                  onClick={() => { loadPage(p.id); onClose(); toast.success(`Loaded "${p.title}"`) }}
                  className="px-2.5 py-1 text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg font-medium transition-colors"
                >
                  Load
                </button>
                <button
                  onClick={() => { if (confirm(`Delete "${p.title}"?`)) { deleteSavedPage(p.id); toast.success('Deleted') } }}
                  className="p-1.5 text-gray-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export function Topbar() {
  const { page, savedPages, generating, clearSections, savePage, newPage } = useBuilderStore()
  const { logs } = useLogStore()
  const [showSaved, setShowSaved] = useState(false)

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
    if (page.sections.length === 0) { toast.error('Nothing to save yet'); return }
    savePage()
    toast.success(`"${page.title}" saved`)
  }

  function handleNew() {
    if (page.sections.length > 0 && !confirm('Start a new page? Unsaved changes will be lost.')) return
    newPage()
    toast.success('New page started')
  }

  function handleClear() {
    if (page.sections.length === 0) return
    if (confirm('Clear all sections?')) { clearSections(); toast.success('Page cleared') }
  }

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
        <span className="text-sm text-gray-500 font-medium truncate max-w-[200px]">{page.title}</span>
        {generating && (
          <span className="flex items-center gap-1.5 text-xs text-indigo-600 font-medium bg-indigo-50 px-2.5 py-1 rounded-full">
            <Loader2 className="w-3 h-3 animate-spin" /> AI is building your page...
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 font-medium">{page.sections.length} sections</span>

        <Button variant="ghost" size="sm" onClick={handleNew} className="text-gray-500 hover:text-indigo-600 text-xs gap-1.5">
          <FilePlus className="w-4 h-4" /> New
        </Button>

        <Button variant="ghost" size="sm" onClick={handleSave} disabled={page.sections.length === 0} className="text-gray-500 hover:text-indigo-600 text-xs gap-1.5">
          <Save className="w-4 h-4" /> Save
        </Button>

        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSaved(!showSaved)}
            className="text-gray-500 hover:text-indigo-600 text-xs gap-1.5"
          >
            <FolderOpen className="w-4 h-4" /> Pages
            {savedPages.length > 0 && (
              <span className="bg-indigo-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {savedPages.length}
              </span>
            )}
          </Button>
          {showSaved && <SavedPagesDrawer onClose={() => setShowSaved(false)} />}
        </div>

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

      {showSaved && (
        <div className="fixed inset-0 z-40" onClick={() => setShowSaved(false)} />
      )}
    </header>
  )
}
