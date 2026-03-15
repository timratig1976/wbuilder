import { StyleParadigm } from './manifest'

export type PatternType =
  | 'section-transition' | 'hero-layout' | 'section-sequence'
  | 'grid-pattern' | 'whitespace-rhythm' | 'scroll-behavior'
  | 'background-treatment' | 'card-style' | 'image-treatment'
  | 'type-hierarchy' | 'display-font-usage'
  | 'hover-micro-interaction' | 'text-animation' | 'scroll-animation'

export interface DesignPattern {
  id: string; type: PatternType
  source_url: string; scraped_at: string; confidence: number
  name: string; description: string
  tags: string[]; industries: string[]; paradigms: StyleParadigm[]
  implementation: {
    css_snippet?: string; html_snippet?: string
    placeholder?: string
    style_dict_key: string; style_dict_val: unknown
  }
  preview_description: string
  visual_weight: 'light' | 'medium' | 'heavy'
  brand_dependency: 'none' | 'color-dependent' | 'font-dependent'
  discovery_meta?: {
    seen_count: number; seen_on: string[]
    css_hint: string | null; auto_discovered: boolean
  }
}
