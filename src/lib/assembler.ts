import { Section } from './store'
import { SiteManifest } from './types/manifest'

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
  const body = sections.map((s) => `<div data-section-id="${s.id}">${scopeScripts(s.html)}</div>`).join('\n\n')

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
  const body = sectionHtmlList.map((html) => scopeScripts(html)).join('\n\n')
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
