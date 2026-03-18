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

// ─── Navbar placeholder resolution (no AI call) ──────────────────────────────
// Resolves chrome-element placeholders that Pass 2 never sees (chrome skips P2).

const SCROLL_CLASS_JS = `<script>(function(){
  var nav=document.querySelector('nav[data-scroll-nav]');
  if(!nav)return;
  var scrolled=false;
  function onScroll(){
    var s=window.scrollY>40;
    if(s===scrolled)return;
    scrolled=s;
    if(s){
      nav.style.position='fixed';
      nav.style.background='color-mix(in srgb,var(--color-background) 80%,transparent)';
      nav.style.backdropFilter='blur(12px)';
      nav.style.webkitBackdropFilter='blur(12px)';
      nav.style.borderBottom='1px solid rgba(255,255,255,0.08)';
    }else{
      nav.style.position='absolute';
      nav.style.background='transparent';
      nav.style.backdropFilter='none';
      nav.style.webkitBackdropFilter='none';
      nav.style.borderBottom='none';
    }
  }
  window.addEventListener('scroll',onScroll,{passive:true});
  onScroll();
})();</script>`

const HIDDEN_SCROLL_JS = `<script>(function(){
  var nav=document.querySelector('nav[data-scroll-nav]');
  if(!nav)return;
  var last=window.scrollY,hidden=false;
  window.addEventListener('scroll',function(){
    var cur=window.scrollY;
    if(cur>last&&cur>80&&!hidden){hidden=true;nav.style.transform='translateY(-100%)';}
    else if(cur<last&&hidden){hidden=false;nav.style.transform='translateY(0)';}
    last=cur;
  },{passive:true});
  nav.style.transition='transform 0.3s ease';
})();</script>`

// ─── Enforce correct <nav> opener classes post-generation ────────────────────
// The AI frequently ignores the exact opener instruction. This deterministically
// rewrites the outermost <nav> tag with the correct position/bg classes.
export function enforceNavOpener(html: string, behaviour: string, visual: string, height: string): string {
  const behaviourClasses =
    behaviour === 'overlay-hero'    ? 'absolute top-0 left-0 right-0 z-50'
    : behaviour === 'hide-on-scroll' ? 'sticky top-0 z-50'
    : behaviour === 'static'         ? 'relative z-40'
    :                                  'sticky top-0 z-50'

  const visualStyle =
    visual === 'blur'
      ? 'background-color: color-mix(in srgb, var(--color-background) 85%, transparent); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px)'
    : visual === 'transparent'
      ? 'background: transparent'
    : visual === 'border'
      ? 'background-color: var(--color-background); border-bottom: 1px solid rgba(0,0,0,0.08)'
    : 'background-color: var(--color-background)'

  const scrollPlaceholder = behaviour === 'overlay-hero' ? '<!-- [SCROLL-CLASS: nav-scrolled] -->' : ''
  const hiddenScrollPlaceholder = behaviour === 'hide-on-scroll' ? '<!-- [HIDDEN-SCROLL] -->' : ''

  // Replace the entire opening <nav ...> tag (everything up to and including the first >)
  // Preserve any data-* attributes the AI may have added (e.g. data-scroll-nav)
  const newOpener = `<nav class="${behaviourClasses} ${height} w-full flex items-center justify-between px-5 md:px-8" style="${visualStyle}">${scrollPlaceholder}${hiddenScrollPlaceholder}`
  return html.replace(/<nav\b[^>]*>(\s*<!--\s*\[SCROLL-CLASS:[^\]]*\]\s*-->)?(\s*<!--\s*\[HIDDEN-SCROLL\]\s*-->)?/, newOpener)
}

export function resolveNavbarPlaceholders(html: string): string {
  if (!html.includes('<!-- [SCROLL-CLASS:') && !html.includes('<!-- [HIDDEN-SCROLL]')) return html
  let out = html

  // Inject data-scroll-nav attribute on the <nav> so JS can find it
  out = out.replace(/(<nav\b)([^>]*>)/, '$1 data-scroll-nav$2')

  // Resolve overlay-hero scroll behaviour
  if (out.includes('<!-- [SCROLL-CLASS: nav-scrolled]') || out.includes('<!-- [SCROLL-CLASS:nav-scrolled]')) {
    out = out.replace(/<!--\s*\[SCROLL-CLASS:\s*nav-scrolled\]\s*-->/g, '')
    out = out + '\n' + SCROLL_CLASS_JS
  }

  // Resolve hide-on-scroll behaviour
  if (out.includes('<!-- [HIDDEN-SCROLL]')) {
    out = out.replace(/<!--\s*\[HIDDEN-SCROLL\]\s*-->/g, '')
    out = out + '\n' + HIDDEN_SCROLL_JS
  }

  return out
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
