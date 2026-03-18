import { NextRequest } from 'next/server'
import { SiteManifest } from '@/lib/types/manifest'
import { loadStyleDictionary } from '@/lib/style/styleDictionary'
import {
  buildPass1System, buildPass1User,
  buildPass2System, buildPass2User,
} from '@/lib/generation/prompts'
import { findBestSection } from '@/lib/sections/sectionLibrary'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { manifest, sectionType, pageIndex } = await req.json() as {
      manifest: SiteManifest
      sectionType: string
      pageIndex?: number
    }

    if (!manifest || !sectionType) {
      return Response.json({ error: 'Missing manifest or sectionType' }, { status: 400 })
    }

    const dict = loadStyleDictionary(manifest.style_dictionary_ref)
    const referenceHtml = findBestSection(sectionType, manifest.style_paradigm, manifest.site.industry, manifest.visual_tone, manifest.navbar?.behaviour)

    const pass1System = buildPass1System(dict, manifest, sectionType)
    const pass1User = buildPass1User(sectionType, manifest, referenceHtml, undefined, pageIndex)
    const pass2System = buildPass2System(dict)
    const pass2User = '(pass2 user prompt is generated from pass1 HTML output — run generation to see it)'

    return Response.json({
      sectionType,
      paradigm: dict.paradigm,
      isChrome: sectionType === 'navbar' || sectionType === 'footer',
      pass1: { system: pass1System, user: pass1User },
      pass2: { system: pass2System, user: pass2User },
      referenceHtml: referenceHtml ?? null,
    })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
