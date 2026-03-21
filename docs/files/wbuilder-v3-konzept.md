# wbuilder v3 — Konzept & Architektur
*viminds GmbH · Stand: März 2026*

---

## 1. Überblick

wbuilder ist ein KI-gestütztes Webdesign-Tool das vollständige Landing Pages generiert. v3 führt einen strukturierten Multi-Agent-Flow ein der professionelle Agentur-Rollen simuliert — von der Conversion-Strategie bis zum fertigen HTML.

---

## 2. Der vollständige Generation-Flow

### Phase 1 — Briefing (Kunde, interaktiv)

**Schritt 1 — Moodboard Wizard**
- Firmenname, Branche wählen
- USP in einem Satz
- Content Inventory: Live-Mockup das der Kunde befüllt
  - Hat er Stats? Visuals? Logos? Demo? Video?
  - Inspiration durch Placeholder-Texte ("z.B. 97% Kundenzufriedenheit")
  - Leere Slots = Platzhalter — kein Zwang

**Schritt 2 — Style Wizard**
- Paradigma wählen (visuell, nicht als Text-Label)
- KI schlägt Farben + Font-Pairing vor
- Kunde bestätigt oder ändert
- Effekte: Animation-Budget, Border-Radius, Glassmorphism, Gradient-Text

**Schritt 3 — Layout-Wahl**
- 3 Varianten parallel — basierend auf Content Inventory
- Bento nur empfohlen wenn Stats + Visual vorhanden
- Struktur folgt Content — nicht Branche oder Paradigma

---

### Phase 2 — Moodboard Generation (einmalig pro Seite, ~8 Sek)

```
Call 1 — Conversion Strategist    claude-sonnet-4-6    temp: 0.2
  Input:  Branche + Personas + Content Inventory
  Output: Conversion Blueprint
          → Welcher Pain Point ist der stärkste Hook?
          → Reihenfolge: Problem → Lösung → Beweis → CTA
          → Was verhindert Conversion? Wie entkräften?

Call 2 — Art Director              claude-sonnet-4-6    temp: 0.92
  Input:  Conversion Blueprint + Paradigma + Branche
  Output: Moodboard in Worten
          → Emotion, Leitmotiv, visuelle Spannung
          → KEIN Grid, KEIN Layout — nur Richtung
          → "Dunkel mit einem Licht — wie ein Scheinwerfer"

Call 3 — Fotograf                  claude-sonnet-4-6    temp: 0.7
  Input:  AD-Moodboard + Branche + Content Inventory
  Output: Bild-Briefing pro Section (JSON)
          → Welche Stimmung, Komposition, Overlay
          → picsum-Seed + ID für Platzhalter
          → Was vermeiden ("kein Stock-Foto-Feeling")

Call 4 — Animationsguru            claude-sonnet-4-6    temp: 0.7
  Input:  AD-Moodboard + Paradigma + Animation-Budget
  Output: Animation-Strategie (JSON)
          → Welche Bewegung hat die Seite?
          → Was animiert sich wann und warum?
          → Was bleibt bewusst still?
          → Welche Pattern aus Pattern Library?
```

**→ Moodboard UI:** Kunde sieht Ergebnis aller 4 Calls.
Kann einzelne Bereiche ablehnen und neu generieren (~$0.002).

---

### Phase 3 — Section Generation (parallel, ~25 Sek total)

Pro Section laufen 4 Calls:

```
Call 5 — Texter                    claude-sonnet-4-6    temp: 0.7
  Input:  Conversion Blueprint + AD-Moodboard + Branche
  Output: Alle Texte als JSON
          → Eyebrow, Headline (aufgeteilt), Subline
          → CTA Primary + Secondary + Micro-Copy
          → Stats mit Werten oder Placeholdern
          → Trust Signals
          → Tonalität-Note für Developer

Call 6 — Designer / Strukturgeber  gpt-5.4-mini         temp: 0.2
  Input:  AD-Moodboard + Texter-Output + Layout-Pool + Content Inventory
  Output: Strukturiertes Mockup als JSON
          → layout_id aus sectionLayouts.ts
          → Grid-Proportionen
          → Slot-Zuweisung (was kommt wohin)
          → Typografie-Entscheidungen
          → Eyebrow-Text, Headline-Split

Call 7 — Developer                 claude-sonnet-4-6    temp: 0.35
  Input:  Designer-Mockup + AD-Moodboard + Texter-Output
          + Tech-Constraints + Section Library Referenz
          + Pattern-Snippets (aus Pattern Library)
  Output: Fertiges HTML
          → Tailwind CDN, CSS Custom Properties
          → Icons aus Icon Library (nie erfinden)
          → clamp() für deutsche Headlines
          → Responsive: grid-cols-1 → md:grid-cols-X

Call 8 — QA Validator              gpt-5.4-nano         temp: 0.1
  Input:  HTML
  Output: JSON mit auto-fixable Errors
          → Syntaktische Checks
          → CSS vars korrekt?
          → Pflicht-Responsive vorhanden?
          → Leere Containers?
```

