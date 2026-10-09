# Docs Starter

Documentation site starter built on Next.js 16 and Fumadocs.

## Stack

- **Framework:** Next.js 16 (App Router)
- **Docs engine:** Fumadocs (MDX content, search, OG images)
- **Search:** Orama (in-process, fully static)
- **LLM endpoints:** llms.txt + per-page markdown
- **Styling:** Tailwind CSS v4

## Getting started

```bash
deessejs init docs-starter
cd docs-starter
pnpm install
pnpm dev
```

## Highlights

- MDX authoring with Rehype + Shiki for code blocks
- Auto-generated OG images via `next/og`
- LLM-friendly routes under `/llms.txt` and `/llms/{slug}.md`
- Dark mode that respects the system preference
- Versioned docs under `content/docs/{version}/...`
