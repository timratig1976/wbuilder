import { StyleParadigm, VisualTone } from './manifest'

export interface PageDef {
  title: string
  slug: string
  sections: string[]
}

export interface BriefingData {
  company_name: string
  industry: string
  tagline: string
  usp: string
  adjectives: string[]
  tone: string
  primary_cta: string
  personas: string[]
  pain_points: string[]
  style_paradigm: StyleParadigm
  visual_tone: VisualTone
  animation_budget: 'none' | 'subtle' | 'moderate' | 'rich'
  navbar_style: 'sticky-blur' | 'static' | 'transparent-hero' | 'hidden-scroll'
  navbar_behaviour: 'sticky' | 'overlay-hero' | 'hide-on-scroll' | 'static'
  navbar_visual: 'blur' | 'solid' | 'transparent' | 'border'
  navbar_mobile: 'hamburger-dropdown' | 'hamburger-overlay' | 'hamburger-sidebar' | 'logo-cta-only'
  brand_colors?: Record<string, string>
  has_existing_brand: boolean
  primary_color: string
  accent_color: string
  pages: PageDef[]
  selected_pattern_ids: string[]
  logo_url?: string
}

export interface BriefingPreset {
  label: string
  data: BriefingData
  savedAt: number
}

export type PresetSlot = 'A' | 'B' | 'C'
