# wbuilder v2 — Technisches System-Briefing
**viminds GmbH · Rostock**  
**Version:** 2.7 · Stand: März 2026 · Kapitel 21 — Discovery System vollständig implementiert und getestet  
**Verwendung:** Windsurf / Cursor — vollständiges Entwicklungs-Briefing

---

## Inhaltsverzeichnis

1. [Projektziel & Vision](#1-projektziel--vision)
2. [Aktueller Stand & Probleme (wbuilder v1)](#2-aktueller-stand--probleme-wbuilder-v1)
3. [Gesamt-Architektur v2](#3-gesamt-architektur-v2)
4. [Output-Format — Statische HTML-Sites](#4-output-format--statische-html-sites)
5. [Site Manifest — Single Source of Truth](#5-site-manifest--single-source-of-truth)
6. [Style-Palette-System](#6-style-palette-system)
7. [Style Dictionary — pro Paradigma](#7-style-dictionary--pro-paradigma)
8. [3-Pass Generierungs-Pipeline](#8-3-pass-generierungs-pipeline)
9. [Section-Template-Library](#9-section-template-library)
10. [Animation-Komponenten-Bibliothek](#10-animation-komponenten-bibliothek)
11. [Briefing-Interface (Frontend)](#11-briefing-interface-frontend)
12. [Modellstrategie — OpenAI + Anthropic](#12-modellstrategie--openai--anthropic)
13. [Screenshot → Style-Fingerprint Pipeline](#13-screenshot--style-fingerprint-pipeline)
14. [Varianten-System](#14-varianten-system)
15. [Dateistruktur des Projekts](#15-dateistruktur-des-projekts)
16. [Bekannte Fehlerquellen & Lösungen](#16-bekannte-fehlerquellen--lösungen)
17. [Implementierungs-Reihenfolge](#17-implementierungs-reihenfolge)
18. [Icons, Bilder & Asset Pipeline](#18-icons-bilder--asset-pipeline)
19. [Site Scraping & Manifest Enrichment](#19-site-scraping--manifest-enrichment)
20. [Design Pattern Library — Von Scraping zu wiederverwendbaren Bausteinen](#20-design-pattern-library--von-scraping-zu-wiederverwendbaren-bausteinen)

**Neu in v2.5:** Kapitel 17 production-ready: vollständige LLM-Prompts, alle Funktionen implementiert  
**Neu in v2.6:** Kapitel 20 — Design Pattern Library: atomare Pattern-Extraktion, Pattern Picker UI, Trend-Scraping

---

## 1. Projektziel & Vision

**Was wbuilder v2 leisten soll:**

Ein internes Tool von viminds, das aus einem strukturierten Briefing vollständige, deploybare Multi-Page-Websites als statische HTML-Dateien generiert. Qualitätsniveau: produktionsreife Agenturarbeit, keine Baukastenseiten.

**Kernziele:**

- Briefing → fertige HTML-Site auf Server deploybar
- Konsistenz über alle Unterseiten garantiert
- Varianten (andere Farbpalette, anderes Layout-Paradigma) aus einer bestehenden Site erzeugen
- Tailwind CSS als Basis — aber nicht bibliotheksgebunden, volle Design-Freiheit
- Animationen, SVG-Backgrounds, fancy Headlines, Overlaps, Glassmorphism — alles möglich
- Section-Library als kuratierte Qualitäts-Referenz (RAG-Prinzip)
- Style-Palette aus Screenshots / Konkurrenz-URLs aufbaubar

**Was es nicht ist:**

- Kein Page-Builder mit drag-and-drop UI für Endkunden
- Kein Ersatz für Designer-Entscheidungen beim ersten Briefing
- Kein WordPress-Ersatz mit CMS-Backend

---

## 2. Aktueller Stand & Probleme (wbuilder v1)

**GitHub:** `timratig1976/wbuilder`  
**Stack:** Next.js · Zustand · OpenAI API (GPT-4.1) · Tailwind CDN

### Diagnostizierte Kernprobleme

| Problem | Ursache | Lösung in v2 |
|---|---|---|
| Sections inkonsistent | Kein geteilter Kontrakt zwischen Sections | Site Manifest als Single Source of Truth |
| Kein Briefing-Layer | Nur freier pagePrompt-Text | Strukturiertes BriefingSchema + Style Dictionary |
| 2-Pass enhance unzuverlässig | JSON-Parse-Fehler, silent fallback auf rawHtml | 3-Pass-Trennung, Pass 3 als reiner Validator |
| Brand-Farben werden entfernt | `cleanHtml()` löscht arbitrary Tailwind-values | CSS Custom Properties statt arbitrary values |
| **Generierung extrem langsam** | Alle Passes sequenziell, kein Caching, zu lange Prompts | Parallelisierung, kürzere focused Prompts, Streaming |
| **Fehlerhafte Outputs** | KI erfindet frei, kein mechanischer Validator | Style Dictionary als Constraints + mechanischer Check |

### Was in v1 gut funktioniert (beibehalten)

- Streaming-Architektur mit SSE
- IIFE-Script-Scoping in Sections
- Snapshot/Revert-Mechanismus
- SECTION_HINTS Konzept

---

## 3. Gesamt-Architektur v2

```
BRIEFING-INPUT
     │
     ▼
┌─────────────────────────────────────┐
│  SITE MANIFEST GENERATOR            │
│  (Claude Sonnet — einmalig)         │
│  → BriefingSchema                   │
│  → PagePlan                         │
│  → CSS Design Tokens                │
│  → Style Dictionary (JSON)          │
│  → Komponentenindex                 │
└──────────────┬──────────────────────┘
               │ manifest.json
               ▼
┌─────────────────────────────────────┐
│  PAGE PLAN                          │
│  page_1: index.html                 │
│  page_2: leistungen.html            │
│  page_N: kontakt.html               │
└──────────────┬──────────────────────┘
               │ pro Seite parallel
               ▼
┌─────────────────────────────────────┐
│  3-PASS SECTION GENERATOR           │
│                                     │
│  Pass 1 (GPT-4.1):                  │
│    Struktur + Inhalt + Tokens       │
│    → HTML-Gerüst mit Placeholders   │
│                                     │
│  Pass 2 (GPT-4.1 oder Opus):        │
│    Visual Layer                     │
│    → Animationen + Backgrounds      │
│    → Overlaps + z-index             │
│    → Fancy Headlines + SVG          │
│                                     │
│  Pass 3 (o4-mini):                  │
│    Validator                        │
│    → JSON-Fehlerliste               │
│    → Auto-Fix oder Flag             │
└──────────────┬──────────────────────┘
               │ fertige Sections
               ▼
┌─────────────────────────────────────┐
│  PAGE ASSEMBLER                     │
│  base.html + sections → page.html   │
│  CSS Build (Tailwind CLI)           │
│  JS Bundle                          │
└──────────────┬──────────────────────┘
               │
               ▼
         EXPORT-PAKET
         (ZIP: HTML + CSS + JS + Assets)
```

---

## 4. Output-Format — Statische HTML-Sites

### Dateistruktur des generierten Exports

```
/export/
  package.json                 ← Tailwind als devDependency
  tailwind.config.js           ← Config mit CSS Custom Properties
  postcss.config.js
  /src/
    /css/
      main.css                 ← @tailwind directives + Custom Properties
    /templates/
      base.html                ← Navbar, Footer, Head-Tags (shared)
    /pages/
      index.html               ← nur page-spezifischer Content
      leistungen.html
      kontakt.html
    /sections/                 ← einzelne Section-Dateien (für Editing)
      hero-01.html
      features-01.html
  /dist/                       ← nach `npm run build` generiert
    /css/
      main.output.css          ← gebautes Tailwind CSS
    /js/
      bundle.js                ← vanilla JS, kein Framework
    index.html                 ← vollständige deploybare Seite
    leistungen.html
    kontakt.html
    /assets/
      /images/
      /fonts/
```

### base.html Struktur

```html
<!DOCTYPE html>
<html lang="de" class="scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{page_title}} | {{site_name}}</title>
  <link rel="stylesheet" href="/css/main.output.css">
  <!-- CSS Custom Properties (Design Tokens) -->
  <style>
    :root {
      --color-primary: {{primary}};
      --color-secondary: {{secondary}};
      --color-accent: {{accent}};
      --color-background: {{background}};
      --color-text: {{text}};
      --font-heading: {{font_heading}};
      --font-body: {{font_body}};
      --spacing-section: {{spacing_section}};
      --border-radius-card: {{border_radius_card}};
    }
  </style>
</head>
<body class="bg-[var(--color-background)] text-[var(--color-text)]">
  {{navbar}}
  <main>
    {{page_content}}
  </main>
  {{footer}}
  <script src="/js/bundle.js"></script>
</body>
</html>
```

### Warum CSS Custom Properties statt Tailwind arbitrary values

Tailwind arbitrary values (`bg-[#6366f1]`) werden von `cleanHtml()` entfernt und sind nicht übers Build hinaus konsistent. CSS Custom Properties (`bg-[var(--color-primary)]`) funktionieren nach dem Build und erlauben echte Varianten durch simples Austauschen der `:root` Definitionen.

---

## 5. Site Manifest — Single Source of Truth

Das Site Manifest wird **einmalig beim Briefing** generiert. Es ist der vollständige Kontrakt für alle nachfolgenden Generierungen — kein Section-Prompt darf ohne diesen Kontext ausgeführt werden.

### Wie das Manifest entsteht — Entscheidungsbaum

Das Manifest ist kein freier KI-Output. Jeder Wert hat eine explizite Herkunft:

```
SCHRITT 1 — Briefing-Inputs (Nutzer)
  branche + ton → Mapping-Tabelle → top-2 Paradigma-Vorschläge
  Nutzer bestätigt oder korrigiert → style_paradigm gesetzt

SCHRITT 2 — Farben (eine von drei Quellen, Priorität absteigend)
  A) Screenshot/URL → GPT-4o Vision → Hex-Werte extrahiert
  B) Bestehende Brand → Nutzer gibt Hex ein
  C) Branche-Default → kuratierte Farbtabelle pro Branche

SCHRITT 3 — Style Dictionary
  Aus gewähltem Paradigma geladen (statische JSON-Datei)
  Alle forbidden_patterns + required_patterns fix definiert

SCHRITT 4 — Navbar + Layout-Komponenten
  Explizit im Briefing-Wizard Step 3 abgefragt:
  - Navbar-Stil (sticky / static / transparent→solid / hidden)
  - Mobile-Verhalten (hamburger-dropdown / hamburger-overlay / logo-only)
  - Navbar-Inhalt (logo-links + nav-mitte + cta-rechts, etc.)

SCHRITT 5 — Manifest generieren (Claude Sonnet)
  BriefingSchema + alle obigen Entscheidungen → manifest.json
  Kein Wert darf "einfach so" entstehen — jeder hat eine source-Angabe
```

### Branche × Ton → Paradigma Mapping-Tabelle

```typescript
const PARADIGM_MAPPING: Record<string, Record<string, StyleParadigm[]>> = {
  'recruiting-b2b':    { 'professional': ['minimal-clean', 'tech-professional'], 'modern': ['tech-dark', 'bold-expressive'] },
  'saas-tech':         { 'modern': ['tech-dark', 'bento-grid'],                  'professional': ['minimal-clean', 'tech-dark'] },
  'construction':      { 'professional': ['minimal-clean', 'luxury-editorial'],  'bold': ['bold-expressive'] },
  'e-commerce':        { 'creative': ['bold-expressive', 'playful'],             'modern': ['bento-grid', 'tech-dark'] },
  'consulting-law':    { 'professional': ['luxury-editorial', 'minimal-clean'],  'modern': ['minimal-clean'] },
  'real-estate':       { 'luxury': ['luxury-editorial'],                         'modern': ['minimal-clean', 'tech-dark'] },
  'healthcare':        { 'trustworthy': ['minimal-clean'],                       'modern': ['tech-professional'] },
  'creative-agency':   { 'creative': ['bold-expressive', 'brutalist'],           'modern': ['tech-dark'] },
}
// → System schlägt top-2 vor, Nutzer wählt
// → Bei "Aktueller Trend 2025": Style-Palette nach tags:["2025"] filtern, top-3 zeigen
```

### manifest.json — vollständiges Schema v2

```json
{
  "site": {
    "name": "Beispiel GmbH",
    "domain": "beispiel.de",
    "language": "de",
    "industry": "construction",
    "tone": "professional-trustworthy",
    "adjectives": ["vertrauenswürdig", "modern", "persönlich", "ambitioniert"],
    "primary_cta_goal": "erstgespraech-buchen"
  },

  "design_tokens": {
    "colors": {
      "primary":    "#1B2B4B",
      "secondary":  "#2D6A9F",
      "accent":     "#E85D30",
      "highlight":  "#F5C842",
      "background": "#F5F0E8",
      "surface":    "#FFFFFF",
      "dark":       "#0D1B2A",
      "text":       "#1A1A1A",
      "text_muted": "#6B7280",
      "_source": "option-c-user-selected"
    },
    "typography": {
      "font_heading":      "'DM Serif Display', serif",
      "font_body":         "'Inter', sans-serif",
      "heading_weight":    "700",
      "tracking_heading":  "-0.025em",
      "line_height_heading": "1.05",
      "_source": "bold-expressive-dictionary"
    },
    "type_scale": {
      "hero_h1":     "text-4xl md:text-5xl lg:text-[5rem]",
      "section_h2":  "text-3xl md:text-[3rem]",
      "card_h3":     "text-sm md:text-base",
      "body":        "text-sm md:text-base",
      "eyebrow":     "text-[.68rem] font-semibold tracking-[.14em] uppercase",
      "cta_button":  "text-xs md:text-sm font-semibold tracking-wide",
      "_note": "Immer mobile-first. Nie feste px-Werte für Text."
    },
    "spacing": {
      "section_padding_light": "py-16 md:py-24",
      "section_padding_heavy": "py-14 md:py-24 lg:py-28",
      "container_max":         "max-w-7xl mx-auto",
      "container_padding":     "px-5 md:px-8",
      "gap_grid":              "gap-px",
      "gap_content":           "gap-8 md:gap-12"
    },
    "effects": {
      "border_radius_card":   "rounded-sm",
      "border_radius_button": "rounded-sm",
      "border_radius_pill":   "rounded-full",
      "shadow_card":          "0 4px 24px rgba(0,0,0,0.06)",
      "transition_default":   "transition-all duration-200",
      "transition_colors":    "transition-colors duration-200",
      "transition_transform": "transition-transform duration-200"
    }
  },

  "style_paradigm": "bold-expressive",
  "style_dictionary_ref": "bold-expressive-v1",
  "style_source": {
    "type": "user-selected-option",
    "option": "C — Bold Split",
    "reference_url": "https://vitalents.de/",
    "differentiation_note": "Kein Navy/Blau — Differenzierung von vitalents.de"
  },

  "navbar": {
    "style":              "sticky-blur",
    "scroll_behavior":    "transparent-to-solid",
    "scroll_threshold_px": 40,
    "height":             "h-16",
    "layout_desktop":     "logo-left · nav-center · cta-right",
    "layout_mobile":      "logo-left · hamburger-right",
    "mobile_menu":        "hamburger-dropdown-top",
    "mobile_menu_animation": "max-height-transition",
    "background_scrolled": "bg-surface/95 backdrop-blur-md border-b border-primary/10",
    "background_initial":  "bg-transparent border-b border-transparent",
    "cta_button":          true,
    "cta_label":           "Erstgespräch →",
    "links": ["Leistungen → #leistungen", "Ablauf → #prozess", "Kontakt → #kontakt"],
    "hamburger_animation": "3-lines-to-x",
    "aria_label":          "Hauptnavigation"
  },

  "footer": {
    "style":   "minimal-dark",
    "background": "#080F1C",
    "layout":  "logo-left · links-center · copyright-right",
    "mobile":  "stacked-centered",
    "links":   ["Impressum", "Datenschutz"]
  },

  "responsive_rules": {
    "_critical": "Diese Regeln gelten für ALLE generierten Sections ohne Ausnahme.",
    "layout_classes": "NUR Tailwind-Klassen für Layout. Inline style='' NUR für CSS Custom Properties.",
    "grid_base":      "Jedes grid beginnt mit grid-cols-1. Breakpoints als md:/lg: Präfix.",
    "split_stacking": {
      "rule": "Primärer Content (H1, Formular, CTA) immer DOM-zuerst → erscheint mobile oben ohne order-X",
      "secondary_content": "Sekundärer Content bekommt order-2 md:order-1 wenn er desktop-links aber mobile-unten soll",
      "never": "Niemals order-X auf H1, H2 oder primärem Formular"
    },
    "min_height":     "min-h-screen nur mit md: Präfix. Nie auf mobile.",
    "touch_targets":  "Alle buttons und links: min h-11 (44px) auf mobile. py-3 minimum.",
    "padding_mobile": "px-5 minimum auf mobile. Nie px-2 oder weniger.",
    "sticky_elements": "md:sticky nur ab md: Breakpoint. Nie auf mobile sticky.",
    "type_scale":     "Typoskala aus manifest.design_tokens.type_scale. Nie eigene px-Werte erfinden."
  },

  "section_stacking_rules": {
    "hero-split": {
      "dom_order":    ["primary-content (H1 + CTA + Stats)", "secondary-content (Visual / Dark Block)"],
      "mobile":       "1 Spalte, primärer Content oben",
      "desktop":      "2 Spalten nebeneinander",
      "classes":      "grid grid-cols-1 md:grid-cols-2"
    },
    "cta-split": {
      "dom_order":    ["form (Conversion-Ziel)", "trust-content (CTA-Text + Bullets)"],
      "mobile":       "Formular oben, Trust-Content darunter",
      "desktop":      "Trust-Content links (order-1 md:order-1), Formular rechts (order-1 md:order-2)",
      "note":         "Formular ist primäres Conversion-Ziel → DOM-zuerst"
    },
    "features-grid": {
      "mobile":  "grid-cols-1",
      "tablet":  "sm:grid-cols-2",
      "desktop": "lg:grid-cols-4",
      "gap":     "gap-px bg-white/6 rounded-sm overflow-hidden"
    },
    "process-sticky": {
      "mobile":  "grid-cols-1, sidebar und steps untereinander",
      "desktop": "md:grid-cols-3, sidebar mit md:sticky md:top-24 md:self-start"
    }
  },

  "pass1_prompt_rules": {
    "_title": "Diese Regeln gehen wörtlich als SYSTEM-PROMPT-BLOCK in jeden Pass-1-Aufruf",
    "rules": [
      "KEIN inline style='' für Layout — NUR Tailwind-Klassen",
      "inline style='' NUR für CSS Custom Properties: style='color: var(--color-accent)'",
      "Jedes grid: grid-cols-1 als Base, dann md:/lg: Breakpoints",
      "Split-Sections: primärer Content DOM-zuerst (mobile oben), sekundär DOM-zweiter",
      "order-X NUR für sekundären Content — niemals für H1, H2, Formulare",
      "Navbar: hidden md:flex für Links · Hamburger-Button mit aria-expanded",
      "min-h-screen IMMER mit md: Präfix: md:min-h-screen",
      "Alle interaktiven Elemente: min h-11 auf Mobile (py-3 minimum)",
      "Typoskala NUR aus manifest.design_tokens.type_scale verwenden",
      "Placeholder für Animationen: <!-- [ANIM: word-cycle | words: [...]] -->",
      "Placeholder für Backgrounds: <!-- [BG: geometric-shapes | opacity: 0.1] -->",
      "KEIN @keyframes in Pass 1 — das ist Aufgabe von Pass 2",
      "NUR HTML ausgeben, kein Markdown, kein Kommentar außerhalb HTML"
    ]
  },

  "pass3_validator_checks": {
    "_title": "Pass-3 prüft MECHANISCH — diese Checks laufen vor jedem Export",
    "auto_flag": [
      "style='' enthält grid / flex / column / height / width → 'Layout in inline style'",
      "grid-cols-X ohne vorheriges grid-cols-1 → 'Kein mobile-first Grid'",
      "min-h-screen ohne md: Präfix → 'Volle Höhe auch mobile'",
      "order-1 auf Element das h1/h2/form enthält → 'Primärer Content reordered'",
      "button oder a ohne py-3+ und ohne min-h-11 → 'Touch-Target zu klein'",
      "@keyframes außerhalb @media(prefers-reduced-motion:no-preference) → 'Animation nicht geschützt'",
      "img ohne alt='' → 'Fehlender Alt-Text'",
      "button[icon-only] ohne aria-label → 'Fehlende ARIA-Beschriftung'",
      "backdrop-blur ohne prefers-reduced-transparency fallback → 'Barrierefreiheit'"
    ],
    "auto_fix": [
      "aria-label auf Icon-Buttons ergänzen",
      "alt='' auf img ohne Alt-Text setzen",
      "prefers-reduced-motion Wrapper um @keyframes ergänzen"
    ]
  },

  "pages": [
    {
      "id": "home",
      "slug": "index",
      "title": "Startseite",
      "sections": ["hero-split-bold", "pain-points-dark", "services-grid", "process-sticky", "stats-counter", "cta-split"],
      "meta_description": "vitakents — Recruiting für die Region. B2B Recruiting für KMU in Norddeutschland."
    }
  ],

  "content": {
    "company_name":  "vitakents",
    "company_usp":   "Regionaler B2B-Recruiting-Service für KMU in Norddeutschland",
    "primary_cta":   "Kostenloses Erstgespräch",
    "secondary_cta": "Leistungen ansehen",
    "personas":      ["Geschäftsführer KMU 10–50 MA", "HR-Leiter Mittelstand"],
    "pain_points":   ["Stellenanzeigen ohne Rückmeldung", "Keine Zeit für Recruiting", "Headhunter ohne Regionalkenntnisse"],
    "trust_signals": ["200+ Vermittlungen", "85% Verbleibquote nach 2 Jahren", "6 Wochen Ø Besetzungszeit", "Seit 2018"],
    "regions":       ["Norddeutschland", "Hamburg bis Rostock"]
  },

  "generated_at": "2026-03-15T10:00:00Z",
  "version": "2.0",
  "_decision_log": {
    "paradigm":   "bold-expressive — gewählt durch Nutzer (Option C) nach expliziter Auswahl aus 3 Vorschlägen",
    "colors":     "Aus Option C Auswahl — kein Navy/Blau wegen Differenzierung zu vitalents.de",
    "navbar":     "sticky-blur + transparent→solid — Nutzer-Antwort im Briefing-Wizard",
    "mobile_nav": "hamburger-dropdown — Nutzer-Antwort im Briefing-Wizard",
    "animation":  "rich — Nutzer-Antwort 'Gerne mehr — moderne Energie'"
  }
}
```

---

## 6. Style-Palette-System

### Übersicht

Die Style-Palette ist eine lebendige Bibliothek von Style-Fingerprints. Sie wird aus drei Quellen gespeist:

1. **Manuell kuratiert** — viminds-Team scrapt interessante Sites
2. **Screenshot-Upload** — Kunde oder Konkurrenz-URL → automatische Analyse
3. **Feedback-Loop** — gute generierte Sections → automatisch als neuer Eintrag vorgeschlagen

### Style Fingerprint Schema

```typescript
interface StyleFingerprint {
  id: string;                    // uuid
  name: string;                  // "Vercel Dark 2024"
  paradigm: StyleParadigm;       // "minimal" | "tech" | "bold" | "luxury" | "playful"
  source: {
    type: "screenshot" | "url" | "manual" | "generated";
    url?: string;
    screenshot_path?: string;
  };
  colors: {
    primary: string;             // hex
    secondary: string;
    accent: string;
    background: string;
    text: string;
    gradient?: string;           // CSS gradient string
  };
  typography: {
    heading_style: "serif-light" | "sans-bold" | "display-heavy" | "mono";
    body_style: "sans-regular" | "serif-body";
    weight_tendency: "light" | "regular" | "heavy";
    size_scale: "compact" | "normal" | "large" | "display";
    tracking: "tight" | "normal" | "wide";
  };
  layout: {
    whitespace: "tight" | "balanced" | "generous" | "extreme";
    overlaps_allowed: boolean;
    full_bleed_allowed: boolean;
    grid_columns_max: number;
    asymmetric: boolean;
  };
  decoration: {
    gradients: boolean;
    mesh_gradient: boolean;
    glassmorphism: boolean;
    noise_texture: boolean;
    geometric_shapes: boolean;
    border_glow: boolean;
    shadows: "none" | "subtle" | "strong";
  };
  animation: {
    budget: "none" | "subtle" | "moderate" | "rich";
    scroll_driven: boolean;
    hover_effects: boolean;
    text_animations: boolean;
    background_animations: boolean;
  };
  tags: string[];                // ["dark", "saas", "2024-q4", "minimal", "gradient"]
  quality_score: number;         // 1-5, manuell bewertet
  created_at: string;
  example_sections?: string[];   // Pfade zu Referenz-HTML-Snippets
}
```

### Aktuell wichtige Paradigmen (2024/2025 Trends)

```
minimal-clean      → viel Whitespace, Serif, 1 Akzent, statisch
tech-dark          → Dark Mode, subtle Gradients, Mono-Font (Vercel, Linear style)
bold-expressive    → Loud, Overlaps, Display-Font, rich Animations
luxury-editorial   → große Typografie, viel Weißraum, editoriales Layout
bento-grid         → Apple-inspiriert, Card-Mosaic, mixed sizes
brutalist          → starke Borders, hoher Kontrast, raw
glassmorphism      → blur backgrounds, transluzente Cards, dark base
```

---

## 7. Style Dictionary — pro Paradigma

Das Style Dictionary wird pro Paradigma gespeichert und geht als **erster Block in jeden Section-Prompt** — nicht als Hinweis am Ende, sondern als maschinenlesbarer Kontrakt.

### Beispiel: minimal-clean

```json
{
  "id": "minimal-clean-v1",
  "paradigm": "minimal-clean",
  "rules": {
    "layout": {
      "section_padding": "py-32 lg:py-40",
      "max_width": "max-w-4xl mx-auto",
      "columns_max": 2,
      "overlaps_allowed": false,
      "negative_margin_allowed": false,
      "full_bleed_allowed": false,
      "asymmetric_allowed": false
    },
    "typography": {
      "heading_font": "font-serif",
      "heading_weight": "font-light",
      "heading_size_hero": "text-6xl lg:text-8xl",
      "heading_size_section": "text-4xl lg:text-5xl",
      "tracking": "tracking-tight",
      "line_height_heading": "leading-none"
    },
    "color": {
      "backgrounds_allowed": ["white", "stone-50", "stone-100", "zinc-50"],
      "dark_sections_allowed": false,
      "gradient_allowed": false,
      "accent_count_max": 1
    },
    "animation": {
      "budget": "none",
      "keyframes_allowed": false,
      "scroll_driven_allowed": false,
      "hover_transitions_allowed": ["opacity", "transform"],
      "hover_transition_duration_max": "300ms"
    },
    "decoration": {
      "mesh_gradient": false,
      "glassmorphism": false,
      "border_glow": false,
      "background_patterns": false,
      "noise_texture": false,
      "box_shadow": "subtle-only"
    }
  },
  "forbidden_patterns": [
    "bg-gradient-to-*",
    "backdrop-blur-*",
    "animate-*",
    "@keyframes",
    "z-[*]",
    "-mt-*",
    "-mb-*",
    "overflow-visible on section level"
  ],
  "required_patterns": [
    "generous whitespace between elements",
    "single accent color only",
    "max 2 font-size variations per section",
    "consistent border-radius throughout"
  ],
  "html_patterns": {
    "section_wrapper": "<section class=\"py-32 lg:py-40 bg-white\">",
    "container": "<div class=\"max-w-4xl mx-auto px-6\">",
    "heading_hero": "<h1 class=\"text-6xl lg:text-8xl font-serif font-light tracking-tight\">",
    "cta_button": "<button class=\"px-8 py-4 bg-[var(--color-primary)] text-white rounded-full text-sm font-medium hover:opacity-90 transition-opacity\">"
  }
}
```

### Beispiel: tech-dark

```json
{
  "id": "tech-dark-v1",
  "paradigm": "tech-dark",
  "rules": {
    "layout": {
      "section_padding": "py-24 lg:py-32",
      "max_width": "max-w-6xl mx-auto",
      "columns_max": 4,
      "overlaps_allowed": true,
      "negative_margin_allowed": true,
      "full_bleed_allowed": true,
      "grid_types_allowed": ["bento", "asymmetric", "standard"]
    },
    "typography": {
      "heading_font": "font-sans",
      "heading_weight": "font-bold lg:font-extrabold",
      "heading_size_hero": "text-5xl lg:text-7xl",
      "tracking": "tracking-tighter",
      "gradient_text_allowed": true,
      "outlined_text_allowed": true
    },
    "color": {
      "base": "dark",
      "backgrounds_allowed": ["zinc-950", "zinc-900", "zinc-800", "black"],
      "accent_count_max": 2,
      "gradient_allowed": true,
      "gradient_types": ["linear", "radial", "conic", "mesh"]
    },
    "animation": {
      "budget": "moderate",
      "keyframes_allowed": true,
      "scroll_driven_allowed": true,
      "text_animations_allowed": ["word-cycle", "fade-up", "scramble"],
      "background_animations_allowed": ["gradient-shift", "noise-pulse"],
      "hover_effects_allowed": ["scale", "glow", "reveal", "magnetic"]
    },
    "decoration": {
      "mesh_gradient": true,
      "glassmorphism": true,
      "border_glow": true,
      "geometric_shapes": true,
      "noise_texture": true,
      "grid_lines_background": true
    }
  },
  "forbidden_patterns": [
    "bg-white",
    "font-serif",
    "py-40 or more",
    "single column hero"
  ],
  "required_patterns": [
    "dark background on at least 60% of sections",
    "gradient or glow accent element in hero",
    "at least one animated element above fold"
  ]
}
```

---

## 8. 3-Pass Generierungs-Pipeline

### Warum 3 Passes statt 1

Das aktuelle v1-System versucht in einem Pass alles zu generieren + zu verbessern. Das ist der Grund für Fehler und Langsamkeit. Die Trennung in 3 Passes mit klaren Zuständigkeiten löst beide Probleme:

- Pass 1 ist schnell und fokussiert (nur Struktur)
- Pass 2 kann parallel zu anderen Seiten laufen
- Pass 3 ist billig und gibt konkretes Feedback

### Pass 1 — Struktur & Inhalt (GPT-4.1)

**Prompt-Struktur:**

```
SYSTEM:
Du bist ein HTML-Entwickler der Section-Gerüste erstellt.
Deine Aufgabe: NUR Struktur und Inhalt. Keine Animationen. Keine fancy Backgrounds.

STYLE DICTIONARY (Pflichtlektüre):
{{style_dictionary_json}}

DESIGN TOKENS:
{{design_tokens_as_css_custom_properties}}

SECTION-REFERENZ aus Library (beste ähnliche Section):
{{rag_section_reference_html}}

USER:
Erstelle eine {{section_type}}-Section für:
Unternehmen: {{company_name}} | Branche: {{industry}}
Inhalt: {{section_content_brief}}
Ton: {{tone}}

RESPONSIVE-REGELN (nicht verhandelbar):
- KEIN inline style="" für Layout — NUR Tailwind-Klassen
- inline style="" NUR für CSS Custom Properties: style="color: var(--color-accent)"
- Jedes grid: grid-cols-1 als Base, dann md:/lg: Breakpoints
- Split-Sections: primärer Content DOM-zuerst (H1+CTA mobile oben)
- order-X NUR für sekundären Content — niemals für H1, H2, Formulare
- min-h-screen IMMER als md:min-h-screen
- Alle interaktiven Elemente: py-3 minimum (44px Touch-Target)
- Typoskala NUR aus den übergebenen type_scale-Klassen verwenden

WEITERE REGELN:
- CSS Custom Properties verwenden: var(--color-primary), var(--font-heading) etc.
- Placeholder für Animationen: <!-- [ANIM: word-cycle | words: [...]] -->
- Placeholder für Backgrounds: <!-- [BG: geometric-shapes | opacity: 0.1] -->
- Kein @keyframes, kein JavaScript in diesem Pass
- Kein <style> Block — nur Tailwind-Klassen + CSS Custom Properties
- Antworte NUR mit dem HTML der Section, kein Markdown
```

**Output:** HTML mit Placeholder-Comments, keine Animationen

### Pass 2 — Visual Layer (GPT-4.1 oder Claude Opus)

**Nur wenn Style Dictionary animation_budget !== "none"**

```
SYSTEM:
Du bist ein Visual-Developer der bestehende HTML-Sections mit Visual-Layer anreichert.
Du erhältst fertiges HTML und setzt die Placeholder-Comments um.

ANIMATION-KOMPONENTEN-BIBLIOTHEK:
{{animation_components_json}}

STYLE DICTIONARY:
{{style_dictionary_json}}

USER:
Reichere diese Section mit dem Visual Layer an:

[PASS-1-OUTPUT-HTML]

Anweisungen:
- Setze alle <!-- [ANIM: ...] --> Placeholders mit konkreten Implementierungen um
- Setze alle <!-- [BG: ...] --> Placeholders mit SVG oder CSS um
- Füge @keyframes in einen <style> Block am Anfang ein
- Alle Animationen brauchen prefers-reduced-motion Fallback
- Verändere KEINE Struktur, KEINEN Inhalt — nur Visual Layer
- Antworte NUR mit dem vollständigen HTML
```

### Pass 3 — Validator (o4-mini)

```
SYSTEM:
Du bist ein HTML/CSS-Validator. Antworte NUR mit JSON.

USER:
Validiere diese Section gegen die Checkliste:

HTML:
{{pass2_output}}

STYLE DICTIONARY forbidden_patterns:
{{forbidden_patterns}}

Checkliste:
1. aria-label auf allen Icon-Buttons vorhanden?
2. alt-Text auf allen Images vorhanden?
3. Forbidden patterns im HTML enthalten? (Liste)
4. @keyframes ohne prefers-reduced-motion wrapper?
5. z-index > 50 ohne Kommentar?
6. Responsive: gibt es Klassen nur für mobile ohne desktop equivalent?
7. CSS Custom Properties korrekt verwendet (var(--...) Syntax)?
8. IIFE für alle inline Scripts?
9. style="" enthält grid / flex / column / height / width → Flag
10. grid-cols-X ohne vorheriges grid-cols-1 → Flag
11. min-h-screen ohne md: Präfix → Flag
12. order-1 auf Element das h1/h2/form enthält → Flag
13. button oder a ohne py-3+ → Flag (Touch-Target zu klein)

Antworte mit:
{
  "valid": boolean,
  "errors": [{ "type": string, "message": string, "severity": "error"|"warning", "auto_fixable": boolean }],
  "score": number (0-100)
}
```

### Parallelisierung & Performance

```typescript
// Seiten parallel generieren, nicht sequenziell
const pageResults = await Promise.all(
  manifest.pages.map(page => generatePage(page, manifest))
);

// Sections einer Seite können auch parallel (Pass 1)
const sectionPass1Results = await Promise.all(
  page.sections.map(sectionType => runPass1(sectionType, manifest))
);

// Pass 2 + 3 dann für jede Section
for (const section of sectionPass1Results) {
  const pass2 = needsVisualLayer(manifest.style_dictionary)
    ? await runPass2(section, manifest)
    : section;
  const validation = await runPass3(pass2);
  // handle validation
}
```

**Erwartete Verbesserung:** v1 brauchte 50-85s pro Section sequential. v2 mit Parallelisierung und kürzeren focused Prompts: 8-15s pro Section.

---

## 9. Section-Template-Library

### Konzept

Keine freie Erfindung durch die KI — sie wählt aus kuratierten Templates und konfiguriert diese. Templates sind paradigma-spezifisch.

### Section-Typen pro Paradigma

```
hero                   → Startbild, Headline, CTA
hero-split             → Text links, Visual rechts
hero-fullscreen        → Volle Viewport-Höhe
page-header            → Überschrift für Unterseiten
features-grid          → Feature-Cards im Grid
features-bento         → Bento-Grid Layout (mixed sizes)
features-list          → Icon + Text Liste
services-cards         → Leistungs-Cards mit Hover
testimonials-slider    → Kundenstimmen
testimonials-grid      → 3-col Testimonials
stats-counter          → Animierte Zahlen
process-steps          → Numbered Process
faq-accordion          → Accordion FAQ
cta-simple             → Einfache CTA-Sektion
cta-split              → CTA mit Visual
contact-form           → Kontaktformular
team-grid              → Team-Cards
logo-cloud             → Kunden-Logos
pricing-cards          → Preis-Cards
gallery-masonry        → Bildergalerie
```

### Section-Metadaten (für RAG-Suche)

```json
{
  "id": "hero-split-minimal-001",
  "type": "hero-split",
  "paradigm": "minimal-clean",
  "quality_score": 5,
  "tags": ["hero", "split", "serif", "minimal", "no-animation"],
  "industries": ["consulting", "finance", "law", "architecture"],
  "tone": ["professional", "trustworthy"],
  "html_path": "/section-library/hero-split-minimal-001.html",
  "preview_path": "/section-library/previews/hero-split-minimal-001.png",
  "created_at": "2026-02-10",
  "source": "viminds-generated-curated"
}
```

---

## 10. Animation-Komponenten-Bibliothek

Animationen werden nicht frei erfunden — der Visual-Pass wählt aus dieser Bibliothek und konfiguriert Parameter.

### Komponenten-Struktur

```typescript
interface AnimationComponent {
  id: string;
  category: 'text' | 'background' | 'scroll' | 'hover' | 'entrance';
  name: string;
  description: string;
  complexity: 'low' | 'medium' | 'high';
  js_required: boolean;
  config_params: string[];
  code_template: string;  // mit {{param}} Placeholders
  paradigms_allowed: StyleParadigm[];
  prefers_reduced_motion_safe: boolean;  // immer true
}
```

### Kern-Komponenten (implementieren zuerst)

**Kategorie: Text-Animationen**

```javascript
// word-cycle: Wort wechselt zwischen Optionen
// Params: words[], interval_ms, animation_style
// Komplexität: low | JS required

// typewriter: Cursor + Zeichen erscheinen nacheinander
// Params: text, speed_ms, cursor_char
// Komplexität: low | JS required

// word-scramble: Buchstaben rotieren durch zufällige Chars
// Params: text, duration_ms, chars_pool
// Komplexität: medium | JS required

// fade-up-stagger: Wörter/Zeilen erscheinen versetzt
// Params: delay_between_ms, direction
// Komplexität: low | CSS only (Intersection Observer)
```

**Kategorie: SVG Backgrounds**

```javascript
// geometric-shapes: Kreise, Linien, Grids als animiertes SVG
// Params: shape_types[], count, opacity, color, animation_speed
// Komplexität: medium | CSS SVG animateTransform

// blob-morph: Organische Form die sich morpht
// Params: fill_color, opacity, size, position, duration
// Komplexität: medium | CSS SVG animate

// grid-lines: Subtiles Gitternetz im Hintergrund
// Params: spacing, opacity, color, animated
// Komplexität: low | CSS background-image (SVG inline)

// noise-grain: SVG feTurbulence als Overlay
// Params: frequency, opacity, blending
// Komplexität: low | CSS filter SVG

// mesh-gradient: Mehrpunkt-Gradient im CSS
// Params: colors[], positions[]
// Komplexität: medium | CSS radial-gradient stack
```

**Kategorie: Scroll-driven**

```javascript
// parallax-layer: Element bewegt sich langsamer als Scroll
// Params: speed_factor, direction
// Komplexität: low | CSS scroll-timeline (kein JS)

// sticky-reveal: Text enthüllt sich Wort für Wort beim Scrollen
// Params: trigger_offset
// Komplexität: high | Intersection Observer JS

// counter-tick: Zahlen zählen hoch wenn im Viewport
// Params: target, duration_ms, prefix, suffix, easing
// Komplexität: medium | Intersection Observer JS
```

**Kategorie: Hover-Effekte**

```javascript
// magnetic-button: Button folgt Cursor leicht
// Params: strength, transition_speed
// Komplexität: medium | JS mousemove

// tilt-card: 3D-Tilt auf Mausbewegung
// Params: max_tilt_deg, perspective, scale_on_hover
// Komplexität: medium | JS mousemove + CSS perspective

// image-reveal-clip: clip-path animiert auf Hover
// Params: reveal_direction, duration_ms
// Komplexität: low | CSS clip-path transition
```

### Prefers-Reduced-Motion (PFLICHT in jeder Section)

```css
/* Kommt in JEDE generierte CSS-Datei — mechanisch, nicht optional */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### SVG Shape Grammar

Für geometric-shapes Background: Die KI folgt dieser Grammar, erfindet keine eigene Komposition.

```json
{
  "hero_background": {
    "layers": [
      { "type": "circle", "position": "top-right", "size": "55vw", "opacity": 0.06, "fill": "none", "stroke": "var(--color-accent)", "animation": "slow-rotate", "duration": "40s" },
      { "type": "circle", "position": "top-right", "size": "35vw", "opacity": 0.08, "fill": "none", "stroke": "var(--color-primary)", "animation": "slow-rotate-reverse", "duration": "30s" },
      { "type": "grid", "spacing": 80, "opacity": 0.04, "color": "var(--color-text)" },
      { "type": "dots-cluster", "count": 20, "position": "bottom-left", "opacity": 0.15, "color": "var(--color-accent)" }
    ]
  },
  "section_background_subtle": {
    "layers": [
      { "type": "horizontal-lines", "count": 5, "opacity": 0.05, "animated": false }
    ]
  }
}
```

---

## 11. Briefing-Interface (Frontend)

### BriefingSchema (TypeScript)

```typescript
interface BriefingSchema {
  // Step 1: Projekt
  project: {
    company_name: string;
    industry: IndustryType;
    tagline: string;
    usp: string;
    competitors: string[];          // für Differenzierungs-Entscheidungen
    existing_brand: boolean;
    brand_colors?: string[];        // hex wenn vorhanden
    brand_fonts?: string[];
  };

  // Step 2: Zielgruppe
  audience: {
    personas: PersonaType[];
    age_range: string;
    pain_points: string[];
    primary_goal: string;
    tone_preference: ToneType;
    adjectives: string[];           // NEU: max 4 Adjektive → Paradigma-Auswahl
  };

  // Step 3: Design-Richtung — 4 explizite Wege, kein stilles Raten
  design: {
    // Weg A: Screenshot oder URL → GPT-4o Vision → Fingerprint
    reference_screenshots?: string[];   // base64
    reference_urls?: string[];          // → Scraping + Vision

    // Weg B: Trend-Auswahl
    trend_preference?: 'current-2025' | 'timeless' | 'see-options' | 'manual';
    // current-2025 → Palette nach tags:["2025"] filtern → top-3 zeigen
    // see-options  → top-3 Paradigma-Vorschläge aus Branche×Ton zeigen

    // Weg C: Direktwahl
    style_paradigm?: StyleParadigm;    // gesetzt nach Nutzer-Auswahl

    // Immer explizit abgefragt:
    animation_budget: 'none' | 'subtle' | 'moderate' | 'rich';
    // → 'none'   = "Wenig — ruhig und seriös"
    // → 'subtle' = "Mittel — subtile Akzente"
    // → 'rich'   = "Gerne mehr — moderne Energie"
  };

  // Step 3b: Navbar & Layout — NEU
  layout: {
    navbar_style:    'sticky-blur' | 'static' | 'transparent-hero' | 'hidden-scroll';
    navbar_mobile:   'hamburger-dropdown' | 'hamburger-overlay' | 'hamburger-sidebar' | 'logo-cta-only';
    navbar_content:  NavbarContentItem[];  // ['logo-left', 'nav-center', 'cta-right']
    footer_style?:   'minimal' | 'multi-column' | 'dark' | 'light';
  };

  // Step 4: Seitenstruktur
  structure: {
    pages: PageConfig[];
    has_blog: boolean;
    has_shop: boolean;
    contact_form: boolean;
    language: string;
    target_launch: string;
  };
}
```

### Wann wird das Style Dictionary generiert — präziser Ablauf

```
1. Briefing Step 3: Nutzer wählt einen der 4 Wege:

   Weg A (Screenshot/URL):
   → POST /api/analyze-style → GPT-4o Vision → StyleFingerprint JSON
   → Fingerprint wird mit gewähltem Paradigma gemergt
   → Besonderheit: competitor_url erkannt → differentiation_note gesetzt

   Weg B (Trend "current-2025"):
   → Style-Palette gefiltert: tags includes "2025" AND quality_score >= 4
   → Top-3 Fingerprints als visuelle Karten angezeigt
   → Nutzer wählt einen → Fingerprint wird Basis für Dictionary

   Weg C ("Optionen zeigen"):
   → branche × ton → PARADIGM_MAPPING → top-2 Paradigmen
   → Pro Paradigma: Farb-Preview + Typografie-Beispiel + Paradigma-Name
   → Nutzer wählt → Paradigma gesetzt

   Weg D (Direktwahl im Wizard):
   → Nutzer wählt Paradigma direkt aus Liste
   → Bestehendes Dictionary geladen

2. Briefing Step 3b: Navbar + Layout explizit abgefragt
   → Navbar-Stil, Mobile-Verhalten, Inhalt → in manifest.navbar gespeichert

3. Manifest Generator (Claude Sonnet):
   → Alle Inputs → manifest.json generiert
   → manifest._decision_log wird befüllt (Herkunft jedes Wertes)

4. Jeder Section-Prompt bekommt:
   → manifest.design_tokens (CSS Custom Properties)
   → manifest.style_dictionary (forbidden + required patterns)
   → manifest.navbar (für Navbar-Section)
   → manifest.responsive_rules (Pflichtregeln)
   → manifest.pass1_prompt_rules (wörtlich als System-Prompt Block)
```

---

## 12. Modellstrategie — OpenAI + Anthropic

### Empfohlene Zuweisung

```typescript
const MODEL_CONFIG = {
  // Briefing-Analyse und PagePlan: Claude gut für strategisches Denken
  manifest_generation: {
    provider: 'anthropic' as const,
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    temperature: 0.3,
  },

  // Pass 1: GPT-4.1 hat enormen Tailwind/HTML Trainingskorpus
  // + 128K output tokens = kein Abschneiden bei langen Sections
  structure_pass: {
    provider: 'openai' as const,
    model: 'gpt-4.1',
    max_tokens: 8192,
    temperature: 0.4,
  },

  // Pass 2: GPT-4.1 stark bei CSS-Animationen und SVG
  // Alternative: claude-opus für kreativere Layouts
  visual_pass: {
    provider: 'openai' as const,
    model: 'gpt-4.1',
    max_tokens: 6000,
    temperature: 0.6,
  },

  // Pass 3: o4-mini sehr zuverlässig für strukturiertes JSON-Output
  // + günstig + schnell = ideal für Validator
  validator_pass: {
    provider: 'openai' as const,
    model: 'o4-mini',
    max_tokens: 2000,
    // o4-mini: kein temperature parameter
    response_format: { type: 'json_object' },
  },

  // Screenshot-Analyse: GPT-4o Vision
  screenshot_analysis: {
    provider: 'openai' as const,
    model: 'gpt-4o',
    max_tokens: 2000,
    temperature: 0.1,
    response_format: { type: 'json_object' },
  },
};
```

### Provider-agnostisches Interface (ai.ts)

```typescript
interface AIProvider {
  complete(params: CompletionParams): Promise<CompletionResult>;
  stream(params: CompletionParams): AsyncGenerator<string>;
}

interface CompletionParams {
  model: string;
  system?: string;
  messages: Message[];
  max_tokens: number;
  temperature?: number;
  response_format?: { type: 'json_object' | 'text' };
  images?: ImageInput[];  // für Vision-Tasks
}

// Implementierungen:
class OpenAIProvider implements AIProvider { ... }
class AnthropicProvider implements AIProvider { ... }

// Factory:
function getProvider(config: ModelConfig): AIProvider {
  if (config.provider === 'openai') return new OpenAIProvider();
  if (config.provider === 'anthropic') return new AnthropicProvider();
  throw new Error(`Unknown provider: ${config.provider}`);
}
```

---

## 13. Screenshot → Style-Fingerprint Pipeline

### Endpunkt: POST /api/analyze-style

```typescript
// Input
interface AnalyzeStyleInput {
  type: 'screenshot' | 'url';
  data: string;  // base64 image oder URL
  name?: string; // optionaler Name für die Palette
}

// Der Analyse-Prompt (WICHTIG: JSON-only output erzwingen)
const VISION_ANALYSIS_PROMPT = `
Analysiere diesen Website-Screenshot und extrahiere einen Style Fingerprint.
Antworte AUSSCHLIESSLICH mit validem JSON. Kein Text davor, kein Markdown, keine Erklärungen.

Erforderliches Format:
{
  "paradigm": "minimal|tech|bold|luxury|playful",
  "colors": {
    "primary": "#hex",
    "secondary": "#hex",
    "accent": "#hex",
    "background": "#hex",
    "text": "#hex"
  },
  "typography": {
    "heading_style": "serif-light|sans-bold|display-heavy|mono",
    "weight_tendency": "light|regular|heavy",
    "size_scale": "compact|normal|large|display",
    "tracking": "tight|normal|wide"
  },
  "layout": {
    "whitespace": "tight|balanced|generous|extreme",
    "overlaps_allowed": boolean,
    "full_bleed_allowed": boolean,
    "asymmetric": boolean
  },
  "decoration": {
    "gradients": boolean,
    "glassmorphism": boolean,
    "geometric_shapes": boolean,
    "shadows": "none|subtle|strong"
  },
  "animation": {
    "budget": "none|subtle|moderate|rich",
    "scroll_driven": boolean,
    "text_animations": boolean
  },
  "tags": ["max 8 Tags aus: dark, light, minimal, loud, serif, sans, mono, gradient, flat, glassmorphism, brutalist, editorial, tech, luxury, playful, 2024, saas, corporate, creative"],
  "confidence": 0.0 bis 1.0
}
`;
```

---

## 14. Varianten-System

### Was eine Variante ist

Eine Variante ist eine neue Version der Site mit:
- **Anderem Style-Paradigma** → komplett andere HTML-Struktur (Neu-Generierung)
- **Anderen Design-Tokens** → gleiche Struktur, andere CSS Custom Properties (Token-Swap)
- **Anderen Inhalten** → gleiche Struktur, andere Texte (Content-Swap)

### Varianten-Typen

```typescript
type VariantType =
  | 'token-swap'        // nur CSS Custom Properties ändern → schnell, kein Neu-Generieren
  | 'paradigm-shift'    // anderes Style Dictionary → vollständige Neu-Generierung
  | 'content-variant'   // gleiche Struktur, andere Sprache/Zielgruppe
  | 'dark-mode'         // dark mode Variante der gleichen Site

interface VariantConfig {
  base_manifest_id: string;
  variant_type: VariantType;
  overrides: Partial<SiteManifest>;
  name: string;  // "Blau-Variante", "Dark Mode", "Bold Version"
}
```

### Token-Swap (schnellste Variante)

```typescript
// Nur die CSS Custom Properties in :root ändern
// Alle HTML-Files bleiben identisch
function generateTokenSwapVariant(
  base: SiteManifest,
  new_tokens: Partial<DesignTokens>
): VariantConfig {
  return {
    base_manifest_id: base.id,
    variant_type: 'token-swap',
    overrides: { design_tokens: { ...base.design_tokens, ...new_tokens } },
    name: 'Token-Variante'
  };
}

// Output: neue custom.css mit anderen :root Werten
// Alle anderen Dateien unverändert
```

### Paradigm-Shift (vollständige Neu-Generierung)

```typescript
// Gleicher Inhalt (Texte, USPs, Personas) → anderes Style Dictionary
// Alle Sections werden neu generiert
function generateParadigmVariant(
  base: SiteManifest,
  new_paradigm: StyleParadigm
): VariantConfig {
  return {
    base_manifest_id: base.id,
    variant_type: 'paradigm-shift',
    overrides: {
      style_paradigm: new_paradigm,
      style_dictionary_ref: `${new_paradigm}-v1`
    },
    name: `${new_paradigm} Variante`
  };
}
// Ergebnis: vollständig neue HTML-Files, gleiche Inhalte
```

---

## 15. Dateistruktur des Projekts

```
/wbuilder-v2/
  /src/
    /app/
      /api/
        /generate/
          route.ts              ← Haupt-Generierungs-Endpunkt
        /analyze-style/
          route.ts              ← Screenshot → Style Fingerprint
        /manifest/
          route.ts              ← Site Manifest generieren
      /briefing/
        page.tsx                ← 4-Step Briefing Wizard
      /editor/
        page.tsx                ← Section Editor + Preview
      /palette/
        page.tsx                ← Style-Palette verwalten
    /lib/
      /ai/
        ai.ts                   ← Provider-agnostisches Interface
        openai.ts               ← OpenAI Implementierung
        anthropic.ts            ← Anthropic Implementierung
        models.ts               ← MODEL_CONFIG
      /generation/
        manifestGenerator.ts    ← BriefingSchema → manifest.json
        pagePlanGenerator.ts    ← Manifest → PagePlan
        sectionGenerator.ts     ← 3-Pass Pipeline
        pageAssembler.ts        ← Sections → vollständige Page
        exportBuilder.ts        ← Alles → ZIP Download
      /style/
        styleDictionary.ts      ← Style Dictionary Loader
        stylePalette.ts         ← Palette CRUD
        styleFingerprint.ts     ← Screenshot-Analyse
        tokenManager.ts         ← CSS Custom Properties
      /sections/
        sectionLibrary.ts       ← RAG-Suche in Section Library
        animationComponents.ts  ← Animation-Bibliothek
        validator.ts            ← Pass-3-Logik + Auto-Fix
      /export/
        tailwindBuilder.ts      ← Tailwind CLI Build
        htmlAssembler.ts        ← base.html + content → full page
    /data/
      /style-dictionaries/      ← JSON files pro Paradigma
        minimal-clean-v1.json
        tech-dark-v1.json
        bold-expressive-v1.json
        luxury-editorial-v1.json
      /style-palette/           ← Fingerprints als JSON
        index.json              ← Suchindex
        /entries/
          fingerprint-001.json
      /section-library/         ← Kuratierte Section HTMLs
        index.json              ← Metadaten + Suchindex
        /sections/
          hero-minimal-001.html
          hero-dark-001.html
        /previews/              ← Screenshots für UI
      /animation-components/
        components.json         ← Alle Animation-Komponenten
    /store/
      generationStore.ts        ← Zustand (bestehend, erweitern)
    /logs/
      ai-runs.ndjson            ← bestehend, beibehalten
  /public/
    /section-previews/
  package.json
  tailwind.config.js
  next.config.ts
```

---

## 16. Bekannte Fehlerquellen & Lösungen

### Problem: Mobile-Layout bricht (inline styles, falsches Stacking)

**Ursachen:**
- KI verwendet inline `style=""` für Layout statt Tailwind-Klassen
- Breakpoints fehlen (kein `grid-cols-1` als Base)
- Split-Sections stacken falsch (sekundärer Content erscheint mobile oben)

**Lösung:**
```
Pass-1-Prompt enthält wörtlich:
  "KEIN inline style='' für Layout"
  "grid-cols-1 als Base für jedes grid"
  "Primärer Content (H1+CTA) DOM-zuerst"

Pass-3 prüft mechanisch:
  style="" mit grid/flex → auto-flag
  grid-cols-X ohne grid-cols-1 → auto-flag
  order-1 auf H1/form → auto-flag
```

### Problem: Navbar nicht definiert — KI erfindet frei

**Ursache:** Briefing enthält keine Navbar-Spezifikation

**Lösung:**
```
Briefing-Wizard Step 3b fragt explizit:
  - Navbar-Stil (sticky / transparent→solid / etc.)
  - Mobile-Verhalten (hamburger-dropdown / overlay / etc.)
  - Inhalt (logo-links + nav-mitte + cta-rechts)

Ergebnis in manifest.navbar gespeichert →
  Navbar-Section bekommt exakte Spezifikation statt freier Erfindung
```

### Problem: Generierung langsam

**Ursachen:**
- Alle Sections sequenziell generiert
- Prompts zu lang (viel unnötiger Context)
- Pass 2 immer ausgeführt auch wenn nicht nötig

**Lösung v2:**
```typescript
// 1. Sections parallel generieren
await Promise.all(sections.map(s => generateSection(s)));

// 2. Pass 2 nur wenn animation_budget !== 'none'
if (manifest.style_dictionary.rules.animation.budget !== 'none') {
  await runPass2(section);
}

// 3. Prompts fokussiert halten — max 3000 tokens System-Prompt
// Style Dictionary als komprimiertes JSON, nicht ausgeschrieben
```

### Problem: KI ignoriert Style-Constraints

**Ursache:** Constraints als Freitext am Ende des Prompts

**Lösung:**
```
1. Style Dictionary als ERSTES im System-Prompt, vor allem anderen
2. forbidden_patterns explizit als JSON-Array, nicht als Prosa
3. Pass 3 Validator prüft mechanisch auf forbidden_patterns
4. Bei Violation: Auto-Fix via string-replace oder Section-Retry
```

### Problem: JSON-Parse-Fehler in Validator

**Ursache:** Modell antwortet mit Markdown-Code-Block statt reinem JSON

**Lösung:**
```typescript
function safeParseJson(raw: string): ValidationResult | null {
  // Strip markdown fences
  const cleaned = raw
    .replace(/^```json\n?/, '')
    .replace(/\n?```$/, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // o4-mini mit response_format: json_object → kein Parse-Fehler
    return null;
  }
}
```

### Problem: Tailwind-Klassen im CDN-Modus nicht vollständig

**Ursache:** CDN-JIT generiert nur Klassen die im HTML vorkommen — CSS Custom Properties mit var() nicht unterstützt

**Lösung:** Wechsel zu Tailwind CLI Build
```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{html,js}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
      }
    }
  }
}
```

### Problem: Sections inkonsistent über Seiten

**Ursache:** Jede Section-Generierung hat keinen Kontext über andere Sections

**Lösung:** Manifest-Kontext in jeden Prompt
```
Jeder Section-Prompt enthält:
- manifest.design_tokens (CSS Custom Properties)
- manifest.style_dictionary (Style-Constraints)
- "Diese Section gehört zu Site: {{site_name}}, Seite: {{page_title}}"
→ KI referenziert immer denselben Design-Kontext
```

---

## 17. Implementierungsplan — Production-Ready für Windsurf

**Repo:** `github.com/timratig1976/wbuilder` · Stack: Next.js 14, Zustand, OpenAI SDK, Tailwind CDN, Puppeteer  
**Philosophie:** Jede Funktion vollständig definiert. Jeder LLM-Prompt wörtlich ausgeschrieben. Kein Platzhalter. Windsurf führt jeden Schritt aus ohne zu raten.

**Aktueller Stand v1 (Repo-Analyse März 2026):**
```
src/lib/ai.ts           → OpenAI-only, 2-Pass, cleanHtml() funktioniert ✓
src/lib/store.ts        → Zustand, Project/Page/Section + BrandStyle ✓
src/lib/assembler.ts    → assemblePage() + IIFE-Scoping ✓
src/lib/examples.ts     → 10 Beispiel-Sections als HTML-Strings ✓
src/app/api/generate/   → SSE streaming, classify+generate+enhance ✓
src/app/builder/        → Canvas, Sidebar, Topbar, PropertiesPanel ✓
src/app/scraper/        → Seite existiert, noch leer ✓
FEHLEND: Manifest, StyleDictionary, 3-Pass, SectionLibrary, Prompts
```

---

### Modul 1 — Typen, Style Dictionaries, Data Files

#### 1.1 Kerntypen
**Neu:** `src/lib/types/manifest.ts`

```typescript
export type StyleParadigm =
  | 'minimal-clean' | 'tech-dark' | 'bold-expressive'
  | 'luxury-editorial' | 'bento-grid' | 'brutalist'

export type AnimationBudget = 'none' | 'subtle' | 'moderate' | 'rich'

export type SectionTransition =
  | 'flat' | 'concave-bottom' | 'convex-bottom'
  | 'wave-bottom' | 'diagonal-bottom'

export interface DesignTokens {
  colors: {
    primary: string; secondary: string; accent: string
    highlight: string; background: string; surface: string
    dark: string; text: string; text_muted: string
    _source: string
  }
  typography: {
    font_heading: string; font_body: string
    heading_weight: string; tracking_heading: string
    line_height_heading: string; _source: string
  }
  type_scale: {
    hero_h1: string; section_h2: string; card_h3: string
    body: string; eyebrow: string; cta_button: string
  }
  spacing: {
    section_padding_light: string; section_padding_heavy: string
    container_max: string; container_padding: string
  }
}

export interface SiteManifest {
  id: string; version: string
  site: {
    name: string; language: string; industry: string
    tone: string; adjectives: string[]; primary_cta_goal: string
  }
  design_tokens: DesignTokens
  style_paradigm: StyleParadigm
  style_dictionary_ref: string
  style_source: { type: string; url?: string; confidence?: number }
  navbar: {
    style: 'sticky-blur'|'static'|'transparent-hero'|'hidden-scroll'
    scroll_threshold_px: number; height: string
    layout_desktop: string; mobile_menu: string
    cta_button: boolean; cta_label: string; links: string[]
  }
  section_stacking_rules: Record<string, {
    dom_order: string[]; mobile: string; desktop: string
    classes: string
  }>
  pass1_prompt_rules: { rules: string[] }
  pass3_auto_flags: string[]
  pages: Array<{
    id: string; slug: string; title: string
    sections: string[]; meta_description: string
  }>
  content: {
    company_name: string; company_usp: string
    primary_cta: string; secondary_cta: string
    personas: string[]; pain_points: string[]; trust_signals: string[]
  }
  generated_at: string
  _decision_log: Record<string, string>
}

export interface ValidationError {
  type: string; message: string
  severity: 'error'|'warning'; auto_fixable: boolean
}

export interface ValidationResult {
  valid: boolean; score: number; errors: ValidationError[]
}
```

#### 1.2 Style Dictionary JSON-Files
**Neu:** `src/data/style-dictionaries/bold-expressive-v1.json`

```json
{
  "id": "bold-expressive-v1",
  "paradigm": "bold-expressive",
  "rules": {
    "layout": {
      "section_padding": "py-16 md:py-24",
      "max_width": "max-w-7xl mx-auto",
      "columns_max": 4,
      "overlaps_allowed": true,
      "negative_margin_allowed": true,
      "full_bleed_allowed": true,
      "section_transition": "concave-bottom"
    },
    "typography": {
      "heading_font": "font-display",
      "heading_weight": "font-bold",
      "heading_size_hero": "text-4xl md:text-5xl lg:text-[5rem]",
      "heading_size_section": "text-3xl md:text-[3rem]",
      "tracking": "tracking-[-0.025em]",
      "gradient_text_allowed": true
    },
    "color": {
      "base": "mixed",
      "dark_sections_allowed": true,
      "gradient_allowed": true,
      "accent_count_max": 3
    },
    "animation": {
      "budget": "rich",
      "keyframes_allowed": true,
      "scroll_driven_allowed": true,
      "text_animations_allowed": ["word-cycle", "fade-up", "scramble", "typewriter"],
      "hover_effects_allowed": ["scale", "glow", "reveal", "magnetic", "tilt"]
    },
    "decoration": {
      "mesh_gradient": true,
      "glassmorphism": true,
      "border_glow": true,
      "geometric_shapes": true,
      "noise_texture": true,
      "color_overlays": true,
      "diagonal_cuts": true,
      "concave_sections": true
    }
  },
  "forbidden_patterns": [
    "font-serif (kein reguläres serif — nur Display-Serif)",
    "py-40 oder mehr",
    "single-column hero",
    "min-h-screen ohne md: prefix"
  ],
  "required_patterns": [
    "mindestens ein dark-bg Abschnitt",
    "gradient oder glow auf Hero-CTA",
    "animation im sichtbaren Bereich above-fold",
    "alle grids: grid-cols-1 md:grid-cols-X"
  ],
  "html_patterns": {
    "section_wrapper": "<section class=\"relative overflow-hidden isolate py-16 md:py-24\">",
    "container": "<div class=\"max-w-7xl mx-auto px-5 md:px-8\">",
    "eyebrow": "<div class=\"text-[.68rem] font-semibold tracking-[.14em] uppercase text-accent flex items-center gap-2.5 mb-5\"><span class=\"inline-block w-5 h-px bg-accent\"></span>LABEL</div>",
    "hero_h1": "<h1 class=\"font-display font-bold text-4xl md:text-5xl lg:text-[5rem] leading-[1.05] tracking-[-0.025em]\">",
    "cta_primary": "<a href=\"#\" class=\"inline-flex items-center gap-2 px-7 py-4 bg-accent text-white text-sm font-semibold tracking-wide rounded-sm hover:bg-accent/90 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-accent/30 transition-all duration-200\">",
    "dark_section": "<section class=\"relative overflow-hidden isolate bg-primary py-16 md:py-24\">",
    "stat_number": "<div class=\"font-display font-bold text-4xl md:text-5xl text-accent leading-none\" data-target=\"NUMBER\">"
  }
}
```

**Neu:** `src/data/style-dictionaries/minimal-clean-v1.json`

```json
{
  "id": "minimal-clean-v1",
  "paradigm": "minimal-clean",
  "rules": {
    "layout": {
      "section_padding": "py-24 md:py-32",
      "max_width": "max-w-4xl mx-auto",
      "columns_max": 2,
      "overlaps_allowed": false,
      "negative_margin_allowed": false,
      "full_bleed_allowed": false,
      "section_transition": "flat"
    },
    "typography": {
      "heading_font": "font-display",
      "heading_weight": "font-light",
      "heading_size_hero": "text-5xl md:text-7xl",
      "heading_size_section": "text-4xl md:text-5xl",
      "tracking": "tracking-tight",
      "gradient_text_allowed": false
    },
    "color": {
      "base": "light",
      "backgrounds_allowed": ["white", "stone-50", "zinc-50"],
      "dark_sections_allowed": false,
      "gradient_allowed": false,
      "accent_count_max": 1
    },
    "animation": {
      "budget": "none",
      "keyframes_allowed": false,
      "scroll_driven_allowed": false,
      "hover_effects_allowed": ["opacity", "translate-y-0.5"]
    },
    "decoration": {
      "mesh_gradient": false,
      "glassmorphism": false,
      "border_glow": false,
      "geometric_shapes": false,
      "noise_texture": false,
      "color_overlays": false,
      "diagonal_cuts": false,
      "concave_sections": false
    }
  },
  "forbidden_patterns": [
    "bg-gradient-to-*", "backdrop-blur-*", "@keyframes",
    "animate-*", "z-[*]", "-mt-*", "-mb-*", "min-h-screen ohne md:"
  ],
  "required_patterns": [
    "generous whitespace", "single accent color only",
    "max 2 font-size variations per section",
    "alle grids: grid-cols-1 md:grid-cols-X"
  ],
  "html_patterns": {
    "section_wrapper": "<section class=\"relative overflow-hidden isolate py-24 md:py-32 bg-white\">",
    "container": "<div class=\"max-w-4xl mx-auto px-6\">",
    "hero_h1": "<h1 class=\"font-display font-light text-5xl md:text-7xl tracking-tight leading-none\">",
    "cta_primary": "<a href=\"#\" class=\"inline-block px-8 py-4 bg-primary text-white text-sm font-medium rounded-sm hover:opacity-90 transition-opacity\">"
  }
}
```

**Neu:** `src/data/style-dictionaries/tech-dark-v1.json`

```json
{
  "id": "tech-dark-v1",
  "paradigm": "tech-dark",
  "rules": {
    "layout": {
      "section_padding": "py-20 md:py-28",
      "max_width": "max-w-6xl mx-auto",
      "columns_max": 4,
      "overlaps_allowed": true,
      "full_bleed_allowed": true,
      "section_transition": "flat"
    },
    "typography": {
      "heading_font": "font-sans",
      "heading_weight": "font-bold md:font-extrabold",
      "heading_size_hero": "text-5xl md:text-7xl",
      "tracking": "tracking-tighter",
      "gradient_text_allowed": true
    },
    "color": {
      "base": "dark",
      "backgrounds_allowed": ["zinc-950","zinc-900","black"],
      "dark_sections_allowed": true,
      "gradient_allowed": true,
      "accent_count_max": 2
    },
    "animation": {
      "budget": "moderate",
      "keyframes_allowed": true,
      "scroll_driven_allowed": true,
      "text_animations_allowed": ["word-cycle","fade-up","scramble"],
      "hover_effects_allowed": ["scale","glow","reveal"]
    },
    "decoration": {
      "mesh_gradient": true, "glassmorphism": true,
      "border_glow": true, "geometric_shapes": true,
      "noise_texture": true, "grid_lines_background": true
    }
  },
  "forbidden_patterns": ["bg-white","font-serif","py-40 oder mehr","single column hero"],
  "required_patterns": [
    "dark background auf 60%+ der Sections",
    "gradient oder glow accent im Hero",
    "min 1 animated element above fold",
    "alle grids: grid-cols-1 md:grid-cols-X"
  ],
  "html_patterns": {
    "section_wrapper": "<section class=\"relative overflow-hidden isolate bg-zinc-900 py-20 md:py-28\">",
    "container": "<div class=\"max-w-6xl mx-auto px-5 md:px-8\">",
    "hero_h1": "<h1 class=\"font-sans font-extrabold text-5xl md:text-7xl tracking-tighter leading-[1.05] text-white\">",
    "gradient_text": "<span class=\"bg-gradient-to-r from-cyan-400 to-sky-400 bg-clip-text text-transparent\">",
    "glass_card": "<div class=\"backdrop-blur-md bg-white/10 border border-white/10 rounded-2xl shadow-xl p-6\">"
  }
}
```

**Neu:** `src/data/style-dictionaries/luxury-editorial-v1.json`

```json
{
  "id": "luxury-editorial-v1",
  "paradigm": "luxury-editorial",
  "rules": {
    "layout": {
      "section_padding": "py-28 md:py-40",
      "max_width": "max-w-5xl mx-auto",
      "columns_max": 2,
      "overlaps_allowed": false,
      "asymmetric_allowed": true,
      "section_transition": "flat"
    },
    "typography": {
      "heading_font": "font-display",
      "heading_weight": "font-light",
      "heading_size_hero": "text-6xl md:text-8xl",
      "tracking": "tracking-tight",
      "gradient_text_allowed": false
    },
    "color": {
      "base": "light",
      "backgrounds_allowed": ["white","stone-50","amber-50"],
      "dark_sections_allowed": false,
      "gradient_allowed": false,
      "accent_count_max": 1
    },
    "animation": {
      "budget": "subtle",
      "keyframes_allowed": false,
      "scroll_driven_allowed": false,
      "hover_effects_allowed": ["opacity"]
    },
    "decoration": {
      "mesh_gradient": false, "glassmorphism": false,
      "geometric_shapes": false, "noise_texture": false
    }
  },
  "forbidden_patterns": [
    "bg-gradient-*","animate-*","font-bold above font-medium",
    "rounded-full on cards","multiple accent colors"
  ],
  "required_patterns": [
    "extreme whitespace", "serif typography dominant",
    "single thin accent line as decoration",
    "alle grids: grid-cols-1 md:grid-cols-X"
  ],
  "html_patterns": {
    "section_wrapper": "<section class=\"relative overflow-hidden isolate py-28 md:py-40 bg-white\">",
    "hero_h1": "<h1 class=\"font-display font-light text-6xl md:text-8xl tracking-tight leading-none\">",
    "accent_line": "<div class=\"w-8 h-px bg-accent mb-8\"></div>"
  }
}
```

---

### Modul 2 — OpenAI Provider + MODEL_CONFIG

#### 2.1 Provider Interface
**Neu:** `src/lib/ai/types.ts`

```typescript
export interface CompletionParams {
  model: string; system?: string
  messages: Array<{ role: 'user'|'assistant'; content: string }>
  max_tokens: number; temperature?: number
  response_format?: { type: 'json_object'|'text' }
}

export interface AIProvider {
  complete(params: CompletionParams): Promise<string>
  stream(params: CompletionParams, onChunk: (chunk: string) => void): Promise<string>
}
```

**Neu:** `src/lib/ai/openaiProvider.ts`

```typescript
import OpenAI from 'openai'
import { AIProvider, CompletionParams } from './types'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export class OpenAIProvider implements AIProvider {
  async complete(params: CompletionParams): Promise<string> {
    const isO = params.model.startsWith('o4') || params.model.startsWith('o3')
    const res = await client.chat.completions.create({
      model: params.model,
      messages: [
        ...(params.system ? [{ role: 'system' as const, content: params.system }] : []),
        ...params.messages,
      ],
      ...(isO
        ? { max_completion_tokens: params.max_tokens }
        : { max_tokens: params.max_tokens, temperature: params.temperature }),
      ...(params.response_format ? { response_format: params.response_format } : {}),
    })
    return res.choices[0]?.message?.content ?? ''
  }

  async stream(params: CompletionParams, onChunk: (c: string) => void): Promise<string> {
    let full = ''
    const stream = await client.chat.completions.create({
      model: params.model,
      messages: [
        ...(params.system ? [{ role: 'system' as const, content: params.system }] : []),
        ...params.messages,
      ],
      max_tokens: params.max_tokens,
      temperature: params.temperature,
      stream: true,
    })
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? ''
      if (delta) { full += delta; onChunk(delta) }
    }
    return full
  }
}
```

#### 2.2 MODEL_CONFIG — OpenAI-only
**Neu:** `src/lib/ai/models.ts`

```typescript
import { OpenAIProvider } from './openaiProvider'

export const MODEL_CONFIG = {
  // Manifest: GPT-4.1 + json_object — deterministisch, strukturiert
  manifest_generation: {
    model: 'gpt-4.1', max_tokens: 4000, temperature: 0.2,
    response_format: { type: 'json_object' as const },
  },
  // Pass 1: Struktur + Inhalt — 128K output, kein Abschneiden
  pass1_structure: {
    model: 'gpt-4.1', max_tokens: 8192, temperature: 0.4,
  },
  // Pass 2: Visual Layer — mehr Kreativität erlaubt
  pass2_visual: {
    model: 'gpt-4.1', max_tokens: 6000, temperature: 0.65,
  },
  // Pass 3: Validator — kein temperature, json_object zwingend
  pass3_validator: {
    model: 'o4-mini', max_tokens: 2000,
    response_format: { type: 'json_object' as const },
  },
  // Vision: Screenshot-Analyse
  screenshot_analysis: {
    model: 'gpt-4o', max_tokens: 2000, temperature: 0.1,
    response_format: { type: 'json_object' as const },
  },
} as const

export const provider = new OpenAIProvider()
```

---

### Modul 3 — Vollständige LLM-Prompts & 3-Pass Pipeline

Dies ist das kritischste Modul. Jede Funktion ist vollständig implementiert.

#### 3.1 Prompt-Builder Funktionen
**Neu:** `src/lib/generation/prompts.ts`

```typescript
import { SiteManifest, StyleDictionary } from '../types/manifest'

// ═══════════════════════════════════════════════════════
// MANIFEST GENERATION PROMPT
// ═══════════════════════════════════════════════════════

export const MANIFEST_SYSTEM = `You are a design system architect. Generate a complete Site Manifest as JSON.
RULES:
- Respond with ONLY valid JSON. No text, no markdown, no explanation.
- All colors as exact hex values (#RRGGBB).
- All Tailwind classes as exact strings ("text-4xl md:text-5xl").
- All font names in CSS format ("'Inter', sans-serif").`

export function buildManifestPrompt(input: {
  company_name: string; industry: string; adjectives: string[]
  tone: string; primary_cta: string; personas: string[]
  pain_points: string[]; style_paradigm: string
  animation_budget: string; navbar_style: string
  navbar_mobile: string; brand_colors?: Record<string, string>
}): string {
  return `Generate a SiteManifest JSON for this project:

Company: ${input.company_name}
Industry: ${input.industry}
Adjectives: ${input.adjectives.join(', ')}
Tone: ${input.tone}
Primary CTA: ${input.primary_cta}
Personas: ${input.personas.join('; ')}
Pain Points: ${input.pain_points.join('; ')}
Style Paradigm: ${input.style_paradigm}
Animation Budget: ${input.animation_budget}
Navbar Style: ${input.navbar_style}
Navbar Mobile: ${input.navbar_mobile}
${input.brand_colors ? `Brand Colors (MUST USE EXACTLY): ${JSON.stringify(input.brand_colors)}` : ''}

Generate the manifest following this exact schema:
{
  "id": "uuid-here",
  "version": "2.0",
  "site": {
    "name": "${input.company_name}",
    "language": "de",
    "industry": "${input.industry}",
    "tone": "${input.tone}",
    "adjectives": ${JSON.stringify(input.adjectives)},
    "primary_cta_goal": "describe-goal"
  },
  "design_tokens": {
    "colors": {
      "primary": "#hex",
      "secondary": "#hex",
      "accent": "#hex",
      "highlight": "#hex",
      "background": "#hex",
      "surface": "#hex",
      "dark": "#hex",
      "text": "#hex",
      "text_muted": "#hex",
      "_source": "${input.brand_colors ? 'user-brand' : 'ai-generated'}"
    },
    "typography": {
      "font_heading": "Google Font name in CSS format",
      "font_body": "'Inter', sans-serif",
      "heading_weight": "700",
      "tracking_heading": "-0.025em",
      "line_height_heading": "1.05",
      "_source": "ai-generated"
    },
    "type_scale": {
      "hero_h1": "text-4xl md:text-5xl lg:text-[5rem]",
      "section_h2": "text-3xl md:text-[3rem]",
      "card_h3": "text-sm md:text-base",
      "body": "text-sm md:text-base",
      "eyebrow": "text-[.68rem] font-semibold tracking-[.14em] uppercase",
      "cta_button": "text-xs md:text-sm font-semibold tracking-wide"
    },
    "spacing": {
      "section_padding_light": "py-16 md:py-24",
      "section_padding_heavy": "py-14 md:py-24",
      "container_max": "max-w-7xl mx-auto",
      "container_padding": "px-5 md:px-8"
    }
  },
  "style_paradigm": "${input.style_paradigm}",
  "style_dictionary_ref": "${input.style_paradigm}-v1",
  "navbar": {
    "style": "${input.navbar_style}",
    "scroll_threshold_px": 40,
    "height": "h-16",
    "layout_desktop": "logo-left nav-center cta-right",
    "mobile_menu": "${input.navbar_mobile}",
    "cta_button": true,
    "cta_label": "${input.primary_cta}",
    "links": ["Leistungen", "Ablauf", "Kontakt"]
  },
  "pages": [
    {
      "id": "home",
      "slug": "index",
      "title": "Startseite",
      "sections": ["hero", "pain-points", "services", "process", "cta"],
      "meta_description": "Write a compelling meta description"
    }
  ],
  "content": {
    "company_name": "${input.company_name}",
    "company_usp": "Write compelling USP based on adjectives and tone",
    "primary_cta": "${input.primary_cta}",
    "secondary_cta": "Mehr erfahren",
    "personas": ${JSON.stringify(input.personas)},
    "pain_points": ${JSON.stringify(input.pain_points)},
    "trust_signals": ["Generate 4 compelling trust signals"]
  },
  "pass1_prompt_rules": {
    "rules": [
      "NO inline style for layout — Tailwind classes only",
      "inline style ONLY for CSS Custom Properties: style='color: var(--color-accent)'",
      "Every grid: grid-cols-1 base, then md:/lg: breakpoints",
      "Split sections: primary content DOM-first (H1+CTA mobile top)",
      "order-X ONLY for secondary content — NEVER on H1, H2, forms",
      "min-h-screen ALWAYS as md:min-h-screen",
      "All interactive elements: min h-11 mobile (py-3 minimum)",
      "Use CSS Custom Properties: var(--color-primary), var(--color-accent)",
      "Animation placeholders: <!-- [ANIM: word-cycle | words: [...]] -->",
      "Background placeholders: <!-- [BG: geometric-shapes | opacity: 0.1] -->",
      "NO @keyframes in Pass 1 — that is Pass 2 responsibility",
      "Output ONLY HTML, no markdown, no comments outside HTML"
    ]
  },
  "pass3_auto_flags": [
    "style='' contains grid/flex/column/height → layout in inline style",
    "grid-cols-X without preceding grid-cols-1 → no mobile-first grid",
    "min-h-screen without md: prefix → full height on mobile too",
    "order-1 on element containing h1/h2/form → primary content reordered",
    "button or a without py-3+ → touch target too small",
    "@keyframes outside prefers-reduced-motion guard → unprotected animation",
    "img without alt attribute → missing alt text",
    "icon-only button without aria-label → missing ARIA"
  ],
  "generated_at": "${new Date().toISOString()}",
  "_decision_log": {
    "paradigm": "${input.style_paradigm} — user selected",
    "colors": "${input.brand_colors ? 'user brand colors — not overwritten' : 'ai-generated from industry+tone'}",
    "navbar": "${input.navbar_style} — user selected in briefing wizard"
  }
}`
}

// ═══════════════════════════════════════════════════════
// PASS 1 — STRUCTURE PROMPT
// ═══════════════════════════════════════════════════════

export function buildPass1System(dict: StyleDictionary, manifest: SiteManifest): string {
  const tokens = manifest.design_tokens
  return `You are a precision HTML developer building section scaffolding. Structure and content only — NO animations, NO @keyframes, NO fancy backgrounds.

OUTPUT FORMAT: Respond with ONLY raw HTML starting with < and ending with >. No markdown, no code fences, no explanation.

STYLE DICTIONARY — MANDATORY CONSTRAINTS:
Paradigm: ${dict.paradigm}
Forbidden patterns (NEVER use): ${JSON.stringify(dict.forbidden_patterns)}
Required patterns (ALWAYS include): ${JSON.stringify(dict.required_patterns)}

CSS CUSTOM PROPERTIES (use these, never hardcode hex values):
:root {
  --color-primary:   ${tokens.colors.primary};
  --color-secondary: ${tokens.colors.secondary};
  --color-accent:    ${tokens.colors.accent};
  --color-highlight: ${tokens.colors.highlight};
  --color-background:${tokens.colors.background};
  --color-surface:   ${tokens.colors.surface};
  --color-dark:      ${tokens.colors.dark};
  --color-text:      ${tokens.colors.text};
  --color-muted:     ${tokens.colors.text_muted};
  --font-heading:    ${tokens.typography.font_heading};
  --font-body:       ${tokens.typography.font_body};
}

TAILWIND CONFIG (these classes map to CSS vars):
- text-primary = var(--color-primary)
- text-accent  = var(--color-accent)
- bg-primary   = var(--color-primary)
- font-display = var(--font-heading)

LAYOUT RULES (non-negotiable):
${manifest.pass1_prompt_rules.rules.map(r => '- ' + r).join('\n')}

SECTION HTML PATTERNS from Style Dictionary:
${Object.entries(dict.html_patterns).map(([k,v]) => `${k}: ${v}`).join('\n')}

PLACEHOLDER SYNTAX for Pass 2:
- Animation: <!-- [ANIM: word-cycle | words: ["Option1","Option2","Option3"]] -->
- Background: <!-- [BG: geometric-shapes | color: primary | opacity: 0.06] -->
- Blob:       <!-- [BG: blob-morph | fill: accent | opacity: 0.15] -->
- Wave:       <!-- [TRANSITION: wave-bottom | next: white] -->`
}

export function buildPass1User(input: {
  section_type: string; manifest: SiteManifest
  content_brief: string; rag_reference: string | null
}): string {
  const { manifest } = input
  return `Generate a "${input.section_type}" section for:

Company: ${manifest.content.company_name}
USP: ${manifest.content.company_usp}
Tone: ${manifest.site.tone}
Adjectives: ${manifest.site.adjectives.join(', ')}
Primary CTA: ${manifest.content.primary_cta}
Pain Points: ${manifest.content.pain_points.join('; ')}
Trust Signals: ${manifest.content.trust_signals.join(' · ')}
${input.content_brief ? `Specific instructions: ${input.content_brief}` : ''}

Section type rules:
- Root element MUST have: overflow-hidden isolate classes
- Root element MUST have: position relative
- Section padding: ${manifest.design_tokens.spacing.section_padding_heavy}
- Container: ${manifest.design_tokens.spacing.container_max} ${manifest.design_tokens.spacing.container_padding}
${input.rag_reference ? `\nQUALITY REFERENCE (match or exceed this quality — do not copy verbatim):\n${input.rag_reference}` : ''}`
}

// ═══════════════════════════════════════════════════════
// PASS 2 — VISUAL LAYER PROMPT
// ═══════════════════════════════════════════════════════

export function buildPass2System(dict: StyleDictionary): string {
  return `You are a visual developer enhancing HTML sections with animations and decorative layers.
You receive complete HTML and must resolve placeholder comments into real implementations.

OUTPUT FORMAT: Complete HTML only. No markdown, no explanation.

YOUR TASKS:
1. Replace <!-- [ANIM: word-cycle | words: [...]] --> with working JS word-cycle implementation
2. Replace <!-- [BG: geometric-shapes | ...] --> with SVG background in absolute positioned div
3. Replace <!-- [TRANSITION: wave-bottom | next: COLOR] --> with SVG wave at section bottom
4. Add @keyframes in a <style> block at the top of the section
5. ALL @keyframes MUST be inside: @media (prefers-reduced-motion: no-preference) { }
6. Add counter-tick behavior (data-target attribute + IntersectionObserver JS) to stat numbers
7. All JS MUST be in IIFE: ;(function(){ YOUR CODE })();

ANIMATION BUDGET: ${dict.rules.animation.budget}
Allowed text animations: ${JSON.stringify(dict.rules.animation.text_animations_allowed ?? [])}
Allowed hover effects: ${JSON.stringify(dict.rules.animation.hover_effects_allowed ?? [])}
Keyframes allowed: ${dict.rules.animation.keyframes_allowed}

FORBIDDEN in this pass:
- Do NOT change any HTML structure
- Do NOT change any text content
- Do NOT change any Tailwind classes
- Do NOT add new sections or remove elements
- ONLY resolve placeholders and add visual layer

WORD-CYCLE IMPLEMENTATION PATTERN:
<style>
@media (prefers-reduced-motion: no-preference) {
  @keyframes wordOut { to { opacity:0; transform:translateY(-7px); } }
  @keyframes wordIn  { from { opacity:0; transform:translateY(7px); } to { opacity:1; transform:translateY(0); } }
  .word-out { animation: wordOut .22s ease forwards; }
  .word-in  { animation: wordIn  .22s ease forwards; }
}
</style>
<!-- Add id="wordCycle" to the target span, then: -->
<script>;(function(){
  var el=document.getElementById('wordCycle');
  if(!el)return;
  var words=['Word1','Word2','Word3'];
  var i=0;
  var reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduced)return;
  setInterval(function(){
    el.classList.add('word-out');
    setTimeout(function(){
      i=(i+1)%words.length;
      el.textContent=words[i];
      el.classList.remove('word-out');
      el.classList.add('word-in');
      setTimeout(function(){ el.classList.remove('word-in'); },230);
    },220);
  },3200);
})();</script>

COUNTER-TICK PATTERN (for elements with data-target="NUMBER"):
<script>;(function(){
  var reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduced)return;
  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(!e.isIntersecting)return;
      var el=e.target,end=parseInt(el.dataset.target),dur=1400,t0=performance.now();
      (function tick(now){
        var p=Math.min((now-t0)/dur,1),v=1-Math.pow(1-p,3);
        el.textContent=Math.floor(v*end)+'+';
        if(p<1)requestAnimationFrame(tick);
      })(t0);
      io.unobserve(el);
    });
  },{threshold:0.5});
  document.querySelectorAll('[data-target]').forEach(function(el){ io.observe(el); });
})();</script>

GEOMETRIC SHAPES SVG PATTERN:
<div class="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true" style="z-index:0">
  <svg class="w-full h-full" viewBox="0 0 600 600" preserveAspectRatio="xMidYMid slice">
    <!-- Rotating circles, dot clusters, diagonal lines as per paradigm -->
  </svg>
</div>

CONCAVE BOTTOM TRANSITION (Unzer-style):
<style>
.section-concave { position: relative; overflow: hidden; }
.section-concave::after {
  content: ''; position: absolute;
  bottom: -60px; left: -5%; right: -5%;
  height: 100px; background: NEXT_COLOR; border-radius: 50%;
}
</style>`
}

export function buildPass2User(pass1Html: string, manifest: SiteManifest): string {
  return `Enhance this HTML section with the visual layer. Resolve all placeholder comments.
Company context: ${manifest.content.company_name}, style: ${manifest.style_paradigm}
Colors: primary=${manifest.design_tokens.colors.primary}, accent=${manifest.design_tokens.colors.accent}

HTML TO ENHANCE:
${pass1Html}`
}

// ═══════════════════════════════════════════════════════
// PASS 3 — VALIDATOR PROMPT
// ═══════════════════════════════════════════════════════

export const PASS3_SYSTEM = `You are an HTML/CSS validator. Respond ONLY with JSON matching this exact schema:
{
  "valid": boolean,
  "score": number (0-100),
  "errors": [{ "type": string, "message": string, "severity": "error"|"warning", "auto_fixable": boolean }]
}
No markdown, no explanation, no other keys.`

export function buildPass3User(html: string, dict: StyleDictionary, manifest: SiteManifest): string {
  return `Validate this HTML section against all checks.

FORBIDDEN PATTERNS (from style dictionary — flag if found):
${JSON.stringify(dict.forbidden_patterns)}

AUTO-FLAG RULES (from manifest):
${manifest.pass3_auto_flags.map((r,i) => `${i+1}. ${r}`).join('\n')}

CHECKLIST:
1. All img have alt="" attribute?
2. All icon-only buttons have aria-label?
3. @keyframes exist outside @media(prefers-reduced-motion:no-preference)?
4. style="" contains layout properties (grid/flex/width/height)?
5. grid-cols-X used without preceding grid-cols-1?
6. min-h-screen without md: prefix?
7. order-1 on element containing h1, h2, or form?
8. button or a element without py-3 or min-h-11?
9. Any forbidden patterns from style dictionary present?
10. CSS Custom Properties used correctly (var(--color-*) syntax)?
11. All inline scripts wrapped in IIFE?
12. section root element has overflow-hidden and isolate classes?
13. img missing loading="lazy"?

For each issue found: set auto_fixable: true if it can be fixed with string-replace.
Calculate score: start at 100, subtract 10 per error, 3 per warning.

HTML TO VALIDATE:
${html.slice(0, 8000)}`
}
```

#### 3.2 Auto-Fix Engine
**Neu:** `src/lib/generation/autoFix.ts`

```typescript
import { ValidationError } from '../types/manifest'

export function safeParseJson<T>(raw: string): T | null {
  const cleaned = raw
    .replace(/^```json\s*/i, '').replace(/\s*```$/i, '')
    .replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim()
  try { return JSON.parse(cleaned) } catch { return null }
}

export function autoFix(html: string, errors: ValidationError[]): string {
  let fixed = html

  for (const err of errors.filter(e => e.auto_fixable)) {
    switch (err.type) {
      case 'missing-alt':
        fixed = fixed.replace(/<img(?![^>]*\balt=)([^>]*)>/g,
          '<img alt=""$1>')
        break
      case 'missing-loading-lazy':
        fixed = fixed.replace(/<img(?![^>]*\bloading=)([^>]*)>/g,
          '<img loading="lazy"$1>')
        break
      case 'missing-aria-label':
        fixed = fixed.replace(
          /<button([^>]*)>(\s*<svg[^>]*>[\s\S]*?<\/svg>\s*)<\/button>/g,
          (match, attrs, content) =>
            attrs.includes('aria-label') ? match
              : `<button${attrs} aria-label="Action">${content}</button>`
        )
        break
      case 'missing-reduced-motion':
        // Wrap bare @keyframes in reduced-motion guard
        fixed = fixed.replace(
          /(@keyframes\s+\w+\s*\{[\s\S]*?\})/g,
          '@media (prefers-reduced-motion: no-preference) { $1 }'
        )
        break
      case 'missing-overflow-hidden':
        // Add overflow-hidden isolate to root section
        fixed = fixed.replace(
          /<section\b([^>]*)class="([^"]*)"([^>]*)>/,
          (match, pre, cls, post) =>
            cls.includes('overflow-hidden') ? match
              : `<section${pre}class="${cls} overflow-hidden isolate"${post}>`
        )
        break
    }
  }

  return fixed
}
```

#### 3.3 Complete Section Generator
**Neu:** `src/lib/generation/sectionGenerator.ts`

```typescript
import { SiteManifest, ValidationResult, ValidationError } from '../types/manifest'
import { loadStyleDictionary } from '../style/styleDictionary'
import { provider, MODEL_CONFIG } from '../ai/models'
import {
  MANIFEST_SYSTEM, buildManifestPrompt,
  buildPass1System, buildPass1User,
  buildPass2System, buildPass2User,
  PASS3_SYSTEM, buildPass3User
} from './prompts'
import { safeParseJson, autoFix } from './autoFix'
import { findBestReference } from '../sections/sectionLibrary'

export interface SectionGenerationResult {
  html: string; pass1_html: string; pass2_html: string
  validation_score: number; validation_errors: ValidationError[]
  duration_ms: number; passes_run: number
}

export async function generateSection(input: {
  section_type: string; manifest: SiteManifest; content_brief?: string
}): Promise<SectionGenerationResult> {
  const t0 = Date.now()
  const dict = loadStyleDictionary(input.manifest.style_paradigm)
  const ragRef = findBestReference(input.section_type, input.manifest)

  // ── PASS 1: Structure ──────────────────────────────────────────
  const pass1Html = await provider.complete({
    model:       MODEL_CONFIG.pass1_structure.model,
    system:      buildPass1System(dict, input.manifest),
    messages:    [{ role: 'user', content: buildPass1User({
      section_type:  input.section_type,
      manifest:      input.manifest,
      content_brief: input.content_brief ?? '',
      rag_reference: ragRef,
    })}],
    max_tokens:  MODEL_CONFIG.pass1_structure.max_tokens,
    temperature: MODEL_CONFIG.pass1_structure.temperature,
  })

  // ── PASS 2: Visual Layer (only when animation budget > none) ───
  let pass2Html = pass1Html
  let passesRun = 1

  if (dict.rules.animation.budget !== 'none') {
    pass2Html = await provider.complete({
      model:       MODEL_CONFIG.pass2_visual.model,
      system:      buildPass2System(dict),
      messages:    [{ role: 'user', content: buildPass2User(pass1Html, input.manifest) }],
      max_tokens:  MODEL_CONFIG.pass2_visual.max_tokens,
      temperature: MODEL_CONFIG.pass2_visual.temperature,
    })
    passesRun = 2
  }

  // ── PASS 3: Validate ───────────────────────────────────────────
  const validationRaw = await provider.complete({
    model:           MODEL_CONFIG.pass3_validator.model,
    system:          PASS3_SYSTEM,
    messages:        [{ role: 'user', content: buildPass3User(pass2Html, dict, input.manifest) }],
    max_tokens:      MODEL_CONFIG.pass3_validator.max_tokens,
    response_format: MODEL_CONFIG.pass3_validator.response_format,
  })
  passesRun = 3

  const validation = safeParseJson<ValidationResult>(validationRaw)
  const finalHtml  = autoFix(pass2Html, validation?.errors ?? [])

  return {
    html:              finalHtml,
    pass1_html:        pass1Html,
    pass2_html:        pass2Html,
    validation_score:  validation?.score ?? 0,
    validation_errors: validation?.errors ?? [],
    duration_ms:       Date.now() - t0,
    passes_run:        passesRun,
  }
}

// ── Parallel Page Generation ───────────────────────────────────
export async function generatePage(
  page: SiteManifest['pages'][0],
  manifest: SiteManifest,
  onProgress?: (section: string, status: 'start'|'done', score?: number) => void
): Promise<{ section_type: string; html: string; score: number }[]> {

  // All sections in parallel — Pass 1 is independent per section
  const results = await Promise.all(
    page.sections.map(async (sectionType) => {
      onProgress?.(sectionType, 'start')
      const result = await generateSection({ section_type: sectionType, manifest })
      onProgress?.(sectionType, 'done', result.validation_score)
      return { section_type: sectionType, html: result.html, score: result.validation_score }
    })
  )

  return results
}

// ── Manifest Generator ─────────────────────────────────────────
export async function generateManifest(input: Parameters<typeof buildManifestPrompt>[0]): Promise<SiteManifest> {
  const raw = await provider.complete({
    model:           MODEL_CONFIG.manifest_generation.model,
    system:          MANIFEST_SYSTEM,
    messages:        [{ role: 'user', content: buildManifestPrompt(input) }],
    max_tokens:      MODEL_CONFIG.manifest_generation.max_tokens,
    temperature:     MODEL_CONFIG.manifest_generation.temperature,
    response_format: MODEL_CONFIG.manifest_generation.response_format,
  })

  const manifest = safeParseJson<SiteManifest>(raw)
  if (!manifest) throw new Error('Manifest generation failed — invalid JSON response')

  // Guarantee: id and generated_at always set
  manifest.id           = manifest.id || crypto.randomUUID()
  manifest.generated_at = new Date().toISOString()

  // Override with user brand colors if provided
  if (input.brand_colors) {
    Object.assign(manifest.design_tokens.colors, input.brand_colors)
    manifest.design_tokens.colors._source = 'user-brand'
    manifest._decision_log.colors = 'User-provided brand colors — not overwritten'
  }

  return manifest
}
```

#### 3.4 Style Dictionary Loader
**Neu:** `src/lib/style/styleDictionary.ts`

```typescript
import { StyleDictionary } from '../types/manifest'
import { StyleParadigm } from '../types/manifest'

const cache = new Map<string, StyleDictionary>()

export function loadStyleDictionary(paradigm: StyleParadigm): StyleDictionary {
  if (cache.has(paradigm)) return cache.get(paradigm)!
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const dict = require(`../../data/style-dictionaries/${paradigm}-v1.json`) as StyleDictionary
  cache.set(paradigm, dict)
  return dict
}
```

---

### Modul 4 — API Routes (v2, neben bestehendem v1)

#### 4.1 Manifest Route
**Neu:** `src/app/api/v2/manifest/route.ts`

```typescript
import { NextRequest } from 'next/server'
import { generateManifest } from '@/lib/generation/sectionGenerator'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const input = await req.json()
  if (!input.company_name || !input.style_paradigm) {
    return Response.json({ error: 'company_name and style_paradigm required' }, { status: 400 })
  }
  const manifest = await generateManifest(input)
  return Response.json({ manifest })
}
```

#### 4.2 Section Generation Route with SSE
**Neu:** `src/app/api/v2/generate/route.ts`

```typescript
import { NextRequest } from 'next/server'
import { generateSection } from '@/lib/generation/sectionGenerator'
import { SiteManifest } from '@/lib/types/manifest'

export const runtime    = 'nodejs'
export const maxDuration = 120

export async function POST(req: NextRequest) {
  const { manifest, section_type, content_brief } = await req.json() as {
    manifest: SiteManifest; section_type: string; content_brief?: string
  }

  const encoder = new TextEncoder()
  const stream  = new TransformStream()
  const writer  = stream.writable.getWriter()

  const send = (event: string, data: object) =>
    writer.write(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))

  ;(async () => {
    try {
      send('status', { phase: 'pass1', message: 'Struktur wird generiert...' })

      const result = await generateSection({ section_type, manifest, content_brief })

      send('pass1',  { html: result.pass1_html })

      if (result.passes_run >= 2) {
        send('status', { phase: 'pass2', message: 'Visual Layer wird hinzugefügt...' })
        send('pass2',  { html: result.pass2_html })
      }

      send('status',   { phase: 'pass3', message: 'Validierung läuft...' })
      send('complete', {
        html:              result.html,
        validation_score:  result.validation_score,
        validation_errors: result.validation_errors,
        duration_ms:       result.duration_ms,
        passes_run:        result.passes_run,
      })
    } catch (err) {
      send('error', { message: err instanceof Error ? err.message : 'Unknown error' })
    } finally {
      writer.close()
    }
  })()

  return new Response(stream.readable, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
    },
  })
}
```

#### 4.3 Store Integration
**Bestehend ändern:** `src/lib/store.ts` — folgende Zeilen hinzufügen:

```typescript
// 1. Import hinzufügen (oben):
import { SiteManifest } from './types/manifest'

// 2. In BuilderStore interface hinzufügen:
manifest: SiteManifest | null
setManifest: (m: SiteManifest) => void
clearManifest: () => void

// 3. Im create() initial state:
manifest: null,

// 4. Im create() actions:
setManifest: (m) => set({ manifest: m }),
clearManifest: () => set({ manifest: null }),

// 5. In partialize (persist) hinzufügen:
manifest: s.manifest,
```

#### 4.4 Builder UI — v2 API nutzen
**Bestehend ändern:** `src/app/builder/page.tsx`

Die bestehende Generierungslogik ruft `/api/generate` auf. Neue Logik:

```typescript
// In der handleGenerate Funktion — NEUES Verhalten wenn manifest vorhanden:
const manifest = useBuilderStore(s => s.manifest)

async function handleGenerateV2(sectionType: string) {
  if (!manifest) {
    // Fallback: bestehende v1 API
    return handleGenerateV1(sectionType)
  }

  // v2: SSE stream mit Manifest-Kontext
  const res = await fetch('/api/v2/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ manifest, section_type: sectionType }),
  })

  const reader = res.body!.getReader()
  const dec    = new TextDecoder()
  let   buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += dec.decode(value)
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = JSON.parse(line.slice(6))

      if (line.startsWith('event: pass1') || line.startsWith('event: complete')) {
        // Update preview with latest HTML
        updateSectionHtml(sectionId, data.html)
      }
    }
  }
}
```

---

### Modul 5 — Briefing Wizard

#### 5.1 Seite
**Neu:** `src/app/briefing/page.tsx`

4-Step Wizard. Jeder Step ist eine eigene Komponente. State im lokalen useState, bei Submit → `generateManifest()` → `setManifest()` im Store.

```typescript
'use client'
import { useState } from 'react'
import { useBuilderStore } from '@/lib/store'
import { generateManifest } from '@/lib/generation/sectionGenerator'
import { StyleParadigm } from '@/lib/types/manifest'
import { useRouter } from 'next/navigation'

// Step state shapes (alle optional mit defaults):
const ADJECTIVE_OPTIONS = ['Vertrauenswürdig','Modern & frisch','Persönlich & nahbar','Ambitioniert','Luxury','Playful','Technical','Minimal']
const INDUSTRY_OPTIONS  = ['recruiting-b2b','saas-tech','construction','e-commerce','consulting-law','real-estate','healthcare','creative-agency']
const PARADIGM_OPTIONS: { id: StyleParadigm; label: string; desc: string; colors: string[] }[] = [
  { id: 'bold-expressive',  label: 'Bold & Expressive',  desc: 'Loud, Overlaps, Display-Font, rich Animations',   colors: ['#1B2B4B','#E85D30','#F5C842','#F5F0E8'] },
  { id: 'minimal-clean',    label: 'Minimal & Clean',     desc: 'Whitespace, Serif, 1 Accent, no Animations',      colors: ['#1A1A1A','#F5F0E8','#6B7280','#FFFFFF'] },
  { id: 'tech-dark',        label: 'Tech / Dark',         desc: 'Dark Mode, Gradients, Glassmorphism, Mono-Font',  colors: ['#18181B','#06B6D4','#8B5CF6','#FFFFFF'] },
  { id: 'luxury-editorial', label: 'Luxury / Editorial',  desc: 'Large Serif, Extreme Whitespace, Minimal Deco',   colors: ['#1A1A1A','#FAFAF8','#D4A853','#6B7280'] },
]

export default function BriefingPage() {
  const router = useRouter()
  const setManifest = useBuilderStore(s => s.setManifest)
  const [step, setStep]         = useState(1)
  const [generating, setGen]    = useState(false)
  const [form, setForm]         = useState({
    company_name: '', industry: 'saas-tech', adjectives: [] as string[],
    tone: 'professional', primary_cta: 'Jetzt starten',
    personas: [''], pain_points: [''],
    style_paradigm: 'bold-expressive' as StyleParadigm,
    animation_budget: 'rich' as const,
    navbar_style: 'sticky-blur', navbar_mobile: 'hamburger-dropdown',
    brand_colors: undefined as Record<string,string> | undefined,
  })

  async function handleSubmit() {
    setGen(true)
    try {
      const manifest = await generateManifest({ ...form })
      setManifest(manifest)
      router.push('/builder')
    } finally {
      setGen(false)
    }
  }

  // Render steps 1–4 with form fields
  // Step 1: company_name, industry
  // Step 2: adjectives (toggle chips), tone, primary_cta, personas, pain_points
  // Step 3: style_paradigm (visual cards), animation_budget (3 buttons)
  // Step 4: navbar_style, navbar_mobile, brand_colors (optional hex inputs)
  // Step 5: Preview + Generate button
  return (/* JSX hier */)
}
```

---

### Modul 6 — Section Library & Transitions

#### 6.1 Section Library
**Neu:** `src/data/section-library/index.json`

```json
[]
```
*(Startet leer — wird durch Feedback-Loop gefüllt wenn gute Sections manuell kuratiert werden)*

**Neu:** `src/lib/sections/sectionLibrary.ts`

```typescript
import { readFileSync, existsSync } from 'fs'
import path from 'path'
import { SiteManifest, StyleParadigm } from '../types/manifest'

interface SectionMeta {
  id: string; type: string; paradigm: StyleParadigm
  quality_score: number; tags: string[]; industries: string[]
}

export function findBestReference(
  section_type: string,
  manifest: SiteManifest
): string | null {
  try {
    const indexPath = path.join(process.cwd(), 'src/data/section-library/index.json')
    if (!existsSync(indexPath)) return null

    const index: SectionMeta[] = JSON.parse(readFileSync(indexPath, 'utf-8'))
    const candidates = index.filter(s =>
      s.type === section_type &&
      s.paradigm === manifest.style_paradigm &&
      s.quality_score >= 4
    ).sort((a, b) => b.quality_score - a.quality_score)

    if (!candidates.length) return null

    const htmlPath = path.join(process.cwd(), `src/data/section-library/sections/${candidates[0].id}.html`)
    if (!existsSync(htmlPath)) return null

    return readFileSync(htmlPath, 'utf-8').slice(0, 600)
  } catch {
    return null // Library not populated yet — graceful fallback
  }
}
```

#### 6.2 assembler.ts erweitern
**Bestehend ändern:** `src/lib/assembler.ts` — `assemblePage()` um CSS Custom Properties ergänzen:

```typescript
// Neue Funktion hinzufügen:
export function assemblePageWithManifest(
  title: string,
  sections: Section[],
  manifest: SiteManifest
): string {
  const tokens = manifest.design_tokens
  const cssVars = `
    :root {
      --color-primary:    ${tokens.colors.primary};
      --color-secondary:  ${tokens.colors.secondary};
      --color-accent:     ${tokens.colors.accent};
      --color-highlight:  ${tokens.colors.highlight};
      --color-background: ${tokens.colors.background};
      --color-surface:    ${tokens.colors.surface};
      --color-dark:       ${tokens.colors.dark};
      --color-text:       ${tokens.colors.text};
      --color-muted:      ${tokens.colors.text_muted};
      --font-heading:     ${tokens.typography.font_heading};
      --font-body:        ${tokens.typography.font_body};
    }
    body { background: var(--color-background); color: var(--color-text); }
    .font-display { font-family: var(--font-heading); }
  `
  // Fonts aus typography extrahieren für Google Fonts URL
  const headingFont = tokens.typography.font_heading.replace(/['"]/g, '').split(',')[0].trim()
  const googleFonts = `https://fonts.googleapis.com/css2?family=${headingFont.replace(/ /g,'+')}:wght@300;400;700&family=Inter:wght@300;400;500;600;700&display=swap`

  const body = sections.map(s => scopeScripts(s.html)).join('\n\n')
  return `<!DOCTYPE html>
<html lang="${manifest.site.language}" class="scroll-smooth">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} | ${manifest.site.name}</title>
  <meta name="description" content="${manifest.pages[0]?.meta_description ?? ''}" />
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="${googleFonts}" rel="stylesheet" />
  <style>${cssVars}</style>
</head>
<body class="antialiased">
${body}
</body>
</html>`
}
// Bestehende assemblePage() bleibt UNVERÄNDERT für v1-Kompatibilität
```

---

### Modul 7 — Site Scraping

#### 7.1 Scraper
**Neu:** `src/lib/scraping/siteScraperService.ts`

```typescript
import puppeteer from 'puppeteer'
import OpenAI from 'openai'

export interface ScrapedFingerprint {
  source_url: string; scraped_at: string; confidence: number
  colors: { primary: string; secondary: string; accent: string; background: string; text: string }
  typography: { heading_font: string; body_font: string; heading_weight: string; size_scale: string }
  layout: { whitespace: string; full_bleed: boolean; overlaps: boolean; diagonal_cuts: boolean; concave_sections: boolean }
  decoration: { gradients: boolean; color_overlays: boolean; glassmorphism: boolean; geometric_shapes: boolean }
  animation: { budget: string; scroll_driven: boolean; text_animations: boolean }
  paradigm_detected: string; tags: string[]; section_sequence: string[]
}

export async function scrapeSite(url: string): Promise<ScrapedFingerprint> {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
  const page    = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })

  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })

  // Screenshot für Vision
  const screenshot = await page.screenshot({ type: 'jpeg', quality: 75 }) as Buffer

  // CSS computed styles — echte Werte direkt aus Browser
  const cssData = await page.evaluate(() => {
    const get = (el: Element | null, p: string) =>
      el ? getComputedStyle(el).getPropertyValue(p).trim() : ''
    return {
      h1_font:    get(document.querySelector('h1'), 'font-family'),
      h1_weight:  get(document.querySelector('h1'), 'font-weight'),
      h1_size:    get(document.querySelector('h1'), 'font-size'),
      body_font:  get(document.body, 'font-family'),
      body_bg:    get(document.body, 'background-color'),
      body_color: get(document.body, 'color'),
      nav_bg:     get(document.querySelector('nav, header'), 'background-color'),
      theme_color: document.querySelector('meta[name="theme-color"]')?.getAttribute('content') ?? '',
      section_count: document.querySelectorAll('section').length,
    }
  })

  await browser.close()

  // GPT-4o Vision
  const openai  = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const base64  = screenshot.toString('base64')
  const prompt  = buildVisionPrompt(url, cssData)

  const res = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}`, detail: 'low' } },
        { type: 'text', text: prompt },
      ],
    }],
    max_tokens: 1500,
    response_format: { type: 'json_object' },
  })

  const result = JSON.parse(res.choices[0]?.message?.content ?? '{}')
  return { ...result, source_url: url, scraped_at: new Date().toISOString() }
}

function buildVisionPrompt(url: string, cssData: object): string {
  return `Analyze this website screenshot and CSS data. Return ONLY valid JSON, no text, no markdown.

CSS data extracted from browser: ${JSON.stringify(cssData)}
URL: ${url}

Return this exact JSON structure:
{
  "confidence": 0.0-1.0,
  "colors": {
    "primary": "#hex — dominant brand color",
    "secondary": "#hex",
    "accent": "#hex — CTA button color",
    "background": "#hex — main page background",
    "text": "#hex — body text color"
  },
  "typography": {
    "heading_font": "exact font name from CSS data or inferred",
    "body_font": "exact font name from CSS data",
    "heading_weight": "400|500|600|700|800|900",
    "size_scale": "compact|normal|large|display"
  },
  "layout": {
    "whitespace": "tight|balanced|generous|extreme",
    "full_bleed": true|false,
    "overlaps": true|false,
    "diagonal_cuts": true|false,
    "concave_sections": true|false
  },
  "decoration": {
    "gradients": true|false,
    "color_overlays": true|false,
    "glassmorphism": true|false,
    "geometric_shapes": true|false
  },
  "animation": {
    "budget": "none|subtle|moderate|rich",
    "scroll_driven": true|false,
    "text_animations": true|false
  },
  "paradigm_detected": "minimal-clean|tech-dark|bold-expressive|luxury-editorial|bento-grid|brutalist",
  "tags": ["max 6 descriptive tags"],
  "section_sequence": ["detected section types in order, max 8"]
}`
}
```

**Neu:** `src/app/api/v2/scrape/route.ts`

```typescript
import { NextRequest } from 'next/server'
import { scrapeSite } from '@/lib/scraping/siteScraperService'

export const runtime    = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const { url } = await req.json()
  if (!url?.startsWith('http')) {
    return Response.json({ error: 'Valid URL required' }, { status: 400 })
  }
  const fingerprint = await scrapeSite(url)
  return Response.json({ fingerprint })
}
```

---

### Komplette Datei-Checkliste für Windsurf

```
NEU ERSTELLEN:
src/lib/types/manifest.ts
src/lib/ai/types.ts
src/lib/ai/openaiProvider.ts
src/lib/ai/models.ts
src/lib/generation/prompts.ts          ← KRITISCH: alle LLM-Prompts
src/lib/generation/autoFix.ts
src/lib/generation/sectionGenerator.ts
src/lib/style/styleDictionary.ts
src/lib/sections/sectionLibrary.ts
src/lib/scraping/siteScraperService.ts
src/app/api/v2/manifest/route.ts
src/app/api/v2/generate/route.ts
src/app/api/v2/scrape/route.ts
src/app/briefing/page.tsx
src/data/style-dictionaries/bold-expressive-v1.json
src/data/style-dictionaries/minimal-clean-v1.json
src/data/style-dictionaries/tech-dark-v1.json
src/data/style-dictionaries/luxury-editorial-v1.json
src/data/section-library/index.json    ← leeres Array []

BESTEHEND ÄNDERN (minimale, nicht-breaking Changes):
src/lib/store.ts                       → manifest: SiteManifest|null + actions
src/lib/assembler.ts                   → assemblePageWithManifest() hinzufügen
src/app/builder/page.tsx               → v2 API nutzen wenn manifest vorhanden
src/app/scraper/page.tsx               → Scraper UI mit Fingerprint-Anzeige

BESTEHEND UNVERÄNDERT LASSEN:
src/lib/ai.ts                          → v1 API bleibt voll funktionsfähig
src/app/api/generate/route.ts          → v1 Endpunkt bleibt
src/app/api/export/route.ts            → Export unverändert
src/lib/examples.ts                    → weiterhin als Fallback nutzbar
src/components/builder/*               → Canvas, Sidebar etc. unverändert

KEINE NEUEN npm-DEPENDENCIES nötig:
- openai ✓ (vorhanden)
- puppeteer ✓ (vorhanden in package.json)
- zustand ✓ (vorhanden)
- next ✓ (vorhanden)
```

### Akzeptanzkriterien — End-to-End Test

```
1. npm run build — keine TypeScript-Fehler
2. POST /api/v2/manifest mit { company_name: "Test GmbH", style_paradigm: "bold-expressive",
   industry: "saas-tech", adjectives: ["modern"], tone: "professional",
   primary_cta: "Jetzt starten", personas: ["CTO"], pain_points: ["zu langsam"],
   animation_budget: "rich", navbar_style: "sticky-blur", navbar_mobile: "hamburger-dropdown" }
   → gibt SiteManifest JSON zurück mit allen design_tokens ausgefüllt
3. POST /api/v2/generate mit { manifest: <result>, section_type: "hero" }
   → SSE stream sendet: event: pass1, event: pass2, event: complete
   → complete.validation_score >= 80
   → complete.html enthält overflow-hidden, isolate, grid-cols-1
   → complete.html enthält var(--color-primary) statt hardcodierten Hex-Werten
4. /briefing Seite lädt, alle 4 Steps navigierbar, Submit generiert Manifest und leitet zu /builder
5. Im /builder: wenn manifest im Store → neue Section nutzt /api/v2/generate automatisch
6. POST /api/v2/scrape mit { url: "https://vercel.com" } → gibt ScrapedFingerprint in < 45s
```

**Aktueller Stand v1 (aus Repo-Analyse):**
- `src/lib/ai.ts` — OpenAI-only, 2-Pass (generate + enhance), MODEL_CONFIG vorhanden, cleanHtml() funktioniert
- `src/lib/store.ts` — Zustand, Project/Page/Section-Typen, Brand als flaches Objekt
- `src/lib/assembler.ts` — assemblePage() + assemblePreview(), Tailwind CDN, IIFE-Scoping
- `src/app/api/generate/route.ts` — SSE streaming, classify + generate + enhance
- `src/app/builder/page.tsx` — Canvas, Sidebar, Topbar, PropertiesPanel
- **Fehlend:** Manifest, Style Dictionary, 3-Pass-Pipeline, Section Library, Asset Pipeline, Scraping

---

### Modul 1 — Manifest & Type-System
**Ziel:** Neues Kern-Datenmodell das alle nachfolgenden Module verwenden. Kein UI, keine API — nur Typen und Datendateien.

#### Schritt 1.1 — Typen anlegen
**Datei:** `src/lib/types/manifest.ts` *(neu)*

```typescript
// Alle zentralen Typen des v2-Systems

export type StyleParadigm =
  | 'minimal-clean'
  | 'tech-dark'
  | 'bold-expressive'
  | 'luxury-editorial'
  | 'bento-grid'
  | 'brutalist'

export type AnimationBudget = 'none' | 'subtle' | 'moderate' | 'rich'

export type SectionTransition =
  | 'flat'
  | 'convex-bottom'       // weißer Halbellipse-Block überlagert Unterkante
  | 'concave-bottom'      // Unzer-Stil: weißes Oval schneidet von unten ein
  | 'wave-bottom'         // SVG Sinuswelle
  | 'diagonal-bottom'     // clip-path polygon diagonal

export interface DesignTokens {
  colors: {
    primary:    string   // hex
    secondary:  string
    accent:     string
    highlight?: string
    background: string
    surface:    string
    dark:       string
    text:       string
    text_muted: string
    _source:    string   // "user-selected" | "scraped-url" | "branche-default"
  }
  typography: {
    font_heading:         string   // "'DM Serif Display', serif"
    font_body:            string
    heading_weight:       string   // "700"
    tracking_heading:     string   // "-0.025em"
    line_height_heading:  string
    _source:              string
  }
  type_scale: {
    hero_h1:    string   // Tailwind-Klassen: "text-4xl md:text-5xl lg:text-[5rem]"
    section_h2: string
    card_h3:    string
    body:       string
    eyebrow:    string
    cta_button: string
  }
  spacing: {
    section_padding_light: string
    section_padding_heavy: string
    container_max:         string
    container_padding:     string
  }
  effects: {
    border_radius_card:   string   // "rounded-sm"
    border_radius_button: string
    transition_default:   string
  }
}

export interface NavbarConfig {
  style:                'sticky-blur' | 'static' | 'transparent-hero' | 'hidden-scroll'
  scroll_behavior:      'solid' | 'transparent-to-solid'
  scroll_threshold_px:  number
  height:               string   // "h-16"
  layout_desktop:       string   // "logo-left · nav-center · cta-right"
  layout_mobile:        string
  mobile_menu:          'hamburger-dropdown' | 'hamburger-overlay' | 'hamburger-sidebar'
  cta_button:           boolean
  cta_label:            string
  links:                string[]
}

export interface SiteManifest {
  id:       string
  version:  string
  site: {
    name:       string
    domain?:    string
    language:   string
    industry:   string
    tone:       string
    adjectives: string[]
    primary_cta_goal: string
  }
  design_tokens:          DesignTokens
  style_paradigm:         StyleParadigm
  style_dictionary_ref:   string    // Dateiname: "bold-expressive-v1"
  style_source: {
    type:        'user-selected' | 'scraped-url' | 'screenshot' | 'branche-default'
    url?:        string
    confidence?: number
  }
  navbar:   NavbarConfig
  footer: {
    style:      string
    background: string
    layout:     string
  }
  responsive_rules: {
    layout_classes:   string
    grid_base:        string
    split_stacking:   object
    min_height:       string
    touch_targets:    string
    padding_mobile:   string
  }
  section_stacking_rules: Record<string, object>
  pass1_prompt_rules:     { rules: string[] }
  pass3_validator_checks: { auto_flag: string[]; auto_fix: string[] }
  pages: Array<{
    id:               string
    slug:             string
    title:            string
    sections:         string[]
    meta_description: string
  }>
  assets: {
    icons: {
      library:      string
      cdn:          string
      size_map:     Record<string, string>
      semantic_map: Record<string, string>
    }
    images: {
      crawl:      object
      generation: object
    }
  }
  content: {
    company_name:  string
    company_usp:   string
    primary_cta:   string
    secondary_cta: string
    personas:      string[]
    pain_points:   string[]
    trust_signals: string[]
  }
  generated_at:   string
  _decision_log:  Record<string, string>
}
```

**Datei:** `src/lib/types/styleDictionary.ts` *(neu)*

```typescript
export interface StyleDictionary {
  id:       string
  paradigm: StyleParadigm
  rules: {
    layout: {
      section_padding:      string
      max_width:            string
      columns_max:          number
      overlaps_allowed:     boolean
      negative_margin:      boolean
      full_bleed:           boolean
      asymmetric:           boolean
      section_transition:   SectionTransition
    }
    typography: {
      heading_font:    string
      heading_weight:  string
      heading_size_hero:    string
      heading_size_section: string
      tracking:        string
      gradient_text:   boolean
      outlined_text:   boolean
    }
    color: {
      base:                'light' | 'dark'
      backgrounds_allowed: string[]
      dark_sections:       boolean
      gradient:            boolean
      accent_count_max:    number
    }
    animation: {
      budget:             AnimationBudget
      keyframes:          boolean
      scroll_driven:      boolean
      text_animations:    string[]
      hover_effects:      string[]
    }
    decoration: {
      mesh_gradient:     boolean
      glassmorphism:     boolean
      border_glow:       boolean
      geometric_shapes:  boolean
      noise_texture:     boolean
      color_overlays:    boolean
      diagonal_cuts:     boolean
      concave_sections:  boolean
    }
  }
  forbidden_patterns: string[]
  required_patterns:  string[]
  html_patterns: Record<string, string>
}
```

#### Schritt 1.2 — Style Dictionary JSON-Dateien anlegen
**Verzeichnis:** `src/data/style-dictionaries/` *(neu)*

Vier Dateien anlegen mit vollständigen Dictionaries:
- `bold-expressive-v1.json` — overlaps, gradients, rich animations, diagonal_cuts, concave_sections
- `minimal-clean-v1.json` — no gradients, no overlaps, animation: none
- `tech-dark-v1.json` — dark base, glassmorphism, mesh gradients, moderate animations
- `luxury-editorial-v1.json` — serif, extreme whitespace, subtle animations, no gradients

#### Schritt 1.3 — Store erweitern
**Datei:** `src/lib/store.ts` *(bestehend erweitern)*

```typescript
// Zu BuilderStore hinzufügen:
manifest: SiteManifest | null
setManifest: (m: SiteManifest) => void
clearManifest: () => void
```

**Akzeptanzkriterium:** `npm run build` läuft durch, alle Typen sind importierbar, kein any-Fehler.

---

### Modul 2 — Provider-agnostisches AI-Interface
**Ziel:** `src/lib/ai.ts` umbauen sodass OpenAI und Anthropic parallel nutzbar sind. Bestehende `generateSection()` und `enhanceSection()` bleiben kompatibel.

#### Schritt 2.1 — Provider Interface
**Datei:** `src/lib/ai/types.ts` *(neu)*

```typescript
export interface CompletionParams {
  model:            string
  system?:          string
  messages:         Array<{ role: 'user' | 'assistant'; content: string }>
  max_tokens:       number
  temperature?:     number
  response_format?: { type: 'json_object' | 'text' }
  stream?:          boolean
}

export interface AIProvider {
  complete(params: CompletionParams): Promise<string>
  stream(params: CompletionParams, onChunk: (chunk: string) => void): Promise<string>
}
```

**Datei:** `src/lib/ai/openaiProvider.ts` *(neu — extrahiert aus bestehendem ai.ts)*

Bewegt die bestehende OpenAI-Logik aus `ai.ts` hierher. Implementiert `AIProvider`. Behält fallback-chain-Logik.

**Datei:** `src/lib/ai/anthropicProvider.ts` *(neu)*

```typescript
// npm install @anthropic-ai/sdk
import Anthropic from '@anthropic-ai/sdk'

export class AnthropicProvider implements AIProvider {
  private client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  async complete(params: CompletionParams): Promise<string> {
    const res = await this.client.messages.create({
      model:      params.model,
      max_tokens: params.max_tokens,
      system:     params.system,
      messages:   params.messages,
    })
    return res.content[0].type === 'text' ? res.content[0].text : ''
  }

  async stream(params: CompletionParams, onChunk: (c: string) => void): Promise<string> {
    let full = ''
    const stream = this.client.messages.stream({
      model:      params.model,
      max_tokens: params.max_tokens,
      system:     params.system,
      messages:   params.messages,
    })
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        full += chunk.delta.text
        onChunk(chunk.delta.text)
      }
    }
    return full
  }
}
```

#### Schritt 2.2 — MODEL_CONFIG v2
**Datei:** `src/lib/ai/models.ts` *(neu)*

```typescript
export const MODEL_CONFIG = {
  manifest_generation: {
    provider:    'anthropic' as const,
    model:       'claude-sonnet-4-6',
    max_tokens:  4000,
    temperature: 0.3,
  },
  pass1_structure: {
    provider:    'openai' as const,
    model:       'gpt-4.1',
    max_tokens:  8192,
    temperature: 0.4,
  },
  pass2_visual: {
    provider:    'openai' as const,
    model:       'gpt-4.1',
    max_tokens:  6000,
    temperature: 0.6,
  },
  pass3_validator: {
    provider:    'openai' as const,
    model:       'o4-mini',
    max_tokens:  2000,
    temperature: undefined,   // o4-mini: kein temperature
    response_format: { type: 'json_object' as const },
  },
  screenshot_analysis: {
    provider:    'openai' as const,
    model:       'gpt-4o',
    max_tokens:  2000,
    temperature: 0.1,
    response_format: { type: 'json_object' as const },
  },
}

export function getProvider(cfg: typeof MODEL_CONFIG[keyof typeof MODEL_CONFIG]): AIProvider {
  if (cfg.provider === 'anthropic') return new AnthropicProvider()
  return new OpenAIProvider()
}
```

#### Schritt 2.3 — ai.ts refactoren
**Datei:** `src/lib/ai.ts` *(bestehend umbauen)*

- Bestehende `generateSection()` und `enhanceSection()` bleiben als Public API erhalten
- Intern nutzen sie jetzt `getProvider(MODEL_CONFIG.pass1_structure)`
- `cleanHtml()` bleibt unverändert — sie funktioniert gut
- `SECTION_HINTS` bleiben erhalten, werden aber in Pass-1-Prompt integriert

**Akzeptanzkriterium:** Bestehender Builder generiert weiterhin Sections. Neuer Anthropic-Provider ist importierbar.

---

### Modul 3 — Manifest Generator & 3-Pass Pipeline
**Ziel:** Das Herzstück — BriefingSchema → manifest.json → 3-Pass Section Generation.

#### Schritt 3.1 — Manifest Generator
**Datei:** `src/lib/generation/manifestGenerator.ts` *(neu)*

```typescript
import { MODEL_CONFIG, getProvider } from '../ai/models'
import { SiteManifest } from '../types/manifest'
import { loadStyleDictionary } from '../style/styleDictionary'

export interface BriefingInput {
  company_name:    string
  industry:        string
  adjectives:      string[]          // max 4
  tone:            string
  primary_cta:     string
  personas:        string[]
  pain_points:     string[]
  style_paradigm:  StyleParadigm
  animation_budget: AnimationBudget
  navbar_style:    string
  navbar_mobile:   string
  reference_url?:  string            // optionaler Scrape-Input
  brand_colors?:   Partial<DesignTokens['colors']>
}

export async function generateManifest(input: BriefingInput): Promise<SiteManifest> {
  const provider = getProvider(MODEL_CONFIG.manifest_generation)
  const dictionary = loadStyleDictionary(input.style_paradigm)

  const prompt = buildManifestPrompt(input, dictionary)
  const raw = await provider.complete({
    model:       MODEL_CONFIG.manifest_generation.model,
    system:      MANIFEST_SYSTEM_PROMPT,
    messages:    [{ role: 'user', content: prompt }],
    max_tokens:  MODEL_CONFIG.manifest_generation.max_tokens,
    temperature: MODEL_CONFIG.manifest_generation.temperature,
    response_format: { type: 'json_object' },
  })

  const manifest: SiteManifest = JSON.parse(raw)
  // Immer: brand_colors überschreiben wenn vorhanden
  if (input.brand_colors) {
    manifest.design_tokens.colors = { ...manifest.design_tokens.colors, ...input.brand_colors }
  }
  manifest.design_tokens.colors._source = input.brand_colors ? 'user-brand' : 'ai-generated'
  manifest._decision_log.paradigm = `${input.style_paradigm} — user selected`
  return manifest
}

const MANIFEST_SYSTEM_PROMPT = `Du bist ein Design-System-Architekt.
Erstelle ein vollständiges Site Manifest als JSON.
Antworte NUR mit validem JSON — kein Text, kein Markdown.
Alle Farben als Hex-Werte. Alle Tailwind-Klassen als exakte Strings.`
```

#### Schritt 3.2 — Style Dictionary Loader
**Datei:** `src/lib/style/styleDictionary.ts` *(neu)*

```typescript
import { StyleDictionary } from '../types/styleDictionary'

const cache = new Map<string, StyleDictionary>()

export function loadStyleDictionary(paradigm: StyleParadigm): StyleDictionary {
  if (cache.has(paradigm)) return cache.get(paradigm)!
  // Dynamic import aus src/data/style-dictionaries/
  const dict = require(`../../data/style-dictionaries/${paradigm}-v1.json`) as StyleDictionary
  cache.set(paradigm, dict)
  return dict
}

export function getForbiddenPatterns(paradigm: StyleParadigm): string[] {
  return loadStyleDictionary(paradigm).forbidden_patterns
}
```

#### Schritt 3.3 — 3-Pass Section Generator
**Datei:** `src/lib/generation/sectionGenerator.ts` *(neu)*

```typescript
export interface SectionGenerationInput {
  section_type: string        // "hero-split-bold", "features-grid", etc.
  manifest:     SiteManifest
  content_brief: string       // Was diese Section inhaltlich zeigen soll
  rag_reference?: string      // HTML-Snippet aus Section Library (max 600 Zeichen)
}

export interface SectionGenerationResult {
  html:              string
  pass1_html:        string   // für Debugging
  pass2_html:        string
  validation_score:  number
  validation_errors: ValidationError[]
  duration_ms:       number
}

export async function generateSection(
  input: SectionGenerationInput
): Promise<SectionGenerationResult> {
  const t0 = Date.now()
  const dict = loadStyleDictionary(input.manifest.style_paradigm)

  // ── Pass 1: Struktur ──────────────────────────────────────────────
  const pass1Provider = getProvider(MODEL_CONFIG.pass1_structure)
  const pass1Html = await pass1Provider.complete({
    model:       MODEL_CONFIG.pass1_structure.model,
    system:      buildPass1System(dict, input.manifest),
    messages:    [{ role: 'user', content: buildPass1User(input) }],
    max_tokens:  MODEL_CONFIG.pass1_structure.max_tokens,
    temperature: MODEL_CONFIG.pass1_structure.temperature,
  })

  // ── Pass 2: Visual Layer (nur wenn budget !== 'none') ─────────────
  let pass2Html = pass1Html
  if (dict.rules.animation.budget !== 'none') {
    const pass2Provider = getProvider(MODEL_CONFIG.pass2_visual)
    pass2Html = await pass2Provider.complete({
      model:       MODEL_CONFIG.pass2_visual.model,
      system:      buildPass2System(dict),
      messages:    [{ role: 'user', content: buildPass2User(pass1Html, input.manifest) }],
      max_tokens:  MODEL_CONFIG.pass2_visual.max_tokens,
      temperature: MODEL_CONFIG.pass2_visual.temperature,
    })
  }

  // ── Pass 3: Validator ─────────────────────────────────────────────
  const pass3Provider = getProvider(MODEL_CONFIG.pass3_validator)
  const validationRaw = await pass3Provider.complete({
    model:           MODEL_CONFIG.pass3_validator.model,
    system:          PASS3_SYSTEM,
    messages:        [{ role: 'user', content: buildPass3User(pass2Html, dict) }],
    max_tokens:      MODEL_CONFIG.pass3_validator.max_tokens,
    response_format: { type: 'json_object' },
  })

  const validation = safeParseJson(validationRaw)
  const finalHtml  = autoFix(pass2Html, validation?.errors ?? [])

  return {
    html:              finalHtml,
    pass1_html:        pass1Html,
    pass2_html:        pass2Html,
    validation_score:  validation?.score ?? 0,
    validation_errors: validation?.errors ?? [],
    duration_ms:       Date.now() - t0,
  }
}

function buildPass1System(dict: StyleDictionary, manifest: SiteManifest): string {
  return `Du bist ein HTML-Entwickler. Erstelle ein Section-Gerüst.

STYLE DICTIONARY (verbindlich):
${JSON.stringify({ forbidden: dict.forbidden_patterns, rules: dict.rules }, null, 2)}

CSS TOKENS:
:root {
  --color-primary: ${manifest.design_tokens.colors.primary};
  --color-accent:  ${manifest.design_tokens.colors.accent};
  --font-heading:  ${manifest.design_tokens.typography.font_heading};
  --font-body:     ${manifest.design_tokens.typography.font_body};
}

PFLICHTREGELN:
${manifest.pass1_prompt_rules.rules.map(r => '- ' + r).join('\n')}

Antworte NUR mit HTML. Kein Markdown.`
}
```

#### Schritt 3.4 — Parallele Page-Generierung
**Datei:** `src/lib/generation/pageGenerator.ts` *(neu)*

```typescript
export async function generatePage(
  page: SiteManifest['pages'][0],
  manifest: SiteManifest,
  onProgress?: (section: string, status: 'start' | 'done') => void
): Promise<GeneratedPage> {

  // Pass 1 aller Sections parallel
  const pass1Results = await Promise.all(
    page.sections.map(async (sectionType) => {
      onProgress?.(sectionType, 'start')
      const result = await generateSection({ section_type: sectionType, manifest, content_brief: '' })
      onProgress?.(sectionType, 'done')
      return { sectionType, result }
    })
  )

  return {
    page_id:  page.id,
    sections: pass1Results.map(r => ({ type: r.sectionType, html: r.result.html })),
  }
}
```

**Akzeptanzkriterium:** `POST /api/v2/generate-section` mit BriefingInput gibt valides HTML zurück. Dauer < 20s pro Section.

---

### Modul 4 — API-Routen & SSE-Streaming
**Ziel:** Neue v2-API-Endpunkte. Bestehende `/api/generate` bleibt unverändert (v1 weiterhin nutzbar).

#### Schritt 4.1 — Manifest-Endpunkt
**Datei:** `src/app/api/v2/manifest/route.ts` *(neu)*

```typescript
export async function POST(req: NextRequest) {
  const input: BriefingInput = await req.json()

  // Validierung
  if (!input.company_name || !input.style_paradigm) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const manifest = await generateManifest(input)
  return Response.json({ manifest })
}
```

#### Schritt 4.2 — Section-Generierungs-Endpunkt mit SSE
**Datei:** `src/app/api/v2/generate/route.ts` *(neu)*

```typescript
export const runtime   = 'nodejs'
export const maxDuration = 120

export async function POST(req: NextRequest) {
  const { manifest_id, section_type, content_brief } = await req.json()

  // Manifest aus Store laden (oder direkt übergeben)
  const manifest = await loadManifest(manifest_id)

  const encoder  = new TextEncoder()
  const stream   = new TransformStream()
  const writer   = stream.writable.getWriter()

  // SSE-Format: "data: {...}\n\n"
  const send = (event: string, data: object) => {
    writer.write(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
  }

  ;(async () => {
    send('status', { phase: 'pass1', message: 'Struktur wird generiert...' })
    const result = await generateSection({ section_type, manifest, content_brief })
    send('pass1', { html: result.pass1_html })

    if (result.pass2_html !== result.pass1_html) {
      send('status', { phase: 'pass2', message: 'Visual Layer wird hinzugefügt...' })
      send('pass2', { html: result.pass2_html })
    }

    send('status', { phase: 'pass3', message: 'Validierung...' })
    send('complete', {
      html:              result.html,
      validation_score:  result.validation_score,
      validation_errors: result.validation_errors,
      duration_ms:       result.duration_ms,
    })
    writer.close()
  })()

  return new Response(stream.readable, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
    },
  })
}
```

#### Schritt 4.3 — Export-Endpunkt
**Datei:** `src/app/api/v2/export/route.ts` *(neu — bestehenden `/api/export` erweitern)*

```typescript
// Gibt ZIP zurück: vollständige deploybare HTML-Site
// base.html + alle Pages + CSS Custom Properties + Assets-Verzeichnis
export async function POST(req: NextRequest) {
  const { manifest, pages } = await req.json()
  const zip = await buildExportZip(manifest, pages)
  return new Response(zip, {
    headers: {
      'Content-Type':        'application/zip',
      'Content-Disposition': `attachment; filename="${manifest.site.name}-site.zip"`,
    },
  })
}
```

**Akzeptanzkriterium:** SSE-Stream liefert `pass1`, optional `pass2`, `complete` Events. Export-ZIP enthält deploybare HTML-Dateien.

---

### Modul 5 — Briefing-Wizard UI
**Ziel:** Bestehenden Brand-Tab (`/brand`) ersetzen durch vollständigen 4-Step Briefing-Wizard. Bestehender Builder bleibt unverändert.

#### Schritt 5.1 — Wizard-Komponente
**Datei:** `src/app/briefing/page.tsx` *(neu — bestehende `brand/page.tsx` bleibt)*

4-Step Wizard mit Zustand:

```typescript
// Step 1: Projekt-Infos
interface Step1State {
  company_name: string
  industry:     string      // Dropdown: recruiting-b2b | saas | construction | ...
  tagline:      string
  usp:          string
}

// Step 2: Zielgruppe & Ton
interface Step2State {
  adjectives:    string[]   // max 4, Toggle-Buttons
  personas:      string[]   // Freitext, Chip-Eingabe
  pain_points:   string[]
  primary_cta:   string
}

// Step 3: Design-Richtung (4 Wege)
interface Step3State {
  // Weg A
  reference_url?:     string
  // Weg B
  trend_preference?:  'current-2025' | 'timeless' | 'see-options'
  // Weg C/D (nach Paradigma-Wahl)
  style_paradigm?:    StyleParadigm
  animation_budget:   AnimationBudget  // "Wenig" | "Mittel" | "Gerne mehr"
}

// Step 3b: Navbar & Layout
interface Step3bState {
  navbar_style:   string   // sticky-blur | static | transparent-hero
  navbar_mobile:  string   // hamburger-dropdown | overlay | sidebar
  navbar_content: string[] // ['logo-left', 'nav-center', 'cta-right']
}

// Step 4: Seitenstruktur
interface Step4State {
  pages:          Array<{ title: string; slug: string; sections: string[] }>
  contact_form:   boolean
  language:       string
}
```

**Datei:** `src/components/briefing/StyleOptionCards.tsx` *(neu)*

Zeigt 3 Stil-Optionen mit Farbpalette-Preview, Typografie-Beispiel, Paradigma-Name. Klick → `style_paradigm` gesetzt.

**Datei:** `src/components/briefing/NavbarConfigurator.tsx` *(neu)*

Visuelle Auswahl: 4 Navbar-Stile als kleine Preview-Cards.

#### Schritt 5.2 — Manifest Preview
**Datei:** `src/components/briefing/ManifestPreview.tsx` *(neu)*

Zeigt vor der Generierung:
- Farb-Swatches der generierten Design-Tokens
- Typografie-Beispiel mit den gewählten Fonts
- JSON-Accordion für Entwickler-Debugging
- `_decision_log` — woher jeder Wert kommt

**Akzeptanzkriterium:** Wizard schließt mit vollständigem `BriefingInput`. Manifest wird generiert und im Store gespeichert. Preview zeigt Farben und Fonts korrekt.

---

### Modul 6 — Section Library & Asset Pipeline
**Ziel:** Kuratierte Section-Bibliothek als RAG-Referenz + Icon/Bild-Auflösung.

#### Schritt 6.1 — Section Library Dateistruktur
**Verzeichnis:** `src/data/section-library/` *(neu)*

```
src/data/section-library/
  index.json                    ← Metadaten aller Sections
  /sections/
    hero-minimal-001.html
    hero-bold-001.html
    features-grid-dark-001.html
    ...
```

**Datei:** `src/lib/sections/sectionLibrary.ts` *(neu)*

```typescript
interface SectionMeta {
  id:            string
  type:          string
  paradigm:      StyleParadigm
  quality_score: number         // 1-5
  tags:          string[]
  industries:    string[]
  html_path:     string
}

export function findBestReference(
  section_type: string,
  manifest: SiteManifest
): string | null {
  const index: SectionMeta[] = require('../../data/section-library/index.json')

  // Suche: gleicher type + gleiches paradigm + quality >= 4
  const candidates = index.filter(s =>
    s.type      === section_type &&
    s.paradigm  === manifest.style_paradigm &&
    s.quality_score >= 4
  )

  if (!candidates.length) return null

  // Bestes Ergebnis: höchster quality_score
  const best = candidates.sort((a, b) => b.quality_score - a.quality_score)[0]
  const html = readFileSync(`src/data/section-library/sections/${best.id}.html`, 'utf-8')

  // Auf 600 Zeichen kürzen für Prompt-Kontext
  return html.slice(0, 600)
}
```

#### Schritt 6.2 — Icon Resolution
**Datei:** `src/lib/assets/iconService.ts` *(neu)*

```typescript
// Löst <!-- [ICON: semantic_key | size: size_key] --> Placeholders auf
export function resolveIcons(html: string, manifest: SiteManifest): string {
  return html.replace(
    /<!-- \[ICON: (\w+) \| size: (\w+)\] -->/g,
    (_, semantic, size) => {
      const iconName  = manifest.assets.icons.semantic_map[semantic] ?? 'circle'
      const sizeClass = manifest.assets.icons.size_map[size] ?? 'w-5 h-5'
      return `<i data-lucide="${iconName}" class="${sizeClass}" aria-hidden="true"></i>`
    }
  )
}

// Validiert alle data-lucide Namen gegen die echte Lucide-Liste
export function validateLucideNames(html: string): string[] {
  const VALID = new Set(require('../../data/lucide-icons/icon-names.json'))
  const errors: string[] = []
  const matches = html.matchAll(/data-lucide="([^"]+)"/g)
  for (const [, name] of matches) {
    if (!VALID.has(name)) errors.push(`Ungültiger Icon-Name: "${name}"`)
  }
  return errors
}
```

#### Schritt 6.3 — Section Transition Builder
**Datei:** `src/lib/sections/sectionTransitions.ts` *(neu)*

```typescript
// Löst <!-- [TRANSITION: concave-bottom | next=white | depth=60px] --> auf
export function resolveTransitions(html: string): string {
  return html.replace(
    /<!-- \[TRANSITION: ([\w-]+) \| next=(\w+) \| depth=(\d+px)\] -->/g,
    (_, type, nextColor, depth) => buildTransitionCSS(type as SectionTransition, nextColor, depth)
  )
}

function buildTransitionCSS(type: SectionTransition, nextColor: string, depth: string): string {
  const colorMap: Record<string, string> = {
    white: '#ffffff', dark: '#0D1B2A', surface: 'var(--color-background)',
  }
  const color = colorMap[nextColor] ?? nextColor

  switch (type) {
    case 'concave-bottom':
      // Unzer-Stil: weißes Oval schneidet von unten ein
      return `<style>
.section-transition-concave::after {
  content: ''; position: absolute;
  bottom: -${parseInt(depth) * 0.6}px; left: -5%; right: -5%;
  height: ${depth}; background: ${color}; border-radius: 50%;
}
</style>`

    case 'convex-bottom':
      return `<style>
.section-transition-convex::after {
  content: ''; position: absolute; bottom: 0; left: 0; right: 0;
  height: ${depth}; background: ${color};
  border-radius: 50% 50% 0 0 / ${depth} ${depth} 0 0;
}
</style>`

    case 'diagonal-bottom':
      return `<style>
.section-transition-diagonal {
  clip-path: polygon(0 0, 100% 0, 100% 88%, 0 100%);
}
</style>`

    case 'wave-bottom':
      return `<svg style="position:absolute;bottom:-1px;left:0;right:0;" viewBox="0 0 1200 40" preserveAspectRatio="none">
  <path d="M0,20 C300,40 900,0 1200,20 L1200,40 L0,40 Z" fill="${color}"/>
</svg>`

    default:
      return '' // flat — kein Transition nötig
  }
}
```

**Akzeptanzkriterium:** Icons werden korrekt aufgelöst. Transition-Placeholders produzieren valides CSS/SVG. Section Library gibt für `hero bold-expressive` einen HTML-Snippet zurück.

---

### Modul 7 — Site Scraping & Style-Fingerprint
**Ziel:** URL → Style Fingerprint → Manifest Enrichment.

#### Schritt 7.1 — Scraper Service
**Datei:** `src/lib/scraping/siteScraperService.ts` *(neu)*

**Dependency:** `puppeteer` ist bereits in `package.json`

```typescript
import puppeteer from 'puppeteer'

export async function scrapeSite(url: string): Promise<ScrapedFingerprint> {
  const browser = await puppeteer.launch({ headless: true })
  const page    = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })

  // Screenshot für Vision
  const screenshot = await page.screenshot({ type: 'jpeg', quality: 80, fullPage: false })

  // Computed Styles extrahieren
  const cssData = await page.evaluate(() => {
    const h1   = document.querySelector('h1')
    const body = document.body
    const nav  = document.querySelector('nav, header')
    const cs   = (el: Element | null, p: string) =>
      el ? getComputedStyle(el).getPropertyValue(p).trim() : ''

    return {
      h1_font:       cs(h1,   'font-family'),
      h1_weight:     cs(h1,   'font-weight'),
      h1_size:       cs(h1,   'font-size'),
      h1_color:      cs(h1,   'color'),
      body_font:     cs(body, 'font-family'),
      body_bg:       cs(body, 'background-color'),
      body_color:    cs(body, 'color'),
      nav_bg:        cs(nav,  'background-color'),
      theme_color:   document.querySelector('meta[name="theme-color"]')
                       ?.getAttribute('content') ?? '',
      // Alle sichtbaren Section-BGs für Paradigma-Erkennung
      section_bgs:   Array.from(document.querySelectorAll('section, [class*="hero"], [class*="feature"]'))
                       .slice(0, 6)
                       .map(el => getComputedStyle(el).backgroundColor),
    }
  })

  await browser.close()

  // GPT-4o Vision → Fingerprint
  return analyzeWithVision(screenshot, cssData)
}

async function analyzeWithVision(
  screenshot: Buffer,
  cssData: object
): Promise<ScrapedFingerprint> {
  const provider = getProvider(MODEL_CONFIG.screenshot_analysis)
  const base64   = screenshot.toString('base64')

  // OpenAI Vision API — Bild + Text in einer Message
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const res = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}`, detail: 'low' } },
        { type: 'text',      text: buildVisionPrompt(cssData) },
      ],
    }],
    max_tokens:      1500,
    response_format: { type: 'json_object' },
  })

  return JSON.parse(res.choices[0]?.message?.content ?? '{}')
}
```

#### Schritt 7.2 — Manifest Merger
**Datei:** `src/lib/scraping/manifestMerger.ts` *(neu)*

```typescript
export type MergeMode = 'replace' | 'blend' | 'reference-only'

