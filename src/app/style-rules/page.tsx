'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useBuilderStore } from '@/lib/store'
import { StyleDictionary } from '@/lib/types/styleDictionary'
import { DesignSpec } from '@/lib/types/manifest'
import { ArrowLeft, Tag, Save, RotateCcw, Check, ChevronDown, ChevronUp, AlertCircle, Info } from 'lucide-react'
import { toast } from 'sonner'

// ── Section toggle wrapper ────────────────────────────────────────────────────
function RuleSection({
  title, subtitle, color, defaultOpen = false, children
}: {
  title: string; subtitle?: string; color: string; defaultOpen?: boolean; children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-gray-50 transition-colors text-left"
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            <span className="font-semibold text-gray-900 text-sm">{title}</span>
          </div>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5 ml-4">{subtitle}</p>}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="px-5 pb-5 pt-3 bg-gray-50 border-t border-gray-100">{children}</div>}
    </div>
  )
}

// ── Field row ─────────────────────────────────────────────────────────────────
function FieldRow({
  label, description, children
}: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 py-3 border-b border-gray-100 last:border-0">
      <div className="w-48 flex-shrink-0">
        <p className="text-xs font-semibold text-gray-700">{label}</p>
        {description && <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">{description}</p>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  )
}

// ── Toggle pill ───────────────────────────────────────────────────────────────
function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
        value ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
      }`}
    >
      {value && <Check className="w-3 h-3" />}
      {label ?? (value ? 'On' : 'Off')}
    </button>
  )
}

// ── Tag list editor ───────────────────────────────────────────────────────────
function TagList({
  values, onChange, addPlaceholder, colorClass = 'bg-gray-100 text-gray-700 border-gray-200'
}: { values: string[]; onChange: (v: string[]) => void; addPlaceholder?: string; colorClass?: string }) {
  const [input, setInput] = useState('')
  function add() {
    const v = input.trim()
    if (v && !values.includes(v)) onChange([...values, v])
    setInput('')
  }
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {values.map((v, i) => (
          <span
            key={i}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium ${colorClass}`}
          >
            {v}
            <button onClick={() => onChange(values.filter((_, j) => j !== i))} className="ml-0.5 hover:text-red-500 transition-colors">×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder={addPlaceholder ?? 'Add rule… (Enter)'}
          className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
        <button
          onClick={add}
          className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >Add</button>
      </div>
    </div>
  )
}

