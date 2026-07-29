# Google DESIGN.md — Reference

> A format specification for describing a visual identity to coding agents.
> DESIGN.md gives agents a persistent, structured understanding of a design
> system.
>
> Open-sourced by Google Labs on **2026-04-21**, originated in the Stitch app.
>
> **Status:** `alpha` — spec and CLI under active development.

---

## What is DESIGN.md?

A self-contained, plain-text representation of a design system. It defines
the visual identity of a brand and product so that stylistic choices can be
followed across design sessions and between different AI agents and tools.

It is a living source of truth that both humans and AI can understand and
refine. The format combines:

1. **YAML front matter** — machine-readable design tokens.
2. **Markdown body** — human-readable design rationale.

The tokens are the **normative values**. The prose provides **context** for
how to apply them.

## Why it exists

AI agents traditionally "guess" intent when generating UI. DESIGN.md gives
them a structured, validable, machine-readable design system file they can
read and respect. It also enables:

- Export to Tailwind v3, Tailwind v4, and W3C DTCG token formats.
- Automated WCAG contrast validation.
- Diff detection between design system versions.
- A canonical spec you can inject into agent prompts.

## The philosophy (most important part)

From `PHILOSOPHY.md`:

> *"The quality of a generated design is determined less by the precision
> of its values than by how clearly the intent is described."*

Key takeaways:

- **Prose, not tokens, is the focus.** Tokens serve the prose, not the
  reverse.
- **A specific reference carries more than a list of adjectives.**
  "A 1970s graduate lecture handout" is more useful than "modern, clean,
  trustworthy, premium."
- **Negative constraints arrive free** when the reference is specific
  enough. Naming a dog tells the model dogs don't meow.
- **The format grows through its users, not its spec.** The spec
  standardizes only what benefits from consistency (colors, typography,
  spacing, rounded, components). Everything else (motion, iconography,
  elevation, etc.) is yours to define.

---

## File structure

A DESIGN.md file has two layers:

```md
---
version: alpha
name: Heritage
colors:
  primary: "#1A1C1E"
  secondary: "#6C7278"
  typography:
    h1:
      fontFamily: Public Sans
      fontSize: 3rem
---

## Overview

Architectural Minimalism meets Journalistic Gravitas.

## Colors

- **Primary (#1A1C1E):** Deep ink for headlines.
- **Secondary (#6C7278):** Slate for borders, captions.
```

### Front matter (YAML)

Delimited by `---` fences at the top of the file. Required: `name`. Optional:
`version`, `description`. Tokens are organized in five groups.

### Body (Markdown)

Sections use `##` headings. Optional `##` heading may appear for document
titling but is not parsed as a section.

---

## Token schema (YAML front matter)

```yaml
version: <string>          # optional, current: "alpha"
name: <string>
description: <string>      # optional
colors:
  <token-name>: <Color>
typography:
  <token-name>: <Typography>
rounded:
  <scale-level>: <Dimension>
spacing:
  <scale-level>: <Dimension | number>
components:
  <component-name>:
    <property>: <string | token reference>
```

### Token types

| Type | Format | Example |
|:-----|:-------|:--------|
| **Color** | Hex / rgb / hsl / hwb / oklch / oklab / lch / lab / color-mix | `"#1A1C1E"`, `oklch(0.84 0.18 117.33)` |
| **Dimension** | number + unit (`px`, `em`, `rem`) | `48px`, `-0.02em` |
| **Token Reference** | `{path.to.token}` | `{colors.primary}` |
| **Typography** | object (see below) | see below |

### Color formats supported

- Hex: `#RGB`, `#RGBA`, `#RRGGBB`, `#RRGGBBAA`
- Named: `red`, `cornflowerblue`, `transparent`
- Functional: `rgb()`, `rgba()`, `hsl()`, `hsla()`, `hwb()`
- Wide-gamut: `oklch()`, `oklab()`, `lch()`, `lab()`
- Mixing: `color-mix(in srgb, ...)`

All colors are internally converted to sRGB for WCAG contrast checks. Hex
(`#RRGGBB`) is the recommended default for tooling compatibility.

