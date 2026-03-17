import { Section } from './store'
import { SiteManifest } from './types/manifest'
import { SectionTransition } from './types/manifest'
import { sanitizeSvgPoints } from './generation/autoFix'

// ── Section transition SVG dividers ──────────────────────────────────────────

/**
 * Detects which color token a section uses as its background by scanning
 * the outermost <section> element's style attribute.
 * Returns the CSS variable name without var() wrapper, e.g. '--color-dark'
 */
function detectSectionBgToken(html: string): string {
  // Look for background-color: var(--color-X) on the first <section> tag
  const m = html.match(/<section[^>]*style="[^"]*background-color:\s*var\((--color-[a-z-]+)\)/)
  if (m) return m[1]
  // Fallback: Tailwind bg-dark / bg-surface class on section
  if (/<section[^>]*class="[^"]*\bbg-dark\b/.test(html)) return '--color-dark'
  if (/<section[^>]*class="[^"]*\bbg-surface\b/.test(html)) return '--color-surface'
  if (/<section[^>]*class="[^"]*\bbg-primary\b/.test(html)) return '--color-primary'
  return '--color-background'
}

/**
 * Resolves a CSS variable token name to the actual hex value from the manifest.
 */
function resolveColorToken(token: string, manifest: SiteManifest): string {
  const c = manifest.design_tokens.colors
  const map: Record<string, string> = {
    '--color-primary':    c.primary,
    '--color-secondary':  c.secondary,
    '--color-accent':     c.accent,
    '--color-highlight':  c.highlight,
    '--color-background': c.background,
    '--color-surface':    c.surface,
    '--color-dark':       c.dark,
    '--color-text':       c.text,
    '--color-text-muted': c.text_muted,
  }
  return map[token] ?? c.background
}

/**
 * Generates an SVG transition divider that OVERLAPS into the next section.
 * The SVG wrapper uses a negative margin-bottom equal to its height so it
 * pulls the next section up — no whitespace is added.
 * Returns null when no transition should be rendered.
 * Also returns the overlap depth so the next section can add compensating padding-top.
 */
