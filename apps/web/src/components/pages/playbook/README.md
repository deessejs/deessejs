# `components/pages/playbook`: page composite

Section-component namespace for the `/playbook` page. Mirrors the
shape established by `@/components/pages/about` and
`@/components/pages/pricing`: each section lives in its own file,
all sections are re-exported via the `Playbook` object in
`index.tsx`, and the route file at
`apps/web/src/app/(marketing)/playbook/page.tsx` renders each section
as `<Playbook.X />` in reading order.

When a second caller needs one of these sections, promote it to
`@workspace/ui` per `DESIGN.md` §1 ("one coherent product, not a
collection of parts"). Today the composite is page-local.

## Files

| Section | Purpose |
|---|---|
| `hero.tsx` | Two-column hero: H1, lead, and form on the left, cover mockup on the right |
| `tech-stack.tsx` | Rotating logo wall via the shared `TechStackGrid`, same as the homepage |
| `reading.tsx` | The three most recent blog posts: ForWho section chrome wrapping `PostCard` |
| `final-cta.tsx` | Closing 2-col block via the shared `FinalCtaShell`, same copy as the homepage |
| `form.tsx` | `"use client"`: RHF + Zod + orpc signup |

The `index.tsx` aggregates them under the `Playbook` namespace.

## Removed sections

The page previously carried three more sections, all following the
homepage `ForWho` grid recipe. They were deleted, not just
unrendered, along with the content that fed them:

| Removed | Fed by |
|---|---|
| `problem.tsx` | Three inline frictions: read, test, change |
| `what-you-get.tsx` | `content/toc.ts` `PLAYBOOK_TOC` |
| `who-its-for.tsx` | Three inline audience profiles |
| `content/toc.ts` | Six chapter takeaways plus `PLAYBOOK_LEAD` |

`PLAYBOOK_LEAD` was not lost with the file: it now lives in
`hero.tsx` as the local `LEAD` const, its only consumer.

To bring any of them back, recover the files from git and re-export
them in `index.tsx`. The copy is intact in history, not rewritten.