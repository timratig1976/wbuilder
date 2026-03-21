'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles, Building2, Users, BarChart3, Image, Award, Video, Monitor, ChevronRight } from 'lucide-react'

// ─── Data ─────────────────────────────────────────────────────────────────────

const INDUSTRIES = [
  { id: 'software', label: 'Software / SaaS', icon: '💻', coreVisual: 'UI-Screenshot', proof: 'Logos + Uptime', cta: 'Kostenlos starten' },
  { id: 'construction', label: 'Baumanagement', icon: '🏗️', coreVisual: 'Projektfoto', proof: 'Stats + Jahre', cta: 'Beratungsgespräch' },
  { id: 'consulting', label: 'Consulting', icon: '📋', coreVisual: 'Team-Foto', proof: 'Logos + Cases', cta: 'Erstgespräch buchen' },
  { id: 'coaching', label: 'Coaching', icon: '🎯', coreVisual: 'Porträtfoto', proof: 'Zitate + Transformation', cta: 'Gespräch buchen' },
  { id: 'real-estate', label: 'Immobilien', icon: '🏠', coreVisual: 'Immobilienfoto', proof: 'Objekte + Jahre', cta: 'Objekt anfragen' },
  { id: 'healthcare', label: 'Gesundheit', icon: '⚕️', coreVisual: 'Praxis/Team', proof: 'Qualifikationen', cta: 'Termin buchen' },
  { id: 'manufacturing', label: 'Industrie / Fertigung', icon: '⚙️', coreVisual: 'Produktfoto', proof: 'Zertifikate', cta: 'Anfrage stellen' },
  { id: 'recruiting-b2b', label: 'Recruiting / HR', icon: '🤝', coreVisual: 'Team-Foto', proof: 'Erfolgsquoten', cta: 'Beratung starten' },
]

const PARADIGMS = [
  {
    id: 'bold-expressive',
    label: 'Bold & Expressive',
    desc: 'Energetisch, warm, dynamisch',
    bg: 'bg-gray-950',
    accent: '#c8963e',
    textColor: 'text-white',
    preview: { bg: '#0f0f0f', accent: '#c8963e', font: 'Syne' },
    fonts: 'Syne + Inter',
    effects: 'Orbs · Gradient-Text',
  },
  {
    id: 'tech-dark',
    label: 'Tech Dark',
    desc: 'Dunkel, elektrisch, futuristisch',
    bg: 'bg-slate-950',
    accent: '#3b82f6',
    textColor: 'text-white',
    preview: { bg: '#050b14', accent: '#3b82f6', font: 'Syne' },
    fonts: 'Syne + Mono',
    effects: 'Glassmorphism · Grid',
  },
  {
    id: 'minimal-clean',
    label: 'Minimal Clean',
    desc: 'Hell, ruhig, reduziert',
    bg: 'bg-white',
    accent: '#111827',
    textColor: 'text-gray-900',
    preview: { bg: '#ffffff', accent: '#111827', font: 'Inter' },
    fonts: 'Inter + Inter',
    effects: 'Kein Dekor · Viel Weißraum',
  },
  {
    id: 'luxury-editorial',
    label: 'Luxury Editorial',
    desc: 'Cream, Serif, premium',
    bg: 'bg-stone-100',
    accent: '#b8975a',
    textColor: 'text-stone-900',
    preview: { bg: '#faf9f5', accent: '#b8975a', font: 'Playfair' },
    fonts: 'Playfair + Inter',
    effects: 'Dünne Linien · Serif',
  },
  {
    id: 'brutalist',
    label: 'Brutalist',
    desc: 'Raw, flat, direkt',
    bg: 'bg-stone-200',
    accent: '#ff3300',
    textColor: 'text-black',
    preview: { bg: '#f2efe8', accent: '#ff3300', font: 'Syne Black' },
    fonts: 'Syne Black',
    effects: '2px Borders · Flat',
  },
]

