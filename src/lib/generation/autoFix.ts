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
  let fixed = html
  const fixable = result.errors.filter((e) => e.auto_fixable)
  if (fixable.length > 0) fixed = autoFix(fixed, fixable)
  return sanitizeImagePaths(fixed)
}

// Replace any local/relative image src paths with picsum placeholders so
// generated sections never produce 404s in the builder preview.
let _imgCounter = 0
export function sanitizeImagePaths(html: string): string {
  return sanitizeSvgPoints(
    html.replace(
      /(<img\b[^>]*?\bsrc\s*=\s*["'])(?!https?:\/\/)([^"']+)(["'])/gi,
      (_match, prefix, _src, suffix) => {
        _imgCounter++
        return `${prefix}https://picsum.photos/800/600?random=${_imgCounter}${suffix}`
      }
    )
  )
}

// SVG <polygon> and <polyline> points must be unitless numbers.
// The AI sometimes generates percentage values like "98%,8% 99%,2%".
// Strip the % signs so the browser doesn't throw a parse error.
export function sanitizeSvgPoints(html: string): string {
  return html.replace(
    /(<(?:polygon|polyline)\b[^>]*?\bpoints\s*=\s*["'])([^"']+)(["'])/gi,
    (_match, prefix, points, suffix) => {
      // Remove all % characters from the points value
      const fixed = points.replace(/%/g, '')
      return `${prefix}${fixed}${suffix}`
    }
  )
}
