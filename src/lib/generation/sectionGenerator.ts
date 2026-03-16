import { SiteManifest, ValidationResult } from '../types/manifest'
import { loadStyleDictionary } from '../style/styleDictionary'
import { findBestSection } from '../sections/sectionLibrary'
import { provider, MODEL_CONFIG } from '../ai/models'
import { safeParseJson, applyAutoFixes } from './autoFix'
import {
  buildPass1System, buildPass1User,
  buildPass2System, buildPass2User,
  buildPass3User, PASS3_SYSTEM,
  MANIFEST_SYSTEM, buildManifestPrompt,
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
  onProgress?: (event: { pass: number; html?: string }) => void
): Promise<GeneratedSection> {
  const dict = loadStyleDictionary(manifest.style_dictionary_ref)
  const referenceHtml = findBestSection(sectionType, manifest.style_paradigm, manifest.site.industry)

  // ── Pass 1: Structure ─────────────────────────────────
  onProgress?.({ pass: 1 })
  const pass1Html = await provider.complete(
    {
      ...MODEL_CONFIG.pass1_structure,
      system: buildPass1System(dict, manifest),
      messages: [{ role: 'user', content: buildPass1User(sectionType, manifest, referenceHtml) }],
    },
    { pass: 'pass1_structure', label: `Pass 1 — ${sectionType} structure` }
  )
  onProgress?.({ pass: 1, html: pass1Html })

  // ── Pass 2: Visual layer (skip if budget=none AND no placeholders) ──
  const hasPlaceholders = pass1Html.includes('<!-- [ANIM:') || pass1Html.includes('<!-- [BG:')
  let pass2Html: string | null = null
  if (dict.rules.animation.budget !== 'none' || hasPlaceholders) {
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

export async function generateSectionStreamed(
  sectionType: string,
  manifest: SiteManifest,
  writer: {
    write: (data: string) => void
    close: () => void
  }
): Promise<void> {
  const dict = loadStyleDictionary(manifest.style_dictionary_ref)
  const referenceHtml = findBestSection(sectionType, manifest.style_paradigm, manifest.site.industry)

  const send = (event: object) => writer.write(`data: ${JSON.stringify(event)}\n\n`)

  // Forward log entries from the provider through SSE so the client can display them
  provider.onLog = (entry) => send({ type: 'log', entry })

  try {
    // Pass 1
    send({ type: 'status', pass: 1, section: sectionType, message: 'Generating structure...' })
    let pass1Html = ''
    await provider.stream(
      {
        ...MODEL_CONFIG.pass1_structure,
        system: buildPass1System(dict, manifest),
        messages: [{ role: 'user', content: buildPass1User(sectionType, manifest, referenceHtml) }],
      },
      (chunk) => { pass1Html += chunk },
      { pass: 'pass1_structure', label: `Pass 1 — ${sectionType} structure` }
    )
    send({ type: 'pass1', section: sectionType, html: pass1Html })

    // Pass 2 — run if animation budget allows OR if there are unresolved placeholders
    let finalHtml = pass1Html
    const hasPlaceholders = pass1Html.includes('<!-- [ANIM:') || pass1Html.includes('<!-- [BG:')
    if (dict.rules.animation.budget !== 'none' || hasPlaceholders) {
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
      finalHtml = pass2Html
      send({ type: 'pass2', section: sectionType, html: pass2Html })
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

    send({ type: 'complete', section: sectionType, html: finalHtml, score: 80 })
  } finally {
    writer.close()
  }
}

// ═══════════════════════════════════════════════════════
// generatePage — all sections for one page in parallel
// ═══════════════════════════════════════════════════════

export async function generatePage(
  pageId: string,
  manifest: SiteManifest,
  onSectionDone?: (section: GeneratedSection) => void
): Promise<GeneratedSection[]> {
  const page = manifest.pages.find((p) => p.id === pageId)
  if (!page) throw new Error(`Page not found: ${pageId}`)

  const results = await Promise.all(
    page.sections.map((sectionType) =>
      generateSection(sectionType, manifest).then((result) => {
        onSectionDone?.(result)
        return result
      })
    )
  )
  return results
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

  return parsed
}