### Typography object

```yaml
typography:
  h1:
    fontFamily: Public Sans       # string
    fontSize: 48px                # Dimension
    fontWeight: 600               # number (400, 700, ...)
    lineHeight: 1.1               # Dimension or unitless multiplier
    letterSpacing: -0.02em        # Dimension
    fontFeature: "..."            # string — font-feature-settings
    fontVariation: "..."          # string — font-variation-settings
```

### Token references

A token reference must be wrapped in curly braces and contain an object path
to another value in the YAML tree. Within `components`, references to
composite values (e.g. `{typography.label-md}`) are permitted.

---

## Section order (markdown body)

Sections can be omitted if not relevant, but those present must appear in
this exact order:

| # | Section | Aliases |
|:--|:--------|:--------|
| 1 | **Overview** | Brand & Style |
| 2 | **Colors** | |
| 3 | **Typography** | |
| 4 | **Layout** | Layout & Spacing |
| 5 | **Elevation & Depth** | Elevation |
| 6 | **Shapes** | |
| 7 | **Components** | |
| 8 | **Do's and Don'ts** | |

### What each section covers

- **Overview** — holistic description of the product's look and feel,
  brand personality, target audience, emotional response.
- **Colors** — palette definition with semantic roles (`primary`,
  `secondary`, `tertiary`, `neutral`).
- **Typography** — 9–15 typography levels with semantic categories
  (`headline`, `body`, `label`, `caption`, ...).
- **Layout** — grid model, spacing scale, containment rules.
- **Elevation & Depth** — how visual hierarchy is conveyed (shadows,
  tonal layers, borders, contrast).
- **Shapes** — corner radius language, sharp vs. soft.
- **Components** — styling for component atoms (buttons, chips, lists,
  tooltips, checkboxes, radio buttons, input fields).
- **Do's and Don'ts** — practical guidelines and pitfalls.

---

## Components in detail

The `components` section maps a name to a group of sub-token properties.

**Valid component properties:**

- `backgroundColor` — `<Color>`
- `textColor` — `<Color>`
- `typography` — `<Typography>`
- `rounded` — `<Dimension>`
- `padding` — `<Dimension>`
- `size` — `<Dimension>`
- `height` — `<Dimension>`
- `width` — `<Dimension>`

### Example

```yaml
components:
  button-primary:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.on-tertiary}"
    rounded: "{rounded.sm}"
    padding: 12px
  button-primary-hover:
    backgroundColor: "{colors.tertiary-container}"
  button-primary-active:
    backgroundColor: "{colors.tertiary-pressed}"
```

Variants (`hover`, `active`, `pressed`, etc.) are expressed as separate
component entries with a related key name.

---

## Recommended token names (non-normative)

**Colors:** `primary`, `secondary`, `tertiary`, `neutral`, `surface`,
`on-surface`, `error`

**Typography:** `headline-display`, `headline-lg`, `headline-md`,
`body-lg`, `body-md`, `body-sm`, `label-lg`, `label-md`, `label-sm`

**Rounded:** `none`, `sm`, `md`, `lg`, `xl`, `full`

---

## Consumer behavior for unknown content

| Scenario | Behavior |
|:---------|:---------|
| Unknown section heading | Preserve; do not error |
| Unknown color token name | Accept if value is valid |
| Unknown typography token name | Accept as valid typography |
| Unknown spacing value | Accept; store as string if not a valid dimension |
| Unknown component property | Accept with warning |
| Duplicate section heading | **Error; reject the file** |

---

## CLI — `@google/design.md`

### Installation

```bash
npm install @google/design.md
```

> On **Windows**, quote the package name if your shell treats `@` specially.
>
> From a `package.json` script on Windows, use the `designmd` alias instead
> of `design.md` to avoid command-resolution conflicts with the `.md` file
> extension:
>
> ```jsonc
> {
>   "scripts": {
>     "design:lint": "designmd lint DESIGN.md"
>   }
> }
> ```

### Commands

