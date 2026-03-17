import { NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

export interface ImageResult {
  id: string
  url: string          // full size
  thumb: string        // thumbnail
  alt: string
  author: string
  authorUrl: string
  source: 'unsplash' | 'pexels' | 'dalle'
  width: number
  height: number
}

// ── Unsplash ──────────────────────────────────────────────────────────────────
async function searchUnsplash(query: string, page = 1): Promise<ImageResult[]> {
  const key = process.env.UNSPLASH_ACCESS_KEY
  if (!key) return []
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=20&page=${page}`
  const res = await fetch(url, { headers: { Authorization: `Client-ID ${key}` } })
  if (!res.ok) return []
  const data = await res.json()
  return (data.results ?? []).map((p: {
    id: string; urls: { regular: string; thumb: string }
    alt_description: string; user: { name: string; links: { html: string } }
    width: number; height: number
  }) => ({
    id: `unsplash-${p.id}`,
    url: p.urls.regular,
    thumb: p.urls.thumb,
    alt: p.alt_description ?? query,
    author: p.user.name,
    authorUrl: p.user.links.html,
    source: 'unsplash' as const,
    width: p.width,
    height: p.height,
  }))
}

// ── Pexels ────────────────────────────────────────────────────────────────────
async function searchPexels(query: string, page = 1): Promise<ImageResult[]> {
  const key = process.env.PEXELS_API_KEY
  if (!key) return []
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=20&page=${page}`
  const res = await fetch(url, { headers: { Authorization: key } })
  if (!res.ok) return []
  const data = await res.json()
  return (data.photos ?? []).map((p: {
    id: number; src: { large: string; small: string }
    alt: string; photographer: string; photographer_url: string
    width: number; height: number
  }) => ({
    id: `pexels-${p.id}`,
    url: p.src.large,
    thumb: p.src.small,
    alt: p.alt ?? query,
    author: p.photographer,
    authorUrl: p.photographer_url,
    source: 'pexels' as const,
    width: p.width,
    height: p.height,
  }))
}

// ── DALL-E 3 ──────────────────────────────────────────────────────────────────
async function generateDalle(prompt: string, size: '1024x1024' | '1792x1024' | '1024x1792' = '1792x1024'): Promise<ImageResult | null> {
  const key = process.env.OPENAI_API_KEY
  if (!key) return null
  const OpenAI = (await import('openai')).default
  const client = new OpenAI({ apiKey: key })
  const res = await client.images.generate({
    model: 'dall-e-3',
    prompt,
    n: 1,
    size,
    quality: 'standard',
    response_format: 'url',
  })
  const img = res.data?.[0]
  if (!img?.url) return null
  return {
    id: `dalle-${Date.now()}`,
    url: img.url,
    thumb: img.url,
    alt: prompt,
    author: 'DALL-E 3',
    authorUrl: 'https://openai.com',
    source: 'dalle' as const,
    width: size === '1792x1024' ? 1792 : size === '1024x1792' ? 1024 : 1024,
    height: size === '1792x1024' ? 1024 : size === '1024x1792' ? 1792 : 1024,
  }
}

// ── Route ─────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const body = await req.json() as {
    action: 'search' | 'generate'
    query?: string
    source?: 'unsplash' | 'pexels' | 'both'
    page?: number
    prompt?: string
    size?: '1024x1024' | '1792x1024' | '1024x1792'
  }

  if (body.action === 'search') {
    const query = body.query?.trim()
    if (!query) return Response.json({ error: 'Missing query' }, { status: 400 })
    const src = body.source ?? 'both'
    const [unsplash, pexels] = await Promise.all([
      src !== 'pexels' ? searchUnsplash(query, body.page ?? 1) : Promise.resolve([]),
      src !== 'unsplash' ? searchPexels(query, body.page ?? 1) : Promise.resolve([]),
    ])
    // Interleave results
    const results: ImageResult[] = []
    const max = Math.max(unsplash.length, pexels.length)
    for (let i = 0; i < max; i++) {
      if (unsplash[i]) results.push(unsplash[i])
      if (pexels[i]) results.push(pexels[i])
    }
    return Response.json({ results, sources: { unsplash: unsplash.length, pexels: pexels.length } })
  }

  if (body.action === 'generate') {
    const prompt = body.prompt?.trim()
    if (!prompt) return Response.json({ error: 'Missing prompt' }, { status: 400 })
    const image = await generateDalle(prompt, body.size ?? '1792x1024')
    if (!image) return Response.json({ error: 'DALL-E generation failed or OPENAI_API_KEY missing' }, { status: 500 })
    return Response.json({ image })
  }

  return Response.json({ error: 'Invalid action' }, { status: 400 })
}
