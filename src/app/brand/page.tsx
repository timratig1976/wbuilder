'use client'

import { useState, useCallback } from 'react'
import { useBuilderStore, BrandStyle } from '@/lib/store'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Zap, Type, Palette, LayoutTemplate, Sparkles, Check, Wand2, Loader2, RotateCcw, ChevronDown, History, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

const FONT_OPTIONS = [
  { label: 'Inter', value: 'Inter', category: 'Sans-serif' },
  { label: 'Open Sans', value: 'Open Sans', category: 'Sans-serif' },
  { label: 'Roboto', value: 'Roboto', category: 'Sans-serif' },
  { label: 'Poppins', value: 'Poppins', category: 'Sans-serif' },
  { label: 'DM Sans', value: 'DM Sans', category: 'Sans-serif' },
  { label: 'Space Grotesk', value: 'Space Grotesk', category: 'Sans-serif' },
  { label: 'Syne', value: 'Syne', category: 'Sans-serif' },
  { label: 'Nunito', value: 'Nunito', category: 'Sans-serif' },
  { label: 'Outfit', value: 'Outfit', category: 'Sans-serif' },
  { label: 'Raleway', value: 'Raleway', category: 'Sans-serif' },
  { label: 'Playfair Display', value: 'Playfair Display', category: 'Serif' },
  { label: 'Lora', value: 'Lora', category: 'Serif' },
  { label: 'Merriweather', value: 'Merriweather', category: 'Serif' },
  { label: 'Fraunces', value: 'Fraunces', category: 'Serif' },
  { label: 'Georgia', value: 'Georgia', category: 'Serif' },
  { label: 'Arial', value: 'Arial', category: 'System' },
  { label: 'Verdana', value: 'Verdana', category: 'System' },
  { label: 'Trebuchet MS', value: 'Trebuchet MS', category: 'System' },
  { label: 'Courier New', value: 'Courier New', category: 'Mono' },
  { label: 'JetBrains Mono', value: 'JetBrains Mono', category: 'Mono' },
]

const RADIUS_OPTIONS = [
  { label: 'Sharp', value: 'rounded-none', preview: 'rounded-none' },
  { label: 'Subtle', value: 'rounded', preview: 'rounded' },
  { label: 'Rounded', value: 'rounded-lg', preview: 'rounded-lg' },
  { label: 'Extra Rounded', value: 'rounded-2xl', preview: 'rounded-2xl' },
  { label: 'Pill', value: 'rounded-full', preview: 'rounded-full' },
]

const TONE_OPTIONS = [
  { label: 'Minimal & Clean', value: 'minimal and clean' },
  { label: 'Bold & Impactful', value: 'bold and impactful' },
  { label: 'Corporate & Professional', value: 'corporate and professional' },
  { label: 'Playful & Friendly', value: 'playful and friendly' },
  { label: 'Luxury & Premium', value: 'luxury and premium' },
  { label: 'Tech & Futuristic', value: 'tech and futuristic' },
  { label: 'Warm & Approachable', value: 'warm and approachable' },
  { label: 'Creative & Artistic', value: 'creative and artistic' },
]

const COLOR_PRESETS = [
  { name: 'Indigo', primary: '#4F46E5', secondary: '#818CF8' },
  { name: 'Rose', primary: '#E11D48', secondary: '#FB7185' },
  { name: 'Emerald', primary: '#059669', secondary: '#34D399' },
  { name: 'Amber', primary: '#D97706', secondary: '#FCD34D' },
  { name: 'Violet', primary: '#7C3AED', secondary: '#A78BFA' },
  { name: 'Sky', primary: '#0284C7', secondary: '#38BDF8' },
  { name: 'Slate', primary: '#334155', secondary: '#94A3B8' },
  { name: 'Orange', primary: '#EA580C', secondary: '#FB923C' },
]

