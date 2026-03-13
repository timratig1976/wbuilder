'use client'

import { Topbar } from '@/components/builder/Topbar'
import { Sidebar } from '@/components/builder/Sidebar'
import { Canvas } from '@/components/builder/Canvas'
import { PropertiesPanel } from '@/components/builder/PropertiesPanel'
import { useBuilderStore, SectionType } from '@/lib/store'
import { toast } from 'sonner'

export default function BuilderPage() {
  const {
    page,
    setGenerating,
    addSection,
    updateSectionHtml,
    setSectionGenerating,
    setSelectedSection,
  } = useBuilderStore()

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
    let html = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      html += decoder.decode(value, { stream: true })

      if (existingSectionId) {
        updateSectionHtml(existingSectionId, html)
      }
    }

    return html
  }

  async function handleGenerate(prompt: string) {
    setGenerating(true)
    try {
      // Step 1: classify intent → get section list
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classify: true, pagePrompt: prompt }),
      })
      const { sections: sectionTypes } = await res.json() as { sections: SectionType[] }
      toast.info(`Building ${sectionTypes.length} sections…`)

      // Step 2: generate each section sequentially, streaming into canvas
      for (const type of sectionTypes) {
        addSection(type, `<!-- generating ${type}… -->`, prompt)
        const sections = useBuilderStore.getState().page.sections
        const newSection = sections[sections.length - 1]
        setSectionGenerating(newSection.id, true)

        try {
          await streamSection(type, prompt, undefined, newSection.id)
        } catch (err) {
          updateSectionHtml(newSection.id, `<!-- Failed to generate ${type} -->`)
          toast.error(`Failed to generate ${type}`)
        } finally {
          setSectionGenerating(newSection.id, false)
        }
      }

      toast.success('Page generated!')
      // select first section
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
    const prompt = page.prompt || `A ${type} section`
    addSection(type, `<!-- generating ${type}… -->`, prompt)
    const sections = useBuilderStore.getState().page.sections
    const newSection = sections[sections.length - 1]
    setSectionGenerating(newSection.id, true)
    setSelectedSection(newSection.id)

    try {
      await streamSection(type, page.prompt || 'general purpose webpage', undefined, newSection.id)
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
