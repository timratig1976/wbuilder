'use client'

import { useEffect, useRef, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, Play, Copy, Check, Loader2, AlertCircle, ChevronDown, ChevronRight, Layers, Zap, DollarSign, Wrench } from 'lucide-react'

// ─── Iframe helpers (module-level, no re-creation per render) ─────────────────
const PARADIGM_VARS: Record<string, string> = {
  'bold-expressive': '--color-background:#0b0f14;--color-surface:#111827;--color-accent:#c8963e;--color-text:#f3f4f6;',
  'tech-dark': '--color-background:#050b14;--color-surface:#0d1726;--color-accent:#3b82f6;--color-text:#e2e8f0;',
  'minimal-clean': '--color-background:#ffffff;--color-surface:#f9fafb;--color-accent:#111827;--color-text:#111827;',
  'luxury-editorial': '--color-background:#0c0a08;--color-surface:#1a1612;--color-accent:#b8975a;--color-text:#f5f0e8;',
  'brutalist': '--color-background:#ffffff;--color-surface:#f0f0f0;--color-accent:#ff3300;--color-text:#000000;',
}

function buildIframeDoc(content: string, paradigm: string): string {
  const vars = PARADIGM_VARS[paradigm] ?? PARADIGM_VARS['bold-expressive']
  return `<!doctype html><html><head>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        *, *::before, *::after { box-sizing: border-box; }
        :root { ${vars} --font-heading:'Syne',sans-serif; --font-body:'Inter',sans-serif; --border-radius:10px; }
        body { margin:0; background:var(--color-background); color:var(--color-text); font-family:ui-sans-serif,system-ui,sans-serif; }
      </style>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    </head><body>${content}</body></html>`
}

// ─── Pricing ($/1M tokens) ────────────────────────────────────────────────────
const MODEL_PRICING: Record<string, { in: number; out: number; label: string; badge: string }> = {
  'claude-sonnet-4-6':         { in: 3.00,  out: 15.00, label: 'Claude Sonnet 4.6',   badge: 'Sonnet' },
  'claude-haiku-4-5':          { in: 0.80,  out: 4.00,  label: 'Claude Haiku 4.5',    badge: 'Haiku' },
  'gpt-5.4-mini-2026-03-17':   { in: 0.40,  out: 1.60,  label: 'GPT-5.4 mini',        badge: 'mini' },
  'gpt-5.4-nano':              { in: 0.10,  out: 0.40,  label: 'GPT-5.4 nano',         badge: 'nano' },
}

// Estimated token usage per call (in_k, out_k = thousands of tokens)
const CALL_SPECS = [
  { n: 1, role: 'Conversion Strategist', modelKey: 'fast',  in_k: 0.4,  out_k: 0.5,  phase: 1 },
  { n: 2, role: 'Art Director',          modelKey: 'ad',    in_k: 0.4,  out_k: 0.35, phase: 1 },
  { n: 3, role: 'Fotograf',              modelKey: 'fast',  in_k: 0.5,  out_k: 0.4,  phase: 1 },
  { n: 4, role: 'Animationsguru',        modelKey: 'fast',  in_k: 0.5,  out_k: 0.4,  phase: 1 },
  { n: 5, role: 'Texter',               modelKey: 'fast',  in_k: 1.2,  out_k: 0.5,  phase: 2 },
  { n: 6, role: 'Designer',             modelKey: 'fast',  in_k: 1.5,  out_k: 0.4,  phase: 2 },
  { n: 7, role: 'Developer',            modelKey: 'dev',   in_k: 3.0,  out_k: 4.0,  phase: 2 },
  { n: 8, role: 'QA Validator',         modelKey: 'nano',  in_k: 1.5,  out_k: 0.3,  phase: 2 },
]

function calcCost(modelId: string, in_k: number, out_k: number): number {
  const p = MODEL_PRICING[modelId] ?? MODEL_PRICING['gpt-5.4-mini-2026-03-17']
  return (in_k * p.in + out_k * p.out) / 1000
}

