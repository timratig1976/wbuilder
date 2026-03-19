import { SiteManifest, ValidationResult } from '../types/manifest'
import { loadStyleDictionary } from '../style/styleDictionary'
import { findBestSection } from '../sections/sectionLibrary'
import { provider, MODEL_CONFIG } from '../ai/models'
import { safeParseJson, applyAutoFixes, sanitizeImagePaths, resolveNavbarPlaceholders, enforceNavOpener } from './autoFix'
import { designSpecFromDict } from '../style/styleDictionary'
import {
  buildPass1System, buildPass1User, resolveLayoutId,
  buildPass2System, buildPass2User,
  buildPass3User, PASS3_SYSTEM,
  COHERENCE_SYSTEM, buildCoherenceUser,
  MANIFEST_SYSTEM, buildManifestPrompt,
  SectionPositionContext,
} from './prompts'

export interface GeneratedSection {
  sectionType: string
  pass1Html: string
  pass2Html: string | null
  validation: ValidationResult | null
  finalHtml: string
  score: number
}

// ═══════════════════════════════════════════════════════
// generateSection — full 3-pass pipeline for one section
// ═══════════════════════════════════════════════════════

export async function generateSection(
  sectionType: string,
  manifest: SiteManifest,
  onProgress?: (event: { pass: number; html?: string }) => void,
  posCtx?: SectionPositionContext,
  pageIndex?: number
): Promise<GeneratedSection> {
  const dict = loadStyleDictionary(manifest.style_dictionary_ref)
  const referenceHtml = findBestSection(sectionType, manifest.style_paradigm, manifest.site.industry, manifest.visual_tone, manifest.navbar?.behaviour)

  // ── Pass 1: Structure ─────────────────────────────────
  onProgress?.({ pass: 1 })
  const layoutId = resolveLayoutId(sectionType, manifest)
  let pass1Html = await provider.complete(
    {
      ...MODEL_CONFIG.pass1_structure,
      temperature: sectionType === 'navbar' ? 0.7 : MODEL_CONFIG.pass1_structure.temperature,
      system: buildPass1System(dict, manifest, sectionType),
      messages: [{ role: 'user', content: buildPass1User(sectionType, manifest, referenceHtml, posCtx, pageIndex) }],
    },
    { pass: 'pass1_structure', label: `Pass 1 — ${sectionType} structure [layout:${layoutId ?? 'none'}]` }
  )
  if (sectionType === 'navbar') {
    const nav = manifest.navbar
    const effectiveBehaviour = nav.behaviour ?? (nav.style === 'transparent-hero' ? 'overlay-hero' : nav.style === 'hidden-scroll' ? 'hide-on-scroll' : 'sticky')
    const effectiveVisual = nav.visual ?? (nav.style === 'sticky-blur' ? 'blur' : nav.style === 'transparent-hero' ? 'transparent' : 'solid')
    pass1Html = enforceNavOpener(pass1Html, effectiveBehaviour, effectiveVisual, nav.height)
  }
  pass1Html = resolveNavbarPlaceholders(pass1Html)
  onProgress?.({ pass: 1, html: pass1Html })

  // ── Pass 2: Visual layer (skip only for navbar/footer chrome) ──
  // budget:none suppresses animations but NOT the visual layer — desktop layout/depth always needs Pass 2
  const isChrome = sectionType === 'navbar' || sectionType === 'footer'
  const hasPlaceholders = pass1Html.includes('<!-- [ANIM:') || pass1Html.includes('<!-- [BG:')
  let pass2Html: string | null = null
  if (!isChrome) {
    onProgress?.({ pass: 2 })
    pass2Html = await provider.complete(
      {
        ...MODEL_CONFIG.pass2_visual,
        system: buildPass2System(dict),
        messages: [{ role: 'user', content: buildPass2User(pass1Html) }],
      },
      { pass: 'pass2_visual', label: `Pass 2 — ${sectionType} visual layer` }
    )
    onProgress?.({ pass: 2, html: pass2Html })
  }

  // ── Pass 3: Validation ────────────────────────────────
  onProgress?.({ pass: 3 })
  const htmlToValidate = pass2Html ?? pass1Html
  const validationRaw = await provider.complete(
    {
      ...MODEL_CONFIG.pass3_validator,
      system: PASS3_SYSTEM,
      messages: [{ role: 'user', content: buildPass3User(htmlToValidate, manifest.pass3_auto_flags) }],
    },
    { pass: 'pass3_validator', label: `Pass 3 — ${sectionType} validation` }
  )

  const validation = safeParseJson<ValidationResult>(validationRaw)

  // ── Auto-fix + finalize ───────────────────────────────
  let finalHtml = htmlToValidate
  if (validation) {
    finalHtml = applyAutoFixes(htmlToValidate, validation)
  }

  return {
    sectionType,
    pass1Html,
    pass2Html,
    validation,
    finalHtml,
    score: validation?.score ?? 80,
  }
}

