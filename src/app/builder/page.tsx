'use client'

import { Topbar } from '@/components/builder/Topbar'
import { Sidebar } from '@/components/builder/Sidebar'
import { Canvas } from '@/components/builder/Canvas'
import { PropertiesPanel } from '@/components/builder/PropertiesPanel'
import { useBuilderStore, SectionType } from '@/lib/store'
import { useLogStore } from '@/lib/logStore'
import { AICallLog, PageContext, ExistingSection } from '@/lib/ai'
import { AILogPanel } from '@/components/builder/AILogPanel'
import { toast } from 'sonner'
import { useProjectAutoSave } from '@/hooks/useProjectAutoSave'

function AutoSave() {
  useProjectAutoSave()
  return null
}

function makeRunId(): string {
  return `run-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

const LOG_SEPARATOR = '\n\n<!--PAGECRAFT_LOG:'
const ENHANCE_SEPARATOR = '\n\n<!--PAGECRAFT_ENHANCED:'

function parseStreamResult(raw: string): {
  html: string
  log: AICallLog | null
  enhancedHtml: string | null
  enhanceLog: AICallLog | null
} {
  // Find pass-1 log boundary
  const logIdx = raw.indexOf(LOG_SEPARATOR)
  const html = logIdx !== -1 ? raw.slice(0, logIdx) : raw

  let log: AICallLog | null = null
  let enhancedHtml: string | null = null
  let enhanceLog: AICallLog | null = null

  try {
    if (logIdx !== -1) {
      const enhIdx = raw.indexOf(ENHANCE_SEPARATOR)
      const logJsonStart = logIdx + LOG_SEPARATOR.length
      const logEnd = enhIdx !== -1 ? enhIdx : raw.indexOf('-->', logJsonStart)
      const logJson = raw.slice(logJsonStart, logEnd !== -1 ? logEnd : undefined)
      log = JSON.parse(logJson) as AICallLog
    }
  } catch { /* ignore */ }

  try {
    const enhIdx = raw.indexOf(ENHANCE_SEPARATOR)
    if (enhIdx !== -1) {
      const jsonStart = enhIdx + ENHANCE_SEPARATOR.length
      // Find the closing --> that ends the enhance trailer comment
      // Must search FORWARD from jsonStart so embedded --> inside HTML don't interfere
      const jsonEnd = raw.indexOf('-->', jsonStart)
      const enhJson = raw.slice(jsonStart, jsonEnd !== -1 ? jsonEnd : undefined)
      const parsed = JSON.parse(enhJson) as { html: string; log: AICallLog }
      enhancedHtml = parsed.html
      enhanceLog = parsed.log
    }
  } catch { /* ignore */ }

  return { html, log, enhancedHtml, enhanceLog }
}

export default function BuilderPage() {
  const {
    page,
    project,
    generating,
    manifest,
    setGenerating,
    addSection,
    updateSectionHtml,
    setSectionGenerating,
    setSelectedSection,
    setPagePrompt,
  } = useBuilderStore()

  const { logs, stepPauseMode, registerBreakpoint, abortBreakpoint } = useLogStore()

  function writeLog(log: AICallLog | null, pageTitle: string, pagePrompt: string, customPrompt?: string) {
    // Logging is now handled automatically by OpenAIProvider — no-op kept for legacy v1 stream path
    void log; void pageTitle; void pagePrompt; void customPrompt
  }

  /**
   * Builds a PageContext snapshot from the current page's sections.
   * Excludes placeholder/generating sections and the section being replaced.
   * Strips HTML to short snippets to keep token usage low.
   */
  function buildPageContext(
    type: SectionType,
    pagePrompt: string,
    excludeId?: string,
    insertPosition?: number,
    totalExpected?: number
  ): PageContext {
    const currentPage = useBuilderStore.getState().page
    const existingSections: ExistingSection[] = currentPage.sections
      .filter((s) => {
        if (s.id === excludeId) return false
        if (s.generating) return false
        if (s.html.startsWith('<!--')) return false // placeholder
        return true
      })
      .map((s) => ({
        type: s.type,
        label: s.label,
        htmlSnippet: s.html.slice(0, 400),
      }))
    return {
      pageTitle: currentPage.title,
      pagePrompt,
      existingSections,
      insertPosition,
      totalExpected,
    }
  }

  async function streamSection(
    type: SectionType,
    pagePrompt: string,
    customPrompt?: string,
    existingSectionId?: string,
    pageContext?: PageContext,
    runId?: string,
    runType?: string
  ): Promise<string> {
    const brand = project.brand
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, pagePrompt, customPrompt, brand, pageContext, runId, runType }),
    })

    if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let raw = ''
    let pass1Applied = false

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      raw += decoder.decode(value, { stream: true })

      // As soon as pass-1 HTML + log trailer arrives, show it on canvas immediately
      if (!pass1Applied && raw.includes(LOG_SEPARATOR)) {
        const { html: pass1Html, log: pass1Log } = parseStreamResult(raw)
        if (pass1Html.trim().length > 100) {
          pass1Applied = true
          if (existingSectionId) updateSectionHtml(existingSectionId, pass1Html)
          writeLog(pass1Log, page.title, pagePrompt, customPrompt)
        }
      }

      // As soon as enhance trailer arrives, swap to enhanced HTML
      const enhSepIdx = raw.indexOf(ENHANCE_SEPARATOR)
      if (enhSepIdx !== -1 && raw.indexOf('-->', enhSepIdx + ENHANCE_SEPARATOR.length) !== -1) {
        const { enhancedHtml, enhanceLog } = parseStreamResult(raw)
        if (enhancedHtml && enhancedHtml.trim().length > 100) {
          if (existingSectionId) updateSectionHtml(existingSectionId, enhancedHtml)
          writeLog(enhanceLog, page.title, pagePrompt, customPrompt)
          return enhancedHtml
        }
      }
    }

    // Fallback: parse full accumulated stream
    const { html, log, enhancedHtml, enhanceLog } = parseStreamResult(raw)
    if (!pass1Applied && existingSectionId && html.trim().length > 100) {
      updateSectionHtml(existingSectionId, html)
      writeLog(log, page.title, pagePrompt, customPrompt)
    }
    if (enhancedHtml && enhancedHtml.trim().length > 100) {
      if (existingSectionId) updateSectionHtml(existingSectionId, enhancedHtml)
      writeLog(enhanceLog, page.title, pagePrompt, customPrompt)
      return enhancedHtml
    }

    return html
  }

  // ── v2: manifest-based generation ─────────────────────────────────────────
  async function handleGenerateV2(manifest: NonNullable<ReturnType<typeof useBuilderStore.getState>['manifest']>) {
    if (generating) return
    setGenerating(true)
    try {
      // Use the active store page to find which sections to generate.
      // Fall back to the first manifest page if the store page has no slug match.
      const storePage = useBuilderStore.getState().page
      const manifestPage = manifest.pages.find((p) => p.slug === storePage.slug)
        ?? manifest.pages.find((p) => p.title === storePage.title)
        ?? manifest.pages[0]
      if (!manifestPage) throw new Error('No pages in manifest')

      const sectionTypes = manifestPage.sections.length > 0
        ? manifestPage.sections
        : ['hero', 'services', 'cta', 'footer']

      useBuilderStore.getState().clearSections()
      toast.info(`Generating ${sectionTypes.length} sections for "${storePage.title}" (v2 pipeline)…`)

      const sectionIds: string[] = []
      for (const sectionType of sectionTypes) {
        addSection(sectionType as SectionType, `<!-- generating ${sectionType}… -->`, '')
        const sections = useBuilderStore.getState().page.sections
        const newId = sections[sections.length - 1].id
        sectionIds.push(newId)
        setSectionGenerating(newId, true)
      }

      await Promise.all(
        sectionTypes.map(async (sectionType, i) => {
          const id = sectionIds[i]
          try {
            const res = await fetch('/api/v2/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ manifest, sectionType }),
            })
            if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)

            const reader = res.body.getReader()
            const decoder = new TextDecoder()
            let buffer = ''
            let pendingBreakpoint: Promise<void> | null = null
            let breakpointPass: 'pass1_structure' | 'pass2_visual' | null = null

            outer: while (true) {
              // If we have a pending breakpoint from the previous chunk, await it here
              // OUTSIDE the line-parsing loop so we can properly break the outer while.
              if (pendingBreakpoint) {
                try {
                  await pendingBreakpoint
                } catch {
                  // User clicked Abort
                  reader.cancel()
                  break outer
                }
                pendingBreakpoint = null
                breakpointPass = null
              }

              const { done, value } = await reader.read()
              if (done) break
              buffer += decoder.decode(value, { stream: true })
              const lines = buffer.split('\n')
              buffer = lines.pop() ?? ''

              for (const line of lines) {
                if (!line.startsWith('data: ')) continue
                try {
                  const event = JSON.parse(line.slice(6))
                  if (event.type === 'pass1' && event.html) {
                    updateSectionHtml(id, event.html)
                    if (stepPauseMode && breakpointPass !== 'pass1_structure') {
                      const { promise } = registerBreakpoint({ sectionType, sectionId: id, afterPass: 'pass1_structure' })
                      pendingBreakpoint = promise
                      breakpointPass = 'pass1_structure'
                    }
                  }
                  if (event.type === 'pass2' && event.html) {
                    updateSectionHtml(id, event.html)
                    if (stepPauseMode && breakpointPass !== 'pass2_visual') {
                      const { promise } = registerBreakpoint({ sectionType, sectionId: id, afterPass: 'pass2_visual' })
                      pendingBreakpoint = promise
                      breakpointPass = 'pass2_visual'
                    }
                  }
                  if (event.type === 'complete' && event.html) updateSectionHtml(id, event.html)
                  if (event.type === 'log' && event.entry) useLogStore.getState().upsertLog(event.entry)
                } catch { /* ignore parse errors */ }
              }
            }
          } catch {
            updateSectionHtml(id, `<!-- Failed to generate ${sectionType} -->`)
            toast.error(`Failed to generate ${sectionType}`)
          } finally {
            setSectionGenerating(id, false)
          }
        })
      )

      toast.success('v2 page generated!')
      const first = useBuilderStore.getState().page.sections[0]
      if (first) setSelectedSection(first.id)
    } catch (err) {
      toast.error('v2 generation failed.')
      console.error(err)
    } finally {
      setGenerating(false)
    }
  }

  async function handleGenerate(prompt: string) {
    // Route to v2 pipeline if a manifest is loaded
    if (manifest) { await handleGenerateV2(manifest); return }

    if (generating) return // prevent concurrent runs
    const runId = makeRunId()
    setGenerating(true)
    setPagePrompt(prompt) // persist prompt so regenerate uses it
    try {
      // Step 1: classify → get ordered section list
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classify: true, pagePrompt: prompt, runId }),
      })
      const { sections: sectionTypes, log: classifyLog } = await res.json() as {
        sections: SectionType[]
        log: AICallLog
      }
      writeLog(classifyLog, page.title, prompt)
      toast.info(`Generating ${sectionTypes.length} sections in parallel…`)

      // Clear existing sections so re-runs don't accumulate
      useBuilderStore.getState().clearSections()

      // Step 2: add ALL sections immediately as placeholders (preserves order in sidebar)
      const sectionIds: string[] = []
      for (const type of sectionTypes) {
        addSection(type, `<!-- generating ${type}… -->`, prompt)
        const sections = useBuilderStore.getState().page.sections
        const newId = sections[sections.length - 1].id
        sectionIds.push(newId)
        setSectionGenerating(newId, true)
      }

      // Step 3: generate ALL sections in parallel — each appears on canvas as it completes
      // Style consistency is maintained by the shared page prompt passed to every section
      await Promise.all(
        sectionTypes.map(async (type, i) => {
          const id = sectionIds[i]
          try {
            const ctx = buildPageContext(type, prompt, id, i, sectionTypes.length)
            await streamSection(type, prompt, undefined, id, ctx, runId, 'full-page')
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
    const beforeIds = new Set(useBuilderStore.getState().page.sections.map((s) => s.id))
    addSection(type, `<!-- generating ${type}… -->`, prompt)
    // Find the newly added section by diffing IDs — navbar inserts at [0] not at end
    const afterAddSections = useBuilderStore.getState().page.sections
    const newSection = afterAddSections.find((s) => !beforeIds.has(s.id))
    if (!newSection) return
    setSectionGenerating(newSection.id, true)
    setSelectedSection(newSection.id)

    try {
      // Always read fresh from store — avoid stale closure if manifest loaded after component mount
      const currentManifest = useBuilderStore.getState().manifest
      if (currentManifest) {
        console.log('[v2] Using manifest pipeline for', type)
        const res = await fetch('/api/v2/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ manifest: currentManifest, sectionType: type }),
        })
        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        while (true) {
          const { done, value } = await reader.read()
          if (value) buffer += decoder.decode(value, { stream: !done })
          if (done) {
            // Process final buffer contents
            const lines = buffer.split('\n')
            for (const line of lines) {
              if (!line.startsWith('data: ')) continue
              try {
                const event = JSON.parse(line.slice(6))
                if ((event.type === 'pass1' || event.type === 'pass2' || event.type === 'complete') && event.html) {
                  updateSectionHtml(newSection.id, event.html)
                }
                if (event.type === 'log' && event.entry) useLogStore.getState().upsertLog(event.entry)
              } catch { /* ignore */ }
            }
            break
          }
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            try {
              const event = JSON.parse(line.slice(6))
              if ((event.type === 'pass1' || event.type === 'pass2' || event.type === 'complete') && event.html) {
                updateSectionHtml(newSection.id, event.html)
              }
              if (event.type === 'log' && event.entry) useLogStore.getState().upsertLog(event.entry)
            } catch { /* ignore */ }
          }
        }
        toast.success(`${type} added`)
        return
      }
      // v1 fallback
      const ctx = buildPageContext(type, prompt, newSection.id, afterAddSections.length - 1)
      await streamSection(type, prompt, undefined, newSection.id, ctx, makeRunId(), 'add-section')
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
      // v2: use manifest pipeline when manifest is loaded
      const currentManifest = useBuilderStore.getState().manifest
      if (currentManifest) {
        const res = await fetch('/api/v2/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            manifest: currentManifest,
            sectionType: section.type,
            customPrompt: customPrompt || undefined,
          }),
        })
        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            try {
              const event = JSON.parse(line.slice(6))
              if ((event.type === 'pass1' || event.type === 'pass2' || event.type === 'complete') && event.html) {
                updateSectionHtml(sectionId, event.html)
              }
              if (event.type === 'log' && event.entry) useLogStore.getState().upsertLog(event.entry)
            } catch { /* ignore parse errors */ }
          }
        }
        toast.success('Section regenerated (v2)')
        return
      }

      // v1 fallback
      const prompt = page.prompt || 'general purpose webpage'
      const sectionIndex = page.sections.findIndex((s) => s.id === sectionId)
      const ctx = buildPageContext(section.type, prompt, sectionId, sectionIndex)
      await streamSection(section.type, prompt, customPrompt || undefined, sectionId, ctx, makeRunId(), 'regenerate')
      toast.success('Section regenerated')
    } catch {
      toast.error('Regeneration failed')
    } finally {
      setSectionGenerating(sectionId, false)
    }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      <AutoSave />
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar onGenerate={handleGenerate} onAddSection={handleAddSection} />
        <Canvas />
        <PropertiesPanel onRegenerate={handleRegenerate} />
        <AILogPanel />
      </div>
    </div>
  )
}