| Command | Purpose |
|:--------|:--------|
| `lint <file>` | Validate a DESIGN.md file (structure, refs, WCAG, orphans) |
| `diff <before> <after>` | Compare two DESIGN.md files, detect regressions |
| `export --format <fmt>` | Export tokens to Tailwind v3, Tailwind v4, or DTCG |
| `spec` | Output the spec (for agent prompt context injection) |

### `lint`

```bash
npx @google/design.md lint DESIGN.md
npx @google/design.md lint --format json DESIGN.md
cat DESIGN.md | npx @google/design.md lint -
```

Exit code `1` if errors are found, `0` otherwise. Output defaults to JSON.

### `diff`

```bash
npx @google/design.md diff DESIGN.md DESIGN-v2.md
```

Exit code `1` if regressions detected (more errors or warnings in the
"after" file).

### `export`

```bash
npx @google/design.md export --format json-tailwind DESIGN.md > tailwind.theme.json
npx @google/design.md export --format css-tailwind  DESIGN.md > theme.css
npx @google/design.md export --format dtcg          DESIGN.md > tokens.json
```

| Format | Output | Notes |
|:-------|:-------|:------|
| `json-tailwind` | JSON | Tailwind v3 `theme.extend` config object |
| `css-tailwind` | CSS | Tailwind v4 `@theme { ... }` block with CSS custom properties (`--color-*`, `--font-*`, `--text-*`, `--leading-*`, `--tracking-*`, `--font-weight-*`, `--radius-*`, `--spacing-*`) |
| `tailwind` | JSON | Alias for `json-tailwind` |
| `dtcg` | JSON | W3C Design Tokens Format Module |

### `spec`

```bash
npx @google/design.md spec
npx @google/design.md spec --rules
npx @google/design.md spec --rules-only --format json
```

| Option | Type | Default | Description |
|:-------|:-----|:--------|:------------|
| `--rules` | boolean | `false` | Append the active linting rules table |
| `--rules-only` | boolean | `false` | Output only the linting rules table |
| `--format` | `markdown` \| `json` | `markdown` | Output format |

### Programmatic API

```typescript
import { lint } from '@google/design.md/linter';

const report = lint(markdownString);

console.log(report.findings);      // Finding[]
console.log(report.summary);       // { errors, warnings, info }
console.log(report.designSystem);  // Parsed DesignSystemState
```

---

## Linting rules

The linter runs eight rules against a parsed DESIGN.md. Each rule produces
findings at a fixed severity.

| Rule | Severity | What it checks |
|:-----|:---------|:---------------|
| `broken-ref` | error | Token references (`{colors.primary}`) that don't resolve to any defined token |
| `missing-primary` | warning | Colors defined but no `primary` color exists |
| `contrast-ratio` | warning | Component `backgroundColor`/`textColor` pairs below WCAG AA (4.5:1) |
| `orphaned-tokens` | warning | Color tokens defined but never referenced by any component |
| `token-summary` | info | Summary of how many tokens are defined in each section |
| `missing-sections` | info | Optional sections (spacing, rounded) absent when other tokens exist |
| `missing-typography` | warning | Colors defined but no typography tokens exist |
| `section-order` | warning | Sections appear out of the canonical order |

---

## Interoperability