export function mergeFingerprint(
  manifest:    SiteManifest,
  fingerprint: ScrapedFingerprint,
  intent:      'inspiration' | 'competitor' | 'own-brand',
  mode:        MergeMode
): SiteManifest {
  if (mode === 'reference-only') {
    // Nur im decision_log vermerken
    return {
      ...manifest,
      _decision_log: {
        ...manifest._decision_log,
        scrape_reference: `${intent}: ${fingerprint.source_url}`,
      },
    }
  }

  const useColors = intent !== 'competitor' &&
                    manifest.design_tokens.colors._source === 'ai-generated'

  return {
    ...manifest,
    style_paradigm: fingerprint.paradigm_detected,
    design_tokens: {
      ...manifest.design_tokens,
      colors: useColors
        ? { ...mapFingerprintColors(fingerprint.colors), _source: `scraped:${fingerprint.source_url}` }
        : manifest.design_tokens.colors,
      typography: fingerprint.typography.heading_font
        ? { ...mapFingerprintTypography(fingerprint.typography), _source: `scraped:${fingerprint.source_url}` }
        : manifest.design_tokens.typography,
    },
    _decision_log: {
      ...manifest._decision_log,
      paradigm: `${fingerprint.paradigm_detected} — scraped from ${fingerprint.source_url} (conf: ${fingerprint.confidence})`,
      scrape_source: fingerprint.source_url,
    },
  }
}
```

#### Schritt 7.3 — Scraping API-Endpunkt
**Datei:** `src/app/api/v2/scrape/route.ts` *(neu)*

```typescript
export const maxDuration = 60  // Puppeteer braucht Zeit

