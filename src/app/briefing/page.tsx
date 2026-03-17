'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useBuilderStore } from '@/lib/store'
import type { BriefingData, PresetSlot } from '@/lib/store'
import type { PageDef } from '@/lib/types/briefing'
import { SiteManifest, StyleParadigm, VisualTone } from '@/lib/types/manifest'
import { toast } from 'sonner'
import { PageTopbar } from '@/components/ui/PageTopbar'
import {
  Zap, ChevronRight, ChevronLeft, Loader2, Check, X,
  Building2, Users, Palette, Layout, Sparkles, Globe, Plus, Trash2,
  Library, Tag, ChevronDown, BookMarked, Save, FolderOpen
} from 'lucide-react'
import { Button } from '@/components/ui/button'

// ── Constants ─────────────────────────────────────────────────────────────

const SECTION_OPTIONS = [
  'hero', 'pain-points', 'services', 'features', 'process',
  'stats', 'testimonials', 'pricing', 'faq', 'cta', 'footer',
]

interface PatternEntry {
  id: string; name: string; description: string; type: string
  paradigms: string[]; tags: string[]; confidence: number
  preview_description: string; visual_weight: string
  implementation?: { css_snippet?: string; html_snippet?: string; placeholder?: string }
}

const INDUSTRIES = [
  'saas-tech', 'recruiting-b2b', 'construction', 'consulting-law',
  'real-estate', 'healthcare', 'creative-agency', 'e-commerce',
  'finance', 'education', 'hospitality', 'logistics',
]

const PARADIGM_OPTIONS: { value: StyleParadigm; label: string; desc: string; emoji: string }[] = [
  { value: 'minimal-clean',    label: 'Minimal Clean',      desc: 'Viel Whitespace, Serif, ruhig & seriös',       emoji: '◻️' },
  { value: 'tech-dark',        label: 'Tech Dark',          desc: 'Dark Mode, Gradients, Linear/Vercel-Style',    emoji: '🌑' },
  { value: 'bold-expressive',  label: 'Bold Expressive',    desc: 'Laut, Overlaps, Display-Font, Animiert',       emoji: '⚡' },
  { value: 'luxury-editorial', label: 'Luxury Editorial',   desc: 'Große Typografie, Whitespace, Edgy',           emoji: '◆' },
  { value: 'bento-grid',       label: 'Bento Grid',         desc: 'Apple-Stil, Card-Mosaic, Mixed Sizes',         emoji: '⊞' },
  { value: 'brutalist',        label: 'Brutalist',          desc: 'Starke Borders, hoher Kontrast, Raw',          emoji: '▨' },
]

const TONE_OPTIONS = [
  { value: 'professional', label: 'Professional & Trustworthy' },
  { value: 'modern',       label: 'Modern & Forward-thinking' },
  { value: 'bold',         label: 'Bold & Confident' },
  { value: 'friendly',     label: 'Friendly & Approachable' },
  { value: 'luxury',       label: 'Luxury & Premium' },
  { value: 'creative',     label: 'Creative & Expressive' },
]

const ADJECTIVE_OPTIONS = [
  'vertrauenswürdig', 'modern', 'professionell', 'innovativ',
  'persönlich', 'ambitioniert', 'minimalistisch', 'premium',
  'dynamisch', 'nachhaltig', 'digital', 'lokal',
]

const VISUAL_TONE_OPTIONS: { value: VisualTone; label: string; desc: string; emoji: string; tags: string[] }[] = [
  { value: 'whisper',    label: 'Whisper',    emoji: '🌫',  desc: 'Subtle, quiet, generous whitespace — minimal decoration',          tags: ['Luxury', 'Spa', 'Wellness', 'Law'] },
  { value: 'editorial', label: 'Editorial',  emoji: '📰',  desc: 'Structured, formal, serif-forward — typography as decoration',       tags: ['Publishing', 'Agency', 'Finance', 'Consulting'] },
  { value: 'confident', label: 'Confident',  emoji: '✦',   desc: 'Balanced & clear — moderate animation, clean hierarchy',             tags: ['SaaS', 'B2B', 'Tech', 'Healthcare'] },
  { value: 'expressive',label: 'Expressive', emoji: '⚡',  desc: 'Bold headings, rich animation, high decoration density',             tags: ['Creative', 'Startup', 'Events', 'Fashion'] },
  { value: 'electric',  label: 'Electric',   emoji: '🔥',  desc: 'Maximum energy — full animation, vibrant, loud and proud',           tags: ['Gaming', 'Music', 'Sports', 'Entertainment'] },
]

const ANIMATION_OPTIONS = [
  { value: 'none',     label: 'Ruhig & Seriös',        desc: 'Keine Animationen' },
  { value: 'subtle',   label: 'Subtile Akzente',        desc: 'Kleine Hover-Effekte' },
  { value: 'moderate', label: 'Moderne Energie',        desc: 'Scroll-Animationen, Transitions' },
  { value: 'rich',     label: 'Voll Animiert',          desc: 'Rich Animations, SVG-Backgrounds' },
]

