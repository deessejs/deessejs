---
name: feedback-read-spec-titles-and-status-carefully
description: Spec titles like "for the buyer's product" distinguish scope (buyer template vs marketing site); status ✅ in features README is aspirational until code exists — always cross-check
metadata:
  type: feedback
---

# Spec titles + status columns are easy to misread

## Rule 1 — Read the spec TITLE before assuming scope

A spec titled **« X (for the buyer's product) »** is about what the **buyer receives**, NOT what deessejs.com uses itself. Concretely:

- `15-blog.md` → "Blog (for the buyer's product)" = blog in `apps/template/`
- The marketing site (`apps/web`) has its own dead `/blog` nav links that are NOT covered by spec 15

When analyzing a feature, always grep for « for the buyer » or « for deessejs.com » in the title before recommending scope. Mixing the two surfaces produces wrong architecture recommendations.

## Rule 2 — The status ✅ in features/README.md is aspirational, not actual

The features README states:
> ✅ **SHIP** — fully implemented in v1

But for spec 15-blog (and likely others in M4-M8), the status is set **at planning time**, before implementation. The README claims « M4 → Blog ✅ all » while zero blog files exist in the repo. The same pattern likely holds for any feature in milestones that aren't done.

**Why this matters.** If you trust the status column, you'll:
- Skip features in your analysis thinking they're done
- Recommend integrations with code that doesn't exist
- Miss load-bearing downstream blockers

**How to apply.** Before recommending work on a feature, run a quick `glob` or `find` to confirm files exist. If `apps/template/` has zero files for the spec topic, treat the ✅ as « planned for M4-M8, not implemented ». Cross-reference [[project-blog-feature-spec-analysis]] for the blog case.

## Rule 3 — Cross-refs are the source of architectural truth, not titles

When two specs cover similar ground, the cross-references win over individual titles. Example: spec 15 doesn't mention changelog, but 14.14 lists « Changelog page | From the buyer's git tags » under DOCS, with a cross-ref to 15 saying « shared MDX + Fumadocs ». The cross-ref chain tells you changelog lives in the docs app, not the blog.

**Why:** Cross-refs are updated when architecture shifts. Spec body content may be stale.

**How to apply:** When two specs conflict or overlap, follow the cross-reference chain to the most-linked spec — that's the source of truth.

## Origin

Discovered 2026-06-26 during deep-dive of `15-blog.md`. First analysis conflated « blog deessejs.com » with « blog buyer ». After the user asked to dig deeper into 15-blog.md specifically, the « (for the buyer's product) » title + the 14.14 cross-ref to changelog-in-docs reversed my earlier recommendation to bundle blog+changelog in one engine.

Related: [[project-blog-feature-spec-analysis]], [[project-build-state-2026-06-25]]