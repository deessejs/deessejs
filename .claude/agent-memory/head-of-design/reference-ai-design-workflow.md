---
name: reference-ai-design-workflow
description: How to do real design (not slop) with an AI agent like Claude — distilled from Anthropic's frontend-design SKILL.md, designer workflow essays, and AI-slop research. The meta-workflow that governs how I work, not just what I produce
metadata:
  type: reference
---

# AI design workflow — how to produce real design, not slop

This is the meta-memory. It governs HOW I work, not what files I write. Every design task I get from you should be filtered through this workflow before I produce output. If I skip it, the output degrades into AI slop — competent, generic, instantly forgettable.

**Built from:**
- `anthropics/claude-code/plugins/frontend-design/SKILL.md` (June 2026) — Anthropic's own design plugin
- Abhi Chatterjee, "From Prompt to Production" (Design Systems Collective, April 2026)
- Victor Onyedikachi, "Is Anyone Else Tired of Every Tailwind/shadcn App Looking the Same?" (December 2025)
- Gabi Florea (Booplex), "What Is AI Design Slop?" (June 2026) — peer-reviewed sources cited
- DesignMD.directory, "DESIGN.md for shadcn/ui" (April 2026)
- [[reference-flowline-decomposition]] — Sophie Wodey's pattern as a validation case

## The core insight

**"Real design" is not the output. It's the input.** What separates tasteful work from slop is the curated context you bring to the model — your design system, your annotated references, your decomposition method, your taste decisions. The model is the fastest executor in the world at producing competent output. The bottleneck is what you (and I, together) feed it.

Three failure modes are universal:

1. **No design system defined** → model defaults to shadcn/Tailwind defaults (indigo, Inter, rounded-lg, soft shadows)
2. **Vague brief** → model defaults to generic patterns ("make a landing page")
3. **Single-shot generation** → model defaults to a single confident answer instead of exploring

Each one compounds. All three together = slop.

## The 7-step workflow (apply to EVERY design ask)

### 1. Check the design system first

Before writing any code, verify the project has a `DESIGN.md` or equivalent. For DeesseJS, that's `documents/internal/design/DESIGN.md` + the per-feature specs.

**If absent or stale:** STOP. Update DESIGN.md first. Do not produce UI code that doesn't have a system to be evaluated against.

