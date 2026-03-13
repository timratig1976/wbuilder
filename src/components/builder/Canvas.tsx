'use client'

import { useEffect, useRef } from 'react'
import { useBuilderStore } from '@/lib/store'
import { assemblePreview } from '@/lib/assembler'
import { Loader2, Monitor, Smartphone } from 'lucide-react'

export function Canvas() {
  const { page, selectedSectionId, previewMode, generating, setSelectedSection, setPreviewMode } =
    useBuilderStore()
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const html = assemblePreview(page.sections)

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return
    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc) return
    doc.open()
    doc.write(html)
    doc.close()
  }, [html])

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
      <div className="flex-1 overflow-auto flex items-start justify-center p-6">
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
            className={`bg-white shadow-xl rounded-lg overflow-hidden transition-all duration-300 ${
              previewMode === 'mobile' ? 'w-[390px]' : 'w-full max-w-6xl'
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
          {page.sections.map((section) => (
            <button
              key={section.id}
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
          ))}
        </div>
      )}
    </div>
  )
}
