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
    'https://flowbite.com/blocks/marketing/hero/',
    'https://merakiui.com/components/marketing/hero',
  ],
  features: [
    'https://flowbite.com/blocks/marketing/feature/',
    'https://merakiui.com/components/marketing/feature-sections',
  ],
  pricing: [
    'https://flowbite.com/blocks/marketing/pricing/',
    'https://merakiui.com/components/marketing/pricing',
  ],
  testimonials: [
    'https://flowbite.com/blocks/marketing/testimonial/',
    'https://merakiui.com/components/marketing/testimonials',
  ],
  stats: [
    'https://flowbite.com/blocks/marketing/social-proof/',
  ],
  cta: [
    'https://flowbite.com/blocks/marketing/cta/',
    'https://merakiui.com/components/marketing/cta',
  ],
  faq: [
    'https://flowbite.com/blocks/marketing/faq/',
  ],
  footer: [
    'https://flowbite.com/blocks/marketing/footer/',
    'https://merakiui.com/components/marketing/footer-sections',
  ],
  navbar: [
    'https://flowbite.com/blocks/marketing/navbar/',
    'https://merakiui.com/components/application-ui/navbars',
  ],
  bento: [
    'https://tailwindcomponents.com/search?q=bento',
    'https://flowbite.com/blocks/marketing/feature/',
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
