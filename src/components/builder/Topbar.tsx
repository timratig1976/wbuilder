'use client'

import { useBuilderStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Download, Trash2, Loader2, Zap } from 'lucide-react'
import { toast } from 'sonner'

export function Topbar() {
  const { page, generating, clearSections } = useBuilderStore()

  async function handleExport() {
    if (page.sections.length === 0) {
      toast.error('No sections to export')
      return
    }
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

  function handleClear() {
    if (page.sections.length === 0) return
    if (confirm('Clear all sections?')) {
      clearSections()
      toast.success('Page cleared')
    }
  }

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 flex-shrink-0 z-10">
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

        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          disabled={page.sections.length === 0}
          className="text-gray-400 hover:text-red-500 text-xs"
        >
          <Trash2 className="w-4 h-4 mr-1" /> Clear
        </Button>

        <Button
          onClick={handleExport}
          disabled={page.sections.length === 0}
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
        >
          <Download className="w-4 h-4 mr-1.5" /> Export HTML
        </Button>
      </div>
    </header>
  )
}