---

### Kosten pro Seite (8 Sections)

| Call | Modell | Freq | Tokens | Kosten |
|------|--------|------|--------|--------|
| Conversion Strategist | claude-sonnet-4-6 | 1× | ~600 | $0.003 |
| Art Director | claude-sonnet-4-6 | 1× | ~300 | $0.002 |
| Fotograf | claude-sonnet-4-6 | 1× | ~400 | $0.002 |
| Animationsguru | claude-sonnet-4-6 | 1× | ~400 | $0.002 |
| Texter | claude-sonnet-4-6 | 8× | ~400 | $0.024 |
| Designer | gpt-5.4-mini | 8× | ~500 | $0.024 |
| Developer | claude-sonnet-4-6 | 8× | ~4000 | $0.480 |
| QA Validator | gpt-5.4-nano | 8× | ~800 | $0.008 |
| **Gesamt** | | | **~45k** | **~$0.545** |

---

## 3. Content Blueprint System

### Was auf jede Seite gehört (Universal)
- Identität: Firmenname + Claim + Zielgruppe + CTA
- Vertrauen: mindestens 1 Beweis (Zahl, Zitat, Logo)
- Conversion: 1 primärer CTA + Risiko-Reduktion

### Content Inventory — die 6 Schlüsselfragen
1. Hast du konkrete Kennzahlen? (Stats-Count)
2. Hast du ein starkes visuelles Asset? (Visual-Type)
3. Hast du Referenzen / Logos / Zitate?
4. Wie viele Hauptleistungen? (Features-Count)
5. Gibt es Demo / Video?
6. Was ist das primäre CTA-Ziel?

### Layout-Entscheidung aus Content

| Content-Situation | Layout |
|-------------------|--------|
| Stats ✓ · Visual ✓ · Logos ✓ | Bento 3-Col |
| Stats ✓ · Visual ✓ · Logos ✗ | Bento 2-Col oder Split |
| Stats ✗ · Visual ✓ · Logos ✓ | Editorial Split |
| Stats ✗ · Visual ✓ · Logos ✗ | Split Screen |
| Stats ✗ · Visual ✗ | Editorial Type |
| Demo ✓ · Stats ✓ | Bento Asymmetric Right |
| Video ✓ | Bottom Anchored |

**Regel: Struktur folgt Content — nicht Branche, nicht Paradigma.**

### Branchenspezifische Best Practices

| Branche | Core Visual | Proof Type | CTA |
|---------|-------------|------------|-----|
| SaaS / Tech | UI-Screenshot | Logos + Uptime | Kostenlos starten |
| Baumanagement | Projektfoto | Stats + Jahre | Beratungsgespräch |
| Consulting | Team-Foto | Logos + Cases | Erstgespräch buchen |
| Coaching | Porträtfoto | Zitate + Transformation | Gespräch buchen |
| E-Commerce | Produktfoto | Bewertungen | Jetzt kaufen |
| Immobilien | Immobilienfoto | Objekte + Jahre | Objekt anfragen |
| Gesundheit | Praxis/Team | Qualifikationen | Termin buchen |
| Industrie | Produktfoto/Render | Zertifikate + Referenzen | Anfrage stellen |

---

## 4. Style System

### 5 Paradigmen

| Paradigma | Charakter | Typografie | Hintergrund |
|-----------|-----------|------------|-------------|
| tech-dark | Dunkel, elektrisch, futuristisch | Syne + Mono | #0a0f1e, Glassmorphism |
| bold-expressive | Energetisch, warm, dynamisch | Syne + Inter | #0f0f0f, Orbs |
| minimal-clean | Hell, ruhig, reduziert | Inter + Inter | #ffffff, kein Dekoration |
| luxury-editorial | Cream, Serif, premium | Playfair + Inter | #faf9f5, dünne Linien |
| brutalist | Raw, flat, direkt | Syne Black | #f2efe8, 2px Borders |