DESIGN.md tokens are inspired by the [W3C Design Token Format](https://www.designtokens.org/tr/2025.10/format/). The `export` command converts tokens to:

- **Tailwind v3 config (JSON)** — emits a `theme.extend` object for
  `tailwind.config.js`.
- **Tailwind v4 theme (CSS)** — emits a `@theme { ... }` block using
  Tailwind v4 CSS-variable token namespaces.
- **DTCG tokens.json** — W3C Design Tokens Format Module.

Round-trips are supported with `tokens.json`, Figma variables, and Tailwind
theme configs.

---

## Full example (Heritage)

```md
---
version: alpha
name: Heritage
colors:
  primary: "#1A1C1E"
  secondary: "#6C7278"
  tertiary: "#B8422E"
  neutral: "#F7F5F2"
typography:
  h1:
    fontFamily: Public Sans
    fontSize: 3rem
    fontWeight: 600
    lineHeight: 1.1
  body-md:
    fontFamily: Public Sans
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.6
  label-caps:
    fontFamily: Space Grotesk
    fontSize: 0.75rem
    fontWeight: 500
    letterSpacing: 0.1em
rounded:
  sm: 4px
  md: 8px
spacing:
  sm: 8px
  md: 16px
---

## Overview

Architectural Minimalism meets Journalistic Gravitas. The UI evokes a
premium matte finish — a high-end broadsheet or contemporary gallery.

## Colors

The palette is rooted in high-contrast neutrals and a single accent color.

- **Primary (#1A1C1E):** Deep ink for headlines and core text.
- **Secondary (#6C7278):** Sophisticated slate for borders, captions, metadata.
- **Tertiary (#B8422E):** "Boston Clay" — the sole driver for interaction.
- **Neutral (#F7F5F2):** Warm limestone foundation, softer than pure white.

## Typography

Two weights of Public Sans for narrative; Space Grotesk for technical data.

- **Headlines:** Public Sans Semi-Bold — institutional, trustworthy voice.
- **Body:** Public Sans Regular at 16px — long-form readability.
- **Labels:** Space Grotesk, uppercase with generous letter spacing.

## Layout

A strict 8px spacing scale (with 4px half-step for micro-adjustments).
Components grouped by "containment" — related items housed in cards with
24px internal padding.

## Elevation & Depth

Subtle tonal layering. Primary content sits on pure white cards over a
soft off-white background. No drop shadows in resting state.

## Shapes

Architectural sharpness. Minimal 4px corner radius on all interactive
elements. Just enough softness to feel modern while remaining rigid.

## Components

- **Button (primary):** Boston Clay background, near-white text, 4px radius,
  12px padding. Hover state uses a deeper container variant.
- **Input fields:** Limestone surface, slate border, ink text.
- **Chips:** Limestone surface, slate border, label-caps typography.

## Do's and Don'ts

- **Do** use Boston Clay only for the single most important action per screen.
- **Don't** mix rounded and sharp corners in the same view.
- **Do** maintain WCAG AA contrast (4.5:1 for normal text).
- **Don't** use more than two font weights on a single screen.
```

---

## Relevance to our project

Directly compatible with our stack (Tailwind v4 + shadcn/ui):

| DESIGN.md feature | Bridges to our stack |
|:------------------|:---------------------|
| `export --format css-tailwind` | Emits a `@theme inline { ... }` block ready for `globals.css` |
| Token references (`{colors.primary}`) | Compatible with our shadcn CSS variables (`--color-primary`, `--primary`, etc.) |
| `contrast-ratio` lint rule | Validates WCAG AA across our components automatically |
| `diff` command | Detects design system regressions between PRs (CI-friendly) |
| `lint` command | Catches broken refs and structural issues on save |
| `.md` file format | Version-controlled, readable, AI-ready |
| Canonical section order | Naturally maps to the structure of our `globals.css` + component overrides |

### Suggested adoption path

1. Author a `DESIGN.md` at the repo root describing our visual identity.
2. Lint in CI on every PR (`npx @google/design.md lint DESIGN.md`).
3. Export tokens to `globals.css` when the design system changes.
4. Let Claude Code, the shadcn MCP, and other agents consume it directly.

---

## Resources

- GitHub — <https://github.com/google-labs-code/design.md>
- Google blog announcement (2026-04-21) —
  <https://blog.google/innovation-and-ai/models-and-research/google-labs/stitch-design-md/>
- npm package — `@google/design.md` (12K ⭐ on the repo)
- Spec source — <https://raw.githubusercontent.com/google-labs-code/design.md/main/docs/spec.md>
- Philosophy source — <https://github.com/google-labs-code/design.md/blob/main/PHILOSOPHY.md>
- W3C Design Tokens Format — <https://www.designtokens.org/tr/2025.10/format/>
- Disclaimer — not eligible for the Google Vulnerability Rewards Program