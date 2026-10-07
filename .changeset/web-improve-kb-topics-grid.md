---
"web": patch
---

Aligns the KB index topic card with the sibling PostCard pattern (`commit 992efbc`). Drops the orphan `topic.tags` row on the topic cards (no filter, no link, capped at 3 silently), aligns type scale (`text-xl font-medium tracking-tight`), footer padding (`mt-auto px-6`), and hover cues (drops the unique `group-hover:underline` so topic cards animate the same way as guide cards).

A11y:

- The Topics grid's `TopicCard`, the Featured Guides grid's `GuideCardCompact`, and the per-page `GuideCard` now render the card title as a real `<h3>` (was a `CardTitle` `<div>`). The KB section's outline now goes `<h2>Topics</h2>` → `<h3>Agents</h3>` etc. — screen readers and search engines can index the topics as headings.
- The decorative `ArrowRight` and `Clock` icons now carry `aria-hidden="true"`. Their containing link's `aria-label` already names the topic / guide / reading-time, so the icons add no information.

User-visible on `/knowledge-base`:

- Topics grid: no tags row, title typography aligned with Featured Guides, hover background only (no underline), footer hugs the bottom edge.
- Featured Guides + All Guides + per-page Guide: identical visual, but the DOM now contains real `<h3>` headings — no styling change.

Build-time:

- `kb-card-grid.tsx` header doc rewritten to acknowledge the multi-row grid limitation with `divide-y divide-x` (`tailwindlabs/tailwindcss#13400`). No class change. Migration to Pattern B is intentionally deferred to a PR that aligns `PostCardGrid`, `KbCardGrid`, and `TemplateGrid` together.

Not user-visible: drop of three unused imports in `knowledge-base/page.tsx` (`CardContent`, `CardTitle`, `TopicTagPill`) after the `TopicCard` simplification.

No env var, no DB schema, no changeset to other packages.