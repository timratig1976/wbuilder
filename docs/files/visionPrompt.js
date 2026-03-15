/**
 * visionPrompt.js
 * 
 * Zwei-Modus Vision-Prompt:
 * 1. STRUCTURED — bekannte Patterns erkennen (bisherige Logik)
 * 2. DISCOVERY  — offene Beobachtung, findet Unbekanntes
 * 
 * Das Modell bekommt KEINE Kategorieliste im Discovery-Modus.
 * Es beschreibt was es sieht — wir formalisieren danach.
 */

/**
 * Gibt den vollständigen Vision-Prompt zurück.
 * cssData kommt von Puppeteer getComputedStyle().
 */
function buildVisionPrompt(url, cssData) {
  return `You are a senior design analyst reviewing a website screenshot.
Analyze BOTH the visual design AND the extracted CSS data below.
Respond ONLY with valid JSON matching this exact schema. No markdown, no explanation.

URL: ${url}
CSS extracted from browser: ${JSON.stringify(cssData)}

JSON schema:

{
  "confidence": 0.0-1.0,

  "colors": {
    "primary":    "#hex — dominant brand color",
    "secondary":  "#hex",
    "accent":     "#hex — CTA / interactive element color",
    "background": "#hex — main page background",
    "text":       "#hex — body text"
  },

  "typography": {
    "heading_font":   "exact font family name from CSS or best inference",
    "body_font":      "exact font family name",
    "heading_weight": "400|500|600|700|800|900",
    "size_scale":     "compact|normal|large|display",
    "tracking":       "tight|normal|wide"
  },

  "layout": {
    "whitespace":        "tight|balanced|generous|extreme",
    "full_bleed":        true|false,
    "overlaps":          true|false,
    "diagonal_cuts":     true|false,
    "concave_sections":  true|false,
    "asymmetric":        true|false
  },

  "decoration": {
    "gradients":        true|false,
    "color_overlays":   true|false,
    "geometric_shapes": true|false,
    "glassmorphism":    true|false,
    "mesh_gradient":    true|false,
    "noise_texture":    true|false,
    "border_glow":      true|false
  },

  "animation": {
    "budget":          "none|subtle|moderate|rich",
    "scroll_driven":   true|false,
    "text_animations": true|false,
    "hover_effects":   true|false
  },

  "paradigm_detected": "minimal-clean|tech-dark|bold-expressive|luxury-editorial|bento-grid|brutalist",
  "tags":             ["max 8 descriptive tags"],
  "section_sequence": ["detected section types in DOM order, max 10"],

  "surprises": [
    {
      "observation": "Describe in 1-2 sentences something UNUSUAL, CLEVER, or DESIGN-FORWARD that you rarely see. Be specific and visual. Not generic observations like 'uses dark theme'.",
      "category":    "layout|transition|animation|typography|decoration|interaction|color",
      "confidence":  0.0-1.0,
      "css_hint":    "If CSS data supports this observation, quote the relevant property. Otherwise null.",
      "reusability": "universal|paradigm-specific|brand-specific"
    }
  ]
}

CRITICAL for "surprises":
- Include 3-6 genuinely unusual observations
- Describe what you SEE visually, not just what CSS properties exist
- Focus on things that would make a designer say "oh, that's clever"
- reusability: "universal" = works in any design, "paradigm-specific" = fits a specific style, "brand-specific" = too tied to this brand
- Only include surprises where confidence >= 0.65
- If nothing is genuinely surprising, return fewer items — quality over quantity`
}

module.exports = { buildVisionPrompt }
