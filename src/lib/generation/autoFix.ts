import { ValidationResult, ValidationError } from '../types/manifest'

export function safeParseJson<T>(raw: string): T | null {
  const cleaned = raw
    .replace(/^```json\n?/, '')
    .replace(/^```\n?/, '')
    .replace(/\n?```$/, '')
    .trim()
  try {
    return JSON.parse(cleaned) as T
  } catch {
    return null
  }
}

export function autoFix(html: string, errors: ValidationError[]): string {
  let fixed = html

  for (const err of errors) {
    if (!err.auto_fixable) continue

    switch (err.type) {
      case 'missing-alt':
        fixed = fixed.replace(/<img([^>]*?)(?!\salt=)>/g, '<img$1 alt="">')
        break

      case 'missing-aria-label':
        fixed = fixed.replace(
          /(<button[^>]*?)(\s*>)(?=\s*<svg)/g,
          '$1 aria-label="Button"$2'
        )
        break

      case 'unguarded-keyframes':
        fixed = fixed.replace(
          /(@keyframes[\s\S]*?\})\s*\}/g,
          '@media (prefers-reduced-motion: no-preference) {\n$1\n}'
        )
        break
    }
  }

  return fixed
}

export function applyAutoFixes(html: string, result: ValidationResult): string {
  if (result.valid) return html
  const fixable = result.errors.filter((e) => e.auto_fixable)
  if (fixable.length === 0) return html
  return autoFix(html, fixable)
}