// ═══════════════════════════════════════════════════════
// generateSection with streaming (for SSE route)
// ═══════════════════════════════════════════════════════

interface RegenOptions {
  customPrompt?: string
  existingHtml?: string
  mode?: 'full' | 'content-edit'
  seed?: number
  layoutId?: string
}

export async function generateSectionStreamed(
  sectionType: string,
  manifest: SiteManifest,
  writer: {
    write: (data: string) => void
    close: () => void
  },
  posCtx?: SectionPositionContext,
  pageIndex?: number,
  regenOptions?: RegenOptions
): Promise<void> {
  const dict = loadStyleDictionary(manifest.style_dictionary_ref)
  const referenceHtml = findBestSection(sectionType, manifest.style_paradigm, manifest.site.industry, manifest.visual_tone, manifest.navbar?.behaviour)
  const { customPrompt, existingHtml, mode = 'full', seed, layoutId: requestedLayoutId } = regenOptions ?? {}
  const chosenLayoutId = resolveLayoutId(sectionType, manifest, seed, requestedLayoutId)

  const send = (event: object) => writer.write(`data: ${JSON.stringify(event)}\n\n`)

  // Forward log entries from the provider through SSE so the client can display them
  provider.onLog = (entry) => send({ type: 'log', entry })

  try {
    // ── content-edit mode: surgical text-only rewrite, no layout changes ──────
    if (mode === 'content-edit' && existingHtml && customPrompt) {
      send({ type: 'status', pass: 1, section: sectionType, message: 'Applying content edit...' })
      let editedHtml = ''
      await provider.stream(
        {
          ...MODEL_CONFIG.pass1_structure,
          model: 'gpt-5-mini',
          max_tokens: 8000,
          temperature: 0.2,
          system: `You are a precise HTML editor. You receive existing section HTML and a change instruction.
Your job: apply ONLY the requested change. Never touch classes, layout, colors, or structure.
Only modify text content inside elements (h1, h2, h3, p, a, span, li, button text).
Output ONLY the full modified HTML. No markdown, no explanation.`,
          messages: [{ role: 'user', content: `CHANGE INSTRUCTION: ${customPrompt}\n\nEXISTING HTML:\n${existingHtml}` }],
        },
        (chunk) => { editedHtml += chunk },
        { pass: 'pass1_structure', label: `Content edit — ${sectionType}` }
      )
      editedHtml = sanitizeImagePaths(editedHtml)
      send({ type: 'pass1', section: sectionType, html: editedHtml })
      send({ type: 'complete', section: sectionType, html: editedHtml, score: 90 })
      return
    }

    // Pass 1
    send({ type: 'status', pass: 1, section: sectionType, message: `Generating structure... [layout:${chosenLayoutId ?? 'none'}]` })
    let pass1Html = ''
    // Append customPrompt as additional instruction when provided
    const pass1UserMsg = buildPass1User(sectionType, manifest, referenceHtml, posCtx, pageIndex, seed, requestedLayoutId)
      + (customPrompt ? `\n\nADDITIONAL INSTRUCTION (apply this on top of the standard rules): ${customPrompt}` : '')
    await provider.stream(
      {
        ...MODEL_CONFIG.pass1_structure,
        temperature: sectionType === 'navbar' ? 0.7 : MODEL_CONFIG.pass1_structure.temperature,
        system: buildPass1System(dict, manifest, sectionType),
        messages: [{ role: 'user', content: pass1UserMsg }],
      },
      (chunk) => { pass1Html += chunk },
      { pass: 'pass1_structure', label: `Pass 1 — ${sectionType} structure` }
    )
    if (sectionType === 'navbar') {
      const nav = manifest.navbar
      const effectiveBehaviour = nav.behaviour ?? (nav.style === 'transparent-hero' ? 'overlay-hero' : nav.style === 'hidden-scroll' ? 'hide-on-scroll' : 'sticky')
      const effectiveVisual = nav.visual ?? (nav.style === 'sticky-blur' ? 'blur' : nav.style === 'transparent-hero' ? 'transparent' : 'solid')
      pass1Html = enforceNavOpener(pass1Html, effectiveBehaviour, effectiveVisual, nav.height)
    }
    pass1Html = sanitizeImagePaths(resolveNavbarPlaceholders(pass1Html))
    send({ type: 'pass1', section: sectionType, html: pass1Html, layoutId: chosenLayoutId })

    // Pass 2 — skip only for navbar/footer (chrome elements)
    // budget:none suppresses animations but NOT the visual layer — desktop layout/depth always needs Pass 2
    let finalHtml = pass1Html
    const isChrome = sectionType === 'navbar' || sectionType === 'footer'
    const hasPlaceholders = pass1Html.includes('<!-- [ANIM:') || pass1Html.includes('<!-- [BG:')
    if (!isChrome) {
      send({ type: 'status', pass: 2, section: sectionType, message: 'Adding visual layer...' })
      let pass2Html = ''
      await provider.stream(
        {
          ...MODEL_CONFIG.pass2_visual,
          system: buildPass2System(dict),
          messages: [{ role: 'user', content: buildPass2User(pass1Html) }],
        },
        (chunk) => { pass2Html += chunk },
        { pass: 'pass2_visual', label: `Pass 2 — ${sectionType} visual layer` }
      )
      finalHtml = sanitizeImagePaths(pass2Html)
      send({ type: 'pass2', section: sectionType, html: finalHtml })
    }

    // Pass 3
    send({ type: 'status', pass: 3, section: sectionType, message: 'Validating...' })
    try {
      const validationRaw = await provider.complete(
        {
          ...MODEL_CONFIG.pass3_validator,
          system: PASS3_SYSTEM,
          messages: [{ role: 'user', content: buildPass3User(finalHtml, manifest.pass3_auto_flags) }],
        },
        { pass: 'pass3_validator', label: `Pass 3 — ${sectionType} validation` }
      )
      const validation = safeParseJson<ValidationResult>(validationRaw)
      if (validation) {
        finalHtml = applyAutoFixes(finalHtml, validation)
      }
    } catch (err) {
      send({ type: 'status', pass: 3, section: sectionType, message: 'Validation skipped' })
    }

    send({ type: 'complete', section: sectionType, html: finalHtml, score: 80, layoutId: chosenLayoutId })
  } finally {
    writer.close()
  }
}

