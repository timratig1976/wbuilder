/**
 * discoveryQueue.js
 *
 * Speichert rohe "Überraschungen" aus Vision-Analysen.
 * Jeder Eintrag hat einen Status-Lifecycle:
 *   pending → reviewing → approved → rejected
 *
 * Approved entries werden zu echten DesignPatterns formalisiert.
 */

const { readFileSync, writeFileSync, existsSync, mkdirSync } = require('fs')
const path = require('path')

const QUEUE_PATH = path.join(__dirname, 'data/discovery-queue.json')
const TREND_PATH = path.join(__dirname, 'data/trend-tracker.json')

// ─── Types ─────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} DiscoveryCandidate
 * @property {string}   id
 * @property {string}   source_url
 * @property {string}   scraped_at
 * @property {string}   observation    — was GPT-4o beschrieben hat
 * @property {string}   category       — layout|transition|animation|...
 * @property {number}   confidence     — 0-1, vom Modell
 * @property {string|null} css_hint    — konkreter CSS-Hinweis wenn vorhanden
 * @property {string}   reusability    — universal|paradigm-specific|brand-specific
 * @property {string}   paradigm       — von welchem Site-Paradigma
 * @property {string[]} tags
 * @property {string}   status         — pending|reviewing|approved|rejected
 * @property {string|null} pattern_id  — nach Formalisierung gesetzt
 * @property {string|null} reviewer_note
 * @property {number}   seen_count     — wie oft diese Beobachtung bereits aufgetaucht ist
 */

// ─── Helpers ────────────────────────────────────────────────────────────────

function ensureDir(filePath) {
  const dir = path.dirname(filePath)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

function loadQueue() {
  try { return JSON.parse(readFileSync(QUEUE_PATH, 'utf-8')) } catch { return [] }
}

function saveQueue(queue) {
  ensureDir(QUEUE_PATH)
  writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2))
}

function loadTrends() {
  try { return JSON.parse(readFileSync(TREND_PATH, 'utf-8')) } catch { return {} }
}

function saveTrends(trends) {
  ensureDir(TREND_PATH)
  writeFileSync(TREND_PATH, JSON.stringify(trends, null, 2))
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50)
}

// Similarity: Jaccard auf Wort-Tokens + Keyword-Boost für kurze Sätze
function similarity(a, b) {
  const tok = s => new Set(s.toLowerCase().split(/\W+/).filter(w => w.length > 3))
  const tokA = tok(a), tokB = tok(b)
  const intersection = [...tokA].filter(t => tokB.has(t)).length
  const union = new Set([...tokA, ...tokB]).size
  const jaccard = union === 0 ? 0 : intersection / union

  // Boost: wenn beide sehr kurz und mindestens 2 Schlüsselwörter teilen
  const minLen = Math.min(tokA.size, tokB.size)
  const boost = (minLen <= 5 && intersection >= 2) ? 0.25 : 0

  return Math.min(1, jaccard + boost)
}

// ─── Core API ────────────────────────────────────────────────────────────────

/**
 * Verarbeitet die "surprises" aus einem Vision-Ergebnis.
 * Dedupliziert gegen bestehende Queue (similarity > 0.5 → seen_count++)
 * Gibt zurück: { added, incremented }
 */