function CostPanel({ artDirectorModel, developerModel, fastModel, doneCalls, running }: {
  artDirectorModel: string; developerModel: string; fastModel: string
  doneCalls: number[]; running: boolean
}) {
  const modelMap: Record<string, string> = {
    ad: artDirectorModel,
    dev: developerModel,
    fast: fastModel,
    nano: 'gpt-5.4-nano',
  }

  const rows = CALL_SPECS.map(s => {
    const modelId = modelMap[s.modelKey]
    const pricing = MODEL_PRICING[modelId] ?? MODEL_PRICING['gpt-5.4-mini-2026-03-17']
    const cost = calcCost(modelId, s.in_k, s.out_k)
    const done = doneCalls.includes(s.n)
    return { ...s, modelId, pricing, cost, done }
  })

  const totalCost = rows.reduce((sum, r) => sum + r.cost, 0)
  const doneCost  = rows.filter(r => r.done).reduce((sum, r) => sum + r.cost, 0)

  const phase1Cost = rows.filter(r => r.phase === 1).reduce((sum, r) => sum + r.cost, 0)
  const phase2Cost = rows.filter(r => r.phase === 2).reduce((sum, r) => sum + r.cost, 0)

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <DollarSign className="w-3.5 h-3.5 text-green-600" />
          <span className="text-xs font-semibold text-gray-700">Kosten · 8 Calls</span>
        </div>
        <div className="flex items-center gap-2">
          {running && doneCost > 0 && (
            <span className="text-[10px] text-amber-600 font-mono">${doneCost.toFixed(4)} bisher</span>
          )}
          <span className={`text-xs font-bold font-mono ${
            totalCost < 0.02 ? 'text-green-600' : totalCost < 0.05 ? 'text-amber-600' : 'text-red-600'
          }`}>${totalCost.toFixed(4)}</span>
        </div>
      </div>

      {/* Phase totals */}
      <div className="grid grid-cols-2 divide-x divide-gray-100 border-b border-gray-100 text-[10px]">
        <div className="px-3 py-2">
          <div className="text-gray-400 mb-0.5">Phase 1 · Calls 1–4</div>
          <div className="font-mono font-semibold text-amber-600">${phase1Cost.toFixed(4)}</div>
        </div>
        <div className="px-3 py-2">
          <div className="text-gray-400 mb-0.5">Phase 2 · Calls 5–8</div>
          <div className="font-mono font-semibold text-violet-600">${phase2Cost.toFixed(4)}</div>
        </div>
      </div>

      {/* Per-call rows */}
      <div className="divide-y divide-gray-50">
        {rows.map(r => (
          <div key={r.n} className={`flex items-center gap-2 px-3 py-2 text-[10px] transition-colors ${
            r.done ? 'bg-green-50/40' : (() => { const pending = CALL_SPECS.filter(s => !doneCalls.includes(s.n)).map(s => s.n); return pending.length && r.n === Math.min(...pending) && running ? 'bg-violet-50/40' : '' })()
          }`}>
            {/* Call number */}
            <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[9px] font-bold ${
              r.done ? 'bg-green-400' : r.phase === 1 ? 'bg-amber-300' : 'bg-violet-300'
            }`}>{r.n}</div>

            {/* Role */}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-700 truncate">{r.role}</div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className={`px-1 py-0 rounded font-mono font-semibold ${
                  r.modelKey === 'dev' || r.modelKey === 'ad'
                    ? 'bg-violet-100 text-violet-700'
                    : r.modelKey === 'nano'
                    ? 'bg-gray-100 text-gray-500'
                    : 'bg-blue-50 text-blue-600'
                }`}>{r.pricing.badge}</span>
                <span className="text-gray-400">{r.in_k}k in · {r.out_k}k out</span>
              </div>
            </div>

            {/* Cost */}
            <div className={`font-mono font-semibold flex-shrink-0 ${
              r.done ? 'text-green-600' : 'text-gray-400'
            }`}>${r.cost.toFixed(4)}</div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400">
        <span>Estimates · actual may vary ±20%</span>
        <span className="font-mono">{(totalCost * 100).toFixed(2)}¢ per hero</span>
      </div>
    </div>
  )
}

const INDUSTRIES = ['software', 'construction', 'consulting', 'coaching', 'real-estate', 'healthcare', 'manufacturing', 'recruiting-b2b']
const PARADIGMS = ['bold-expressive', 'tech-dark', 'minimal-clean', 'luxury-editorial', 'brutalist']
const MODELS = [
  { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
  { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5 (fast)' },
  { id: 'gpt-5.4-mini-2026-03-17', label: 'GPT-5.4 mini' },
  { id: 'gpt-5.4-nano', label: 'GPT-5.4 nano (fastest)' },
]

// ─── Model Presets ───────────────────────────────────────────────────────────
const MODEL_PRESETS = [
  {
    id: 'max-quality',
    label: 'Max Quality',
    desc: 'Sonnet für alles — beste HTML-Qualität',
    badge: '★★★',
    badgeColor: 'bg-violet-100 text-violet-700',
    ad: 'claude-sonnet-4-6',
    dev: 'claude-sonnet-4-6',
    why: 'Sonnet schreibt das präziseste Tailwind-HTML. Density-Regeln, clamp(), aria — alles deutlich besser als mini.',
  },
  {
    id: 'balanced',
    label: 'Balanced',
    desc: 'Sonnet für AD + Developer, mini für den Rest',
    badge: '★★☆',
    badgeColor: 'bg-blue-100 text-blue-700',
    ad: 'claude-sonnet-4-6',
    dev: 'claude-sonnet-4-6',
    why: 'Standard-Konfiguration. Art Director und Developer brauchen Sonnet — der Rest (Strategist, Fotograf, Anim, Texter, Designer, QA) ist mit mini/nano erschöpft.',
  },
  {
    id: 'haiku-dev',
    label: 'Haiku Developer',
    desc: 'Sonnet für AD, Haiku 4.5 für Developer',
    badge: '★★☆',
    badgeColor: 'bg-cyan-100 text-cyan-700',
    ad: 'claude-sonnet-4-6',
    dev: 'claude-haiku-4-5',
    why: 'Haiku 4.5 ist ~4× billiger als Sonnet für Developer. HTML-Qualität ~15% schlechter — akzeptabel für Drafts. AD bleibt auf Sonnet.',
  },
  {
    id: 'fast-draft',
    label: 'Fast Draft',
    desc: 'GPT-5.4 mini für alles — günstig + schnell',
    badge: '★☆☆',
    badgeColor: 'bg-gray-100 text-gray-600',
    ad: 'gpt-5.4-mini-2026-03-17',
    dev: 'gpt-5.4-mini-2026-03-17',
    why: 'Für schnelle Iterations-Tests. HTML-Qualität deutlich niedriger — häufiger hex-Fehler, schwächere Responsive-Umsetzung. Nur für Drafts.',
  },
]

function PresetPicker({ artDirectorModel, developerModel, onPick }: {
  artDirectorModel: string
  developerModel: string
  onPick: (ad: string, dev: string) => void
}) {
  const active = MODEL_PRESETS.find(p => p.ad === artDirectorModel && p.dev === developerModel)

  // Compute cost for each preset using CALL_SPECS
  function presetCost(ad: string, dev: string) {
    const map: Record<string, string> = { ad, dev, fast: 'gpt-5.4-mini-2026-03-17', nano: 'gpt-5.4-nano' }
    return CALL_SPECS.reduce((sum, s) => sum + calcCost(map[s.modelKey], s.in_k, s.out_k), 0)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <div className="text-xs font-semibold text-gray-700">Modell-Konfiguration</div>
        <div className="text-[10px] text-gray-400 mt-0.5">Developer (Call 7) dominiert Qualität + Kosten</div>
      </div>
      <div className="divide-y divide-gray-100">
        {MODEL_PRESETS.map(p => {
          const cost = presetCost(p.ad, p.dev)
          const isActive = p.ad === artDirectorModel && p.dev === developerModel
          return (
            <button
              key={p.id}
              onClick={() => onPick(p.ad, p.dev)}
              className={`w-full text-left px-3 py-3 transition-colors flex items-start gap-3 ${
                isActive ? 'bg-violet-50' : 'hover:bg-gray-50'
              }`}
            >
              {/* Active indicator */}
              <div className={`mt-0.5 w-3 h-3 rounded-full border-2 flex-shrink-0 ${
                isActive ? 'border-violet-500 bg-violet-500' : 'border-gray-300'
              }`} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-xs font-semibold ${ isActive ? 'text-violet-700' : 'text-gray-800' }`}>{p.label}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${p.badgeColor}`}>{p.badge}</span>
                </div>
                <div className="text-[10px] text-gray-500 mb-1.5">{p.desc}</div>

                {/* Model badges */}
                <div className="flex gap-1 flex-wrap mb-1.5">
                  <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded font-mono">
                    AD: {MODEL_PRICING[p.ad]?.badge ?? p.ad}
                  </span>
                  <span className="text-[9px] bg-violet-50 text-violet-700 border border-violet-200 px-1.5 py-0.5 rounded font-mono">
                    Dev: {MODEL_PRICING[p.dev]?.badge ?? p.dev}
                  </span>
                  <span className="text-[9px] bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded font-mono">
                    Rest: mini
                  </span>
                </div>

                {/* Why note */}
                <div className="text-[9px] text-gray-400 leading-relaxed">{p.why}</div>
              </div>

              {/* Cost */}
              <div className={`text-[10px] font-mono font-bold flex-shrink-0 mt-0.5 ${
                cost < 0.02 ? 'text-green-600' : cost < 0.05 ? 'text-amber-600' : 'text-red-600'
              }`}>${cost.toFixed(4)}</div>
            </button>
          )
        })}
      </div>
      {/* Quality note */}
      <div className="px-3 py-2 bg-amber-50 border-t border-amber-100 text-[10px] text-amber-700">
        <span className="font-semibold">Tipp:</span> Developer-Qualität schlägt alles andere. Sonnet → perfekte Responsive-Regeln, clamp(), Density, aria. Mini → häufiger Abweichungen.
      </div>
    </div>
  )
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
      className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
    >
      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

function Collapsible({ title, children, defaultOpen = false, badge }: { title: string; children: React.ReactNode; defaultOpen?: boolean; badge?: string }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wider hover:bg-gray-100 transition-colors"
      >
        <span className="flex items-center gap-2">
          {title}
          {badge && <span className="text-[10px] font-normal text-gray-400 normal-case">{badge}</span>}
        </span>
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>
      {open && <div className="p-3">{children}</div>}
    </div>
  )
}

function CallBadge({ n, label, active, done, phase }: { n: number; label: string; active: boolean; done: boolean; phase: 1 | 2 }) {
  const phaseColor = phase === 1
    ? { active: 'bg-amber-50 text-amber-700 border-amber-200', done: 'bg-amber-50 text-amber-700 border-amber-200', dot_active: 'bg-amber-500', dot_done: 'bg-amber-400' }
    : { active: 'bg-violet-50 text-violet-700 border-violet-200', done: 'bg-green-50 text-green-700 border-green-200', dot_active: 'bg-violet-500', dot_done: 'bg-green-500' }
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
      done ? phaseColor.done : active ? `${phaseColor.active} animate-pulse` : 'bg-gray-50 text-gray-400 border-gray-200'
    }`}>
      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
        done ? `${phaseColor.dot_done} text-white` : active ? `${phaseColor.dot_active} text-white` : 'bg-gray-300 text-gray-600'
      }`}>{done ? '✓' : n}</span>
      {label}
    </div>
  )
}

function PhaseHeader({ phase, label, active, done }: { phase: 1 | 2; label: string; active: boolean; done: boolean }) {
  const Icon = phase === 1 ? Layers : Zap
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border ${
      done ? 'bg-gray-50 text-gray-500 border-gray-200' :
      active ? (phase === 1 ? 'bg-amber-500 text-white border-amber-500' : 'bg-violet-600 text-white border-violet-600') :
      'bg-gray-100 text-gray-400 border-gray-200'
    }`}>
      <Icon className="w-3.5 h-3.5" />
      Phase {phase} — {label}
    </div>
  )
}

