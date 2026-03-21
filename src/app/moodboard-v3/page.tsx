'use client'

import { useEffect, useRef, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, ArrowRight, RefreshCw, Loader2, Check, Sparkles, Camera, Zap, Target, Eye, Layout } from 'lucide-react'

// ─── Paradigm config ─────────────────────────────────────────────────────────

const PARADIGM_STYLES: Record<string, { bg: string; surface: string; accent: string; text: string; muted: string; border: string; fontClass: string }> = {
  'bold-expressive': { bg: '#0f0f0f', surface: '#1a1a1a', accent: '#c8963e', text: '#f3f4f6', muted: '#9ca3af', border: 'rgba(255,255,255,0.1)', fontClass: 'font-bold' },
  'tech-dark':       { bg: '#050b14', surface: '#0d1726', accent: '#3b82f6', text: '#e2e8f0', muted: '#64748b', border: 'rgba(59,130,246,0.2)', fontClass: 'font-bold' },
  'minimal-clean':   { bg: '#ffffff', surface: '#f9fafb', accent: '#111827', text: '#111827', muted: '#6b7280', border: '#e5e7eb', fontClass: 'font-semibold' },
  'luxury-editorial':{ bg: '#faf9f5', surface: '#f5f0e8', accent: '#b8975a', text: '#1c1917', muted: '#78716c', border: '#e7e5e4', fontClass: 'font-bold' },
  'brutalist':       { bg: '#f2efe8', surface: '#e5e2da', accent: '#ff3300', text: '#000000', muted: '#555555', border: '#000000', fontClass: 'font-black' },
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ConversionBlueprint = {
  strongestHook: string
  painPoint: string
  solutionFrame: string
  proofType: string
  conversionBlockers: string[]
  ctaApproach: string
  sectionOrder: string
}

type ImageBriefing = {
  mood: string
  composition: string
  subject: string
  avoid: string
  picsumSeed: string
  picsumId: number
  overlayOpacity: number
}

type AnimationStrategy = {
  overallMotion: string
  heroEntranceEffect: string
  backgroundAnimation: string
  stillElements: string[]
  hoverEffects: string
  scrollBehavior: string
  cssPattern: string
}

type MoodboardState = {
  blueprint: ConversionBlueprint | null
  artDirection: string
  imageBriefing: ImageBriefing | null
  animStrategy: AnimationStrategy | null
}

type CallStatus = 'idle' | 'running' | 'done' | 'error'

// ─── Visual Moodboard Card ────────────────────────────────────────────────────

function VisualMoodboardCard({
  paradigm, companyName, artDirection, imageBriefing, animStrategy, layout,
}: {
  paradigm: string; companyName: string; artDirection: string
  imageBriefing: ImageBriefing | null; animStrategy: AnimationStrategy | null; layout: string
}) {
  const style = PARADIGM_STYLES[paradigm] ?? PARADIGM_STYLES['bold-expressive']
  const imageUrl = imageBriefing ? `https://picsum.photos/seed/${imageBriefing.picsumSeed}/600/400` : null

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
      {/* Main hero preview */}
      <div className="relative h-64 overflow-hidden" style={{ background: style.bg }}>
        {/* Background image if available */}
        {imageUrl && (
          <div className="absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="" className="w-full h-full object-cover opacity-30" />
            {imageBriefing && imageBriefing.overlayOpacity > 0 && (
              <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${imageBriefing.overlayOpacity * 0.6})` }} />
            )}
          </div>
        )}

        {/* Ambient orb for bold/tech */}
        {(paradigm === 'bold-expressive' || paradigm === 'tech-dark') && (
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-20 blur-3xl"
            style={{ background: style.accent, transform: 'translate(30%, -30%)' }} />
        )}

        {/* Content overlay */}
        <div className="absolute inset-0 flex flex-col justify-center px-8 py-6">
          {/* Eyebrow */}
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: style.accent }}>
            {companyName || 'Unternehmen'}
          </div>

          {/* Headline */}
          <div className="mb-4" style={{ color: style.text }}>
            <div className="text-2xl font-bold leading-tight">Die beste Lösung</div>
            <div className="text-2xl font-bold leading-tight" style={{ color: style.accent }}>für Ihr Projekt</div>
          </div>

          {/* Subline from art direction — first sentence */}
          {artDirection && (
            <div className="text-xs leading-relaxed mb-5 max-w-xs" style={{ color: style.muted }}>
              {artDirection.split('.')[0].trim()}.
            </div>
          )}

          {/* CTA buttons */}
          <div className="flex gap-2">
            <div className="px-4 py-2 rounded-lg text-xs font-semibold" style={{ background: style.accent, color: style.bg }}>
              Jetzt starten
            </div>
            <div className="px-4 py-2 rounded-lg text-xs font-medium border" style={{ color: style.text, borderColor: style.border }}>
              Mehr erfahren
            </div>
          </div>
        </div>

        {/* Animation badge */}
        {animStrategy && (
          <div className="absolute top-3 right-3 bg-black/60 text-white text-[9px] px-2 py-1 rounded-full flex items-center gap-1">
            <Zap className="w-2.5 h-2.5 text-yellow-400" />
            {animStrategy.overallMotion}
          </div>
        )}

        {/* Layout badge */}
        <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[9px] px-2 py-1 rounded-full flex items-center gap-1">
          <Layout className="w-2.5 h-2.5 text-blue-300" />
          {layout || 'split-50'}
        </div>
      </div>

      {/* Style tokens row */}
      <div className="flex items-center gap-0 border-t" style={{ background: style.surface, borderColor: style.border }}>
        {/* Color swatches */}
        <div className="flex items-center gap-2 px-4 py-3 border-r" style={{ borderColor: style.border }}>
          <div className="w-4 h-4 rounded-full border border-white/20" style={{ background: style.bg }} title="Background" />
          <div className="w-4 h-4 rounded-full border border-white/20" style={{ background: style.surface }} title="Surface" />
          <div className="w-4 h-4 rounded-full" style={{ background: style.accent }} title="Accent" />
          <div className="w-4 h-4 rounded-full border border-gray-300" style={{ background: style.text }} title="Text" />
        </div>

        {/* Paradigm label */}
        <div className="px-4 py-3 text-xs font-semibold border-r flex-shrink-0" style={{ color: style.accent, borderColor: style.border }}>
          {paradigm}
        </div>

        {/* Motion tag */}
        {animStrategy && (
          <div className="px-4 py-3 text-xs border-r flex-shrink-0" style={{ color: style.muted, borderColor: style.border }}>
            ⚡ {animStrategy.heroEntranceEffect}
          </div>
        )}

        {/* Image mood */}
        {imageBriefing && (
          <div className="px-4 py-3 text-xs flex-shrink-0" style={{ color: style.muted }}>
            📷 {imageBriefing.mood}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Layout Wireframe ─────────────────────────────────────────────────────────

function LayoutWireframe({ layout, paradigm, artDirection }: { layout: string; paradigm: string; artDirection: string }) {
  const style = PARADIGM_STYLES[paradigm] ?? PARADIGM_STYLES['bold-expressive']

  const slots: { id: string; label: string; hint: string; col: string }[] = layout === 'bento-3col' ? [
    { id: 'left',   label: 'Headline + CTA',  hint: 'Eyebrow · H1 · Subline · CTA Primary + Secondary · Micro-Copy', col: 'col-span-5' },
    { id: 'stats',  label: 'Stats',            hint: 'MAX 4 Kennzahlen · Trennlinien · kein anderer Content',           col: 'col-span-3' },
    { id: 'visual', label: 'Visual',           hint: 'Einzelnes Bild · kleine Caption · kein Text',                     col: 'col-span-4' },
    { id: 'trust',  label: 'Trust Strip',      hint: 'Max 5 Firmenlogos als Text-Badges · einzeilig',                   col: 'col-span-12' },
  ] : layout === 'bento-2col' ? [
    { id: 'left',   label: 'Headline + CTA',  hint: 'Eyebrow · H1 · Subline · CTAs',                   col: 'col-span-6' },
    { id: 'visual', label: 'Visual',          hint: 'Bild oben · Stats-Kachel unten',                   col: 'col-span-6' },
  ] : layout === 'split-50' ? [
    { id: 'left',   label: 'Text-Seite',      hint: 'Eyebrow · H1 · Subline · CTA Primary + Secondary', col: 'col-span-6' },
    { id: 'right',  label: 'Visual-Seite',    hint: 'Großes Bild · kein Text',                          col: 'col-span-6' },
  ] : layout === 'editorial-split' ? [
    { id: 'visual', label: 'Visual groß',     hint: '3/5 Breite · Bild ohne Text',                      col: 'col-span-7' },
    { id: 'right',  label: 'Text + CTA',      hint: 'H1 · Subline · CTA · Trust',                       col: 'col-span-5' },
  ] : layout === 'centered' ? [
    { id: 'center', label: 'Zentriert',        hint: 'Eyebrow · H1 · Subline · CTAs · Trust Strip',      col: 'col-span-12' },
  ] : [
    { id: 'left',   label: 'Text',            hint: 'Headline + CTA',                                   col: 'col-span-6' },
    { id: 'right',  label: 'Visual',          hint: 'Bild / Demo',                                      col: 'col-span-6' },
  ]

  const slotColors = ['#6366f1', '#f59e0b', '#10b981', '#3b82f6', '#ec4899']

  return (
    <div className="rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Layout className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-semibold text-gray-700">Layout Wireframe</span>
          <span className="text-[10px] font-mono text-violet-600 bg-violet-50 px-2 py-0.5 rounded">{layout}</span>
        </div>
        <span className="text-[10px] text-gray-400">Slot-Zuweisung · Struktur folgt Content</span>
      </div>

      {/* Wireframe */}
      <div className="p-4 bg-white">
        {/* Outer section frame */}
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-3">
          <div className="text-[9px] text-gray-400 mb-2 uppercase tracking-widest font-semibold">&lt;section&gt; hero · overflow-hidden isolate</div>

          {/* Grid preview */}
          <div className="grid grid-cols-12 gap-2">
            {slots.map((slot, i) => (
              <div
                key={slot.id}
                className={`${
                  slot.col === 'col-span-12' ? 'col-span-12' :
                  slot.col === 'col-span-7'  ? 'col-span-7' :
                  slot.col === 'col-span-6'  ? 'col-span-6' :
                  slot.col === 'col-span-5'  ? 'col-span-5' :
                  slot.col === 'col-span-4'  ? 'col-span-4' :
                  slot.col === 'col-span-3'  ? 'col-span-3' :
                  'col-span-6'
                } rounded-lg border-2 p-3 transition-all`}
                style={{ borderColor: slotColors[i % slotColors.length] + '60', background: slotColors[i % slotColors.length] + '08' }}
              >
                <div className="text-[9px] font-bold uppercase tracking-wide mb-1" style={{ color: slotColors[i % slotColors.length] }}>
                  {slot.id}
                </div>
                <div className="text-[10px] font-semibold text-gray-700 mb-1">{slot.label}</div>
                <div className="text-[9px] text-gray-400 leading-relaxed">{slot.hint}</div>

                {/* Mini content lines */}
                <div className="mt-2 flex flex-col gap-1">
                  {slot.id === 'left' && <>
                    <div className="h-1 rounded w-1/3" style={{ background: slotColors[i % slotColors.length] + '80' }} />
                    <div className="h-1.5 rounded w-full bg-gray-200" />
                    <div className="h-1.5 rounded w-4/5 bg-gray-200" />
                    <div className="mt-1 flex gap-1">
                      <div className="h-2 rounded flex-1" style={{ background: slotColors[i % slotColors.length] }} />
                      <div className="h-2 rounded flex-1 bg-gray-200" />
                    </div>
                  </>}
                  {slot.id === 'stats' && <>
                    {[0,1,2].map(j => <div key={j} className="h-1 rounded w-full bg-gray-200" />)}
                  </>}
                  {(slot.id === 'visual' || slot.id === 'right') && (
                    <div className="h-8 rounded" style={{ background: `linear-gradient(135deg, ${slotColors[i % slotColors.length]}30, ${slotColors[i % slotColors.length]}10)` }} />
                  )}
                  {slot.id === 'trust' && (
                    <div className="flex gap-1">
                      {[0,1,2,3,4].map(j => <div key={j} className="h-1.5 rounded flex-1 bg-gray-200" />)}
                    </div>
                  )}
                  {slot.id === 'center' && <>
                    <div className="h-1 rounded w-1/4 mx-auto" style={{ background: slotColors[i % slotColors.length] + '80' }} />
                    <div className="h-1.5 rounded w-3/4 mx-auto bg-gray-200" />
                    <div className="h-1 rounded w-1/2 mx-auto bg-gray-200" />
                    <div className="mt-1 flex gap-1 justify-center">
                      <div className="h-2 rounded w-12" style={{ background: slotColors[i % slotColors.length] }} />
                      <div className="h-2 rounded w-10 bg-gray-200" />
                    </div>
                  </>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Art direction note */}
        {artDirection && (
          <div className="mt-3 px-3 py-2 rounded-lg bg-amber-50 border border-amber-100">
            <div className="text-[9px] font-bold uppercase tracking-wide text-amber-600 mb-1">Art Direction → Developer</div>
            <p className="text-[10px] text-amber-800 leading-relaxed line-clamp-2">{artDirection}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Style Palette Card ───────────────────────────────────────────────────────

function StylePaletteCard({ paradigm, animStrategy }: { paradigm: string; animStrategy: AnimationStrategy | null }) {
  const style = PARADIGM_STYLES[paradigm] ?? PARADIGM_STYLES['bold-expressive']

  const tokens = [
    { label: 'Background', value: style.bg, var: '--color-background' },
    { label: 'Surface', value: style.surface, var: '--color-surface' },
    { label: 'Accent', value: style.accent, var: '--color-accent' },
    { label: 'Text', value: style.text, var: '--color-text' },
    { label: 'Muted', value: style.muted, var: '--color-text-muted' },
  ]

  const animBadges = animStrategy ? [
    { label: 'Entrance', value: animStrategy.heroEntranceEffect, color: 'bg-violet-50 text-violet-700 border-violet-200' },
    { label: 'Background', value: animStrategy.backgroundAnimation, color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { label: 'Hover', value: animStrategy.hoverEffects, color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { label: 'Scroll', value: animStrategy.scrollBehavior, color: 'bg-gray-50 text-gray-700 border-gray-200' },
  ] : []

  const stillBadges = animStrategy?.stillElements ?? []

  return (
    <div className="rounded-2xl border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
        <Eye className="w-4 h-4 text-gray-400" />
        <span className="text-xs font-semibold text-gray-700">Style Tokens + Animation</span>
        <span className="text-[10px] text-violet-600 font-mono bg-violet-50 px-2 py-0.5 rounded ml-1">{paradigm}</span>
      </div>
      <div className="p-4 bg-white flex flex-col gap-4">

        {/* Color tokens */}
        <div>
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">CSS Custom Properties</div>
          <div className="flex flex-col gap-1.5">
            {tokens.map(t => (
              <div key={t.label} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded border border-gray-200 flex-shrink-0" style={{ background: t.value }} />
                <div className="font-mono text-[10px] text-violet-600 w-36 flex-shrink-0">{t.var}</div>
                <div className="text-[10px] text-gray-500">{t.label}</div>
                <div className="ml-auto font-mono text-[10px] text-gray-400">{t.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Animation strategy */}
        {animStrategy && (
          <div>
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Animation Strategy</div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {animBadges.map(b => (
                <div key={b.label} className={`text-[10px] px-2 py-1 rounded-full border ${b.color}`}>
                  <span className="font-semibold">{b.label}:</span> {b.value}
                </div>
              ))}
            </div>
            {stillBadges.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-gray-400">Still (kein Anim):</span>
                {stillBadges.map((s, i) => (
                  <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border border-gray-200">{s}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Call status pill ─────────────────────────────────────────────────────────

function CallPill({ n, label, icon, status, onRetry }: {
  n: number; label: string; icon: React.ReactNode; status: CallStatus; onRetry?: () => void
}) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs transition-all ${
      status === 'done'    ? 'border-green-200 bg-green-50 text-green-800' :
      status === 'running' ? 'border-violet-300 bg-violet-50 text-violet-800 animate-pulse' :
      status === 'error'   ? 'border-red-200 bg-red-50 text-red-700' :
                             'border-gray-200 bg-gray-50 text-gray-400'
    }`}>
      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-white ${
        status === 'done' ? 'bg-green-500' : status === 'running' ? 'bg-violet-500' : 'bg-gray-300'
      }`}>
        {status === 'done'    ? <Check className="w-3 h-3" /> :
         status === 'running' ? <Loader2 className="w-3 h-3 animate-spin" /> :
         <span className="text-[10px] font-bold">{n}</span>}
      </div>
      {icon}
      <span className="font-medium">{label}</span>
      {status === 'running' && <span className="text-violet-500 ml-1">…</span>}
      {status === 'done' && onRetry && (
        <button onClick={onRetry} className="ml-auto p-0.5 rounded hover:bg-green-100 transition-colors" title="Neu generieren">
          <RefreshCw className="w-3 h-3 text-green-600" />
        </button>
      )}
    </div>
  )
}

// ─── Main inner component ─────────────────────────────────────────────────────

function MoodboardInner() {
  const router = useRouter()
  const params = useSearchParams()

  const briefing = {
    companyName: params.get('companyName') ?? '',
    industry: params.get('industry') ?? '',
    usp: params.get('usp') ?? '',
    paradigm: params.get('paradigm') ?? 'bold-expressive',
    language: (params.get('language') ?? 'de') as 'de' | 'en',
    animationBudget: params.get('animationBudget') ?? 'subtle',
    layout: params.get('layout') ?? 'split-50',
    contentInventory: {
      hasStats: params.get('hasStats') === 'true',
      hasVisual: params.get('hasVisual') === 'true',
      hasLogos: params.get('hasLogos') === 'true',
      hasDemo: params.get('hasDemo') === 'true',
      hasVideo: params.get('hasVideo') === 'true',
      statsExamples: params.get('statsExamples') ?? '',
      ctaGoal: params.get('ctaGoal') ?? 'contact',
    },
  }

  const [callStatus, setCallStatus] = useState<Record<number, CallStatus>>({ 1: 'idle', 2: 'idle', 3: 'idle', 4: 'idle' })
  const [moodboard, setMoodboard] = useState<MoodboardState>({ blueprint: null, artDirection: '', imageBriefing: null, animStrategy: null })
  const [artDirStream, setArtDirStream] = useState('')
  const [error, setError] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  // Feedback state for Art Director retry
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackHistory, setFeedbackHistory] = useState<Array<{ direction: string; feedback: string }>>([])

  const setStatus = (call: number, s: CallStatus) => setCallStatus(p => ({ ...p, [call]: s }))

  async function runPhase1(retryCall?: number) {
    if (abortRef.current) abortRef.current.abort()
    const abort = new AbortController()
    abortRef.current = abort
    setError('')

    if (retryCall) {
      setStatus(retryCall, 'idle')
      if (retryCall === 1) setMoodboard(m => ({ ...m, blueprint: null }))
      if (retryCall === 2) {
        if (feedbackText && moodboard.artDirection) {
          setFeedbackHistory(h => [...h, { direction: moodboard.artDirection, feedback: feedbackText }])
        }
        setMoodboard(m => ({ ...m, artDirection: '' }))
        setArtDirStream('')
        setShowFeedback(false)
        setFeedbackText('')
      }
      if (retryCall === 3) setMoodboard(m => ({ ...m, imageBriefing: null }))
      if (retryCall === 4) setMoodboard(m => ({ ...m, animStrategy: null }))
    } else {
      setCallStatus({ 1: 'idle', 2: 'idle', 3: 'idle', 4: 'idle' })
      setMoodboard({ blueprint: null, artDirection: '', imageBriefing: null, animStrategy: null })
      setArtDirStream('')
    }

    try {
      const res = await fetch('/api/v2/artdirector-v3/phase1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abort.signal,
        body: JSON.stringify({
          ...briefing,
          artDirection: moodboard.artDirection,
          retryCall,
          feedback: retryCall === 2 ? feedbackText : '',
          previousDirection: retryCall === 2 ? moodboard.artDirection : '',
        }),
      })
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n'); buf = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const evt = JSON.parse(line.slice(6))
            if (evt.type === 'status') setStatus(evt.call, 'running')
            if (evt.type === 'art_direction_delta') setArtDirStream(p => p + String(evt.text ?? ''))
            if (evt.type === 'call_complete') {
              setStatus(evt.call, 'done')
              if (evt.blueprint)     setMoodboard(m => ({ ...m, blueprint: evt.blueprint }))
              if (evt.artDirection)  setMoodboard(m => ({ ...m, artDirection: String(evt.artDirection) }))
              if (evt.imageBriefing) setMoodboard(m => ({ ...m, imageBriefing: evt.imageBriefing }))
              if (evt.animStrategy)  setMoodboard(m => ({ ...m, animStrategy: evt.animStrategy }))
            }
            if (evt.type === 'error') setError(String(evt.message ?? 'Unknown error'))
          } catch { continue }
        }
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setError(e instanceof Error ? e.message : String(e))
    }
  }

  useEffect(() => {
    runPhase1()
    return () => abortRef.current?.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function proceedToGeneration() {
    const p = new URLSearchParams(params.toString())
    if (moodboard.artDirection) p.set('artDirection', moodboard.artDirection)
    if (moodboard.imageBriefing) p.set('imageBriefing', JSON.stringify(moodboard.imageBriefing))
    if (moodboard.animStrategy) p.set('animStrategy', JSON.stringify(moodboard.animStrategy))
    if (moodboard.blueprint) p.set('blueprint', JSON.stringify(moodboard.blueprint))
    router.push(`/artdirector-v3?${p.toString()}`)
  }

  const allDone = [1,2,3,4].every(n => callStatus[n] === 'done')
  const artDirectionDisplay = moodboard.artDirection || artDirStream

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/briefing-v3')} className="text-gray-400 hover:text-gray-700">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="font-bold text-gray-900 text-sm">Moodboard</span>
          <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full">Phase 1 · 4 Calls · page-weit · einmalig</span>
        </div>
        <div className="flex items-center gap-2">
          {[1,2,3,4].map(n => (
            <div key={n} className={`w-1.5 h-1.5 rounded-full transition-all ${callStatus[n] === 'done' ? 'bg-green-400' : callStatus[n] === 'running' ? 'bg-violet-400 animate-pulse scale-125' : 'bg-gray-300'}`} />
          ))}
          {allDone && (
            <button onClick={proceedToGeneration}
              className="ml-2 flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white transition-colors">
              Sections generieren <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Briefing bar */}
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-6 bg-white border border-gray-200 rounded-xl px-4 py-2.5 flex-wrap">
          <span className="font-semibold text-gray-900">{briefing.companyName || '—'}</span>
          <span className="text-gray-300">·</span>
          <span>{briefing.industry}</span>
          <span className="text-gray-300">·</span>
          <span className="text-violet-600 font-medium">{briefing.paradigm}</span>
          <span className="text-gray-300">·</span>
          <span className="font-mono">{briefing.layout}</span>
          <button onClick={() => router.push('/briefing-v3')} className="ml-auto text-gray-400 hover:text-gray-600 underline underline-offset-2 text-[10px]">
            Briefing ändern →
          </button>
        </div>

        {/* Call progress pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-8">
          <CallPill n={1} label="Conversion Strategist" icon={<Target className="w-3 h-3" />} status={callStatus[1]} onRetry={() => runPhase1(1)} />
          <CallPill n={2} label="Art Director"          icon={<Sparkles className="w-3 h-3" />} status={callStatus[2]} onRetry={() => runPhase1(2)} />
          <CallPill n={3} label="Fotograf"              icon={<Camera className="w-3 h-3" />}   status={callStatus[3]} onRetry={() => runPhase1(3)} />
          <CallPill n={4} label="Animationsguru"        icon={<Zap className="w-3 h-3" />}      status={callStatus[4]} onRetry={() => runPhase1(4)} />
        </div>

        {/* ── Main visual output area ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left col: Visual Moodboard + Blueprint */}
          <div className="lg:col-span-7 flex flex-col gap-5">

            {/* Visual Moodboard Card */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-violet-500" /> Visuelles Moodboard
                </h2>
                {allDone && (
                  <button onClick={() => runPhase1()} className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100">
                    <RefreshCw className="w-3 h-3" /> Alle neu
                  </button>
                )}
              </div>
              {(callStatus[2] === 'done' || callStatus[3] === 'done' || callStatus[4] === 'done') ? (
                <VisualMoodboardCard
                  paradigm={briefing.paradigm}
                  companyName={briefing.companyName}
                  artDirection={artDirectionDisplay}
                  imageBriefing={moodboard.imageBriefing}
                  animStrategy={moodboard.animStrategy}
                  layout={briefing.layout}
                />
              ) : (
                <div className="rounded-2xl border-2 border-dashed border-gray-200 h-64 flex items-center justify-center">
                  {callStatus[2] === 'running' ? (
                    <div className="flex flex-col items-center gap-2 text-violet-400">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span className="text-xs">Art Director generiert…</span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">Moodboard erscheint nach Call 2</span>
                  )}
                </div>
              )}
            </div>

            {/* Art Direction text + feedback loop */}
            {artDirectionDisplay && (
              <div className={`bg-white rounded-2xl border-2 p-5 transition-colors ${showFeedback ? 'border-amber-200' : 'border-gray-200'}`}>
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-500" />
                    <span className="text-sm font-bold text-gray-900">Art Direction</span>
                    <span className="text-[10px] text-gray-400">Call 2</span>
                    {feedbackHistory.length > 0 && (
                      <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded-full">
                        {feedbackHistory.length}× überarbeitet
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {!showFeedback && callStatus[2] === 'done' && (
                      <>
                        <button
                          onClick={() => setShowFeedback(true)}
                          className="flex items-center gap-1 text-[10px] text-amber-600 hover:text-amber-800 px-2 py-1 rounded hover:bg-amber-50 border border-amber-200 transition-colors"
                          title="Feedback geben — Art Director überarbeitet"
                        >
                          ✦ Feedback geben
                        </button>
                        <button onClick={() => runPhase1(2)} className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100" title="Ohne Feedback neu generieren">
                          <RefreshCw className="w-3 h-3" />
                        </button>
                      </>
                    )}
                    {showFeedback && (
                      <button onClick={() => { setShowFeedback(false); setFeedbackText('') }} className="text-[10px] text-gray-400 hover:text-gray-600 px-2 py-1 rounded hover:bg-gray-100">
                        Abbrechen
                      </button>
                    )}
                  </div>
                </div>

                {/* Direction text */}
                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{artDirectionDisplay}</p>

                {/* Feedback panel */}
                {showFeedback && (
                  <div className="mt-4 flex flex-col gap-3 border-t border-amber-100 pt-4">
                    <div className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
                      ✦ Feedback an den Art Director
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      Was gefällt dir nicht? Was soll anders sein? Der Art Director liest deinen vorherigen Ansatz und dein Feedback und erstellt eine neue, bewusst andere Richtung.
                    </p>
                    <textarea
                      autoFocus
                      value={feedbackText}
                      onChange={e => setFeedbackText(e.target.value)}
                      placeholder={'z.B. "zu dunkel und dramatisch — wir wollen frischer und moderner wirken, eher Tech-Startup als Premium-Agency"'}
                      rows={3}
                      className="w-full text-sm border border-amber-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-200 resize-none text-gray-800 placeholder:text-gray-400 bg-amber-50/30"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => feedbackText.trim() && runPhase1(2)}
                        disabled={!feedbackText.trim() || callStatus[2] === 'running'}
                        className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Art Director überarbeiten lassen
                      </button>
                      <span className="text-[10px] text-gray-400">~$0.002 · ~5 Sek.</span>
                    </div>
                  </div>
                )}

                {/* Feedback history — collapsed per entry */}
                {feedbackHistory.length > 0 && !showFeedback && (
                  <details className="mt-4 border-t border-gray-100 pt-3">
                    <summary className="text-[10px] text-gray-400 cursor-pointer hover:text-gray-600 select-none">
                      Bisherige Feedback-Runden ({feedbackHistory.length})
                    </summary>
                    <div className="mt-2 flex flex-col gap-3">
                      {feedbackHistory.map((h, i) => (
                        <div key={i} className="text-[10px] bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                          <div className="text-gray-400 font-semibold mb-1">Version {i + 1} — abgelehnt</div>
                          <p className="text-gray-500 line-clamp-2 mb-1 italic">{h.direction}</p>
                          <div className="text-amber-600 font-medium">Feedback: {h.feedback}</div>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            )}

            {/* Conversion Blueprint */}
            {moodboard.blueprint && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-bold text-gray-900">Conversion Blueprint</span>
                    <span className="text-[10px] text-gray-400">Call 1</span>
                  </div>
                  <button onClick={() => runPhase1(1)} className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100">
                    <RefreshCw className="w-3 h-3" /> Neu
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { k: 'Hook', v: moodboard.blueprint.strongestHook },
                    { k: 'Pain Point', v: moodboard.blueprint.painPoint },
                    { k: 'Lösung', v: moodboard.blueprint.solutionFrame },
                    { k: 'Beweis', v: moodboard.blueprint.proofType },
                    { k: 'CTA', v: moodboard.blueprint.ctaApproach },
                    { k: 'Reihenfolge', v: moodboard.blueprint.sectionOrder },
                  ].map(item => (
                    <div key={item.k} className="bg-gray-50 rounded-lg p-2.5">
                      <div className="text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1">{item.k}</div>
                      <div className="text-xs text-gray-800 leading-relaxed">{item.v}</div>
                    </div>
                  ))}
                  {(moodboard.blueprint.conversionBlockers ?? []).length > 0 && (
                    <div className="col-span-2 bg-red-50 rounded-lg p-2.5">
                      <div className="text-[9px] font-bold uppercase tracking-wider text-red-400 mb-1">Conversion Blocker</div>
                      <div className="flex flex-col gap-1">
                        {moodboard.blueprint.conversionBlockers.map((b, i) => (
                          <div key={i} className="text-xs text-red-700 flex gap-1"><span className="text-red-400">→</span>{b}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right col: Layout Wireframe + Style Palette + Image Briefing */}
          <div className="lg:col-span-5 flex flex-col gap-5">

            {/* Layout Wireframe */}
            <LayoutWireframe layout={briefing.layout} paradigm={briefing.paradigm} artDirection={artDirectionDisplay} />

            {/* Style Palette */}
            <StylePaletteCard paradigm={briefing.paradigm} animStrategy={moodboard.animStrategy} />

            {/* Image Briefing */}
            {moodboard.imageBriefing && (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-semibold text-gray-700">Fotograf Briefing</span>
                    <span className="text-[10px] text-gray-400">Call 3</span>
                  </div>
                  <button onClick={() => runPhase1(3)} className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100">
                    <RefreshCw className="w-3 h-3" /> Neu
                  </button>
                </div>
                <div className="p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://picsum.photos/seed/${moodboard.imageBriefing.picsumSeed}/600/300`}
                    alt="Bild-Vorschau"
                    className="w-full h-32 object-cover rounded-xl mb-3"
                  />
                  <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                    <div className="bg-gray-50 rounded-lg p-2"><span className="font-semibold text-gray-500">Stimmung:</span><br/>{moodboard.imageBriefing.mood}</div>
                    <div className="bg-gray-50 rounded-lg p-2"><span className="font-semibold text-gray-500">Motiv:</span><br/>{moodboard.imageBriefing.subject}</div>
                    <div className="bg-red-50 rounded-lg p-2 col-span-2 text-red-700"><span className="font-semibold">Vermeiden:</span> {moodboard.imageBriefing.avoid}</div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Running indicator */}
        {!allDone && !error && (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            Phase 1 läuft… (~8 Sekunden)
          </div>
        )}

        {/* Bottom CTA */}
        {allDone && (
          <div className="mt-8 bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 rounded-2xl p-6 flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" /> Moodboard fertig
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Diese Ergebnisse werden als fester Kontext an alle Section-Generatoren übergeben.
                Du kannst einzelne Calls mit <RefreshCw className="w-3 h-3 inline mx-0.5" /> neu generieren (~$0.002).
              </div>
            </div>
            <button onClick={proceedToGeneration}
              className="flex-shrink-0 flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white transition-colors">
              <Sparkles className="w-4 h-4" /> Hero generieren
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function MoodboardV3Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-violet-500" /></div>}>
      <MoodboardInner />
    </Suspense>
  )
}