// ── Step Components ────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  const labels = ['Projekt', 'Zielgruppe', 'Design', 'Layout', 'Seiten']
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all ${
            i < current ? 'bg-indigo-600 text-white' :
            i === current ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' :
            'bg-gray-100 text-gray-400'
          }`}>
            {i < current ? <Check className="w-4 h-4" /> : i + 1}
          </div>
          <span className={`text-sm font-medium ${i === current ? 'text-gray-900' : 'text-gray-400'}`}>
            {labels[i]}
          </span>
          {i < total - 1 && <ChevronRight className="w-4 h-4 text-gray-300 ml-1" />}
        </div>
      ))}
    </div>
  )
}

// ── Step 1: Project ────────────────────────────────────────────────────────

function Step1({ data, onChange }: { data: BriefingData; onChange: (d: Partial<BriefingData>) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-indigo-600" /> Projektinfos
        </h2>
        <p className="text-sm text-gray-500 mt-1">Grundlegende Infos über das Unternehmen</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">Unternehmensname *</label>
          <input
            value={data.company_name}
            onChange={(e) => onChange({ company_name: e.target.value })}
            placeholder="z.B. viminds GmbH"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">Branche *</label>
          <select
            value={data.industry}
            onChange={(e) => onChange({ industry: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
          >
            <option value="">Branche wählen…</option>
            {INDUSTRIES.map((ind) => (
              <option key={ind} value={ind}>{ind.replace(/-/g, ' ')}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-gray-600 block mb-1">Tagline / Kurzbeschreibung</label>
          <input
            value={data.tagline}
            onChange={(e) => onChange({ tagline: e.target.value })}
            placeholder="z.B. Recruiting für die Region"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-gray-600 block mb-1">USP — Was macht Sie einzigartig?</label>
          <textarea
            value={data.usp}
            onChange={(e) => onChange({ usp: e.target.value })}
            placeholder="z.B. Lokaler B2B-Recruiting-Service für KMU in Norddeutschland — persönlich, schnell, regional vernetzt"
            rows={2}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-gray-600 block mb-1">Primäre CTA-Aktion</label>
          <input
            value={data.primary_cta}
            onChange={(e) => onChange({ primary_cta: e.target.value })}
            placeholder="z.B. Kostenloses Erstgespräch"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
      </div>
    </div>
  )
}

// ── Step 2: Audience ───────────────────────────────────────────────────────

function Step2({ data, onChange }: { data: BriefingData; onChange: (d: Partial<BriefingData>) => void }) {
  const [personaInput, setPersonaInput] = useState('')
  const [painInput, setPainInput] = useState('')

  function addTag(field: 'personas' | 'pain_points', value: string) {
    if (!value.trim()) return
    onChange({ [field]: [...data[field], value.trim()] })
    if (field === 'personas') setPersonaInput('')
    else setPainInput('')
  }

  function removeTag(field: 'personas' | 'pain_points', idx: number) {
    onChange({ [field]: data[field].filter((_, i) => i !== idx) })
  }

  function toggleAdjective(adj: string) {
    const current = data.adjectives
    if (current.includes(adj)) {
      onChange({ adjectives: current.filter((a) => a !== adj) })
    } else if (current.length < 4) {
      onChange({ adjectives: [...current, adj] })
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-600" /> Zielgruppe & Ton
        </h2>
        <p className="text-sm text-gray-500 mt-1">Wer sind Ihre Kunden und wie wollen Sie klingen?</p>
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-600 block mb-2">Ton & Persönlichkeit *</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {TONE_OPTIONS.map((t) => (
            <button
              key={t.value}
              onClick={() => onChange({ tone: t.value })}
              className={`px-3 py-2 rounded-lg text-sm text-left border transition-all ${
                data.tone === t.value
                  ? 'bg-indigo-50 border-indigo-400 text-indigo-800 font-medium'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-indigo-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-600 block mb-2">Adjektive (max. 4)</label>
        <div className="flex flex-wrap gap-2">
          {ADJECTIVE_OPTIONS.map((adj) => (
            <button
              key={adj}
              onClick={() => toggleAdjective(adj)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                data.adjectives.includes(adj)
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
              }`}
            >
              {adj}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-600 block mb-2">Zielgruppen / Personas</label>
        <div className="flex gap-2 mb-2">
          <input
            value={personaInput}
            onChange={(e) => setPersonaInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addTag('personas', personaInput) }}
            placeholder="z.B. Geschäftsführer KMU — Enter"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <Button size="sm" onClick={() => addTag('personas', personaInput)} variant="outline">+</Button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {data.personas.map((p, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">
              {p}
              <button onClick={() => removeTag('personas', i)} className="hover:text-red-500">×</button>
            </span>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-600 block mb-2">Pain Points der Zielgruppe</label>
        <div className="flex gap-2 mb-2">
          <input
            value={painInput}
            onChange={(e) => setPainInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addTag('pain_points', painInput) }}
            placeholder="z.B. Keine Zeit für Recruiting — Enter"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <Button size="sm" onClick={() => addTag('pain_points', painInput)} variant="outline">+</Button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {data.pain_points.map((p, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-medium">
              {p}
              <button onClick={() => removeTag('pain_points', i)} className="hover:text-red-500">×</button>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Pattern Selector (used inside Step 3) ─────────────────────────────────

// ── Pattern visual preview helpers ────────────────────────────────────────

const TYPE_META: Record<string, { emoji: string; color: string; bg: string }> = {
  'section-transition': { emoji: '〰️', color: 'text-blue-700',   bg: 'bg-blue-50'   },
  'background-treatment': { emoji: '🎨', color: 'text-amber-700', bg: 'bg-amber-50'  },
  'card-style':         { emoji: '🃏', color: 'text-teal-700',   bg: 'bg-teal-50'   },
  'hero-layout':        { emoji: '🖼️', color: 'text-rose-700',   bg: 'bg-rose-50'   },
  'grid-pattern':       { emoji: '⊞',  color: 'text-indigo-700', bg: 'bg-indigo-50' },
  'text-animation':     { emoji: '✨', color: 'text-purple-700', bg: 'bg-purple-50' },
  'scroll-animation':   { emoji: '↕️', color: 'text-green-700',  bg: 'bg-green-50'  },
  'interaction':        { emoji: '👆', color: 'text-orange-700', bg: 'bg-orange-50' },
  'typography':         { emoji: '𝐓',  color: 'text-pink-700',   bg: 'bg-pink-50'   },
}

const PARADIGM_COLORS: Record<string, string> = {
  'bold-expressive':  'bg-orange-100 text-orange-700',
  'tech-dark':        'bg-slate-200 text-slate-700',
  'minimal-clean':    'bg-gray-100 text-gray-600',
  'luxury-editorial': 'bg-yellow-100 text-yellow-800',
  'bento-grid':       'bg-teal-100 text-teal-700',
  'brutalist':        'bg-red-100 text-red-700',
}

const WEIGHT_DOTS: Record<string, number> = { light: 1, medium: 2, heavy: 3 }

function PatternVisualPreview({ pattern }: { pattern: PatternEntry }) {
  const t = pattern.type
  if (t === 'section-transition' && pattern.id.includes('concave')) {
    return (
      <div className="w-full h-full bg-gradient-to-b from-slate-800 to-slate-900 relative overflow-hidden flex items-end justify-center">
        <div className="absolute bottom-0 left-[-10%] right-[-10%] h-8 bg-white rounded-[50%]" />
        <span className="relative z-10 text-white/40 text-[9px] mb-4 font-mono">concave</span>
      </div>
    )
  }
  if (t === 'section-transition' && pattern.id.includes('diagonal')) {
    return (
      <div className="w-full h-full relative overflow-hidden" style={{ clipPath: 'polygon(0 0,100% 0,100% 75%,0 100%)', background: 'linear-gradient(135deg,#1e293b,#334155)' }}>
        <span className="absolute bottom-2 left-2 text-white/40 text-[9px] font-mono">diagonal</span>
      </div>
    )
  }
  if (t === 'background-treatment' && pattern.id.includes('mesh')) {
    return (
      <div className="w-full h-full relative overflow-hidden" style={{ background: 'radial-gradient(circle at 20% 50%,#818cf880 0%,transparent 50%),radial-gradient(circle at 80% 20%,#f472b680 0%,transparent 50%),radial-gradient(circle at 60% 80%,#34d39980 0%,transparent 50%),#0f172a' }}>
        <span className="absolute bottom-2 left-2 text-white/50 text-[9px] font-mono">mesh</span>
      </div>
    )
  }
  if (t === 'background-treatment' && pattern.id.includes('geometric')) {
    return (
      <div className="w-full h-full bg-slate-900 relative overflow-hidden flex items-center justify-center">
        <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 60">
          <circle cx="20" cy="20" r="14" fill="none" stroke="#818cf8" strokeWidth="0.8"/>
          <circle cx="80" cy="45" r="20" fill="none" stroke="#818cf8" strokeWidth="0.8"/>
          <line x1="0" y1="30" x2="100" y2="30" stroke="#818cf8" strokeWidth="0.5"/>
          <line x1="50" y1="0" x2="50" y2="60" stroke="#818cf8" strokeWidth="0.5"/>
        </svg>
        <span className="text-white/40 text-[9px] font-mono">geometric</span>
      </div>
    )
  }
  if (t === 'background-treatment' && pattern.id.includes('noise')) {
    return (
      <div className="w-full h-full bg-slate-800 relative overflow-hidden">
        <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
          <filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch"/></filter>
          <rect width="100%" height="100%" filter="url(#n)" opacity="0.4"/>
        </svg>
        <span className="absolute bottom-2 left-2 text-white/50 text-[9px] font-mono">noise</span>
      </div>
    )
  }
  if (t === 'background-treatment' && pattern.id.includes('photo')) {
    return (
      <div className="w-full h-full relative overflow-hidden" style={{ background: 'linear-gradient(to top,#0f172a 20%,rgba(0,0,0,.5) 70%,rgba(0,0,0,.2))', backgroundColor: '#334155' }}>
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.15\'%3E%3Cpath d=\'M0 0h30v30H0zm30 30h30v30H30z\'/%3E%3C/g%3E%3C/svg%3E")' }} />
        <span className="absolute bottom-2 left-2 text-white/60 text-[9px] font-mono">overlay</span>
      </div>
    )
  }
  if (t === 'background-treatment' && pattern.id.includes('svg')) {
    return (
      <div className="w-full h-full bg-white relative overflow-hidden flex items-center justify-center">
        <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 60">
          <path d="M10 50 Q30 10 50 30 T90 20" fill="none" stroke="#6366f1" strokeWidth="2"/>
          <path d="M0 40 Q25 5 50 25 T100 15" fill="none" stroke="#8b5cf6" strokeWidth="1.5"/>
          <circle cx="50" cy="30" r="25" fill="none" stroke="#6366f1" strokeWidth="1"/>
        </svg>
        <span className="text-gray-400 text-[9px] font-mono">svg-bg</span>
      </div>
    )
  }
  if (t === 'card-style' && pattern.id.includes('glass')) {
    return (
      <div className="w-full h-full relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#1e1b4b,#312e81)' }}>
        <div className="absolute inset-3 rounded-xl border border-white/20" style={{ backdropFilter: 'blur(8px)', background: 'rgba(255,255,255,0.08)' }}>
          <div className="p-2 space-y-1">
            <div className="h-1.5 w-12 bg-white/30 rounded"/>
            <div className="h-1 w-8 bg-white/20 rounded"/>
          </div>
        </div>
      </div>
    )
  }
  if (t === 'hero-layout') {
    return (
      <div className="w-full h-full bg-slate-900 relative overflow-hidden flex flex-col items-start justify-center px-3">
        <div className="h-2 w-16 bg-indigo-500 rounded mb-1.5"/>
        <div className="h-1 w-12 bg-white/30 rounded mb-1"/>
        <div className="h-1 w-10 bg-white/20 rounded mb-2"/>
        <div className="h-4 w-14 bg-indigo-500 rounded-full"/>
        <span className="absolute bottom-2 right-2 text-white/30 text-[9px] font-mono">full-bleed</span>
      </div>
    )
  }
  if (t === 'grid-pattern' && pattern.id.includes('bento')) {
    return (
      <div className="w-full h-full bg-slate-50 p-2 grid grid-cols-3 gap-1">
        <div className="col-span-2 bg-indigo-100 rounded-md"/>
        <div className="bg-violet-100 rounded-md"/>
        <div className="bg-teal-100 rounded-md"/>
        <div className="col-span-2 bg-pink-100 rounded-md"/>
      </div>
    )
  }
  if (t === 'grid-pattern' && pattern.id.includes('overlap')) {
    return (
      <div className="w-full h-full bg-white relative overflow-hidden flex items-center justify-center">
        <div className="absolute top-3 left-6 right-6 h-10 bg-indigo-100 rounded-xl shadow"/>
        <div className="absolute top-6 left-4 right-4 h-10 bg-violet-200 rounded-xl shadow"/>
        <div className="absolute top-9 left-2 right-2 h-10 bg-purple-300 rounded-xl shadow"/>
      </div>
    )
  }
  if (t === 'text-animation') {
    return (
      <div className="w-full h-full bg-slate-900 flex flex-col items-start justify-center px-3 gap-1">
        <span className="text-white/40 text-[8px] font-mono uppercase tracking-widest">Wir sind</span>
        <div className="flex items-baseline gap-1">
          <span className="text-white text-xs font-bold">die</span>
          <span className="text-indigo-400 text-xs font-bold underline decoration-dotted">Lösung</span>
        </div>
        <span className="text-white/30 text-[8px]">↺ word-cycle</span>
      </div>
    )
  }
  if (t === 'scroll-animation' && pattern.id.includes('counter')) {
    return (
      <div className="w-full h-full bg-white flex items-center justify-center gap-3 px-2">
        {['98%','4.9★','12k'].map((v) => (
          <div key={v} className="flex flex-col items-center">
            <span className="text-indigo-600 font-bold text-sm">{v}</span>
            <div className="h-px w-6 bg-gray-200 mt-0.5"/>
          </div>
        ))}
      </div>
    )
  }
  if (t === 'scroll-animation') {
    return (
      <div className="w-full h-full bg-slate-900 flex items-center justify-center relative overflow-hidden">
        <div className="absolute left-3 top-0 bottom-0 w-px bg-indigo-500/40"/>
        <div className="space-y-1 pl-6">
          {[1,2,3].map((i) => (
            <div key={i} className="h-1.5 rounded bg-indigo-400/60" style={{ width: `${(4-i)*16}px`, opacity: (4-i)*0.3 }}/>
          ))}
        </div>
        <span className="absolute bottom-2 right-2 text-white/30 text-[9px] font-mono">scroll</span>
      </div>
    )
  }
  if (t === 'interaction') {
    return (
      <div className="w-full h-full bg-slate-900 flex flex-col">
        <div className="h-5 bg-transparent border-b border-white/10 flex items-center px-2 gap-2">
          <div className="w-3 h-1 bg-white/60 rounded"/>
          <div className="flex-1"/>
          <div className="w-6 h-1.5 bg-indigo-500 rounded-full"/>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-5 rounded-md border border-white/10" style={{ backdropFilter: 'blur(4px)', background: 'rgba(255,255,255,0.05)' }}/>
        </div>
        <span className="text-white/30 text-[9px] font-mono text-center pb-1">nav blur</span>
      </div>
    )
  }
  if (t === 'typography') {
    return (
      <div className="w-full h-full bg-slate-900 flex items-center justify-center px-3">
        <span className="text-sm font-bold" style={{ background: 'linear-gradient(90deg,#818cf8,#f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Gradient
        </span>
      </div>
    )
  }
  // fallback
  const meta = TYPE_META[t] ?? { emoji: '◈', color: 'text-gray-500', bg: 'bg-gray-100' }
  return (
    <div className={`w-full h-full ${meta.bg} flex items-center justify-center`}>
      <span className="text-2xl">{meta.emoji}</span>
    </div>
  )
}

function PatternSelector({ data, onChange }: { data: BriefingData; onChange: (d: Partial<BriefingData>) => void }) {
  const [patterns, setPatterns] = useState<PatternEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [filter, setFilter] = useState('')
  const [open, setOpen] = useState(false)

  function load() {
    if (loaded) return
    setLoading(true)
    fetch('/api/v2/discovery?view=patterns')
      .then((r) => r.json())
      .then((d) => { setPatterns(d.patterns ?? []); setLoaded(true); setLoading(false) })
      .catch(() => setLoading(false))
  }

  function toggle(id: string) {
    const ids = data.selected_pattern_ids
    onChange({ selected_pattern_ids: ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id] })
  }

  const filtered = patterns.filter((p) =>
    !filter ||
    p.name.toLowerCase().includes(filter.toLowerCase()) ||
    p.type.toLowerCase().includes(filter.toLowerCase()) ||
    (p.tags ?? []).some((t) => t.toLowerCase().includes(filter.toLowerCase()))
  )

  const relevant = data.style_paradigm
    ? filtered.filter((p) => !p.paradigms?.length || p.paradigms.includes(data.style_paradigm))
    : filtered
  const others = data.style_paradigm
    ? filtered.filter((p) => p.paradigms?.length && !p.paradigms.includes(data.style_paradigm))
    : []

  const selectedCount = data.selected_pattern_ids.length

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
        onClick={() => { setOpen(!open); if (!open) load() }}
      >
        <div className="flex items-center gap-2">
          <Library className="w-4 h-4 text-violet-500" />
          <span className="text-sm font-semibold text-gray-700">Design Patterns auswählen</span>
          {selectedCount > 0 && (
            <span className="text-[10px] bg-violet-600 text-white px-1.5 py-0.5 rounded-full font-bold">{selectedCount} gewählt</span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-gray-200">
          {/* Filter */}
          <div className="px-4 py-3 border-b border-gray-100">
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter by name, type or tag…"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10 text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin mr-2" /> Lade Patterns…
            </div>
          ) : patterns.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <Library className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-500 font-medium mb-1">Keine Patterns vorhanden</p>
              <p className="text-xs text-gray-400">Sites scrapen unter <span className="font-mono">/scraper</span> und Discoveries approven unter <span className="font-mono">/discovery</span>.</p>
            </div>
          ) : (
            <div className="max-h-[480px] overflow-y-auto px-4 py-4 space-y-4">
              {/* Matching patterns grid */}
              {relevant.length > 0 && (
                <div>
                  {others.length > 0 && (
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Passend zum Paradigma</p>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    {relevant.map((p) => <PatternCard key={p.id} p={p} isSelected={data.selected_pattern_ids.includes(p.id)} onToggle={toggle} />)}
                  </div>
                </div>
              )}
              {/* Other paradigm patterns */}
              {others.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Andere Paradigmen</p>
                  <div className="grid grid-cols-2 gap-3 opacity-70">
                    {others.map((p) => <PatternCard key={p.id} p={p} isSelected={data.selected_pattern_ids.includes(p.id)} onToggle={toggle} />)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PatternCard({ p, isSelected, onToggle }: { p: PatternEntry; isSelected: boolean; onToggle: (id: string) => void }) {
  const [showDetail, setShowDetail] = useState(false)
  const meta = TYPE_META[p.type] ?? { emoji: '◈', color: 'text-gray-500', bg: 'bg-gray-100' }
  const weightDots = WEIGHT_DOTS[p.visual_weight ?? 'light'] ?? 1

  return (
    <div
      className={`relative rounded-xl border-2 overflow-hidden cursor-pointer transition-all group ${
        isSelected
          ? 'border-violet-500 shadow-md shadow-violet-100'
          : 'border-gray-200 hover:border-violet-300 hover:shadow-sm'
      }`}
      onClick={() => onToggle(p.id)}
    >
      {/* Visual preview area */}
      <div className="h-20 relative overflow-hidden bg-gray-100">
        <PatternVisualPreview pattern={p} />
        {/* Selected overlay */}
        {isSelected && (
          <div className="absolute inset-0 bg-violet-600/10 flex items-start justify-end p-1.5">
            <div className="w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center shadow">
              <Check className="w-3 h-3 text-white" />
            </div>
          </div>
        )}
        {/* Info button */}
        <button
          className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-black/40 text-white/80 text-[9px] font-bold hover:bg-black/60 transition-colors flex items-center justify-center"
          onClick={(e) => { e.stopPropagation(); setShowDetail(!showDetail) }}
        >
          i
        </button>
      </div>

      {/* Card footer */}
      <div className={`px-2.5 py-2 ${isSelected ? 'bg-violet-50' : 'bg-white'}`}>
        <div className="flex items-start justify-between gap-1 mb-1">
          <span className={`text-[11px] font-semibold leading-tight ${isSelected ? 'text-violet-900' : 'text-gray-800'}`}>{p.name}</span>
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0 ${meta.bg} ${meta.color}`}>{meta.emoji}</span>
        </div>

        {/* Visual weight bar */}
        <div className="flex items-center gap-1 mb-1.5">
          <span className="text-[9px] text-gray-400">weight</span>
          <div className="flex gap-0.5">
            {[1,2,3].map((d) => (
              <div key={d} className={`w-3 h-1 rounded-full ${d <= weightDots ? (isSelected ? 'bg-violet-400' : 'bg-gray-400') : 'bg-gray-200'}`} />
            ))}
          </div>
          <span className="text-[9px] text-gray-400 ml-auto">{Math.round(p.confidence * 100)}%</span>
        </div>

        {/* Paradigm chips */}
        {(p.paradigms ?? []).length > 0 && (
          <div className="flex flex-wrap gap-0.5">
            {p.paradigms.slice(0, 2).map((pr) => (
              <span key={pr} className={`text-[8px] px-1 py-0.5 rounded font-medium ${PARADIGM_COLORS[pr] ?? 'bg-gray-100 text-gray-500'}`}>{pr.replace('-', ' ')}</span>
            ))}
          </div>
        )}
      </div>

      {/* Detail popover */}
      {showDetail && (
        <div
          className="absolute inset-0 z-20 bg-white/95 p-3 overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
            onClick={(e) => { e.stopPropagation(); setShowDetail(false) }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <p className="text-[10px] font-bold text-gray-700 mb-1 pr-4">{p.name}</p>
          <p className="text-[9px] text-gray-500 italic mb-2 leading-relaxed">{p.preview_description}</p>
          {(p.tags ?? []).length > 0 && (
            <div className="flex flex-wrap gap-0.5 mb-2">
              {p.tags.map((t) => (
                <span key={t} className="text-[8px] bg-violet-50 text-violet-600 px-1 py-0.5 rounded">{t}</span>
              ))}
            </div>
          )}
          {p.implementation?.css_snippet && (
            <pre className="text-[8px] font-mono bg-gray-100 rounded p-1.5 overflow-x-auto text-gray-600 whitespace-pre-wrap leading-relaxed">{p.implementation.css_snippet.slice(0, 200)}</pre>
          )}
          {p.implementation?.placeholder && (
            <pre className="text-[8px] font-mono bg-indigo-50 rounded p-1.5 mt-1 text-indigo-700 whitespace-pre-wrap">{p.implementation.placeholder}</pre>
          )}
          <button
            className="mt-2 w-full py-1 rounded-lg text-[10px] font-semibold bg-violet-600 text-white hover:bg-violet-700 transition-colors"
            onClick={(e) => { e.stopPropagation(); onToggle(p.id); setShowDetail(false) }}
          >
            {/* will be toggled by parent click, this just confirms */}
            {p.id ? 'Auswählen ✓' : ''}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Step 3: Design ─────────────────────────────────────────────────────────

function Step3({ data, onChange }: { data: BriefingData; onChange: (d: Partial<BriefingData>) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Palette className="w-5 h-5 text-indigo-600" /> Design-Richtung
        </h2>
        <p className="text-sm text-gray-500 mt-1">Welches visuelle Paradigma passt zum Unternehmen?</p>
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-600 block mb-2">Style-Paradigma *</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PARADIGM_OPTIONS.map((p) => (
            <button
              key={p.value}
              onClick={() => onChange({ style_paradigm: p.value })}
              className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                data.style_paradigm === p.value
                  ? 'bg-indigo-50 border-indigo-400 shadow-sm'
                  : 'bg-white border-gray-200 hover:border-indigo-200 hover:bg-gray-50'
              }`}
            >
              <span className="text-2xl">{p.emoji}</span>
              <div>
                <p className={`text-sm font-semibold ${data.style_paradigm === p.value ? 'text-indigo-900' : 'text-gray-800'}`}>{p.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{p.desc}</p>
              </div>
              {data.style_paradigm === p.value && (
                <Check className="w-4 h-4 text-indigo-600 ml-auto mt-0.5 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-600 block mb-2">Visueller Ton *</label>
        <p className="text-xs text-gray-400 mb-3">Unabhängig vom Paradigma — steuert Intensität, Whitespace und Dekorationsdichte.</p>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          {VISUAL_TONE_OPTIONS.map((t) => (
            <button
              key={t.value}
              onClick={() => onChange({ visual_tone: t.value })}
              className={`flex flex-col items-start gap-1.5 p-3 rounded-xl border text-left transition-all ${
                data.visual_tone === t.value
                  ? 'bg-indigo-50 border-indigo-400 shadow-sm'
                  : 'bg-white border-gray-200 hover:border-indigo-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xl leading-none">{t.emoji}</span>
                {data.visual_tone === t.value && <Check className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />}
              </div>
              <p className={`text-sm font-semibold leading-tight ${data.visual_tone === t.value ? 'text-indigo-900' : 'text-gray-800'}`}>{t.label}</p>
              <p className="text-[10px] text-gray-400 leading-tight">{t.desc}</p>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {t.tags.slice(0, 2).map((tag) => (
                  <span key={tag} className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium">{tag}</span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-600 block mb-2">Animations-Budget</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {ANIMATION_OPTIONS.map((a) => (
            <button
              key={a.value}
              onClick={() => onChange({ animation_budget: a.value as BriefingData['animation_budget'] })}
              className={`p-3 rounded-lg border text-left transition-all ${
                data.animation_budget === a.value
                  ? 'bg-indigo-50 border-indigo-400'
                  : 'bg-white border-gray-200 hover:border-indigo-200'
              }`}
            >
              <p className={`text-sm font-medium ${data.animation_budget === a.value ? 'text-indigo-900' : 'text-gray-700'}`}>{a.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{a.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 mb-3 cursor-pointer">
          <input
            type="checkbox"
            checked={data.has_existing_brand}
            onChange={(e) => onChange({ has_existing_brand: e.target.checked })}
            className="rounded"
          />
          Bestehende Markenfarben verwenden
        </label>
        {data.has_existing_brand && (
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Primary Color</label>
              <div className="flex gap-2 items-center">
                <input type="color" value={data.primary_color || '#1B2B4B'} onChange={(e) => onChange({ primary_color: e.target.value })} className="h-9 w-12 rounded border border-gray-200 cursor-pointer" />
                <input value={data.primary_color} onChange={(e) => onChange({ primary_color: e.target.value })} placeholder="#1B2B4B" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Accent Color</label>
              <div className="flex gap-2 items-center">
                <input type="color" value={data.accent_color || '#E85D30'} onChange={(e) => onChange({ accent_color: e.target.value })} className="h-9 w-12 rounded border border-gray-200 cursor-pointer" />
                <input value={data.accent_color} onChange={(e) => onChange({ accent_color: e.target.value })} placeholder="#E85D30" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
            </div>
          </div>
        )}
      </div>

      <PatternSelector data={data} onChange={onChange} />
    </div>
  )
}

// ── Step 5: Pages ─────────────────────────────────────────────────────────

function Step5({ data, onChange }: { data: BriefingData; onChange: (d: Partial<BriefingData>) => void }) {
  function addPage() {
    onChange({
      pages: [...data.pages, { title: '', slug: '', sections: ['hero', 'services', 'cta', 'footer'] }],
    })
  }

  function removePage(i: number) {
    if (data.pages.length <= 1) return
    onChange({ pages: data.pages.filter((_, idx) => idx !== i) })
  }

  function updatePage(i: number, patch: Partial<PageDef>) {
    onChange({ pages: data.pages.map((p, idx) => idx === i ? { ...p, ...patch } : p) })
  }

  function toggleSection(pageIdx: number, section: string) {
    const page = data.pages[pageIdx]
    const has = page.sections.includes(section)
    const sections = has
      ? page.sections.filter((s) => s !== section)
      : [...page.sections, section]
    updatePage(pageIdx, { sections })
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Globe className="w-5 h-5 text-indigo-600" /> Site-Struktur
        </h2>
        <p className="text-sm text-gray-500 mt-1">Welche Seiten soll die Website haben? Welche Sections pro Seite?</p>
      </div>

      <div className="space-y-4">
        {data.pages.map((page, i) => (
          <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 block mb-1">Seitenname</label>
                  <input
                    value={page.title}
                    onChange={(e) => updatePage(i, { title: e.target.value })}
                    placeholder={i === 0 ? 'Startseite' : 'z.B. Leistungen'}
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 block mb-1">URL-Pfad</label>
                  <input
                    value={page.slug}
                    onChange={(e) => updatePage(i, { slug: e.target.value })}
                    placeholder={i === 0 ? '/' : '/leistungen'}
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
              </div>
              {data.pages.length > 1 && (
                <button
                  onClick={() => removePage(i)}
                  className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div>
              <label className="text-[10px] font-semibold text-gray-500 block mb-2">Sections</label>
              <div className="flex flex-wrap gap-1.5">
                {SECTION_OPTIONS.map((sec) => (
                  <button
                    key={sec}
                    onClick={() => toggleSection(i, sec)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                      page.sections.includes(sec)
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    {sec}
                  </button>
                ))}
              </div>
              {page.sections.length > 0 && (
                <p className="text-[10px] text-gray-400 mt-2">
                  Reihenfolge: {page.sections.join(' → ')}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addPage}
        className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
      >
        <Plus className="w-4 h-4" /> Weitere Seite hinzufügen
      </button>
    </div>
  )
}

// ── Step 4: Layout ─────────────────────────────────────────────────────────

function Step4({ data, onChange }: { data: BriefingData; onChange: (d: Partial<BriefingData>) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Layout className="w-5 h-5 text-indigo-600" /> Navbar & Layout
        </h2>
        <p className="text-sm text-gray-500 mt-1">Wie soll die Navigation aussehen?</p>
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-600 block mb-2">Navbar-Stil</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'sticky-blur',      label: 'Sticky + Blur',         desc: 'Fixiert, glassmorphism beim Scrollen' },
            { value: 'static',           label: 'Static',                desc: 'Normal oben, scrollt mit' },
            { value: 'transparent-hero', label: 'Transparent → Solid',   desc: 'Im Hero transparent, dann weiß' },
            { value: 'hidden-scroll',    label: 'Auto-Hide',             desc: 'Versteckt beim Scrollen nach unten' },
          ].map((n) => (
            <button
              key={n.value}
              onClick={() => onChange({ navbar_style: n.value as BriefingData['navbar_style'] })}
              className={`p-3 rounded-lg border text-left transition-all ${
                data.navbar_style === n.value ? 'bg-indigo-50 border-indigo-400' : 'bg-white border-gray-200 hover:border-indigo-200'
              }`}
            >
              <p className={`text-sm font-medium ${data.navbar_style === n.value ? 'text-indigo-900' : 'text-gray-700'}`}>{n.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{n.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-600 block mb-2">Mobile Navigation</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'hamburger-dropdown', label: 'Hamburger Dropdown', desc: 'Klappt von oben auf' },
            { value: 'hamburger-overlay',  label: 'Hamburger Overlay',  desc: 'Fullscreen Menü' },
            { value: 'hamburger-sidebar',  label: 'Sidebar',            desc: 'Slide-in von der Seite' },
            { value: 'logo-cta-only',      label: 'Logo + CTA',         desc: 'Kein Menü — nur Logo & Button' },
          ].map((m) => (
            <button
              key={m.value}
              onClick={() => onChange({ navbar_mobile: m.value as BriefingData['navbar_mobile'] })}
              className={`p-3 rounded-lg border text-left transition-all ${
                data.navbar_mobile === m.value ? 'bg-indigo-50 border-indigo-400' : 'bg-white border-gray-200 hover:border-indigo-200'
              }`}
            >
              <p className={`text-sm font-medium ${data.navbar_mobile === m.value ? 'text-indigo-900' : 'text-gray-700'}`}>{m.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{m.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────

const defaultData: BriefingData = {
  company_name: '',
  industry: '',
  tagline: '',
  usp: '',
  adjectives: [],
  tone: '',
  primary_cta: 'Kostenloses Erstgespräch',
  personas: [],
  pain_points: [],
  style_paradigm: 'bold-expressive',
  visual_tone: 'confident' as VisualTone,
  animation_budget: 'moderate',
  navbar_style: 'sticky-blur',
  navbar_mobile: 'hamburger-dropdown',
  has_existing_brand: false,
  primary_color: '',
  accent_color: '',
  selected_pattern_ids: [],
  pages: [
    { title: 'Startseite', slug: '/', sections: ['hero', 'pain-points', 'services', 'process', 'cta', 'footer'] },
  ],
}

const PRESET_SLOTS: PresetSlot[] = ['A', 'B', 'C']

const DEFAULT_PRESETS: Record<PresetSlot, { label: string; data: BriefingData }> = {
  A: {
    label: 'Baumanagement Nordost GmbH',
    data: {
      company_name: 'Baumanagement Nordost GmbH',
      industry: 'construction',
      tagline: 'Wir bauen nicht nur Häuser — wir schaffen Heimat.',
      usp: 'Regionaler Bauträger mit 25 Jahren Erfahrung — schlüsselfertige Häuser in 6–18 Monaten. Feste Preise, kein Makler, ein Ansprechpartner vom Grundstück bis zur Schlüsselübergabe.',
      adjectives: ['vertrauenswürdig', 'persönlich', 'regional'],
      tone: 'professional',
      primary_cta: 'Beratungsgespräch vereinbaren',
      personas: [
        'Familie mit Kindern die endlich Planungssicherheit beim Hausbau will — kein Budget-Chaos, ein Ansprechpartner',
        'Kapitalanleger 45+ der sichere Mietobjekte in Norddeutschland sucht ohne Makler',
        'Rentnerpaar das barrierefreien Neubau in Stadtlage sucht — weg vom großen Haus',
      ],
      pain_points: [
        'Bauprojekte laufen aus dem Ruder — Kosten und Zeit nicht kontrollierbar',
        'Kein Überblick über den Baufortschritt, immer der Falsche am Telefon',
        'Schöne Renderings aber keine echten Referenzen bei anderen Anbietern',
        'Finanzierung unklar — man weiß nicht wo man anfangen soll',
      ],
      style_paradigm: 'bold-expressive',
      visual_tone: 'confident' as VisualTone,
      animation_budget: 'subtle',
      navbar_style: 'sticky-blur',
      navbar_mobile: 'hamburger-dropdown',
      has_existing_brand: true,
      primary_color: '#2C3E2D',
      accent_color: '#C8963E',
      selected_pattern_ids: [],
      pages: [
        { title: 'Startseite', slug: '/', sections: ['hero', 'pain-points', 'services', 'process', 'stats', 'testimonials', 'cta', 'footer'] },
        { title: 'Projekte', slug: '/projekte', sections: ['hero', 'features', 'cta', 'footer'] },
        { title: 'Kontakt', slug: '/kontakt', sections: ['hero', 'cta', 'footer'] },
      ],
    },
  },
  B: {
    label: 'Talentbridge HR Solutions GmbH',
    data: {
      company_name: 'Talentbridge HR Solutions GmbH',
      industry: 'recruiting-b2b',
      tagline: 'Wir finden nicht nur Kandidaten — wir finden die Richtigen.',
      usp: 'Recruiting-Boutique für Tech- und SaaS-Unternehmen. Max. 5 aktive Mandate gleichzeitig. Ø 34 Tage Time-to-Hire. Erfolgshonorar, kein Retainer.',
      adjectives: ['ambitioniert', 'professionell', 'modern'],
      tone: 'bold',
      primary_cta: 'Mandat besprechen',
      personas: [
        'HR-Leiterin 50-300-Personen SaaS die Senior-Position seit Monaten nicht besetzt bekommt',
        'Series-A-Gründer der erstes Sales-Team aufbauen will ohne selbst zu sourcen',
        'CFO der diskret Schlüsselposition nachbesetzen will ohne interne Unruhe',
      ],
      pain_points: [
        'Interne Recruiter haben kein Netzwerk für Senior-Positionen',
        'Große Agenturen behandeln kleine Mandate nicht ernst',
        'Kandidaten passen auf Papier aber nicht zur Kultur',
        'Prozess dauert Monate und kostet intern zu viel Attention',
      ],
      style_paradigm: 'tech-dark',
      visual_tone: 'expressive' as VisualTone,
      animation_budget: 'subtle',
      navbar_style: 'sticky-blur',
      navbar_mobile: 'hamburger-dropdown',
      has_existing_brand: true,
      primary_color: '#0A0F1E',
      accent_color: '#4F6EF7',
      selected_pattern_ids: [],
      pages: [
        { title: 'Startseite', slug: '/', sections: ['hero', 'stats', 'pain-points', 'services', 'process', 'testimonials', 'cta', 'footer'] },
        { title: 'Leistungen', slug: '/leistungen', sections: ['hero', 'features', 'process', 'cta', 'footer'] },
        { title: 'Kontakt', slug: '/kontakt', sections: ['hero', 'cta', 'footer'] },
      ],
    },
  },
  C: {
    label: 'Küstenröst GmbH',
    data: {
      company_name: 'Küstenröst GmbH',
      industry: 'e-commerce',
      tagline: 'Frisch geröstet. Direkt vom Hafen.',
      usp: 'Micro-Rösterei aus Rostock. Specialty Coffee in Kleinchargen, Versand innerhalb 24h nach der Röstung. Direkthandel mit Kaffeebauern — Einzelursprung, volle Transparenz.',
      adjectives: ['persönlich', 'nachhaltig', 'regional'],
      tone: 'friendly',
      primary_cta: 'Jetzt probieren',
      personas: [
        'Kaffee-Enthusiast 28-45 der Filterkaffee entdeckt hat und Geschmack statt Marke sucht',
        'Geschenkkäufer der etwas Besonderes aus der Region mitbringen will',
        'Café-Betreiber in MV der lokale Rösterei als Qualitätsmerkmal sucht',
      ],
      pain_points: [
        'Supermarkt-Kaffee schmeckt immer gleich — keine Transparenz über Herkunft',
        'Große Online-Röstereien fühlen sich anonym an — kein Vertrauen',
        'Specialty Coffee wirkt kompliziert und elitär — wo anfangen?',
        'Röstdatum unklar — Kaffee liegt Wochen im Lager bevor er ankommt',
      ],
      style_paradigm: 'bold-expressive',
      visual_tone: 'editorial' as VisualTone,
      animation_budget: 'subtle',
      navbar_style: 'transparent-hero',
      navbar_mobile: 'hamburger-overlay',
      has_existing_brand: true,
      primary_color: '#2A1810',
      accent_color: '#C4622D',
      selected_pattern_ids: [],
      pages: [
        { title: 'Startseite', slug: '/', sections: ['hero', 'features', 'stats', 'testimonials', 'cta', 'footer'] },
        { title: 'Shop', slug: '/shop', sections: ['hero', 'features', 'cta', 'footer'] },
        { title: 'Über uns', slug: '/ueber-uns', sections: ['hero', 'services', 'cta', 'footer'] },
      ],
    },
  },
}

function timeAgoShort(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function BriefingPresets({
  data,
  onLoad,
}: {
  data: BriefingData
  onLoad: (d: BriefingData) => void
}) {
  const { briefingPresets, saveBriefingPreset, clearBriefingPreset } = useBuilderStore()

  useEffect(() => {
    PRESET_SLOTS.forEach((slot) => {
      if (!briefingPresets[slot]) {
        const def = DEFAULT_PRESETS[slot]
        saveBriefingPreset(slot, def.data, def.label)
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSave(slot: PresetSlot) {
    const label = data.company_name.trim() || `Preset ${slot}`
    saveBriefingPreset(slot, data, label)
    toast.success(`Saved to slot ${slot}`)
  }

  function handleLoad(slot: PresetSlot) {
    const preset = briefingPresets[slot]
    if (!preset) return
    onLoad(preset.data)
    toast.success(`Loaded "${preset.label}"`)
  }

  function handleClear(slot: PresetSlot) {
    clearBriefingPreset(slot)
    toast(`Slot ${slot} cleared`)
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        <BookMarked className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Briefing Presets</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {PRESET_SLOTS.map((slot) => {
          const preset = briefingPresets[slot]
          return (
            <div
              key={slot}
              className={`rounded-xl border p-3 transition-all ${
                preset ? 'bg-white border-indigo-200 shadow-sm' : 'bg-gray-50 border-gray-200 border-dashed'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-black ${ preset ? 'text-indigo-600' : 'text-gray-300'}`}>
                  Slot {slot}
                </span>
                {preset && (
                  <span className="text-[10px] text-gray-400">{timeAgoShort(preset.savedAt)}</span>
                )}
              </div>

              {preset ? (
                <p className="text-xs font-semibold text-gray-700 truncate mb-3">{preset.label}</p>
              ) : (
                <p className="text-xs text-gray-400 mb-3">Empty</p>
              )}

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleSave(slot)}
                  className="flex-1 flex items-center justify-center gap-1 text-[11px] font-medium py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors"
                >
                  <Save className="w-3 h-3" /> Save
                </button>
                {preset && (
                  <>
                    <button
                      onClick={() => handleLoad(slot)}
                      className="flex-1 flex items-center justify-center gap-1 text-[11px] font-medium py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                    >
                      <FolderOpen className="w-3 h-3" /> Load
                    </button>
                    <button
                      onClick={() => handleClear(slot)}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                      title="Clear slot"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function BriefingPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isEditMode = searchParams.get('edit') === '1'
  const { manifest, newProjectFromManifest, setManifest, saveProject } = useBuilderStore()
  const [step, setStep] = useState(0)
  const [data, setData] = useState<BriefingData>(defaultData)
  const [loading, setLoading] = useState(false)

  // Pre-fill form from existing manifest when in edit mode
  useEffect(() => {
    if (!isEditMode || !manifest) return
    setData({
      company_name:     manifest.site?.name ?? defaultData.company_name,
      industry:         manifest.site?.industry ?? defaultData.industry,
      tagline:          defaultData.tagline,
      usp:              manifest.content?.company_usp ?? defaultData.usp,
      adjectives:       manifest.site?.adjectives ?? defaultData.adjectives,
      tone:             manifest.site?.tone ?? defaultData.tone,
      primary_cta:      manifest.content?.primary_cta ?? defaultData.primary_cta,
      personas:         manifest.content?.personas ?? defaultData.personas,
      pain_points:      manifest.content?.pain_points ?? defaultData.pain_points,
      style_paradigm:   manifest.style_paradigm ?? defaultData.style_paradigm,
      visual_tone:      (manifest.visual_tone ?? defaultData.visual_tone) as VisualTone,
      animation_budget: defaultData.animation_budget,
      navbar_style:     (manifest.navbar?.style as BriefingData['navbar_style']) ?? defaultData.navbar_style,
      navbar_mobile:    (manifest.navbar?.mobile_menu as BriefingData['navbar_mobile']) ?? defaultData.navbar_mobile,
      brand_colors:     undefined,
      has_existing_brand: !!(manifest.design_tokens?.colors?.primary),
      primary_color:    manifest.design_tokens?.colors?.primary ?? '',
      accent_color:     manifest.design_tokens?.colors?.accent ?? '',
      pages:            manifest.pages?.map((p) => ({
        title:    p.title,
        slug:     p.slug,
        sections: p.sections,
      })) ?? defaultData.pages,
      selected_pattern_ids: manifest.selected_patterns?.map((p) => p.id) ?? [],
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode])

  function update(partial: Partial<BriefingData>) {
    setData((prev) => ({ ...prev, ...partial }))
  }

  function loadPresetData(d: BriefingData) {
    setData(d)
    setStep(0)
  }

  function canProceed(): boolean {
    if (step === 0) return !!data.company_name.trim() && !!data.industry
    if (step === 1) return !!data.tone
    if (step === 2) return !!data.style_paradigm
    return true
  }

  async function handleSubmit() {
    setLoading(true)
    try {
      const brand_colors = data.has_existing_brand && data.primary_color
        ? { primary: data.primary_color, accent: data.accent_color }
        : undefined

      // Build pages list with fallback titles/slugs
      const pages = data.pages.map((p, i) => ({
        title:   p.title.trim()  || (i === 0 ? 'Startseite' : `Seite ${i + 1}`),
        slug:    p.slug.trim()   || (i === 0 ? '/' : `/seite-${i + 1}`),
        sections: p.sections.length > 0 ? p.sections : ['hero', 'services', 'cta', 'footer'],
      }))

      const res = await fetch('/api/v2/manifest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name:     data.company_name,
          industry:         data.industry,
          adjectives:       data.adjectives,
          tone:             data.tone,
          primary_cta:      data.primary_cta,
          personas:         data.personas,
          pain_points:      data.pain_points,
          style_paradigm:   data.style_paradigm,
          visual_tone:      data.visual_tone,
          animation_budget: data.animation_budget,
          navbar_style:     data.navbar_style,
          navbar_mobile:    data.navbar_mobile,
          brand_colors,
          pages,
          selected_pattern_ids: data.selected_pattern_ids,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? `HTTP ${res.status}`)
      }

      const { manifest } = await res.json() as { manifest: SiteManifest }

      // Override manifest pages with user-defined structure
      const manifestWithPages: SiteManifest = {
        ...manifest,
        pages: pages.map((p, i) => ({
          id:               `page-${i}`,
          slug:             p.slug,
          title:            p.title,
          sections:         p.sections,
          meta_description: manifest.pages[i]?.meta_description ?? '',
        })),
      }

      if (isEditMode) {
        // Update mode: just replace the manifest in the current project
        setManifest(manifestWithPages)
        saveProject()
        toast.success('Manifest aktualisiert — zurück zum Builder…')
      } else {
        // Create mode: create a brand-new project from the manifest
        newProjectFromManifest(manifestWithPages)
        saveProject()
        toast.success(`Projekt erstellt: ${pages.length} Seite${pages.length > 1 ? 'n' : ''} — weiterleitung zum Builder…`)
      }
      router.push('/builder')
    } catch (err) {
      console.error(err)
      toast.error(`Fehler: ${String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    <Step1 key="s1" data={data} onChange={update} />,
    <Step2 key="s2" data={data} onChange={update} />,
    <Step3 key="s3" data={data} onChange={update} />,
    <Step4 key="s4" data={data} onChange={update} />,
    <Step5 key="s5" data={data} onChange={update} />,
  ]

  return (
    <div className="min-h-screen bg-white">
      <PageTopbar title="Briefing Wizard" backHref="/projects" backLabel="Projects" />
      <div className="flex items-center justify-center p-8">
      <div className="w-full max-w-2xl">

        <BriefingPresets data={data} onLoad={loadPresetData} />

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <StepIndicator current={step} total={5} />

          <div className="min-h-[360px]">
            {steps[step]}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Zurück
            </button>

            {step < 4 ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canProceed()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
              >
                Weiter <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 min-w-[160px]"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Manifest wird erstellt…</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> {isEditMode ? 'Manifest aktualisieren' : 'Manifest generieren'}</>
                )}
              </Button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Das Manifest wird einmalig generiert und steuert alle nachfolgenden Sektionen.
        </p>
      </div>
      </div>
    </div>
  )
}

export default function BriefingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950 flex items-center justify-center"><div className="text-gray-400 text-sm">Loading…</div></div>}>
      <BriefingPageInner />
    </Suspense>
  )
}
