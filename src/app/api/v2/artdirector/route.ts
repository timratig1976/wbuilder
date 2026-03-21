import { NextRequest } from 'next/server'
import { getProvider } from '@/lib/ai/models'

export const runtime = 'nodejs'
export const maxDuration = 180

type ArtDirectorRequest = {
  artDirectorModel?: string
  developerModel?: string
  sectionType: string
  industry: string
  paradigm: string
  usp: string
  structurePreset?:
    | 'bento-3col'
    | 'split-50'
    | 'centered'
    | 'editorial'
    | 'magazine-grid'
  accent?: string
  language?: 'de' | 'en'
}

function sseEvent(obj: unknown) {
  return `data: ${JSON.stringify(obj)}\n\n`
}

function buildArtDirectorSystem(language: 'de' | 'en') {
  return language === 'de'
    ? `Du bist Creative Director in einem preisgekrönten Digitalstudio.\n\nAufgabe: Gib eine kreative visuelle DIREKTION für eine Website-Section.\nRegeln:\n- Output ist reiner Text (keine Listen mit 20 Items, keine HTML, kein Markdown).\n- Maximal 6 Sätze.\n- Beschreibe (1) Emotion, (2) ein visuelles Leitmotiv, (3) eine unerwartete aber umsetzbare Design-Entscheidung, (4) 2 konkrete Details zu Typografie/Spacing.\n- Alles muss mit Tailwind CSS umsetzbar sein.`
    : `You are a creative director at an award-winning digital studio.\n\nTask: Provide a creative visual DIRECTION for a website section.\nRules:\n- Output is plain text (no HTML, no markdown).\n- Max 6 sentences.\n- Describe (1) emotion, (2) one visual motif, (3) one unexpected but implementable design decision, (4) 2 concrete typography/spacing details.\n- Everything must be implementable with Tailwind CSS.`
}

function buildDeveloperSystem(language: 'de' | 'en') {
  return language === 'de'
    ? `Du bist ein Senior Frontend Engineer.\nErzeuge eine einzelne HTML Section mit Tailwind CSS Klassen.\nRegeln:\n- Output NUR HTML (kein Markdown, keine Erklärungen).\n- Keine externen Assets außer https URLs.\n- Verwende CSS Variablen: var(--color-accent) für Akzent, var(--color-background) und var(--color-text) wenn nötig.\n- Icons: Nutze nur einfache inline SVGs mit stroke=\"currentColor\" und viewBox=\"0 0 24 24\". Erfinde keine komplexen Pfade.\n- Für deutsche Headlines: nutze font-size via clamp() (z.B. style=\"font-size:clamp(1.8rem,3.5vw,3rem)\").\n- Halte die Section kompakt: eine Headline, eine Subline, max 2 CTAs, max 3 Trust/Stats Elemente.`
    : `You are a senior frontend engineer.\nProduce a single HTML section using Tailwind CSS classes.\nRules:\n- Output ONLY raw HTML (no markdown, no explanations).\n- No external assets except https URLs.\n- Use CSS variables: var(--color-accent) for accent, var(--color-background) and var(--color-text) if needed.\n- Icons: only simple inline SVGs with stroke=\"currentColor\" and viewBox=\"0 0 24 24\". Do not invent complex paths.\n- For German headlines: use clamp() font-size (e.g. style=\"font-size:clamp(1.8rem,3.5vw,3rem)\").\n- Keep it compact: one headline, one subline, max 2 CTAs, max 3 trust/stats elements.`
}

