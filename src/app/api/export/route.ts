import { NextRequest } from 'next/server'
import { assemblePage } from '@/lib/assembler'
import { Section } from '@/lib/store'

export async function POST(req: NextRequest) {
  const { title, sections } = await req.json() as { title: string; sections: Section[] }
  const html = assemblePage(title, sections)
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="${title.replace(/\s+/g, '-').toLowerCase()}.html"`,
    },
  })
}
