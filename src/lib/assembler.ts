import { Section } from './store'

/**
 * Wraps every inline <script> block's content in an IIFE so that
 * `const`, `let`, and `var` declarations from different sections
 * never collide in the shared iframe document scope.
 *
 * Before: <script>const btn = document.getElementById('x')</script>
 * After:  <script>;(function(){const btn = document.getElementById('x')})()</script>
 */
function scopeScripts(html: string): string {
  return html.replace(
    /<script(\b[^>]*)>([\s\S]*?)<\/script>/gi,
    (match, attrs: string, body: string) => {
      // Leave src= scripts alone — they are external and don't have inline bodies to scope
      if (/\bsrc\s*=/i.test(attrs)) return match
      const trimmed = body.trim()
      if (!trimmed) return match
      return `<script${attrs}>;(function(){\n${trimmed}\n})();<\/script>`
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
  <script src="https://cdn.tailwindcss.com"></script>
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

export function assemblePreview(sections: Section[]): string {
  const body = sections.map((s) => `<div data-section-id="${s.id}">${scopeScripts(s.html)}</div>`).join('\n\n')
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
  <style>
    body { font-family: 'Inter', sans-serif; }
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