export async function POST(req: NextRequest) {
  const { url, intent, merge_mode, manifest } = await req.json()

  if (!url || !url.startsWith('http')) {
    return Response.json({ error: 'Invalid URL' }, { status: 400 })
  }

  const fingerprint = await scrapeSite(url)
  const enriched    = manifest
    ? mergeFingerprint(manifest, fingerprint, intent, merge_mode)
    : null

  return Response.json({
    fingerprint,
    manifest_preview: enriched,
    diff: enriched ? computeDiff(manifest, enriched) : [],
  })
}
```

#### Schritt 7.4 — Scraping UI
**Datei:** `src/app/scraper/page.tsx` *(bestehend erweitern — Seite existiert bereits)*

Bestehende Scraper-Seite mit neuem Workflow:
1. URL-Eingabe + Intent-Auswahl (inspiration / competitor / own-brand)
2. "Analysieren" → zeigt Fingerprint-Ergebnis mit Farb-Swatches + erkanntem Paradigma
3. Merge-Mode-Auswahl (replace / blend / reference-only)
4. "Ins Manifest übernehmen" → lädt aktives Manifest und merged

**Akzeptanzkriterium:** `POST /api/v2/scrape` mit `url: "https://unzer.com/de"` gibt validen `ScrapedFingerprint` zurück in < 45s. Paradigma wird korrekt erkannt.

---

### Modul-Übersicht & Abhängigkeiten

```
Modul 1: Typen & Data Files          → Keine Abhängigkeit
Modul 2: AI Provider Interface       → Modul 1
Modul 3: Manifest + 3-Pass Pipeline  → Modul 1, 2
Modul 4: API-Routen & SSE            → Modul 2, 3
Modul 5: Briefing Wizard UI          → Modul 1, 3, 4
Modul 6: Section Library & Assets   → Modul 1, 3
Modul 7: Scraping                    → Modul 1, 2, 3
```

### Neue Abhängigkeiten

```bash
npm install @anthropic-ai/sdk   # Modul 2
# puppeteer ist bereits vorhanden (in package.json)
# Keine weiteren externen Deps nötig
```

### Bestehende Dateien — Was bleibt, was ändert sich

| Datei | Status | Aktion |
|---|---|---|
| `src/lib/ai.ts` | Umbauen | Provider extrahieren, cleanHtml() behalten |
| `src/lib/store.ts` | Erweitern | `manifest` State hinzufügen |
| `src/lib/assembler.ts` | Behalten | assemblePage() funktioniert, nur CSS-Tokens ergänzen |
| `src/app/api/generate/route.ts` | Behalten | v1 API bleibt kompatibel |
| `src/app/api/export/route.ts` | Behalten | ZIP-Export weiter nutzbar |
| `src/app/builder/page.tsx` | Behalten | Canvas/Sidebar unverändert |
| `src/app/brand/page.tsx` | Behalten | Als Legacy-Tab, Wizard unter `/briefing` |
| `src/app/scraper/page.tsx` | Erweitern | Neue Fingerprint-Anzeige hinzufügen |
| `src/lib/examples.ts` | Migrieren | Langfristig zu Section Library migrieren |

---

## Anhang — Schnell-Referenz Prompts

### System-Prompt Template Pass 1 (minimal)

```
Du bist ein präziser HTML-Entwickler. Erstelle eine {{section_type}}-Section.

