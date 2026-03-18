export type StyleParadigm =
  | 'minimal-clean' | 'tech-dark' | 'bold-expressive'
  | 'luxury-editorial' | 'bento-grid' | 'brutalist'

export type VisualTone =
  | 'whisper'      // subtle, quiet, lots of whitespace, minimal decoration
  | 'editorial'    // structured, serif-forward, formal, low animation
  | 'confident'    // clear, moderate animation, balanced decoration
  | 'expressive'   // bold headings, rich animation, heavy decoration
  | 'electric'     // maximum energy, full animation, vibrant, loud

export type AnimationBudget = 'none' | 'subtle' | 'moderate' | 'rich'

export type SectionTransition =
  | 'flat' | 'concave-bottom' | 'convex-bottom'
  | 'wave-bottom' | 'diagonal-bottom'

export interface DesignTokens {
  colors: {
    primary: string; secondary: string; accent: string
    highlight: string; background: string; surface: string
    dark: string; text: string; text_muted: string
    _source: string
  }
  typography: {
    font_heading: string; font_body: string
    heading_weight: string; tracking_heading: string
    line_height_heading: string; _source: string
  }
  type_scale: {
    hero_h1: string; section_h2: string; card_h3: string
    body: string; eyebrow: string; cta_button: string
  }
  spacing: {
    section_padding_light: string; section_padding_heavy: string
    container_max: string; container_padding: string
  }
}

export interface DesignSpec {
  card: {
    base_classes: string          // bg, border, padding, radius
    hover_classes: string         // group-hover:* classes
    transition_classes: string    // transition-all duration-* ease-*
    wrapper_classes: string       // outer group div classes
  }
  cta: {
    primary: string               // full opening tag HTML
    secondary: string
    ghost: string
  }
  border_radius: {
    card: string                  // e.g. rounded-xl
    button: string                // e.g. rounded-sm
    input: string                 // e.g. rounded-lg
    badge: string                 // e.g. rounded-full
  }
  shadow: {
    card_rest: string             // e.g. shadow-sm
    card_hover: string            // e.g. shadow-xl shadow-accent/20
    dropdown: string              // e.g. shadow-xl
  }
  animation: {
    budget: 'none' | 'subtle' | 'moderate' | 'rich'
    bg_mode: 'none' | 'per-section' | 'focus-sections'
    section_bg_sequence: string[]
  }
}

export interface SiteManifest {
  id: string; version: string
  site: {
    name: string; language: string; industry: string
    tone: string; adjectives: string[]; primary_cta_goal: string
  }
  design_tokens: DesignTokens
  style_paradigm: StyleParadigm
  visual_tone: VisualTone
  style_dictionary_ref: string
  style_source: { type: string; url?: string; confidence?: number }
  navbar: {
    style: 'sticky-blur'|'static'|'transparent-hero'|'hidden-scroll'
    behaviour: 'sticky'|'overlay-hero'|'hide-on-scroll'|'static'
    visual: 'blur'|'solid'|'transparent'|'border'
    scroll_threshold_px: number; height: string
    layout_desktop: string; mobile_menu: string
    cta_button: boolean; cta_label: string; links: string[]
  }
  section_stacking_rules: Record<string, object>
  pass1_prompt_rules: { rules: string[] }
  pass3_auto_flags: string[]
  pages: Array<{
    id: string; slug: string; title: string
    sections: string[]; meta_description: string
  }>
  content: {
    company_name: string; company_usp: string
    primary_cta: string; secondary_cta: string
    personas: string[]; pain_points: string[]; trust_signals: string[]
  }
  design_spec?: DesignSpec
  logo_url?: string
  generated_at: string
  _decision_log: Record<string, string>
  selected_patterns?: Array<{
    id: string; name: string; description: string; type: string
    preview_description?: string
    applicable_sections?: string[]
    implementation?: { css_snippet?: string; html_snippet?: string; placeholder?: string; navbar_behaviour?: string; navbar_layout?: string; navbar_structure?: string; navbar_mobile?: string }
  }>
  section_patterns?: Record<string, Array<{
    id: string; name: string; description: string; type: string
    preview_description?: string
    implementation?: { css_snippet?: string; html_snippet?: string; placeholder?: string; navbar_behaviour?: string; navbar_layout?: string; navbar_structure?: string; navbar_mobile?: string }
  }>>
}

export interface ValidationError {
  type: string; message: string
  severity: 'error'|'warning'; auto_fixable: boolean
}

export interface ValidationResult {
  valid: boolean; score: number; errors: ValidationError[]
}