function ingestSurprises(surprises, meta) {
  const queue = loadQueue()
  const trends = loadTrends()
  let added = 0
  let incremented = 0

  for (const s of surprises) {
    if (s.confidence < 0.65) continue
    if (s.reusability === 'brand-specific') continue // überspringen

    // Similarity-Check gegen bestehende Einträge
    const similar = queue.find(e =>
      e.category === s.category &&
      similarity(e.observation, s.observation) > 0.4
    )

    if (similar) {
      // Schon gesehen — Zähler erhöhen, neue URL als Beweis hinzufügen
      similar.seen_count = (similar.seen_count || 1) + 1
      similar.seen_on = [...(similar.seen_on || [similar.source_url]), meta.source_url]
      incremented++
    } else {
      // Neu — in Queue aufnehmen
      const id = `disc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      queue.push({
        id,
        source_url:    meta.source_url,
        scraped_at:    meta.scraped_at || new Date().toISOString(),
        observation:   s.observation,
        category:      s.category,
        confidence:    s.confidence,
        css_hint:      s.css_hint || null,
        reusability:   s.reusability,
        paradigm:      meta.paradigm_detected,
        tags:          meta.tags || [],
        status:        'pending',
        pattern_id:    null,
        reviewer_note: null,
        seen_count:    1,
        seen_on:       [meta.source_url],
      })
      added++

      // Trend-Tracking: pro Kategorie Zeitreihe führen
      const monthKey = new Date().toISOString().slice(0, 7) // "2026-03"
      if (!trends[s.category]) trends[s.category] = {}
      if (!trends[s.category][monthKey]) trends[s.category][monthKey] = 0
      trends[s.category][monthKey]++
    }
  }

  saveQueue(queue)
  saveTrends(trends)
  return { added, incremented }
}

/**
 * Gibt alle Kandidaten zurück, optional gefiltert
 */
function getQueue({ status, category, minSeenCount, reusability } = {}) {
  let queue = loadQueue()
  if (status)        queue = queue.filter(e => e.status === status)
  if (category)      queue = queue.filter(e => e.category === category)
  if (minSeenCount)  queue = queue.filter(e => e.seen_count >= minSeenCount)
  if (reusability)   queue = queue.filter(e => e.reusability === reusability)
  return queue.sort((a, b) => b.seen_count - a.seen_count || b.confidence - a.confidence)
}

/**
 * Status eines Kandidaten ändern
 */
function updateStatus(id, status, reviewerNote) {
  const queue = loadQueue()
  const entry = queue.find(e => e.id === id)
  if (!entry) return null
  entry.status = status
  if (reviewerNote) entry.reviewer_note = reviewerNote
  saveQueue(queue)
  return entry
}

/**
 * Approved candidate → formalisiertes DesignPattern
 * Gibt ein Pattern-Objekt zurück das in patterns.json gespeichert werden kann
 */
function formalize(id, overrides = {}) {
  const queue  = loadQueue()
  const entry  = queue.find(e => e.id === id)
  if (!entry || entry.status !== 'approved') {
    throw new Error(`Candidate ${id} not found or not approved`)
  }

  const patternId = `disc-${slugify(entry.observation.slice(0, 40))}-${Date.now()}`

  const pattern = {
    id:          patternId,
    type:        overrides.type        || entry.category,
    source_url:  entry.source_url,
    scraped_at:  entry.scraped_at,
    confidence:  entry.confidence,
    name:        overrides.name        || entry.observation.slice(0, 60),
    description: overrides.description || entry.observation,
    tags:        overrides.tags        || [...entry.tags, 'discovered', entry.category],
    industries:  overrides.industries  || ['general'],
    paradigms:   overrides.paradigms   || [entry.paradigm],
    implementation: {
      css_snippet:    overrides.css_snippet   || entry.css_hint || null,
      html_snippet:   overrides.html_snippet  || null,
      placeholder:    overrides.placeholder   || null,
      style_dict_key: overrides.style_dict_key || `rules.decoration.${slugify(entry.category)}`,
      style_dict_val: overrides.style_dict_val || true,
    },
    preview_description: overrides.preview_description || entry.observation.slice(0, 80),
    visual_weight:    overrides.visual_weight    || 'medium',
    brand_dependency: overrides.brand_dependency || 'none',
    discovery_meta: {
      seen_count:  entry.seen_count,
      seen_on:     entry.seen_on,
      css_hint:    entry.css_hint,
      auto_discovered: true,
    },
  }

  // Markiere als formalisiert
  entry.pattern_id = patternId
  saveQueue(queue)

  return pattern
}

/**
 * Trend-Analyse: Kategorien nach Häufigkeit der letzten 3 Monate
 */
function getTrends() {
  const trends = loadTrends()
  const now    = new Date()
  const months = [0, 1, 2].map(i => {
    const d = new Date(now)
    d.setMonth(d.getMonth() - i)
    return d.toISOString().slice(0, 7)
  })

  return Object.entries(trends).map(([category, monthData]) => {
    const recent = months.reduce((sum, m) => sum + (monthData[m] || 0), 0)
    const older  = Object.entries(monthData)
      .filter(([m]) => !months.includes(m))
      .reduce((sum, [, v]) => sum + v, 0)
    const trend  = older === 0 ? 'new' : recent > older ? 'rising' : recent < older ? 'declining' : 'stable'
    return { category, recent, older, trend, total: recent + older }
  }).sort((a, b) => b.recent - a.recent)
}

/**
 * Stats für Dashboard
 */
function getStats() {
  const queue = loadQueue()
  return {
    total:     queue.length,
    pending:   queue.filter(e => e.status === 'pending').length,
    reviewing: queue.filter(e => e.status === 'reviewing').length,
    approved:  queue.filter(e => e.status === 'approved').length,
    rejected:  queue.filter(e => e.status === 'rejected').length,
    hot:       queue.filter(e => e.seen_count >= 3 && e.status === 'pending').length,
  }
}

module.exports = {
  ingestSurprises,
  getQueue,
  updateStatus,
  formalize,
  getTrends,
  getStats,
}