### Style Tokens im Manifest
```json
{
  "style_paradigm": "bold-expressive",
  "design_tokens": {
    "colors": {
      "primary": "#1a0a00",
      "accent": "#c8963e",
      "dark": "#0f0f0f"
    },
    "typography": {
      "font_heading": "'Syne', sans-serif",
      "font_body": "'Inter', sans-serif"
    },
    "effects": {
      "border_radius": "10px",
      "animation_budget": "subtle",
      "glassmorphism": false,
      "gradient_text": true,
      "ambient_orbs": true
    }
  }
}
```

### CSS als Vertrag
Alle Tokens werden als CSS Custom Properties injiziert:
```css
:root {
  --color-primary: #1a0a00;
  --color-accent: #c8963e;
  --font-heading: 'Syne', sans-serif;
  --border-radius: 10px;
}
```
Developer darf **keine Hex-Werte hardcoden** — nur CSS vars.
Globale Style-Änderung = eine Variable ändern → alle Sections updaten.

---

## 5. Drei Libraries

### 5.1 Section Library (Golden Set)
**Zweck:** Qualitäts-Referenz für Developer-Call (Call 7)
**Einsatz:** `findBestSection()` gibt HTML-Skelett zurück das als Inspiration injiziert wird
**Prinzip:** 1 gutes Beispiel > 10 mittelmäßige

**Priorität:**

| Section | Layout | Paradigma | Status |
|---------|--------|-----------|--------|
| Hero | Bento 3-Col | tech-dark | ✓ vorhanden |
| Hero | Editorial | luxury-editorial | ✓ vorhanden |
| Hero | Split Service | bold-expressive | ✗ bauen |
| Hero | Split | minimal-clean | ✗ bauen |
| Features | Bento Grid | tech-dark | ✗ bauen |
| Features | Alternating | bold-expressive | ✗ bauen |
| Stats | Dark Row | tech-dark | ✗ bauen |
| Testimonials | Masonry | bold-expressive | ✗ bauen |
| CTA | Centered Glow | tech-dark | ✗ bauen |

**Index-Eintrag Schema:**
```json
{
  "id": "hero-split-service-bold",
  "type": "hero",
  "layout_id": "hero-split",
  "paradigm": "bold-expressive",
  "quality_score": 9.5,
  "industries": ["construction", "consulting", "coaching"],
  "content_requirements": {
    "has_visual": true,
    "min_stats": 0
  },
  "tags": ["german-optimized", "clamp-headlines", "no-overflow"]
}
```

### 5.2 Pattern Library
**Zweck:** Mikro-Elemente die über Layouts gelegt werden
**Einsatz:** Animationsguru wählt, Developer injiziert als Code-Snippet
**Schlüsselerkenntnis:** Patterns sind der primäre Vielfalt-Hebel

```
src/data/patterns/
  backgrounds/
    grain-overlay.html
    gradient-orbs.html
    dot-grid.html
    noise-texture.html
    animated-gradient.html
  transitions/
    diagonal-cut.html
    concave-wave.html
    fade-overlap.html
    hard-edge.html
  elements/
    glassmorphism-card.html
    stat-counter.html
    logo-strip.html
    badge-row.html
    full-width-column.html
    eyebrow-variants.html
  index.json
```

**Kombinationsbeispiel — gleiche Struktur, 4 verschiedene Outputs:**
```
hero-bento + grain-overlay + diagonal-cut      → Brutalist Version
hero-bento + gradient-orbs + concave-wave      → Tech Dark Version
hero-bento + dot-grid + hard-edge              → Minimal Version
hero-bento + animated-gradient + fade-overlap  → Bold Version
```

**Pattern Index-Eintrag Schema:**
```json
{
  "id": "diagonal-cut-dark",
  "category": "transition",
  "paradigms": ["tech-dark", "bold-expressive"],
  "excludeParadigms": ["minimal-clean", "luxury-editorial"],
  "animation": false,
  "inject_position": "section-bottom",
  "complexity": "simple"
}
```

