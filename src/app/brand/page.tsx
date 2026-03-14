'use client'

import { useState, useCallback } from 'react'
import { useBuilderStore, BrandStyle } from '@/lib/store'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Zap, Type, Palette, LayoutTemplate, Sparkles, Check, Wand2, Loader2, RotateCcw, ChevronDown } from 'lucide-react'
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

function BrandPreview({ brand }: { brand: BrandStyle }) {
  const fontFamily = brand.fontFamily || 'Inter'
  const primaryColor = brand.primaryColor || '#4F46E5'
  const secondaryColor = brand.secondaryColor || '#818CF8'
  const radius = brand.borderRadius || 'rounded-lg'
  const tone = brand.tone || 'minimal and clean'

  const isSystemFont = SYSTEM_FONTS.has(fontFamily)
  const googleFontUrl = isSystemFont
    ? ''
    : `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@400;600;700;800;900&display=swap`

  const ts = getToneStyle(tone, primaryColor, secondaryColor)
  const isDark = ts.heroBg === '#0f0f0f' || ts.heroBg === '#111' || ts.heroBg === '#060d1f'
  const cardTextColor = isDark || ts.cardBg.startsWith('#0') || ts.cardBg.startsWith('#1') ? '#e5e7eb' : '#111827'
  const cardSubColor = isDark || ts.cardBg.startsWith('#0') || ts.cardBg.startsWith('#1') ? '#9ca3af' : '#6b7280'

  return (
    <div className="w-full h-full overflow-y-auto rounded-2xl border border-gray-200 shadow-inner" style={{ backgroundColor: ts.navBg }}>
      {googleFontUrl && <style>{`@import url('${googleFontUrl}'); .brand-preview * { font-family: '${fontFamily}', sans-serif !important; }`}</style>}
      {!googleFontUrl && <style>{`.brand-preview * { font-family: '${fontFamily}', sans-serif !important; }`}</style>}
      <div className="brand-preview">

        {/* Navbar */}
        <div
          className="flex items-center justify-between px-8 py-4"
          style={{ backgroundColor: ts.navBg, borderBottom: `1px solid ${ts.navBorder}` }}
        >
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 flex items-center justify-center ${radius}`} style={{ backgroundColor: primaryColor }}>
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg" style={{ color: ts.heroText, fontWeight: ts.headingWeight }}>{brand.fontFamily || 'YourBrand'}</span>
          </div>
          <div className="flex items-center gap-6 text-sm font-medium" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
            <span>Features</span><span>Pricing</span><span>About</span>
          </div>
          <button
            className={`px-4 py-2 text-sm font-semibold ${radius}`}
            style={{ backgroundColor: ts.ctaBg, color: ts.ctaText }}
          >
            Get Started
          </button>
        </div>

        {/* Hero */}
        <div
          className="px-8 py-16 text-center"
          style={{ background: ts.heroBg }}
        >
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-5"
            style={{ backgroundColor: `${ts.badge}20`, color: ts.badge }}
          >
            <Sparkles className="w-3 h-3" /> {ts.tagline}
          </div>
          <h1
            className="text-4xl mb-4 leading-tight"
            style={{ color: ts.heroText, fontWeight: ts.headingWeight, letterSpacing: ts.bodySpacing }}
          >
            Build Something<br />
            <span style={{ color: ts.badge }}>Extraordinary</span>
          </h1>
          <p className="text-lg max-w-md mx-auto mb-8" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
            Your brand voice in every pixel. Consistent, beautiful, and unmistakably yours.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              className={`px-6 py-3 text-sm font-bold ${radius}`}
              style={{ backgroundColor: ts.ctaBg, color: ts.ctaText, boxShadow: ts.cardShadow }}
            >
              Start Free Trial
            </button>
            <button
              className={`px-6 py-3 text-sm font-semibold border-2 ${radius}`}
              style={{ borderColor: ts.badge, color: ts.badge, backgroundColor: 'transparent' }}
            >
              View Demo
            </button>
          </div>
        </div>

        {/* Feature cards */}
        <div className="px-8 py-10 grid grid-cols-3 gap-4" style={{ backgroundColor: ts.cardBg }}>
          {['Fast & Reliable', 'Beautiful Design', 'Easy to Use'].map((f, i) => (
            <div
              key={i}
              className={`p-5 ${radius}`}
              style={{ backgroundColor: ts.navBg, boxShadow: ts.cardShadow, border: `1px solid ${ts.navBorder}` }}
            >
              <div
                className={`w-10 h-10 flex items-center justify-center mb-3 ${radius}`}
                style={{ backgroundColor: `${i === 0 ? primaryColor : secondaryColor}25` }}
              >
                <Check className="w-5 h-5" style={{ color: i === 0 ? primaryColor : secondaryColor }} />
              </div>
              <p className="font-semibold text-sm" style={{ color: cardTextColor, fontWeight: ts.headingWeight }}>{f}</p>
              <p className="text-xs mt-1" style={{ color: cardSubColor }}>Consistent design across every touchpoint.</p>
            </div>
          ))}
        </div>

        {/* CTA banner */}
        <div
          className="px-8 py-10 text-center"
          style={{ backgroundColor: ts.ctaBg === primaryColor ? primaryColor : ts.ctaBg }}
        >
          <h2 className="text-2xl font-bold mb-2" style={{ color: ts.ctaText, fontWeight: ts.headingWeight }}>Ready to get started?</h2>
          <p className="text-sm opacity-80 mb-5" style={{ color: ts.ctaText }}>Join thousands of teams building with your brand.</p>
          <button
            className={`px-6 py-3 text-sm font-bold ${radius}`}
            style={{ backgroundColor: isDark ? '#ffffff' : '#ffffff', color: primaryColor }}
          >
            Get Started Today
          </button>
        </div>

        {/* Typography scale */}
        <div className="px-8 py-8" style={{ backgroundColor: ts.navBg, borderTop: `1px solid ${ts.navBorder}` }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-5" style={{ color: isDark ? '#6b7280' : '#9ca3af' }}>
            Typography — {fontFamily}
          </p>
          <div className="space-y-2">
            <p style={{ fontSize: 32, fontWeight: ts.headingWeight, color: ts.heroText, letterSpacing: ts.bodySpacing }}>Display Heading</p>
            <p style={{ fontSize: 22, fontWeight: '700', color: ts.heroText }}>Section Heading</p>
            <p style={{ fontSize: 16, fontWeight: '600', color: isDark ? '#d1d5db' : '#374151' }}>Card Title</p>
            <p style={{ fontSize: 14, color: isDark ? '#9ca3af' : '#6b7280' }}>Body text — readable and clear for paragraphs and descriptions.</p>
            <p style={{ fontSize: 12, color: isDark ? '#6b7280' : '#9ca3af' }}>Caption — metadata, labels, secondary info.</p>
          </div>
          <div className="flex items-center gap-3 mt-5 flex-wrap">
            <span className="text-xs font-semibold" style={{ color: isDark ? '#6b7280' : '#9ca3af' }}>Color palette:</span>
            <div className="w-8 h-8 rounded-full border-2 border-white shadow" style={{ backgroundColor: primaryColor }} title="Primary" />
            <div className="w-8 h-8 rounded-full border-2 border-white shadow" style={{ backgroundColor: secondaryColor }} title="Secondary" />
            <div className="w-8 h-8 rounded-full border-2 border-white shadow" style={{ backgroundColor: ts.badge }} title="Accent" />
            <div className="w-8 h-8 rounded-full border-2 border-white shadow" style={{ backgroundColor: ts.heroText }} title="Text" />
          </div>
        </div>

      </div>
    </div>
  )
}

function buildBrandInstruction(brand: BrandStyle): string {
  const parts: string[] = []
  if (brand.primaryColor) parts.push(`primary color: ${brand.primaryColor}`)
  if (brand.secondaryColor) parts.push(`secondary/accent color: ${brand.secondaryColor}`)
  if (brand.fontFamily) parts.push(`font family: ${brand.fontFamily}`)
  if (brand.borderRadius) parts.push(`button and card shape: ${brand.borderRadius}`)
  if (brand.tone) parts.push(`visual tone: ${brand.tone}`)
  if (brand.extraNotes) parts.push(brand.extraNotes)
  return `Apply this brand style consistently across the section: ${parts.join(', ')}`
}

export default function BrandPage() {
  const { project, setBrand, snapshotAllSections, revertAllSections, updateSectionHtmlAcrossPages, htmlSnapshots } = useBuilderStore()
  const brand = project.brand

  const [applying, setApplying] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [hasApplied, setHasApplied] = useState(false)

  function update(key: keyof BrandStyle, value: string) {
    setBrand({ [key]: value })
  }

  const totalSections = project.pages.reduce((sum, p) => sum + p.sections.length, 0)
  const completedFields = Object.values(brand).filter((v) => v.trim() !== '').length
  const totalFields = Object.keys(brand).length

  const handleApplyBrand = useCallback(async () => {
    const instruction = buildBrandInstruction(brand)
    if (!instruction.trim() || totalSections === 0) {
      toast.error('No brand settings or sections to apply to')
      return
    }
    // Snapshot everything first for undo
    snapshotAllSections()
    setApplying(true)
    setHasApplied(false)
    const allTasks: Array<{ pageId: string; sectionId: string; html: string }> = []
    project.pages.forEach((p) => p.sections.forEach((sec) => allTasks.push({ pageId: p.id, sectionId: sec.id, html: sec.html })))
    setProgress({ done: 0, total: allTasks.length })
    toast.info(`Applying brand to ${allTasks.length} sections across ${project.pages.length} pages…`)

    let successCount = 0
    await Promise.all(
      allTasks.map(async ({ pageId, sectionId, html }) => {
        try {
          const res = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ styleEdit: true, currentHtml: html, styleInstruction: instruction, sectionType: 'custom' }),
          })
          if (!res.ok) return
          const data = await res.json()
          if (data.html?.trim()) {
            updateSectionHtmlAcrossPages(pageId, sectionId, data.html)
            successCount++
          }
        } catch { /* skip failed sections */ } finally {
          setProgress((p) => ({ ...p, done: p.done + 1 }))
        }
      })
    )
    setApplying(false)
    setHasApplied(true)
    toast.success(`Brand applied to ${successCount} sections!`)
  }, [brand, project, snapshotAllSections, updateSectionHtmlAcrossPages, totalSections])

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

          {/* Undo button */}
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

          {/* Apply brand button */}
          <Button
            onClick={handleApplyBrand}
            disabled={applying || totalSections === 0 || completedFields === 0}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm gap-1.5"
          >
            {applying ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Applying…</>
            ) : (
              <><Wand2 className="w-4 h-4" /> Apply Brand to All Pages</>
            )}
          </Button>
        </div>
      </header>

      {/* Main layout: editor left, preview right */}
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

            {/* Custom colors */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1.5">Primary Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={brand.primaryColor || '#4F46E5'}
                    onChange={(e) => update('primaryColor', e.target.value)}
                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={brand.primaryColor}
                    onChange={(e) => update('primaryColor', e.target.value)}
                    placeholder="#4F46E5 or indigo"
                    className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1.5">Secondary / Accent Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={brand.secondaryColor || '#818CF8'}
                    onChange={(e) => update('secondaryColor', e.target.value)}
                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={brand.secondaryColor}
                    onChange={(e) => update('secondaryColor', e.target.value)}
                    placeholder="#818CF8 or light-indigo"
                    className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300 font-mono"
                  />
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Typography section */}
          <CollapsibleSection icon={<Type className="w-4 h-4 text-indigo-500" />} title="Typography" color="#6366f1" badge={brand.fontFamily || undefined}>
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
            <div className="mt-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Custom font</label>
              <input
                type="text"
                value={brand.fontFamily}
                onChange={(e) => update('fontFamily', e.target.value)}
                placeholder="e.g. Cabin, Josefin Sans…"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
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

        {/* Right: Live preview */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="px-6 py-3 border-b border-gray-200 bg-white flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Live Preview — updates as you edit</span>
          </div>
          <div className="flex-1 overflow-hidden p-6">
            <BrandPreview brand={brand} />
          </div>
        </div>

      </div>
    </div>
  )
}
