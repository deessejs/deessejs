---
name: reference-anthropic-home-css
description: Concrete CSS techniques from Anthropic.com — warm-ivory palette (cream + burnt orange), editorial serif headlines + sans body, "research paper" card rhythm; the brand that proves mono isn't the only valid B2B aesthetic
metadata:
  type: reference
---

# Anthropic home — CSS technique inventory

Verified 2026-06-26 from `https://www.anthropic.com` (text fetch via fresh) + https://www.shadcn.io/design/anthropic + https://duply.ai/anthropic/design-md.

## The "warm ivory" palette

Anthropic is the chromatic exception among developer-AI companies. They use:
- **Cream background**: `#FAF9F5` (the "warm ivory" signature)
- **Charcoal text**: `#141413`
- **Burnt orange accent**: `#D97757` (sparingly — one element per view)
- **Clay secondary**: `#E8DCCB` (for surfaces, secondary buttons)
- **Moss green** (success only): `#788C5D`

**Why it works:** AI companies default to "futuristic dark" (black + neon). Anthropic deliberately signals "research institution" with paper-warm tones. The signal reads as "we're not chasing hype, we're doing serious work."

**For DeesseJS:** this is a useful *contrast* — DeesseJS is mono by choice, and Anthropic proves chromatic can work IF it's warm/restrained. Don't copy the palette, but learn the discipline: pick ONE accent and use it sparingly.

## Typography (Anthropic Serif + Sans)

| Token | Font | Size | Weight |
|---|---|---|---|
| Hero headline | Anthropic Serif | 56–72px | 400 (regular — NOT bold) |
| Section headline | Anthropic Serif | 40–48px | 400 |
| Body | Anthropic Sans | 16–18px | 400 |
| Label | Anthropic Mono | 12–14px | 500 uppercase |

**Critical:** Anthropic uses **regular weight (400)** for headlines, not bold. The serif carries the hierarchy. Bold headlines would feel "tech bro."

**For DeesseJS:** this is the alternative to our current `font-bold tracking-tighter` headlines. Worth experimenting with on `/about` — a serif headline at regular weight could work for the mission section.

## Section composition

- Container: `max-w-[1200px]`, generous side padding
- Section padding: `py-32` (Vercel-like, but the cream background softens it)
- Section transitions: no border-b, just whitespace + a single horizontal hairline `divider` at section start
- Cards: 12px radius, 1px borders (no shadows), `bg-white` on cream — the contrast IS the separation

## Card anatomy (the research-paper look)

```
┌─────────────────────────────────────┐
│ Date              Category           │  ← mono uppercase, 12px
│                                     │
│ Claude Opus 4.8                     │  ← serif, 28–32px
│                                     │
│ An upgrade across coding,           │  ← sans, 16px, line-height 1.6
│ agentic tasks, and professional     │
│ work, with the consistency to       │
│ handle long-running work.           │
│                                     │
│ Read announcement  →                │  ← burnt orange link
└─────────────────────────────────────┘
```

**Pattern:** date + category in mono uppercase top-right, headline below, body below that, single text link CTA. No "Read more" arrow icon — just the text + arrow character.

**For DeesseJS:** adopt this for the `/changelog` entries and the `/about` roadmap milestones. The mono top-row label + serif headline combo is a strong identity signal.

## The "study" / "research" framing

Anthropic's home leads with: "What 81,000 people want from AI" — a specific, large number framing the headline as a *finding*, not a feature pitch. The supporting section links to a "study" page, not a "feature" page.

**Pattern:** lead with a number ("What 81,000 people want"), link to the evidence ("Read the study →"). Don't lead with adjectives ("The best AI platform").

**For DeesseJS:** the home hero could lead with "What 12,000+ developers shipped this month" or "How 47 teams cut their SaaS boilerplate to one commit" — a stat, not an adjective.

## Motion

Anthropic uses almost no motion. No scroll-driven animations, no cursor-tracked glows, no mesh gradients. The aesthetic is "printed page" — typography and whitespace do all the work.

**For DeesseJS:** when in doubt, do less. The mono aesthetic we've built doesn't need decoration.

## What Anthropic does NOT do

- No mesh gradients (rejected as "marketing")
- No animated dashboards (rejected as "demo theater")
- No dark mode (their brand IS the cream; they don't ship a dark theme on the marketing site)

## Source URLs

- https://www.anthropic.com — current home
- https://www.shadcn.io/design/anthropic — shadcn's Anthropic design system (Slate #141413, 22 components)
- https://duply.ai/anthropic/design-md — DESIGN.md format breakdown
- https://uicolours.com/brands/anthropic — full brand color extraction

## Related memories

- [[reference-vercel-home-css]] — Vercel is the mono precedent; Anthropic is the chromatic precedent
- [[reference-resend-home-css]] — Resend is closer to DeesseJS's aesthetic (mono + mono font)
- [[feedback-deessejs-mono-design-language]] — DeesseJS is closer to Resend than Anthropic
