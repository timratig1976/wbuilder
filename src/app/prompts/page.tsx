'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useBuilderStore } from '@/lib/store'
import { SiteManifest } from '@/lib/types/manifest'
import { ArrowLeft, Play, Copy, Check, ChevronDown, RefreshCw, Eye, Code2, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

const SECTION_TYPES = [
  'navbar', 'hero', 'pain-points', 'services', 'features',
  'process', 'stats', 'testimonials', 'pricing', 'faq', 'cta', 'footer',
]

const PASS_TABS = ['pass1_system', 'pass1_user', 'pass2_system'] as const
type PassTab = typeof PASS_TABS[number]

const PASS_LABELS: Record<PassTab, string> = {
  pass1_system: 'Pass 1 — System',
  pass1_user:   'Pass 1 — User',
  pass2_system: 'Pass 2 — System',
}

interface PromptData {
  sectionType: string
  paradigm: string
  isChrome: boolean
  pass1: { system: string; user: string }
  pass2: { system: string; user: string }
  referenceHtml: string | null
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
      className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors px-2 py-1 rounded hover:bg-gray-100"
    >
      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

function PromptViewer({ label, content, editable, onChange }: {
  label: string; content: string; editable?: boolean; onChange?: (v: string) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const lines = content.split('\n').length

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200 flex-shrink-0">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-gray-400">{lines} lines · {content.length} chars</span>
          {editable && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`text-xs px-2 py-0.5 rounded transition-colors ${isEditing ? 'bg-violet-100 text-violet-700' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}
            >
              {isEditing ? 'viewing' : 'edit'}
            </button>
          )}
          <CopyButton text={content} />
        </div>
      </div>
      {isEditing && editable ? (
        <textarea
          value={content}
          onChange={(e) => onChange?.(e.target.value)}
          className="flex-1 font-mono text-[11px] leading-relaxed p-3 resize-none focus:outline-none bg-white text-gray-800"
          spellCheck={false}
        />
      ) : (
        <pre className="flex-1 overflow-auto font-mono text-[11px] leading-relaxed p-3 bg-white text-gray-800 whitespace-pre-wrap">
          {content}
        </pre>
      )}
    </div>
  )
}

export default function PromptsPage() {
  const { manifest: storeManifest } = useBuilderStore()
  const [manifest, setManifest] = useState<SiteManifest | null>(null)
  const [sectionType, setSectionType] = useState('hero')
  const [promptData, setPromptData] = useState<PromptData | null>(null)
  const [loading, setLoading] = useState(false)
  const [activePass, setActivePass] = useState<PassTab>('pass1_system')

  // Override state — user can edit prompts before firing
  const [systemOverride, setSystemOverride] = useState('')
  const [userOverride, setUserOverride] = useState('')
  const [overridesActive, setOverridesActive] = useState(false)

  // Test generation state
  const [generating, setGenerating] = useState(false)
  const [generatedHtml, setGeneratedHtml] = useState('')
  const [genError, setGenError] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (storeManifest) setManifest(storeManifest)
  }, [storeManifest])

  async function loadPrompts() {
    if (!manifest) { toast.error('No manifest loaded — open a project in the Builder first'); return }
    setLoading(true)
    setGeneratedHtml('')
    setGenError('')
    try {
      const res = await fetch('/api/v2/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manifest, sectionType }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setPromptData(data)
      setSystemOverride(data.pass1.system)
      setUserOverride(data.pass1.user)
      setOverridesActive(false)
    } catch (e) {
      toast.error(String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (manifest) loadPrompts()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionType, manifest])

  // Sync override fields when promptData changes and user hasn't started editing
  useEffect(() => {
    if (promptData && !overridesActive) {
      setSystemOverride(promptData.pass1.system)
      setUserOverride(promptData.pass1.user)
    }
  }, [promptData, overridesActive])

  async function runGeneration() {
    if (!manifest || !promptData) return
    setGenerating(true)
    setGenError('')
    setGeneratedHtml('')
    setShowPreview(false)

    const useSystem = overridesActive ? systemOverride : promptData.pass1.system
    const useUser   = overridesActive ? userOverride   : promptData.pass1.user

    try {
      // Use the existing generate endpoint — pass customPrompt as the user override
      // and rely on the standard pipeline for the system prompt (we can't override system via SSE endpoint directly)
      // For full override support we call a direct completion via the prompts API
      const res = await fetch('/api/v2/prompts/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemPrompt: useSystem, userPrompt: useUser }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setGeneratedHtml(data.html)
      setShowPreview(true)
    } catch (e) {
      setGenError(String(e))
    } finally {
      setGenerating(false)
    }
  }

  // Write HTML to iframe when it changes
  useEffect(() => {
    if (!iframeRef.current || !generatedHtml || !manifest) return
    const baseStyle = `<style>
      *, *::before, *::after { box-sizing: border-box; }
      :root {
        --color-background: ${manifest.design_tokens.colors.background};
        --color-surface: ${manifest.design_tokens.colors.surface};
        --color-primary: ${manifest.design_tokens.colors.primary};
        --color-accent: ${manifest.design_tokens.colors.accent};
        --color-dark: ${manifest.design_tokens.colors.dark};
        --color-text: ${manifest.design_tokens.colors.text};
        --color-text-muted: ${manifest.design_tokens.colors.text_muted};
        --font-heading: ${manifest.design_tokens.typography.font_heading};
        --font-body: ${manifest.design_tokens.typography.font_body};
      }
      body { margin: 0; font-family: var(--font-body), sans-serif; background: var(--color-background); }
    </style>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Geist:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>`
    const doc = iframeRef.current.contentDocument
    if (doc) {
      doc.open()
      doc.write(`<!DOCTYPE html><html><head>${baseStyle}</head><body>${generatedHtml}</body></html>`)
      doc.close()
    }
  }, [generatedHtml, manifest])

  const activeContent = promptData ? {
    pass1_system: promptData.pass1.system,
    pass1_user:   promptData.pass1.user,
    pass2_system: promptData.pass2.system,
  }[activePass] : ''

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Topbar */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/builder" className="text-gray-400 hover:text-gray-700 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <Code2 className="w-4 h-4 text-violet-500" />
          <span className="font-semibold text-gray-900 text-sm">Prompt Inspector</span>
          {promptData && (
            <span className="text-[10px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">
              {promptData.paradigm}
            </span>
          )}
          {promptData?.isChrome && (
            <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
              chrome — Pass 2 skipped
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {manifest ? (
            <span className="text-xs text-gray-400">{manifest.content.company_name}</span>
          ) : (
            <span className="text-xs text-amber-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> No manifest — open a project in Builder
            </span>
          )}
          <button
            onClick={loadPrompts}
            disabled={loading || !manifest}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-40 transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Reload
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 53px)' }}>
        {/* Left sidebar — section picker */}
        <div className="w-48 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 overflow-y-auto">
          <div className="px-3 pt-4 pb-2">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-1 mb-2">Section Type</p>
            {SECTION_TYPES.map((s) => (
              <button
                key={s}
                onClick={() => setSectionType(s)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors mb-0.5 ${
                  sectionType === s
                    ? 'bg-violet-100 text-violet-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {s}
                {(s === 'navbar' || s === 'footer') && (
                  <span className="ml-1 text-[9px] text-amber-500">chrome</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading prompts…
            </div>
          ) : !promptData ? (
            <div className="flex-1 flex items-center justify-center text-center px-8">
              <div>
                <Code2 className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-500 mb-1">Open a project in the Builder first</p>
                <p className="text-xs text-gray-400">The prompt inspector uses the active project's manifest to render prompts.</p>
                <Link href="/builder" className="inline-block mt-4 text-xs text-violet-600 hover:text-violet-800 font-medium">
                  → Go to Builder
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Pass tabs */}
              <div className="flex items-center gap-0 px-4 pt-3 pb-0 border-b border-gray-200 bg-white flex-shrink-0">
                {PASS_TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActivePass(tab)}
                    className={`px-4 py-2 text-xs font-semibold border-b-2 -mb-px transition-all ${
                      activePass === tab
                        ? 'border-violet-500 text-violet-700'
                        : 'border-transparent text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {PASS_LABELS[tab]}
                    {tab === 'pass2_system' && promptData.isChrome && (
                      <span className="ml-1 text-[9px] text-amber-400">skipped</span>
                    )}
                  </button>
                ))}
                <div className="ml-auto flex items-center gap-2 pb-1">
                  {(activePass === 'pass1_system' || activePass === 'pass1_user') && (
                    <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={overridesActive}
                        onChange={(e) => setOverridesActive(e.target.checked)}
                        className="rounded accent-violet-600"
                      />
                      Edit mode
                    </label>
                  )}
                  <button
                    onClick={runGeneration}
                    disabled={generating || !manifest}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-40 transition-colors font-semibold"
                  >
                    {generating
                      ? <><Loader2 className="w-3 h-3 animate-spin" /> Generating…</>
                      : <><Play className="w-3 h-3" /> Run Pass 1</>
                    }
                  </button>
                </div>
              </div>

              {/* Prompt viewer + preview split */}
              <div className="flex-1 flex overflow-hidden">
                {/* Prompt text */}
                <div className={`flex flex-col overflow-hidden border-r border-gray-200 ${showPreview ? 'w-1/2' : 'flex-1'}`}>
                  {activePass === 'pass1_system' && (
                    <PromptViewer
                      label="Pass 1 — System Prompt"
                      content={overridesActive ? systemOverride : promptData.pass1.system}
                      editable
                      onChange={(v) => { setSystemOverride(v); setOverridesActive(true) }}
                    />
                  )}
                  {activePass === 'pass1_user' && (
                    <PromptViewer
                      label="Pass 1 — User Prompt"
                      content={overridesActive ? userOverride : promptData.pass1.user}
                      editable
                      onChange={(v) => { setUserOverride(v); setOverridesActive(true) }}
                    />
                  )}
                  {activePass === 'pass2_system' && (
                    <PromptViewer
                      label="Pass 2 — System Prompt"
                      content={promptData.pass2.system}
                    />
                  )}
                </div>

                {/* Preview panel */}
                {showPreview && (
                  <div className="w-1/2 flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200 flex-shrink-0">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Generated Output</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowPreview(false)}
                          className="text-xs text-gray-400 hover:text-gray-700 px-2 py-0.5 rounded hover:bg-gray-100"
                        >
                          hide
                        </button>
                        <CopyButton text={generatedHtml} />
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col overflow-hidden">
                      {/* HTML source */}
                      <div className="h-1/3 border-b border-gray-200 overflow-auto">
                        <pre className="font-mono text-[10px] leading-relaxed p-3 text-gray-700 whitespace-pre-wrap">{generatedHtml}</pre>
                      </div>
                      {/* Visual preview */}
                      <div className="flex-1 overflow-hidden bg-white">
                        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-1.5 border-b border-gray-100">
                          Visual Preview
                        </div>
                        <iframe
                          ref={iframeRef}
                          className="w-full h-full border-0"
                          sandbox="allow-scripts allow-same-origin"
                          title="Section preview"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Error bar */}
              {genError && (
                <div className="flex-shrink-0 px-4 py-2 bg-red-50 border-t border-red-200 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {genError}
                </div>
              )}

              {/* Override notice */}
              {overridesActive && (
                <div className="flex-shrink-0 px-4 py-2 bg-amber-50 border-t border-amber-200 text-xs text-amber-700 flex items-center justify-between">
                  <span>⚠️ Edit mode active — prompts are modified. Run will use your edited version.</span>
                  <button
                    onClick={() => {
                      setSystemOverride(promptData.pass1.system)
                      setUserOverride(promptData.pass1.user)
                      setOverridesActive(false)
                    }}
                    className="text-xs font-semibold underline hover:no-underline"
                  >
                    Reset to original
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
