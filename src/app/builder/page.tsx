'use client'

import { Topbar } from '@/components/builder/Topbar'
import { Sidebar } from '@/components/builder/Sidebar'
import { Canvas } from '@/components/builder/Canvas'
import { PropertiesPanel } from '@/components/builder/PropertiesPanel'
import { useBuilderStore, SectionType } from '@/lib/store'
import { useLogStore, AILogEntry } from '@/lib/logStore'
import { AICallLog } from '@/lib/ai'
import { toast } from 'sonner'

const LOG_SEPARATOR = '\n\n<!--PAGECRAFT_LOG:'

function parseStreamResult(raw: string): { html: string; log: AICallLog | null } {
  const sepIdx = raw.indexOf(LOG_SEPARATOR)
  if (sepIdx === -1) return { html: raw, log: null }
  const html = raw.slice(0, sepIdx)
  try {
    const jsonStr = raw.slice(sepIdx + LOG_SEPARATOR.length, raw.lastIndexOf('-->'))
    const log = JSON.parse(jsonStr) as AICallLog
    return { html, log }
  } catch {
    return { html, log: null }
  }
}

export default function BuilderPage() {
  const {
    page,
    setGenerating,
    addSection,
    updateSectionHtml,
    setSectionGenerating,
    setSelectedSection,
  } = useBuilderStore()

  const { addLog } = useLogStore()

  function writeLog(log: AICallLog | null, pageTitle: string, pagePrompt: string, customPrompt?: string) {
    if (!log) return
    const entry: Omit<AILogEntry, 'id'> = {
      ...log,
      timestamp: Date.now(),
      pageTitle,
      pagePrompt,
      customPrompt,
    }
    addLog(entry)
  }

  async function streamSection(
    type: SectionType,
    pagePrompt: string,
    customPrompt?: string,
    existingSectionId?: string
  ): Promise<string> {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, pagePrompt, customPrompt }),
    })

    if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let raw = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value, { stream: true })
      raw += chunk

      // Stream clean HTML to canvas (strip log trailer while streaming)
      if (existingSectionId) {
        const visibleHtml = raw.includes(LOG_SEPARATOR)
          ? raw.slice(0, raw.indexOf(LOG_SEPARATOR))
          : raw
        updateSectionHtml(existingSectionId, visibleHtml)
      }
    }

    const { html, log } = parseStreamResult(raw)
    writeLog(log, page.title, pagePrompt, customPrompt)

    // Final update with clean HTML (trailer stripped)
    if (existingSectionId) {
      updateSectionHtml(existingSectionId, html)
    }

    return html
  }

  async function handleGenerate(prompt: string) {
    setGenerating(true)
    try {
      // Step 1: classify → get ordered section list
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classify: true, pagePrompt: prompt }),
      })
      const { sections: sectionTypes, log: classifyLog } = await res.json() as {
        sections: SectionType[]
        log: AICallLog
      }
      writeLog(classifyLog, page.title, prompt)
      toast.info(`Building ${sectionTypes.length} sections in parallel…`)

      // Step 2: add ALL sections immediately as placeholders (preserves order)
      const sectionIds: string[] = []
      for (const type of sectionTypes) {
        addSection(type, `<!-- generating ${type}… -->`, prompt)
        const sections = useBuilderStore.getState().page.sections
        const newId = sections[sections.length - 1].id
        sectionIds.push(newId)
        setSectionGenerating(newId, true)
      }

      // Step 3: stream ALL sections concurrently — each updates its own slot live
      await Promise.all(
        sectionTypes.map(async (type, i) => {
          const id = sectionIds[i]
          try {
            await streamSection(type, prompt, undefined, id)
          } catch {
            updateSectionHtml(id, `<!-- Failed to generate ${type} -->`)
            toast.error(`Failed to generate ${type}`)
          } finally {
            setSectionGenerating(id, false)
          }
        })
      )

      toast.success('Page generated!')
      const first = useBuilderStore.getState().page.sections[0]
      if (first) setSelectedSection(first.id)
    } catch (err) {
      toast.error('Generation failed. Check your API key.')
      console.error(err)
    } finally {
      setGenerating(false)
    }
  }

  async function handleAddSection(type: SectionType) {
    const prompt = page.prompt || 'general purpose webpage'
    addSection(type, `<!-- generating ${type}… -->`, prompt)
    const sections = useBuilderStore.getState().page.sections
    const newSection = sections[sections.length - 1]
    setSectionGenerating(newSection.id, true)
    setSelectedSection(newSection.id)

    try {
      await streamSection(type, prompt, undefined, newSection.id)
      toast.success(`${type} section added`)
    } catch {
      updateSectionHtml(newSection.id, `<!-- Failed to generate ${type} -->`)
      toast.error(`Failed to generate ${type}`)
    } finally {
      setSectionGenerating(newSection.id, false)
    }
  }

  async function handleRegenerate(sectionId: string, customPrompt: string) {
    const section = page.sections.find((s) => s.id === sectionId)
    if (!section) return

    setSectionGenerating(sectionId, true)
    try {
      await streamSection(
        section.type,
        page.prompt || 'general purpose webpage',
        customPrompt || undefined,
        sectionId
      )
      toast.success('Section regenerated')
    } catch {
      toast.error('Regeneration failed')
    } finally {
      setSectionGenerating(sectionId, false)
    }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar onGenerate={handleGenerate} onAddSection={handleAddSection} />
        <Canvas />
        <PropertiesPanel onRegenerate={handleRegenerate} />
      </div>
    </div>
  )
}