**The DESIGN.md format (per Anthropic's skill + designmd.directory):**

```markdown
# Project Design Spec

## Aesthetic direction (commit to ONE)
- Primary: [brutalist/raw | refined minimalist | editorial/magazine | retro-futuristic | ...]
- What makes this UNFORGETTABLE: [one sentence]

## Tokens (use these, not defaults)
- Colors: [hex/oklch values, anti-defaults called out]
- Type: [specific font choices — NOT Inter unless it's actually right]
- Spacing: [your rhythm — 8px? 4px? 24px section?]
- Radius: [specific value, not the default]

## Component decisions by surface
- Button: [default variant, size, when to deviate, anti-patterns]
- Card: [paddings, borders vs shadows, when to use vs not]
- Table: [density, sticky behavior, header style]

## Page patterns
- Dashboard: [layout grid]
- Marketing: [hero rhythm, section padding]
- Settings: [form spacing]

## Anti-patterns (the slop to AVOID)
- No purple gradients
- No glassmorphism unless [specific reason]
- No emoji as feature icons
- No "Inter for everything"
- No decorative shadows
```

DeesseJS already has most of this in `feedback-deessejs-mono-design-language` and `documents/internal/design/DESIGN.md`. The remaining gap: **explicit anti-patterns** that I can apply automatically.

### 2. Decompose before generating

This is [[reference-decomposition-method]] — the 5-step decomposition. Non-negotiable for any "show me X" ask.

**The trap:** "show me an admin dashboard" sounds like a one-shot ask. It's not. It's 5+ atoms: shell, content variant, stat cards, table, activity feed. If I produce one monolith, I fail the test.

**Validation:** every file I write should have a header comment that says:
- WHAT user need it satisfies
- WHAT atoms it composes
- WHERE else it's used

If a file lacks that header, it's slop-grade output.

### 3. Cite references with intent

When I propose a visual treatment, I should be able to say:

> "Use Linear's `<FIG 0.x>` section labels because it signals 'documented, not decorative' — see [[reference-linear-home-css]]. Pair with Vercel's print-mark grid background because mono brand matches — see [[reference-vercel-home-css]]."

The references carry **intent**, not just look. A reference without intent is decoration; with intent, it's a constraint.

**Where to cite from** (in priority order):
1. `documents/internal/design/` — your own specs
2. The 7 site memories ([[reference-vercel-home-css]] etc.)
3. [[reference-flowline-decomposition]] — Sophie's actual working components
4. [[reference-hero-techniques-2026]] — the 12-recipe catalog
5. External URLs — only when none of the above covers the pattern

### 4. Pick ONE primary technique + ONE secondary

From [[reference-hero-techniques-2026]]. Never 3+. The grid is 12 techniques. Most sections use 1. The most complex section might use 2. If I propose 3+ in one section, I'm compensating for lack of intent with visual noise.

### 5. Make ONE decision per file

A file should have ONE clear role:
- A primitive (StatCard, SectionLabel, Reveal) does ONE thing
- A content variant (DashboardContent, TasksContent) shows ONE view
- A section (PillarsSection, ProblemSection) tells ONE story

If I propose a 200-line file with 3+ roles, split it. The user can always merge later; they can't easily split.

### 6. Annotate intent in code

Every component file gets a header comment with:
- **WHAT** user need it satisfies
- **WHAT** atoms it composes
- **WHERE** it's used (other files that import it)
- **ANTI-PATTERNS** (what it explicitly is NOT)

Example (lifted from Sophie's testimonial placeholder):
```tsx
/**
 * <DashboardContent> — the main admin view mockup
 *
 * Decomposes "show that the template has a dashboard" into:
 *   1. Section label "Dashboard"
 *   2. Greeting headline
 *   3. 2x2 stat tiles
 *   4. Day-progress ring (right column)
 *   5. Top-priority banner
 *   6. 3 mini-stat tiles
 *   7. AI insights list
 *
 * Used in:
 *   - hero-section.tsx (the main app screenshot)
 *   - (no other usage yet — reuse if a /dashboard preview is needed)
 *
 * ANTI-PATTERNS:
 *   - NOT a real interactive dashboard (no state, no API)
 *   - NOT a screenshot (this is a live React component)
 *   - NOT a chart library demo (only static SVG ring + bars)
 */
```

If a file lacks this header, the model couldn't articulate its intent — and neither can the next person to read it.

### 7. Verify against the rendered output

**The hard truth:** "match the design intent" can only be checked against the actual rendered pixels, not the source. The Booplex analysis (June 2026) is explicit:

> "Most design linters parse your CSS and guess what the page looks like. That misses the thing that matters — what actually rendered after every cascade and override fought it out."

For DeesseJS, this means: **after every visual change, the user has to look at it.** I can't see. I can verify:
- ✅ CSS classes match the intent (lint + grep)
- ✅ Dark mode tokens are correct
- ✅ Responsive classes are present at the right breakpoints
- ✅ Contrast ratios are within WCAG AA (using known token values)
- ❌ Does it actually look like Linear / Vercel / whatever was the reference

The last check is yours. Not mine. Build a feedback loop where you screenshot → I revise, repeat.

## The 10 anti-patterns (the slop signature)

Per Booplex's June 2026 analysis + Anthropic's frontend-design skill. If I produce ANY of these without a specific justified reason, it's slop:

1. **Purple/indigo gradients on dark backgrounds** — Tailwind UI's 2019 default that escaped into training data. Avoid unless explicitly the brand.
2. **Glass cards with soft glow shadows** — glassmorphism as decoration, not function.
3. **Inter as the only typeface** — geometric sans everywhere. Pick a font that fits the brand voice.
4. **Hero → one-line subhead → 3 identical feature cards → centered CTA** — the canonical skeleton. Use it consciously or break it deliberately.
5. **Emoji as feature icons** — ✨🚀🔒 in a row. Replace with bespoke icons.
6. **CTA buttons at <3:1 contrast** — the most common accessibility failure on the web.
7. **rounded-lg + shadow-sm on every card** — the shadcn default that signals "I didn't think about this."
8. **Section padding py-16 everywhere** — no rhythm variation. Vary it: hero `py-32`, content `py-24`, transition `py-12`.
9. **Gradient text headlines** — `bg-clip-text` everywhere, even where a solid color would read better.
10. **Identical card grids** — every section is 3 cards in a row. Vary: bento, side-by-side, list, mosaic.

DeesseJS already avoids most of these (mono brand, mono icon style, hairline borders). The remaining risks: gradient text if we're not careful, py-16-everywhere, and 3-card grids.

## The validation checklist

Before declaring "done" on any visual ask, run through this:

### Design system check
- [ ] **DESIGN.md exists and is current** — if not, update it first
- [ ] **Anti-patterns section exists** — if not, add it
- [ ] **Tokens are specific** — not "use brand color" but `oklch(0.55 0.18 145)`

### Decomposition check
- [ ] **Shell + Content split** for any "show product" visual
- [ ] **Atoms extracted** as primitives before composing
- [ ] **5-element rhythm** inside content variants

### Intent check
- [ ] **Reference cited** with WHY (not just "looks like Linear")
- [ ] **ONE primary technique** from hero-techniques-2026
- [ ] **ONE secondary technique** maximum

### File hygiene check
- [ ] **Header comment** on every new file (WHAT, atoms, WHERE, anti-patterns)
- [ ] **No file >200 lines** that does >1 thing
- [ ] **Data-driven** (`.map()` over arrays) for 3+ similar items

### Render check (user's job, not mine)
- [ ] **Screenshot reviewed** in light + dark mode
- [ ] **Mobile breakpoint tested** at 375px
- [ ] **WCAG AA contrast** verified on real rendered output

## The meta-principle: "Generate with taste, verify with evidence"

From Booplex's conclusion:

> "The fix isn't 'stop using AI.' It's adding the step the generators skip."
> "Generation gets you to 'plausible' fast — verification is what gets you to 'actually good.'"
> "Keep a human where taste lives. NN/g's read for 2026 is that the automatable part of design — assembling components from a system — is exactly the part AI now does, while 'curated taste, research-informed contextual understanding, critical thinking, and careful judgment' resist automation."

For DeesseJS: **I am the assembly engine.** You are the taste layer. The system works when we each stay in our lane.

## What I will do differently from now on

When you ask for a visual, I will:

1. **Cite the design system** (`DESIGN.md` + memory index) before proposing
2. **Decompose** the user need into atoms (per [[reference-decomposition-method]])
3. **Pick ONE technique** from [[reference-hero-techniques-2026]], cite WHY
4. **Reference [[reference-flowline-decomposition]]** when the ask is "show product"
5. **Write file headers** with intent on every new component
6. **Avoid the 10 anti-patterns** explicitly
7. **Propose 3 directions** when ambiguous, not 1 (per Abhi Chatterjee: "Ask Claude for variations explicitly")
8. **Treat the first draft as 70%** — expect iteration

When you reject something, I will:

1. **Ask what specifically** — "too generic" is not actionable, "the headline weight reads like a 2020 SaaS landing page" is
2. **Check the 10 anti-patterns** against my output before revising
3. **Update DESIGN.md / memory** if the rejection reveals a missing constraint

## Source URLs

- https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md — Anthropic's design plugin (June 2026)
- https://www.designsystemscollective.com/from-prompt-to-production-a-designers-step-by-step-workflow-with-claude-design-claude-code-a7705daad026 — Abhi Chatterjee's workflow (April 2026)
- https://www.designsystemscollective.com/is-anyone-else-tired-of-every-tailwind-shadcn-app-looking-the-same-69c545e73114 — Victor Onyedikachi on shadcn samey-ness (December 2025)
- https://booplex.com/blog/what-is-ai-design-slop — Gabi Florea's 7-dimension breakdown (June 2026)
- https://docs.bswen.com/blog/2026-03-27-ai-generated-ui-unique-design/ — DESIGN.md + role-specific agents (March 2026)
- https://designmd.directory/guides/design-md-for-shadcn — DESIGN.md format spec (April 2026)
- https://webaim.org/projects/million/ — WebAIM Million 2025 (96% of top homepages have WCAG failures)
- https://designcompass.org/en/archive/stripe-2026/ — Stripe 2026 brand refresh analysis

## Related memories

- [[reference-decomposition-method]] — the 5-step decomposition I should always do first
- [[reference-flowline-decomposition]] — Sophie's working reference for "show product"
- [[reference-hero-techniques-2026]] — the technique catalog
- [[feedback-deessejs-mono-design-language]] — the brand constraints (mono + hairline)
- [[project-monorepo-strategy]] — for where files live (packages/ui vs apps/web)
- [[reference-svg-illustration-system]] — for hand-drawn SVG atoms
