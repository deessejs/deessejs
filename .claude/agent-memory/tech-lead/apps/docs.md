---
name: docs-architecture
description: apps/docs — Fumadocs-based documentation site (separate Next.js deploy, serves /docs cross-app from web)
metadata:
  type: project
---

# apps/docs — Documentation site (Fumadocs)

**Role**: public documentation. Lives at `/docs` from `apps/web`/`apps/app` perspective, but is its own separate Next.js deploy.

- Stack: **Fumadocs** (`fumadocs-core`, `fumadocs-mdx`, `fumadocs-ui` v16) on Next.js + Tailwind v4.
- MDX content in `content/docs/`.
- Package name: `@workspace/docs`.
- Linked from `apps/web` header/footer (`NAV_LINKS`, footer) and from blog/changelog MDX — those are intentional cross-app nav, not broken links.

Related: [[web-architecture]] (source of /docs links), [[app-architecture]] (also links to /docs).