CONSTRAINTS (verbindlich):
{{style_dictionary_forbidden_patterns_as_json_array}}

TOKENS:
{{css_custom_properties_as_css_snippet}}

REGELN:
- NUR HTML ausgeben, kein Markdown
- CSS Custom Properties verwenden: var(--color-primary), var(--font-heading)
- Placeholder für Animationen: <!-- [ANIM: word-cycle | words: [...]] -->
- Placeholder für Backgrounds: <!-- [BG: geometric-shapes | opacity: 0.1] -->
- prefers-reduced-motion Fallback bei allen Transitions

REFERENZ (beste ähnliche Section aus Library):
{{rag_reference_html_truncated_to_500_chars}}
```

### Auto-Fix Regeln (mechanisch, kein LLM)

```typescript
const AUTO_FIXES: AutoFix[] = [
  // aria-label auf Icon-Buttons
  {
    pattern: /<button([^>]*)>(\s*<svg[^>]*>.*?<\/svg>\s*)<\/button>/gs,
    fix: (match, attrs, content) =>
      attrs.includes('aria-label') ? match :
      match.replace('<button', '<button aria-label="Aktion"'),
    severity: 'warning'
  },
  // alt auf Images
  {
    pattern: /<img(?![^>]*\balt=)([^>]*)>/g,
    fix: (match, attrs) => match.replace('<img', '<img alt=""'),
    severity: 'error'
  },
  // prefers-reduced-motion fehlt
  {
    pattern: /@keyframes[\s\S]*?(?!@media\s*\(prefers-reduced-motion)/,
    fix: (match) => match + '\n@media (prefers-reduced-motion: reduce) { * { animation: none !important; } }',
    severity: 'error'
  }
];
```

---

## 18. Icons, Bilder & Asset Pipeline

Drei separate Systeme — alle mit demselben Grundprinzip: **Pass 1 setzt einen Placeholder, die Asset Pipeline löst ihn auf bevor Pass 2 läuft.** Die KI wählt niemals frei ein Icon oder erfindet eine Bild-URL.

---

### 18.1 Icons — Lucide via CDN

**Warum Lucide:** 1400+ konsistente SVG-Icons, MIT-Lizenz, ein Script-Tag, und die Icon-Namen sind im Trainingskorpus der KI — sie kann korrekt benennen was sie meint.

**Integration in base.html:**

```html
<!-- base.html <head> -->
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>

<!-- Einmalig am Ende von bundle.js -->
<script>lucide.createIcons();</script>
```

**Verwendung in Sections:**

```html
<i data-lucide="shield-check" class="w-6 h-6 text-accent" aria-hidden="true"></i>
<i data-lucide="arrow-right"  class="w-4 h-4" aria-hidden="true"></i>
```

**Das Problem ohne Icon Map:** Die KI würde pro Section andere Icon-Namen wählen, inkonsistente Größen verwenden, oder nicht-existente Names halluzinieren.

**Die Lösung — Icon Map im Manifest:**

```json
"icons": {
  "library": "lucide",
  "cdn": "https://unpkg.com/lucide@latest/dist/umd/lucide.min.js",
  "size_map": {
    "nav":         "w-4 h-4",
    "button":      "w-4 h-4",
    "inline":      "w-4 h-4",
    "card_accent": "w-6 h-6",
    "feature":     "w-8 h-8",
    "hero_large":  "w-12 h-12"
  },
  "semantic_map": {
    "check":        "check",
    "check_circle": "check-circle",
    "arrow_right":  "arrow-right",
    "arrow_down":   "arrow-down",
    "phone":        "phone",
    "mail":         "mail",
    "location":     "map-pin",
    "time":         "clock",
    "calendar":     "calendar",
    "team":         "users",
    "person":       "user",
    "process":      "workflow",
    "guarantee":    "shield-check",
    "speed":        "zap",
    "regional":     "map",
    "success":      "trophy",
    "star":         "star",
    "close":        "x",
    "menu":         "menu",
    "external":     "external-link",
    "download":     "download",
    "chart":        "bar-chart-2",
    "search":       "search",
    "settings":     "settings",
    "info":         "info",
    "warning":      "alert-triangle",
    "plus":         "plus",
    "minus":        "minus"
  }
}
```

**Pass-1-Placeholder für Icons:**

```html
<!-- [ICON: guarantee | size: card_accent] -->
<!-- [ICON: arrow_right | size: button] -->
<!-- [ICON: check | size: inline] -->
```

**Asset Pipeline — Icon Resolution:**

```typescript
function resolveIcons(html: string, manifest: Manifest): string {
  return html.replace(
    /<!-- \[ICON: (\w+) \| size: (\w+)\] -->/g,
    (_, semantic, size) => {
      const iconName  = manifest.icons.semantic_map[semantic] ?? 'circle';
      const sizeClass = manifest.icons.size_map[size] ?? 'w-5 h-5';
      return `<i data-lucide="${iconName}" class="${sizeClass}" aria-hidden="true"></i>`;
    }
  );
}
```

**Pass-3-Validator — Icon Checks:**

```typescript
const LUCIDE_VALID_NAMES = new Set([/* alle 1400+ Namen */]);

// Prüft jeden data-lucide Wert gegen die echte Lucide-Liste
html.matchAll(/data-lucide="([^"]+)"/g).forEach(([, name]) => {
  if (!LUCIDE_VALID_NAMES.has(name)) {
    errors.push({ type: 'invalid-icon', message: `Icon "${name}" existiert nicht in Lucide`, severity: 'error', auto_fixable: false });
  }
});
```

---

### 18.2 Bilder — Crawling (Unsplash / Pexels API)

Für reale Fotografie — Menschen, Büros, Regionen, Teams. Beide APIs sind kostenlos, hochwertig und liefern lizenzfreie Bilder.

**Manifest-Konfiguration:**

```json
"images": {
  "crawl": {
    "provider":      "unsplash",
    "api_key_env":   "UNSPLASH_ACCESS_KEY",
    "color_filter":  "#1B2B4B",
    "quality":       "regular",
    "fallback_provider": "pexels"
  }
}
```

**imageService.ts:**

```typescript
interface ImageRequest {
  context:     string;    // "norddeutschland business handshake"
  orientation: 'landscape' | 'portrait' | 'square';
  color?:      string;    // hex — Unsplash filtert nach Farbton
  count:       number;
  slot:        string;    // "hero-bg" | "card-1" | "team-photo"
}