function CollapsibleSection({
  icon, title, color, badge, defaultOpen = false, children
}: {
  icon: React.ReactNode
  title: string
  color: string
  badge?: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="border-b border-gray-100">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-semibold text-gray-900 text-sm">{title}</span>
          {badge && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${color}15`, color }}>
              {badge}
            </span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-6 pb-5">{children}</div>}
    </section>
  )
}

// System fonts that don't need Google Fonts
const SYSTEM_FONTS = new Set(['Arial', 'Verdana', 'Trebuchet MS', 'Georgia', 'Courier New'])

interface ToneStyle {
  heroBg: string
  heroText: string
  cardBg: string
  navBg: string
  navBorder: string
  headingWeight: string
  bodySpacing: string
  tagline: string
  badge: string
  ctaBg: string
  ctaText: string
  cardShadow: string
}

function getToneStyle(tone: string, primary: string, secondary: string): ToneStyle {
  const t = tone.toLowerCase()
  if (t.includes('luxury') || t.includes('premium')) return {
    heroBg: '#0f0f0f',
    heroText: '#f5f0e8',
    cardBg: '#1a1a1a',
    navBg: '#0f0f0f',
    navBorder: '#2a2a2a',
    headingWeight: '800',
    bodySpacing: '0.04em',
    tagline: 'Luxury · Premium · Exclusive',
    badge: '#c9a84c',
    ctaBg: '#c9a84c',
    ctaText: '#0f0f0f',
    cardShadow: '0 4px 24px rgba(201,168,76,0.15)',
  }
  if (t.includes('bold') || t.includes('impactful')) return {
    heroBg: '#111',
    heroText: '#ffffff',
    cardBg: '#1c1c1c',
    navBg: '#111',
    navBorder: '#222',
    headingWeight: '900',
    bodySpacing: '-0.01em',
    tagline: 'Bold · Powerful · Unapologetic',
    badge: primary,
    ctaBg: primary,
    ctaText: '#ffffff',
    cardShadow: `0 0 0 2px ${primary}40`,
  }
  if (t.includes('tech') || t.includes('futuristic')) return {
    heroBg: '#060d1f',
    heroText: '#e2e8ff',
    cardBg: '#0d1a30',
    navBg: '#060d1f',
    navBorder: '#1a2a4a',
    headingWeight: '700',
    bodySpacing: '0.02em',
    tagline: 'Innovative · Fast · Future-ready',
    badge: secondary,
    ctaBg: secondary,
    ctaText: '#060d1f',
    cardShadow: `0 0 20px ${primary}30`,
  }
  if (t.includes('playful') || t.includes('friendly')) return {
    heroBg: `${primary}10`,
    heroText: '#1a1a2e',
    cardBg: '#fafafa',
    navBg: '#ffffff',
    navBorder: `${primary}20`,
    headingWeight: '800',
    bodySpacing: '0',
    tagline: 'Fun · Friendly · Human',
    badge: secondary,
    ctaBg: primary,
    ctaText: '#ffffff',
    cardShadow: `0 8px 30px ${primary}25`,
  }
  if (t.includes('corporate') || t.includes('professional')) return {
    heroBg: '#f8f9fc',
    heroText: '#1a202c',
    cardBg: '#ffffff',
    navBg: '#ffffff',
    navBorder: '#e2e8f0',
    headingWeight: '700',
    bodySpacing: '0',
    tagline: 'Trusted · Professional · Results-driven',
    badge: primary,
    ctaBg: primary,
    ctaText: '#ffffff',
    cardShadow: '0 1px 4px rgba(0,0,0,0.08)',
  }
  if (t.includes('warm') || t.includes('approachable')) return {
    heroBg: '#fdf6f0',
    heroText: '#2d1f14',
    cardBg: '#fff9f5',
    navBg: '#fffdf8',
    navBorder: '#f0e0cc',
    headingWeight: '700',
    bodySpacing: '0',
    tagline: 'Warm · Human · Inviting',
    badge: '#d97706',
    ctaBg: '#d97706',
    ctaText: '#ffffff',
    cardShadow: '0 4px 16px rgba(217,119,6,0.12)',
  }
  if (t.includes('creative') || t.includes('artistic')) return {
    heroBg: `linear-gradient(135deg, ${primary}22, ${secondary}33)`,
    heroText: '#1a1a1a',
    cardBg: '#ffffff',
    navBg: '#ffffff',
    navBorder: `${primary}30`,
    headingWeight: '800',
    bodySpacing: '0',
    tagline: 'Creative · Expressive · Unique',
    badge: secondary,
    ctaBg: primary,
    ctaText: '#ffffff',
    cardShadow: `0 8px 32px ${secondary}30`,
  }
  // Default: minimal & clean
  return {
    heroBg: '#ffffff',
    heroText: '#111827',
    cardBg: '#f9fafb',
    navBg: '#ffffff',
    navBorder: '#f3f4f6',
    headingWeight: '700',
    bodySpacing: '0',
    tagline: 'Simple · Clean · Focused',
    badge: primary,
    ctaBg: primary,
    ctaText: '#ffffff',
    cardShadow: '0 1px 3px rgba(0,0,0,0.07)',
  }
}

function BrandPreview({ brand, companyName = 'Ihr Unternehmen' }: { brand: BrandStyle; companyName?: string }) {
  const primary    = brand.primaryColor    || '#4F46E5'
  const secondary  = brand.secondaryColor  || '#818CF8'
  const accent     = brand.accentColor     || primary
  const bg         = brand.backgroundColor || '#ffffff'
  const surface    = brand.surfaceColor    || '#f9fafb'
  const dark       = brand.darkColor       || '#111827'
  const textCol    = brand.textColor       || '#111827'
  const textMuted  = brand.textMutedColor  || '#6b7280'
  const fontHead   = brand.fontFamily      || 'Inter'
  const fontBody   = brand.fontBody        || fontHead
  const headWeight = brand.headingWeight   || '700'
  const radius     = brand.borderRadius    || 'rounded-lg'

  // Determine if dark section should use light text
  const darkIsDark = dark.toLowerCase() < '#888888'
  const darkText   = darkIsDark ? '#ffffff' : textCol
  const darkMuted  = darkIsDark ? 'rgba(255,255,255,0.6)' : textMuted

  const isSystemFont = SYSTEM_FONTS.has(fontHead)
  const googleFontUrl = isSystemFont
    ? ''
    : `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontHead)}:wght@400;600;700;800;900&display=swap`

  return (
    <div className="w-full h-full overflow-y-auto rounded-2xl border border-gray-200 shadow-inner" style={{ backgroundColor: bg }}>
      {googleFontUrl && (
        <style>{`@import url('${googleFontUrl}'); .bp-head { font-family: '${fontHead}', sans-serif !important; } .bp-body { font-family: '${fontBody}', sans-serif !important; }`}</style>
      )}

      {/* Token badge helper */}
      {(() => {
        const Badge = ({ token, hex }: { token: string; hex: string }) => (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border" style={{ backgroundColor: `${hex}18`, borderColor: `${hex}40`, color: hex }}>
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: hex }} />
            {token}
          </span>
        )
        return null
      })()}

      {/* ── Navbar ── background token */}
      <div className="relative">
        <div className="absolute top-1 right-2 flex gap-1 z-10 opacity-80">
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full border" style={{ backgroundColor: `${bg}cc`, borderColor: `${primary}40`, color: primary }}>
            <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: bg, border: '1px solid #ccc' }} />background
          </span>
        </div>
        <div className="flex items-center justify-between px-8 py-4 border-b" style={{ backgroundColor: bg, borderColor: surface }}>
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 flex items-center justify-center ${radius}`} style={{ backgroundColor: primary }}>
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="bp-head font-bold text-base" style={{ color: textCol, fontWeight: headWeight }}>{companyName}</span>
          </div>
          <div className="flex items-center gap-6 text-sm bp-body" style={{ color: textMuted }}>
            <span>Leistungen</span><span>Ablauf</span><span>Kontakt</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${accent}20`, color: accent }}>accent →</span>
            <button className={`px-4 py-2 text-sm font-semibold bp-head ${radius}`} style={{ backgroundColor: accent, color: '#fff' }}>
              Beratung anfragen
            </button>
          </div>
        </div>
      </div>

      {/* ── Hero ── dark token as background */}
      <div className="relative">
        <div className="absolute top-2 right-2 flex gap-1 z-10">
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${accent}30`, color: '#fff' }}>dark → background</span>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${accent}50`, color: '#fff' }}>highlight → badge</span>
        </div>
        <div className="px-8 py-16 text-center" style={{ backgroundColor: dark }}>
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-5"
            style={{ backgroundColor: `${accent}25`, color: accent }}
          >
            <Sparkles className="w-3 h-3" /> Vertrauenswürdig · Regional · Transparent
          </div>
          <h1 className="bp-head text-4xl mb-4 leading-tight" style={{ color: darkText, fontWeight: headWeight }}>
            Ihr Bauprojekt,{' '}
            <span style={{ color: accent }}>persönlich begleitet</span>
          </h1>
          <p className="bp-body text-lg max-w-md mx-auto mb-8" style={{ color: darkMuted }}>
            Mit einem festen Ansprechpartner, klaren Abläufen und voller Kostentransparenz.
          </p>
          <div className="flex items-center justify-center gap-3">
            <div>
              <span className="block text-[10px] mb-1" style={{ color: `${accent}cc` }}>← accent</span>
              <button className={`bp-head px-6 py-3 text-sm font-bold ${radius}`} style={{ backgroundColor: accent, color: '#fff' }}>
                Beratungsgespräch vereinbaren
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Services ── surface + background + primary/secondary/accent */}
      <div className="relative">
        <div className="absolute top-2 right-2 flex gap-1 z-10">
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full border" style={{ backgroundColor: `${surface}`, borderColor: `${primary}30`, color: primary }}>surface → section bg</span>
        </div>
        <div className="px-8 py-10 grid grid-cols-3 gap-4" style={{ backgroundColor: surface }}>
          {[
            { label: 'Projektsteuerung', token: 'primary', color: primary },
            { label: 'Persönliche Betreuung', token: 'secondary', color: secondary },
            { label: 'Bauqualität & Finanzierung', token: 'accent', color: accent },
          ].map(({ label, token, color }, i) => (
            <div
              key={i}
              className={`p-5 ${radius} relative`}
              style={{ backgroundColor: bg, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: `1px solid ${surface}` }}
            >
              <span className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${color}15`, color }}>
                {token}
              </span>
              <div
                className={`w-10 h-10 flex items-center justify-center mb-3 ${radius}`}
                style={{ backgroundColor: `${color}20` }}
              >
                <Check className="w-5 h-5" style={{ color }} />
              </div>
              <p className="bp-head font-semibold text-sm" style={{ color: textCol, fontWeight: headWeight }}>{label}</p>
              <p className="bp-body text-xs mt-1" style={{ color: textMuted }}>Klare Abläufe & volle Kostenkontrolle.</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA ── primary as section background */}
      <div className="relative">
        <div className="absolute top-2 right-2 z-10">
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff' }}>primary → CTA background</span>
        </div>
        <div className="px-8 py-10 text-center" style={{ backgroundColor: primary }}>
          <h2 className="bp-head text-2xl font-bold mb-2" style={{ color: '#fff', fontWeight: headWeight }}>Jetzt Beratung anfragen</h2>
          <p className="bp-body text-sm opacity-80 mb-5" style={{ color: '#fff' }}>Kostenloses Erstgespräch — unverbindlich & persönlich.</p>
          <div className="flex items-center justify-center gap-3">
            <div>
              <span className="block text-[10px] mb-1 opacity-70" style={{ color: '#fff' }}>← accent button on primary bg</span>
              <button className={`bp-head px-6 py-3 text-sm font-bold ${radius}`} style={{ backgroundColor: accent, color: '#fff' }}>
                Beratungsgespräch vereinbaren
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Typography + full token palette ── */}
      <div className="px-8 py-6" style={{ backgroundColor: bg, borderTop: `1px solid ${surface}` }}>
        <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: textMuted }}>
          Typography tokens
        </p>
        <div className="space-y-1.5 mb-5">
          <div className="flex items-baseline gap-2">
            <p className="bp-head" style={{ fontSize: 28, fontWeight: headWeight, color: textCol }}>Überschrift H1</p>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${primary}15`, color: primary }}>font_heading · weight {headWeight}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="bp-head" style={{ fontSize: 20, fontWeight: '700', color: textCol }}>Abschnittsüberschrift H2</p>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="bp-body" style={{ fontSize: 14, color: textMuted }}>Fließtext — font_body · text_muted color</p>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${accent}15`, color: accent }}>text_muted</span>
          </div>
        </div>

        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: textMuted }}>All color tokens</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { c: primary,   label: 'primary',     desc: 'CTA bg, icons, links' },
            { c: secondary, label: 'secondary',   desc: 'Feature icons, badges' },
            { c: accent,    label: 'accent',       desc: 'Buttons, highlights' },
            { c: brand.highlightColor || accent, label: 'highlight', desc: 'Emphasized text' },
            { c: dark,      label: 'dark',         desc: 'Hero / dark sections' },
            { c: surface,   label: 'surface',      desc: 'Section alternates' },
            { c: bg,        label: 'background',   desc: 'Page background' },
            { c: textCol,   label: 'text',         desc: 'Body text' },
            { c: textMuted, label: 'text_muted',   desc: 'Subtitles, captions' },
          ].map(({ c, label, desc }) => (
            <div key={label} className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: surface }}>
              <div className="w-8 h-8 rounded-lg flex-shrink-0 border" style={{ backgroundColor: c, borderColor: `${textMuted}30` }} />
              <div className="min-w-0">
                <p className="text-[11px] font-bold truncate" style={{ color: textCol }}>{label}</p>
                <p className="text-[10px] truncate" style={{ color: textMuted }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

function buildBrandInstruction(brand: BrandStyle): string {
  const parts: string[] = []
  if (brand.primaryColor)    parts.push(`primary color: ${brand.primaryColor}`)
  if (brand.secondaryColor)  parts.push(`secondary color: ${brand.secondaryColor}`)
  if (brand.accentColor)     parts.push(`accent color: ${brand.accentColor}`)
  if (brand.highlightColor)  parts.push(`highlight color: ${brand.highlightColor}`)
  if (brand.backgroundColor) parts.push(`background color: ${brand.backgroundColor}`)
  if (brand.surfaceColor)    parts.push(`surface/card background color: ${brand.surfaceColor}`)
  if (brand.darkColor)       parts.push(`dark section background color: ${brand.darkColor}`)
  if (brand.textColor)       parts.push(`body text color: ${brand.textColor}`)
  if (brand.textMutedColor)  parts.push(`muted/secondary text color: ${brand.textMutedColor}`)
  if (brand.fontFamily)      parts.push(`heading font family: ${brand.fontFamily}`)
  if (brand.fontBody)        parts.push(`body font family: ${brand.fontBody}`)
  if (brand.headingWeight)   parts.push(`heading font weight: ${brand.headingWeight}`)
  if (brand.borderRadius)    parts.push(`button and card shape: ${brand.borderRadius}`)
  if (brand.tone) parts.push(`visual tone: ${brand.tone}`)
  if (brand.extraNotes) parts.push(brand.extraNotes)
  return `Apply this brand style consistently across the section: ${parts.join(', ')}`
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function BrandPage() {
  const {
    project, manifest, setBrand,
    snapshotAllSections, revertAllSections,
    pushHistory, revertToHistory, clearHistory,
    updateSectionHtmlAcrossPages,
    history,
  } = useBuilderStore()

  // Always derive brand from manifest when one is loaded — single source of truth
  const brand: BrandStyle = manifest ? {
    ...project.brand,
    primaryColor:    manifest.design_tokens.colors.primary,
    secondaryColor:  manifest.design_tokens.colors.secondary,
    accentColor:     manifest.design_tokens.colors.accent,
    highlightColor:  manifest.design_tokens.colors.highlight,
    backgroundColor: manifest.design_tokens.colors.background,
    surfaceColor:    manifest.design_tokens.colors.surface,
    darkColor:       manifest.design_tokens.colors.dark,
    textColor:       manifest.design_tokens.colors.text,
    textMutedColor:  manifest.design_tokens.colors.text_muted,
    fontFamily:      manifest.design_tokens.typography.font_heading,
    fontBody:        manifest.design_tokens.typography.font_body,
    headingWeight:   manifest.design_tokens.typography.heading_weight,
    tone:            manifest.site.tone,
  } : project.brand

  const [applying, setApplying] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [hasApplied, setHasApplied] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  function update(key: keyof BrandStyle, value: string) {
    setBrand({ [key]: value })
  }

  const totalSections = project.pages.reduce((sum, p) => sum + p.sections.length, 0)
  const keyColorFields: (keyof BrandStyle)[] = ['primaryColor', 'secondaryColor', 'accentColor', 'fontFamily']
  const completedFields = keyColorFields.filter((k) => brand[k]?.trim() !== '').length
  const totalFields = keyColorFields.length

  // ── Apply Brand via AI (constrained) ─────────────────────────────────────
  const handleApplyBrand = useCallback(async () => {
    const instruction = buildBrandInstruction(brand)
    if (!instruction.trim() || totalSections === 0) {
      toast.error('No brand settings or sections to apply to')
      return
    }
    pushHistory('Before AI brand apply')
    snapshotAllSections()
    setApplying(true)
    setHasApplied(false)
    const allTasks: Array<{ pageId: string; sectionId: string; html: string }> = []
    project.pages.forEach((p) => p.sections.forEach((sec) => allTasks.push({ pageId: p.id, sectionId: sec.id, html: sec.html })))
    setProgress({ done: 0, total: allTasks.length })
    toast.info(`Applying brand to ${allTasks.length} sections…`)

    let successCount = 0
    await Promise.all(
      allTasks.map(async ({ pageId, sectionId, html }) => {
        try {
          const constrainedInstruction = `${instruction}. IMPORTANT: Change ONLY the specified colors and fonts. Do NOT alter layout, spacing, content, section structure, animations, or any other property. Return the section HTML with ONLY these token substitutions applied.`
          const res = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ styleEdit: true, currentHtml: html, styleInstruction: constrainedInstruction, sectionType: 'custom' }),
          })
          if (!res.ok) return
          const data = await res.json()
          if (data.html?.trim()) {
            updateSectionHtmlAcrossPages(pageId, sectionId, data.html)
            successCount++
          }
        } catch { /* skip */ } finally {
          setProgress((p) => ({ ...p, done: p.done + 1 }))
        }
      })
    )
    setApplying(false)
    setHasApplied(true)
    toast.success(`Brand applied to ${successCount} sections!`)
  }, [brand, project, snapshotAllSections, pushHistory, updateSectionHtmlAcrossPages, totalSections])

  function handleRevert() {
    revertAllSections()
    setHasApplied(false)
    toast.success('Reverted all sections to previous state')
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* Top bar */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/builder">
            <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Builder
            </button>
          </Link>
          <div className="w-px h-5 bg-gray-200" />
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-pink-500" />
            <span className="font-bold text-gray-900">Brand Studio</span>
            <span className="text-sm text-gray-400 ml-1">— {project.name}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Completeness */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">{completedFields}/{totalFields} brand fields set</span>
            <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-pink-500 transition-all" style={{ width: `${(completedFields / totalFields) * 100}%` }} />
            </div>
          </div>

          {/* Section count */}
          {totalSections > 0 && (
            <span className="text-xs text-gray-400 border-l border-gray-200 pl-3">
              {totalSections} section{totalSections !== 1 ? 's' : ''} across {project.pages.length} page{project.pages.length !== 1 ? 's' : ''}
            </span>
          )}

          {/* Progress bar during apply */}
          {applying && (
            <div className="flex items-center gap-2">
              <div className="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all"
                  style={{ width: `${progress.total > 0 ? (progress.done / progress.total) * 100 : 0}%` }}
                />
              </div>
              <span className="text-xs text-indigo-600 font-medium">{progress.done}/{progress.total}</span>
            </div>
          )}

          {/* History toggle */}
          <Button
            onClick={() => setShowHistory((v) => !v)}
            variant="outline"
            size="sm"
            className={`text-xs gap-1.5 ${history.length > 0 ? 'border-amber-300 text-amber-600 hover:bg-amber-50' : ''}`}
          >
            <History className="w-3.5 h-3.5" />
            History {history.length > 0 && <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 rounded-full">{history.length}</span>}
          </Button>

          {/* Undo last apply */}
          {hasApplied && !applying && (
            <Button
              onClick={handleRevert}
              variant="outline"
              size="sm"
              className="text-xs border-orange-300 text-orange-600 hover:bg-orange-50 gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Undo Apply
            </Button>
          )}

          {/* Apply brand via AI (constrained) */}
          <Button
            onClick={handleApplyBrand}
            disabled={applying || totalSections === 0 || completedFields === 0}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm gap-1.5"
          >
            {applying ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Applying…</>
            ) : (
              <><Wand2 className="w-4 h-4" /> Apply Brand (AI)</>
            )}
          </Button>
        </div>
      </header>

      {/* Main layout: editor left, (history panel), preview right */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: Editor panel */}
        <div className="w-96 flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto">

          {/* Color section */}
          <CollapsibleSection icon={<Palette className="w-4 h-4 text-pink-500" />} title="Colors" color="#ec4899" badge={brand.primaryColor || undefined} defaultOpen>

            {/* Quick presets */}
            <p className="text-xs text-gray-400 mb-2">Quick presets</p>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => { update('primaryColor', preset.primary); update('secondaryColor', preset.secondary) }}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all hover:scale-105 ${
                    brand.primaryColor === preset.primary ? 'border-gray-900' : 'border-transparent hover:border-gray-200'
                  }`}
                  title={preset.name}
                >
                  <div className="flex gap-0.5">
                    <div className="w-4 h-6 rounded-l-md" style={{ backgroundColor: preset.primary }} />
                    <div className="w-4 h-6 rounded-r-md" style={{ backgroundColor: preset.secondary }} />
                  </div>
                  <span className="text-[10px] text-gray-500 font-medium">{preset.name}</span>
                </button>
              ))}
            </div>

            {/* Custom colors — all manifest fields */}
            <div className="space-y-3">
              {([
                { key: 'primaryColor',    label: 'Primary',    fallback: '#4F46E5' },
                { key: 'secondaryColor',  label: 'Secondary',  fallback: '#818CF8' },
                { key: 'accentColor',     label: 'Accent',     fallback: '#F59E0B' },
                { key: 'highlightColor',  label: 'Highlight',  fallback: '#E0E7FF' },
                { key: 'backgroundColor', label: 'Background', fallback: '#FFFFFF' },
                { key: 'surfaceColor',    label: 'Surface',    fallback: '#F9FAFB' },
                { key: 'darkColor',       label: 'Dark',       fallback: '#111827' },
                { key: 'textColor',       label: 'Text',       fallback: '#1F2937' },
                { key: 'textMutedColor',  label: 'Text Muted', fallback: '#6B7280' },
              ] as { key: keyof BrandStyle; label: string; fallback: string }[]).map(({ key, label, fallback }) => (
                <div key={key}>
                  <label className="text-xs font-semibold text-gray-500 block mb-1.5">{label}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={brand[key] || fallback}
                      onChange={(e) => update(key, e.target.value)}
                      className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5 flex-shrink-0"
                    />
                    <input
                      type="text"
                      value={brand[key]}
                      onChange={(e) => update(key, e.target.value)}
                      placeholder={fallback}
                      className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300 font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>

          {/* Typography section */}
          <CollapsibleSection icon={<Type className="w-4 h-4 text-indigo-500" />} title="Typography" color="#6366f1" badge={brand.fontFamily || undefined}>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Heading Font</p>
            {(['Sans-serif', 'Serif', 'System', 'Mono'] as const).map((cat) => {
              const fonts = FONT_OPTIONS.filter((f) => f.category === cat)
              return (
                <div key={cat} className="mb-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{cat}</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {fonts.map((font) => (
                      <button
                        key={font.value}
                        onClick={() => update('fontFamily', font.value)}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg border-2 text-left transition-all ${
                          brand.fontFamily === font.value
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-100 hover:border-indigo-200 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-xs font-medium text-gray-800 truncate">{font.label}</span>
                        {brand.fontFamily === font.value && <Check className="w-3 h-3 text-indigo-500 flex-shrink-0 ml-1" />}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
            <div className="mt-1 mb-4">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Custom heading font</label>
              <input
                type="text"
                value={brand.fontFamily}
                onChange={(e) => update('fontFamily', e.target.value)}
                placeholder="e.g. Cabin, Josefin Sans…"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div className="border-t border-gray-100 pt-4 space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Body Font</label>
                <input
                  type="text"
                  value={brand.fontBody}
                  onChange={(e) => update('fontBody', e.target.value)}
                  placeholder="e.g. Inter, Open Sans…"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Heading Weight</label>
                <div className="flex gap-2">
                  {['600', '700', '800', '900'].map((w) => (
                    <button
                      key={w}
                      onClick={() => update('headingWeight', w)}
                      className={`flex-1 py-2 rounded-lg border-2 text-xs font-bold transition-all ${
                        brand.headingWeight === w
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-100 text-gray-500 hover:border-indigo-200'
                      }`}
                      style={{ fontWeight: Number(w) }}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Border radius section */}
          <CollapsibleSection icon={<LayoutTemplate className="w-4 h-4 text-violet-500" />} title="Button & Card Shape" color="#7c3aed" badge={brand.borderRadius || undefined}>
            <div className="flex gap-2 flex-wrap">
              {RADIUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => update('borderRadius', opt.value)}
                  className={`flex flex-col items-center gap-2 px-4 py-3 border-2 transition-all ${opt.preview} ${
                    brand.borderRadius === opt.value
                      ? 'border-violet-500 bg-violet-50'
                      : 'border-gray-100 hover:border-violet-200 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-12 h-7 bg-violet-500 ${opt.preview}`} />
                  <span className="text-xs font-medium text-gray-600">{opt.label}</span>
                </button>
              ))}
            </div>
          </CollapsibleSection>

          {/* Navbar section */}
          <CollapsibleSection icon={<LayoutTemplate className="w-4 h-4 text-blue-500" />} title="Navbar" color="#3b82f6" badge={manifest?.navbar?.style || undefined}>
            <div className="space-y-4">
              {/* Navbar Style */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Navbar Style</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'sticky-blur', label: 'Sticky Blur', desc: 'Stays fixed with blur effect' },
                    { value: 'static', label: 'Static', desc: 'Normal scroll behavior' },
                    { value: 'transparent-hero', label: 'Transparent Hero', desc: 'Transparent over hero' },
                    { value: 'hidden-scroll', label: 'Hide on Scroll', desc: 'Hides when scrolling down' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        if (manifest) {
                          const newManifest = { ...manifest, navbar: { ...manifest.navbar, style: opt.value as any } }
                          useBuilderStore.getState().setManifest(newManifest)
                        }
                      }}
                      className={`flex flex-col items-start gap-1 px-3 py-2.5 rounded-xl border-2 text-left transition-all ${
                        manifest?.navbar?.style === opt.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-xs font-semibold text-gray-800">{opt.label}</span>
                      <span className="text-[10px] text-gray-500">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* CTA Button Toggle */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">CTA Button</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      if (manifest) {
                        const newManifest = { ...manifest, navbar: { ...manifest.navbar, cta_button: !manifest.navbar?.cta_button } }
                        useBuilderStore.getState().setManifest(newManifest)
                      }
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                      manifest?.navbar?.cta_button
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:border-blue-200'
                    }`}
                  >
                    <span className="text-xs font-medium">{manifest?.navbar?.cta_button ? '✓ CTA Enabled' : 'CTA Disabled'}</span>
                  </button>
                  {manifest?.navbar?.cta_button && (
                    <input
                      type="text"
                      value={manifest?.navbar?.cta_label || ''}
                      onChange={(e) => {
                        if (manifest) {
                          const newManifest = { ...manifest, navbar: { ...manifest.navbar, cta_label: e.target.value } }
                          useBuilderStore.getState().setManifest(newManifest)
                        }
                      }}
                      placeholder="CTA Label"
                      className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  )}
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Tone section */}
          <CollapsibleSection icon={<Sparkles className="w-4 h-4 text-amber-500" />} title="Visual Tone" color="#f59e0b" badge={brand.tone || undefined} defaultOpen>
            <div className="grid grid-cols-2 gap-2">
              {TONE_OPTIONS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => update('tone', t.value)}
                  className={`px-3 py-2.5 rounded-xl border-2 text-xs font-medium text-left transition-all ${
                    brand.tone === t.value
                      ? 'border-amber-400 bg-amber-50 text-amber-800'
                      : 'border-gray-100 text-gray-600 hover:border-amber-200 hover:bg-gray-50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </CollapsibleSection>

          {/* Extra notes section */}
          <CollapsibleSection icon={<Sparkles className="w-4 h-4 text-gray-400" />} title="Extra AI Instructions" color="#6b7280" badge={brand.extraNotes ? 'set' : undefined}>
            <p className="text-xs text-gray-400 mb-2 leading-relaxed">
              Any other design rules the AI should follow across all pages — dark backgrounds, specific imagery style, layout preferences, etc.
            </p>
            <textarea
              value={brand.extraNotes}
              onChange={(e) => update('extraNotes', e.target.value)}
              rows={4}
              placeholder="e.g. Always use dark section backgrounds for hero. Avoid stock photo clichés. Use geometric shapes as decorative elements. Keep copy concise..."
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none leading-relaxed"
            />
          </CollapsibleSection>
        </div>

        {/* History panel */}
        {showHistory && (
          <div className="w-72 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-bold text-gray-900">History</span>
                <span className="text-xs text-gray-400">({history.length}/20)</span>
              </div>
              <div className="flex items-center gap-2">
                {history.length > 0 && (
                  <button
                    onClick={() => { clearHistory(); toast('History cleared') }}
                    className="text-[11px] text-gray-400 hover:text-red-500 transition-colors"
                  >
                    Clear all
                  </button>
                )}
                <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-700">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {history.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <History className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">No history yet.</p>
                  <p className="text-xs text-gray-300 mt-1">Snapshots are saved automatically before every Sync or AI Apply.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {history.map((entry, i) => (
                    <div key={entry.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-700 truncate">{entry.label}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">{timeAgo(entry.timestamp)}</p>
                        </div>
                        <button
                          onClick={() => {
                            pushHistory(`Before revert to "${entry.label}"`)
                            revertToHistory(entry.id)
                            toast.success(`Reverted to: ${entry.label}`)
                          }}
                          className="flex-shrink-0 text-[11px] font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg transition-colors"
                        >
                          Restore
                        </button>
                      </div>
                      {i === 0 && (
                        <span className="inline-block mt-1 text-[10px] bg-emerald-100 text-emerald-700 font-semibold px-1.5 py-0.5 rounded-full">latest</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right: Live preview */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="px-6 py-3 border-b border-gray-200 bg-white flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Live Preview — updates as you edit</span>
          </div>
          <div className="flex-1 overflow-hidden p-6">
            <BrandPreview brand={brand} companyName={project.manifest?.content?.company_name || project.name} />
          </div>
        </div>

      </div>
    </div>
  )
}
