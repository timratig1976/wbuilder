export type StyleParadigm =
  | 'minimal-clean' | 'tech-dark' | 'bold-expressive'
  | 'luxury-editorial' | 'bento-grid' | 'brutalist'

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

export interface SiteManifest {
  id: string; version: string
  site: {
    name: string; language: string; industry: string
    tone: string; adjectives: string[]; primary_cta_goal: string
  }
  design_tokens: DesignTokens
  style_paradigm: StyleParadigm
  style_dictionary_ref: string
  style_source: { type: string; url?: string; confidence?: number }
  navbar: {
    style: 'sticky-blur'|'static'|'transparent-hero'|'hidden-scroll'
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
  generated_at: string
  _decision_log: Record<string, string>
  selected_patterns?: Array<{
    id: string; name: string; description: string; type: string
    preview_description?: string
    implementation?: { css_snippet?: string; html_snippet?: string; placeholder?: string }
  }>
}

export interface ValidationError {
  type: string; message: string
  severity: 'error'|'warning'; auto_fixable: boolean
}

export interface ValidationResult {
  valid: boolean; score: number; errors: ValidationError[]
}
