import { StyleParadigm, SectionTransition } from './manifest'

export interface PatternVariant {
  name: string
  description: string
  html: string
  tags: string[]        // e.g. ['card', 'testimonial', 'dark'] — for lazy section-type injection
  preview_note?: string // optional human note for the UI
}

export interface StyleDictionary {
  id: string
  paradigm: StyleParadigm | string  // string allows custom user-defined paradigms
  label?: string                    // human-readable name for custom paradigms
  description?: string              // short description shown in overview
  is_custom?: boolean               // true = user-created, editable
  active?: boolean                  // false = hidden from briefing wizard
  rules: {
    layout: {
      section_padding: string; max_width: string
      columns_max: number; overlaps_allowed: boolean
      negative_margin_allowed: boolean; full_bleed_allowed: boolean
      asymmetric_allowed?: boolean; section_transition: SectionTransition
    }
    typography: {
      heading_font: string; heading_weight: string
      heading_size_hero: string; heading_size_section: string
      tracking: string; gradient_text_allowed: boolean
      line_height_hero?: string       // e.g. 'leading-tight' or '1.1'
      line_height_section?: string    // e.g. 'leading-snug' or '1.2'
      responsive_scale?: boolean      // if true: shrink headings on mobile
    }
    color: {
      base: string; dark_sections_allowed: boolean
      gradient_allowed: boolean; accent_count_max: number
      section_bg_sequence?: string[]
      bg_animation_mode?: 'none' | 'per-section' | 'focus-sections'
      bg_animation_focus_sections?: string[]  // section types that get animation, e.g. ['hero', 'contact']
    }
    animation: {
      budget: 'none' | 'subtle' | 'moderate' | 'rich'
      keyframes_allowed: boolean; scroll_driven_allowed: boolean
      text_animations_allowed?: string[]
      hover_effects_allowed?: string[]
    }
    decoration: {
      mesh_gradient: boolean; glassmorphism: boolean
      border_glow: boolean; geometric_shapes: boolean
      noise_texture: boolean; color_overlays: boolean
      diagonal_cuts?: boolean; concave_sections?: boolean
    }
  }
  forbidden_patterns: string[]
  required_patterns: string[]
  html_patterns: Record<string, string>
  // Named variant library per slot — AI picks based on section context
  variants?: Record<string, PatternVariant[]>
}
