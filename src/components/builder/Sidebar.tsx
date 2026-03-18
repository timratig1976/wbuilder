'use client'

import { useState } from 'react'
import { useBuilderStore, SectionType, Section } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Layout, Sparkles, Plus, Trash2, GripVertical,
  Loader2, ChevronDown, ChevronUp, Wand2, Zap, Globe, AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'
import { useLogStore } from '@/lib/logStore'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const SECTION_TYPES: { type: SectionType; label: string; icon: string }[] = [
  { type: 'navbar',       label: 'Navbar',       icon: '☰' },
  { type: 'hero',         label: 'Hero',         icon: '⚡' },
  { type: 'features',     label: 'Features',     icon: '✦' },
  { type: 'stats',        label: 'Stats',        icon: '📊' },
  { type: 'testimonials', label: 'Testimonials', icon: '💬' },
  { type: 'pricing',      label: 'Pricing',      icon: '💳' },
  { type: 'faq',          label: 'FAQ',          icon: '❓' },
  { type: 'cta',          label: 'CTA',          icon: '🎯' },
  { type: 'footer',       label: 'Footer',       icon: '▬' },
]

function SortableSection({ section, isSelected, onSelect, onRemove }: {
  section: Section
  isSelected: boolean
  onSelect: () => void
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: section.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer border transition-all ${
        isSelected
          ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
          : 'bg-white border-gray-200 hover:border-indigo-200 hover:bg-gray-50'
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-4 h-4" />
      </div>

      <span className="text-sm font-medium flex-1 truncate">{section.label}</span>

      {section.generating && (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500 flex-shrink-0" />
      )}

      <button
        onClick={(e) => { e.stopPropagation(); onRemove() }}
        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all flex-shrink-0"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

interface SidebarProps {
  onGenerate: (prompt: string) => void
  onAddSection: (type: SectionType) => void
}

export function Sidebar({ onGenerate, onAddSection }: SidebarProps) {
  const {
    page,
    project,
    manifest,
    selectedSectionId,
    generating,
    setPageTitle,
    setSelectedSection,
    removeSection,
    reorderSections,
    clearManifest,
    fixSectionOrder,
  } = useBuilderStore()

  // Detect if sections are out of order (footer before navbar, or footer not last)
  const isOrderBroken = (() => {
    const secs = page.sections
    if (secs.length < 2) return false
    const navbarIdx = secs.findIndex((s) => s.type === 'navbar')
    const footerIdx = secs.findIndex((s) => s.type === 'footer')
    if (navbarIdx === -1 || footerIdx === -1) return false
    return footerIdx < navbarIdx || footerIdx !== secs.length - 1
  })()

  const [prompt, setPrompt] = useState('')
  const [showBlocks, setShowBlocks] = useState(false)
  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: { distance: 5 }
  }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const from = page.sections.findIndex((s) => s.id === active.id)
    const to = page.sections.findIndex((s) => s.id === over.id)
    if (from !== -1 && to !== -1) reorderSections(from, to)
  }

  return (
    <aside className="w-72 flex-shrink-0 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2 mb-3">
          <Layout className="w-5 h-5 text-indigo-600" />
          <span className="font-semibold text-gray-900">Page Builder</span>
          <span className="ml-auto text-xs text-gray-400">{project.pages.length} page{project.pages.length !== 1 ? 's' : ''}</span>
        </div>
        <input
          value={page.title}
          onChange={(e) => setPageTitle(e.target.value)}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
          placeholder="Page title..."
        />
      </div>

      {/* Prompt Area — v2 manifest mode vs v1 prompt mode */}
      {manifest ? (
        <div className="px-4 py-4 border-b border-gray-200 bg-indigo-50">
          <div className="flex items-center gap-1.5 mb-2">
            <Zap className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-semibold text-indigo-800">v2 Manifest loaded</span>
          </div>
          <div className="text-xs text-indigo-700 mb-1 font-medium truncate">{manifest.content?.company_name ?? project.name}</div>
          <div className="flex items-center gap-1.5 text-[11px] text-indigo-500 mb-3">
            <Globe className="w-3 h-3" />
            <span>{manifest.pages?.length ?? 1} page{(manifest.pages?.length ?? 1) !== 1 ? 's' : ''}</span>
            <span className="text-indigo-300">·</span>
            <span>{manifest.style_paradigm}</span>
            {manifest.visual_tone && <>
              <span className="text-indigo-300">·</span>
              <span>{manifest.visual_tone}</span>
            </>}
            <span className="text-indigo-300">·</span>
            <span>tokens ✓</span>
          </div>
          <Button
            onClick={() => onGenerate('')}
            disabled={generating}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
          >
            {generating ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating…</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" /> Generate This Page</>
            )}
          </Button>
          <button
            onClick={clearManifest}
            className="w-full mt-1.5 text-[11px] text-indigo-400 hover:text-red-500 transition-colors"
          >
            ✕ Remove manifest (switch to v1)
          </button>
        </div>
      ) : (
        <div className="px-4 py-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-semibold text-gray-700">AI Generator</span>
          </div>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your page... e.g. 'A SaaS landing page for a project management tool with pricing'"
            className="text-sm resize-none h-24 bg-white"
          />
          <Button
            onClick={() => { if (prompt.trim()) onGenerate(prompt.trim()) }}
            disabled={generating || !prompt.trim()}
            className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
          >
            {generating ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
            ) : (
              <><Wand2 className="w-4 h-4 mr-2" /> Generate Page</>
            )}
          </Button>
        </div>
      )}

      {/* Sections List */}
      <ScrollArea className="flex-1 px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Sections ({page.sections.length})
          </span>
          {isOrderBroken && (
            <button
              onClick={() => { fixSectionOrder(); }}
              className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 transition-colors"
              title="Section order is broken — click to fix (navbar first, footer last)"
            >
              <AlertTriangle className="w-3 h-3" /> Fix Order
            </button>
          )}
        </div>

        {page.sections.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            <Layout className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>No sections yet.</p>
            <p className="text-xs mt-1">Generate a page or add sections below.</p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={page.sections.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1.5">
                {page.sections.map((section) => (
                  <SortableSection
                    key={section.id}
                    section={section}
                    isSelected={selectedSectionId === section.id}
                    onSelect={() => setSelectedSection(section.id)}
                    onRemove={() => removeSection(section.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </ScrollArea>

      {/* Add Block */}
      <div className="px-4 py-3 border-t border-gray-200 bg-white">
        <button
          onClick={() => setShowBlocks(!showBlocks)}
          className="flex items-center justify-between w-full text-sm font-semibold text-gray-600 hover:text-indigo-600 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Add Section
          </span>
          {showBlocks ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showBlocks && (
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {SECTION_TYPES.map(({ type, label, icon }) => (
              <button
                key={type}
                onClick={() => { onAddSection(type); setShowBlocks(false) }}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 border border-gray-200 hover:border-indigo-200 text-sm transition-all text-left"
              >
                <span>{icon}</span>
                <span className="font-medium text-xs">{label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}
