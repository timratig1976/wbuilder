/**
 * PATCH für src/lib/scraping/siteScraperService.ts
 *
 * Die bestehende scrapeSite() Funktion muss nach dem Vision-Call
 * automatisch die Discovery-Pipeline aufrufen.
 *
 * Einzige Änderung: nach dem JSON.parse(visionResult) → ingestDiscovery()
 */

// ── Was sich ändert (Diff-Format): ────────────────────────────────────────
//
// VORHER:
//   const fingerprint = JSON.parse(res.choices[0]?.message?.content ?? '{}')
//   return { ...fingerprint, source_url: url, scraped_at: new Date().toISOString() }
//
// NACHHER (3 Zeilen ergänzen):
//   const fingerprint = JSON.parse(res.choices[0]?.message?.content ?? '{}')
//   const result = { ...fingerprint, source_url: url, scraped_at: new Date().toISOString() }
//
//   // Discovery: async, blockiert Rückgabe nicht
//   ingestDiscovery(result, cssData).catch(console.error)
//
//   return result
//
// ── Die neue Helper-Funktion (ans Ende der Datei): ─────────────────────────

import { ingestSurprises } from '../discovery/discoveryQueue'
import { detectAnomalies, loadBaseline, updateBaseline, saveBaseline } from '../discovery/anomalyDetector'

async function ingestDiscovery(fingerprint: ScrapedFingerprint, cssData: object): Promise<void> {
  // 1. Vision surprises
  if (fingerprint.surprises?.length) {
    ingestSurprises(fingerprint.surprises, fingerprint)
  }

  // 2. Anomaly detection
  const baseline  = loadBaseline()
  const anomalies = detectAnomalies(cssData as any, baseline)
  if (anomalies.length) {
    ingestSurprises(anomalies, fingerprint)
  }

  // 3. Baseline updaten (für zukünftige Anomalie-Erkennung)
  saveBaseline(updateBaseline(cssData as any, baseline))
}

// ── Erweiterter Puppeteer-Extract-Block ────────────────────────────────────
// Ersetze den bestehenden evaluate()-Aufruf in scrapeSite() mit diesem:

export const EXTENDED_EXTRACT = `
(function() {
  const sections = Array.from(document.querySelectorAll('section, main > div, [class*="section"]'))
  const body     = document.body
  const nav      = document.querySelector('nav, header')
  const h1       = document.querySelector('h1')
  const allEls   = Array.from(document.querySelectorAll('*'))

  function getStyle(el, prop) {
    return el ? getComputedStyle(el).getPropertyValue(prop).trim() : ''
  }

  return {
    // Standard — bereits vorhanden
    h1_font:    getStyle(h1,   'font-family'),
    h1_weight:  getStyle(h1,   'font-weight'),
    h1_size:    getStyle(h1,   'font-size'),
    body_font:  getStyle(body, 'font-family'),
    body_bg:    getStyle(body, 'background-color'),
    body_color: getStyle(body, 'color'),
    nav_bg:     getStyle(nav,  'background-color'),
    nav_position: getStyle(nav,'position'),
    theme_color: document.querySelector('meta[name="theme-color"]')?.content || '',

    // NEU — für Anomaly Detector
    has_backdrop_blur:    allEls.some(el =>
      getStyle(el,'backdrop-filter').includes('blur') ||
      getStyle(el,'-webkit-backdrop-filter').includes('blur')),
    has_clip_path:        sections.some(el =>
      getStyle(el,'clip-path').includes('polygon')),
    has_svg_background:   allEls.some(el =>
      getStyle(el,'background-image').includes('svg')),
    has_scroll_animation: allEls.some(el => {
      const at = getStyle(el,'animation-timeline')
      return at && at !== 'auto' && at !== 'none'
    }),
    has_counter_anim:     document.querySelectorAll('[data-target],[data-count],[data-number]').length > 0,
    has_gradient_text:    allEls.some(el =>
      getStyle(el,'background-image').includes('gradient') &&
      (getStyle(el,'-webkit-text-fill-color') === 'transparent' ||
       getStyle(el,'-webkit-text-fill-color') === 'rgba(0, 0, 0, 0)')),
    has_noise_texture:    allEls.some(el =>
      getStyle(el,'background-image').includes('base64')),
    has_bento_grid:       allEls.filter(el => getStyle(el,'display') === 'grid')
      .some(el => Array.from(el.children)
        .some(c => getStyle(c,'grid-column').includes('span 2') ||
                   getStyle(c,'grid-column').includes('span 3'))),
    has_transparent_nav:  (getStyle(nav,'background-color') || '').includes('rgba') &&
      (getStyle(nav,'background-color') || '').includes(', 0)'),
    has_negative_margin:  sections.some(el => parseFloat(getStyle(el,'margin-top')) < -10),
    has_pseudo_concave:   (() => {
      try {
        const after = sections[0] && getComputedStyle(sections[0],'::after')
        return after && (after.borderRadius||'').includes('50%')
      } catch { return false }
    })(),
    section_count: sections.length,
    grid_count:    allEls.filter(el => getStyle(el,'display') === 'grid').length,
    svg_count:     document.querySelectorAll('svg').length,
  }
})()`