// ═══════════════════════════════════════════════════════
// generatePage — all sections sequentially with position
// context, then a coherence pass over the full page
// ═══════════════════════════════════════════════════════

export async function generatePage(
  pageId: string,
  manifest: SiteManifest,
  onSectionDone?: (section: GeneratedSection) => void
): Promise<GeneratedSection[]> {
  const page = manifest.pages.find((p) => p.id === pageId)
  if (!page) throw new Error(`Page not found: ${pageId}`)

  const dict = loadStyleDictionary(manifest.style_dictionary_ref)
  const bgSeq = dict.rules.color.section_bg_sequence ?? ['background', 'surface']

  // Build position-aware bg token assignments upfront
  // Navbar/footer are excluded from the sequence
  const contentSections = page.sections.filter((s) => s !== 'navbar' && s !== 'footer')
  const bgAssignments: Record<number, string> = {}
  contentSections.forEach((_, i) => {
    bgAssignments[i] = bgSeq[i % bgSeq.length]
  })

  // Generate sections sequentially to keep position context accurate
  const results: GeneratedSection[] = []
  let contentIdx = 0
  for (const sectionType of page.sections) {
    const isContent = sectionType !== 'navbar' && sectionType !== 'footer'
    const posCtx: SectionPositionContext | undefined = isContent ? {
      position: contentIdx,
      total: contentSections.length,
      prevBg: contentIdx > 0 ? bgAssignments[contentIdx - 1] : undefined,
      nextBg: bgAssignments[contentIdx + 1],
    } : undefined

    const result = await generateSection(sectionType, manifest, undefined, posCtx)
    if (isContent) contentIdx++
    onSectionDone?.(result)
    results.push(result)
  }

  // ── Coherence pass: fix cross-section bg/decoration issues ──
  const bgMode = dict.rules.color.bg_animation_mode ?? 'none'
  if (bgMode !== 'none' || bgSeq.length > 1) {
    try {
      const fullPageHtml = results.map((r) => r.finalHtml).join('\n')
      const correctedPage = await provider.complete(
        {
          ...MODEL_CONFIG.pass1_structure,
          system: COHERENCE_SYSTEM,
          messages: [{ role: 'user', content: buildCoherenceUser(fullPageHtml, bgSeq, bgMode) }],
        },
        { pass: 'coherence', label: 'Page coherence pass' }
      )
      // Split corrected HTML back into per-section results by matching opening tags
      // If split fails gracefully fall back to original results
      if (correctedPage.trim().length > 100) {
        const splitBack = splitPageIntoSections(correctedPage, results)
        splitBack.forEach((html, i) => { results[i] = { ...results[i], finalHtml: sanitizeImagePaths(html) } })
      }
    } catch {
      // Coherence pass failure is non-fatal
    }
  }

  return results
}

