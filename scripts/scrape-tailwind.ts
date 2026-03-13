/**
 * Tailwind Block Scraper
 * Run: npx tsx scripts/scrape-tailwind.ts
 *
 * Scrapes Tailwind UI public preview blocks and saves them as JSON
 * in /data/blocks/{category}.json for use as AI context examples.
 */

import puppeteer, { Browser } from 'puppeteer'
import fs from 'fs'
import path from 'path'
import { nanoid } from 'nanoid'

interface TailwindExample {
  id: string
  category: string
  source: string
  html: string
  tags: string[]
}

const CATEGORIES: Record<string, string[]> = {
  hero: [
    'https://tailwindui.com/components/marketing/sections/heroes',
  ],
  features: [
    'https://tailwindui.com/components/marketing/sections/feature-sections',
  ],
  pricing: [
    'https://tailwindui.com/components/marketing/sections/pricing',
  ],
  testimonials: [
    'https://tailwindui.com/components/marketing/sections/testimonials',
  ],
  stats: [
    'https://tailwindui.com/components/marketing/sections/stats-sections',
  ],
  cta: [
    'https://tailwindui.com/components/marketing/sections/cta-sections',
  ],
  faq: [
    'https://tailwindui.com/components/marketing/sections/faq-sections',
  ],
  footer: [
    'https://tailwindui.com/components/marketing/sections/footers',
  ],
  navbar: [
    'https://tailwindui.com/components/marketing/elements/headers',
  ],
}

const OUT_DIR = path.join(process.cwd(), 'data', 'blocks')

async function scrapeCategory(
  browser: Browser,
  category: string,
  urls: string[]
): Promise<TailwindExample[]> {
  const examples: TailwindExample[] = []

  for (const url of urls) {
    const page = await browser.newPage()
    await page.setViewport({ width: 1440, height: 900 })

    try {
      console.log(`  Scraping ${url}...`)
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })

      // Try to extract preview iframes or code blocks
      const blocks = await page.evaluate(() => {
        const results: string[] = []

        // Look for code preview containers
        const previews = document.querySelectorAll('[data-component-preview], .preview-container, iframe')
        previews.forEach((el) => {
          if (el instanceof HTMLIFrameElement) {
            try {
              const doc = el.contentDocument
              if (doc) results.push(doc.body.innerHTML)
            } catch { /* cross-origin */ }
          } else {
            results.push((el as HTMLElement).innerHTML)
          }
        })

        // Fallback: grab large sections
        if (results.length === 0) {
          const sections = document.querySelectorAll('section, [class*="component"]')
          sections.forEach((s) => {
            if ((s as HTMLElement).offsetHeight > 200) {
              results.push((s as HTMLElement).outerHTML)
            }
          })
        }

        return results.slice(0, 3)
      })

      for (const html of blocks) {
        if (html.length > 100) {
          examples.push({
            id: nanoid(),
            category,
            source: url,
            html: html.trim(),
            tags: [category],
          })
        }
      }
    } catch (err) {
      console.warn(`  Failed to scrape ${url}:`, err instanceof Error ? err.message : err)
    } finally {
      await page.close()
    }
  }

  return examples
}

async function main() {
  console.log('🔍 Starting Tailwind block scraper...')

  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true })
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    for (const [category, urls] of Object.entries(CATEGORIES)) {
      console.log(`\n📦 Category: ${category}`)
      const examples = await scrapeCategory(browser, category, urls)

      const outPath = path.join(OUT_DIR, `${category}.json`)

      // Merge with existing if present
      let existing: TailwindExample[] = []
      if (fs.existsSync(outPath)) {
        existing = JSON.parse(fs.readFileSync(outPath, 'utf-8'))
      }

      const merged = [...existing, ...examples]
      fs.writeFileSync(outPath, JSON.stringify(merged, null, 2))
      console.log(`  ✅ Saved ${examples.length} examples to ${outPath}`)
    }
  } finally {
    await browser.close()
  }

  console.log('\n✅ Scraping complete!')
}

main().catch(console.error)
