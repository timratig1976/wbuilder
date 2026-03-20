'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useBuilderStore } from '@/lib/store'
import { PageTopbar } from '@/components/ui/PageTopbar'
import { Zap, Plus, ArrowRight, Layers, Clock, Globe, Trash2, Sparkles, Database, Wand2, ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

type ServerProjectMeta = {
  id: string
  name: string
  updatedAt: number
  createdAt?: number
  sectionCount: number
  paradigm: string | null
  company: string | null
}

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
  const { savedProjects, loadProject, deleteProject, newProject, setManifest } = useBuilderStore()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [serverMeta, setServerMeta] = useState<ServerProjectMeta[]>([])

  useEffect(() => {
    fetch('/api/projects')
      .then((r) => r.ok ? r.json() : [])
      .then((meta: ServerProjectMeta[]) => setServerMeta(meta))
      .catch(() => {})
  }, [])

  // Merge: server projects + localStorage projects, deduplicated by id (server wins for metadata)
  const localIds = new Set(savedProjects.map((p) => p.id))
  const serverOnlyMeta = serverMeta.filter((m) => !localIds.has(m.id))

  // Combined display list: local projects + server-only projects (as lightweight meta)
  const allProjects = [
    ...savedProjects.map((p) => ({
      id: p.id,
      name: p.name,
      updatedAt: p.updatedAt,
      pageCount: p.pages.length,
      sectionCount: p.pages.reduce((s, pg) => s + pg.sections.length, 0),
      paradigm: p.manifest?.style_paradigm ?? null,
      fromStore: true as const,
    })),
    ...serverOnlyMeta.map((m) => ({
      id: m.id,
      name: m.name,
      updatedAt: m.updatedAt,
      pageCount: undefined as number | undefined,
      sectionCount: m.sectionCount,
      paradigm: m.paradigm,
      fromStore: false as const,
    })),
  ].sort((a, b) => b.updatedAt - a.updatedAt)

  async function handleOpen(id: string) {
    setLoadingId(id)
    try {
      // Always fetch fresh from server to get latest manifest + sections
      const res = await fetch(`/api/projects/${id}`)
      if (res.ok) {
        const serverProject = await res.json()
        // Inject into savedProjects so loadProject can find it
        useBuilderStore.setState((s) => ({
          savedProjects: [serverProject, ...s.savedProjects.filter((p) => p.id !== serverProject.id)],
        }))
        useBuilderStore.getState().loadProject(serverProject.id)
        if (serverProject.manifest) setManifest(serverProject.manifest)
      } else {
        // Server not available or project not found — fall back to localStorage
        const localProject = useBuilderStore.getState().savedProjects.find((p) => p.id === id)
        loadProject(id)
        if (localProject?.manifest) setManifest(localProject.manifest)
      }
    } catch {
      // Network error — fall back to localStorage version
      const localProject = useBuilderStore.getState().savedProjects.find((p) => p.id === id)
      loadProject(id)
      if (localProject?.manifest) setManifest(localProject.manifest)
    } finally {
      setLoadingId(null)
    }
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
    <div className="min-h-screen bg-white">
      <PageTopbar
        title="Projects"
        right={
          <>
            <Link href="/scraper" className="text-xs text-gray-400 hover:text-gray-900 flex items-center gap-1.5 transition-colors">
              <Database className="w-3.5 h-3.5" /> Block Library
            </Link>
            <Link href="/discovery" className="text-xs text-gray-400 hover:text-gray-900 flex items-center gap-1.5 transition-colors">
              <Sparkles className="w-3.5 h-3.5" /> Discovery
            </Link>
          </>
        }
      />

      <main className="max-w-5xl mx-auto px-6 py-12 bg-white">

        {/* Hero row */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <h1 className="text-3xl font-black tracking-tight mb-1 text-gray-900">Your Projects</h1>
            <p className="text-gray-400 text-sm">
              {allProjects.length === 0
                ? 'No projects yet — create your first AI-powered site'
                : `${allProjects.length} project${allProjects.length === 1 ? '' : 's'}`}
            </p>
          </div>
          <button
            onClick={handleNew}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-5 py-3 rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> New Project
          </button>
        </div>

        {/* Project grid */}
        {allProjects.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {allProjects.map((proj) => {
              const isLoading = loadingId === proj.id
              return (
                <div
                  key={proj.id}
                  onClick={() => !isLoading && handleOpen(proj.id)}
                  className={`group relative bg-white border rounded-2xl p-5 transition-all ${isLoading ? 'border-indigo-300 shadow-md cursor-wait opacity-70' : 'border-gray-200 hover:border-indigo-300 cursor-pointer hover:shadow-md'}`}
                >
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-2xl z-10">
                      <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                    </div>
                  )}
                  {proj.paradigm && (
                    <span className="absolute top-4 right-4 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                      {proj.paradigm}
                    </span>
                  )}

                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mb-4">
                    <Wand2 className="w-5 h-5 text-indigo-400" />
                  </div>

                  <h3 className="font-bold text-gray-900 text-base mb-1 pr-20 truncate">{proj.name}</h3>

                  <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
                    {proj.pageCount !== undefined && (
                      <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{proj.pageCount} page{proj.pageCount !== 1 ? 's' : ''}</span>
                    )}
                    <span className="flex items-center gap-1"><Layers className="w-3 h-3" />{proj.sectionCount} section{proj.sectionCount !== 1 ? 's' : ''}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(proj.updatedAt)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-xs text-indigo-400 font-medium group-hover:gap-2 transition-all">
                      Open <ArrowRight className="w-3 h-3" />
                    </span>
                    {proj.fromStore && (
                      <button
                        onClick={(e) => handleDelete(e, proj.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}

            {/* New project card */}
            <div
              onClick={handleNew}
              className="border-2 border-dashed border-gray-200 hover:border-indigo-400 rounded-2xl p-5 cursor-pointer transition-all flex flex-col items-center justify-center gap-3 min-h-[180px] group"
            >
              <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-indigo-50 flex items-center justify-center transition-colors">
                <Plus className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
              </div>
              <span className="text-sm text-gray-400 group-hover:text-gray-700 font-medium transition-colors">New Project</span>
            </div>
          </div>
        ) : allProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-6">
              <Sparkles className="w-8 h-8 text-indigo-400" />
            </div>
            <h2 className="text-xl font-bold mb-2 text-gray-900">Start with the Briefing Wizard</h2>
            <p className="text-gray-400 text-sm max-w-sm mb-8 leading-relaxed">
              Answer a few questions about your client — industry, tone, design style — and AI builds a complete multi-page site from scratch.
            </p>
            <button
              onClick={handleNew}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3.5 rounded-xl transition-colors shadow-sm"
            >
              <Sparkles className="w-4 h-4" /> Start Briefing Wizard
            </button>
            <div className="mt-8 flex items-center gap-6 text-xs text-gray-400">
              <span>✓ Multi-page sites</span>
              <span>✓ 6 design paradigms</span>
              <span>✓ 3-pass AI pipeline</span>
              <span>✓ Export HTML</span>
            </div>
          </div>
        ) : null}

        {/* Quick-start builder link */}
        <div className="border-t border-gray-100 pt-8 flex items-center justify-between">
          <p className="text-sm text-gray-400">Want to start without a briefing?</p>
          <button
            onClick={() => { newProject(); router.push('/builder') }}
            className="text-sm text-gray-400 hover:text-gray-900 flex items-center gap-1.5 transition-colors"
          >
            <Wand2 className="w-4 h-4" /> Quick Builder (v1)
          </button>
        </div>
      </main>
    </div>
  )
}