// ── BgSequence editor ─────────────────────────────────────────────────────────
const BG_TOKENS = ['background', 'surface', 'dark', 'primary', 'secondary']
function BgSequenceEditor({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-2 flex-wrap">
        {value.map((token, i) => (
          <div key={i} className="flex items-center gap-1">
            <span className="text-[10px] text-gray-400 font-mono mr-1">#{i + 1}</span>
            <select
              value={token}
              onChange={(e) => { const next = [...value]; next[i] = e.target.value; onChange(next) }}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              {BG_TOKENS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <button onClick={() => onChange(value.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-400 text-sm ml-0.5">×</button>
          </div>
        ))}
        <button
          onClick={() => onChange([...value, 'background'])}
          className="text-xs px-2 py-1 border border-dashed border-indigo-300 text-indigo-500 rounded-lg hover:bg-indigo-50"
        >+ Add step</button>
      </div>
      <p className="text-[10px] text-gray-400">Sections cycle through this sequence. Hero is always dark. Navbar/footer excluded.</p>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function StyleRulesPage() {
  const { manifest, setManifest } = useBuilderStore()
  const [dict, setDict] = useState<StyleDictionary | null>(null)
  const [original, setOriginal] = useState<StyleDictionary | null>(null)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (!manifest) { setLoading(false); return }
    fetch(`/api/style-dictionary?ref=${encodeURIComponent(manifest.style_dictionary_ref)}`)
      .then((r) => r.json())
      .then((data: StyleDictionary) => {
        setDict(data)
        setOriginal(JSON.parse(JSON.stringify(data)))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [manifest])

  function update(path: string[], value: unknown) {
    if (!dict) return
    const next = JSON.parse(JSON.stringify(dict)) as StyleDictionary
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let cursor: any = next
    for (let i = 0; i < path.length - 1; i++) cursor = cursor[path[i]]
    cursor[path[path.length - 1]] = value
    setDict(next)
    setDirty(true)
    setSaved(false)
  }

  async function handleSave() {
    if (!dict || !manifest) return
    const hp = dict.html_patterns

    // Build DesignSpec from current dict state — this is the per-project override layer
    const cardRadiusMatch = (hp.card ?? '').match(/rounded-([a-z0-9[\]/.]+)/)
    const cardRadius = cardRadiusMatch ? `rounded-${cardRadiusMatch[1]}` : 'rounded-sm'
    const btnRadiusMatch = (hp.cta_primary ?? '').match(/rounded-([a-z0-9[\]/.]+)/)
    const btnRadius = btnRadiusMatch ? `rounded-${btnRadiusMatch[1]}` : cardRadius
    const shadowMatch = (hp.card_hover ?? '').match(/group-hover:(shadow-[^\s]+)/)
    const hoverShadow = shadowMatch ? shadowMatch[1] : 'shadow-md'

    const designSpec: DesignSpec = {
      card: {
        base_classes:       hp.card?.replace(/^<div class="/, '').replace(/".*$/, '') ?? '',
        hover_classes:      hp.card_hover ?? '',
        transition_classes: hp.card_hover_classes ?? 'transition-all duration-200 ease-out',
        wrapper_classes:    hp.card_wrapper?.replace(/^<div class="/, '').replace(/".*$/, '') ?? 'group cursor-pointer',
      },
      cta: {
        primary:   hp.cta_primary   ?? '',
        secondary: hp.cta_secondary ?? '',
        ghost:     hp.cta_ghost     ?? '',
      },
      border_radius: {
        card:   cardRadius,
        button: btnRadius,
        input:  manifest.design_spec?.border_radius.input   ?? 'rounded-lg',
        badge:  manifest.design_spec?.border_radius.badge   ?? 'rounded-full',
      },
      shadow: {
        card_rest:  manifest.design_spec?.shadow.card_rest  ?? 'shadow-none',
        card_hover: hoverShadow,
        dropdown:   manifest.design_spec?.shadow.dropdown   ?? 'shadow-xl',
      },
      animation: {
        budget:               dict.rules.animation.budget,
        bg_mode:              dict.rules.color.bg_animation_mode  ?? 'none',
        section_bg_sequence:  dict.rules.color.section_bg_sequence ?? ['background', 'surface'],
      },
    }

    setManifest({ ...manifest, design_spec: designSpec })

    // Also persist the style dictionary file so defaults stay in sync
    try {
      await fetch('/api/style-dictionary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref: manifest.style_dictionary_ref, dict }),
      })
    } catch { /* file write may fail in some envs */ }

    setOriginal(JSON.parse(JSON.stringify(dict)))
    setDirty(false)
    setSaved(true)
    toast.success('Design spec saved to manifest — takes effect on next generation')
    setTimeout(() => setSaved(false), 3000)
  }

  function handleReset() {
    if (!original) return
    setDict(JSON.parse(JSON.stringify(original)))
    setDirty(false)
    toast('Reset to last saved state')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!manifest) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 gap-4">
        <AlertCircle className="w-10 h-10 text-amber-400" />
        <p className="text-gray-600 font-medium">No manifest loaded</p>
        <p className="text-sm text-gray-400">Generate a page via the Briefing flow first.</p>
        <Link href="/builder" className="text-sm text-indigo-600 hover:underline">← Back to Builder</Link>
      </div>
    )
  }

  if (!dict) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 gap-4">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-gray-600 font-medium">Style dictionary not found: <code className="bg-gray-100 px-1 rounded">{manifest.style_dictionary_ref}</code></p>
        <Link href="/builder" className="text-sm text-indigo-600 hover:underline">← Back to Builder</Link>
      </div>
    )
  }

  const { rules } = dict

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* Header */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/builder">
            <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Builder
            </button>
          </Link>
          <div className="w-px h-5 bg-gray-200" />
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-violet-500" />
            <span className="font-bold text-gray-900">Style Rules</span>
            <span className="text-xs text-gray-400 font-mono bg-gray-100 px-2 py-0.5 rounded-full">{manifest.style_dictionary_ref}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {dirty && (
            <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Unsaved changes
            </span>
          )}
          <button
            onClick={handleReset}
            disabled={!dirty}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
          <button
            onClick={handleSave}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              saved
                ? 'bg-green-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {saved ? <><Check className="w-3.5 h-3.5" /> Saved</> : <><Save className="w-3.5 h-3.5" /> Save & Apply</>}
          </button>
        </div>
      </header>

      {/* Info banner */}
      <div className="bg-indigo-50 border-b border-indigo-100 px-6 py-2 flex items-center gap-2 flex-shrink-0">
        <Info className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
        <p className="text-xs text-indigo-700">
          These rules are injected into the AI generation prompt. Changes take effect on the next section generation.
          Click <strong>Save & Apply</strong> to persist to the manifest.
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-4">

          {/* ── Background & Color ── */}
          <RuleSection title="Background & Color" color="#6366f1" subtitle="Controls how sections alternate backgrounds and where animations live" defaultOpen>

            <FieldRow label="Background sequence" description="Cycle order of bg tokens across sections">
              <BgSequenceEditor
                value={rules.color.section_bg_sequence ?? ['background', 'surface']}
                onChange={(v) => update(['rules', 'color', 'section_bg_sequence'], v)}
              />
            </FieldRow>

            <FieldRow label="BG animation mode" description="Where decorative SVG/mesh backgrounds are placed">
              <div className="flex gap-2 flex-wrap">
                {(['none', 'per-section', 'focus-sections'] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => update(['rules', 'color', 'bg_animation_mode'], opt)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      (rules.color.bg_animation_mode ?? 'none') === opt
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-200'
                    }`}
                  >
                    {opt === 'none' && 'None — flat colors only'}
                    {opt === 'per-section' && 'Per-section — every dark section'}
                    {opt === 'focus-sections' && 'Focus sections — pick which ones'}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                {rules.color.bg_animation_mode === 'focus-sections' && 'Animation only on selected section types. All others stay flat.'}
                {rules.color.bg_animation_mode === 'per-section' && 'Each dark section gets a subtle decoration. Keep opacity ≤ 0.08.'}
                {(!rules.color.bg_animation_mode || rules.color.bg_animation_mode === 'none') && 'No animated backgrounds anywhere.'}
              </p>

              {/* Focus sections picker — shown only when focus-sections mode is active */}
              {rules.color.bg_animation_mode === 'focus-sections' && (() => {
                const ALL_SECTION_TYPES = ['hero', 'features', 'stats', 'testimonials', 'pricing', 'faq', 'cta', 'contact', 'about', 'team', 'process', 'logos', 'gallery', 'blog', 'footer']
                const current: string[] = rules.color.bg_animation_focus_sections ?? ['hero']
                const toggle = (s: string) => {
                  const next = current.includes(s) ? current.filter(x => x !== s) : [...current, s]
                  update(['rules', 'color', 'bg_animation_focus_sections'], next)
                }
                return (
                  <div className="mt-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                    <p className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wide mb-2">Animated section types</p>
                    <div className="flex flex-wrap gap-1.5">
                      {ALL_SECTION_TYPES.map(s => (
                        <button
                          key={s}
                          onClick={() => toggle(s)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
                            current.includes(s)
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'bg-white border-gray-200 text-gray-500 hover:border-indigo-300'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    {current.length === 0 && (
                      <p className="text-[10px] text-amber-500 mt-2">⚠ No sections selected — same as &quot;None&quot;</p>
                    )}
                    {current.length > 0 && (
                      <p className="text-[10px] text-indigo-400 mt-2">
                        Animation applies to: <strong>{current.join(', ')}</strong>
                      </p>
                    )}
                  </div>
                )
              })()}
            </FieldRow>

            <FieldRow label="Color base" description="Light, dark, or mixed page">
              <select
                value={rules.color.base}
                onChange={(e) => update(['rules', 'color', 'base'], e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                {['light', 'dark', 'mixed'].map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </FieldRow>

            <FieldRow label="Dark sections" description="Allow dark-background sections">
              <Toggle value={rules.color.dark_sections_allowed} onChange={(v) => update(['rules', 'color', 'dark_sections_allowed'], v)} />
            </FieldRow>

            <FieldRow label="Gradients" description="Allow gradient backgrounds and fills">
              <Toggle value={rules.color.gradient_allowed} onChange={(v) => update(['rules', 'color', 'gradient_allowed'], v)} />
            </FieldRow>

            <FieldRow label="Max accent colors" description="How many accent tokens may be used">
              <div className="flex items-center gap-3">
                <input
                  type="range" min={1} max={4} value={rules.color.accent_count_max}
                  onChange={(e) => update(['rules', 'color', 'accent_count_max'], Number(e.target.value))}
                  className="w-28"
                />
                <span className="text-sm font-bold text-gray-700">{rules.color.accent_count_max}</span>
              </div>
            </FieldRow>
          </RuleSection>

          {/* ── Animation ── */}
          <RuleSection title="Animation" color="#f59e0b" subtitle="Controls animation richness and allowed effects">

            <FieldRow label="Budget" description="Overall animation richness level">
              <div className="flex gap-2 flex-wrap">
                {(['none', 'subtle', 'moderate', 'rich'] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => update(['rules', 'animation', 'budget'], opt)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      rules.animation.budget === opt
                        ? 'bg-amber-500 border-amber-500 text-white'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-amber-200'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </FieldRow>

            <FieldRow label="Keyframes" description="Allow @keyframes CSS animations">
              <Toggle value={rules.animation.keyframes_allowed} onChange={(v) => update(['rules', 'animation', 'keyframes_allowed'], v)} />
            </FieldRow>

            <FieldRow label="Scroll-driven" description="Allow scroll-triggered animations">
              <Toggle value={rules.animation.scroll_driven_allowed} onChange={(v) => update(['rules', 'animation', 'scroll_driven_allowed'], v)} />
            </FieldRow>

            <FieldRow label="Text animations" description="Allowed text animation types (word-cycle, fade-up…)">
              <TagList
                values={rules.animation.text_animations_allowed ?? []}
                onChange={(v) => update(['rules', 'animation', 'text_animations_allowed'], v)}
                addPlaceholder="e.g. word-cycle, fade-up, scramble…"
                colorClass="bg-amber-50 text-amber-700 border-amber-200"
              />
            </FieldRow>

            <FieldRow label="Hover effects" description="Allowed hover interaction effects">
              <TagList
                values={rules.animation.hover_effects_allowed ?? []}
                onChange={(v) => update(['rules', 'animation', 'hover_effects_allowed'], v)}
                addPlaceholder="e.g. scale, glow, reveal, tilt…"
                colorClass="bg-amber-50 text-amber-700 border-amber-200"
              />
            </FieldRow>
          </RuleSection>

          {/* ── Decoration ── */}
          <RuleSection title="Decoration" color="#8b5cf6" subtitle="Visual decorative elements allowed in this paradigm">
            <div className="grid grid-cols-2 gap-3">
              {([
                ['mesh_gradient', 'Mesh gradient'],
                ['glassmorphism', 'Glassmorphism'],
                ['border_glow', 'Border glow'],
                ['geometric_shapes', 'Geometric shapes'],
                ['noise_texture', 'Noise texture'],
                ['color_overlays', 'Color overlays'],
                ['diagonal_cuts', 'Diagonal cuts'],
                ['concave_sections', 'Concave sections'],
              ] as [string, string][]).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between px-3 py-2.5 bg-white rounded-lg border border-gray-200">
                  <span className="text-xs font-medium text-gray-700">{label}</span>
                  <Toggle
                    value={!!(rules.decoration as Record<string, unknown>)[key]}
                    onChange={(v) => update(['rules', 'decoration', key], v)}
                  />
                </div>
              ))}
            </div>
          </RuleSection>

          {/* ── Typography ── */}
          <RuleSection title="Typography" color="#10b981" subtitle="Heading sizes, weights and text rules">

            <FieldRow label="Hero H1 size" description="Tailwind classes for hero heading">
              <input
                value={rules.typography.heading_size_hero}
                onChange={(e) => update(['rules', 'typography', 'heading_size_hero'], e.target.value)}
                className="w-full text-xs font-mono border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </FieldRow>

            <FieldRow label="Section H2 size" description="Tailwind classes for section heading">
              <input
                value={rules.typography.heading_size_section}
                onChange={(e) => update(['rules', 'typography', 'heading_size_section'], e.target.value)}
                className="w-full text-xs font-mono border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </FieldRow>

            <FieldRow label="Hero line-height" description="e.g. leading-tight, leading-none, 1.05">
              <input
                value={rules.typography.line_height_hero ?? 'leading-tight'}
                onChange={(e) => update(['rules', 'typography', 'line_height_hero'], e.target.value)}
                placeholder="leading-tight"
                className="w-full text-xs font-mono border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </FieldRow>

            <FieldRow label="Section line-height" description="e.g. leading-snug, leading-tight, 1.2">
              <input
                value={rules.typography.line_height_section ?? 'leading-snug'}
                onChange={(e) => update(['rules', 'typography', 'line_height_section'], e.target.value)}
                placeholder="leading-snug"
                className="w-full text-xs font-mono border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </FieldRow>

            <FieldRow label="Responsive scale" description="Shrink headings on mobile (sm: prefix classes)">
              <Toggle value={rules.typography.responsive_scale ?? true} onChange={(v) => update(['rules', 'typography', 'responsive_scale'], v)} />
            </FieldRow>

            <FieldRow label="Tracking" description="Letter-spacing Tailwind class">
              <input
                value={rules.typography.tracking}
                onChange={(e) => update(['rules', 'typography', 'tracking'], e.target.value)}
                className="w-full text-xs font-mono border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </FieldRow>

            <FieldRow label="Gradient text" description="Allow bg-clip-text gradient headings">
              <Toggle value={rules.typography.gradient_text_allowed} onChange={(v) => update(['rules', 'typography', 'gradient_text_allowed'], v)} />
            </FieldRow>
          </RuleSection>

          {/* ── Layout ── */}
          <RuleSection title="Layout" color="#3b82f6" subtitle="Spacing, column limits and structural constraints">

            <FieldRow label="Section padding" description="Vertical padding Tailwind classes">
              <input
                value={rules.layout.section_padding}
                onChange={(e) => update(['rules', 'layout', 'section_padding'], e.target.value)}
                className="w-full text-xs font-mono border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </FieldRow>

            <FieldRow label="Max width" description="Container max-width Tailwind classes">
              <input
                value={rules.layout.max_width}
                onChange={(e) => update(['rules', 'layout', 'max_width'], e.target.value)}
                className="w-full text-xs font-mono border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </FieldRow>

            <FieldRow label="Max columns" description="Max grid columns allowed">
              <div className="flex items-center gap-3">
                <input
                  type="range" min={1} max={6} value={rules.layout.columns_max}
                  onChange={(e) => update(['rules', 'layout', 'columns_max'], Number(e.target.value))}
                  className="w-28"
                />
                <span className="text-sm font-bold text-gray-700">{rules.layout.columns_max}</span>
              </div>
            </FieldRow>

            <FieldRow label="Overlaps" description="Allow overlapping elements">
              <Toggle value={rules.layout.overlaps_allowed} onChange={(v) => update(['rules', 'layout', 'overlaps_allowed'], v)} />
            </FieldRow>

            <FieldRow label="Full bleed" description="Allow full-bleed section backgrounds">
              <Toggle value={rules.layout.full_bleed_allowed} onChange={(v) => update(['rules', 'layout', 'full_bleed_allowed'], v)} />
            </FieldRow>

            <FieldRow label="Negative margins" description="Allow negative margin tricks">
              <Toggle value={rules.layout.negative_margin_allowed} onChange={(v) => update(['rules', 'layout', 'negative_margin_allowed'], v)} />
            </FieldRow>
          </RuleSection>

          {/* ── CTA Button System ── */}
          <RuleSection title="CTA Button System" color="#f43f5e" subtitle="Exact HTML the AI uses for every button — enforced across all sections">
            {(['cta_primary', 'cta_secondary', 'cta_ghost'] as const).map((key) => {
              const labels: Record<string, { label: string; hint: string }> = {
                cta_primary:   { label: 'Primary CTA',   hint: 'Main action — solid fill, used once per section' },
                cta_secondary: { label: 'Secondary CTA', hint: 'Supporting action — outlined border style' },
                cta_ghost:     { label: 'Ghost CTA',     hint: 'Tertiary link — no background, no border' },
              }
              return (
                <FieldRow key={key} label={labels[key].label} description={labels[key].hint}>
                  <input
                    value={dict.html_patterns[key] ?? ''}
                    onChange={(e) => {
                      const next = { ...dict, html_patterns: { ...dict.html_patterns, [key]: e.target.value } }
                      setDict(next); setDirty(true)
                    }}
                    className="w-full text-xs font-mono border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-rose-200"
                    placeholder={`<a href="#" class="inline-flex items-center gap-2 px-7 py-4 …">`}
                  />
                </FieldRow>
              )
            })}
            <div className="mt-3 p-3 bg-rose-50 border border-rose-100 rounded-lg">
              <p className="text-[10px] text-rose-600 font-medium mb-1">Preview (live — uses CSS vars from your manifest)</p>
              <div className="flex flex-wrap gap-3 items-center">
                {(['cta_primary', 'cta_secondary', 'cta_ghost'] as const).map((key) => {
                  const html = dict.html_patterns[key] ?? ''
                  const previewHtml = html.replace('>', '>Button') + '</a>'
                  return (
                    <span key={key} dangerouslySetInnerHTML={{ __html: previewHtml }} />
                  )
                })}
              </div>
              <p className="text-[10px] text-rose-400 mt-2">Note: Colors require CSS vars — preview may show defaults</p>
            </div>
          </RuleSection>

          {/* ── Card Hover System ── */}
          <RuleSection title="Card Hover System" color="#0ea5e9" subtitle="Consistent hover behaviour for every interactive card — applied page-wide">
            {([
              ['card',              'Card base HTML',    'The inner card element with background, border, padding'],
              ['card_wrapper',     'Card wrapper HTML',  'Outer div that gets class="group" for CSS group-hover'],
              ['card_hover',       'Hover classes',      'group-hover:* classes added to the card element on hover'],
              ['card_hover_classes','Transition classes', 'duration/easing applied to the card at all times'],
            ] as [string, string, string][]).map(([key, label, hint]) => (
              <FieldRow key={key} label={label} description={hint}>
                <input
                  value={dict.html_patterns[key] ?? ''}
                  onChange={(e) => {
                    const next = { ...dict, html_patterns: { ...dict.html_patterns, [key]: e.target.value } }
                    setDict(next); setDirty(true)
                  }}
                  className="w-full text-xs font-mono border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  placeholder={key === 'card_hover' ? 'group-hover:-translate-y-1 group-hover:shadow-md' : key === 'card_hover_classes' ? 'transition-all duration-200 ease-out' : ''}
                />
              </FieldRow>
            ))}

            {/* Live visual preview */}
            <div className="mt-3 p-4 bg-sky-50 border border-sky-100 rounded-lg">
              <p className="text-[10px] text-sky-600 font-medium mb-3">Live pattern preview — hover the card</p>
              <style>{`
                .card-preview-wrapper:hover .card-preview-inner {
                  transform: translateY(-4px);
                  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
                }
                .card-preview-inner { transition: all 0.2s ease-out; }
              `}</style>
              <div className="card-preview-wrapper inline-block cursor-pointer">
                <div className="card-preview-inner bg-white border border-gray-200 rounded-lg p-5 w-48">
                  <div className="w-8 h-8 rounded-md mb-3" style={{ backgroundColor: 'var(--color-accent, #6366f1)' }} />
                  <p className="text-sm font-semibold text-gray-800 mb-1">Card Title</p>
                  <p className="text-xs text-gray-400">Supporting text here</p>
                </div>
              </div>
              <div className="mt-3 space-y-1.5">
                <p className="text-[10px] text-sky-700 font-semibold">How it works in generated HTML:</p>
                <pre className="text-[10px] text-gray-500 bg-white border border-gray-100 rounded p-2 overflow-x-auto leading-relaxed">{`<div class="group cursor-pointer">   ← card_wrapper
  <div class="[card] [card_hover_classes] [card_hover]">
    <!-- content -->
  </div>
</div>`}</pre>
              </div>
            </div>
          </RuleSection>

          {/* ── Forbidden patterns ── */}
          <RuleSection title="Forbidden Patterns" color="#ef4444" subtitle="Rules the AI must never violate">
            <TagList
              values={dict.forbidden_patterns}
              onChange={(v) => { const next = { ...dict, forbidden_patterns: v }; setDict(next); setDirty(true) }}
              addPlaceholder="e.g. bg-white, @keyframes, min-h-screen…"
              colorClass="bg-red-50 text-red-700 border-red-200"
            />
          </RuleSection>

          {/* ── Required patterns ── */}
          <RuleSection title="Required Patterns" color="#22c55e" subtitle="Rules the AI must always follow">
            <TagList
              values={dict.required_patterns}
              onChange={(v) => { const next = { ...dict, required_patterns: v }; setDict(next); setDirty(true) }}
              addPlaceholder="e.g. always dark hero, mobile-first grids…"
              colorClass="bg-green-50 text-green-700 border-green-200"
            />
          </RuleSection>

        </div>
      </div>
    </div>
  )
}