function structureDirective(preset: NonNullable<ArtDirectorRequest['structurePreset']>, language: 'de' | 'en') {
  const de = language === 'de'
  switch (preset) {
    case 'bento-3col':
      return de
        ? `STRUKTUR-PRESET (NICHT VERHANDELBAR): Bento 3-Spalten.\n- Outer: <section> → <div class=\"max-w-6xl mx-auto\">\n- Grid: grid-cols-1 lg:grid-cols-12 gap-6\n- Left (lg:col-span-5): Headline + Subline + CTAs\n- Mid  (lg:col-span-3): Stats-Karte (nur Zahlen + Labels, max 4)\n- Right(lg:col-span-4): Visual-Karte (ein Bild/Screenshot)\n- Optional Bottom row: lg:col-span-12 kleine Trust-Logos (max 5)\nHalte jede Karte EIN Content-Typ.`
        : `STRUCTURE PRESET (NON-NEGOTIABLE): 3-column bento.\n- Outer: <section> → <div class=\"max-w-6xl mx-auto\">\n- Grid: grid-cols-1 lg:grid-cols-12 gap-6\n- Left (lg:col-span-5): headline + subline + CTAs\n- Mid  (lg:col-span-3): stats card (numbers + labels only, max 4)\n- Right(lg:col-span-4): visual card (one image/screenshot)\n- Optional bottom: lg:col-span-12 trust logo strip (max 5)\nKeep each card ONE content type.`
    case 'split-50':
      return de
        ? `STRUKTUR-PRESET (NICHT VERHANDELBAR): Split 50/50.\n- Grid: grid-cols-1 md:grid-cols-2 gap-10 items-center\n- Left: Headline + Subline + CTAs + 1 kurze Trust-Zeile\n- Right: eine große Visual-Kachel (Bild) mit leichter Caption\nKeine Bento-Karten, keine extra Reihen.`
        : `STRUCTURE PRESET (NON-NEGOTIABLE): Split 50/50.\n- Grid: grid-cols-1 md:grid-cols-2 gap-10 items-center\n- Left: headline + subline + CTAs + 1 short trust line\n- Right: one large visual card (image) with a small caption\nNo bento cards, no extra rows.`
    case 'centered':
      return de
        ? `STRUKTUR-PRESET (NICHT VERHANDELBAR): Centered Hero.\n- Single column: max-w-3xl mx-auto text-center\n- Reihenfolge: Eyebrow → Headline → Subline → CTAs → kleine Trust-Zeile\n- Kein Bild, keine Side-by-side Layouts.`
        : `STRUCTURE PRESET (NON-NEGOTIABLE): Centered hero.\n- Single column: max-w-3xl mx-auto text-center\n- Order: eyebrow → headline → subline → CTAs → small trust line\n- No image, no side-by-side layouts.`
    case 'editorial':
      return de
        ? `STRUKTUR-PRESET (NICHT VERHANDELBAR): Editorial Split.\n- Grid: grid-cols-1 lg:grid-cols-12 gap-10\n- Left (lg:col-span-6): typografisch stark (Headline/Subline/CTA)\n- Right(lg:col-span-6): Portrait/Projektbild in einem ruhigen Frame\n- Dünne Divider, viel Whitespace, keine Stats-Grid.`
        : `STRUCTURE PRESET (NON-NEGOTIABLE): Editorial split.\n- Grid: grid-cols-1 lg:grid-cols-12 gap-10\n- Left (lg:col-span-6): typography-led (headline/subline/CTA)\n- Right(lg:col-span-6): portrait/project image in a calm frame\n- Thin dividers, lots of whitespace, no stats grid.`
    case 'magazine-grid':
      return de
        ? `STRUKTUR-PRESET (NICHT VERHANDELBAR): Magazine Grid.\n- Grid: grid-cols-1 lg:grid-cols-12 gap-6\n- Hero headline block spans lg:col-span-7\n- Visual block spans lg:col-span-5 and is taller\n- Below: 3 kleine Kacheln (each lg:col-span-4) für 3 kurze Highlights\n- Strikte Hierarchie: Headline dominiert, Highlights sind kurz.`
        : `STRUCTURE PRESET (NON-NEGOTIABLE): Magazine grid.\n- Grid: grid-cols-1 lg:grid-cols-12 gap-6\n- Headline block spans lg:col-span-7\n- Visual block spans lg:col-span-5 and is taller\n- Below: 3 small highlight tiles (each lg:col-span-4)\n- Strict hierarchy: headline dominates, highlights are short.`
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json() as ArtDirectorRequest
  const {
    artDirectorModel = 'claude-haiku-4-5',
    developerModel = 'gpt-4o-mini',
    sectionType,
    industry,
    paradigm,
    usp,
    structurePreset = 'bento-3col',
    accent,
    language = 'de',
  } = body

  if (!sectionType || !industry || !paradigm || !usp) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const encoder = new TextEncoder()
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()
  let closed = false

  const write = (obj: unknown) => {
    if (closed) return
    writer.write(encoder.encode(sseEvent(obj))).catch(() => {})
  }

  const close = () => {
    if (closed) return
    closed = true
    writer.close().catch(() => {})
  }

  const run = async () => {
    try {
      write({ type: 'status', step: 'art_director', message: 'Generating creative direction…' })

      const artDirector = getProvider(artDirectorModel)
      let concept = ''
      await artDirector.stream(
        {
          model: artDirectorModel,
          max_tokens: 600,
          temperature: 0.92,
          system: buildArtDirectorSystem(language),
          messages: [{
            role: 'user',
            content: `SECTION: ${sectionType}\nINDUSTRY: ${industry}\nPARADIGM: ${paradigm}\nUSP: ${usp}${accent ? `\nACCENT: ${accent}` : ''}`,
          }],
        },
        (chunk) => {
          concept += chunk
          write({ type: 'concept_delta', text: chunk })
        },
        { pass: 'other', label: `Art Director — ${sectionType}` }
      )

      write({ type: 'status', step: 'developer', message: 'Implementing in Tailwind…' })

      const dev = getProvider(developerModel)
      let html = ''
      const directive = structureDirective(structurePreset, language)
      await dev.stream(
        {
          model: developerModel,
          max_tokens: 3500,
          temperature: 0.4,
          system: buildDeveloperSystem(language),
          messages: [{
            role: 'user',
            content: `CREATIVE DIRECTION:\n${concept.trim()}\n\n${directive}\n\nBRIEF:\n- Section: ${sectionType}\n- Industry: ${industry}\n- Paradigm: ${paradigm}\n- USP: ${usp}\n\nBuild the section now.\nOUTPUT ONLY raw HTML starting with the opening tag. No markdown, no code fences, no explanation.`,
          }],
        },
        (chunk) => {
          html += chunk
          write({ type: 'html_delta', text: chunk })
        },
        { pass: 'pass1_structure', label: `Developer — ${sectionType}` }
      )

      // Strip markdown fences if model wrapped output
      html = html.replace(/^```[\w]*\n?/m, '').replace(/\n?```$/m, '').trim()
      write({ type: 'complete', concept: concept.trim(), html, structurePreset })
    } catch (err) {
      write({ type: 'error', message: err instanceof Error ? err.message : String(err) })
    } finally {
      close()
    }
  }

  run().catch(() => close())

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
