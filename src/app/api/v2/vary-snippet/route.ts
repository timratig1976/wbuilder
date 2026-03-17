import { NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

const VARIATION_SYSTEM = `You are an expert Tailwind CSS UI developer. 
You receive an HTML section snippet and a variation instruction.
Your job: produce a modified version of the snippet applying the instruction.
Rules:
- Keep the same semantic structure and content
- Only change visual styling (classes, colors, layout direction, decoration)
- Output ONLY the raw HTML — no markdown, no explanation, no code fences
- Preserve all Tailwind classes that are not affected by the variation
- Use inline CSS variables var(--color-accent), var(--color-primary) for colors when needed`

export async function POST(req: NextRequest) {
  const { html, instruction, count = 2 } = await req.json() as {
    html: string
    instruction: string
    count?: number
  }

  if (!html || !instruction) {
    return Response.json({ error: 'Missing html or instruction' }, { status: 400 })
  }

  const clampedCount = Math.min(Math.max(1, count), 4)

  const OpenAI = (await import('openai')).default
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const variations: string[] = []

  for (let i = 0; i < clampedCount; i++) {
    try {
      const resp = await client.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 4000,
        temperature: 0.7 + i * 0.1, // slight temperature bump per variation for diversity
        messages: [
          { role: 'system', content: VARIATION_SYSTEM },
          {
            role: 'user',
            content: `VARIATION INSTRUCTION: ${instruction}${clampedCount > 1 ? ` (variation ${i + 1} of ${clampedCount} — make each one distinct)` : ''}\n\nORIGINAL HTML:\n${html.slice(0, 8000)}`,
          },
        ],
      })
      const raw = resp.choices[0]?.message?.content ?? ''
      // Strip any accidental markdown fences
      const clean = raw.replace(/^```[\w]*\n?/m, '').replace(/\n?```$/m, '').trim()
      if (clean) variations.push(clean)
    } catch (err) {
      console.error(`[vary-snippet] variation ${i + 1} failed:`, err)
    }
  }

  return Response.json({ variations })
}
