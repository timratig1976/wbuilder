'use client'

/**
 * src/app/discovery/page.tsx
 *
 * Design Discovery — Review-Interface für neue Pattern-Kandidaten.
 *
 * Features:
 * - Queue anzeigen mit Filtern (pending / hot / universal / approved)
 * - Approve / Reject per Klick
 * - Formalize: approved → DesignPattern in patterns.json
 * - Trend-Übersicht pro Kategorie
 * - Live-Scraping: URL eingeben → sofort analysieren
 */

import { useState, useEffect, useCallback } from 'react'

// ─── Types ─────────────────────────────────────────────────────────────────

interface DiscoveryEntry {
  id: string
  source_url: string
  scraped_at: string
  observation: string
  category: string
  confidence: number
  css_hint: string | null
  reusability: 'universal' | 'paradigm-specific' | 'brand-specific'
  paradigm: string
  status: 'pending' | 'reviewing' | 'approved' | 'rejected'
  pattern_id: string | null
  reviewer_note: string | null
  seen_count: number
  seen_on: string[]
}

interface Trend {
  category: string
  recent: number
  older: number
  trend: 'rising' | 'declining' | 'stable' | 'new'
  total: number
}

interface Stats {
  total: number
  pending: number
  reviewing: number
  approved: number
  rejected: number
  hot: number
}

// ─── Constants ─────────────────────────────────────────────────────────────

const CAT_COLORS: Record<string, string> = {
  transition:  'bg-blue-50 text-blue-700 border-blue-200',
  animation:   'bg-green-50 text-green-700 border-green-200',
  interaction: 'bg-amber-50 text-amber-700 border-amber-200',
  decoration:  'bg-purple-50 text-purple-700 border-purple-200',
  typography:  'bg-rose-50 text-rose-700 border-rose-200',
  layout:      'bg-zinc-100 text-zinc-600 border-zinc-200',
}

const TREND_ICON: Record<string, string> = {
  rising: '↑', declining: '↓', stable: '→', new: '★'
}

type FilterType = 'all' | 'pending' | 'approved' | 'hot' | 'universal'

// ─── Main Component ─────────────────────────────────────────────────────────

