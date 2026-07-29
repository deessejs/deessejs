---
name: feedback-long-term-solutions
description: User prefers long-term, durable solutions over quick workarounds or local fixes — applies to refactors, dependency choices, and any decision with a "narrow vs systemic" axis.
metadata:
  type: feedback
---

When proposing fixes, prefer the solution that addresses the *systemic cause* over the one that patches the *local symptom*. When given a choice between a one-line patch and a structural change that prevents the issue class, default to the structural change — even if it takes longer.

**Why:** Stated explicitly by the user after I asked whether to pin the hono catalog version. Their words: "Je veux toujours les solutions long terme" (I always want long-term solutions). The implication is that accumulating local patches creates a maintenance tax they don't want to pay.

**How to apply:**
- Before fixing, ask: "what's the smallest change that prevents this *category* of issue from recurring?" rather than "what's the smallest change that fixes this instance?"
- For dependency drift → `pnpm.overrides` over catalog pin alone (catalog pin can be bypassed by transitive resolution).
- For repeated patterns across files → codify (ESLint rule, shared helper, test) rather than fix each occurrence.
- For tech debt discovered during a fix → track it explicitly (TODO + memory + report) rather than silently absorb it.
- **Scope check:** long-term doesn't mean "do everything". If the user only asked for X, deliver X with the long-term solution for X. Flag adjacent long-term concerns as follow-ups — don't expand scope unilaterally.

Related: [[project-stack]] (pnpm 11 + catalog + overrides pattern), [[use-shadcn-skill]] (initiative model: skill + lint + new component to stop a regression class).