function ArtDirectorV3Inner() {
  const searchParams = useSearchParams()

  // Pre-fill from URL params (handoff from moodboard-v3)
  const [companyName, setCompanyName] = useState(() => searchParams.get('companyName') || 'BauPro Management')
  const [industry, setIndustry] = useState(() => searchParams.get('industry') || 'construction')
  const [paradigm, setParadigm] = useState(() => searchParams.get('paradigm') || 'bold-expressive')
  const [usp, setUsp] = useState(() => searchParams.get('usp') || 'Baumanagement, das Projekte termingerecht und kostenstabil ins Ziel bringt.')
  const [language, setLanguage] = useState<'de' | 'en'>(() => (searchParams.get('language') as 'de' | 'en') || 'de')
  const [artDirectorModel, setArtDirectorModel] = useState('claude-sonnet-4-6')
  const [developerModel, setDeveloperModel] = useState('claude-sonnet-4-6')
  const [hasStats, setHasStats] = useState(() => searchParams.get('hasStats') !== null ? searchParams.get('hasStats') === 'true' : true)
  const [hasVisual, setHasVisual] = useState(() => searchParams.get('hasVisual') !== null ? searchParams.get('hasVisual') === 'true' : true)
  const [hasLogos, setHasLogos] = useState(() => searchParams.get('hasLogos') !== null ? searchParams.get('hasLogos') === 'true' : true)
  const [statsExamples, setStatsExamples] = useState(() => searchParams.get('statsExamples') || '200+ Projekte · 98% Termintreue · 15 Jahre Erfahrung')
  const [conversionGoal, setConversionGoal] = useState(() => searchParams.get('conversionGoal') || 'b2b-contact')
  const [layoutOverride, setLayoutOverride] = useState(() => searchParams.get('layoutOverride') || '')
  const [paradigmOverride, setParadigmOverride] = useState(() => searchParams.get('paradigmOverride') || '')
  const [creativityLevel, setCreativityLevel] = useState<'normal' | 'balanced' | 'free'>(() => (searchParams.get('creativityLevel') as 'normal' | 'balanced' | 'free') || 'balanced')
  const [brandContext, setBrandContext] = useState({
    primaryColor: searchParams.get('brandPrimary') || '',
    secondaryColor: searchParams.get('brandSecondary') || '',
    accentColor: searchParams.get('brandAccent') || '',
    fontHeadline: searchParams.get('brandFontHeadline') || '',
    fontBody: searchParams.get('brandFontBody') || '',
    logoStyle: searchParams.get('brandLogoStyle') || '',
    designNotes: searchParams.get('brandDesignNotes') || '',
  })
  const [dictList, setDictList] = useState<Array<{id: string; label?: string; paradigm: string; html_patterns: Record<string, string>; rules: {typography: {heading_font: string}; color: {base: string}}}>>([])  
  const [loadingDicts, setLoadingDicts] = useState(false)

  async function loadDictionaries() {
    setLoadingDicts(true)
    try {
      const res = await fetch('/api/style-dictionary?list=1')
      const data = await res.json()
      setDictList(data)
    } catch { /* ignore */ }
    setLoadingDicts(false)
  }

  function applyDictToBrand(dict: typeof dictList[0]) {
    const hp = dict.html_patterns ?? {}
    const extractColor = (pattern: string | undefined, attr: string) => {
      if (!pattern) return ''
      const m = pattern.match(new RegExp(`${attr}[:\s]+([#][a-fA-F0-9]{3,8}|var\([^)]+\))`))
      return m ? m[1] : ''
    }
    setBrandContext(prev => ({
      ...prev,
      fontHeadline: dict.rules?.typography?.heading_font || prev.fontHeadline,
      primaryColor: extractColor(hp.cta_primary, 'background-color') || extractColor(hp.cta_primary, 'background') || prev.primaryColor,
      accentColor: extractColor(hp.cta_primary, 'color') !== '' ? extractColor(hp.cta_primary, 'background-color') : prev.accentColor,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      designNotes: `Paradigm: ${dict.paradigm}. Base: ${dict.rules?.color?.base ?? ''}. Heading: ${dict.rules?.typography?.heading_font ?? ''} ${ (dict.rules?.typography as any)?.heading_weight ?? ''}.`,
    }))
  }

  // Moodboard context passed from phase 1 (if coming from moodboard-v3)
  const moodboardContext = {
    artDirection: searchParams.get('artDirection') || undefined,
    imageBriefing: (() => { try { const v = searchParams.get('imageBriefing'); return v ? JSON.parse(v) : undefined } catch { return undefined } })(),
    animStrategy: (() => { try { const v = searchParams.get('animStrategy'); return v ? JSON.parse(v) : undefined } catch { return undefined } })(),
    blueprint: (() => { try { const v = searchParams.get('blueprint'); return v ? JSON.parse(v) : undefined } catch { return undefined } })(),
  }
  const fromMoodboard = !!moodboardContext.artDirection

  const [running, setRunning] = useState(false)
  const [activePhase, setActivePhase] = useState(0)
  const [activeCall, setActiveCall] = useState(0)
  const [doneCalls, setDoneCalls] = useState<number[]>([])
  const [doneSlots, setDoneSlots] = useState<string[]>([])
  const [statusMsg, setStatusMsg] = useState('')
  const [error, setError] = useState('')

  // Phase 1 outputs
  const [blueprint, setBlueprint] = useState<Record<string, unknown> | null>(null)
  const [artDirection, setArtDirection] = useState('')
  const [imageBriefing, setImageBriefing] = useState<Record<string, unknown> | null>(null)
  const [animStrategy, setAnimStrategy] = useState<Record<string, unknown> | null>(null)
  // Phase 2 outputs
  const [texts, setTexts] = useState<Record<string, unknown> | null>(null)
  const [designerMockup, setDesignerMockup] = useState<Record<string, unknown> | null>(null)
  const [html, setHtml] = useState('')
  const [qa, setQa] = useState<Record<string, unknown> | null>(null)
  const [layoutId, setLayoutId] = useState('')
  const [savedToLibrary, setSavedToLibrary] = useState<{ id: string; score: number; label: string } | null>(null)
  const [autoFixes, setAutoFixes] = useState<Array<{ rule: string; count: number }>>([])
  const [bentoCheck, setBentoCheck] = useState<{ violations: Array<{ slot: string; types: string[]; count: number }>; slotTypes: Record<string, string[]> } | null>(null)

  const iframeRef = useRef<HTMLIFrameElement>(null)
  const refineIframeRef = useRef<HTMLIFrameElement>(null)
  const runningRef = useRef(false)
  const abortRef = useRef<AbortController | null>(null)
  const htmlBufferRef = useRef('')
  const [refining, setRefining] = useState(false)
  const [refineNote, setRefineNote] = useState('')
  const [refinedHtml, setRefinedHtml] = useState('')

  useEffect(() => {
    if (!iframeRef.current) return
    const doc = iframeRef.current.contentDocument
    if (!doc) return
    doc.open(); doc.write(buildIframeDoc(html, paradigm)); doc.close()
  }, [html, paradigm])

  useEffect(() => {
    if (!refinedHtml || refining) return
    const iframe = refineIframeRef.current
    if (!iframe) return
    const doc = iframe.contentDocument
    if (!doc) return
    doc.open(); doc.write(buildIframeDoc(refinedHtml, paradigm)); doc.close()
  }, [refinedHtml, paradigm, refining])

  async function refine() {
    if (refining || running || !html) return
    setRefining(true)
    setRefinedHtml('')
    setError('')
    try {
      const res = await fetch('/api/v2/artdirector-v3/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html,
          qa,
          userNote: refineNote,
          language,
          developerModel,
          paradigm,
          companyName,
          artDirection,
        }),
      })
      if (!res.ok || !res.body) throw new Error(`Refine failed: ${res.status}`)
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const evt = JSON.parse(line.slice(6))
            if (evt.type === 'html_delta') setRefinedHtml(p => p + String(evt.text ?? ''))
            if (evt.type === 'complete' && evt.html) setRefinedHtml(String(evt.html))
            if (evt.type === 'error') setError(String(evt.message ?? 'Refine error'))
          } catch { continue }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setRefining(false)
    }
  }

  function acceptRefined() {
    setHtml(refinedHtml)
    setRefinedHtml('')
    setRefineNote('')
  }

  function discardRefined() {
    setRefinedHtml('')
  }

  async function run() {
    if (runningRef.current) return
    runningRef.current = true
    // Abort any previous in-flight request
    if (abortRef.current) { abortRef.current.abort(); abortRef.current = null }
    const abort = new AbortController()
    abortRef.current = abort
    setRunning(true)
    setError('')
    setActivePhase(0)
    setActiveCall(0)
    setDoneCalls([])
    setDoneSlots([])
    setStatusMsg('')
    setBlueprint(null)
    setArtDirection('')
    setImageBriefing(null)
    setAnimStrategy(null)
    setTexts(null)
    setDesignerMockup(null)
    setHtml('')
    htmlBufferRef.current = ''
    setQa(null)
    setLayoutId('')
    setSavedToLibrary(null)
    setAutoFixes([])
    setBentoCheck(null)

    try {
      const res = await fetch('/api/v2/artdirector-v3', {
        method: 'POST',
        signal: abort.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artDirectorModel, developerModel, industry, paradigm,
          companyName, usp, language, conversionGoal,
          ...(layoutOverride ? { layoutOverride } : {}),
          ...(paradigmOverride ? { paradigmOverride } : {}),
          creativityLevel,
          ...(Object.values(brandContext).some(Boolean) ? { brandContext } : {}),
          contentInventory: {
            hasStats, hasVisual, hasLogos,
            statsExamples: statsExamples.split('·').map(s => s.trim()).filter(Boolean),
            ctaGoal: conversionGoal,
          },
          // Moodboard context — skip Phase 1 re-generation if provided
          ...(moodboardContext.artDirection ? { moodboardContext } : {}),
        }),
      })

      if (!res.ok || !res.body) {
        const t = await res.text().catch(() => '')
        throw new Error(`HTTP ${res.status}${t ? `: ${t.slice(0, 200)}` : ''}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const evt = JSON.parse(line.slice(6))
            if (evt.type === 'phase') { setActivePhase(evt.phase ?? 0) }
            if (evt.type === 'status') {
              setActiveCall(evt.call ?? 0)
              setStatusMsg(String(evt.message ?? ''))
            }
            if (evt.type === 'art_direction_delta') {
              setArtDirection(p => p + String(evt.text ?? ''))
            }
            if (evt.type === 'slot_complete') {
              setDoneSlots(d => [...d, String(evt.slot ?? '')])
            }
            if (evt.type === 'html_delta') {
              const chunk = String(evt.text ?? '')
              htmlBufferRef.current += chunk
            }
            if (evt.type === 'call_complete') {
              const n = evt.call as number
              setDoneCalls(d => d.includes(n) ? d : [...d, n])
              if (evt.blueprint) setBlueprint(evt.blueprint)
              if (evt.artDirection) setArtDirection(String(evt.artDirection))
              if (evt.imageBriefing) setImageBriefing(evt.imageBriefing)
              if (evt.animStrategy) setAnimStrategy(evt.animStrategy)
              if (evt.texts) setTexts(evt.texts)
              if (evt.designerMockup) setDesignerMockup(evt.designerMockup)
              if (evt.layoutId) setLayoutId(String(evt.layoutId))
              if (evt.qa) setQa(evt.qa)
            }
            if (evt.type === 'complete') {
              // Always replace with the final autofix-corrected HTML from the server
              const finalHtml = evt.html ? String(evt.html) : htmlBufferRef.current
              if (finalHtml) setHtml(finalHtml)
              if (evt.blueprint) setBlueprint(evt.blueprint)
              if (evt.artDirection) setArtDirection(String(evt.artDirection))
              if (evt.imageBriefing) setImageBriefing(evt.imageBriefing)
              if (evt.animStrategy) setAnimStrategy(evt.animStrategy)
              if (evt.texts) setTexts(evt.texts)
              if (evt.designerMockup) setDesignerMockup(evt.designerMockup)
              if (evt.qa) setQa(evt.qa)
              if (evt.layoutId) setLayoutId(String(evt.layoutId))
              setDoneCalls([1,2,3,4,5,6,7,8])
              setActiveCall(0)
              setActivePhase(0)
            }
            if (evt.type === 'autofix') {
              if (Array.isArray(evt.fixes)) setAutoFixes(evt.fixes as Array<{ rule: string; count: number }>)
            }
            if (evt.type === 'bento_density_check') {
              setBentoCheck({ violations: (evt.violations as Array<{ slot: string; types: string[]; count: number }>) ?? [], slotTypes: (evt.slotTypes as Record<string, string[]>) ?? {} })
            }
            if (evt.type === 'saved_to_library') {
              setSavedToLibrary({ id: String(evt.id ?? ''), score: Number(evt.score ?? 0), label: String(evt.label ?? '') })
            }
            if (evt.type === 'save_library_error') {
              console.warn('Auto-save to library failed:', evt.message)
            }
            if (evt.type === 'error') setError(String(evt.message ?? 'Unknown error'))
          } catch { continue }
        }
      }
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return // intentional abort, ignore
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      runningRef.current = false
      setRunning(false)
      setActiveCall(0)
      setActivePhase(0)
    }
  }

  const PHASE1_CALLS = [
    { n: 1, label: 'Conversion Strategist' },
    { n: 2, label: 'Art Director' },
    { n: 3, label: 'Fotograf' },
    { n: 4, label: 'Animationsguru' },
  ]
  const PHASE2_CALLS = [
    { n: 5, label: 'Texter' },
    { n: 6, label: 'Designer' },
    { n: 7, label: 'Developer' },
    { n: 8, label: 'QA Validator' },
  ]
  const BENTO_SLOTS = [
    { id: 'left', label: 'Left column' },
    { id: 'stats', label: 'Stats card' },
    { id: 'visual', label: 'Visual card' },
    { id: 'trust', label: 'Trust strip' },
  ]

  const isBentoLayout = layoutId === 'bento-3col'
  const phase1Done = [1,2,3,4].every(n => doneCalls.includes(n))
  const phase2Done = [5,6,7,8].every(n => doneCalls.includes(n))
  const qaResult = qa as { valid?: boolean; score?: number; errors?: Array<{ type: string; severity: string; message: string }> } | null
  const qaErrors = qaResult?.errors ?? []
  const qaScore = qaResult?.score ?? null

  const suggestedLayout = hasStats && hasVisual && hasLogos ? 'bento-3col' : hasStats && hasVisual ? 'bento-2col' : hasVisual && hasLogos ? 'editorial-split' : hasVisual ? 'split-50' : 'centered'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Topbar */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/builder" className="text-gray-400 hover:text-gray-700 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <span className="font-semibold text-gray-900 text-sm">Art Director v3</span>
          <span className="text-xs bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full border border-violet-200">Hero · 8 Calls · 2 Phases</span>
          {fromMoodboard && <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-200">✓ Moodboard-Kontext geladen</span>}
          {layoutId && <span className="text-xs text-gray-400 font-mono bg-gray-100 px-2 py-0.5 rounded">{layoutId}</span>}
        </div>
        <div className="flex items-center gap-2">
        {html && !running && (
          <button
            onClick={refine} disabled={refining}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-40 transition-colors font-semibold"
          >
            {refining ? <><Loader2 className="w-3 h-3 animate-spin" /> Refining…</> : <><Wrench className="w-3 h-3" /> Refine</>}
          </button>
        )}
        <button
          onClick={run} disabled={running || refining}
          className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-40 transition-colors font-semibold"
        >
          {running ? <><Loader2 className="w-3 h-3 animate-spin" /> Running…</> : <><Play className="w-3 h-3" /> Generate Hero</>}
        </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4" style={{ alignItems: 'start' }}>

        {/* Col 1: Inputs */}
        <div className="lg:col-span-1 flex flex-col gap-3">
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Inputs</div>
            <label className="text-xs text-gray-500">Company</label>
            <input value={companyName} onChange={e => setCompanyName(e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
            <label className="text-xs text-gray-500">Industry</label>
            <select value={industry} onChange={e => setIndustry(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
              {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
            <label className="text-xs text-gray-500">Paradigm</label>
            <select value={paradigm} onChange={e => setParadigm(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
              {PARADIGMS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <label className="text-xs text-gray-500">Language</label>
            <select value={language} onChange={e => setLanguage(e.target.value as 'de' | 'en')} className="px-3 py-2 border rounded-lg text-sm">
              <option value="de">de</option>
              <option value="en">en</option>
            </select>
            <details open>
              <summary className="text-xs text-gray-500 cursor-pointer select-none list-none flex items-center justify-between">
                <span>Modell-Preset</span>
                <span className="text-[10px] text-violet-600 font-mono bg-violet-50 px-1.5 py-0.5 rounded">
                  {MODEL_PRICING[artDirectorModel]?.badge ?? '?'} / {MODEL_PRICING[developerModel]?.badge ?? '?'}
                </span>
              </summary>
              <div className="mt-2">
                <PresetPicker
                  artDirectorModel={artDirectorModel}
                  developerModel={developerModel}
                  onPick={(ad, dev) => { setArtDirectorModel(ad); setDeveloperModel(dev) }}
                />
              </div>
            </details>
            <details>
              <summary className="text-[10px] text-gray-400 cursor-pointer select-none list-none hover:text-gray-600">
                ▸ Manuell überschreiben
              </summary>
              <div className="mt-2 flex flex-col gap-2">
                <label className="text-xs text-gray-500">Art Director</label>
                <select value={artDirectorModel} onChange={e => setArtDirectorModel(e.target.value)} className="px-3 py-2 border rounded-lg text-xs">
                  {MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                </select>
                <label className="text-xs text-gray-500">Developer</label>
                <select value={developerModel} onChange={e => setDeveloperModel(e.target.value)} className="px-3 py-2 border rounded-lg text-xs">
                  {MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                </select>
              </div>
            </details>
            <label className="text-xs text-gray-500">USP</label>
            <textarea value={usp} onChange={e => setUsp(e.target.value)} className="px-3 py-2 border rounded-lg text-sm min-h-20" />
            <details className="border border-gray-200 rounded-lg overflow-hidden">
              <summary className="px-3 py-2 text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-50 flex items-center justify-between">
                Brand Context
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  Object.values(brandContext).some(Boolean) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                }`}>{Object.values(brandContext).filter(Boolean).length > 0 ? `${Object.values(brandContext).filter(Boolean).length} fields` : 'empty'}</span>
              </summary>
              <div className="px-3 pb-3 pt-2 flex flex-col gap-2 bg-gray-50">
                <div className="flex gap-1">
                  <select
                    onChange={e => { const d = dictList.find(x => x.id === e.target.value); if (d) applyDictToBrand(d) }}
                    className="flex-1 px-2 py-1.5 border rounded text-xs"
                    defaultValue=""
                  >
                    <option value="" disabled>Auto-fill from Style Dictionary…</option>
                    {dictList.map(d => <option key={d.id} value={d.id}>{d.label ?? d.id} ({d.paradigm})</option>)}
                  </select>
                  <button onClick={loadDictionaries} disabled={loadingDicts} className="px-2 py-1.5 border rounded text-xs hover:bg-white">
                    {loadingDicts ? '⏳' : '↻'}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <label className="text-[10px] text-gray-400">Primary</label>
                    <input value={brandContext.primaryColor} onChange={e => setBrandContext(p => ({...p, primaryColor: e.target.value}))} placeholder="#1a2b3c" className="w-full px-2 py-1 border rounded text-xs font-mono" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400">Secondary</label>
                    <input value={brandContext.secondaryColor} onChange={e => setBrandContext(p => ({...p, secondaryColor: e.target.value}))} placeholder="#e5e7eb" className="w-full px-2 py-1 border rounded text-xs font-mono" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400">Accent</label>
                    <input value={brandContext.accentColor} onChange={e => setBrandContext(p => ({...p, accentColor: e.target.value}))} placeholder="#3b82f6" className="w-full px-2 py-1 border rounded text-xs font-mono" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400">Logo Style</label>
                    <input value={brandContext.logoStyle} onChange={e => setBrandContext(p => ({...p, logoStyle: e.target.value}))} placeholder="wordmark, geometric" className="w-full px-2 py-1 border rounded text-xs" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400">Headline Font</label>
                    <input value={brandContext.fontHeadline} onChange={e => setBrandContext(p => ({...p, fontHeadline: e.target.value}))} placeholder="Inter, Playfair Display" className="w-full px-2 py-1 border rounded text-xs font-mono" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400">Body Font</label>
                    <input value={brandContext.fontBody} onChange={e => setBrandContext(p => ({...p, fontBody: e.target.value}))} placeholder="Inter, DM Sans" className="w-full px-2 py-1 border rounded text-xs font-mono" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-gray-400">Design Notes / CD Preferences</label>
                  <textarea value={brandContext.designNotes} onChange={e => setBrandContext(p => ({...p, designNotes: e.target.value}))} placeholder="z.B. 'viel Weissraum, industriell-rau, keine Rundungen'" rows={2} className="w-full px-2 py-1.5 border rounded text-xs resize-none" />
                </div>
                <button onClick={() => setBrandContext({primaryColor:'',secondaryColor:'',accentColor:'',fontHeadline:'',fontBody:'',logoStyle:'',designNotes:''})} className="text-[10px] text-gray-400 hover:text-red-400 text-right">Clear brand</button>
              </div>
            </details>
            <label className="text-xs text-gray-500">Creative Freedom</label>
            <div className="flex gap-1">
              {(['normal', 'balanced', 'free'] as const).map(level => (
                <button
                  key={level}
                  onClick={() => setCreativityLevel(level)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded border transition-colors ${
                    creativityLevel === level
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {level === 'normal' ? '🎯 Normal' : level === 'balanced' ? '⚖️ Balanced' : '🔥 Free'}
                </button>
              ))}
            </div>
            <label className="text-xs text-gray-500">Paradigm Override</label>
            <select value={paradigmOverride} onChange={e => setParadigmOverride(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
              <option value="">Auto (Art Director decides)</option>
              <option value="bold-expressive">Bold Expressive — stark, kontrastreich</option>
              <option value="tech-dark">Tech Dark — dunkel, modern, präzise</option>
              <option value="minimal-clean">Minimal Clean — viel Weißraum, reduziert</option>
              <option value="luxury-editorial">Luxury Editorial — premium, editorial</option>
            </select>
            <label className="text-xs text-gray-500">Layout Override</label>
            <select value={layoutOverride} onChange={e => setLayoutOverride(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
              <option value="">Auto (Designer decides)</option>
              <option value="bento-3col">bento-3col — 3 columns</option>
              <option value="bento-asymmetric-right">bento-asymmetric — wide+visual</option>
              <option value="split-50">split-50 — 50/50</option>
              <option value="centered">centered — full width</option>
              <option value="editorial-split">editorial-split</option>
            </select>
            <label className="text-xs text-gray-500">Conversion Goal</label>
            <select value={conversionGoal} onChange={e => setConversionGoal(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
              <option value="b2b-contact">B2B — Kontakt / Anfrage</option>
              <option value="b2b-demo">B2B — Demo buchen</option>
              <option value="b2b-tender">B2B — Ausschreibung / RFP</option>
              <option value="saas-trial">SaaS — Free Trial</option>
              <option value="saas-signup">SaaS — Account erstellen</option>
              <option value="ecom-buy">E-Com — Kauf</option>
              <option value="lead-form">Lead — Formular ausfüllen</option>
              <option value="newsletter">Newsletter anmelden</option>
              <option value="download">Download / Whitepaper</option>
            </select>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Content Inventory</div>
            <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
              <input type="checkbox" checked={hasStats} onChange={e => setHasStats(e.target.checked)} className="rounded" /> Stats / Kennzahlen
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
              <input type="checkbox" checked={hasVisual} onChange={e => setHasVisual(e.target.checked)} className="rounded" /> Visuelles Asset
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
              <input type="checkbox" checked={hasLogos} onChange={e => setHasLogos(e.target.checked)} className="rounded" /> Referenz-Logos
            </label>
            {hasStats && (
              <input value={statsExamples} onChange={e => setStatsExamples(e.target.value)}
                className="px-3 py-2 border rounded-lg text-xs" placeholder="200+ Projekte · 98% Termintreue" />
            )}
            <div className="text-[10px] text-gray-400 bg-gray-50 rounded px-2 py-1.5">
              → Suggested: <span className="text-violet-600 font-semibold">{suggestedLayout}</span>
              {layoutId && layoutId !== suggestedLayout && <span className="text-amber-600"> → Designer chose: {layoutId}</span>}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span className="break-words">{error}</span>
            </div>
          )}
        </div>

        {/* Col 2: Two-phase pipeline */}
        <div className="lg:col-span-2 flex flex-col gap-3 text-[10px]">

          {/* Phase 1 block */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <PhaseHeader phase={1} label="Moodboard & Strategie" active={activePhase === 1} done={phase1Done} />
              <p className="text-[10px] text-gray-400 mt-1 px-1">Einmalig · page-weit · sequentiell + parallel</p>
            </div>
            <div className="p-3 flex flex-col gap-2">
              {PHASE1_CALLS.map(c => (
                <div key={c.n}>
                  <CallBadge n={c.n} label={c.label} active={activeCall === c.n} done={doneCalls.includes(c.n)} phase={1} />
                </div>
              ))}
              <div className="text-[10px] text-gray-400 bg-amber-50 rounded px-2 py-1 mt-1 border border-amber-100">
                Calls 3+4 laufen parallel
              </div>
            </div>
          </div>

          {/* Phase 2 block */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <PhaseHeader phase={2} label="Section Generation · hero" active={activePhase === 2} done={phase2Done} />
              <p className="text-[10px] text-gray-400 mt-1 px-1">Pro Section · wird später parallel für alle Sections laufen</p>
            </div>
            <div className="p-3 flex flex-col gap-2">
              {PHASE2_CALLS.map(c => (
                <div key={c.n}>
                  <CallBadge n={c.n} label={c.label} active={activeCall === c.n} done={doneCalls.includes(c.n)} phase={2} />
                  {c.n === 7 && isBentoLayout && (activeCall === 7 || doneCalls.includes(7)) && (
                    <div className="mt-1 ml-7 flex flex-col gap-1">
                      {BENTO_SLOTS.map(s => (
                        <div key={s.id} className={`text-[10px] px-2 py-0.5 rounded flex items-center gap-1 ${doneSlots.includes(s.id) ? 'text-green-600' : activeCall === 7 ? 'text-violet-500' : 'text-gray-400'}`}>
                          <span>{doneSlots.includes(s.id) ? '✓' : '○'}</span>{s.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Cost breakdown */}
          <CostPanel
            artDirectorModel={artDirectorModel}
            developerModel={developerModel}
            fastModel="gpt-5.4-mini-2026-03-17"
            doneCalls={doneCalls}
            running={running}
          />

          {/* Status + QA score */}
          {statusMsg && running && (
            <div className="text-[10px] text-gray-500 italic bg-white border border-gray-200 rounded-lg px-3 py-2">{statusMsg}</div>
          )}
          {qaScore !== null && (
            <div className={`text-xs font-semibold text-center py-2 rounded-lg border ${qaScore >= 80 ? 'bg-green-50 text-green-700 border-green-200' : qaScore >= 60 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
              QA {qaScore}/100 · {qaErrors.filter(e => e.severity === 'error').length} errors · {qaErrors.filter(e => e.severity === 'warning').length} warnings
            </div>
          )}
          {savedToLibrary && (
            <div className="flex items-center gap-2 text-xs bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-green-800">
              <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
              <span><span className="font-semibold">Auto-saved to Section Library</span> — Score {savedToLibrary.score}/100</span>
              <a href="/section-library" target="_blank" className="ml-auto text-green-600 underline underline-offset-2 hover:text-green-800 whitespace-nowrap">
                Ansehen →
              </a>
            </div>
          )}
          {qaScore !== null && qaScore < 80 && (
            <div className="text-[10px] text-gray-400 text-center">
              Kein Auto-Save — Score unter 80 (Threshold)
            </div>
          )}
          {html && !running && (
            <div className="border border-amber-200 bg-amber-50 rounded-lg px-3 py-2 flex flex-col gap-2">
              <div className="text-[10px] font-semibold text-amber-700 flex items-center gap-1.5">
                <Wrench className="w-3 h-3" /> Refine / Repair
              </div>
              <input
                type="text"
                value={refineNote}
                onChange={e => setRefineNote(e.target.value)}
                placeholder="Optional: font zu groß, Farben falsch, Layout…"
                className="w-full text-[11px] border border-amber-200 rounded px-2 py-1.5 bg-white placeholder-amber-300 text-gray-700 focus:outline-none focus:ring-1 focus:ring-amber-400"
                onKeyDown={e => e.key === 'Enter' && refine()}
              />
              <button
                onClick={refine} disabled={refining || running}
                className="w-full flex items-center justify-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-40 transition-colors"
              >
                {refining ? <><Loader2 className="w-3 h-3 animate-spin" /> Refining…</> : <><Wrench className="w-3 h-3" /> Repair Section</>}
              </button>
            </div>
          )}
          {bentoCheck && (
            <div className={`border rounded-lg px-3 py-2 ${bentoCheck.violations.length > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
              <div className={`flex items-center gap-1.5 text-[10px] font-semibold mb-1.5 ${bentoCheck.violations.length > 0 ? 'text-red-700' : 'text-green-700'}`}>
                {bentoCheck.violations.length > 0 ? <AlertCircle className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                Bento Density — {bentoCheck.violations.length > 0 ? `${bentoCheck.violations.length} Violation${bentoCheck.violations.length > 1 ? 's' : ''}` : 'OK'}
              </div>
              <div className="flex flex-col gap-1">
                {Object.entries(bentoCheck.slotTypes).map(([slot, types]) => {
                  const isViolation = bentoCheck.violations.some(v => v.slot === slot)
                  return (
                    <div key={slot} className={`flex items-start justify-between gap-2 text-[9px] rounded px-1.5 py-1 ${isViolation ? 'bg-red-100' : 'bg-white/60'}`}>
                      <span className={`font-mono font-semibold ${isViolation ? 'text-red-700' : 'text-gray-500'}`}>{slot}</span>
                      <div className="flex gap-1 flex-wrap justify-end">
                        {types.length === 0
                          ? <span className="text-gray-300 italic">empty</span>
                          : types.map(t => (
                            <span key={t} className={`px-1 rounded font-mono ${t === 'cta' ? 'bg-gray-100 text-gray-400' : isViolation ? 'bg-red-200 text-red-700 font-bold' : 'bg-green-100 text-green-700'}`}>{t}</span>
                          ))
                        }
                      </div>
                    </div>
                  )
                })}
              </div>
              {bentoCheck.violations.length > 0 && (
                <div className="text-[9px] text-red-500 mt-1.5 italic">Density rule: max 1 primary type per slot (CTA exempt)</div>
              )}
            </div>
          )}
          {autoFixes.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-blue-700 mb-1.5">
                <Check className="w-3 h-3" /> Auto-Fix — {autoFixes.reduce((s, f) => s + f.count, 0)} Korrekturen
              </div>
              <div className="flex flex-col gap-1">
                {autoFixes.map((f, i) => (
                  <div key={i} className="flex items-center justify-between text-[10px]">
                    <span className="text-blue-600 font-mono">{f.rule}</span>
                    <span className="text-blue-500 font-semibold">×{f.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Intermediate outputs */}
          {blueprint && (
            <Collapsible title="Blueprint" badge="Call 1">
              <pre className="text-[10px] font-mono text-gray-700 whitespace-pre-wrap">{JSON.stringify(blueprint, null, 2)}</pre>
            </Collapsible>
          )}
          {artDirection && (
            <Collapsible title="Art Direction" badge="Call 2" defaultOpen>
              <div className="flex items-start justify-between gap-2">
                <pre className="text-[11px] text-gray-800 whitespace-pre-wrap leading-relaxed flex-1">{artDirection}</pre>
                <CopyBtn text={artDirection} />
              </div>
            </Collapsible>
          )}
          {imageBriefing && (
            <Collapsible title="Fotograf" badge="Call 3">
              <pre className="text-[10px] font-mono text-gray-700 whitespace-pre-wrap">{JSON.stringify(imageBriefing, null, 2)}</pre>
            </Collapsible>
          )}
          {animStrategy && (
            <Collapsible title="Animationsguru" badge="Call 4">
              <pre className="text-[10px] font-mono text-gray-700 whitespace-pre-wrap">{JSON.stringify(animStrategy, null, 2)}</pre>
            </Collapsible>
          )}
          {texts && (
            <Collapsible title="Texter" badge="Call 5">
              <pre className="text-[10px] font-mono text-gray-700 whitespace-pre-wrap">{JSON.stringify(texts, null, 2)}</pre>
            </Collapsible>
          )}
          {designerMockup && (
            <Collapsible title="Designer Mockup" badge="Call 6" defaultOpen>
              <pre className="text-[10px] font-mono text-gray-700 whitespace-pre-wrap">{JSON.stringify(designerMockup, null, 2)}</pre>
            </Collapsible>
          )}
          {qaErrors.length > 0 && (
            <Collapsible title={`QA Issues (${qaErrors.length})`} badge="Call 8">
              <div className="flex flex-col gap-1">
                {qaErrors.map((e, i) => (
                  <div key={i} className={`text-[10px] px-2 py-1 rounded ${e.severity === 'error' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                    <span className="font-semibold">{e.type}:</span> {e.message}
                  </div>
                ))}
              </div>
            </Collapsible>
          )}
        </div>

        {/* Col 3: HTML + Preview */}
        <div className="lg:col-span-9 flex flex-col gap-3">

          {/* Refine compare banner */}
          {refinedHtml && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-amber-800">
                {refining ? '⏳ Generating refined version…' : '✨ Refined version ready — preview below'}
              </div>
              {!refining && (
                <div className="flex items-center gap-2">
                  <button onClick={discardRefined} className="text-xs px-3 py-1.5 rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-100 transition-colors font-medium">Discard</button>
                  <button onClick={acceptRefined} className="text-xs px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold transition-colors">✓ Accept Refined</button>
                </div>
              )}
            </div>
          )}

          {/* Side-by-side when refine pending, single when not */}
          <div className={`flex gap-3 ${refinedHtml ? 'flex-row' : 'flex-col'}`} style={{ flex: 1 }}>

            {/* Original / current */}
            <div className={`bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col ${refinedHtml ? 'flex-1' : ''}`}>
              <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <span className={`text-xs font-semibold uppercase tracking-wider ${refinedHtml ? 'text-gray-400' : 'text-gray-500'}`}>
                  {refinedHtml ? '← Current' : 'HTML + Preview'}
                </span>
                <CopyBtn text={html} />
              </div>
              {!refinedHtml && html && (
                <details className="border-b border-gray-200 group">
                  <summary className="px-3 py-1.5 text-[10px] text-gray-400 cursor-pointer hover:text-gray-600 select-none list-none flex items-center gap-1">
                    <ChevronRight className="w-3 h-3 group-open:rotate-90 transition-transform" /> HTML Source
                  </summary>
                  <div className="max-h-40 overflow-auto">
                    <pre className="font-mono text-[10px] leading-relaxed p-3 text-gray-700 whitespace-pre-wrap">{html}</pre>
                  </div>
                </details>
              )}
              <div className="bg-black" style={{ height: refinedHtml ? '720px' : '800px' }}>
                <iframe ref={iframeRef} className="w-full h-full border-0" sandbox="allow-scripts allow-same-origin" title="v3 hero preview" />
              </div>
            </div>

            {/* Refined version */}
            {refinedHtml && (
              <div className="flex-1 bg-white border-2 border-amber-400 rounded-xl overflow-hidden flex flex-col">
                <div className="px-3 py-2 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Refined →</span>
                  <CopyBtn text={refinedHtml} />
                </div>
                <div className="bg-black relative" style={{ height: '720px' }}>
                  <iframe
                    ref={refineIframeRef}
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-same-origin"
                    title="v3 hero refined"
                  />
                  {refining && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                      <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  )
}

export default function ArtDirectorV3Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-violet-500" /></div>}>
      <ArtDirectorV3Inner />
    </Suspense>
  )
}
