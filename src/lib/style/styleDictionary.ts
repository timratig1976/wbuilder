import path from 'path'
import fs from 'fs'
import { StyleDictionary } from '../types/styleDictionary'
import { DesignSpec } from '../types/manifest'

const DICT_DIR = path.join(process.cwd(), 'src/data/style-dictionaries')

export function loadStyleDictionary(ref: string): StyleDictionary {
  const filePath = path.join(DICT_DIR, `${ref}.json`)
  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(raw) as StyleDictionary
  } catch {
    throw new Error(`Style dictionary not found: ${ref}`)
  }
}

// Derive a per-project DesignSpec from a style dictionary's html_patterns + rules.
// This becomes the canonical source of truth stored on the SiteManifest.
export function designSpecFromDict(dict: StyleDictionary): DesignSpec {
  const hp = dict.html_patterns
  const r = dict.rules

  // Infer border-radius from the card pattern
  const cardRadiusMatch = (hp.card ?? '').match(/rounded-([a-z0-9[\]/.]+)/)
  const cardRadius = cardRadiusMatch ? `rounded-${cardRadiusMatch[1]}` : 'rounded-sm'
  const btnRadiusMatch = (hp.cta_primary ?? '').match(/rounded-([a-z0-9[\]/.]+)/)
  const btnRadius = btnRadiusMatch ? `rounded-${btnRadiusMatch[1]}` : cardRadius

  // Infer rest shadow from card hover classes
  const shadowMatch = (hp.card_hover ?? '').match(/group-hover:(shadow-[^\s]+)/)
  const hoverShadow = shadowMatch ? shadowMatch[1] : 'shadow-md'

  return {
    card: {
      base_classes:       hp.card?.replace(/^<div class="/, '').replace(/".*$/, '') ?? 'bg-white border border-gray-100 p-6',
      hover_classes:      hp.card_hover ?? 'group-hover:-translate-y-1 group-hover:shadow-md',
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
      input:  'rounded-lg',
      badge:  'rounded-full',
    },
    shadow: {
      card_rest:  'shadow-none',
      card_hover: hoverShadow,
      dropdown:   'shadow-xl',
    },
    animation: {
      budget:               r.animation.budget,
      bg_mode:              r.color.bg_animation_mode ?? 'none',
      section_bg_sequence:  r.color.section_bg_sequence ?? ['background', 'surface'],
    },
  }
}

export function listStyleDictionaries(): string[] {
  try {
    return fs.readdirSync(DICT_DIR)
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.replace('.json', ''))
  } catch {
    return []
  }
}
