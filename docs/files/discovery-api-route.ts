/**
 * src/app/api/v2/discovery/route.ts
 *
 * GET  /api/v2/discovery          → Queue lesen (filter via query params)
 * POST /api/v2/discovery/ingest   → Surprises aus Vision-Ergebnis aufnehmen
 * POST /api/v2/discovery/status   → Status eines Kandidaten ändern
 * POST /api/v2/discovery/formalize → Approved → DesignPattern
 * GET  /api/v2/discovery/trends   → Trend-Daten
 */

import { NextRequest } from 'next/server'
import {
  ingestSurprises,
  getQueue,
  updateStatus,
  formalize,
  getTrends,
  getStats,
} from '@/lib/discovery/discoveryQueue'
import { detectAnomalies, updateBaseline, loadBaseline, saveBaseline } from '@/lib/discovery/anomalyDetector'
import { savePatterns, loadAll as loadPatterns } from '@/lib/patterns/patternLibrary'

export const runtime = 'nodejs'

// ── GET — Queue lesen ──────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const view = searchParams.get('view') ?? 'queue'

  if (view === 'trends') {
    return Response.json({ trends: getTrends(), stats: getStats() })
  }

  if (view === 'stats') {
    return Response.json(getStats())
  }

  // Queue mit optionalem Filter
  const queue = getQueue({
    status:       searchParams.get('status')       as any ?? undefined,
    category:     searchParams.get('category')     ?? undefined,
    reusability:  searchParams.get('reusability')  ?? undefined,
    minSeenCount: searchParams.get('minSeen')
      ? parseInt(searchParams.get('minSeen')!)
      : undefined,
  })

  return Response.json({ queue, stats: getStats() })
}

// ── POST — verschiedene Aktionen ───────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { action, ...body } = await req.json()

  switch (action) {

    // Nach dem Scraping: surprises + anomalies aufnehmen
    case 'ingest': {
      const { fingerprint, cssData } = body

      // 1. Vision surprises direkt ingesten
      const visionResult = fingerprint.surprises?.length
        ? ingestSurprises(fingerprint.surprises, fingerprint)
        : { added: 0, incremented: 0 }

      // 2. Anomaly detection auf CSS-Daten
      let anomalyResult = { added: 0, incremented: 0 }
      if (cssData) {
        const baseline  = loadBaseline()
        const anomalies = detectAnomalies(cssData, baseline)
        if (anomalies.length) {
          anomalyResult = ingestSurprises(anomalies, fingerprint)
        }
        // Baseline mit dieser Site updaten
        const updated = updateBaseline(cssData, baseline)
        saveBaseline(updated)
      }

      return Response.json({
        vision:  visionResult,
        anomaly: anomalyResult,
        total_added: visionResult.added + anomalyResult.added,
        stats:   getStats(),
      })
    }

    // Status eines Kandidaten ändern
    case 'status': {
      const { id, status, reviewer_note } = body
      const updated = updateStatus(id, status, reviewer_note)
      if (!updated) return Response.json({ error: 'not found' }, { status: 404 })
      return Response.json({ entry: updated, stats: getStats() })
    }

    // Approved → formalisiertes DesignPattern
    case 'formalize': {
      const { id, overrides } = body
      try {
        const pattern = formalize(id, overrides ?? {})
        // Pattern direkt in patterns.json speichern
        savePatterns([pattern])
        return Response.json({ pattern, stats: getStats() })
      } catch (e) {
        return Response.json({ error: String(e) }, { status: 400 })
      }
    }

    default:
      return Response.json({ error: `Unknown action: ${action}` }, { status: 400 })
  }
}
