import { NextRequest } from 'next/server'
import { getProvider } from '@/lib/ai/models'
import {
  buildConversionStrategistSystem,
  buildArtDirectorSystem,
  buildFotografSystem,
  buildAnimationsguruSystem,
  tryParseJson,
} from '../prompts'

export const runtime = 'nodejs'
export const maxDuration = 120

function sseEvent(obj: unknown) {
  return `data: ${JSON.stringify(obj)}\n\n`
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    artDirectorModel = 'claude-sonnet-4-6',
    fastModel = 'gpt-5.4-mini-2026-03-17',
    industry, paradigm, companyName, usp,
    language = 'de',
    contentInventory,
    animationBudget = 'moderate',
    retryCall,
    feedback = '',
    previousDirection = '',
  } = body

  if (!industry || !companyName || !usp) {
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
      // Call 1: Conversion Strategist
      if (!retryCall || retryCall === 1) {
        write({ type: 'status', call: 1 })
        let raw = ''
        await getProvider(fastModel).stream(
          {
            model: fastModel, max_tokens: 800, temperature: 0.2,
            system: buildConversionStrategistSystem(language),
            messages: [{ role: 'user', content: `COMPANY: ${companyName}\nINDUSTRY: ${industry}\nUSP: ${usp}\nPARADIGM: ${paradigm}\nLANGUAGE: ${language}${contentInventory ? `\nCONTENT INVENTORY: ${JSON.stringify(contentInventory)}` : ''}` }],
          },
          (c) => { raw += c },
          { pass: 'other', label: 'phase1 Call 1' }
        )
        const blueprint = tryParseJson(raw, {
          strongestHook: usp, painPoint: '', solutionFrame: usp, proofType: 'stats',
          conversionBlockers: [], ctaApproach: language === 'de' ? 'Jetzt starten' : 'Get started',
          sectionOrder: 'Problem → Solution → Proof → CTA',
        })
        write({ type: 'call_complete', call: 1, blueprint })
      }

      // Call 2: Art Director
      if (!retryCall || retryCall === 2) {
        write({ type: 'status', call: 2 })
        let artDirection = ''
        const feedbackBlock = feedback && previousDirection
          ? `\n\nPREVIOUS DIRECTION (rejected by customer):\n${previousDirection}\n\nCUSTOMER FEEDBACK:\n${feedback}\n\nIMPORTANT: Respond to the feedback. Do NOT repeat the previous direction. Create something genuinely different that addresses the customer's note while staying within the paradigm constraints.`
          : feedback
          ? `\n\nCUSTOMER NOTE: ${feedback}\nTake this into account in your direction.`
          : ''
        await getProvider(artDirectorModel).stream(
          {
            model: artDirectorModel, max_tokens: 600, temperature: 0.92,
            system: buildArtDirectorSystem(language),
            messages: [{ role: 'user', content: `SECTION: hero\nINDUSTRY: ${industry}\nPARADIGM: ${paradigm}\nUSP: ${usp}${feedbackBlock}` }],
          },
          (c) => { artDirection += c; write({ type: 'art_direction_delta', text: c }) },
          { pass: 'other', label: 'phase1 Call 2' }
        )
        write({ type: 'call_complete', call: 2, artDirection: artDirection.trim() })

        // Calls 3+4 parallel after AD (need artDirection)
        if (!retryCall || retryCall === 3 || retryCall === 4) {
          write({ type: 'status', call: 3 })
          let fotografRaw = ''
          let animRaw = ''
          await Promise.all([
            getProvider(fastModel).stream(
              {
                model: fastModel, max_tokens: 600, temperature: 0.7,
                system: buildFotografSystem(language),
                messages: [{ role: 'user', content: `SECTION: hero\nINDUSTRY: ${industry}\nPARADIGM: ${paradigm}\nUSP: ${usp}\nART DIRECTION: ${artDirection.trim()}` }],
              },
              (c) => { fotografRaw += c },
              { pass: 'other', label: 'phase1 Call 3' }
            ),
            getProvider(fastModel).stream(
              {
                model: fastModel, max_tokens: 800, temperature: 0.7,
                system: buildAnimationsguruSystem(language),
                messages: [{ role: 'user', content: `SECTION: hero\nINDUSTRY: ${industry}\nPARADIGM: ${paradigm}\nANIMATION BUDGET: ${animationBudget}\nART DIRECTION: ${artDirection.trim()}` }],
              },
              (c) => { animRaw += c },
              { pass: 'other', label: 'phase1 Call 4' }
            ),
          ])
          const imageBriefing = tryParseJson(fotografRaw, {
            mood: 'professional, clean, confident', composition: 'centered',
            subject: `${industry} environment`, avoid: 'no stock photo smiles',
            picsumSeed: industry, picsumId: 200, overlayOpacity: 0,
          })
          const animStrategy = tryParseJson(animRaw, {
            overallMotion: 'subtle', heroEntranceEffect: 'fade-up 600ms',
            backgroundAnimation: 'none', stillElements: ['headline', 'cta'],
            hoverEffects: 'opacity transition', scrollBehavior: 'none', cssPattern: '',
          })
          write({ type: 'call_complete', call: 3, imageBriefing })
          write({ type: 'call_complete', call: 4, animStrategy })
        }
      } else if (retryCall === 3 || retryCall === 4) {
        // Retry only Fotograf or Animationsguru — need stored artDirection from client
        const artDirection = body.artDirection ?? ''
        write({ type: 'status', call: 3 })
        let fotografRaw = ''
        let animRaw = ''
        await Promise.all([
          getProvider(fastModel).stream(
            {
              model: fastModel, max_tokens: 600, temperature: 0.7,
              system: buildFotografSystem(language),
              messages: [{ role: 'user', content: `SECTION: hero\nINDUSTRY: ${industry}\nPARADIGM: ${paradigm}\nUSP: ${usp}\nART DIRECTION: ${artDirection}` }],
            },
            (c) => { fotografRaw += c },
            { pass: 'other', label: 'phase1 retry Call 3' }
          ),
          getProvider(fastModel).stream(
            {
              model: fastModel, max_tokens: 800, temperature: 0.7,
              system: buildAnimationsguruSystem(language),
              messages: [{ role: 'user', content: `SECTION: hero\nINDUSTRY: ${industry}\nPARADIGM: ${paradigm}\nANIMATION BUDGET: ${animationBudget}\nART DIRECTION: ${artDirection}` }],
            },
            (c) => { animRaw += c },
            { pass: 'other', label: 'phase1 retry Call 4' }
          ),
        ])
        const imageBriefing = tryParseJson(fotografRaw, {
          mood: 'professional', composition: 'centered', subject: industry,
          avoid: 'stock photos', picsumSeed: industry, picsumId: 200, overlayOpacity: 0,
        })
        const animStrategy = tryParseJson(animRaw, {
          overallMotion: 'subtle', heroEntranceEffect: 'fade-up 600ms',
          backgroundAnimation: 'none', stillElements: ['headline', 'cta'],
          hoverEffects: 'opacity', scrollBehavior: 'none', cssPattern: '',
        })
        write({ type: 'call_complete', call: 3, imageBriefing })
        write({ type: 'call_complete', call: 4, animStrategy })
      }

      write({ type: 'phase1_complete' })
    } catch (err) {
      write({ type: 'error', message: err instanceof Error ? err.message : String(err) })
    } finally {
      close()
    }
  }

  run().catch(() => close())

  return new Response(stream.readable, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
  })
}
