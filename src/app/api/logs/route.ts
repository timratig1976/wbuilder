import { NextRequest } from 'next/server'
import { appendLog, readRecentLogs, readRunLogs, getLastRunId, clearLogs, ServerLogEntry } from '@/lib/serverLogger'

export const runtime = 'nodejs'

/**
 * GET /api/logs              — last 100 entries
 * GET /api/logs?limit=50     — last N entries
 * GET /api/logs?runId=xxx    — all entries for a specific run
 * GET /api/logs?last=true    — all entries for the most recent full-page run
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  const runIdParam = params.get('runId')
  const lastRun = params.get('last') === 'true'

  if (lastRun) {
    const lastRunId = getLastRunId()
    if (!lastRunId) return Response.json({ count: 0, runId: null, logs: [] })
    const logs = readRunLogs(lastRunId)
    return Response.json({ count: logs.length, runId: lastRunId, logs })
  }

  if (runIdParam) {
    const logs = readRunLogs(runIdParam)
    return Response.json({ count: logs.length, runId: runIdParam, logs })
  }

  const limit = parseInt(params.get('limit') ?? '100', 10)
  const logs = readRecentLogs(limit)
  return Response.json({ count: logs.length, logs })
}

/** POST /api/logs — browser pushes its in-memory logStore entries to the server file */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const entries: ServerLogEntry[] = Array.isArray(body) ? body : body.logs ?? []
    for (const entry of entries) {
      appendLog(entry)
    }
    return Response.json({ ok: true, written: entries.length })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return Response.json({ ok: false, error: msg }, { status: 400 })
  }
}

/** DELETE /api/logs — wipe the log file */
export async function DELETE() {
  clearLogs()
  return Response.json({ ok: true })
}
