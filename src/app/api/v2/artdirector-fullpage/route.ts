import { NextRequest } from 'next/server'
import { getProvider } from '@/lib/ai/models'

export const runtime = 'nodejs'
export const maxDuration = 300

type FullPageRequest = {
  artDirectorModel?: string
  developerModel?: string
  industry: string
  paradigm: string
  companyName: string
  usp: string
  structurePreset?: 'bento-3col' | 'split-50' | 'centered' | 'editorial' | 'magazine-grid'
  language?: 'de' | 'en'
}

const SECTIONS = ['navbar', 'hero', 'testimonials', 'contact', 'footer'] as const

function sseEvent(obj: unknown) {
  return `data: ${JSON.stringify(obj)}\n\n`
}

function buildPageDirectorSystem(language: 'de' | 'en') {
  return language === 'de'
    ? `Du bist Creative Director für eine komplette Landing Page.\n\nAufgabe: Gib eine kreative visuelle GESAMTVISION für die Landing Page.\nRegeln:\n- Output ist reiner Text (kein HTML, kein Markdown).\n- Maximal 8 Sätze.\n- Beschreibe (1) die Gesamt-Emotion der Seite, (2) ein durchgehendes visuelles Leitmotiv, (3) wie Animationen/Bewegung eingesetzt werden, (4) Farbstimmung, (5) typografische Hierarchie.\n- Alles muss mit Tailwind CSS + einfachen CSS Animationen umsetzbar sein.`
    : `You are a creative director for a complete landing page.\n\nTask: Provide a creative visual VISION for the entire landing page.\nRules:\n- Output is plain text (no HTML, no markdown).\n- Max 8 sentences.\n- Describe (1) overall emotion, (2) one consistent visual motif, (3) how animations/motion are used, (4) color mood, (5) typographic hierarchy.\n- Everything must be implementable with Tailwind CSS + simple CSS animations.`
}

function buildSectionDeveloperSystem(language: 'de' | 'en') {
  return language === 'de'
    ? `Du bist ein Senior Frontend Engineer.
Erzeuge eine einzelne HTML Section mit Tailwind CSS.
Regeln:
- Output NUR HTML (kein Markdown, keine Erklärungen, keine Code-Fences).
- Erstes Zeichen MUSS "<" sein.
- Jede Section MUSS die Klassen "relative z-10" auf dem äußersten Tag haben.
- Verwende CSS Variablen: var(--color-accent), var(--color-background), var(--color-text).
- Icons: nur einfache inline SVGs mit stroke="currentColor" und viewBox="0 0 24 24".
- Für Headlines: nutze clamp() font-size (z.B. style="font-size:clamp(1.8rem,3.5vw,3rem)").
- Nutze data-animate="fade-up" Attribute auf Hauptelementen für Scroll-Animationen.`
    : `You are a senior frontend engineer.
Produce a single HTML section using Tailwind CSS.
Rules:
- Output ONLY raw HTML. No markdown, no code fences, no explanation.
- First character MUST be "<".
- Every section MUST have classes "relative z-10" on the outermost tag.
- Use CSS variables: var(--color-accent), var(--color-background), var(--color-text).
- Icons: only simple inline SVGs with stroke="currentColor" and viewBox="0 0 24 24".
- For headlines: use clamp() font-size.
- Use data-animate="fade-up" on main elements for scroll animations.`
}

function structureDirectiveForSection(
  section: typeof SECTIONS[number],
  preset: NonNullable<FullPageRequest['structurePreset']>,
  language: 'de' | 'en'
) {
  const de = language === 'de'
  
  if (section === 'navbar') {
    return de
      ? `NAVBAR: Sticky top-0, backdrop-blur, Logo links, Navigation mitte, CTA rechts. Max height h-16.`
      : `NAVBAR: Sticky top-0, backdrop-blur, logo left, nav center, CTA right. Max height h-16.`
  }
  
  if (section === 'hero') {
    switch (preset) {
      case 'bento-3col':
        return de
          ? `HERO (Bento 3-Spalten): grid-cols-1 lg:grid-cols-12 gap-6. Left (lg:col-span-5): Headline + Subline + CTAs. Mid (lg:col-span-3): Stats. Right (lg:col-span-4): Visual.`
          : `HERO (3-col bento): grid-cols-1 lg:grid-cols-12 gap-6. Left (lg:col-span-5): headline + subline + CTAs. Mid (lg:col-span-3): stats. Right (lg:col-span-4): visual.`
      case 'split-50':
        return de
          ? `HERO (Split 50/50): grid-cols-1 md:grid-cols-2 gap-10. Left: Headline + Subline + CTAs. Right: Visual.`
          : `HERO (Split 50/50): grid-cols-1 md:grid-cols-2 gap-10. Left: headline + subline + CTAs. Right: visual.`
      case 'centered':
        return de
          ? `HERO (Centered): max-w-3xl mx-auto text-center. Eyebrow → Headline → Subline → CTAs.`
          : `HERO (Centered): max-w-3xl mx-auto text-center. Eyebrow → headline → subline → CTAs.`
      default:
        return de
          ? `HERO: Wähle passende Struktur basierend auf der Creative Direction.`
          : `HERO: Choose appropriate structure based on creative direction.`
    }
  }
  
  if (section === 'testimonials') {
    return de
      ? `TESTIMONIALS: 2-3 Testimonial-Karten in grid-cols-1 md:grid-cols-2 lg:grid-cols-3. Jede Karte: Zitat + Name + Position. Kein Foto nötig.`
      : `TESTIMONIALS: 2-3 testimonial cards in grid-cols-1 md:grid-cols-2 lg:grid-cols-3. Each card: quote + name + position. No photo needed.`
  }
  
  if (section === 'contact') {
    return de
      ? `CONTACT: Centered max-w-2xl. Headline + kurzer Text + CTA-Button (z.B. "Termin vereinbaren"). Kein Formular, nur CTA.`
      : `CONTACT: Centered max-w-2xl. Headline + short text + CTA button (e.g. "Schedule call"). No form, just CTA.`
  }
  
  if (section === 'footer') {
    return de
      ? `FOOTER: 3-Spalten Grid (Logo + Links + Kontakt). Klein, kompakt, bg-gray-900 text-gray-400.`
      : `FOOTER: 3-column grid (logo + links + contact). Small, compact, bg-gray-900 text-gray-400.`
  }
  
  return ''
}

