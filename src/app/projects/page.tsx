'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useBuilderStore } from '@/lib/store'
import { Zap, Plus, ArrowRight, Layers, Clock, Globe, Trash2, Sparkles, Database, Wand2, ArrowLeft } from 'lucide-react'

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function ProjectsPage() {
  const router = useRouter()
  const { savedProjects, loadProject, deleteProject, newProject } = useBuilderStore()

  function handleOpen(id: string) {
    loadProject(id)
    router.push('/builder')
  }

  function handleNew() {
    router.push('/briefing')
  }

  function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    if (confirm('Delete this project?')) deleteProject(id)
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Top bar */}
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-lg tracking-tight">wbuilder</span>
            <span className="text-xs text-zinc-500 ml-1 font-medium">Projects</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/scraper" className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors">
            <Database className="w-3.5 h-3.5" /> Block Library
          </Link>
          <Link href="/discovery" className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors">
            <Sparkles className="w-3.5 h-3.5" /> Discovery
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">

        {/* Hero row */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <h1 className="text-3xl font-black tracking-tight mb-1">Your Projects</h1>
            <p className="text-zinc-400 text-sm">
              {savedProjects.length === 0
                ? 'No projects yet — create your first AI-powered site'
                : `${savedProjects.length} project${savedProjects.length === 1 ? '' : 's'}`}
            </p>
          </div>
          <button
            onClick={handleNew}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-5 py-3 rounded-xl transition-colors shadow-lg shadow-indigo-900/40"
          >
            <Plus className="w-4 h-4" /> New Project
          </button>
        </div>

        {/* Project grid */}
        {savedProjects.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {savedProjects.map((proj) => {
              const pageCount = proj.pages.length
              const sectionCount = proj.pages.reduce((s, p) => s + p.sections.length, 0)
              const paradigm = proj.manifest?.style_paradigm
              return (
                <div
                  key={proj.id}
                  onClick={() => handleOpen(proj.id)}
                  className="group relative bg-zinc-900 border border-zinc-800 hover:border-indigo-600/60 rounded-2xl p-5 cursor-pointer transition-all hover:shadow-xl hover:shadow-indigo-900/20"
                >
                  {paradigm && (
                    <span className="absolute top-4 right-4 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-900/60 text-indigo-300 border border-indigo-700/40">
                      {paradigm}
                    </span>
                  )}

                  <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center mb-4">
                    <Wand2 className="w-5 h-5 text-indigo-400" />
                  </div>

                  <h3 className="font-bold text-white text-base mb-1 pr-20 truncate">{proj.name}</h3>

                  <div className="flex items-center gap-3 text-xs text-zinc-500 mb-4">
                    <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{pageCount} page{pageCount !== 1 ? 's' : ''}</span>
                    <span className="flex items-center gap-1"><Layers className="w-3 h-3" />{sectionCount} section{sectionCount !== 1 ? 's' : ''}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(proj.updatedAt)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-xs text-indigo-400 font-medium group-hover:gap-2 transition-all">
                      Open <ArrowRight className="w-3 h-3" />
                    </span>
                    <button
                      onClick={(e) => handleDelete(e, proj.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}

            {/* New project card */}
            <div
              onClick={handleNew}
              className="border-2 border-dashed border-zinc-700 hover:border-indigo-600 rounded-2xl p-5 cursor-pointer transition-all flex flex-col items-center justify-center gap-3 min-h-[180px] group"
            >
              <div className="w-10 h-10 rounded-xl bg-zinc-800 group-hover:bg-indigo-900/50 flex items-center justify-center transition-colors">
                <Plus className="w-5 h-5 text-zinc-400 group-hover:text-indigo-400 transition-colors" />
              </div>
              <span className="text-sm text-zinc-500 group-hover:text-zinc-300 font-medium transition-colors">New Project</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-900/40 border border-indigo-700/30 flex items-center justify-center mb-6">
              <Sparkles className="w-8 h-8 text-indigo-400" />
            </div>
            <h2 className="text-xl font-bold mb-2">Start with the Briefing Wizard</h2>
            <p className="text-zinc-400 text-sm max-w-sm mb-8 leading-relaxed">
              Answer a few questions about your client — industry, tone, design style — and AI builds a complete multi-page site from scratch.
            </p>
            <button
              onClick={handleNew}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3.5 rounded-xl transition-colors shadow-lg shadow-indigo-900/40"
            >
              <Sparkles className="w-4 h-4" /> Start Briefing Wizard
            </button>
            <div className="mt-8 flex items-center gap-6 text-xs text-zinc-600">
              <span>✓ Multi-page sites</span>
              <span>✓ 6 design paradigms</span>
              <span>✓ 3-pass AI pipeline</span>
              <span>✓ Export HTML</span>
            </div>
          </div>
        )}

        {/* Quick-start builder link */}
        <div className="border-t border-zinc-800 pt-8 flex items-center justify-between">
          <p className="text-sm text-zinc-500">Want to start without a briefing?</p>
          <button
            onClick={() => { newProject(); router.push('/builder') }}
            className="text-sm text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <Wand2 className="w-4 h-4" /> Quick Builder (v1)
          </button>
        </div>
      </main>
    </div>
  )
}
