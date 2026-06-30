---
name: feedback-illustrations-use-css-not-svg
description: User rejected hairline mono SVG illustrations for the "Everything you need to scale" feature cards — wants CSS-built mini admin page mockups (fake product screenshots) instead. Applies to all capability/feature card illustrations on DeesseJS going forward.
metadata:
  type: feedback
---

# Feature card illustrations must be CSS product mockups, not SVG

**The user said:** "l'illustration est vraiment moche, tu dois utiliser du design css, simuler une page avec une table dans laquelle on doit des users, comme une vrai mini page de saas, pas du svg" (2026-06-29, after the AuthFlow SVG proof of concept).

**Why this matters:** I had built the AuthFlow component per [[reference-svg-illustration-system]] (hairline 1.5px stroke, mono, currentColor) and the user immediately rejected it as "vraiment moche." The user wants feature cards to look like **a real SaaS admin page** — a fake screenshot showing actual UI like a users table — not decorative line art.

This is a course correction on top of `[[reference-svg-illustration-system]]`:
- ✅ The bespoke SVG system is still valid for **abstract** illustrations (logos, glyphs, brand marks)
- ❌ The SVG system is **wrong** for **capability/feature illustrations** — those need to look like the actual product

**The pattern the user wants:** Sophie Wodey's `AppShell + Content variant` split from `[[reference-flowline-decomposition]]`. Sophie builds a fake app chrome (top bar + sidebar nav) and a content variant per feature (Dashboard, Tasks, Habits, Timer). Each feature in her PillarsSection renders the actual `<AppShell active="..."><Content /></AppShell>` — showing what the real product looks like, not a decorative diagram.

**What to use when:**

| Card type | Visual treatment |
|---|---|
| **Capability / feature card** | CSS mini-page mockup (fake product screenshot) — AppShell + content variant. Real shadcn primitives (Table, Card, Badge, Avatar, Button). Mono color scheme. Mock data. |
| **Why-different / differentiator** | Brand mark constellation (works fine — verified 2026-06-29) |
| **Inline glyph / icon** | lucide-react icons (existing pattern) |
| **Brand logo** | inline SVG from `brand-marks.tsx` (LobeHub CC0) |
| **Decorative section hero** | bespoke SVG from [[reference-svg-illustration-system]] is still valid for cases where the visual is abstract (e.g. a flow diagram where no "real product" reference exists) |

**How to apply:**
- ❌ Do NOT propose hairline mono SVG diagrams for capability cards (Auth, Data, Backend, etc.) — those are feature areas and need product mockups
- ❌ Do NOT repeat the AuthFlow mistake on other features
- ✅ When designing a capability card, the question is "what does the user's admin panel look like for this?" not "what icon represents this concept?"
- ✅ Use shadcn primitives directly (Table, Card, Badge, Avatar, Button) — no new dep needed, already in [[reference-shadcn]] inventory
- ✅ Keep the mono color rule: mockups stay mono with native brand colors for logos only (per [[feedback-deessejs-mono-design-language]])
- ✅ Density over decoration: real SaaS pages are dense — 4-6 table rows, not 2

**Related references:**
- [[reference-flowline-decomposition]] — AppShell + Content variant pattern, the precedent for this
- [[reference-svg-illustration-system]] — still valid for non-capability cases; superseded for capability illustrations
- [[reference-decomposition-method]] — step 1 (decompose user need → atoms) → atoms include "what does the admin page look like for X"
- [[feedback-page-redesign-signals-2026-06-26]] — established the "color is wanted" rule that complements the mono mockup aesthetic
- [[reference-capability-pillar-pattern]] — the architectural pattern adopted from this feedback (claim + AppShell + content variant)
- [[reference-bento-grid-implementation]] — sibling pattern for supporting features after the pillars
- [[project-home-features-redesign-2026-06-29]] — full evolution context where this feedback was applied
- [[project-pricing-redesign-2026-06-29]] — applied to the pricing proof row (replaced ProofRow lucide icons with MockupProofRow using AppShell + Content variants)