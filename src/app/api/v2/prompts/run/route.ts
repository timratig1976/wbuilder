import { NextRequest } from 'next/server'
import { provider, MODEL_CONFIG } from '@/lib/ai/models'
import { sanitizeImagePaths } from '@/lib/generation/autoFix'

export const runtime = 'nodejs'
export const maxDuration = 120

export async function POST(req: NextRequest) {
  try {
    const { systemPrompt, userPrompt } = await req.json() as {
      systemPrompt: string
      userPrompt: string
    }

    if (!systemPrompt || !userPrompt) {
      return Response.json({ error: 'Missing systemPrompt or userPrompt' }, { status: 400 })
    }

    const raw = await provider.complete(
      {
        ...MODEL_CONFIG.pass1_structure,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      },
      { pass: 'pass1_structure', label: 'Prompt Inspector — manual run' }
    )

    const html = sanitizeImagePaths(raw)
    return Response.json({ html })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
