import { NextRequest } from 'next/server'
import { getProvider } from '@/lib/ai/models'
import { buildDeveloperSystem } from '../prompts'

export const runtime = 'nodejs'
export const maxDuration = 120

type RefineRequest = {
  html: string
  qa?: {
    score?: number
    errors?: Array<{ type: string; message: string; severity: string }>
  } | null
  userNote?: string           // free-text instruction from the user
  language?: 'de' | 'en'
  developerModel?: string
  // context for the developer
  paradigm?: string
  companyName?: string
  artDirection?: string
}

export async function POST(req: NextRequest) {
  const body: RefineRequest = await req.json()
  const {
    html,
    qa,
    userNote,
    language = 'de',
    developerModel = 'claude-sonnet-4-6',
    paradigm = 'bold-expressive',
    companyName = '',
    artDirection = '',
  } = body

  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()
  const enc = new TextEncoder()

  function write(obj: Record<string, unknown>) {
    writer.write(enc.encode(`data: ${JSON.stringify(obj)}\n\n`))
  }
  function close() { writer.close() }

  async function run() {
    try {
      write({ type: 'status', message: 'Refining HTML…' })

      // Build error summary for the prompt
      const errors = qa?.errors ?? []
      const errorLines = errors.length > 0
        ? errors.map(e => `  - [${e.severity}] ${e.type}: ${e.message}`).join('\n')
        : '  (no specific QA errors — user requested visual/layout refinement)'

      const userInstruction = userNote?.trim()
        ? `\n\nUSER INSTRUCTION: "${userNote.trim()}"`
        : ''

      const devSystem = buildDeveloperSystem(language)

      const userPrompt = language === 'de'
        ? `Du erhältst eine bestehende Hero Section HTML die repariert werden muss.

KONTEXT:
- Unternehmen: ${companyName}
- Paradigma: ${paradigm}
- Art Direction: ${artDirection || 'wie im HTML ersichtlich'}

QA-SCORE VOR REPARATUR: ${qa?.score ?? '?'}/100

GEFUNDENE FEHLER:
${errorLines}${userInstruction}

AUFGABE:
Gib die VOLLSTÄNDIGE, korrigierte HTML zurück. Behalte alle funktionierenden Teile.
Ändere NUR was zur Behebung der Fehler nötig ist.
Output: NUR rohes HTML — erstes Zeichen "<", letztes Zeichen ">".

BESTEHENDE HTML:
${html}`
        : `You receive an existing hero section HTML that needs to be repaired.

CONTEXT:
- Company: ${companyName}
- Paradigm: ${paradigm}
- Art Direction: ${artDirection || 'as visible in the HTML'}

QA SCORE BEFORE REPAIR: ${qa?.score ?? '?'}/100

ERRORS FOUND:
${errorLines}${userInstruction}

TASK:
Return the COMPLETE, corrected HTML. Keep all working parts.
Change ONLY what is necessary to fix the errors.
Output: ONLY raw HTML — first character "<", last character ">".

EXISTING HTML:
${html}`

      let refined = ''
      await getProvider(developerModel).stream(
        {
          model: developerModel,
          max_tokens: 8000,
          temperature: 0.2,
          system: devSystem,
          messages: [{ role: 'user', content: userPrompt }],
        },
        (chunk) => {
          refined += chunk
          write({ type: 'html_delta', text: chunk })
        },
        { pass: 'pass1_structure', label: 'v3 Refine' }
      )

      // Strip markdown fences if model added them
      refined = refined.replace(/^```[\w]*\r?\n?/gm, '').replace(/^```\s*$/gm, '').trim()

      write({ type: 'complete', html: refined })
    } catch (err) {
      write({ type: 'error', message: err instanceof Error ? err.message : String(err) })
    } finally {
      close()
    }
  }

  run().catch(() => close())

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
