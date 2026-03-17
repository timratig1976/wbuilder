import { StyleParadigm, SectionTransition } from './manifest'

export interface StyleDictionary {
  id: string; paradigm: StyleParadigm
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
    }
    color: {
      base: string; dark_sections_allowed: boolean
      gradient_allowed: boolean; accent_count_max: number
      section_bg_sequence?: string[]
      bg_animation_mode?: 'none' | 'per-section' | 'page-level'
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
}