export default function DiscoveryPage() {
  const [queue,   setQueue]   = useState<DiscoveryEntry[]>([])
  const [trends,  setTrends]  = useState<Trend[]>([])
  const [stats,   setStats]   = useState<Stats | null>(null)
  const [filter,  setFilter]  = useState<FilterType>('all')
  const [loading, setLoading] = useState(true)
  const [scrapeUrl,  setScrapeUrl]  = useState('')
  const [scraping,   setScraping]   = useState(false)
  const [scrapeMsg,  setScrapeMsg]  = useState('')
  const [expanding,  setExpanding]  = useState<string | null>(null)

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    const [qRes, tRes] = await Promise.all([
      fetch('/api/v2/discovery'),
      fetch('/api/v2/discovery?view=trends'),
    ])
    const qData = await qRes.json()
    const tData = await tRes.json()
    setQueue(qData.queue ?? [])
    setStats(qData.stats ?? null)
    setTrends(tData.trends ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── Actions ───────────────────────────────────────────────────────────────
  async function act(id: string, action: 'approve' | 'reject' | 'formalize') {
    if (action === 'formalize') {
      const entry = queue.find(e => e.id === id)
      if (!entry) return
      await fetch('/api/v2/discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'formalize',
          id,
          overrides: {
            type:             entry.category,
            paradigms:        [entry.paradigm],
            industries:       ['general'],
            visual_weight:    'medium',
            brand_dependency: entry.reusability === 'universal' ? 'none' : 'color-dependent',
          },
        }),
      })
    } else {
      await fetch('/api/v2/discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'status',
          id,
          status: action === 'approve' ? 'approved' : 'rejected',
        }),
      })
    }
    fetchAll()
  }

  // ── Live Scraping ─────────────────────────────────────────────────────────
  async function handleScrape() {
    if (!scrapeUrl.startsWith('http')) return
    setScraping(true)
    setScrapeMsg('Seite wird analysiert...')
    try {
      const res  = await fetch('/api/v2/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: scrapeUrl }),
      })
      const data = await res.json()
      // Fingerprint in Discovery-Pipeline einspeisen
      await fetch('/api/v2/discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ingest', fingerprint: data.fingerprint }),
      })
      setScrapeMsg(`✓ ${data.fingerprint?.paradigm_detected ?? 'analysiert'} — neue Kandidaten in Queue`)
      setScrapeUrl('')
      fetchAll()
    } catch {
      setScrapeMsg('Fehler beim Scraping')
    } finally {
      setScraping(false)
    }
  }

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = queue.filter(e => {
    if (filter === 'pending')   return e.status === 'pending'
    if (filter === 'approved')  return e.status === 'approved'
    if (filter === 'hot')       return e.seen_count >= 3
    if (filter === 'universal') return e.reusability === 'universal' && e.status === 'pending'
    return true
  }).sort((a, b) => b.seen_count - a.seen_count || b.confidence - a.confidence)

  // ─────────────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-sm text-zinc-400">
      Discovery Queue wird geladen…
    </div>
  )

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-6xl mx-auto px-5 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-900 mb-1">Design Discovery</h1>
          <p className="text-sm text-zinc-500">
            Neue Design-Patterns aus gescrapten Sites — review, approve, formalisieren.
          </p>
        </div>

        <div className="flex gap-6 items-start">

          {/* ── Sidebar ─────────────────────────────────────────── */}
          <div className="w-56 flex-shrink-0 space-y-5">

            {/* Stats */}
            {stats && (
              <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-2">
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-3">Queue</p>
                <StatRow label="Kandidaten"  value={stats.total}    />
                <StatRow label="Pending"     value={stats.pending}  />
                <StatRow label="Hot (3×)"    value={stats.hot}      highlight />
                <StatRow label="Approved"    value={stats.approved} />
              </div>
            )}

            {/* Trends */}
            <div className="bg-white border border-zinc-200 rounded-xl p-4">
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-3">Trends</p>
              {trends.map(t => (
                <div key={t.category} className="flex items-center gap-2 py-1.5">
                  <span className="text-xs w-3 text-zinc-400">{TREND_ICON[t.trend]}</span>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-zinc-700">{t.category}</div>
                    <div className="mt-1 h-1 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-zinc-800 rounded-full"
                        style={{ width: `${Math.min(100, (t.recent / (Math.max(...trends.map(x=>x.recent))||1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-zinc-400">{t.recent}</span>
                </div>
              ))}
            </div>

            {/* Live Scrape */}
            <div className="bg-white border border-dashed border-zinc-300 rounded-xl p-4">
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-3">Neue Site analysieren</p>
              <input
                type="url"
                value={scrapeUrl}
                onChange={e => setScrapeUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleScrape()}
                placeholder="https://..."
                className="w-full text-xs px-3 py-2 border border-zinc-200 rounded-lg mb-2 focus:outline-none focus:border-zinc-400"
              />
              <button
                onClick={handleScrape}
                disabled={scraping || !scrapeUrl.startsWith('http')}
                className="w-full text-xs py-2 bg-zinc-900 text-white rounded-lg disabled:opacity-40 hover:bg-zinc-700 transition-colors"
              >
                {scraping ? 'Analysiert…' : 'Analysieren'}
              </button>
              {scrapeMsg && (
                <p className="text-xs text-zinc-500 mt-2">{scrapeMsg}</p>
              )}
            </div>
          </div>

          {/* ── Main Queue ───────────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Filters */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {(['all','pending','hot','universal','approved'] as FilterType[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    filter === f
                      ? 'bg-zinc-900 text-white'
                      : 'bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-400'
                  }`}
                >
                  {f === 'hot' ? 'Hot (3×+)' : f === 'all' ? `Alle (${queue.length})` : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
              <span className="ml-auto text-xs text-zinc-400 self-center">{filtered.length} Einträge</span>
            </div>

            {/* Cards */}
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-sm text-zinc-400">
                Keine Einträge in diesem Filter
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(e => (
                  <EntryCard
                    key={e.id}
                    entry={e}
                    expanded={expanding === e.id}
                    onToggle={() => setExpanding(prev => prev === e.id ? null : e.id)}
                    onAct={(action) => act(e.id, action)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatRow({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className={`text-sm font-medium ${highlight ? 'text-amber-600' : 'text-zinc-800'}`}>{value}</span>
    </div>
  )
}

function EntryCard({
  entry, expanded, onToggle, onAct,
}: {
  entry: DiscoveryEntry
  expanded: boolean
  onToggle: () => void
  onAct: (action: 'approve' | 'reject' | 'formalize') => void
}) {
  const catColor = CAT_COLORS[entry.category] ?? 'bg-zinc-100 text-zinc-600 border-zinc-200'
  const isHot    = entry.seen_count >= 3
  const conf     = Math.round(entry.confidence * 100)

  return (
    <div
      className={`bg-white border rounded-xl transition-all ${
        entry.status === 'approved' ? 'border-l-4 border-l-green-400 border-zinc-200'
        : entry.status === 'rejected' ? 'opacity-40 border-zinc-200'
        : isHot ? 'border-amber-300 shadow-sm'
        : 'border-zinc-200'
      }`}
    >
      <div
        className="p-4 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-zinc-800 leading-relaxed">{entry.observation}</p>
            <div className="flex gap-2 mt-2 flex-wrap items-center">
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${catColor}`}>
                {entry.category}
              </span>
              <span className="text-[10px] text-zinc-400 border border-zinc-200 px-2 py-0.5 rounded-full">
                {entry.paradigm}
              </span>
              <span className="text-[10px] text-zinc-400">{conf}% confidence</span>
              <span className="text-[10px] text-zinc-400">
                {new URL(entry.source_url).hostname}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            {isHot && (
              <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                {entry.seen_count}× gesehen
              </span>
            )}
            {entry.status === 'approved' && (
              <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                Approved
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Expanded details + actions */}
      {expanded && (
        <div className="border-t border-zinc-100 px-4 py-3 space-y-3">
          {entry.css_hint && (
            <div>
              <p className="text-[10px] font-medium text-zinc-400 mb-1 uppercase tracking-wide">CSS-Hinweis</p>
              <code className="text-[11px] text-zinc-600 bg-zinc-50 px-3 py-1.5 rounded-lg block">
                {entry.css_hint}
              </code>
            </div>
          )}

          {entry.seen_on.length > 1 && (
            <div>
              <p className="text-[10px] font-medium text-zinc-400 mb-1 uppercase tracking-wide">Gesehen bei</p>
              <div className="flex gap-1.5 flex-wrap">
                {entry.seen_on.map(url => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-blue-600 hover:underline bg-blue-50 px-2 py-0.5 rounded"
                  >
                    {new URL(url).hostname}
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {entry.status === 'pending' && <>
              <button
                onClick={() => onAct('approve')}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-green-300 text-green-700 hover:bg-green-50 transition-colors"
              >
                Approve
              </button>
              <button
                onClick={() => onAct('reject')}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
              >
                Reject
              </button>
            </>}
            {entry.status === 'approved' && (
              <button
                onClick={() => onAct('formalize')}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-zinc-900 text-white hover:bg-zinc-700 transition-colors"
              >
                In Pattern-Library → formalisieren
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