const ANIMATION_BUDGETS = [
  { id: 'none', label: 'Keine', desc: 'Statisch, maximale Performance' },
  { id: 'subtle', label: 'Subtil', desc: 'Leichte Übergänge, dezente Entrances' },
  { id: 'moderate', label: 'Moderat', desc: 'Fade-ups, Hover-Effekte, Hintergrund-Motion' },
  { id: 'expressive', label: 'Expressiv', desc: 'Viel Bewegung, Ambient Orbs, Stagger-Animations' },
]

// Layout decision from content
function pickLayout(inv: ContentInventory): string {
  if (inv.hasStats && inv.hasVisual && inv.hasLogos) return 'bento-3col'
  if (inv.hasDemo && inv.hasStats) return 'bento-asymmetric-right'
  if (inv.hasVideo) return 'bottom-anchored'
  if (inv.hasStats && inv.hasVisual) return 'bento-2col'
  if (inv.hasVisual && inv.hasLogos) return 'editorial-split'
  if (inv.hasVisual) return 'split-50'
  return 'centered'
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ContentInventory = {
  hasStats: boolean
  hasVisual: boolean
  hasLogos: boolean
  hasDemo: boolean
  hasVideo: boolean
  statsExamples: string
  ctaGoal: string
}

type BriefingState = {
  // Step 1
  companyName: string
  industry: string
  usp: string
  contentInventory: ContentInventory
  // Step 2
  paradigm: string
  animationBudget: string
  glassmorphism: boolean
  gradientText: boolean
  // Step 3
  layout: string
  language: 'de' | 'en'
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  const steps = [
    { n: 1, label: 'Moodboard' },
    { n: 2, label: 'Style' },
    { n: 3, label: 'Layout' },
  ]
  return (
    <div className="flex items-center gap-0">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
            current === s.n ? 'bg-violet-600 text-white' :
            current > s.n ? 'bg-green-100 text-green-700' :
            'bg-gray-100 text-gray-400'
          }`}>
            {current > s.n ? <Check className="w-3 h-3" /> : <span>{s.n}</span>}
            {s.label}
          </div>
          {i < steps.length - 1 && (
            <div className={`w-8 h-0.5 mx-1 ${current > s.n + 1 || (current > s.n) ? 'bg-green-300' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

function ParadigmCard({ p, selected, onSelect }: { p: typeof PARADIGMS[0]; selected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={`relative rounded-2xl overflow-hidden border-2 transition-all text-left w-full ${
        selected ? 'border-violet-500 ring-2 ring-violet-200' : 'border-gray-200 hover:border-gray-400'
      }`}
    >
      {/* Mini preview */}
      <div className="h-24 relative flex items-end p-3" style={{ background: p.preview.bg }}>
        <div className="space-y-1.5 w-full">
          <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: p.preview.accent }}>{p.id.replace('-', ' ')}</div>
          <div className="h-2 rounded w-3/4" style={{ background: p.preview.accent, opacity: 0.9 }} />
          <div className="h-1.5 rounded w-1/2 bg-white opacity-30" />
        </div>
        {selected && (
          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center">
            <Check className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
      <div className="p-3 bg-white border-t border-gray-100">
        <div className="text-xs font-semibold text-gray-900">{p.label}</div>
        <div className="text-[10px] text-gray-400 mt-0.5">{p.desc}</div>
        <div className="text-[10px] text-gray-400 mt-1">{p.fonts}</div>
      </div>
    </button>
  )
}

function ContentToggle({ icon, label, hint, checked, onChange }: {
  icon: React.ReactNode; label: string; hint: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 text-left transition-all ${
        checked ? 'border-violet-400 bg-violet-50' : 'border-gray-200 hover:border-gray-300 bg-white'
      }`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${checked ? 'bg-violet-100 text-violet-600' : 'bg-gray-100 text-gray-400'}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900">{label}</div>
        <div className="text-xs text-gray-400">{hint}</div>
      </div>
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${checked ? 'bg-violet-500 border-violet-500' : 'border-gray-300'}`}>
        {checked && <Check className="w-3 h-3 text-white" />}
      </div>
    </button>
  )
}

const LAYOUT_CARDS = [
  {
    id: 'bento-3col',
    label: 'Bento 3-Col',
    desc: 'Stats + Visual + Logos',
    requires: (inv: ContentInventory) => inv.hasStats && inv.hasVisual && inv.hasLogos,
    preview: (
      <div className="grid grid-cols-12 gap-1 h-full">
        <div className="col-span-5 bg-gray-700 rounded flex flex-col p-1.5 gap-1">
          <div className="h-1.5 bg-orange-400 rounded w-1/2" />
          <div className="h-2 bg-white rounded w-full" />
          <div className="h-1.5 bg-white opacity-50 rounded w-3/4" />
          <div className="mt-auto flex gap-1"><div className="h-2 bg-orange-400 rounded flex-1" /><div className="h-2 bg-gray-500 rounded flex-1" /></div>
        </div>
        <div className="col-span-3 bg-gray-600 rounded flex flex-col justify-around p-1.5">
          {[0,1,2].map(i => <div key={i} className="h-1.5 bg-white opacity-40 rounded" />)}
        </div>
        <div className="col-span-4 bg-gray-600 rounded overflow-hidden">
          <div className="w-full h-full bg-gradient-to-br from-gray-500 to-gray-700" />
        </div>
        <div className="col-span-12 bg-gray-700 rounded h-3 flex items-center px-2 gap-1">
          {[0,1,2,3,4].map(i => <div key={i} className="h-1 bg-white opacity-20 rounded flex-1" />)}
        </div>
      </div>
    ),
  },
  {
    id: 'bento-2col',
    label: 'Bento 2-Col',
    desc: 'Stats + Visual',
    requires: (inv: ContentInventory) => inv.hasStats && inv.hasVisual,
    preview: (
      <div className="grid grid-cols-12 gap-1 h-full">
        <div className="col-span-6 bg-gray-700 rounded flex flex-col p-1.5 gap-1">
          <div className="h-1.5 bg-orange-400 rounded w-1/2" />
          <div className="h-2 bg-white rounded" />
          <div className="h-1.5 bg-white opacity-50 rounded w-3/4" />
          <div className="mt-auto flex gap-1"><div className="h-2 bg-orange-400 rounded flex-1" /></div>
        </div>
        <div className="col-span-6 grid grid-rows-2 gap-1">
          <div className="bg-gray-600 rounded overflow-hidden"><div className="w-full h-full bg-gradient-to-br from-gray-500 to-gray-700" /></div>
          <div className="bg-gray-700 rounded flex items-center justify-around px-2">
            {[0,1,2].map(i => <div key={i} className="flex flex-col items-center gap-0.5"><div className="h-2 w-4 bg-orange-400 rounded" /><div className="h-1 w-3 bg-white opacity-30 rounded" /></div>)}
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'split-50',
    label: 'Split Screen',
    desc: 'Text links · Visual rechts',
    requires: (inv: ContentInventory) => inv.hasVisual,
    preview: (
      <div className="grid grid-cols-2 gap-1 h-full">
        <div className="bg-gray-700 rounded flex flex-col p-1.5 gap-1">
          <div className="h-1.5 bg-orange-400 rounded w-1/2" />
          <div className="h-2 bg-white rounded" />
          <div className="h-1.5 bg-white opacity-50 rounded w-3/4" />
          <div className="mt-auto"><div className="h-2 bg-orange-400 rounded w-3/4" /></div>
        </div>
        <div className="bg-gray-600 rounded overflow-hidden"><div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-700 rounded" /></div>
      </div>
    ),
  },
  {
    id: 'editorial-split',
    label: 'Editorial Split',
    desc: 'Visual + Logos',
    requires: (inv: ContentInventory) => inv.hasVisual && inv.hasLogos,
    preview: (
      <div className="flex flex-col gap-1 h-full">
        <div className="flex-1 grid grid-cols-5 gap-1">
          <div className="col-span-3 bg-gray-600 rounded overflow-hidden"><div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-600" /></div>
          <div className="col-span-2 bg-gray-700 rounded flex flex-col p-1.5 gap-1">
            <div className="h-2 bg-white rounded" />
            <div className="h-1.5 bg-white opacity-50 rounded w-3/4" />
            <div className="mt-auto"><div className="h-2 bg-orange-400 rounded" /></div>
          </div>
        </div>
        <div className="h-4 bg-gray-700 rounded flex items-center justify-around px-2">
          {[0,1,2,3].map(i => <div key={i} className="h-1 w-5 bg-white opacity-20 rounded" />)}
        </div>
      </div>
    ),
  },
  {
    id: 'centered',
    label: 'Centered',
    desc: 'Text-fokussiert, kein Visual',
    requires: () => true,
    preview: (
      <div className="flex flex-col items-center justify-center h-full gap-1.5 px-4">
        <div className="h-1.5 bg-orange-400 rounded w-1/3" />
        <div className="h-2 bg-white rounded w-full" />
        <div className="h-1.5 bg-white opacity-50 rounded w-4/5" />
        <div className="flex gap-2 mt-1"><div className="h-2 bg-orange-400 rounded w-12" /><div className="h-2 bg-gray-600 rounded w-10" /></div>
      </div>
    ),
  },
  {
    id: 'bento-asymmetric-right',
    label: 'Demo Focus',
    desc: 'Demo / Screenshot rechts',
    requires: (inv: ContentInventory) => inv.hasDemo,
    preview: (
      <div className="grid grid-cols-12 gap-1 h-full">
        <div className="col-span-5 bg-gray-700 rounded flex flex-col p-1.5 gap-1">
          <div className="h-1.5 bg-orange-400 rounded w-1/2" />
          <div className="h-2 bg-white rounded" />
          <div className="h-1.5 bg-white opacity-50 rounded w-3/4" />
          <div className="mt-auto"><div className="h-2 bg-orange-400 rounded" /></div>
        </div>
        <div className="col-span-7 bg-gray-600 rounded overflow-hidden p-1">
          <div className="w-full h-full bg-gray-500 rounded border border-gray-400 flex flex-col gap-0.5 p-1">
            <div className="h-1 bg-gray-400 rounded w-full" />
            <div className="h-1 bg-gray-400 rounded w-4/5" />
            <div className="h-1 bg-gray-400 rounded w-3/5" />
          </div>
        </div>
      </div>
    ),
  },
]

// ─── Main component ───────────────────────────────────────────────────────────

export default function BriefingV3Page() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [animating, setAnimating] = useState(false)

  const [brief, setBrief] = useState<BriefingState>({
    companyName: '',
    industry: '',
    usp: '',
    contentInventory: { hasStats: false, hasVisual: false, hasLogos: false, hasDemo: false, hasVideo: false, statsExamples: '', ctaGoal: 'contact' },
    paradigm: '',
    animationBudget: 'subtle',
    glassmorphism: false,
    gradientText: true,
    layout: '',
    language: 'de',
  })

  // Auto-pick layout when content inventory changes
  useEffect(() => {
    const picked = pickLayout(brief.contentInventory)
    setBrief(b => ({ ...b, layout: picked }))
  }, [brief.contentInventory])

  // Auto-pick glassmorphism / gradient based on paradigm
  useEffect(() => {
    if (brief.paradigm === 'tech-dark') setBrief(b => ({ ...b, glassmorphism: true, gradientText: false }))
    else if (brief.paradigm === 'bold-expressive') setBrief(b => ({ ...b, glassmorphism: false, gradientText: true }))
    else if (brief.paradigm === 'minimal-clean') setBrief(b => ({ ...b, glassmorphism: false, gradientText: false }))
    else if (brief.paradigm === 'luxury-editorial') setBrief(b => ({ ...b, glassmorphism: false, gradientText: false }))
    else if (brief.paradigm === 'brutalist') setBrief(b => ({ ...b, glassmorphism: false, gradientText: false }))
  }, [brief.paradigm])

  function setInv(key: keyof ContentInventory, val: boolean | string) {
    setBrief(b => ({ ...b, contentInventory: { ...b.contentInventory, [key]: val } }))
  }

  function goNext() {
    setAnimating(true)
    setTimeout(() => { setStep(s => s + 1); setAnimating(false) }, 150)
  }
  function goBack() {
    setAnimating(true)
    setTimeout(() => { setStep(s => s - 1); setAnimating(false) }, 150)
  }

  function canProceed(): boolean {
    if (step === 1) return brief.companyName.trim().length > 0 && brief.industry !== '' && brief.usp.trim().length > 10
    if (step === 2) return brief.paradigm !== ''
    return brief.layout !== ''
  }

  function startGeneration() {
    const params = new URLSearchParams({
      companyName: brief.companyName,
      industry: brief.industry,
      usp: brief.usp,
      paradigm: brief.paradigm,
      language: brief.language,
      animationBudget: brief.animationBudget,
      hasStats: String(brief.contentInventory.hasStats),
      hasVisual: String(brief.contentInventory.hasVisual),
      hasLogos: String(brief.contentInventory.hasLogos),
      hasDemo: String(brief.contentInventory.hasDemo),
      hasVideo: String(brief.contentInventory.hasVideo),
      statsExamples: brief.contentInventory.statsExamples,
      ctaGoal: brief.contentInventory.ctaGoal,
      layout: brief.layout,
    })
    router.push(`/moodboard-v3?${params.toString()}`)
  }

  const selectedParadigm = PARADIGMS.find(p => p.id === brief.paradigm)
  const availableLayouts = LAYOUT_CARDS.filter(l => l.requires(brief.contentInventory))
  const autoLayout = pickLayout(brief.contentInventory)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => step > 1 ? goBack() : router.push('/artdirector-v3')} className="text-gray-400 hover:text-gray-700 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="font-bold text-gray-900">wbuilder v3</span>
          <span className="text-xs text-gray-400">Briefing Wizard</span>
        </div>
        <StepIndicator current={step} total={3} />
        <div className="w-28" />
      </div>

      {/* Content */}
      <div className={`max-w-3xl mx-auto px-6 py-10 transition-opacity duration-150 ${animating ? 'opacity-0' : 'opacity-100'}`}>

        {/* ══════════════════ STEP 1 — Moodboard Wizard ══════════════════ */}
        {step === 1 && (
          <div className="flex flex-col gap-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Erzähl uns von deinem Unternehmen</h1>
              <p className="text-gray-500 mt-1">Schritt 1 von 3 — Grundlagen + Content Inventory</p>
            </div>

            {/* Company + USP */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">Unternehmensname</label>
                <input
                  value={brief.companyName}
                  onChange={e => setBrief(b => ({ ...b, companyName: e.target.value }))}
                  placeholder="z.B. BauPro Management GmbH"
                  className="px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">USP — Was macht ihr besonders? <span className="text-gray-400 font-normal">(1 Satz)</span></label>
                <textarea
                  value={brief.usp}
                  onChange={e => setBrief(b => ({ ...b, usp: e.target.value }))}
                  placeholder="z.B. Baumanagement, das Projekte termingerecht und kostenstabil ins Ziel bringt."
                  className="px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none"
                  rows={2}
                />
              </div>
              <div className="flex gap-3">
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-sm font-semibold text-gray-700">Sprache</label>
                  <select value={brief.language} onChange={e => setBrief(b => ({ ...b, language: e.target.value as 'de' | 'en' }))} className="px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300">
                    <option value="de">Deutsch</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Industry */}
            <div className="flex flex-col gap-3">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Branche</h2>
                <p className="text-xs text-gray-400 mt-0.5">Bestimmt Bildsprache, Beweis-Typ und CTA-Formulierung</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {INDUSTRIES.map(ind => (
                  <button
                    key={ind.id}
                    onClick={() => setBrief(b => ({ ...b, industry: ind.id }))}
                    className={`flex flex-col items-start gap-1.5 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                      brief.industry === ind.id ? 'border-violet-500 bg-violet-50' : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <span className="text-xl">{ind.icon}</span>
                    <span className="text-xs font-semibold text-gray-800 leading-tight">{ind.label}</span>
                    <span className="text-[10px] text-gray-400">{ind.cta}</span>
                  </button>
                ))}
              </div>
              {brief.industry && (
                <div className="text-xs bg-violet-50 border border-violet-100 rounded-xl px-4 py-2 text-violet-700">
                  {(() => { const i = INDUSTRIES.find(x => x.id === brief.industry)!; return `→ Visual: ${i.coreVisual} · Beweis: ${i.proof} · CTA: "${i.cta}"` })()}
                </div>
              )}
            </div>

            {/* Content Inventory */}
            <div className="flex flex-col gap-3">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Content Inventory</h2>
                <p className="text-xs text-gray-400 mt-0.5">Was hast du? Die Struktur folgt deinem Content — nicht der Branche.</p>
              </div>
              <div className="flex flex-col gap-2">
                <ContentToggle icon={<BarChart3 className="w-4 h-4" />} label="Konkrete Kennzahlen / Stats" hint='z.B. "200+ Projekte · 98% Termintreue"' checked={brief.contentInventory.hasStats} onChange={v => setInv('hasStats', v)} />
                {brief.contentInventory.hasStats && (
                  <input
                    value={brief.contentInventory.statsExamples}
                    onChange={e => setInv('statsExamples', e.target.value)}
                    placeholder='z.B. 200+ Projekte · 98% Termintreue · 15 Jahre Erfahrung'
                    className="ml-11 px-4 py-2.5 border border-violet-200 bg-violet-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                  />
                )}
                <ContentToggle icon={<Image className="w-4 h-4" />} label="Starkes visuelles Asset" hint="Foto, Render, Screenshot — ein echtes Bild" checked={brief.contentInventory.hasVisual} onChange={v => setInv('hasVisual', v)} />
                <ContentToggle icon={<Award className="w-4 h-4" />} label="Referenzen / Logos / Zitate" hint="Kundenlogos, Partnerlogos, Bewertungen" checked={brief.contentInventory.hasLogos} onChange={v => setInv('hasLogos', v)} />
                <ContentToggle icon={<Monitor className="w-4 h-4" />} label="Demo / Screenshot des Produkts" hint="UI-Screenshot, interaktive Demo" checked={brief.contentInventory.hasDemo} onChange={v => setInv('hasDemo', v)} />
                <ContentToggle icon={<Video className="w-4 h-4" />} label="Video" hint="Erklärvideo, Produktvideo, Testimonial-Video" checked={brief.contentInventory.hasVideo} onChange={v => setInv('hasVideo', v)} />
              </div>
              <div className="flex gap-3">
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Primäres CTA-Ziel</label>
                  <select value={brief.contentInventory.ctaGoal} onChange={e => setInv('ctaGoal', e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-300">
                    <option value="contact">Kontakt / Beratungsgespräch</option>
                    <option value="signup">Registrierung / Trial</option>
                    <option value="purchase">Kauf / Anfrage</option>
                    <option value="appointment">Terminbuchung</option>
                    <option value="download">Download / Lead Magnet</option>
                  </select>
                </div>
              </div>
              {/* Layout preview */}
              <div className="flex items-center gap-2 text-xs bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
                <span className="text-gray-500">→ Empfohlenes Layout:</span>
                <span className="font-semibold text-violet-600">{autoLayout}</span>
                <span className="text-gray-400 ml-auto">basiert auf deinem Content</span>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════ STEP 2 — Style Wizard ══════════════════ */}
        {step === 2 && (
          <div className="flex flex-col gap-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Wähle deinen visuellen Stil</h1>
              <p className="text-gray-500 mt-1">Schritt 2 von 3 — Paradigm, Typografie, Effekte</p>
            </div>

            {/* Paradigm selection */}
            <div className="flex flex-col gap-3">
              <h2 className="text-base font-semibold text-gray-900">Stil-Paradigma</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {PARADIGMS.map(p => (
                  <ParadigmCard key={p.id} p={p} selected={brief.paradigm === p.id} onSelect={() => setBrief(b => ({ ...b, paradigm: p.id }))} />
                ))}
              </div>
            </div>

            {/* Animation budget */}
            <div className="flex flex-col gap-3">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Animation-Budget</h2>
                <p className="text-xs text-gray-400 mt-0.5">Bestimmt wie viel sich auf der Seite bewegt</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {ANIMATION_BUDGETS.map(ab => (
                  <button
                    key={ab.id}
                    onClick={() => setBrief(b => ({ ...b, animationBudget: ab.id }))}
                    className={`flex flex-col gap-1 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                      brief.animationBudget === ab.id ? 'border-violet-500 bg-violet-50' : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <span className="text-sm font-semibold text-gray-900">{ab.label}</span>
                    <span className="text-xs text-gray-400">{ab.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Effects toggles */}
            <div className="flex flex-col gap-3">
              <h2 className="text-base font-semibold text-gray-900">Effekte</h2>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setBrief(b => ({ ...b, glassmorphism: !b.glassmorphism }))}
                  className={`flex flex-col gap-1 px-4 py-3 rounded-xl border-2 text-left transition-all ${brief.glassmorphism ? 'border-violet-500 bg-violet-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                >
                  <div className="flex items-center gap-2">
                    {brief.glassmorphism && <Check className="w-3 h-3 text-violet-600" />}
                    <span className="text-sm font-semibold text-gray-900">Glassmorphism</span>
                  </div>
                  <span className="text-xs text-gray-400">Frosted glass cards mit backdrop-blur</span>
                </button>
                <button
                  onClick={() => setBrief(b => ({ ...b, gradientText: !b.gradientText }))}
                  className={`flex flex-col gap-1 px-4 py-3 rounded-xl border-2 text-left transition-all ${brief.gradientText ? 'border-violet-500 bg-violet-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                >
                  <div className="flex items-center gap-2">
                    {brief.gradientText && <Check className="w-3 h-3 text-violet-600" />}
                    <span className="text-sm font-semibold text-gray-900">Gradient-Text</span>
                  </div>
                  <span className="text-xs text-gray-400">Headline Part 2 als Gradient-Clip</span>
                </button>
              </div>
            </div>

            {/* Summary */}
            {selectedParadigm && (
              <div className="rounded-2xl overflow-hidden border border-gray-200">
                <div className="h-16 flex items-center px-6 gap-4" style={{ background: selectedParadigm.preview.bg }}>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: selectedParadigm.preview.accent }}>{selectedParadigm.id}</div>
                    <div className="text-sm font-bold text-white mt-0.5" style={{ fontFamily: selectedParadigm.preview.font }}>{brief.companyName || 'Dein Unternehmen'}</div>
                  </div>
                  <div className="ml-auto text-xs text-white opacity-40">{selectedParadigm.effects}</div>
                </div>
                <div className="bg-white px-6 py-3 text-xs text-gray-500 flex gap-4">
                  <span>Schrift: <strong>{selectedParadigm.fonts}</strong></span>
                  <span>Effekte: <strong>{selectedParadigm.effects}</strong></span>
                  <span>Animation: <strong>{ANIMATION_BUDGETS.find(a => a.id === brief.animationBudget)?.label}</strong></span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════ STEP 3 — Layout Choice ══════════════════ */}
        {step === 3 && (
          <div className="flex flex-col gap-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Wähle dein Layout</h1>
              <p className="text-gray-500 mt-1">Schritt 3 von 3 — Struktur folgt deinem Content</p>
            </div>

            <div className="bg-violet-50 border border-violet-200 rounded-xl px-4 py-3 text-sm text-violet-700 flex items-center gap-2">
              <Sparkles className="w-4 h-4 flex-shrink-0" />
              <span>Empfohlen für dein Content-Inventory: <strong>{autoLayout}</strong></span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {availableLayouts.map(l => (
                <button
                  key={l.id}
                  onClick={() => setBrief(b => ({ ...b, layout: l.id }))}
                  className={`flex flex-col rounded-2xl border-2 overflow-hidden text-left transition-all ${
                    brief.layout === l.id ? 'border-violet-500 ring-2 ring-violet-200' : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {/* Layout preview */}
                  <div className="h-28 bg-gray-800 p-3 relative">
                    {l.preview}
                    {l.id === autoLayout && (
                      <div className="absolute top-2 right-2 bg-violet-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide">Empfohlen</div>
                    )}
                    {brief.layout === l.id && (
                      <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="bg-white px-4 py-3 border-t border-gray-100">
                    <div className="text-sm font-semibold text-gray-900">{l.label}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{l.desc}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Final summary */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-500" />
                Zusammenfassung — wird an die KI übergeben
              </h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                <div><span className="text-gray-400">Unternehmen:</span> <span className="text-gray-900 font-medium">{brief.companyName}</span></div>
                <div><span className="text-gray-400">Branche:</span> <span className="text-gray-900 font-medium">{INDUSTRIES.find(i => i.id === brief.industry)?.label}</span></div>
                <div><span className="text-gray-400">Paradigma:</span> <span className="text-gray-900 font-medium">{selectedParadigm?.label}</span></div>
                <div><span className="text-gray-400">Layout:</span> <span className="text-violet-600 font-semibold">{brief.layout}</span></div>
                <div><span className="text-gray-400">Animation:</span> <span className="text-gray-900 font-medium">{ANIMATION_BUDGETS.find(a => a.id === brief.animationBudget)?.label}</span></div>
                <div><span className="text-gray-400">Effekte:</span> <span className="text-gray-900 font-medium">{[brief.glassmorphism && 'Glassmorphism', brief.gradientText && 'Gradient-Text'].filter(Boolean).join(' · ') || 'Keine'}</span></div>
                <div className="col-span-2"><span className="text-gray-400">Content:</span> <span className="text-gray-900 font-medium">{[brief.contentInventory.hasStats && 'Stats', brief.contentInventory.hasVisual && 'Visual', brief.contentInventory.hasLogos && 'Logos', brief.contentInventory.hasDemo && 'Demo', brief.contentInventory.hasVideo && 'Video'].filter(Boolean).join(' · ') || 'Kein Asset'}</span></div>
                <div className="col-span-2 border-t border-gray-100 pt-2"><span className="text-gray-400">USP:</span> <span className="text-gray-700 italic">"{brief.usp}"</span></div>
              </div>
            </div>
          </div>
        )}

        {/* Nav buttons */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-200">
          {step > 1 ? (
            <button onClick={goBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors px-4 py-2 rounded-xl hover:bg-gray-100">
              <ArrowLeft className="w-4 h-4" /> Zurück
            </button>
          ) : <div />}

          {step < 3 ? (
            <button
              onClick={goNext}
              disabled={!canProceed()}
              className="flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Weiter <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={startGeneration}
              disabled={!canProceed()}
              className="flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Moodboard generieren
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