function buildAnimationSystem(language: 'de' | 'en') {
  return `
<!-- Hypermodern Background Animation System -->
<div class="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
  <!-- Gradient Mesh Background -->
  <div class="absolute inset-0 bg-gradient-to-br from-violet-950 via-gray-950 to-indigo-950"></div>
  
  <!-- Animated Gradient Orbs -->
  <div class="absolute top-0 -left-4 w-96 h-96 bg-violet-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
  <div class="absolute top-0 -right-4 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
  <div class="absolute -bottom-8 left-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
  
  <!-- Grid Pattern Overlay -->
  <div class="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
</div>

<style>
@keyframes blob {
  0%, 100% { transform: translate(0px, 0px) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
}
.animate-blob {
  animation: blob 7s infinite;
}
.animation-delay-2000 {
  animation-delay: 2s;
}
.animation-delay-4000 {
  animation-delay: 4s;
}

/* Scroll-triggered fade-up animations */
[data-animate="fade-up"] {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
[data-animate="fade-up"].visible {
  opacity: 1;
  transform: translateY(0);
}
</style>

<script>
// Scroll animation observer
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));
</script>
`
}

export async function POST(req: NextRequest) {
  const body = await req.json() as FullPageRequest
  const {
    artDirectorModel = 'claude-haiku-4-5',
    developerModel = 'gpt-4o-mini',
    industry,
    paradigm,
    companyName,
    usp,
    structurePreset = 'bento-3col',
    language = 'de',
  } = body

  if (!industry || !paradigm || !companyName || !usp) {
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
      // Step 1: Page-level creative direction
      write({ type: 'status', step: 'page_director', message: 'Creating overall page vision…' })
      
      const pageDirector = getProvider(artDirectorModel)
      let pageVision = ''
      await pageDirector.stream(
        {
          model: artDirectorModel,
          max_tokens: 800,
          temperature: 0.92,
          system: buildPageDirectorSystem(language),
          messages: [{
            role: 'user',
            content: `COMPANY: ${companyName}\nINDUSTRY: ${industry}\nPARADIGM: ${paradigm}\nUSP: ${usp}\n\nCreate a cohesive visual vision for the entire landing page.`,
          }],
        },
        (chunk) => {
          pageVision += chunk
          write({ type: 'vision_delta', text: chunk })
        },
        { pass: 'other', label: 'Page Director' }
      )

      write({ type: 'vision_complete', vision: pageVision.trim() })

      // Step 2: Generate each section
      const dev = getProvider(developerModel)
      const allSections: Record<string, string> = {}

      for (const section of SECTIONS) {
        write({ type: 'status', step: 'section', section, message: `Generating ${section}…` })
        
        const directive = structureDirectiveForSection(section, structurePreset, language)
        let sectionHtml = ''
        
        await dev.stream(
          {
            model: developerModel,
            max_tokens: 3500,
            temperature: 0.4,
            system: buildSectionDeveloperSystem(language),
            messages: [{
              role: 'user',
              content: `PAGE VISION:\n${pageVision.trim()}\n\n${directive}\n\nCOMPANY: ${companyName}\nINDUSTRY: ${industry}\nPARADIGM: ${paradigm}\nUSP: ${usp}\n\nGenerate the ${section} section now. Add data-animate="fade-up" to main content blocks.\nOUTPUT ONLY raw HTML starting with the opening tag. No markdown, no code fences, no explanation.`,
            }],
          },
          (chunk) => {
            sectionHtml += chunk
            write({ type: 'section_delta', section, text: chunk })
          },
          { pass: 'pass1_structure', label: `Section — ${section}` }
        )

        // Strip any markdown fences the model may have added
        const cleanHtml = sectionHtml
          .replace(/^```[\w]*\r?\n?/gm, '')
          .replace(/^```\s*$/gm, '')
          .trim()

        allSections[section] = cleanHtml
        write({ type: 'section_complete', section, html: cleanHtml })
      }

      // Step 3: Assemble full page
      const animationSystem = buildAnimationSystem(language)
      const fullPage = `<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${companyName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    :root {
      --color-background: #0a0a0a;
      --color-surface: #111827;
      --color-primary: #1f2937;
      --color-accent: #7c3aed;
      --color-text: #f3f4f6;
      --color-text-muted: #9ca3af;
    }
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: var(--color-background);
      color: var(--color-text);
    }
    /* Ensure all direct sections are stacked above background */
    body > div > nav,
    body > div > section,
    body > div > header,
    body > div > footer,
    body > div > div {
      position: relative;
      z-index: 10;
    }
    h1, h2, h3, h4, h5, h6 { color: var(--color-text); }
    p { color: var(--color-text-muted); }
    a { color: inherit; }
  </style>
</head>
<body>
${animationSystem}
<div class="relative z-10">
${allSections.navbar || ''}
${allSections.hero || ''}
${allSections.testimonials || ''}
${allSections.contact || ''}
${allSections.footer || ''}
</div>
</body>
</html>`

      write({ type: 'complete', fullPage, vision: pageVision.trim(), sections: allSections })
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
