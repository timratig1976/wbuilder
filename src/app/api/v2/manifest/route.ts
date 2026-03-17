import { NextRequest } from 'next/server'
import { generateManifest } from '@/lib/generation/sectionGenerator'
import { loadAll as loadPatterns } from '@/lib/patterns/patternLibrary'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      company_name, industry, adjectives, tone, primary_cta,
      personas, pain_points, style_paradigm, visual_tone, animation_budget,
      navbar_style, navbar_mobile, brand_colors, pages,
      selected_pattern_ids,
    } = body

    // Resolve selected pattern IDs to full pattern objects for prompt injection
    const allPatterns = loadPatterns()
    const selected_patterns = Array.isArray(selected_pattern_ids) && selected_pattern_ids.length > 0
      ? allPatterns.filter((p) => selected_pattern_ids.includes(p.id))
      : undefined

    if (!company_name || !industry || !style_paradigm) {
      return Response.json({ error: 'Missing required fields: company_name, industry, style_paradigm' }, { status: 400 })
    }

    const manifest = await generateManifest({
      company_name,
      industry,
      adjectives: adjectives ?? [],
      tone: tone ?? 'professional',
      primary_cta: primary_cta ?? 'Kontakt aufnehmen',
      personas: personas ?? [],
      pain_points: pain_points ?? [],
      style_paradigm,
      visual_tone: visual_tone ?? 'confident',
      animation_budget: animation_budget ?? 'moderate',
      navbar_style: navbar_style ?? 'sticky-blur',
      navbar_mobile: navbar_mobile ?? 'hamburger-dropdown',
      brand_colors,
      selected_patterns,
    })

    // Persist selected patterns directly on the manifest
    if (selected_patterns?.length) {
      manifest.selected_patterns = selected_patterns.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        type: p.type,
        preview_description: (p as { preview_description?: string }).preview_description,
        implementation: p.implementation,
      }))
    }

    // Override pages with user-defined structure from briefing wizard
    if (Array.isArray(pages) && pages.length > 0) {
      manifest.pages = pages.map((p: { title: string; slug: string; sections: string[] }, i: number) => ({
        id: `page-${i}`,
        slug: p.slug,
        title: p.title,
        sections: p.sections,
        meta_description: manifest.pages[i]?.meta_description ?? '',
      }))
    }

    return Response.json({ manifest })
  } catch (err) {
    console.error('[v2/manifest]', err)
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