function buildTransitionSvg(
  type: SectionTransition,
  fromColor: string,
  toColor: string
): { html: string; overlapPx: number } | null {
  if (type === 'flat' || fromColor === toColor) return null

  type TransitionDef = { height: number; svg: string }
  const defs: Record<Exclude<SectionTransition, 'flat'>, TransitionDef> = {
    'wave-bottom': {
      height: 80,
      svg: `<svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style="display:block;width:100%;height:80px"><path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="${toColor}"/></svg>`,
    },
    'concave-bottom': {
      height: 80,
      svg: `<svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style="display:block;width:100%;height:80px"><path d="M0,0 Q720,80 1440,0 L1440,80 L0,80 Z" fill="${toColor}"/></svg>`,
    },
    'convex-bottom': {
      height: 80,
      svg: `<svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style="display:block;width:100%;height:80px"><path d="M0,80 Q720,0 1440,80 L1440,80 L0,80 Z" fill="${toColor}"/></svg>`,
    },
    'diagonal-bottom': {
      height: 60,
      svg: `<svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style="display:block;width:100%;height:60px"><polygon points="0,60 1440,0 1440,60" fill="${toColor}"/></svg>`,
    },
  }

  const def = defs[type as Exclude<SectionTransition, 'flat'>]
  if (!def) return null

  // negative margin-bottom = overlap into the next section — zero whitespace added
  const html = `<div aria-hidden="true" style="line-height:0;overflow:hidden;background-color:${fromColor};margin-bottom:-${def.height}px;position:relative;z-index:1;pointer-events:none">${def.svg}</div>`
  return { html, overlapPx: def.height }
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function buildGoogleFontUrl(manifest: SiteManifest): string {
  const t = manifest.design_tokens.typography
  const names = [
    t.font_heading.replace(/['",]/g, '').split(',')[0].trim(),
    t.font_body.replace(/['",]/g, '').split(',')[0].trim(),
  ].filter((n) => n && !['sans-serif','serif','monospace','system-ui'].includes(n))
  const unique = [...new Set(names)]
  if (!unique.length) return ''
  const families = unique.map((n) => `family=${encodeURIComponent(n)}:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900`).join('&')
  return `https://fonts.googleapis.com/css2?${families}&display=swap`
}

export function buildRootCss(manifest: SiteManifest): string {
  const { colors, typography } = manifest.design_tokens
  return `:root {
  --color-primary:    ${colors.primary};
  --color-secondary:  ${colors.secondary};
  --color-accent:     ${colors.accent};
  --color-highlight:  ${colors.highlight};
  --color-background: ${colors.background};
  --color-surface:    ${colors.surface};
  --color-dark:       ${colors.dark};
  --color-text:       ${colors.text};
  --color-text-muted: ${colors.text_muted};
  --font-heading:     ${typography.font_heading};
  --font-body:        ${typography.font_body};
  --heading-weight:   ${typography.heading_weight};
  --tracking-heading: ${typography.tracking_heading};
  --lh-heading:       ${typography.line_height_heading};
}`
}

export function buildBaseStyle(manifest: SiteManifest): string {
  return `${buildRootCss(manifest)}
  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; width: 100%; overflow-x: hidden; }
  body {
    font-family: var(--font-body);
    background-color: var(--color-background);
    color: var(--color-text);
  }
  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-heading);
    font-weight: var(--heading-weight);
    letter-spacing: var(--tracking-heading);
    line-height: var(--lh-heading);
  }

  /* ── Custom token utility classes ─────────────────────────────────────────
     These ensure bg-primary, text-accent etc work even when Tailwind CDN
     hasn't re-scanned dynamically injected HTML. Always wins via specificity.
  ────────────────────────────────────────────────────────────────────────── */
  .bg-primary    { background-color: var(--color-primary)    !important; }
  .bg-secondary  { background-color: var(--color-secondary)  !important; }
  .bg-accent     { background-color: var(--color-accent)     !important; }
  .bg-highlight  { background-color: var(--color-highlight)  !important; }
  .bg-dark       { background-color: var(--color-dark)       !important; }
  .bg-surface    { background-color: var(--color-surface)    !important; }
  .text-primary  { color: var(--color-primary)               !important; }
  .text-secondary{ color: var(--color-secondary)             !important; }
  .text-accent   { color: var(--color-accent)                !important; }
  .text-highlight{ color: var(--color-highlight)             !important; }
  .text-dark     { color: var(--color-dark)                  !important; }
  .text-muted    { color: var(--color-text-muted)            !important; }
  .border-primary   { border-color: var(--color-primary)     !important; }
  .border-accent    { border-color: var(--color-accent)      !important; }
  .border-highlight { border-color: var(--color-highlight)   !important; }
  .font-display  { font-family: var(--font-heading)          !important; }
  .font-body     { font-family: var(--font-body)             !important; }
  
  /* Gradient colors for gradient text - complete set for all token combinations */
  .from-primary { --tw-gradient-from: var(--color-primary) var(--tw-gradient-from-position); --tw-gradient-to: var(--color-primary) var(--tw-gradient-to-position); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to); }
  .from-secondary { --tw-gradient-from: var(--color-secondary) var(--tw-gradient-from-position); --tw-gradient-to: var(--color-secondary) var(--tw-gradient-to-position); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to); }
  .from-accent { --tw-gradient-from: var(--color-accent) var(--tw-gradient-from-position); --tw-gradient-to: var(--color-accent) var(--tw-gradient-to-position); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to); }
  .from-highlight { --tw-gradient-from: var(--color-highlight) var(--tw-gradient-from-position); --tw-gradient-to: var(--color-highlight) var(--tw-gradient-to-position); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to); }
  .from-dark { --tw-gradient-from: var(--color-dark) var(--tw-gradient-from-position); --tw-gradient-to: var(--color-dark) var(--tw-gradient-to-position); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to); }
  .from-surface { --tw-gradient-from: var(--color-surface) var(--tw-gradient-from-position); --tw-gradient-to: var(--color-surface) var(--tw-gradient-to-position); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to); }
  .from-background { --tw-gradient-from: var(--color-background) var(--tw-gradient-from-position); --tw-gradient-to: var(--color-background) var(--tw-gradient-to-position); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to); }
  .from-text { --tw-gradient-from: var(--color-text) var(--tw-gradient-from-position); --tw-gradient-to: var(--color-text) var(--tw-gradient-to-position); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to); }
  .from-muted { --tw-gradient-from: var(--color-text-muted) var(--tw-gradient-from-position); --tw-gradient-to: var(--color-text-muted) var(--tw-gradient-to-position); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to); }
  
  .to-primary { --tw-gradient-to: var(--color-primary) var(--tw-gradient-to-position); }
  .to-secondary { --tw-gradient-to: var(--color-secondary) var(--tw-gradient-to-position); }
  .to-accent { --tw-gradient-to: var(--color-accent) var(--tw-gradient-to-position); }
  .to-highlight { --tw-gradient-to: var(--color-highlight) var(--tw-gradient-to-position); }
  .to-dark { --tw-gradient-to: var(--color-dark) var(--tw-gradient-to-position); }
  .to-surface { --tw-gradient-to: var(--color-surface) var(--tw-gradient-to-position); }
  .to-background { --tw-gradient-to: var(--color-background) var(--tw-gradient-to-position); }
  .to-text { --tw-gradient-to: var(--color-text) var(--tw-gradient-to-position); }
  .to-muted { --tw-gradient-to: var(--color-text-muted) var(--tw-gradient-to-position); }
  /* Strip any stray per-section :root blocks injected by older generator runs */
  /* (harmless duplicate — browser last-write-wins but keeping DOM clean) */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }`
}

/**
 * Wraps every inline <script> block's content in an IIFE so that
 * `const`, `let`, and `var` declarations from different sections
 * never collide in the shared iframe document scope.
 *
 * Before: <script>const btn = document.getElementById('x')</script>
 * After:  <script>;(function(){const btn = document.getElementById('x')})()</script>
 */
export function scopeScripts(html: string): string {
  return html.replace(
    /<script(\b[^>]*)>([\s\S]*?)<\/script>/gi,
    (match, attrs: string, body: string) => {
      // Leave src= scripts alone — they are external and don't have inline bodies to scope
      if (/\bsrc\s*=/i.test(attrs)) return match
      const trimmed = body.trim()
      if (!trimmed) return match
      // Patch setInterval/setTimeout so their callbacks are wrapped in try/catch.
      // This prevents stale element references (word-cycle, animations) from spamming
      // the console after a section is surgically rewritten in the iframe.
      const patched = trimmed
        .replace(/\bsetInterval\s*\(/g, '__si(')
        .replace(/\bsetTimeout\s*\(/g, '__st(')
      return `<script${attrs}>;(function(){
var __si=function(fn,d){return setInterval(function(){try{fn()}catch(e){}},d)};
var __st=function(fn,d){return setTimeout(function(){try{fn()}catch(e){}},d)};
try{\n${patched}\n}catch(e){}})();<\/script>`
    }
  )
}

export function assemblePage(title: string, sections: Section[]): string {
  const body = sections.map((s) => scopeScripts(s.html)).join('\n\n')
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            primary:    'var(--color-primary)',
            secondary:  'var(--color-secondary)',
            accent:     'var(--color-accent)',
            highlight:  'var(--color-highlight)',
            background: 'var(--color-background)',
            surface:    'var(--color-surface)',
            dark:       'var(--color-dark)',
            'brand-text': 'var(--color-text)',
            muted:      'var(--color-text-muted)',
          },
          fontFamily: {
            display: 'var(--font-heading)',
            body:    'var(--font-body)',
          },
        },
      },
    }
  <\/script>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
  <style>
    body { font-family: 'Inter', sans-serif; }
  </style>
</head>
<body class="antialiased">
${body}
</body>
</html>`
}

export function assemblePreview(sections: Section[], manifest?: SiteManifest | null): string {
  // Resolve section_transition type from the manifest's style dictionary reference
  // We read the JSON directly to avoid an async import — style dictionaries are small
  let transitionType: SectionTransition = 'flat'
  if (manifest?.style_dictionary_ref) {
    try {
      // Dynamic require only runs server-side; in the iframe preview context we rely
      // on the manifest.design_spec or fall back to flat
      const dictRef = manifest.style_dictionary_ref
      // Map known paradigm refs to their transition type without a file read
      const transitionMap: Record<string, SectionTransition> = {
        'bold-expressive-v1':  'concave-bottom',
        'tech-dark-v1':        'flat',
        'minimal-clean-v1':    'flat',
        'luxury-editorial-v1': 'flat',
        'bento-grid-v1':       'flat',
        'brutalist-v1':        'flat',
      }
      transitionType = transitionMap[dictRef] ?? 'flat'
    } catch { /* non-fatal */ }
  }

  // Build body with transition SVGs injected between sections
  const sectionDivs = sections.map((s) => ({
    id: s.id,
    type: s.type ?? '',
    html: scopeScripts(sanitizeSvgPoints(s.html)),
    bgToken: detectSectionBgToken(s.html),
  }))

  const bodyParts: string[] = []
  // pendingPaddingTop: overlap depth to add to the NEXT section wrapper
  let pendingPaddingTop = 0
  for (let i = 0; i < sectionDivs.length; i++) {
    const s = sectionDivs[i]
    const isNavbar = s.type === 'navbar' || s.html.includes('<nav')
    const isFooter = s.type === 'footer' || i === sectionDivs.length - 1

    // Apply any pending padding-top from a previous transition overlap
    const ptStyle = pendingPaddingTop > 0
      ? ` style="padding-top:${pendingPaddingTop}px"`
      : ''
    pendingPaddingTop = 0

    bodyParts.push(`<div data-section-id="${s.id}"${ptStyle}>${s.html}</div>`)

    // Inject transition: skip after navbar, skip before/at footer, skip if same bg
    const canTransition = manifest
      && transitionType !== 'flat'
      && !isNavbar
      && !isFooter
      && i < sectionDivs.length - 1

    if (canTransition) {
      const fromColor = resolveColorToken(s.bgToken, manifest!)
      const toColor = resolveColorToken(sectionDivs[i + 1].bgToken, manifest!)
      const result = buildTransitionSvg(transitionType, fromColor, toColor)
      if (result) {
        bodyParts.push(result.html)
        pendingPaddingTop = result.overlapPx
      }
    }
  }
  const body = bodyParts.join('\n\n')

  const fontLink = manifest
    ? (() => { const url = buildGoogleFontUrl(manifest); return url ? `<link href="${url}" rel="stylesheet" />` : '' })()
    : `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />`

  const baseStyle = manifest
    ? buildBaseStyle(manifest)
    : `*, *::before, *::after { box-sizing: border-box; } html, body { margin: 0; padding: 0; width: 100%; overflow-x: hidden; } body { font-family: 'Inter', sans-serif; }`

  return `<!DOCTYPE html>
<html lang="${manifest?.site?.language ?? 'en'}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script>
    try {
      window.tailwind = window.tailwind || {};
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              primary:    'var(--color-primary)',
              secondary:  'var(--color-secondary)',
              accent:     'var(--color-accent)',
              highlight:  'var(--color-highlight)',
              background: 'var(--color-background)',
              surface:    'var(--color-surface)',
              dark:       'var(--color-dark)',
              'brand-text': 'var(--color-text)',
              muted:      'var(--color-text-muted)',
            },
            fontFamily: {
              display: 'var(--font-heading)',
              body:    'var(--font-body)',
            },
          },
        },
      };
    } catch(e) {}
  <\/script>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  ${fontLink}
  <style>
    ${baseStyle}
    [data-section-id] { position: relative; cursor: pointer; transition: outline 0.15s; }
    [data-section-id]:hover { outline: 3px solid #6366f1; outline-offset: -2px; }
    [data-section-id].selected { outline: 3px solid #6366f1; outline-offset: -2px; box-shadow: inset 0 0 0 3px #6366f1; }

    /* Skeleton loader for sections still generating */
    .pc-skeleton {
      background: #0f172a;
      min-height: 420px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 20px;
      padding: 48px 32px;
      overflow: hidden;
      position: relative;
    }
    .pc-skeleton::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(105deg, transparent 40%, rgba(99,102,241,0.08) 50%, transparent 60%);
      background-size: 200% 100%;
      animation: pc-shimmer 1.6s ease-in-out infinite;
    }
    @keyframes pc-shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    .pc-skeleton-bar {
      border-radius: 8px;
      background: linear-gradient(90deg, #1e293b 0%, #334155 50%, #1e293b 100%);
      background-size: 200% 100%;
      animation: pc-bar-shimmer 1.6s ease-in-out infinite;
    }
    @keyframes pc-bar-shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    .pc-skeleton-label {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 8px;
      color: #6366f1;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      opacity: 0.8;
    }
    .pc-spinner {
      width: 14px; height: 14px;
      border: 2px solid #6366f1;
      border-top-color: transparent;
      border-radius: 50%;
      animation: pc-spin 0.8s linear infinite;
      flex-shrink: 0;
    }
    @keyframes pc-spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body class="antialiased">
${body}
<script>
  (function() {
    function renderSkeletons() {
      document.querySelectorAll('[data-section-id]').forEach(function(el) {
        var html = el.innerHTML.trim();
        var isPlaceholder = html.startsWith('<!--') && html.endsWith('-->');
        if (isPlaceholder && !el.querySelector('.pc-skeleton')) {
          var label = (html.match(/generating ([a-z]+)/i) || [])[1] || 'section';
          el.innerHTML = '<div class="pc-skeleton">'
            + '<div class="pc-skeleton-bar" style="width:40%;height:12px;"></div>'
            + '<div class="pc-skeleton-bar" style="width:65%;height:48px;margin:4px 0;"></div>'
            + '<div class="pc-skeleton-bar" style="width:50%;height:12px;"></div>'
            + '<div style="display:flex;gap:12px;margin-top:8px;">'
            +   '<div class="pc-skeleton-bar" style="width:120px;height:40px;border-radius:20px;"></div>'
            +   '<div class="pc-skeleton-bar" style="width:100px;height:40px;border-radius:20px;"></div>'
            + '</div>'
            + '<div style="display:flex;gap:16px;margin-top:16px;">'
            +   '<div class="pc-skeleton-bar" style="width:180px;height:120px;border-radius:12px;"></div>'
            +   '<div class="pc-skeleton-bar" style="width:180px;height:120px;border-radius:12px;"></div>'
            +   '<div class="pc-skeleton-bar" style="width:180px;height:120px;border-radius:12px;"></div>'
            + '</div>'
            + '<div class="pc-skeleton-label"><div class="pc-spinner"></div>Generating ' + label + '…</div>'
            + '</div>';
        }
      });
    }
    renderSkeletons();
    var obs = new MutationObserver(renderSkeletons);
    obs.observe(document.body, { childList: true, subtree: true });
  })();
</script>
</body>
</html>`
}

// ── v2: Manifest-aware page assembly (export / full HTML for download) ────────
export function assemblePageWithManifest(
  sectionHtmlList: string[],
  manifest: SiteManifest
): string {
  const transitionMap: Record<string, SectionTransition> = {
    'bold-expressive-v1':  'concave-bottom',
    'tech-dark-v1':        'flat',
    'minimal-clean-v1':    'flat',
    'luxury-editorial-v1': 'flat',
    'bento-grid-v1':       'flat',
    'brutalist-v1':        'flat',
  }
  const transitionType: SectionTransition = transitionMap[manifest.style_dictionary_ref] ?? 'flat'

  const bodyParts: string[] = []
  let pendingPaddingTop = 0
  for (let i = 0; i < sectionHtmlList.length; i++) {
    const html = sectionHtmlList[i]
    const isNavbar = html.includes('<nav')
    const isLast = i === sectionHtmlList.length - 1

    const ptStyle = pendingPaddingTop > 0 ? ` style="padding-top:${pendingPaddingTop}px"` : ''
    pendingPaddingTop = 0
    bodyParts.push(ptStyle ? `<div${ptStyle}>${scopeScripts(html)}</div>` : scopeScripts(html))

    const canTransition = transitionType !== 'flat' && !isNavbar && !isLast
    if (canTransition) {
      const fromToken = detectSectionBgToken(html)
      const toToken = detectSectionBgToken(sectionHtmlList[i + 1])
      const result = buildTransitionSvg(
        transitionType,
        resolveColorToken(fromToken, manifest),
        resolveColorToken(toToken, manifest)
      )
      if (result) {
        bodyParts.push(result.html)
        pendingPaddingTop = result.overlapPx
      }
    }
  }
  const body = bodyParts.join('\n\n')
  const fontUrl = buildGoogleFontUrl(manifest)

  return `<!DOCTYPE html>
<html lang="${manifest.site.language ?? 'de'}" class="scroll-smooth">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${manifest.content.company_name}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  ${fontUrl ? `<link href="${fontUrl}" rel="stylesheet" />` : ''}
  <style>
    ${buildBaseStyle(manifest)}
  </style>
</head>
<body class="antialiased">
${body}
</body>
</html>`
}
