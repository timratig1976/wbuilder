import { NextRequest } from 'next/server'
import {
  ingestSurprises,
  getQueue,
  updateStatus,
  formalize,
  getTrends,
  getStats,
  CandidateStatus,
} from '@/lib/discovery/discoveryQueue'
import { detectAnomalies, updateBaseline, loadBaseline, saveBaseline } from '@/lib/discovery/anomalyDetector'
import { addPattern, loadAll as loadPatterns } from '@/lib/patterns/patternLibrary'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const view = searchParams.get('view') ?? 'queue'

  if (view === 'trends') {
    const raw = getTrends() as Record<string, Record<string, number>>
    const now = new Date()
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const lastMonth = (() => {
      const d = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    })()
    const trends = Object.entries(raw).map(([category, months]) => {
      const recent = months[thisMonth] ?? 0
      const older  = months[lastMonth] ?? 0
      const total  = Object.values(months).reduce((s, n) => s + n, 0)
      const trend  = recent === 0 && older === 0 ? 'stable'
                   : older === 0 ? 'new'
                   : recent > older ? 'rising'
                   : recent < older ? 'declining'
                   : 'stable'
      return { category, recent, older, trend, total } as const
    })
    return Response.json({ trends })
  }

  if (view === 'stats') {
    return Response.json({ stats: getStats() })
  }

  if (view === 'patterns') {
    return Response.json({ patterns: loadPatterns() })
  }

  // Default: queue
  const queue = getQueue({
    status:        (searchParams.get('status') as CandidateStatus | undefined) ?? undefined,
    category:      searchParams.get('category') ?? undefined,
    reusability:   searchParams.get('reusability') ?? undefined,
    minSeenCount:  searchParams.get('minSeenCount') ? Number(searchParams.get('minSeenCount')) : undefined,
  })

  return Response.json({ queue, stats: getStats() })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      action: 'ingest' | 'status' | 'formalize'
      surprises?: Parameters<typeof ingestSurprises>[0]
      css_data?: Record<string, unknown>
      meta?: Parameters<typeof ingestSurprises>[1]
      id?: string
      status?: CandidateStatus
      reviewer_note?: string
      overrides?: Parameters<typeof formalize>[1]
    }

    if (body.action === 'ingest') {
      if (body.surprises?.length) {
        ingestSurprises(body.surprises, body.meta ?? {})
      }
      if (body.css_data) {
        const baseline = loadBaseline()
        const anomalies = detectAnomalies(body.css_data, baseline)
        if (anomalies.length) {
          ingestSurprises(anomalies, body.meta ?? {})
        }
        saveBaseline(updateBaseline(body.css_data, baseline))
      }
      return Response.json({ ok: true, stats: getStats() })
    }

    if (body.action === 'status') {
      if (!body.id || !body.status) {
        return Response.json({ error: 'Missing id or status' }, { status: 400 })
      }
      const updated = updateStatus(body.id, body.status, body.reviewer_note)
      if (!updated) return Response.json({ error: 'Not found' }, { status: 404 })
      return Response.json({ ok: true, candidate: updated })
    }

    if (body.action === 'formalize') {
      if (!body.id) {
        return Response.json({ error: 'Missing id' }, { status: 400 })
      }
      const pattern = formalize(body.id, body.overrides ?? {})
      if (!pattern) {
        return Response.json({ error: 'Candidate not found or not approved' }, { status: 400 })
      }
      addPattern(pattern)
      updateStatus(body.id, 'approved')
      return Response.json({ ok: true, pattern })
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    console.error('[v2/discovery]', err)
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
