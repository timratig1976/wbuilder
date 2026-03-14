'use client'

import { useState } from 'react'
import { useBuilderStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Code2, X, Loader2, Wand2, Paintbrush } from 'lucide-react'
import { toast } from 'sonner'
import { useLogStore } from '@/lib/logStore'

interface PropertiesPanelProps {
  onRegenerate: (sectionId: string, customPrompt: string) => void
}

export function PropertiesPanel({ onRegenerate }: PropertiesPanelProps) {
  const { page, selectedSectionId, setSelectedSection, updateSectionHtml, snapshotSections, revertSections, htmlSnapshots } = useBuilderStore()
  const { addLog } = useLogStore()
  const section = page.sections.find((s) => s.id === selectedSectionId)
  const canRevert = section && htmlSnapshots[section.id] != null && htmlSnapshots[section.id] !== section.html

  const [regenPrompt, setRegenPrompt] = useState('')
  const [editingHtml, setEditingHtml] = useState(false)
  const [htmlValue, setHtmlValue] = useState('')
  const [aiStylePrompt, setAiStylePrompt] = useState('')
  const [applyingStyle, setApplyingStyle] = useState(false)

  function handleRevert() {
    if (!section) return
    revertSections([section.id])
    toast.success('Reverted to previous version')
  }

  async function handleAiStyleEdit() {
    if (!section || !aiStylePrompt.trim()) return
    snapshotSections([section.id])
    setApplyingStyle(true)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          styleEdit: true,
          currentHtml: section.html,
          styleInstruction: aiStylePrompt.trim(),
          sectionType: section.type,
        }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`HTTP ${res.status}: ${text}`)
      }
      const data = await res.json()
      if (data.html?.trim()) {
        updateSectionHtml(section!.id, data.html)
        setAiStylePrompt('')
        toast.success('Style applied!')
        if (data.log) addLog({ ...data.log, timestamp: Date.now(), pageTitle: page.title, pagePrompt: page.prompt, customPrompt: aiStylePrompt.trim() })
      } else {
        toast.error('No changes were made — try rephrasing')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(`Style edit failed: ${msg}`)
      console.error('Style edit failed', err)
    } finally {
      setApplyingStyle(false)
    }
  }

  if (!section) {
    return (
      <aside className="w-72 flex-shrink-0 bg-gray-50 border-l border-gray-200 flex flex-col h-full items-center justify-center text-center px-6">
        <Code2 className="w-8 h-8 text-gray-300 mb-3" />
        <p className="text-sm text-gray-400 font-medium">Select a section</p>
        <p className="text-xs text-gray-400 mt-1">Click any section in the left panel to edit it here</p>
      </aside>
    )
  }

  function handleStartHtmlEdit() {
    setHtmlValue(section!.html)
    setEditingHtml(true)
  }

  function handleSaveHtml() {
    updateSectionHtml(section!.id, htmlValue)
    setEditingHtml(false)
  }

  return (
    <aside className="w-72 flex-shrink-0 bg-gray-50 border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-200 bg-white flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Editing</p>
          <h3 className="font-semibold text-gray-900 mt-0.5">{section.label}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">{section.type}</Badge>
          <button onClick={() => setSelectedSection(null)} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-4 py-4 space-y-5">
          {/* Regenerate */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Wand2 className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-semibold text-gray-700">Regenerate Section</span>
            </div>
            <Textarea
              value={regenPrompt}
              onChange={(e) => setRegenPrompt(e.target.value)}
              placeholder={`Describe changes for this ${section.type}... e.g. "make it darker", "add a video background", "use a 2-column layout"`}
              className="text-sm resize-none h-24 bg-white"
            />
            <Button
              onClick={() => {
                onRegenerate(section.id, regenPrompt)
                setRegenPrompt('')
              }}
              disabled={section.generating}
              className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
            >
              {section.generating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Regenerating...</>
              ) : (
                <><RefreshCw className="w-4 h-4 mr-2" /> Regenerate</>
              )}
            </Button>
          </div>

          <Separator />

          {/* Style Tweaker */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Paintbrush className="w-4 h-4 text-pink-500" />
              <span className="text-sm font-semibold text-gray-700">Style Tweaks</span>
            </div>
            <p className="text-xs text-gray-400 mb-2 leading-relaxed">Describe a specific visual change — no full regeneration.</p>
            <Textarea
              value={aiStylePrompt}
              onChange={(e) => setAiStylePrompt(e.target.value)}
              placeholder={`e.g. "make the background dark navy", "change headline font to serif", "increase padding", "make CTA button green"`}
              className="text-sm resize-none h-20 bg-white"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleAiStyleEdit}
                disabled={applyingStyle || !aiStylePrompt.trim()}
                className="flex-1 mt-2 bg-pink-600 hover:bg-pink-700 text-white text-sm"
              >
                {applyingStyle ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Applying...</>
                ) : (
                  <><Paintbrush className="w-4 h-4 mr-2" /> Apply</>
                )}
              </Button>
              {canRevert && (
                <Button
                  onClick={handleRevert}
                  variant="outline"
                  className="mt-2 text-xs px-3 border-orange-300 text-orange-600 hover:bg-orange-50"
                  title="Undo last style change"
                >
                  Undo
                </Button>
              )}
            </div>
          </div>

          <Separator />

          {/* HTML Editor */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Code2 className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-semibold text-gray-700">HTML Source</span>
            </div>

            {editingHtml ? (
              <div className="space-y-2">
                <textarea
                  value={htmlValue}
                  onChange={(e) => setHtmlValue(e.target.value)}
                  className="w-full h-64 text-xs font-mono bg-gray-900 text-green-400 rounded-lg p-3 border-0 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  spellCheck={false}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveHtml} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs">
                    Apply
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingHtml(false)} className="flex-1 text-xs">
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="bg-gray-900 rounded-lg p-3 h-36 overflow-hidden relative">
                  <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap break-all line-clamp-6 leading-5">
                    {section.html.slice(0, 300)}…
                  </pre>
                  <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-gray-900 to-transparent" />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleStartHtmlEdit}
                  className="w-full mt-2 text-xs"
                >
                  <Code2 className="w-3.5 h-3.5 mr-1" /> Edit HTML
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* Section info */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Original Prompt</p>
            <p className="text-xs text-gray-500 bg-white rounded-lg p-3 border border-gray-200 leading-relaxed">
              {section.prompt || 'Generated from page prompt'}
            </p>
          </div>
        </div>
      </ScrollArea>
    </aside>
  )
}