interface ImageResult {
  url:        string;   // 1080px — für Export
  url_thumb:  string;   // 200px  — für Preview im wbuilder UI
  blur_hash:  string;   // → CSS-Hintergrundfarbe als Fallback
  alt:        string;
  credit:     string;
  credit_url: string;
}

async function fetchCrawledImage(req: ImageRequest, manifest: Manifest): Promise<ImageResult> {
  const color = req.color ?? manifest.images.crawl.color_filter;

  const res = await fetch(
    `https://api.unsplash.com/search/photos`
    + `?query=${encodeURIComponent(req.context)}`
    + `&orientation=${req.orientation}`
    + `&color=${encodeURIComponent(color)}`
    + `&per_page=5`,
    { headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` } }
  );

  const data = await res.json();
  if (!data.results?.length) throw new Error(`No images for: ${req.context}`);

  // Bestes Ergebnis: erstes mit höchster Auflösung
  const photo = data.results[0];
  return {
    url:        photo.urls.regular,
    url_thumb:  photo.urls.thumb,
    blur_hash:  photo.blur_hash,
    alt:        photo.alt_description ?? req.context,
    credit:     photo.user.name,
    credit_url: photo.user.links.html,
  };
}
```

**Pass-1-Placeholder für gecrawlte Bilder:**

```html
<!-- [IMG: context="norddeutschland businesspeople meeting" | orientation=landscape | slot=hero-bg | source=crawl] -->
<!-- [IMG: context="modern office desk" | orientation=square | slot=feature-1 | source=crawl] -->
```

**Resolved Output:**

```html
<img
  src="https://images.unsplash.com/photo-xxx?w=1080&q=80"
  alt="Business professionals meeting in northern Germany"
  class="w-full h-full object-cover"
  style="background-color: #1B2B4B"
  loading="lazy"
  width="1080"
  height="720"
>
<!-- Photo by Max Mustermann on Unsplash -->
```

**Warum der color_filter entscheidend ist:** `color=#1B2B4B` liefert Fotos mit dunkelblauen Tönen die zur Brand-Palette passen. Nicht perfekt, aber dramatisch besser als zufällige Stock-Optik.

---

### 18.3 Bilder — Generiert (DALL-E 3 / Flux)

Für Hero-Visuals, abstrakte Hintergründe oder brand-spezifische Illustrationen die Stock-Fotografie nicht liefern kann. Der entscheidende Punkt: der Image-Prompt wird **aus dem Manifest abgeleitet**, nicht pro Section erfunden.

**Manifest-Konfiguration:**

```json
"images": {
  "generation": {
    "provider":     "dall-e-3",
    "model":        "dall-e-3",
    "quality":      "hd",
    "style":        "natural",
    "style_prompt": "clean professional photography, warm natural light, norddeutschland coastal aesthetic, muted warm tones matching #F5F0E8 and #1B2B4B palette, genuine human moments",
    "negative":     "cartoon, illustration, oversaturated, stock photo look, generic office, fake smile, watermark",
    "aspect_ratios": {
      "hero_split":    "1792x1024",
      "hero_portrait": "1024x1792",
      "card":          "1024x1024",
      "wide":          "1792x1024"
    }
  }
}
```

**imageGenerator.ts:**

```typescript
async function generateImage(
  section_context: string,
  slot: string,
  manifest: Manifest
): Promise<string> {

  const gen = manifest.images.generation;
  const size = gen.aspect_ratios[slot] ?? '1792x1024';

  // style_prompt aus Manifest + section_context kombiniert
  // → alle generierten Bilder sehen aus derselben visuellen Welt
  const prompt = [
    gen.style_prompt,
    section_context,
    `consistent with color palette: ${manifest.design_tokens.colors.primary}, ${manifest.design_tokens.colors.background}`,
  ].join('. ');

  const response = await openai.images.generate({
    model:   gen.model,
    prompt,
    size:    size as any,
    quality: gen.quality as any,
    style:   gen.style as any,
    n:       1,
  });

  return response.data[0].url!;
}
```

**Pass-1-Placeholder für generierte Bilder:**

```html
<!-- [IMG: context="two professionals shaking hands at a harbor" | slot=hero_split | source=generate] -->
<!-- [IMG: context="abstract geometric shapes in dark blue" | slot=card | source=generate] -->
```

**Wann generate vs. crawl:**

```
crawl:    Menschen, Orte, Produkte, Büros — reale Fotografie erwünscht
generate: Hero-Visuals, abstrakte Backgrounds, Illustrationen,
          brand-spezifische Szenen die Stock nicht abdeckt,
          wenn exakte Farbpalette kritisch ist
```

---

### 18.4 Asset Pipeline — vollständiger Ablauf

```
Pass 1 Output (HTML mit Placeholders)
    │
    ▼
ASSET PIPELINE (läuft zwischen Pass 1 und Pass 2)
    │
    ├── resolveIcons(html, manifest)
    │       → alle [ICON: ...] → <i data-lucide="...">
    │
    ├── resolveImages(html, manifest)
    │       → [IMG: ... | source=crawl]     → Unsplash API fetch
    │       → [IMG: ... | source=generate]  → DALL-E 3 generation
    │       → Bilder werden lokal gespeichert: /assets/images/
    │       → img src wird zu relativem Pfad: /assets/images/hero-bg.jpg
    │
    └── HTML mit echten Assets
    │
    ▼
Pass 2 Input (vollständiges HTML, alle Assets aufgelöst)
```

**resolveImages.ts:**

```typescript
async function resolveImages(html: string, manifest: Manifest): Promise<string> {
  const placeholders = [...html.matchAll(
    /<!-- \[IMG: context="([^"]+)" \| [^|]+ \| slot=(\w+) \| source=(\w+)\] -->/g
  )];

  for (const [placeholder, context, slot, source] of placeholders) {
    let imageUrl: string;
    let altText = context;

    if (source === 'generate') {
      imageUrl = await generateImage(context, slot, manifest);
    } else {
      const result = await fetchCrawledImage({ context, orientation: 'landscape', slot, count: 1 }, manifest);
      imageUrl = result.url;
      altText  = result.alt;
    }

    // Bild lokal speichern für Export-ZIP
    const filename  = `${slot}-${Date.now()}.jpg`;
    const localPath = `/assets/images/${filename}`;
    await downloadImage(imageUrl, `./export/dist${localPath}`);

    // Placeholder ersetzen
    const imgTag = `<img src="${localPath}" alt="${altText}" class="w-full h-full object-cover" loading="lazy" width="1080" height="720">`;
    html = html.replace(placeholder, imgTag);
  }

  return html;
}
```

**Manifest — vollständiger assets Block:**

```json
"assets": {
  "icons": {
    "library":      "lucide",
    "cdn":          "https://unpkg.com/lucide@latest/dist/umd/lucide.min.js",
    "size_map":     { "nav": "w-4 h-4", "button": "w-4 h-4", "card_accent": "w-6 h-6", "feature": "w-8 h-8", "hero_large": "w-12 h-12" },
    "semantic_map": { "guarantee": "shield-check", "speed": "zap", "regional": "map-pin", "team": "users", "check": "check-circle", "arrow_right": "arrow-right" }
  },
  "images": {
    "source_priority": ["crawled", "generated", "placeholder"],
    "local_output_dir": "/assets/images/",
    "crawl": {
      "provider":          "unsplash",
      "api_key_env":       "UNSPLASH_ACCESS_KEY",
      "color_filter":      "#1B2B4B",
      "quality":           "regular",
      "fallback_provider": "pexels",
      "fallback_key_env":  "PEXELS_API_KEY"
    },
    "generation": {
      "provider":     "dall-e-3",
      "quality":      "hd",
      "style":        "natural",
      "style_prompt": "clean professional photography, warm natural light, norddeutschland aesthetic, muted warm tones, genuine human moments",
      "negative":     "cartoon, oversaturated, stock photo look, watermark",
      "aspect_ratios": {
        "hero_split":    "1792x1024",
        "hero_portrait": "1024x1792",
        "card":          "1024x1024",
        "wide":          "1792x1024"
      }
    }
  }
}
```

**Pass-3-Validator — Asset Checks:**

```typescript
const assetChecks = [
  // Jedes img hat alt
  { pattern: /<img(?![^>]*\balt=)[^>]*>/g, message: 'img ohne alt-Attribut', severity: 'error', auto_fixable: true },
  // Jedes img hat loading=lazy
  { pattern: /<img(?![^>]*\bloading=)[^>]*>/g, message: 'img ohne loading=lazy', severity: 'warning', auto_fixable: true },
  // Jedes img hat width + height (verhindert Layout Shift)
  { pattern: /<img(?![^>]*\bwidth=)[^>]*>/g, message: 'img ohne width/height — CLS', severity: 'warning', auto_fixable: false },
  // Kein data-lucide mit nicht-existentem Namen
  { custom: validateLucideNames, message: 'Ungültiger Lucide Icon-Name', severity: 'error', auto_fixable: false },
  // Keine verbliebenen Placeholders nach Asset Pipeline
  { pattern: /<!-- \[ICON:/g, message: 'Unaufgelöster Icon-Placeholder', severity: 'error', auto_fixable: false },
  { pattern: /<!-- \[IMG:/g,  message: 'Unaufgelöster Image-Placeholder', severity: 'error', auto_fixable: false },
];
```

---

### 18.5 Dateistruktur-Ergänzung

```
/wbuilder-v2/src/
  /lib/
    /assets/                        ← NEU
      iconService.ts                ← Lucide semantic_map + resolution
      imageService.ts               ← Unsplash / Pexels fetch
      imageGenerator.ts             ← DALL-E 3 / Flux generation
      assetPipeline.ts              ← Orchestrierung aller Asset-Auflösungen
      iconValidator.ts              ← Lucide-Namen validieren
  /data/
    /lucide-icons/
      icon-names.json               ← alle ~1400 Lucide Namen (für Validator)
```

---

## 19. Site Scraping & Manifest Enrichment

Statt den Nutzer abstrakte Style-Fragen zu stellen ("wie soll es wirken?"), zeigt er einfach auf eine URL. Das System extrahiert die Design-DNA der Zielseite und reichert das Manifest damit an. Das ist der präziseste Weg zu einem Style Dictionary — besser als jede Frage-Antwort-Session.

---

### 19.1 Wann wird gescrapt?

```
Briefing Wizard Step 3 — 4 Wege zum Style Dictionary:

  Weg A: "Hier ist eine URL die mir gefällt"  → POST /api/scrape-site
  Weg B: "Hier ist ein Screenshot"           → POST /api/analyze-style (Vision only)
  Weg C: "Aktueller Trend 2025"              → Style-Palette gefiltert
  Weg D: "Ich wähle direkt"                  → Paradigma aus Liste

Mehrere URLs erlaubt:
  - Konkurrenz-URL   → Differenzierung beachten (andere Farben)
  - Inspirations-URL → Layout + Struktur übernehmen
  - Eigene alte Site → Konsistenz mit bestehendem Brand
```

---

### 19.2 Was der Scraper extrahiert — 6 Dimensionen

```typescript
interface ScrapedFingerprint {
  source_url:    string;
  scraped_at:    string;
  confidence:    number;          // 0–1, wie sicher die Analyse ist

  colors: {
    primary:     string;          // hex — dominant Farbe
    secondary:   string;
    accent:      string;
    background:  string;
    text:        string;
    _method:     'css-computed' | 'vision' | 'both';
  };

  typography: {
    heading_font:  string;        // z.B. "Inter" — aus computed styles
    body_font:     string;
    heading_weight: string;       // "700" / "800" / "300"
    size_scale:    'compact' | 'normal' | 'large' | 'display';
    tracking:      'tight' | 'normal' | 'wide';
  };

  layout: {
    whitespace:    'tight' | 'balanced' | 'generous' | 'extreme';
    section_types: string[];      // ["hero-fullbleed", "stats-row", "logo-cloud"]
    overlaps:      boolean;
    full_bleed:    boolean;
    asymmetric:    boolean;
    diagonal_cuts: boolean;       // wie bei Unzer Footer
  };

  decoration: {
    gradients:        boolean;
    color_overlays:   boolean;    // Photo + Farb-Overlay
    geometric_shapes: boolean;
    glassmorphism:    boolean;
    noise_texture:    boolean;
    diagonal_accent:  boolean;
    blob_shapes:      boolean;
  };

  animation: {
    budget:         'none' | 'subtle' | 'moderate' | 'rich';
    scroll_driven:  boolean;
    hover_effects:  boolean;
    text_animations: boolean;
  };

  paradigm_detected:  StyleParadigm;   // auto-klassifiziert
  tags:               string[];        // ["dark-hero", "photo-overlay", "bold-sans", "2025"]
  section_sequence:   string[];        // erkannte Reihenfolge der Sections
}
```

---

### 19.3 Technische Implementierung

**Zwei-Schritt-Prozess — CSS-Parsing + Vision:**

```typescript
// siteScraperService.ts
async function scrapeSite(url: string): Promise<ScrapedFingerprint> {

  // Schritt 1: Playwright Screenshot + DOM-Analyse
  const browser  = await chromium.launch();
  const page     = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });

  // Screenshot für Vision
  const screenshot = await page.screenshot({ fullPage: false, type: 'jpeg', quality: 85 });

  // CSS Computed Styles extrahieren
  const cssData = await page.evaluate(() => {
    const h1    = document.querySelector('h1');
    const body  = document.body;
    const hero  = document.querySelector('section, .hero, [class*="hero"]');

    const cs = (el: Element | null, prop: string) =>
      el ? getComputedStyle(el).getPropertyValue(prop).trim() : '';

    return {
      h1_font:       cs(h1, 'font-family'),
      h1_weight:     cs(h1, 'font-weight'),
      h1_size:       cs(h1, 'font-size'),
      body_font:     cs(body, 'font-family'),
      body_color:    cs(body, 'color'),
      bg_color:      cs(body, 'background-color'),
      hero_bg:       cs(hero, 'background-color'),
      // Meta-Theme-Color als Hauptfarbe-Hinweis
      theme_color:   document.querySelector('meta[name="theme-color"]')
                       ?.getAttribute('content') ?? '',
    };
  });

  await browser.close();

  // Schritt 2: GPT-4o Vision → strukturierter JSON-Output
  const visionResult = await analyzeWithVision(screenshot, cssData);

  return visionResult;
}

// Vision-Prompt — NUR JSON, keine Prosa
const SCRAPE_VISION_PROMPT = `
Analysiere diesen Website-Screenshot zusammen mit den CSS-Daten.
Antworte AUSSCHLIESSLICH mit validem JSON. Kein Text, kein Markdown.

CSS-Daten: ${JSON.stringify(cssData)}

Extrahiere:
{
  "confidence": 0.0–1.0,
  "colors": {
    "primary": "#hex — dominante Markenfarbe",
    "secondary": "#hex",
    "accent": "#hex — CTA-Farbe",
    "background": "#hex — Haupt-Hintergrund",
    "text": "#hex — Fließtext"
  },
  "typography": {
    "heading_font": "exakter Font-Name aus CSS",
    "body_font": "exakter Font-Name aus CSS",
    "heading_weight": "400|500|600|700|800|900",
    "size_scale": "compact|normal|large|display",
    "tracking": "tight|normal|wide"
  },
  "layout": {
    "whitespace": "tight|balanced|generous|extreme",
    "section_types": ["max 6 erkannte Section-Typen"],
    "overlaps": true|false,
    "full_bleed": true|false,
    "asymmetric": true|false,
    "diagonal_cuts": true|false
  },
  "decoration": {
    "gradients": true|false,
    "color_overlays": true|false,
    "geometric_shapes": true|false,
    "glassmorphism": true|false,
    "diagonal_accent": true|false,
    "blob_shapes": true|false
  },
  "animation": {
    "budget": "none|subtle|moderate|rich",
    "scroll_driven": true|false,
    "text_animations": true|false
  },
  "paradigm_detected": "minimal-clean|tech-dark|bold-expressive|luxury-editorial|bento-grid|brutalist",
  "tags": ["max 8 Tags"],
  "section_sequence": ["erkannte Sections in Reihenfolge"]
}
`;
```

---

### 19.4 Merge-Strategie — Fingerprint → Manifest

Der Fingerprint überschreibt das Manifest nicht blind. Es gibt drei Merge-Modi:

```typescript
type MergeMode =
  | 'replace'         // Scraped values direkt verwenden (keine eigene Brand)
  | 'blend'           // Scraped layout + eigene Brand-Farben
  | 'reference-only'  // Nur als Style-Inspiration, keine Werte übernehmen

interface ScrapeInput {
  url:       string;
  intent:    'inspiration' | 'competitor' | 'own-brand';
  merge_mode: MergeMode;
}

function mergeFingerprint(
  manifest: SiteManifest,
  fingerprint: ScrapedFingerprint,
  input: ScrapeInput
): SiteManifest {

  // Bei Konkurrenz: Farben NICHT übernehmen — differenzieren
  const useColors = input.intent !== 'competitor';

  // Bei bestehender Brand: Farben nie überschreiben
  const hasBrand = manifest._decision_log.colors !== 'branche-default';

  return {
    ...manifest,
    design_tokens: {
      ...manifest.design_tokens,
      colors: (useColors && !hasBrand)
        ? mapFingerprintColors(fingerprint.colors)
        : manifest.design_tokens.colors,
      typography: fingerprint.typography.heading_font
        ? mapFingerprintTypography(fingerprint.typography)
        : manifest.design_tokens.typography,
    },
    style_paradigm: fingerprint.paradigm_detected,
    style_source: {
      type:    'scraped-url',
      url:     input.url,
      intent:  input.intent,
      confidence: fingerprint.confidence,
    },
    section_stacking_rules: mergeSectionRules(
      manifest.section_stacking_rules,
      fingerprint.layout
    ),
    _decision_log: {
      ...manifest._decision_log,
      scrape_sources: [
        ...(manifest._decision_log.scrape_sources ?? []),
        { url: input.url, intent: input.intent, scraped_at: fingerprint.scraped_at }
      ],
      paradigm: `${fingerprint.paradigm_detected} — auto-detected from ${input.url}`,
      colors: useColors && !hasBrand
        ? `Extracted from ${input.url} (confidence: ${fingerprint.confidence})`
        : manifest._decision_log.colors,
    }
  };
}
```

---

### 19.5 Anwendungsbeispiel — Unzer-Style für vitakents

```
Nutzer gibt ein:
  Inspiration URL: https://www.unzer.com/de
  Intent: inspiration
  Merge Mode: blend (Layout übernehmen, eigene Farben behalten)

Scraper extrahiert aus Unzer:
  paradigm_detected: "bold-expressive"
  colors.primary: "#C8102E" (Unzer Rot)  ← wird NICHT übernommen (blend mode)
  layout.full_bleed: true                ← wird übernommen
  layout.diagonal_cuts: true             ← wird übernommen
  decoration.color_overlays: true        ← wird übernommen
  section_sequence: ["hero-fullbleed", "features-grid", "stats-row", "logo-cloud", "cta-diagonal"]

Manifest nach Merge:
  style_paradigm: "bold-expressive"      ← von Unzer
  design_tokens.colors.primary: "#1B2B4B" ← vitakents eigene Farbe bleibt
  design_tokens.colors.accent: "#E85D30"  ← vitakents eigene Farbe bleibt
  section_stacking_rules.hero: "hero-fullbleed mit color_overlay"  ← von Unzer
  style_dictionary: diagonal_cuts: true  ← von Unzer
  _decision_log.scrape_sources: [{ url: "unzer.com", intent: "inspiration" }]
```

---

### 19.6 Multi-URL Scraping — Stil kombinieren

```typescript
// Mehrere URLs scrapen und kombinieren
async function scrapeMultiple(inputs: ScrapeInput[]): Promise<SiteManifest> {
  const fingerprints = await Promise.all(
    inputs.map(i => scrapeSite(i.url).then(fp => ({ fp, input: i })))
  );

  // Priorität: höhere Confidence gewinnt bei Konflikten
  // Intent-Hierarchie: own-brand > inspiration > competitor
  let manifest = createBaseManifest();

  for (const { fp, input } of fingerprints.sort(byIntentPriority)) {
    manifest = mergeFingerprint(manifest, fp, input);
  }

  return manifest;
}

// Beispiel: Unzer-Layout + Vercel-Typografie + eigene Farben
const inputs: ScrapeInput[] = [
  { url: 'https://unzer.com',  intent: 'inspiration', merge_mode: 'blend' },
  { url: 'https://vercel.com', intent: 'inspiration', merge_mode: 'blend' },
  // eigene Brand-Farben kommen aus dem Briefing, nicht aus Scraping
];
```

---

### 19.7 Endpunkt & Dateistruktur

**API Endpunkt:** `POST /api/scrape-site`

```typescript
// Request
interface ScrapeSiteRequest {
  url:        string;
  intent:     'inspiration' | 'competitor' | 'own-brand';
  merge_mode: 'replace' | 'blend' | 'reference-only';
  manifest_id?: string;   // falls in bestehenden Manifest mergen
}

// Response
interface ScrapeSiteResponse {
  fingerprint:        ScrapedFingerprint;
  manifest_preview:   Partial<SiteManifest>;  // was sich ändern würde
  diff:               ManifestDiff[];          // konkrete Änderungen
  confidence:         number;
  needs_confirmation: boolean;                 // bei niedrigem confidence
}
```

**Neue Dateistruktur:**

```
/wbuilder-v2/src/
  /lib/
    /scraping/                          ← NEU
      siteScraperService.ts             ← Playwright + Vision
      fingerprintExtractor.ts           ← CSS-Daten aufbereiten
      manifestMerger.ts                 ← Fingerprint → Manifest merge
      scrapeCache.ts                    ← Scraped results 24h cachen
  /app/api/
    /scrape-site/
      route.ts                          ← POST Endpunkt
  /data/
    /scrape-cache/                      ← gecachte Fingerprints als JSON
```

**Dependencies:**

```json
{
  "playwright": "^1.40.0",
  "sharp": "^0.33.0"
}
```

---

### 19.8 Manifest — Erweiterung für Scraping

```json
"style_source": {
  "type": "scraped-url | user-selected | screenshot | branche-default",
  "url": "https://unzer.com/de",
  "intent": "inspiration",
  "confidence": 0.87,
  "scraped_at": "2026-03-15T14:32:00Z",
  "merge_mode": "blend",
  "what_was_taken": ["paradigm", "layout.full_bleed", "layout.diagonal_cuts", "section_sequence"],
  "what_was_kept":  ["colors", "typography.heading_font"]
},
"_decision_log": {
  "scrape_sources": [
    { "url": "https://unzer.com/de",  "intent": "inspiration", "confidence": 0.87 }
  ],
  "paradigm": "bold-expressive — auto-detected from unzer.com (conf: 0.87)",
  "colors":   "vitakents brand colors — not overwritten (blend mode)",
  "layout":   "full_bleed + diagonal_cuts from unzer.com scrape"
}
```

---

## 20. Design Pattern Library — Von Scraping zu wiederverwendbaren Bausteinen

Kapitel 19 beschreibt wie man eine einzelne URL scrapt und das Ergebnis in ein Manifest merged. Dieses Kapitel beschreibt das größere Bild: **wie scraped Entscheidungen zu dauerhaften, wiederverwendbaren Bausteinen werden**, die über Projekte hinweg einsetzbar sind.

Das zentrale Prinzip: Ein Scraping-Ergebnis wird nicht einmalig verbraucht. Es wird **zerlegt in atomare Design-Entscheidungen**, die einzeln, kombinierbar und project-unabhängig wiederverwendet werden können.

---

### 20.1 Das Problem mit naivem Scraping

Naives Scraping extrahiert alles auf einmal und versucht es zu übernehmen:

```
unzer.com → Fingerprint → Manifest
Problem: Farben passen nicht, Fonts sind lizenziert, Layout passt nicht zum Kunden
```

Das scheitert weil ein Website-Design ein **untrennbares Paket** ist — Farben, Fonts, Layout und Decoration sind zusammen entworfen worden. Wenn man nur Layout übernimmt aber andere Farben nimmt, stimmt oft die Proportionierung nicht mehr.

**Die Lösung: Atomare Pattern-Extraktion.** Statt die ganze Site zu übernehmen, extrahiert man **unabhängige Design-Entscheidungen** die einzeln einsetzbar sind:

```
unzer.com → scrapen → atomare Patterns:
  Pattern A: "concave-bottom section transition"    → universell einsetzbar
  Pattern B: "full-bleed photo + tinted overlay"   → universell einsetzbar
  Pattern C: "stats row mit großen roten Zahlen"   → einsetzbar wenn Accent passt
  Pattern D: "diagonal red CTA sweep"              → einsetzbar in bold-expressive
  
  NICHT extrahiert als Pattern:
  - Unzer-Rot #C8102E                              → Brand-spezifisch
  - Spezifische Font-Kombination                   → Lizenzfrage unklar
```

---

### 20.2 Pattern-Typen — Taxonomie

Jedes gescrapte Pattern hat einen **Typ** der bestimmt wie es wiederverwendet wird:

```typescript
type PatternType =
  // Layout-Entscheidungen — vollständig brand-agnostisch
  | 'section-transition'     // concave-bottom, wave, diagonal etc.
  | 'hero-layout'            // split-screen, full-bleed, centered-text
  | 'section-sequence'       // die Reihenfolge der Sections auf einer Seite
  | 'grid-pattern'           // bento, asymmetric-3col, alternating-2col
  | 'whitespace-rhythm'      // tight vs generous vs extreme
  | 'scroll-behavior'        // sticky-nav, parallax, fade-in

  // Decoration-Entscheidungen — ggf. Farb-agnostisch
  | 'background-treatment'   // photo-overlay, mesh-gradient, geometric-shapes
  | 'card-style'             // glassmorphism, border-only, shadow-heavy
  | 'image-treatment'        // border-radius-style, clip-path, overlay

  // Typografie-Entscheidungen
  | 'type-hierarchy'         // wie viele Ebenen, welche Gewichte
  | 'display-font-usage'     // wann/wie Display-Fonts eingesetzt werden

  // Animations-Entscheidungen — vollständig brand-agnostisch
  | 'hover-micro-interaction' // scale, magnetic, reveal
  | 'text-animation'          // word-cycle, fade-up, scramble
  | 'scroll-animation'        // counter-tick, parallax, reveal-on-scroll
```

---

### 20.3 Pattern-Datenmodell

**Datei:** `src/data/pattern-library/patterns.json` *(wächst automatisch)*

```typescript
interface DesignPattern {
  id:           string           // "unzer-concave-transition-001"
  type:         PatternType
  source_url:   string           // woher
  scraped_at:   string
  confidence:   number           // 0-1

  name:         string           // "Konkave Section-Transition"
  description:  string           // "Dunkle Section endet mit nach innen gewölbter Kurve"
  tags:         string[]         // ["transition", "concave", "dark-section", "unzer-style"]
  industries:   string[]         // welche Branchen passen: ["fintech", "saas", "b2b"]
  paradigms:    StyleParadigm[]  // kompatible Paradigmen: ["bold-expressive"]

  // Das eigentliche Pattern — was ins System übernommen wird
  implementation: {
    // Für section-transition:
    css_snippet?:   string   // fertiger CSS-Code
    html_snippet?:  string   // fertiges HTML-Pattern
    placeholder?:   string   // Pass-1-Placeholder-Syntax
    style_dict_key: string   // welcher Key im Style Dictionary gesetzt wird
    style_dict_val: unknown  // welcher Wert gesetzt wird
  }

  // Vorschau
  preview_description: string  // für Briefing Wizard UI
  visual_weight:       'light' | 'medium' | 'heavy'
  brand_dependency:    'none' | 'color-dependent' | 'font-dependent'
  // none = komplett brand-agnostisch, immer einsetzbar
  // color-dependent = braucht Accent-/Primary-Farbe aus Manifest
  // font-dependent = braucht spezifischen Font
}
```

**Beispiel — Pattern aus Unzer-Scraping:**

```json
{
  "id": "unzer-concave-bottom-001",
  "type": "section-transition",
  "source_url": "https://unzer.com/de",
  "scraped_at": "2026-03-15T14:32:00Z",
  "confidence": 0.94,
  "name": "Konkave Section-Kurve (Unzer-Stil)",
  "description": "Dunkle Hero-Section endet unten mit einer nach innen gewölbten weißen Kurve. Weißes Oval ragt in die Section hinein.",
  "tags": ["concave", "section-transition", "dark-hero", "curved-bottom"],
  "industries": ["fintech", "saas", "b2b-services", "payments"],
  "paradigms": ["bold-expressive", "minimal-clean"],
  "implementation": {
    "css_snippet": ".section-concave{position:relative;overflow:hidden}.section-concave::after{content:'';position:absolute;bottom:-60px;left:-5%;right:-5%;height:100px;background:var(--next-section-color, #fff);border-radius:50%;}",
    "placeholder": "<!-- [TRANSITION: concave-bottom | next=white | depth=60px] -->",
    "style_dict_key": "rules.layout.section_transition",
    "style_dict_val": "concave-bottom"
  },
  "preview_description": "Unterkante der Section wölbt sich nach innen — weiche, organische Trennung statt harter Linie",
  "visual_weight": "medium",
  "brand_dependency": "none"
}
```

```json
{
  "id": "vercel-dark-hero-photo-overlay-001",
  "type": "background-treatment",
  "source_url": "https://vercel.com",
  "scraped_at": "2026-03-15T15:10:00Z",
  "confidence": 0.91,
  "name": "Dunkles Hero mit Foto-Tint-Overlay",
  "description": "Vollbild-Hintergrundfoto mit semitransparentem dunklen Overlay. Text darüber in Weiß. Accent-Farbe als Gradient-Akzent.",
  "tags": ["full-bleed", "photo-overlay", "dark-hero", "tinted"],
  "industries": ["saas", "tech", "fintech", "b2b"],
  "paradigms": ["bold-expressive", "tech-dark"],
  "implementation": {
    "html_snippet": "<section class=\"relative overflow-hidden isolate min-h-[70vh] flex items-end\"><div class=\"absolute inset-0 bg-dark\"></div><!-- [IMG: slot=hero-bg | source=crawl] --><div class=\"absolute inset-0\" style=\"background:linear-gradient(to top, var(--color-dark) 30%, rgba(0,0,0,.5) 70%, rgba(0,0,0,.2))\"></div><div class=\"relative z-10 max-w-7xl mx-auto px-5 md:px-8 pb-16 md:pb-24\"><!-- content --></div></section>",
    "placeholder": "<!-- [BG: photo-overlay | darken=0.6 | gradient=bottom] -->",
    "style_dict_key": "rules.decoration.color_overlays",
    "style_dict_val": true
  },
  "preview_description": "Foto im Hintergrund mit dunklem Overlay — typisch für Premium-SaaS Hero Sections",
  "visual_weight": "heavy",
  "brand_dependency": "none"
}
```

---

### 20.4 Automatischer Pattern-Extraktor

Nach dem Scraping werden aus dem `ScrapedFingerprint` automatisch atomare Patterns extrahiert und gespeichert:

**Datei:** `src/lib/scraping/patternExtractor.ts` *(neu)*

```typescript
import { ScrapedFingerprint } from './siteScraperService'
import { DesignPattern, PatternType } from '../types/pattern'
import { readFileSync, writeFileSync } from 'fs'
import path from 'path'

export function extractPatterns(fp: ScrapedFingerprint): DesignPattern[] {
  const patterns: DesignPattern[] = []
  const base = { source_url: fp.source_url, scraped_at: fp.scraped_at }

  // Section transition
  if (fp.layout.concave_sections) {
    patterns.push({
      ...base,
      id:          `${slugify(fp.source_url)}-concave-${Date.now()}`,
      type:        'section-transition',
      confidence:  fp.confidence,
      name:        'Konkave Section-Kurve',
      description: 'Section endet mit nach innen gewölbter Kurve',
      tags:        ['concave', 'section-transition', 'curved-bottom'],
      industries:  inferIndustries(fp.tags),
      paradigms:   [fp.paradigm_detected],
      implementation: {
        placeholder:    '<!-- [TRANSITION: concave-bottom | next=white | depth=60px] -->',
        style_dict_key: 'rules.layout.section_transition',
        style_dict_val: 'concave-bottom',
        css_snippet:    CONCAVE_CSS,
      },
      preview_description: 'Unterkante wölbt sich nach innen',
      visual_weight:       'medium',
      brand_dependency:    'none',
    })
  }

  if (fp.layout.diagonal_cuts) {
    patterns.push({
      ...base,
      id:   `${slugify(fp.source_url)}-diagonal-${Date.now()}`,
      type: 'section-transition',
      confidence: fp.confidence,
      name: 'Diagonaler Abschnitt',
      tags: ['diagonal', 'clip-path', 'dynamic'],
      industries: inferIndustries(fp.tags),
      paradigms:  [fp.paradigm_detected],
      implementation: {
        style_dict_key: 'rules.layout.section_transition',
        style_dict_val: 'diagonal-bottom',
        css_snippet:    DIAGONAL_CSS,
      },
      preview_description: 'Section endet diagonal — dynamisch und modern',
      visual_weight: 'medium', brand_dependency: 'none',
      description: 'Diagonaler Schnitt am unteren Rand der Section',
    })
  }

  // Background treatment
  if (fp.decoration.color_overlays) {
    patterns.push({
      ...base,
      id:   `${slugify(fp.source_url)}-photo-overlay-${Date.now()}`,
      type: 'background-treatment',
      confidence: fp.confidence,
      name: 'Foto mit Farb-Overlay',
      tags: ['photo-overlay', 'full-bleed', fp.layout.full_bleed ? 'full-bleed' : ''].filter(Boolean),
      industries: inferIndustries(fp.tags),
      paradigms:  [fp.paradigm_detected],
      implementation: {
        placeholder:    '<!-- [BG: photo-overlay | darken=0.6] -->',
        style_dict_key: 'rules.decoration.color_overlays',
        style_dict_val: true,
      },
      preview_description: 'Hintergrundfoto mit dunklem Tint-Overlay',
      visual_weight: 'heavy', brand_dependency: 'none',
      description: 'Vollbild-Foto mit semitransparentem Overlay drüber',
    })
  }

  // Animation patterns
  if (fp.animation.budget === 'rich' || fp.animation.text_animations) {
    patterns.push({
      ...base,
      id:   `${slugify(fp.source_url)}-word-cycle-${Date.now()}`,
      type: 'text-animation',
      confidence: fp.confidence * 0.8,
      name: 'Word-Cycle Headline',
      tags: ['animation', 'word-cycle', 'headline', 'text-animation'],
      industries: inferIndustries(fp.tags),
      paradigms:  [fp.paradigm_detected],
      implementation: {
        placeholder: '<!-- [ANIM: word-cycle | words: ["Wort1","Wort2","Wort3"]] -->',
        style_dict_key: 'rules.animation.text_animations_allowed',
        style_dict_val: ['word-cycle'],
      },
      preview_description: 'Headline wechselt zyklisch zwischen Schlüsselbegriffen',
      visual_weight: 'light', brand_dependency: 'none',
      description: 'Animated word rotation in der Headline — Aufmerksamkeit ohne Ablenkung',
    })
  }

  return patterns
}

export function savePatterns(patterns: DesignPattern[]): void {
  const filePath = path.join(process.cwd(), 'src/data/pattern-library/patterns.json')
  let existing: DesignPattern[] = []
  try { existing = JSON.parse(readFileSync(filePath, 'utf-8')) } catch {}

  // Deduplication: nie denselben Pattern-Typ von derselben URL doppelt speichern
  const deduped = patterns.filter(p =>
    !existing.some(e => e.source_url === p.source_url && e.type === p.type)
  )

  writeFileSync(filePath, JSON.stringify([...existing, ...deduped], null, 2))
}

const CONCAVE_CSS = `.section-concave{position:relative;overflow:hidden}.section-concave::after{content:'';position:absolute;bottom:-60px;left:-5%;right:-5%;height:100px;background:var(--next-section-color,#fff);border-radius:50%;}`
const DIAGONAL_CSS = `.section-diagonal{clip-path:polygon(0 0,100% 0,100% 88%,0 100%);}`

function slugify(url: string): string {
  return url.replace(/https?:\/\//,'').replace(/[^a-z0-9]/gi,'-').slice(0,30)
}

function inferIndustries(tags: string[]): string[] {
  const map: Record<string, string[]> = {
    'payment': ['fintech','e-commerce'],
    'saas':    ['saas','tech'],
    'dark':    ['saas','tech','fintech'],
    'minimal': ['consulting','law','real-estate'],
    'luxury':  ['fashion','real-estate','premium'],
  }
  const result = new Set<string>()
  tags.forEach(t => (map[t.toLowerCase()] ?? []).forEach(i => result.add(i)))
  return result.size ? [...result] : ['general']
}
```

---

### 20.5 Pattern Library API

**Datei:** `src/lib/patterns/patternLibrary.ts` *(neu)*

```typescript
import { readFileSync } from 'fs'
import path from 'path'
import { DesignPattern, PatternType } from '../types/pattern'
import { StyleParadigm } from '../types/manifest'

function loadAll(): DesignPattern[] {
  try {
    const p = path.join(process.cwd(), 'src/data/pattern-library/patterns.json')
    return JSON.parse(readFileSync(p, 'utf-8'))
  } catch { return [] }
}

// Alle Patterns für einen Paradigma — für Briefing Wizard
export function getPatternsForParadigm(paradigm: StyleParadigm): DesignPattern[] {
  return loadAll().filter(p => p.paradigms.includes(paradigm))
}

// Alle Patterns eines Typs — für Style Dictionary Enrichment
export function getPatternsByType(type: PatternType): DesignPattern[] {
  return loadAll()
    .filter(p => p.type === type)
    .sort((a, b) => b.confidence - a.confidence)
}

// Bestes Pattern für einen konkreten Style-Dictionary-Key
export function getBestPatternForKey(key: string, paradigm: StyleParadigm): DesignPattern | null {
  return loadAll()
    .filter(p => p.implementation.style_dict_key === key && p.paradigms.includes(paradigm))
    .sort((a, b) => b.confidence - a.confidence)[0] ?? null
}

// Style Dictionary mit Pattern-Library anreichern
export function enrichStyleDictionary(
  dict: StyleDictionary,
  selectedPatterns: DesignPattern[]
): StyleDictionary {
  const enriched = { ...dict }
  const alreadySet = new Set<string>() // first pattern per key wins

  for (const pattern of selectedPatterns) {
    const { style_dict_key, style_dict_val } = pattern.implementation
    if (!style_dict_key) continue
    if (alreadySet.has(style_dict_key)) continue // first-wins: skip duplicates
    alreadySet.add(style_dict_key)

    // Navigate dot-path: "rules.layout.section_transition"
    const keys = style_dict_key.split('.')
    let obj: Record<string, unknown> = enriched as unknown as Record<string, unknown>
    for (let i = 0; i < keys.length - 1; i++) {
      obj = (obj[keys[i]] ?? {}) as Record<string, unknown>
    }
    obj[keys[keys.length - 1]] = style_dict_val
  }

  return enriched
}

// html_patterns aus Patterns befüllen — für Pass 1
export function buildHtmlPatternsFromLibrary(
  selectedPatterns: DesignPattern[]
): Record<string, string> {
  const result: Record<string, string> = {}
  for (const p of selectedPatterns) {
    if (p.implementation.html_snippet) {
      result[p.type] = p.implementation.html_snippet
    }
    if (p.implementation.placeholder) {
      result[`${p.type}_placeholder`] = p.implementation.placeholder
    }
  }
  return result
}
```

---

### 20.6 Integration in den Briefing Wizard — Step 3b "Patterns"

Im Briefing Wizard gibt es nach der Paradigma-Wahl einen neuen Sub-Step: **"Design-Patterns wählen"**. Hier sieht der Nutzer alle verfügbaren Patterns aus der Library — gefiltert nach dem gewählten Paradigma.

```
Step 3 — Design-Richtung:
  [bold-expressive gewählt]
  ↓
Step 3b — Patterns aus Library:
  Zeige alle Patterns mit paradigms.includes('bold-expressive')
  Gruppiert nach PatternType:
  
  Section Transitions (3 verfügbar):
    [✓] Konkave Kurve (Unzer)     — brand_dependency: none   ← vorausgewählt
    [ ] Diagonaler Schnitt        — brand_dependency: none
    [ ] SVG Wave                  — brand_dependency: none

  Hero Background (2 verfügbar):
    [✓] Foto mit Overlay (Vercel) — brand_dependency: none   ← vorausgewählt
    [ ] Mesh Gradient             — brand_dependency: color-dependent

  Text Animations (2 verfügbar):
    [ ] Word-Cycle Headline       — brand_dependency: none
    [✓] Fade-Up on Scroll        — brand_dependency: none   ← vorausgewählt

  + URL eingeben → jetzt scrapen → Pattern sofort zur Auswahl
```

**Datei:** `src/components/briefing/PatternPicker.tsx` *(neu)*

```typescript
interface PatternPickerProps {
  paradigm: StyleParadigm
  selected: string[]           // Pattern IDs
  onChange: (ids: string[]) => void
  onScrapeUrl?: (url: string) => Promise<void>
}

export function PatternPicker({ paradigm, selected, onChange, onScrapeUrl }: PatternPickerProps) {
  const patterns = getPatternsForParadigm(paradigm)
  const grouped  = groupBy(patterns, p => p.type)

  // Beim Wählen eines Patterns: Style Dictionary sofort anreichern und Preview aktualisieren
  const handleToggle = (id: string) => {
    const next = selected.includes(id)
      ? selected.filter(s => s !== id)
      : [...selected, id]
    onChange(next)
  }

  return (
    <div>
      {Object.entries(grouped).map(([type, patterns]) => (
        <div key={type}>
          <h4>{PATTERN_TYPE_LABELS[type as PatternType]}</h4>
          <div className="grid grid-cols-2 gap-3">
            {patterns.map(p => (
              <PatternCard
                key={p.id}
                pattern={p}
                selected={selected.includes(p.id)}
                onToggle={() => handleToggle(p.id)}
              />
            ))}
          </div>
        </div>
      ))}

      {/* URL direkt in Wizard scrapen */}
      <div className="mt-6 p-4 border border-dashed rounded">
        <p className="text-sm text-muted">Weitere Inspiration scrapen:</p>
        <div className="flex gap-2 mt-2">
          <input
            type="url"
            placeholder="https://website-die-ich-mag.de"
            className="flex-1 input"
            onKeyDown={e => e.key === 'Enter' && onScrapeUrl?.((e.target as HTMLInputElement).value)}
          />
          <button>Analysieren</button>
        </div>
      </div>
    </div>
  )
}
```

---

### 20.7 Wie Patterns in Pass 1 ankommen

Die ausgewählten Patterns werden in zwei Formen an Pass 1 übergeben:

**Form 1 — Enriched Style Dictionary** (das `rules`-Objekt enthält die Pattern-Werte):

```json
{
  "rules": {
    "layout": {
      "section_transition": "concave-bottom",   ← von Pattern gesetzt
      "full_bleed_allowed": true                ← von Pattern gesetzt
    },
    "decoration": {
      "color_overlays": true                    ← von Pattern gesetzt
    },
    "animation": {
      "text_animations_allowed": ["word-cycle"] ← von Pattern gesetzt
    }
  },
  "html_patterns": {
    "section_transition_placeholder": "<!-- [TRANSITION: concave-bottom | next=white | depth=60px] -->",
    "background-treatment_placeholder": "<!-- [BG: photo-overlay | darken=0.6] -->"
  }
}
```

**Form 2 — Pass 1 Prompt erhält explizite Pattern-Anweisungen:**

```
SELECTED DESIGN PATTERNS (must implement all of these):

1. section-transition: concave-bottom
   → Every dark section ending must have: <!-- [TRANSITION: concave-bottom | next=white | depth=60px] -->
   → Add class "section-concave" to section root element

2. background-treatment: photo-overlay
   → Hero section must use: <!-- [BG: photo-overlay | darken=0.6] -->
   → Structure: relative section > absolute bg > absolute overlay > relative content

3. text-animation: word-cycle
   → Primary headline must contain a span with: <!-- [ANIM: word-cycle | words: [...]] -->
   → Wrap the animated word in: <span id="wordCycle" class="text-accent">Initialwort</span>

These patterns come from scraped source sites and represent proven design decisions.
They MUST appear in the output exactly as specified.
```

Pass 2 löst dann alle Placeholders auf — die Patterns fließen nahtlos durch die Pipeline.

---

### 20.8 Trend-Scraping — Pattern Library automatisch aufbauen

Statt nur auf Kundenwunsch zu scrapen, kann die Library automatisch durch **kuratierte Quellen** aufgebaut werden:

**Datei:** `src/data/pattern-library/sources.json` *(manuell kuratiert)*

```json
{
  "trend_sources": [
    {
      "url": "https://awwwards.com/sites/",
      "frequency": "weekly",
      "intent": "inspiration",
      "auto_scrape": false,
      "note": "Manuell: Awwwards-Gewinner regelmäßig scrapen"
    },
    {
      "url": "https://siteinspire.com",
      "frequency": "weekly",
      "auto_scrape": false
    }
  ],
  "curated_references": [
    { "url": "https://stripe.com",     "label": "Stripe — Tech Premium",  "paradigm": "minimal-clean" },
    { "url": "https://vercel.com",     "label": "Vercel — Tech Dark",     "paradigm": "tech-dark" },
    { "url": "https://linear.app",     "label": "Linear — Bold Dark",     "paradigm": "tech-dark" },
    { "url": "https://unzer.com/de",   "label": "Unzer — Bold Finance",   "paradigm": "bold-expressive" },
    { "url": "https://notion.so",      "label": "Notion — Minimal",       "paradigm": "minimal-clean" },
    { "url": "https://framer.com",     "label": "Framer — Bold Creative", "paradigm": "bold-expressive" }
  ]
}
```

**Scraping-Script:** `scripts/scrape-trends.ts` *(neu — läuft manuell oder als Cronjob)*

```typescript
import { scrapeSite } from '../src/lib/scraping/siteScraperService'
import { extractPatterns, savePatterns } from '../src/lib/scraping/patternExtractor'
import sources from '../src/data/pattern-library/sources.json'

async function main() {
  for (const source of sources.curated_references) {
    console.log(`Scraping ${source.url}...`)
    try {
      const fingerprint = await scrapeSite(source.url)
      const patterns    = extractPatterns(fingerprint)
      savePatterns(patterns)
      console.log(`  → ${patterns.length} Patterns gespeichert`)
    } catch (e) {
      console.error(`  → Fehler: ${e}`)
    }
    // Rate limiting — nicht zu aggressiv
    await new Promise(r => setTimeout(r, 3000))
  }
}

main()
```

Ausführen: `npx tsx scripts/scrape-trends.ts`

---

### 20.9 Vollständiger Datenfluss — Zusammenfassung

```
                    PATTERN LIBRARY AUFBAUEN
                    ─────────────────────────
URL eingeben  ─→  Puppeteer Screenshot + CSS  ─→  GPT-4o Vision
                                                        ↓
                                              ScrapedFingerprint
                                                        ↓
                                              patternExtractor.ts
                                                        ↓
                                     Atomare DesignPatterns (5–10 pro Site)
                                                        ↓
                                     src/data/pattern-library/patterns.json
                                     (wächst mit jeder gescrapten Site)


                    PATTERN IN PROJEKT VERWENDEN
                    ─────────────────────────────
Briefing Wizard  →  Paradigma wählen  →  Step 3b: Pattern Picker
                                              ↓
                                    Nutzer wählt 3–5 Patterns
                                              ↓
                              patternLibrary.enrichStyleDictionary()
                                              ↓
                         Style Dictionary + html_patterns aktualisiert
                                              ↓
                              Pass 1 Prompt mit Pattern-Anweisungen
                                              ↓
                         HTML mit Placeholders: [TRANSITION:...] [BG:...]
                                              ↓
                         Pass 2 löst Placeholders auf → fertiger Code
                                              ↓
                              Generierte Site implementiert Pattern
```

---

### 20.10 Fehlende Typen und Hilfsdateien

#### `src/lib/types/pattern.ts` *(neu — vollständig)*

```typescript
import { StyleParadigm } from './manifest'

export type PatternType =
  | 'section-transition'
  | 'hero-layout'
  | 'section-sequence'
  | 'grid-pattern'
  | 'whitespace-rhythm'
  | 'scroll-behavior'
  | 'background-treatment'
  | 'card-style'
  | 'image-treatment'
  | 'type-hierarchy'
  | 'display-font-usage'
  | 'hover-micro-interaction'
  | 'text-animation'
  | 'scroll-animation'

export interface DesignPattern {
  id:           string
  type:         PatternType
  source_url:   string
  scraped_at:   string
  confidence:   number
  name:         string
  description:  string
  tags:         string[]
  industries:   string[]
  paradigms:    StyleParadigm[]
  implementation: {
    css_snippet?:   string
    html_snippet?:  string
    placeholder?:   string
    style_dict_key: string
    style_dict_val: unknown
  }
  preview_description: string
  visual_weight:       'light' | 'medium' | 'heavy'
  brand_dependency:    'none' | 'color-dependent' | 'font-dependent'
}
```

#### `src/components/briefing/PatternPicker.tsx` — vollständig *(fehlende Hilfsdateien)*

```typescript
'use client'
import { getPatternsForParadigm } from '@/lib/patterns/patternLibrary'
import { DesignPattern, PatternType } from '@/lib/types/pattern'
import { StyleParadigm } from '@/lib/types/manifest'

// Labels für PatternType-Gruppen in der UI
export const PATTERN_TYPE_LABELS: Record<PatternType, string> = {
  'section-transition':      'Section-Übergänge',
  'hero-layout':             'Hero-Layout',
  'section-sequence':        'Section-Reihenfolge',
  'grid-pattern':            'Grid-Muster',
  'whitespace-rhythm':       'Whitespace-Rhythmus',
  'scroll-behavior':         'Scroll-Verhalten',
  'background-treatment':    'Hero-Hintergrund',
  'card-style':              'Karten-Stil',
  'image-treatment':         'Bildbehandlung',
  'type-hierarchy':          'Typografie-Hierarchie',
  'display-font-usage':      'Display-Font-Einsatz',
  'hover-micro-interaction': 'Hover-Animationen',
  'text-animation':          'Text-Animationen',
  'scroll-animation':        'Scroll-Animationen',
}

// Einfache groupBy-Hilfsfunktion
function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = key(item)
    if (!acc[k]) acc[k] = []
    acc[k].push(item)
    return acc
  }, {} as Record<string, T[]>)
}

// PatternCard — eine einzelne wählbare Karte
function PatternCard({
  pattern, selected, onToggle,
}: { pattern: DesignPattern; selected: boolean; onToggle: () => void }) {
  const depColor = {
    'none':             'text-green-600',
    'color-dependent':  'text-amber-600',
    'font-dependent':   'text-blue-600',
  }[pattern.brand_dependency]

  return (
    <button
      onClick={onToggle}
      className={`
        text-left p-4 rounded-lg border-2 transition-all
        ${selected
          ? 'border-accent bg-accent/5 shadow-sm'
          : 'border-transparent bg-surface hover:border-accent/30'}
      `}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium leading-tight">{pattern.name}</p>
          <p className="text-xs text-muted mt-1">{pattern.preview_description}</p>
        </div>
        <div className={`
          w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5
          ${selected ? 'bg-accent border-accent' : 'border-current opacity-30'}
        `}>
          {selected && (
            <svg viewBox="0 0 12 12" className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 6l3 3 5-5"/>
            </svg>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3">
        <span className={`text-[10px] font-medium ${depColor}`}>
          {pattern.brand_dependency === 'none' ? 'Brand-unabhängig' :
           pattern.brand_dependency === 'color-dependent' ? 'Benötigt Farben' : 'Benötigt Font'}
        </span>
        <span className="text-[10px] text-muted">·</span>
        <span className="text-[10px] text-muted capitalize">{pattern.visual_weight}</span>
        {pattern.source_url && (
          <>
            <span className="text-[10px] text-muted">·</span>
            <span className="text-[10px] text-muted truncate max-w-[100px]">
              {new URL(pattern.source_url).hostname}
            </span>
          </>
        )}
      </div>
    </button>
  )
}

// Hauptkomponente
interface PatternPickerProps {
  paradigm:    StyleParadigm
  selected:    string[]
  onChange:    (ids: string[]) => void
  onScrapeUrl?: (url: string) => Promise<DesignPattern[]>
}

export function PatternPicker({ paradigm, selected, onChange, onScrapeUrl }: PatternPickerProps) {
  const patterns = getPatternsForParadigm(paradigm)
  const grouped  = groupBy(patterns, p => p.type)

  const handleToggle = (id: string) => {
    onChange(
      selected.includes(id)
        ? selected.filter(s => s !== id)
        : [...selected, id]
    )
  }

  const [scrapeUrl, setScrapeUrl] = useState('')
  const [scraping,  setScraping]  = useState(false)

  async function handleScrape() {
    if (!scrapeUrl || !onScrapeUrl) return
    setScraping(true)
    try {
      const newPatterns = await onScrapeUrl(scrapeUrl)
      // Neu gescrapte Patterns direkt auswählen
      onChange([...selected, ...newPatterns.map(p => p.id)])
      setScrapeUrl('')
    } finally {
      setScraping(false)
    }
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([type, typePatterns]) => (
        <div key={type}>
          <h4 className="text-xs font-semibold tracking-wide uppercase text-muted mb-3">
            {PATTERN_TYPE_LABELS[type as PatternType] ?? type}
            <span className="ml-2 font-normal normal-case">({typePatterns.length})</span>
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {typePatterns.map(p => (
              <PatternCard
                key={p.id}
                pattern={p}
                selected={selected.includes(p.id)}
                onToggle={() => handleToggle(p.id)}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Live-Scraping direkt im Wizard */}
      <div className="p-4 border border-dashed border-accent/30 rounded-lg">
        <p className="text-xs font-medium mb-2">Weitere Inspiration analysieren:</p>
        <div className="flex gap-2">
          <input
            type="url"
            value={scrapeUrl}
            onChange={e => setScrapeUrl(e.target.value)}
            placeholder="https://website-die-ich-mag.de"
            className="flex-1 text-sm px-3 py-2 border rounded-md bg-surface"
            onKeyDown={e => e.key === 'Enter' && handleScrape()}
          />
          <button
            onClick={handleScrape}
            disabled={scraping || !scrapeUrl}
            className="px-4 py-2 text-sm bg-accent text-white rounded-md disabled:opacity-40"
          >
            {scraping ? '…' : 'Analysieren'}
          </button>
        </div>
        <p className="text-[10px] text-muted mt-2">
          Seite wird gescrapt → atomare Patterns extrahiert → sofort zur Auswahl verfügbar
        </p>
      </div>

      {/* Zusammenfassung */}
      {selected.length > 0 && (
        <div className="text-xs text-muted">
          {selected.length} Pattern{selected.length !== 1 ? 's' : ''} ausgewählt —
          werden in Pass 1 als verbindliche Anweisungen übergeben
        </div>
      )}
    </div>
  )
}
```

#### `src/app/api/v2/patterns/route.ts` *(neu — Patterns aus Library lesen + speichern)*

```typescript
import { NextRequest } from 'next/server'
import { getPatternsForParadigm, getPatternsByType } from '@/lib/patterns/patternLibrary'
import { scrapeSite } from '@/lib/scraping/siteScraperService'
import { extractPatterns, savePatterns } from '@/lib/scraping/patternExtractor'

export const runtime = 'nodejs'
export const maxDuration = 60

// GET /api/v2/patterns?paradigm=bold-expressive
// GET /api/v2/patterns?type=section-transition
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const paradigm = searchParams.get('paradigm') as StyleParadigm | null
  const type     = searchParams.get('type')

  if (paradigm) return Response.json({ patterns: getPatternsForParadigm(paradigm) })
  if (type)     return Response.json({ patterns: getPatternsByType(type as PatternType) })
  return Response.json({ error: 'paradigm or type parameter required' }, { status: 400 })
}

// POST /api/v2/patterns/scrape { url: string }
// Scrapt URL → extrahiert Patterns → speichert → gibt neue Patterns zurück
export async function POST(req: NextRequest) {
  const { url } = await req.json()
  if (!url) return Response.json({ error: 'url required' }, { status: 400 })

  const fingerprint   = await scrapeSite(url)
  const newPatterns   = extractPatterns(fingerprint)
  savePatterns(newPatterns)

  return Response.json({
    fingerprint,
    patterns:     newPatterns,
    count:        newPatterns.length,
  })
}
```

---

### 20.11 Dateistruktur — Neue Dateien

```
src/
  lib/
    scraping/
      siteScraperService.ts     ← bereits in Kapitel 19
      patternExtractor.ts       ← NEU: Fingerprint → atomare Patterns
    patterns/
      patternLibrary.ts         ← NEU: CRUD + Enrichment-API
    types/
      manifest.ts               ← bereits in Kapitel 17
      pattern.ts                ← NEU: DesignPattern + PatternType Interface
  components/
    briefing/
      PatternPicker.tsx         ← NEU: UI für Briefing Wizard Step 3b (vollständig implementiert)
  app/
    api/
      v2/
        patterns/
          route.ts              ← NEU: GET (lesen) + POST (scrapen + speichern)
  data/
    pattern-library/
      patterns.json             ← NEU: wächst automatisch (startet als [])
      sources.json              ← NEU: kuratierte Quellen
scripts/
  scrape-trends.ts             ← NEU: manuell ausführbar (npx tsx scripts/scrape-trends.ts)
```

**Initialer Zustand von `src/data/pattern-library/patterns.json`:**
```json
[]
```

**Nach erstem `npx tsx scripts/scrape-trends.ts` mit den 6 kuratierten Sources:**
```
~40–60 atomare Patterns aus: Stripe, Vercel, Linear, Unzer, Notion, Framer
→ Briefing Wizard Step 3b hat sofort sinnvolle Optionen
```

---

## 21. Discovery System — Neue Trends automatisch finden

Kapitel 20 beschreibt das Pattern-Konzept. Dieses Kapitel enthält die **vollständige, getestete Implementierung** des Discovery-Systems: wie neue Design-Patterns ohne vorherige Kategoriedefinition gefunden, bewertet und formalisiert werden.

**Kernidee:** Das System lernt aus jeder gescrapten Site. Was GPT-4o als ungewöhnlich beschreibt, und was der Anomaly-Detector als statistischen Ausreißer erkennt, landet in einer Review-Queue. Du reviewst einmal pro Woche — was 3× gesehen wurde, formalisierst du als Pattern.

---

### 21.1 Drei Erkennungswege

```
Weg 1: GPT-4o Vision (offen)
  Screenshot → "Was ist hier ungewöhnlich?" → freie Beschreibung → surprises[]

Weg 2: Anomaly Detector (deterministisch)
  CSS computed styles → Vergleich mit Baseline → statistische Ausreißer

Weg 3: Duplikat-Erkennung (automatisch)
  Gleiches Pattern auf Site B → seen_count++ → wird "heiß"
```

Das Entscheidende: **Weg 1 hat keine vorgegebenen Kategorien.** GPT-4o beschreibt was es sieht in freiem Text. Das System formalisiert danach — nicht vorher.

---

### 21.2 Neue Dateien

```
src/
  lib/
    discovery/
      discoveryQueue.ts      ← Queue-Management, Lifecycle, Trends
      anomalyDetector.ts     ← CSS-Baseline, statistische Erkennung
    scraping/
      visionPrompt.ts        ← Erweiterter Vision-Prompt mit "surprises"
  app/
    api/v2/discovery/
      route.ts               ← GET queue / POST ingest|status|formalize
    discovery/
      page.tsx               ← Review-Dashboard UI
  data/
    discovery/
      queue.json             ← [startet leer]
      trends.json            ← [startet leer]
      baseline.json          ← [startet leer, wächst mit jeder Site]
```

---

### 21.3 Vision-Prompt Erweiterung

**Datei:** `src/lib/scraping/visionPrompt.ts`

Der bestehende Vision-Prompt in `siteScraperService.ts` bekommt einen zusätzlichen `surprises`-Key. **Kritisch:** Das Modell bekommt keine Kategorieliste — es beschreibt in freiem Text.

```typescript
// Ans Ende des JSON-Schemas im bestehenden buildVisionPrompt() hinzufügen:

  "surprises": [
    {
      "observation": "1-2 sentences: UNUSUAL or CLEVER design decision, rarely seen. Be visual and specific. NOT generic like 'uses dark theme'.",
      "category":    "layout|transition|animation|typography|decoration|interaction|color",
      "confidence":  0.0-1.0,
      "css_hint":    "relevant CSS property if supported by data, else null",
      "reusability": "universal|paradigm-specific|brand-specific"
    }
  ]

// CRITICAL rules for surprises:
// - Include 3-6 genuinely unusual observations
// - reusability brand-specific → wird automatisch übersprungen
// - confidence < 0.65 → wird automatisch übersprungen
// - Quality over quantity
```

---

### 21.4 Scraper-Integration — Patch für siteScraperService.ts

Nach dem Vision-API-Call eine Zeile ergänzen:

```typescript
// VORHER (Zeile ~85):
const fingerprint = JSON.parse(res.choices[0]?.message?.content ?? '{}')
return { ...fingerprint, source_url: url, scraped_at: new Date().toISOString() }

// NACHHER:
const fingerprint = JSON.parse(res.choices[0]?.message?.content ?? '{}')
const result = { ...fingerprint, source_url: url, scraped_at: new Date().toISOString() }

// Discovery: async fire-and-forget — blockiert Rückgabe nicht
ingestDiscovery(result, cssData).catch(err => console.warn('Discovery ingest failed:', err))

return result

// ── Helper (ans Ende der Datei): ──────────────────────────────────────────
async function ingestDiscovery(fingerprint: ScrapedFingerprint, cssData: object) {
  const { ingestSurprises }   = await import('../discovery/discoveryQueue')
  const { detectAnomalies, loadBaseline, updateBaseline, saveBaseline }
    = await import('../discovery/anomalyDetector')

  if (fingerprint.surprises?.length) {
    ingestSurprises(fingerprint.surprises, fingerprint)
  }

  const baseline  = loadBaseline()
  const anomalies = detectAnomalies(cssData as CssData, baseline)
  if (anomalies.length) {
    ingestSurprises(anomalies, fingerprint)
  }
  saveBaseline(updateBaseline(cssData as CssData, baseline))
}
```

Außerdem: den `evaluate()`-Block in Puppeteer mit dem erweiterten Extract-Script ersetzen (aus `anomalyDetector.ts` exportiert als `EXTENDED_EXTRACT`):

```typescript
// In scrapeSite():
const cssData = await page.evaluate(EXTENDED_EXTRACT)
// Statt des bisherigen kürzeren evaluate() Blocks
```

---

### 21.5 Discovery Queue — vollständige API

**Datei:** `src/lib/discovery/discoveryQueue.ts`

```typescript
// Vollständig implementiert und getestet — aus discovery.test.js verifiziert

export function ingestSurprises(surprises, meta): { added: number; incremented: number }
// Filtert brand-specific und low-confidence heraus
// Dedupliziert via Jaccard-Similarity (threshold: 0.4)
// Erhöht seen_count bei Duplikaten

export function getQueue(filter?): DiscoveryEntry[]
// Filter: status, category, reusability, minSeenCount
// Sortiert: seen_count desc, dann confidence desc

export function updateStatus(id, status, reviewerNote?): DiscoveryEntry | null
// Status-Lifecycle: pending → reviewing → approved / rejected

export function formalize(id, overrides?): DesignPattern
// approved → vollständiges DesignPattern Objekt
// Setzt discovery_meta.seen_count + seen_on für Provenienz

export function getTrends(): TrendData[]
// Pro Kategorie: recent (letzte 3 Monate) vs. older + trend-direction

export function getStats(): Stats
// total, pending, approved, rejected, hot (seen_count >= 3)
```

**Similarity-Algorithmus:** Jaccard auf Word-Tokens (>3 Zeichen) + Boost wenn beide kurz und ≥2 Keywords teilen. Verhindert Duplikate auch bei leicht unterschiedlich formulierten Beschreibungen desselben Patterns.

---

### 21.6 Anomaly Detector — vollständige API

**Datei:** `src/lib/discovery/anomalyDetector.ts`

```typescript
export const EXTENDED_EXTRACT: string
// Puppeteer evaluate()-Script — misst 11 boolean flags + numerische Werte

export function updateBaseline(cssData: CssData, baseline: Baseline): Baseline
// Akkumuliert CSS-Property-Häufigkeiten über alle Sites

export function detectAnomalies(cssData: CssData, baseline: Baseline): SurpriseCandidate[]
// Rarity-Score = 1 - (seenCount / sitesCount)
// Threshold: > 0.5 (weniger als 50% der Sites haben das)
// Gibt Array von SurpriseCandidate zurück — kompatibel mit ingestSurprises()

export function loadBaseline(): Baseline
export function saveBaseline(baseline: Baseline): void
```

**Erkannte Patterns:**

| Flag | CSS-Signal | Rarity-Schwelle |
|---|---|---|
| `has_backdrop_blur` | `backdrop-filter: blur()` | >50% |
| `has_clip_path` | `clip-path: polygon()` auf section | >50% |
| `has_gradient_text` | `-webkit-text-fill-color: transparent` | >50% |
| `has_bento_grid` | `grid-column: span 2+` | >50% |
| `has_counter_anim` | `[data-target]` Attribute | >50% |
| `has_pseudo_concave` | `::after border-radius: 50%` | >50% |
| `has_noise_texture` | base64 `background-image` | >50% |
| `has_transparent_nav` | nav `rgba(*, *, *, 0)` | >50% |
| `has_scroll_animation` | `animation-timeline: scroll()` | >50% |
| `has_negative_margin` | sections mit `margin-top < -10px` | >50% |
| `svg_count > 10` | viele dekorative SVGs | — |
| `h1_size >= 80px` | Display-Typografie | — |

---

### 21.7 API-Route

**Datei:** `src/app/api/v2/discovery/route.ts`

```
GET  /api/v2/discovery                    → Queue + Stats
GET  /api/v2/discovery?view=trends        → Trend-Daten
GET  /api/v2/discovery?status=pending     → Gefiltert
GET  /api/v2/discovery?minSeen=3          → Hot-Filter

POST /api/v2/discovery { action: 'ingest', fingerprint, cssData }
  → Vision surprises + Anomalies aufnehmen, Baseline updaten

POST /api/v2/discovery { action: 'status', id, status, reviewer_note }
  → Status-Update (approve / reject)

POST /api/v2/discovery { action: 'formalize', id, overrides? }
  → Approved → DesignPattern, direkt in patterns.json gespeichert
```

---

### 21.8 Review-Dashboard

**Datei:** `src/app/discovery/page.tsx`

Vollständige React-Seite mit:
- Stats-Leiste (total / pending / hot / approved)
- Trend-Sidebar (Kategorie-Balken, ↑↓→★)
- Live-Scraping-Box (URL eingeben → sofort in Queue)
- Filter-Pills (Alle / Pending / Hot 3×+ / Universal / Approved)
- Entry-Cards (klappbar): Observation, CSS-Hint, Quell-URLs, Approve/Reject/Formalize
- Hot-Indikator: gelb umrandet wenn seen_count ≥ 3

**Workflow:**
```
1. Seite öffnen → sieht alle Pending-Kandidaten sortiert nach seen_count
2. Hot-Kandidaten (3×+) priorisieren — die sind bewiesen
3. Karte aufklappen → CSS-Hint + Quell-Sites prüfen
4. Approve → Formalisieren → Pattern landet in patterns.json
5. Nächste Woche: neue Kandidaten aus zwischenzeitlichen Scrapes
```

---

### 21.9 Teststand

```
32/32 Tests bestanden in discovery.test.js

Getestet:
✓ Vision surprises ingestieren (4 Sites: Unzer, Vercel, Framer, Linear)
✓ brand-specific und low-confidence herausgefiltert
✓ Duplikat-Erkennung: counter-anim 4× gesehen, 1 Eintrag mit seen_count=4
✓ Anomaly Detector: 6 Ausreißer bei Unzer vs. 8-Site-Baseline
✓ Lifecycle: pending → reviewing → approved → formalized
✓ Pattern hat discovery_meta.seen_count=4, seen_on=[4 URLs]
✓ Trend-Tracking: interaction=rising, animation=rising
✓ Alle Filter-Abfragen korrekt

Bug gefunden+gefixt:
enrichStyleDictionary hatte last-wins Semantik →
  gefixt auf first-wins (Map alreadySet)
```

---

### 21.10 Datei-Checkliste (Discovery-spezifisch)

```
NEU ERSTELLEN:
src/lib/discovery/discoveryQueue.ts      ← Port von discoveryQueue.js
src/lib/discovery/anomalyDetector.ts     ← Port von anomalyDetector.js
src/lib/scraping/visionPrompt.ts         ← Erweiterter Prompt mit surprises
src/app/api/v2/discovery/route.ts        ← CRUD API
src/app/discovery/page.tsx               ← Review-Dashboard
src/data/discovery/queue.json            ← []
src/data/discovery/trends.json           ← {}
src/data/discovery/baseline.json         ← { sites_count: 0, properties: {} }

BESTEHEND ÄNDERN:
src/lib/scraping/siteScraperService.ts   → ingestDiscovery() + EXTENDED_EXTRACT
```
