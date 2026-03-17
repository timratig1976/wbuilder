import { NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 120

export interface ExtractedSection {
  id: string
  sectionType: string
  html: string
  tags: string[]
  description: string
  paradigm_hint: string
  source_url: string
  confidence: number
}

type RawBlock = { tagName: string; className: string; html: string; textContent: string; height: number; width: number; title?: string }

// ── Tailwind UI component page extractor ─────────────────────────────────────
// Detects pages with iframe[srcdoc] component previews (tailwindcss.com/plus/*)
// and extracts the component body HTML from each srcdoc.
function htmlDecode(s: string): string {
  return s
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/').replace(/&#x60;/g, '`')
}

function extractTailwindUIBlocks(pageHtml: string): RawBlock[] {
  const blocks: RawBlock[] = []

  // The iframe structure is: id="frame-{hash}" title="{name} preview" ... srcdoc="..."
  // Match on id+title (light mode only, skip -dark), then extract srcdoc value
  const idTitleRe = /id="(frame-[a-f0-9]+)"\s+title="([^"]+)"/g
  let m: RegExpExecArray | null

  while ((m = idTitleRe.exec(pageHtml)) !== null) {
    const frameId = m[1]
    const frameTitle = m[2].replace(/ preview$/, '').trim()
    if (frameId.endsWith('-dark')) continue  // skip dark variants

    // Find srcdoc= starting within 2000 chars after this position
    const searchChunk = pageHtml.slice(m.index, m.index + 2000)
    const srcdocMatch = searchChunk.match(/srcdoc="((?:[^"\\]|\\.)*)"|srcdoc='((?:[^'\\]|\\.)*)'/)
    if (!srcdocMatch) continue

    const srcdocRaw = srcdocMatch[1] ?? srcdocMatch[2]
    const srcdoc = htmlDecode(srcdocRaw)

    // Extract <body> content
    const bodyMatch = srcdoc.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
    if (!bodyMatch) continue

    let bodyHtml = bodyMatch[1].trim()
    bodyHtml = bodyHtml.replace(/<script[\s\S]*?<\/script>/gi, '')
    bodyHtml = bodyHtml.replace(/<style[\s\S]*?<\/style>/gi, '')
    if (bodyHtml.length < 200) continue

    const textContent = bodyHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300)

    blocks.push({
      tagName: 'section',
      className: '',
      html: bodyHtml.slice(0, 40000),
      textContent,
      height: 600,
      width: 1280,
      title: frameTitle,
    })
  }

  return blocks
}

// ── Generic section extractor (runs in Puppeteer page context) ────────────────
const SECTION_EXTRACT_JS = `(function () {
  const SECTION_SELECTORS = [
    'section',
    'main > div[class]',
    'main > article',
    '[class*="section"]',
    '[class*="hero"]',
    '[class*="feature"]',
    '[class*="testimonial"]',
    '[class*="pricing"]',
    '[class*="stats"]',
    '[class*="faq"]',
    '[class*="cta"]',
    '[class*="footer"]',
    'header',
    'footer',
    'nav',
  ]
  const seen = new Set()
  const blocks = []
  for (const sel of SECTION_SELECTORS) {
    try {
      document.querySelectorAll(sel).forEach((el) => {
        if (seen.has(el)) return
        const rect = el.getBoundingClientRect()
        if (rect.height < 80 || rect.width < 200) return
        const depth = (function getDepth(e, d) {
          return e.parentElement ? getDepth(e.parentElement, d + 1) : d
        })(el, 0)
        if (depth > 15) return
        seen.add(el)
        const clone = el.cloneNode(true)
        clone.querySelectorAll('script,noscript,style').forEach(s => s.remove())
        clone.querySelectorAll('*').forEach(child => {
          for (const attr of Array.from(child.attributes)) {
            if (attr.name.startsWith('on')) child.removeAttribute(attr.name)
          }
        })
        const html = clone.outerHTML
        if (html.length < 200 || html.length > 120000) return
        blocks.push({
          tagName: el.tagName.toLowerCase(),
          className: el.className?.toString?.() ?? '',
          html: html.slice(0, 40000),
          textContent: el.textContent?.slice(0, 300) ?? '',
          height: Math.round(rect.height),
          width: Math.round(rect.width),
        })
      })
    } catch { /* skip bad selectors */ }
  }
  return blocks.slice(0, 20)
})()`

function buildClassifyPrompt(blocks: RawBlock[], url: string): string {
  const blockSummaries = blocks.map((b, i) =>
    `[${i}] ${b.title ? `title="${b.title}" ` : ''}tag=${b.tagName} h=${b.height}px\ntext: ${b.textContent.slice(0, 150)}\nhtml_length: ${b.html.length}`
  ).join('\n\n')

  return `You are an expert UI analyst. Classify each HTML section block extracted from: ${url}

BLOCKS:
${blockSummaries}

For each block determine:
- sectionType: one of [navbar, hero, features, stats, testimonials, pricing, faq, cta, footer, about, team, process, logos, gallery, blog, contact, other]
- tags: array like ["dark","centered","split","animated","glassmorphism","grid","minimal","bold","editorial","bento"]
- description: 1 sentence describing the visual design
- paradigm_hint: one of [bold-expressive, minimal-clean, tech-dark, luxury-editorial, bento-grid, brutalist]
- confidence: 0.0-1.0
- include: true if worth saving as a reusable snippet

Respond ONLY with JSON array:
[{"index":0,"sectionType":"features","tags":["bento","grid","light"],"description":"...","paradigm_hint":"bento-grid","confidence":0.95,"include":true}]`
}

export async function POST(req: NextRequest) {
  const { url } = await req.json() as { url: string }
  if (!url?.startsWith('http')) {
    return Response.json({ error: 'Invalid URL' }, { status: 400 })
  }

  let puppeteer: typeof import('puppeteer') | null = null
  try {
    puppeteer = await import('puppeteer')
  } catch {
    return Response.json({ error: 'puppeteer not installed. Run: npm install puppeteer' }, { status: 500 })
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  })

  let rawBlocks: RawBlock[] = []
  let strategy = 'generic'

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1440, height: 900 })
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 })
    await new Promise((r) => setTimeout(r, 2000))

    // Get full page HTML for server-side parsing
    const pageHtml = await page.content()

    // Detect Tailwind UI component pages: they have iframe[srcdoc] with id="frame-*"
    if (/id="frame-[a-f0-9]+"/.test(pageHtml)) {
      strategy = 'tailwind-ui'
      rawBlocks = extractTailwindUIBlocks(pageHtml)
    } else {
      rawBlocks = await page.evaluate(SECTION_EXTRACT_JS) as RawBlock[]
    }
  } finally {
    await browser.close()
  }

  if (!rawBlocks.length) {
    return Response.json({ sections: [], strategy, total_raw: 0 })
  }

  // Classify with GPT-4o
  const OpenAI = (await import('openai')).default
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  let classifications: Array<{
    index: number; sectionType: string; tags: string[]
    description: string; paradigm_hint: string; confidence: number; include: boolean
  }> = []

  try {
    const resp = await client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 2000,
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: buildClassifyPrompt(rawBlocks, url) }],
    })
    const raw = resp.choices[0]?.message?.content ?? '{}'
    const parsed = JSON.parse(raw)
    classifications = Array.isArray(parsed) ? parsed : (parsed.sections ?? parsed.blocks ?? parsed.results ?? [])
  } catch {
    // Auto-include all if classification fails — use title as description
    classifications = rawBlocks.map((b, i) => ({
      index: i, sectionType: 'other', tags: ['bento'], description: b.title ?? 'Extracted section',
      paradigm_hint: 'bento-grid', confidence: 0.7, include: true,
    }))
  }

  const { nanoid } = await import('nanoid')

  const sections: ExtractedSection[] = []
  for (const cls of classifications) {
    if (!cls.include) continue
    const block = rawBlocks[cls.index]
    if (!block) continue
    sections.push({
      id: nanoid(),
      sectionType: cls.sectionType,
      html: block.html,
      tags: cls.tags ?? [],
      description: cls.description ?? block.title ?? '',
      paradigm_hint: cls.paradigm_hint ?? 'minimal-clean',
      source_url: url,
      confidence: cls.confidence ?? 0.5,
    })
  }

  return Response.json({ sections, strategy, total_raw: rawBlocks.length })
}
