---
name: feedback-page-redesign-signals-2026-06-26
description: 3 user signals from the 2026-06-26 page.tsx redesign conversation that override my prior assumptions — PixelBlast + stack row are signature elements to keep, InteractiveFiletree concept stays but needs better execution, features cards need visual weight via logos/illustrations (but NO gradients, NO flashy colors)
metadata:
  type: feedback
---

# Page redesign signals — 2026-06-26

Three signals from the user's correction on my home page audit. Each isolated because they may evolve independently.

## Signal 1 — PixelBlast + 8-logo stack row are SIGNATURES, keep them

**The user said:** "moi j'adore le pixel blast, c'est le seul truc qui fait pas slop" (re: PixelBlast) and rejected my proposal to cut the 8-logo stack row ("Same j'aime bien les icons").

**Why this matters:** I had classified both as "AI slop signatures" based on [[reference-ai-design-workflow]] anti-pattern #4 ("hero → one-line subhead → 3 identical feature cards → centered CTA"). The user's pushback reveals that **my slop checklist is missing the dimension of "what makes this site REMEMBERABLE."**

The user's thesis (assembled from both messages):
- The PixelBlast is the ONE element that hooks the eye and escapes generic-SaaS-template syndrome
- The 8-logo stack row IS doing work — it signals "we use the same tools you do" (credibility through association)
- The site needs **signature elements** that survive being moved between layouts

**How to apply:**
- ❌ Do NOT propose cutting the PixelBlast in any redesign
- ❌ Do NOT propose cutting the 8-logo stack row (Next.js, TypeScript, Tailwind, shadcn, Postgres, Drizzle, Better Auth, Stripe)
- ❌ Do NOT use the word "generic" to describe elements that use WebGL or visible decoration — those may be doing the brand work
- ✅ When proposing cuts, ask "does this element earn its place by being MEMORABLE?" — if yes, keep it
- ✅ When adding new sections, ask "what is the ONE thing the visitor remembers?" — if nothing, the section is decoration

**The deeper pattern (from [[reference-ai-design-workflow]]):** "the user has taste I don't fully see yet." When in doubt, the user's "j'aime" overrides my "this looks generic." My job is to defend the system, not the opinion.

## Signal 2 — InteractiveFiletree principle is good, execution is bad

**The user said:** "le filtree est good niveau principe mais pas beau"

**What's confirmed:** the **concept** of "montrer l'arborescence du template en interactif" is approved. The current implementation doesn't match the concept's ambition.

**Why this matters:** I would have proposed cutting the file tree entirely (as not-pretty). The user is saying "the idea is right, the execution needs work." This is a refinement, not a removal.

**How to apply:**
- ✅ Keep InteractiveFiletree in the home page
- ✅ When revising it, keep the concept (interactive file tree of the template structure)
- ⚠️ The execution needs work — likely layout/spacing/illustration issues, not a concept problem
- 💡 When the user says something is "good in principle, bad in execution," apply the decomposition method to JUST the execution, not the concept

**Open question (for next conversation):** what specifically makes the current execution "pas beau"? Without that answer, I'd be guessing. Possible dimensions:
- Layout: file tree doesn't fit the hero pixel real estate well
- Visual: no color/icon/illustration to give the tree character (mono kill)
- Information density: too many files or wrong files highlighted
- Interaction: the "interactive" part isn't felt — looks like a static screenshot

## Signal 3 — "No gradients, no flashy colors"

**The user said:** "je veux pas de gradient, de couleurs trop flash"

**Context:** in response to my proposal that features cards could use color/illustration. The user clarified that "color" doesn't mean "saturated/chromatic."

**What's confirmed:**
- ✅ Color in features cards is wanted (logos, illustrations)
- ❌ NO `linear-gradient(...)` or `radial-gradient(...)` for visual effect
- ❌ NO high-chroma / high-saturation colors (no `bg-violet-500`, no `text-emerald-400`, etc.)
- ✅ Native colors of logos (Next.js black, Stripe purple, etc.) are allowed because they belong to those brands
- ✅ Bespoke illustrations with a single low-chroma accent (per [[reference-svg-illustration-system]] `accentClassName` prop) are allowed
- ✅ Muted chromatic tones (low chroma oklch, ~`oklch(0.6 0.05 250)`) are allowed

**Why this matters:** the gap between "no chromatic accents" (mono rule) and "add color" (logo/illustration rule) is filled by **muted, low-chroma, near-neutral chromatic tones**. The accent exists but it's barely there.

**How to apply:**
- ❌ No `bg-gradient-to-br from-violet-500 to-indigo-600`
- ❌ No `bg-blue-500/20` (too saturated)
- ❌ No `text-pink-500` (too flashy)
- ✅ No `text-foreground` either (the user said color is missing — pure mono is too far)
- ✅ Use `oklch(0.55 0.05 250)` for muted blue-grey (chroma 0.05 = barely there)
- ✅ Use logo's native color when rendering the logo (don't recolor it)
- ✅ Bespoke illustrations with `accentClassName="text-foreground/40"` (mono accent, near-foreground)
- ✅ Card backgrounds can use `bg-muted/30` or `bg-card/50` (mono) — but add an illustration or logo inside to give color

**Concrete reference values (for memory):**

| Token | OKLCH | Use case |
|---|---|---|
| `--accent-blue` | `oklch(0.6 0.08 250)` | Muted blue for "code" surfaces |
| `--accent-amber` | `oklch(0.7 0.06 70)` | Warm muted for "billing" surfaces |
| `--accent-violet` | `oklch(0.55 0.07 295)` | Muted violet for "agent" surfaces |
| `--accent-emerald` | `oklch(0.6 0.06 160)` | Muted green for "shipped" status badges |

All chroma ≤ 0.08. That's the ceiling for "not flashy."

## How these signals combine

The page redesign brief is now:

1. **Keep all current signature elements** (PixelBlast, stack row, InteractiveFiletree concept)
2. **Add visual weight to features cards** via:
   - Native logo colors (when showing tool logos)
   - Bespoke mono SVG illustrations with subtle accent (per [[reference-svg-illustration-system]])
   - Muted chromatic backgrounds (chroma ≤ 0.08) — never gradients, never saturated fills
3. **Improve InteractiveFiletree execution** (specifics TBD with user)
4. **No gradients anywhere** — even in subtle CTA glows (replaces the `blur-[100px] opacity-20` pattern)
5. **No flashy colors** — chroma ≤ 0.08 ceiling for any non-logo color

## Related memories

- [[feedback-deessejs-mono-design-language]] — updated with the "logos + illustrations can carry color, cards stay neutral" nuance
- [[reference-svg-illustration-system]] — the bespoke SVG system that gives color without flash
- [[reference-ai-design-workflow]] — the meta-workflow, now refined by user's "signature > slop-checklist" correction
- [[project-deessejs-product]] — the 6 brand principles that all three signals respect
