# `components/pages/playbook` — page composite

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
| `hero.tsx` | Two-column hero — H1 + lead + form on the left, cover mockup on the right |
| `problem.tsx` | Why agent-generated code ages poorly |
| `what-you-get.tsx` | Chapter takeaways in reading order |
| `who-its-for.tsx` | Concrete audience description, no personas |
| `form.tsx` | `"use client"` — RHF + Zod + orpc signup |
| `final-cta.tsx` | Closing 2-col block, mirrors the shared `FinalCtaShell` recipe, hosts the form on the right |
| `content/toc.ts` | Table-of-contents source (single-sourced into the chapter list views) |

The `index.tsx` aggregates them under the `Playbook` namespace.