// Split a full-page HTML string back into per-section chunks
// by finding the opening tag of each section's finalHtml
function splitPageIntoSections(fullHtml: string, origResults: GeneratedSection[]): string[] {
  if (origResults.length === 0) return []
  const splits: string[] = []
  let remaining = fullHtml

  for (let i = 0; i < origResults.length; i++) {
    if (i === origResults.length - 1) {
      splits.push(remaining)
      break
    }
    // Find the opening tag of the NEXT section
    const nextOpenTag = origResults[i + 1].finalHtml.match(/^<(\w+)/)?.[0]
    if (!nextOpenTag) { splits.push(remaining); break }
    const splitIdx = remaining.indexOf('\n' + nextOpenTag)
    if (splitIdx === -1) { splits.push(remaining); break }
    splits.push(remaining.slice(0, splitIdx))
    remaining = remaining.slice(splitIdx + 1)
  }

  // If we got fewer splits than expected, pad with originals
  while (splits.length < origResults.length) {
    splits.push(origResults[splits.length].finalHtml)
  }
  return splits
}

// ═══════════════════════════════════════════════════════
// generateManifest — BriefingInput → SiteManifest JSON
// ═══════════════════════════════════════════════════════

export async function generateManifest(input: Parameters<typeof buildManifestPrompt>[0]): Promise<SiteManifest> {
  const raw = await provider.complete({
    ...MODEL_CONFIG.manifest_generation,
    system: MANIFEST_SYSTEM,
    messages: [{ role: 'user', content: buildManifestPrompt(input) }],
  })

  const parsed = safeParseJson<SiteManifest>(raw)
  if (!parsed) throw new Error('Manifest generation failed: invalid JSON response')

  // Ensure required fields have defaults if AI omitted them
  if (!parsed.pass1_prompt_rules?.rules?.length) {
    parsed.pass1_prompt_rules = {
      rules: [
        'NO inline style for layout — Tailwind classes only',
        'Every grid: grid-cols-1 base, then md:/lg: breakpoints',
        'min-h-screen ALWAYS as md:min-h-screen',
      ]
    }
  }
  if (!parsed.pass3_auto_flags?.length) {
    parsed.pass3_auto_flags = [
      "style='' contains grid/flex — layout in inline style",
      'grid-cols-X without grid-cols-1 — no mobile-first grid',
    ]
  }

  // Ensure visual_tone is set — AI may omit it for older prompts
  if (!parsed.visual_tone) parsed.visual_tone = input.visual_tone as SiteManifest['visual_tone'] ?? 'confident'

  // Auto-populate design_spec from the resolved style dictionary
  // This makes component-level design rules first-class manifest data
  if (!parsed.design_spec && parsed.style_dictionary_ref) {
    try {
      const dict = loadStyleDictionary(parsed.style_dictionary_ref)
      parsed.design_spec = designSpecFromDict(dict)
    } catch { /* non-fatal if dictionary not found */ }
  }

  return parsed
}
