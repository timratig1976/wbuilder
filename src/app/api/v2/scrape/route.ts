import { NextRequest } from 'next/server'
import { scrapeSite } from '@/lib/scraping/siteScraperService'

export const runtime = 'nodejs'
export const maxDuration = 120

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json() as { url: string }
    if (!url) {
      return Response.json({ error: 'Missing url' }, { status: 400 })
    }

    const fingerprint = await scrapeSite(url)
    return Response.json({ fingerprint })
  } catch (err) {
    console.error('[v2/scrape]', err)
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
