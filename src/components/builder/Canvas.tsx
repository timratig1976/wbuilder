'use client'

import { useEffect, useRef } from 'react'
import { useBuilderStore } from '@/lib/store'
import { assemblePreview } from '@/lib/assembler'
import { Loader2, Monitor, Smartphone, Plus } from 'lucide-react'

export function Canvas() {
  const { page, manifest, selectedSectionId, previewMode, generating, setSelectedSection, setPreviewMode } =
    useBuilderStore()
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const sections = page.sections
  const sectionCount = sections.length
  const sectionIds = sections.map((s) => s.id).join(',')

  // Full rewrite when section list structure or preview mode changes
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return
    const html = assemblePreview(sections, manifest)
    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc) return
    doc.open()
    doc.write(html)
    doc.close()

    const afterWrite = () => {
      // Re-attach click listeners
      const sectionEls = doc.querySelectorAll<HTMLElement>('[data-section-id]')
      sectionEls.forEach((el) => {
        el.addEventListener('click', (e) => {
          e.stopPropagation()
          const id = el.getAttribute('data-section-id')
          if (id) {
            const current = useBuilderStore.getState().selectedSectionId
            useBuilderStore.getState().setSelectedSection(id === current ? null : id)
          }
        })
      })
      // Re-apply any section HTML that was surgically updated (e.g. after mobile toggle)
      const currentSections = useBuilderStore.getState().page.sections
      currentSections.forEach((s) => {
        if (s.html.startsWith('<!--')) return
        const el = doc.querySelector<HTMLElement>(`[data-section-id="${s.id}"]`)
        if (!el) return
        el.innerHTML = ''
        try {
          const frag = doc.createRange().createContextualFragment(s.html.trim())
          el.appendChild(frag)
        } catch {
          el.innerHTML = s.html.trim()
        }
      })
    }
    iframe.addEventListener('load', afterWrite, { once: true })
    afterWrite()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionCount, sectionIds, previewMode])

  // Surgical per-section HTML update — no full rewrite needed
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return
    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc || !doc.body) return
    sections.forEach((s) => {
      const el = doc.querySelector<HTMLElement>(`[data-section-id="${s.id}"]`)
      if (!el) return
      // Skip placeholders — shimmer JS inside iframe handles those
      if (s.html.startsWith('<!--')) return
      const next = s.html.trim()
      // Only update if content actually changed
      if (el.getAttribute('data-html-hash') === next.length.toString() + next.slice(0, 32)) return
      el.setAttribute('data-html-hash', next.length.toString() + next.slice(0, 32))
      // Use createContextualFragment so <script> tags execute
      el.innerHTML = ''
      try {
        const frag = doc.createRange().createContextualFragment(next)
        el.appendChild(frag)
      } catch {
        el.innerHTML = next
      }
    })
  }, [sections])

  // Sync selected section highlight into iframe
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return
    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc) return
    const sectionEls = doc.querySelectorAll<HTMLElement>('[data-section-id]')
    sectionEls.forEach((el) => {
      const id = el.getAttribute('data-section-id')
      if (id === selectedSectionId) {
        el.classList.add('selected')
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      } else {
        el.classList.remove('selected')
      }
    })
  }, [selectedSectionId])

  const isGenerating = generating || page.sections.some((s) => s.generating)

  return (
    <div className="flex-1 flex flex-col bg-gray-100 min-w-0">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500">Preview</span>
          {isGenerating && (
            <span className="flex items-center gap-1 text-xs text-indigo-600">
              <Loader2 className="w-3 h-3 animate-spin" /> Generating…
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setPreviewMode('desktop')}
            className={`p-1.5 rounded-md transition-all ${
              previewMode === 'desktop' ? 'bg-white shadow text-indigo-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            onClick={() => setPreviewMode('mobile')}
            className={`p-1.5 rounded-md transition-all ${
              previewMode === 'mobile' ? 'bg-white shadow text-indigo-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* iframe container */}
      <div className="flex-1 overflow-auto flex items-start justify-center p-0">
        {page.sections.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 text-center">
            <div className="text-6xl mb-4">✦</div>
            <p className="text-xl font-semibold text-gray-500">Your page preview will appear here</p>
            <p className="text-sm mt-2 max-w-sm">
              Describe your page in the left panel and click <strong>Generate Page</strong>, or add sections manually.
            </p>
          </div>
        ) : (
          <div
            className={`bg-white overflow-hidden transition-all duration-300 ${
              previewMode === 'mobile' ? 'w-[390px] shadow-xl rounded-lg' : 'w-full max-w-[1920px]'
            }`}
            style={{ minHeight: '600px' }}
          >
            <iframe
              ref={iframeRef}
              className="w-full border-0"
              style={{ height: '100vh', minHeight: '600px' }}
              title="Page Preview"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        )}
      </div>

      {/* Section quick-select bar */}
      {page.sections.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 bg-white border-t border-gray-200 overflow-x-auto flex-shrink-0">
          <span className="text-xs font-medium text-gray-400 whitespace-nowrap">Jump to:</span>
          {page.sections.map((section, index) => (
            <div key={section.id} className="relative group">
              <button
                onClick={() => setSelectedSection(section.id === selectedSectionId ? null : section.id)}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  selectedSectionId === section.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-700'
                }`}
              >
                {section.generating && <Loader2 className="w-3 h-3 animate-spin" />}
                {section.label}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  // TODO: Show section picker to insert after this section
                  console.log('Insert after section', index)
                }}
                className="absolute -right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-lg transition-all opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto"
                title="Add section after this"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