### 5.3 Layout Library (sectionLayouts.ts)
**Zweck:** Strukturelle Skelette — was ist räumlich möglich
**Einsatz:** Designer-Call (Call 6) wählt aus diesem Pool
**Wichtig:** Paradigma und Industry filtern NICHT mehr — nur `requiredContent`

**requiredContent Schema (neu):**
```typescript
interface SectionLayout {
  id: string
  name: string
  prompt: string
  requiredContent: {
    has_visual?: boolean
    min_stats?: number
    has_logos?: boolean
    has_demo?: boolean
  }
}
```

---

## 6. Icon Library (im Developer-Prompt)

Modell darf **nie** SVG-Paths erfinden. Nur diese Icons:

```html
check:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M20 6L9 17l-5-5"/></svg>
arrow:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
star:    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
shield:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
users:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
clock:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
chart:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
home:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
mail:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
phone:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 01.22 2.18 2 2 0 012.18 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.56 6.56l1.07-1.07a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
```

---

## 7. Bekannte Probleme + Fixes

### Problem 1 — Headline-Overflow (KRITISCH)
Deutsche Wörter sind 40% länger als englische.
```css
/* Statt: font-size: 5rem */
font-size: clamp(1.8rem, 4vw, 3.2rem);
```
Regel im Developer-Prompt:
```
GERMAN TEXT RULE: NEVER use font sizes above clamp(2rem, 4vw, 3.2rem)
for headlines longer than 3 words.
```

### Problem 2 — Card Density
Modell packt zu viele Content-Typen in eine Kachel.
```
DENSITY RULE: MAX 1 content type per bento card.
ONE of: stat | image | list | badge-row. Never combined.
```

### Problem 3 — Leere Icon-Boxen
Lösung: Icon Library im Prompt — Modell wählt aus Liste statt zu erfinden.

### Problem 4 — Falsches Bild-Thema
Lösung: Fotograf-Call (Call 3) gibt picsum-ID + Seed vor.

### Problem 5 — CTAs below the fold
Lösung: Texter-Call definiert CTA-Position explizit im Slot-Briefing.

---

## 8. UI-Anforderungen (neue Elemente)

| Element | Warum | Priorität |
|---------|-------|-----------|
| Responsive Toggle (375/768/1280px) | Ersetzt Visual-Renderer-Call | Sofort |
| Parallel Section Cards | 8 Sections parallel sichtbar | Sofort |
| Moodboard Preview nach Phase 1 | AD + Fotograf + Anim sichtbar | Hoch |
| Texter-Output editierbar | Texte ändern vor Developer-Call | Mittel |
| Designer-Mockup Preview | Struktur bestätigen vor HTML | Später |
| Chain Progress Bar | 6 Calls transparent machen | Sofort |

---

## 9. Was nie gebaut wird

- Puppeteer Screenshot-Rendering (Overengineering, $0.045 extra/Section)
- Claude Vision QA auf Screenshots (zu teuer, nicht skalierbar)
- Mehr als 6 Calls pro Section
- Synchrone sequenzielle Generation (4-5 Min Wartezeit inakzeptabel)
- paradigms / excludeIndustries Filter auf Layouts (falsche Abstraktion)

---

## 10. Nächste Schritte — Priorität

### Sofort
- [ ] Texter-Call (Call 5) implementieren — größter Qualitätsgewinn
- [ ] Conversion Strategist (Call 1) implementieren
- [ ] Parallel-Generation UI — Sections parallel statt sequenziell
- [ ] Responsive Toggle im Canvas
- [ ] Icon Library in buildPass1System() einbauen
- [ ] DENSITY RULES + GERMAN TEXT RULES in Prompts

### Dann
- [ ] hero-split-service-bold als erstes Golden-Set Beispiel bauen
- [ ] Pattern Library anlegen + bisherige Patterns kategorisieren
- [ ] Fotograf-Call (Call 3) implementieren
- [ ] Animationsguru-Call (Call 4) implementieren
- [ ] Designer-Call (Call 6) als Strukturgeber vor Developer

### Später
- [ ] Moodboard UI (nach Phase 1 Calls)
- [ ] Texter-Output editierbar vor Developer-Call
- [ ] Brand Guardian Call
- [ ] content_inventory Feld ins Manifest
- [ ] requiredContent Filter in pickLayout()

---

*Dieses Dokument wurde in einer Konzept-Session erarbeitet.*
*Repo: github.com/timratig1976/wbuilder*
